"""
DegreeWorks → Student 360 connector.
Pulls degree audit data (credits, AOC, ISPs, minors, thesis status) and
upserts into DegreeProgress / ISPRecord / MinorProgress.

DegreeWorks responses vary by institution. Update the `parse_audit()`
function once NCF's actual audit XML/JSON shape is confirmed.
"""
import os
import uuid

import requests

from shared.db import get_conn
from shared.logger import SyncLogger

DW_URL = os.environ.get("DEGREEWORKS_API_URL", "")
DW_KEY = os.environ.get("DEGREEWORKS_API_KEY", "")


def fetch_active_student_ids(conn) -> list[str]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM \"Student\" WHERE \"enrollmentStatus\" IN ('full-time','part-time')"
        )
        return [row[0] for row in cur.fetchall()]


def fetch_audit(student_id: str) -> dict:
    r = requests.get(
        f"{DW_URL}/audits/{student_id}",
        headers={"Authorization": f"Bearer {DW_KEY}", "Accept": "application/json"},
        timeout=60,
    )
    r.raise_for_status()
    return r.json()


def parse_audit(student_id: str, audit: dict) -> dict:
    """Translate DegreeWorks audit payload → DegreeProgress + child rows."""
    return {
        "totalCreditsRequired": audit.get("totalCreditsRequired", 120),
        "totalCreditsEarned": audit.get("totalCreditsEarned", 0),
        "genEdRequired": audit.get("genEdRequired", 20),
        "genEdCompleted": audit.get("genEdCompleted", 0),
        "aocName": audit.get("aocName"),
        "aocCreditRequired": audit.get("aocCreditRequired", 40),
        "aocCreditCompleted": audit.get("aocCreditCompleted", 0),
        "aocPercentComplete": float(audit.get("aocPercentComplete", 0)),
        "ispsRequired": audit.get("ispsRequired", 3),
        "ispsCompleted": audit.get("ispsCompleted", 0),
        "thesisStatus": audit.get("thesisStatus", "not_started"),
        "thesisSponsor": audit.get("thesisSponsor"),
        "projectedGradTerm": audit.get("projectedGradTerm"),
        "projectedGradTermCode": audit.get("projectedGradTermCode"),
        "onTrackForGraduation": audit.get("onTrackForGraduation", True),
        "isps": audit.get("isps", []),
        "minors": audit.get("minors", []),
    }


def upsert_degree_progress(conn, student_id: str, parsed: dict):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "DegreeProgress" (
                id, "studentId", "totalCreditsRequired", "totalCreditsEarned",
                "genEdRequired", "genEdCompleted", "aocName", "aocCreditRequired",
                "aocCreditCompleted", "aocPercentComplete",
                "ispsRequired", "ispsCompleted", "thesisStatus", "thesisSponsor",
                "projectedGradTerm", "projectedGradTermCode", "onTrackForGraduation",
                "degreeWorksAuditAt", "syncedAt"
            )
            VALUES (
                gen_random_uuid()::text, %(studentId)s, %(totalCreditsRequired)s, %(totalCreditsEarned)s,
                %(genEdRequired)s, %(genEdCompleted)s, %(aocName)s, %(aocCreditRequired)s,
                %(aocCreditCompleted)s, %(aocPercentComplete)s,
                %(ispsRequired)s, %(ispsCompleted)s, %(thesisStatus)s, %(thesisSponsor)s,
                %(projectedGradTerm)s, %(projectedGradTermCode)s, %(onTrackForGraduation)s,
                NOW(), NOW()
            )
            ON CONFLICT ("studentId") DO UPDATE SET
                "totalCreditsRequired" = EXCLUDED."totalCreditsRequired",
                "totalCreditsEarned" = EXCLUDED."totalCreditsEarned",
                "genEdRequired" = EXCLUDED."genEdRequired",
                "genEdCompleted" = EXCLUDED."genEdCompleted",
                "aocName" = EXCLUDED."aocName",
                "aocCreditRequired" = EXCLUDED."aocCreditRequired",
                "aocCreditCompleted" = EXCLUDED."aocCreditCompleted",
                "aocPercentComplete" = EXCLUDED."aocPercentComplete",
                "ispsRequired" = EXCLUDED."ispsRequired",
                "ispsCompleted" = EXCLUDED."ispsCompleted",
                "thesisStatus" = EXCLUDED."thesisStatus",
                "thesisSponsor" = EXCLUDED."thesisSponsor",
                "projectedGradTerm" = EXCLUDED."projectedGradTerm",
                "projectedGradTermCode" = EXCLUDED."projectedGradTermCode",
                "onTrackForGraduation" = EXCLUDED."onTrackForGraduation",
                "degreeWorksAuditAt" = NOW(),
                "syncedAt" = NOW()
            """,
            {"studentId": student_id, **parsed},
        )

        cur.execute(
            'SELECT id FROM "DegreeProgress" WHERE "studentId" = %s', (student_id,)
        )
        dp_id = cur.fetchone()[0]

        cur.execute('DELETE FROM "ISPRecord" WHERE "degreeProgressId" = %s', (dp_id,))
        for isp in parsed["isps"]:
            cur.execute(
                """
                INSERT INTO "ISPRecord" (id, "degreeProgressId", title, term, "termCode", status, "supervisorName")
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    str(uuid.uuid4()),
                    dp_id,
                    isp.get("title", ""),
                    isp.get("term", ""),
                    isp.get("termCode", ""),
                    isp.get("status", "planned"),
                    isp.get("supervisorName"),
                ),
            )

        cur.execute('DELETE FROM "MinorProgress" WHERE "degreeProgressId" = %s', (dp_id,))
        for m in parsed["minors"]:
            cur.execute(
                """
                INSERT INTO "MinorProgress" (id, "degreeProgressId", "minorName", "isDeclared",
                    "coursesRequired", "coursesCompleted", "percentComplete", "coursesNeeded")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    str(uuid.uuid4()),
                    dp_id,
                    m.get("minorName", ""),
                    bool(m.get("isDeclared", False)),
                    int(m.get("coursesRequired", 0)),
                    int(m.get("coursesCompleted", 0)),
                    float(m.get("percentComplete", 0)),
                    m.get("coursesNeeded", []),
                ),
            )


def run():
    logger = SyncLogger("degreeworks")
    logger.start()
    try:
        if not DW_URL or not DW_KEY:
            logger.log_error("DEGREEWORKS_API_URL/KEY not configured — skipping")
            logger.finish("failed")
            return
        with get_conn() as conn:
            student_ids = fetch_active_student_ids(conn)
            for sid in student_ids:
                try:
                    audit = fetch_audit(sid)
                    parsed = parse_audit(sid, audit)
                    upsert_degree_progress(conn, sid, parsed)
                    logger.records += 1
                except Exception as e:  # noqa: BLE001
                    logger.log_error(f"Student {sid}: {e}")
        logger.finish("success" if logger.errors == 0 else "partial_failure")
    except Exception as e:  # noqa: BLE001
        logger.log_error(f"Fatal: {e}")
        logger.finish("failed")
        raise


if __name__ == "__main__":
    run()
