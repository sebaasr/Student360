"""Shared PostgreSQL connection helper for all Student 360 connectors."""
import os
from contextlib import contextmanager

import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL", "")


@contextmanager
def get_conn():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def upsert_student(conn, student: dict):
    """Upsert a student record. `student` must have an `id` key."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "Student" (
                id, "firstName", "lastName", "preferredName", email,
                "enrollmentStatus", "yearLevel", "declaredAoc", "cumulativeGpa",
                "creditsEarned", "creditsAttempted", "academicStanding",
                "isFirstGeneration", "isStudentAthlete", "athleteSport",
                "advisorId", "brightFuturesAward", "brightFuturesActive",
                "bannerSyncedAt", "updatedAt"
            )
            VALUES (
                %(id)s, %(firstName)s, %(lastName)s, %(preferredName)s, %(email)s,
                %(enrollmentStatus)s, %(yearLevel)s, %(declaredAoc)s, %(cumulativeGpa)s,
                %(creditsEarned)s, %(creditsAttempted)s, %(academicStanding)s,
                %(isFirstGeneration)s, %(isStudentAthlete)s, %(athleteSport)s,
                %(advisorId)s, %(brightFuturesAward)s, %(brightFuturesActive)s,
                NOW(), NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                "firstName" = EXCLUDED."firstName",
                "lastName" = EXCLUDED."lastName",
                "preferredName" = EXCLUDED."preferredName",
                email = EXCLUDED.email,
                "enrollmentStatus" = EXCLUDED."enrollmentStatus",
                "yearLevel" = EXCLUDED."yearLevel",
                "declaredAoc" = EXCLUDED."declaredAoc",
                "cumulativeGpa" = EXCLUDED."cumulativeGpa",
                "creditsEarned" = EXCLUDED."creditsEarned",
                "creditsAttempted" = EXCLUDED."creditsAttempted",
                "academicStanding" = EXCLUDED."academicStanding",
                "isFirstGeneration" = EXCLUDED."isFirstGeneration",
                "isStudentAthlete" = EXCLUDED."isStudentAthlete",
                "athleteSport" = EXCLUDED."athleteSport",
                "advisorId" = EXCLUDED."advisorId",
                "brightFuturesAward" = EXCLUDED."brightFuturesAward",
                "brightFuturesActive" = EXCLUDED."brightFuturesActive",
                "bannerSyncedAt" = NOW(),
                "updatedAt" = NOW()
            """,
            student,
        )
