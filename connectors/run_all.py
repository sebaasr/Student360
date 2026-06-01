"""Orchestrator: runs every Student 360 connector in sequence.

Each connector logs its own SyncRun row and handles its own errors. A partial
failure (one connector down) does not stop the rest of the pipeline.
"""
import sys

import banner_connector
import degreeworks_connector
import evaluations_connector
import knack_ssc_connector
import knack_tutoring_connector
import navigate_connector
from predictive_engine import run as run_predictive

CONNECTORS = [
    ("banner", banner_connector.run),
    ("degreeworks", degreeworks_connector.run),
    ("navigate", navigate_connector.run),
    ("knack_tutoring", knack_tutoring_connector.run),
    ("knack_ssc", knack_ssc_connector.run),
    ("evaluations", evaluations_connector.run),
    ("predictive", run_predictive),  # always last — runs against fresh data
]


def main():
    print("Starting Student 360 sync…")
    failed: list[str] = []
    for name, fn in CONNECTORS:
        print(f"  Running {name}…", flush=True)
        try:
            fn()
            print(f"    ✓ {name} complete")
        except Exception as e:  # noqa: BLE001
            print(f"    ✗ {name} FAILED: {e}")
            failed.append(name)
    print("Sync complete.")
    if failed:
        print(f"  ⚠ Failed connectors: {', '.join(failed)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
