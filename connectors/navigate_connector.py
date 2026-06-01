"""
Navigate 360 (EAB) → Student 360 connector.
Writes AdvisingRecord + EarlyAlert rows.
"""
import os
import uuid

import requests
from dateutil import parser as dateparser

from shared.db import get_conn
from shared.logger import SyncLogger

NAVIGATE_URL = os.environ.get("NAVIGATE_API_URL", "")
NAVIGATE_KEY = os.environ.get("NAVIGATE_API_KEY", "")
INSTITUTION = os.environ.get("NAVIGATE_INSTITUTION_ID", "")


def headers() -> dict:
    return {
        "Authorization": f"Bearer {NAVIGATE_KEY}",
        "X-Institution-Id": INSTITUTION,
        "Accept": "application/json",
    }


def fetch_appointments(updated_since: str | None = None) -> list[dict]:
    params = {"limit": 500, "offset": 0}
    if updated_since:
        params["updatedSince"] = updated_since
    out: list[dict] = []
    while True:
        r = requests.get(f"{NAVIGATE_URL}/appointments", headers=headers(), params=params, timeout=60)
        r.raise_for_status()
        batch = r.json().get("data", [])
        if not batch:
            break
        out.extend(batch)
        if len(batch) < params["limit"]:
            break
        params["offset"] += params["limit"]
    return out


def fetch_alerts() -> list[dict]:
    r = requests.get(f"{NAVIGATE_URL}/alerts", headers=headers(), timeout=60)
    r.raise_for_status()
    return r.json().get("data", [])


def upsert_appointment(conn, raw: dict):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "AdvisingRecord" (
                id, "studentId", "advisorId", "advisorName", "appointmentDate",
                duration, "meetingType", outcome, "noteText", "noteType", "termCode",
                "navigateId", "syncedAt"
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT ("navigateId") DO UPDATE SET
                "noteText" = EXCLUDED."noteText",
                outcome = EXCLUDED.outcome,
                duration = EXCLUDED.duration,
                "syncedAt" = NOW()
            """,
            (
                str(uuid.uuid4()),
                raw.get("studentId"),
                raw.get("advisorId"),
                raw.get("advisorName", "Unknown"),
                dateparser.isoparse(raw["appointmentDate"]),
                raw.get("durationMins"),
                raw.get("meetingType", "in_person"),
                raw.get("outcome", "met"),
                raw.get("noteText"),
                raw.get("noteType"),
                raw.get("termCode"),
                raw.get("id"),
            ),
        )


def upsert_alert(conn, raw: dict):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "EarlyAlert" (id, "studentId", "alertType", "raisedBy", "raisedAt",
                status, notes, "navigateId", "syncedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT ("navigateId") DO UPDATE SET
                status = EXCLUDED.status,
                notes = EXCLUDED.notes,
                "syncedAt" = NOW()
            """,
            (
                str(uuid.uuid4()),
                raw.get("studentId"),
                raw.get("alertType"),
                raw.get("raisedBy", "Unknown"),
                dateparser.isoparse(raw["raisedAt"]),
                raw.get("status", "open"),
                raw.get("notes"),
                raw.get("id"),
            ),
        )


def run():
    logger = SyncLogger("navigate")
    logger.start()
    try:
        if not NAVIGATE_KEY:
            logger.log_error("NAVIGATE_API_KEY not configured — skipping")
            logger.finish("failed")
            return
        with get_conn() as conn:
            for appt in fetch_appointments():
                try:
                    upsert_appointment(conn, appt)
                    logger.records += 1
                except Exception as e:  # noqa: BLE001
                    logger.log_error(f"Appointment {appt.get('id')}: {e}")
            for alert in fetch_alerts():
                try:
                    upsert_alert(conn, alert)
                    logger.records += 1
                except Exception as e:  # noqa: BLE001
                    logger.log_error(f"Alert {alert.get('id')}: {e}")
        logger.finish("success" if logger.errors == 0 else "partial_failure")
    except Exception as e:  # noqa: BLE001
        logger.log_error(f"Fatal: {e}")
        logger.finish("failed")
        raise


if __name__ == "__main__":
    run()
