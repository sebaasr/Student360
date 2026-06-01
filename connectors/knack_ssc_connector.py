"""
Knack SSC → Student 360 connector.

Reads Student Success Center visits + academic coach assignments. Knack field
keys are placeholders — update once NCF's SSC Knack schema is confirmed.
"""
import os
import uuid
from datetime import datetime

import requests

from shared.db import get_conn
from shared.logger import SyncLogger

APP_ID = os.environ.get("KNACK_SSC_APP_ID", "")
API_KEY = os.environ.get("KNACK_SSC_API_KEY", "")
VISITS_OBJECT = os.environ.get("KNACK_SSC_OBJECT_VISITS", "object_3")

HEADERS = {
    "X-Knack-Application-Id": APP_ID,
    "X-Knack-REST-API-Key": API_KEY,
}


def fetch_visits() -> list[dict]:
    visits: list[dict] = []
    page = 1
    while True:
        params = {"page": page, "rows_per_page": 1000}
        r = requests.get(
            f"https://api.knack.com/v1/objects/{VISITS_OBJECT}/records",
            headers=HEADERS,
            params=params,
            timeout=60,
        )
        r.raise_for_status()
        data = r.json()
        visits.extend(data.get("records", []))
        if page >= data.get("total_pages", 1):
            break
        page += 1
    return visits


def normalize_visit(raw: dict) -> dict:
    return {
        "studentId": raw.get("field_student_id"),
        "visitDate": parse_date(raw.get("field_visit_date")),
        "visitType": raw.get("field_visit_type", "drop_in"),
        "serviceType": raw.get("field_service_type", "other"),
        "staffName": raw.get("field_staff_name"),
        "notes": raw.get("field_notes"),
        "term": raw.get("field_term", ""),
        "termCode": raw.get("field_term_code", ""),
        "knackId": raw.get("id"),
    }


def parse_date(value):
    if not value:
        return None
    if isinstance(value, dict):
        value = value.get("iso_timestamp") or value.get("date")
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception:  # noqa: BLE001
        return None


def upsert_visit(conn, v: dict):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "SSCVisit" (
                id, "studentId", "visitDate", "visitType", "serviceType", "staffName",
                notes, term, "termCode", "knackId", "syncedAt"
            )
            VALUES (%s, %(studentId)s, %(visitDate)s, %(visitType)s, %(serviceType)s,
                    %(staffName)s, %(notes)s, %(term)s, %(termCode)s, %(knackId)s, NOW())
            ON CONFLICT ("knackId") DO UPDATE SET
                "visitDate" = EXCLUDED."visitDate",
                "serviceType" = EXCLUDED."serviceType",
                notes = EXCLUDED.notes,
                "syncedAt" = NOW()
            """,
            {"_id": str(uuid.uuid4()), **v},
        )


def run():
    logger = SyncLogger("knack_ssc")
    logger.start()
    try:
        if not APP_ID:
            logger.log_error("KNACK_SSC_APP_ID not configured — skipping")
            logger.finish("failed")
            return
        with get_conn() as conn:
            for raw in fetch_visits():
                try:
                    v = normalize_visit(raw)
                    if v["studentId"] and v["visitDate"]:
                        upsert_visit(conn, v)
                        logger.records += 1
                except Exception as e:  # noqa: BLE001
                    logger.log_error(f"Visit {raw.get('id')}: {e}")
        logger.finish("success" if logger.errors == 0 else "partial_failure")
    except Exception as e:  # noqa: BLE001
        logger.log_error(f"Fatal: {e}")
        logger.finish("failed")
        raise


if __name__ == "__main__":
    run()
