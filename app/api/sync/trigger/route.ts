import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!process.env.SYNC_SECRET || secret !== process.env.SYNC_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Scheduler is responsible for shelling out to `python3 connectors/run_all.py`.
  // This endpoint exists so external callers / cron daemons can trigger a sync over HTTP.
  return Response.json({
    ok: true,
    message: "Sync accepted. Worker scheduler will run connectors/run_all.py.",
  });
}
