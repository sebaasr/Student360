"""
NCF Evaluations → Student 360 connector.

Two transport modes: direct read-only PostgreSQL connection (preferred) or
internal REST API. Configure via EVALUATIONS_DB_URL or EVALUATIONS_API_URL.
"""
import os
import uuid

import psycopg2
import requests

from shared.db import get_conn
from shared.logger import SyncLogger

EVAL_DB_URL = os.environ.get("EVALUATIONS_DB_URL", "")
EVAL_API_URL = os.environ.get("EVALUATIONS_API_URL", "")
EVAL_API_KEY = os.environ.get("EVALUATIONS_API_KEY", "")


def fetch_via_db() -> list[dict]:
    conn = psycopg2.connect(EVAL_DB_URL)
    out: list[dict] = []
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, student_id, instructor_name, course_code, course_title,
                       term, term_code, evaluation_text, status, submitted_at
                FROM evaluations
                """
            )
            cols = [d[0] for d in cur.description]
            out = [dict(zip(cols, row)) for row in cur.fetchall()]
    finally:
        conn.close()
    return out


def fetch_via_api() -> list[dict]:
    r = requests.get(
        f"{EVAL_API_URL}/evaluations",
        headers={"Authorization": f"Bearer {EVAL_API_KEY}"},
        timeout=60,
    )
    r.raise_for_status()
    return r.json().get("data", [])


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
