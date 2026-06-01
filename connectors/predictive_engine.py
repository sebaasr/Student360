"""
Predictive Intelligence Engine — runs after nightly data sync.

Generates / refreshes PredictiveInsight rows for all active students. Rule-based
insights are deterministic; one optional Claude call detects cross-disciplinary
thematic patterns. The frontend reads from the database — no AI call happens at
page load time.
"""
import json
import os
import uuid

try:
    from anthropic import Anthropic
except ImportError:  # connector can still run in pure rule-based mode
    Anthropic = None  # type: ignore

from shared.db import get_conn
from shared.logger import SyncLogger

ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY")
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5")
CURRENT_TERM_CODE = os.environ.get("CURRENT_TERM_CODE", "202601")

client = Anthropic(api_key=ANTHROPIC_KEY) if (Anthropic and ANTHROPIC_KEY) else None


def run():
    logger = SyncLogger("predictive")
    logger.start()
    try:
        with get_conn() as conn:
            students = get_active_students(conn)
            for student in students:
                try:
                    insights = compute_insights(conn, student)
                    save_insights(conn, student["id"], insights)
                    logger.records += 1
                except Exception as e:  # noqa: BLE001
                    logger.log_error(f"Student {student['id']}: {e}")
        logger.finish("success" if logger.errors == 0 else "partial_failure")
    except Exception as e:  # noqa: BLE001
        logger.log_error(f"Fatal: {e}")
        logger.finish("failed")
        raise


