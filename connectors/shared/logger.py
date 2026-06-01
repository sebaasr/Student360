"""Sync run logger — records every connector invocation to SyncRun."""
import os
from datetime import datetime, timezone

import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL", "")


class SyncLogger:
    def __init__(self, connector: str, triggered_by: str = "scheduler"):
        self.connector = connector
        self.triggered_by = triggered_by
        self.run_id = None
        self.records = 0
        self.errors = 0
        self.error_log: list[str] = []

    def start(self):
        if not DATABASE_URL:
            print(f"[SyncLogger] DATABASE_URL not set — skipping persistence for {self.connector}")
            return
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO "SyncRun" (id, connector, status, "startedAt", "triggeredBy")
                VALUES (gen_random_uuid()::text, %s, 'running', NOW(), %s)
                RETURNING id
                """,
                (self.connector, self.triggered_by),
            )
            self.run_id = cur.fetchone()[0]
        conn.commit()
        conn.close()

    def finish(self, status: str = "success"):
        if not DATABASE_URL or not self.run_id:
            return
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE "SyncRun" SET status=%s, "completedAt"=NOW(),
                    "recordsProcessed"=%s, "errorCount"=%s, "errorLog"=%s
                WHERE id=%s
                """,
                (
                    status,
                    self.records,
                    self.errors,
                    "\n".join(self.error_log) if self.error_log else None,
                    self.run_id,
                ),
            )
        conn.commit()
        conn.close()

    def log_error(self, msg: str):
        self.errors += 1
        ts = datetime.now(timezone.utc).isoformat()
        self.error_log.append(f"[{ts}] {msg}")
        print(f"ERROR [{self.connector}]: {msg}")
