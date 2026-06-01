/**
 * Nightly sync scheduler.
 *
 * Runs as a separate Node.js process (see ecosystem.config.js).
 * Triggers `python3 connectors/run_all.py` on the cron schedule from
 * SYNC_CRON_SCHEDULE (defaults to 2am daily).
 */
import { execSync } from "node:child_process";
import path from "node:path";
import cron from "node-cron";

const SYNC_SCHEDULE = process.env.SYNC_CRON_SCHEDULE ?? "0 2 * * *";
const PROJECT_ROOT = path.resolve(__dirname, "..");

function runSync(reason: string) {
  console.log(`[${new Date().toISOString()}] Starting sync (${reason})`);
  try {
    execSync("python3 run_all.py", {
      cwd: path.join(PROJECT_ROOT, "connectors"),
      stdio: "inherit",
      env: { ...process.env },
    });
    console.log("Sync complete.");
  } catch (error) {
    console.error("Sync failed:", error);
  }
}

cron.schedule(SYNC_SCHEDULE, () => runSync("scheduled"));

console.log(`Scheduler started · cron: "${SYNC_SCHEDULE}"`);
if (process.argv.includes("--now")) {
  runSync("manual --now");
}
