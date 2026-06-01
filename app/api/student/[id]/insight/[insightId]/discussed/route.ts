import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewStudent } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; insightId: string } },
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    select: { advisorId: true },
  });
  if (!student) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canViewStudent(session.user.accessTier, session.user.id, student.advisorId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.predictiveInsight.update({
    where: { id: params.insightId },
    data: { isDiscussed: true, discussedAt: new Date() },
  });

  await writeAuditLog({
    userId: session.user.id,
    studentId: params.id,
    action: "discuss_insight",
    metadata: { insightId: params.insightId },
  });

  return Response.json({ ok: true });
}
