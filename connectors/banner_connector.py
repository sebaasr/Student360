"""
Banner → Student 360 connector.
Connects via Ellucian Ethos API. If Ethos is unavailable, swap
fetch_students_from_ethos() for fetch_from_odbc() against the reporting DB replica.
"""
import os
import requests

from shared.db import get_conn, upsert_student
from shared.logger import SyncLogger

ETHOS_BASE = os.environ.get("ETHOS_BASE_URL", "")
ETHOS_KEY = os.environ.get("ETHOS_API_KEY", "")


def get_ethos_token() -> str:
    r = requests.post(
        f"{ETHOS_BASE}/auth",
        headers={"Authorization": f"Bearer {ETHOS_KEY}"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["token"]


def fetch_students_from_ethos(token: str) -> list[dict]:
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.hedtech.integration.v12+json",
    }
    students: list[dict] = []
    offset, limit = 0, 100
    while True:
        r = requests.get(
            f"{ETHOS_BASE}/api/students",
            headers=headers,
            params={"limit": limit, "offset": offset},
            timeout=60,
        )
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        for raw in batch:
            students.append(normalize_banner_student(raw))
        offset += limit
        if len(batch) < limit:
            break
    return students


def normalize_banner_student(raw: dict) -> dict:
    """Map Ethos payload to the Student 360 schema."""
    return {
        "id": raw.get("credentials", [{}])[0].get("value", ""),
        "firstName": raw.get("names", [{}])[0].get("firstName", ""),
        "lastName": raw.get("names", [{}])[0].get("lastName", ""),
        "preferredName": raw.get("names", [{}])[0].get("preferredName"),
        "email": next(
            (
                e["address"]
                for e in raw.get("emails", [])
                if e.get("type", {}).get("emailType") == "school"
            ),
            "",
        ),
        "enrollmentStatus": map_enrollment_status(raw.get("enrollmentStatus")),
        "yearLevel": map_year_level(raw.get("academicLevel")),
        "declaredAoc": (raw.get("programs", [None]) or [None])[0],
        "cumulativeGpa": raw.get("cumulativeGpa"),
        "creditsEarned": raw.get("creditsEarned", 0),
        "creditsAttempted": raw.get("creditsAttempted", 0),
        "academicStanding": map_standing(raw.get("academicStanding")),
        "isFirstGeneration": raw.get("firstGeneration", False),
        "isStudentAthlete": raw.get("athlete", False),
        "athleteSport": raw.get("sport"),
        "advisorId": None,
        "brightFuturesAward": raw.get("brightFuturesAward"),
        "brightFuturesActive": raw.get("brightFuturesActive", False),
    }


def map_enrollment_status(raw) -> str:
    return {"A": "full-time", "H": "part-time", "L": "loa", "W": "withdrawn"}.get(
        str(raw), "full-time"
    )


def map_year_level(raw) -> int:
    return {"FR": 1, "SO": 2, "JR": 3, "SR": 4}.get(str(raw), 1)


def map_standing(raw) -> str:
    return {"GS": "good_standing", "AW": "academic_warning", "AP": "academic_probation"}.get(
        str(raw), "good_standing"
    )


def run():
    logger = SyncLogger("banner")
    logger.start()
    try:
        if not ETHOS_KEY:
            logger.log_error("ETHOS_API_KEY not configured — skipping Banner sync")
            logger.finish("failed")
            return
        token = get_ethos_token()
        students = fetch_students_from_ethos(token)
        with get_conn() as conn:
            for student in students:
                try:
                    upsert_student(conn, student)
                    logger.records += 1
                except Exception as e:  # noqa: BLE001
                    logger.log_error(f"Student {student.get('id')}: {e}")
        logger.finish("success" if logger.errors == 0 else "partial_failure")
    except Exception as e:  # noqa: BLE001
        logger.log_error(f"Fatal: {e}")
        logger.finish("failed")
        raise


if __name__ == "__main__":
    run()
