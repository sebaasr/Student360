"""
NCF Evaluations → Student 360 connector.

Two transport modes: direct read-only PostgreSQL connection (preferred) or
internal REST API. Configure via EVALUATIONS_DB_URL or EVALUATIONS_API_URL.

To pull from the NCF Narrative Evaluations app (Supabase), point this connector
at its export view:
    EVALUATIONS_DB_URL=postgresql://student360_reader:***@db.<project>.supabase.co:5432/postgres
    EVALUATIONS_SOURCE=student360_evaluations_export
The view (integrations/student360_export.sql in that repo) already maps
student_id to the N-Number and exposes only public narratives — never the
private evaluation.
"""
import os
import re
import uuid

import psycopg2
import requests

from shared.db import get_conn
from shared.logger import SyncLogger

EVAL_DB_URL = os.environ.get("EVALUATIONS_DB_URL", "")
EVAL_API_URL = os.environ.get("EVALUATIONS_API_URL", "")
EVAL_API_KEY = os.environ.get("EVALUATIONS_API_KEY", "")

# Source relation (table or view) to read from. Defaults to "evaluations" for a
# generic source; set to "student360_evaluations_export" for the Supabase app.
EVAL_SOURCE = os.environ.get("EVALUATIONS_SOURCE", "evaluations")
# Trusted internal config, but validate it is a plain (optionally schema-qualified)
# identifier before interpolating into the FROM clause.
if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?", EVAL_SOURCE):
    raise ValueError(f"Invalid EVALUATIONS_SOURCE: {EVAL_SOURCE!r}")


def fetch_via_db() -> list[dict]:
    conn = psycopg2.connect(EVAL_DB_URL)
    out: list[dict] = []
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT id, student_id, instructor_name, course_code, course_title,
                       term, term_code, evaluation_text, status, submitted_at
                FROM {EVAL_SOURCE}
                """
            )
            cols = [d[0] for d in cur.description]
            out = [dict(zip(cols, row)) for row in cur.fetchall()]
    finally:
        conn.close()
    return out


def fetch_via_api() -> list[dict]:
    # Works with a custom API ({"data": [...]}) or Supabase PostgREST (bare array
    # at /rest/v1/<source>, requiring an apikey header).
    base = EVAL_API_URL.rstrip("/")
    url = f"{base}/{EVAL_SOURCE}" if base.endswith("/rest/v1") else f"{base}/evaluations"
    r = requests.get(
        url,
        headers={
            "Authorization": f"Bearer {EVAL_API_KEY}",
            "apikey": EVAL_API_KEY,
        },
        timeout=60,
    )
    r.raise_for_status()
    body = r.json()
    return body if isinstance(body, list) else body.get("data", [])


def upsert_evaluation(conn, e: dict):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "Evaluation" (id, "studentId", "instructorName", "courseCode",
                "courseTitle", term, "termCode", "evaluationText", status,
                "submittedAt", "sourceId", "syncedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT ("sourceId") DO UPDATE SET
                "evaluationText" = EXCLUDED."evaluationText",
                status = EXCLUDED.status,
                "submittedAt" = EXCLUDED."submittedAt",
                "syncedAt" = NOW()
            """,
            (
                str(uuid.uuid4()),
                e.get("student_id") or e.get("studentId"),
                e.get("instructor_name") or e.get("instructorName"),
                e.get("course_code") or e.get("courseCode"),
                e.get("course_title") or e.get("courseTitle"),
                e.get("term"),
                e.get("term_code") or e.get("termCode"),
                e.get("evaluation_text") or e.get("evaluationText"),
                e.get("status"),
                e.get("submitted_at") or e.get("submittedAt"),
                str(e.get("id")),
            ),
        )


def run():
    logger = SyncLogger("evaluations")
    logger.start()
    try:
        if EVAL_DB_URL:
            evals = fetch_via_db()
        elif EVAL_API_URL:
            evals = fetch_via_api()
        else:
            logger.log_error("Neither EVALUATIONS_DB_URL nor EVALUATIONS_API_URL set — skipping")
            logger.finish("failed")
            return

        with get_conn() as conn:
            for e in evals:
                try:
                    upsert_evaluation(conn, e)
                    logger.records += 1
                except Exception as exc:  # noqa: BLE001
                    logger.log_error(f"Evaluation {e.get('id')}: {exc}")
        logger.finish("success" if logger.errors == 0 else "partial_failure")
    except Exception as exc:  # noqa: BLE001
        logger.log_error(f"Fatal: {exc}")
        logger.finish("failed")
        raise


if __name__ == "__main__":
    run()