def get_active_students(conn) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT s.id, s."cumulativeGpa", s."yearLevel", s."creditsEarned",
                   s."academicStanding", s."brightFuturesAward", s."brightFuturesActive",
                   dp."ispsCompleted", dp."ispsRequired", dp."thesisStatus",
                   dp."projectedGradTerm", dp."totalCreditsEarned",
                   (SELECT COUNT(*) FROM "TutoringSession" ts
                    WHERE ts."studentId" = s.id AND ts."termCode" = %s) AS tutoring_sessions,
                   (SELECT COUNT(*) FROM "SSCVisit" sv
                    WHERE sv."studentId" = s.id AND sv."termCode" = %s) AS ssc_visits,
                   (SELECT COUNT(*) FROM "AdvisingRecord" ar
                    WHERE ar."studentId" = s.id AND ar."termCode" = %s) AS advising_meetings
            FROM "Student" s
            LEFT JOIN "DegreeProgress" dp ON dp."studentId" = s.id
            WHERE s."enrollmentStatus" IN ('full-time', 'part-time')
            """,
            (CURRENT_TERM_CODE, CURRENT_TERM_CODE, CURRENT_TERM_CODE),
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def compute_insights(conn, student: dict) -> list[dict]:
    insights: list[dict] = []

    # 1. ISP pacing risk
    semesters_remaining = max(1, (4 - (student["yearLevel"] or 1)) * 2)
    isps_required = student.get("ispsRequired") or 3
    isps_completed = student.get("ispsCompleted") or 0
    isps_remaining = isps_required - isps_completed
    if isps_remaining > 0 and isps_remaining > semesters_remaining:
        insights.append(
            {
                "insightType": "risk",
                "insightCode": "isp_pacing",
                "title": f"{isps_remaining} ISPs remaining in {semesters_remaining} semesters",
                "body": (
                    f"At the current pace, this student needs more than one ISP per remaining "
                    f"semester to graduate on time. {isps_completed} of {isps_required} ISPs completed."
                ),
                "subtext": f"Semesters remaining: ~{semesters_remaining} · ISPs needed: {isps_remaining}",
                "ctaText": "→ Discuss ISP planning in next meeting",
                "severity": "warning",
            }
        )

    # 2. Thesis timeline (seniors only)
    if student["yearLevel"] == 4 and (student["thesisStatus"] in ("not_started", None)):
        insights.append(
            {
                "insightType": "risk",
                "insightCode": "thesis_timeline",
                "title": "Senior without a thesis sponsor identified",
                "body": (
                    "This student is a senior and has not yet identified a thesis sponsor. "
                    "This should be addressed before the end of the semester."
                ),
                "subtext": "Thesis status: Not started",
                "ctaText": "→ Discuss thesis sponsor identification",
                "severity": "urgent",
            }
        )

    # 3. GPA trend
    gpa_trend = get_gpa_trend(conn, student["id"])
    if len(gpa_trend) >= 2:
        recent, prev = gpa_trend[-1], gpa_trend[-2]
        if recent < prev and recent < 2.3:
            insights.append(
                {
                    "insightType": "risk",
                    "insightCode": "gpa_trend",
                    "title": "GPA declining and approaching warning threshold",
                    "body": (
                        f"GPA has declined from {prev:.2f} to {recent:.2f}. Two consecutive "
                        f"semesters of decline approaching the 2.0 probation threshold."
                    ),
                    "subtext": f"Current: {recent:.2f} · Previous: {prev:.2f} · Threshold: 2.0",
                    "ctaText": "→ Review course load and support access",
                    "severity": "warning",
                }
            )

    # 4. Bright Futures at risk
    if student["brightFuturesActive"] and student["cumulativeGpa"] is not None:
        bf_thresholds = {
            "academic_scholar": 3.0,
            "medallion_scholar": 2.75,
            "gold_scholar": 2.0,
        }
        threshold = bf_thresholds.get(student["brightFuturesAward"] or "", 3.0)
        gpa = student["cumulativeGpa"]
        award_label = (student["brightFuturesAward"] or "").replace("_", " ").title()
        if gpa < threshold:
            insights.append(
                {
                    "insightType": "risk",
                    "insightCode": "bright_futures_risk",
                    "title": "Bright Futures scholarship at risk",
                    "body": (
                        f"Current GPA ({gpa:.2f}) is below the {award_label} maintenance threshold "
                        f"of {threshold:.2f}. Scholarship may be suspended."
                    ),
                    "subtext": f"Current GPA: {gpa:.2f} · Required: {threshold:.2f}",
                    "ctaText": "→ Contact Financial Aid · Review course load",
                    "severity": "urgent",
                }
            )
        elif gpa < threshold + 0.2:
            insights.append(
                {
                    "insightType": "risk",
                    "insightCode": "bright_futures_risk",
                    "title": "Bright Futures scholarship in danger zone",
                    "body": (
                        f"GPA ({gpa:.2f}) is within 0.20 points of the {award_label} maintenance "
                        f"threshold ({threshold:.2f})."
                    ),
                    "subtext": f"Buffer: only +{gpa - threshold:.2f} above threshold",
                    "ctaText": "→ Monitor closely · Discuss course strategy",
                    "severity": "warning",
                }
            )

    # 5. Support gap
    if (
        student["academicStanding"] == "academic_probation"
        and int(student["tutoring_sessions"] or 0) == 0
        and int(student["ssc_visits"] or 0) == 0
    ):
        insights.append(
            {
                "insightType": "support_gap",
                "insightCode": "support_gap",
                "title": "On probation — not accessing tutoring or SSC",
                "body": (
                    "This student is on academic probation but has not accessed tutoring or "
                    "Student Success Center services this semester."
                ),
                "subtext": "Tutoring sessions: 0 · SSC visits: 0",
                "ctaText": "→ Refer to tutoring and SSC · Set up academic coach meeting",
                "severity": "urgent",
            }
        )

    # 6. Minor proximity
    insights.extend(get_minor_proximity_insights(conn, student["id"]))

    # 7. AI thematic pattern
    thematic = get_thematic_pattern(conn, student["id"])
    if thematic:
        insights.append(thematic)

    return insights


def get_gpa_trend(conn, student_id: str) -> list[float]:
    with conn.cursor() as cur:
        cur.execute(
            'SELECT gpa FROM "SemesterGpa" WHERE "studentId" = %s ORDER BY "termCode" ASC',
            (student_id,),
        )
        return [row[0] for row in cur.fetchall()]


def get_minor_proximity_insights(conn, student_id: str) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT mp."minorName", mp."isDeclared", mp."coursesCompleted",
                   mp."coursesRequired", mp."percentComplete"
            FROM "MinorProgress" mp
            JOIN "DegreeProgress" dp ON dp.id = mp."degreeProgressId"
            WHERE dp."studentId" = %s AND mp."percentComplete" >= 0.6
            """,
            (student_id,),
        )
        rows = cur.fetchall()

    insights: list[dict] = []
    for minor_name, is_declared, completed, required, pct in rows:
        remaining = required - completed
        label = "undeclared" if not is_declared else "declared"
        insights.append(
            {
                "insightType": "opportunity",
                "insightCode": "minor_proximity",
                "title": (
                    f"{remaining} course{'s' if remaining != 1 else ''} from "
                    f"completing {minor_name} Minor"
                ),
                "body": (
                    f"This student has completed {completed} of {required} courses for the "
                    f"{minor_name} minor ({int(pct * 100)}%). The minor is currently {label}."
                ),
                "subtext": f"Completed: {completed}/{required} courses · Status: {label.capitalize()}",
                "ctaText": (
                    "→ Suggest declaring the minor"
                    if not is_declared
                    else "→ Confirm remaining courses"
                ),
                "severity": "info",
            }
        )
    return insights


