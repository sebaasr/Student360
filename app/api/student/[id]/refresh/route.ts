import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Only registrar (7) and above can trigger on-demand refresh
  if (session.user.accessTier < 7) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // In production: enqueue a single-student sync job. For now, log + acknowledge.
  await writeAuditLog({
    userId: session.user.id,
    studentId: params.id,
    action: "trigger_sync",
    metadata: { scope: "single_student" },
  });

  return Response.json({
    ok: true,
    message:
      "Sync queued. The nightly connector job will refresh this student on next run, or you can run `python3 connectors/run_all.py` manually.",
  });
}
