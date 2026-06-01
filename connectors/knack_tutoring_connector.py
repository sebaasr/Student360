"""
Knack Tutoring → Student 360 connector.

Authentication: X-Knack-Application-Id + X-Knack-REST-API-Key headers.
Reads from one Knack object (sessions). NCF's actual field keys (field_X)
must be discovered from the Knack schema and substituted in `normalize_session`.
"""
import os
import uuid
from datetime import datetime

import requests

from shared.db import get_conn
from shared.logger import SyncLogger

APP_ID = os.environ.get("KNACK_TUTORING_APP_ID", "")
API_KEY = os.environ.get("KNACK_TUTORING_API_KEY", "")
SESSIONS_OBJECT = os.environ.get("KNACK_TUTORING_OBJECT_SESSIONS", "object_1")

HEADERS = {
    "X-Knack-Application-Id": APP_ID,
    "X-Knack-REST-API-Key": API_KEY,
}


def fetch_sessions(updated_since: str | None = None) -> list[dict]:
    sessions: list[dict] = []
    page = 1
    while True:
        params = {"page": page, "rows_per_page": 1000}
        if updated_since:
            params["filters"] = (
                f'[{{"field":"{SESSIONS_OBJECT}_updated","operator":"is after","value":"{updated_since}"}}]'
            )
        r = requests.get(
            f"https://api.knack.com/v1/objects/{SESSIONS_OBJECT}/records",
            headers=HEADERS,
            params=params,
            timeout=60,
        )
        r.raise_for_status()
        data = r.json()
        sessions.extend(data.get("records", []))
        if page >= data.get("total_pages", 1):
            break
        page += 1
    return sessions


def normalize_session(raw: dict) -> dict:
    """Map a Knack record → TutoringSession.

    Knack returns opaque field keys (`field_1`, etc.). Replace the
    placeholders below once you've inspected the Knack object schema.
    """
    return {
        "studentId": raw.get("field_student_id"),
        "sessionDate": parse_knack_date(raw.get("field_date")),
        "durationMins": int(raw.get("field_duration") or 0),
        "subject": raw.get("field_subject", ""),
        "courseCode": raw.get("field_course_code"),
        "tutorName": raw.get("field_tutor_name"),
        "sessionType": "in_person",
        "wasNoShow": bool(raw.get("field_no_show", False)),
        "term": raw.get("field_term", ""),
        "termCode": raw.get("field_term_code", ""),
        "knackId": raw.get("id"),
    }


def parse_knack_date(value):
    if not value:
        return None
    if isinstance(value, dict):
        value = value.get("iso_timestamp") or value.get("date")
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception:  # noqa: BLE001
        return None


def upsert_session(conn, session: dict):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "TutoringSession" (
                id, "studentId", "sessionDate", "durationMins", subject, "courseCode",
                "tutorName", "sessionType", "wasNoShow", term, "termCode", "knackId", "syncedAt"
            )
            VALUES (
                %s, %(studentId)s, %(sessionDate)s, %(durationMins)s,
                %(subject)s, %(courseCode)s, %(tutorName)s, %(sessionType)s, %(wasNoShow)s,
                %(term)s, %(termCode)s, %(knackId)s, NOW()
            )
            ON CONFLICT ("knackId") DO UPDATE SET
                "sessionDate" = EXCLUDED."sessionDate",
                "durationMins" = EXCLUDED."durationMins",
                subject = EXCLUDED.subject,
                "wasNoShow" = EXCLUDED."wasNoShow",
                "syncedAt" = NOW()
            """,
            {"_id": str(uuid.uuid4()), **session},
        )


def run():
    logger = SyncLogger("knack_tutoring")
    logger.start()
    try:
        if not APP_ID:
            logger.log_error("KNACK_TUTORING_APP_ID not configured — skipping")
            logger.finish("failed")
            return
        sessions = fetch_sessions()
        with get_conn() as conn:
            for raw in sessions:
                try:
                    session = normalize_session(raw)
                    if session["studentId"] and session["sessionDate"]:
                        upsert_session(conn, session)
                        logger.records += 1
                except Exception as e:  # noqa: BLE001
                    logger.log_error(f"Session {raw.get('id')}: {e}")
        logger.finish("success" if logger.errors == 0 else "partial_failure")
    except Exception as e:  # noqa: BLE001
        logger.log_error(f"Fatal: {e}")
        logger.finish("failed")
        raise


if __name__ == "__main__":
    run()