def get_thematic_pattern(conn, student_id: str) -> dict | None:
    if not client:
        return None
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT cc."courseTitle", cc."courseCode"
            FROM "ContractCourse" cc
            JOIN "Contract" c ON c.id = cc."contractId"
            WHERE c."studentId" = %s
            ORDER BY c."termCode" DESC
            LIMIT 20
            """,
            (student_id,),
        )
        courses = [{"title": r[0], "code": r[1]} for r in cur.fetchall()]

        cur.execute(
            """
            SELECT "courseTitle", LEFT("evaluationText", 300)
            FROM "Evaluation"
            WHERE "studentId" = %s AND status = 'satisfactory'
            ORDER BY "termCode" DESC
            LIMIT 5
            """,
            (student_id,),
        )
        eval_snippets = [{"course": r[0], "snippet": r[1]} for r in cur.fetchall()]

    if len(courses) < 5:
        return None

    prompt = (
        "You are an academic advisor assistant at New College of Florida, a liberal arts "
        "honors college.\nAnalyze this student's course history and identify any meaningful "
        "cross-disciplinary thematic patterns or intellectual interests that emerge from "
        "their choices.\n\n"
        f"Courses taken (most recent first):\n{json.dumps(courses, indent=2)}\n\n"
        f"Recent evaluation excerpts:\n{json.dumps(eval_snippets, indent=2)}\n\n"
        "Instructions:\n"
        "- Identify 2-5 thematic clusters (e.g. 'systems thinking', 'environmental ethics')\n"
        "- Only respond if there is a genuinely meaningful pattern — return null if scattered\n"
        "- If a pattern exists, write a brief 1-2 sentence observation an advisor could use\n"
        "- Format your response as JSON with keys: has_pattern (bool), themes (string[]),\n"
        "  observation (string), cta (string)\n"
        "- Do not invent patterns. Be honest if none exists.\n"
        "- Respond with raw JSON only — no markdown fences."
    )

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        result = json.loads(response.content[0].text)
        if not result.get("has_pattern"):
            return None
        return {
            "insightType": "pattern",
            "insightCode": "thematic_pattern",
            "title": "Cross-disciplinary thematic pattern detected",
            "body": result["observation"],
            "subtext": "Themes: " + ", ".join(result.get("themes", [])),
            "ctaText": result.get("cta", "→ Discuss in next advising meeting"),
            "severity": "info",
        }
    except Exception:  # noqa: BLE001
        return None


def save_insights(conn, student_id: str, insights: list[dict]):
    """Expire old insights and insert fresh ones."""
    with conn.cursor() as cur:
        cur.execute(
            'UPDATE "PredictiveInsight" SET "expiresAt" = NOW() '
            'WHERE "studentId" = %s AND "expiresAt" IS NULL',
            (student_id,),
        )
        for ins in insights:
            cur.execute(
                """
                INSERT INTO "PredictiveInsight" (
                    id, "studentId", "insightType", "insightCode", title, body, subtext,
                    "ctaText", severity, "generatedAt"
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """,
                (
                    str(uuid.uuid4()),
                    student_id,
                    ins["insightType"],
                    ins["insightCode"],
                    ins["title"],
                    ins["body"],
                    ins.get("subtext"),
                    ins.get("ctaText"),
                    ins["severity"],
                ),
            )


if __name__ == "__main__":
    run()
