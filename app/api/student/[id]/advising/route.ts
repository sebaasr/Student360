import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewStudent } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

const CURRENT_TERM_CODE = "202601";

// POST — log a new advising meeting note for a student.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const studentId = params.id;
  const { id: userId, accessTier, name } = session.user;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { advisorId: true },
  });
  if (!student) return Response.json({ error: "Not found" }, { status: 404 });

  if (!canViewStudent(accessTier, userId, student.advisorId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    meetingType?: string;
    outcome?: string;
    duration?: number;
    noteText?: string;
    appointmentDate?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const record = await prisma.advisingRecord.create({
    data: {
      studentId,
      advisorId: userId,
      advisorName: name ?? "Advisor",
      appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : new Date(),
      duration: body.duration ?? 30,
      meetingType: body.meetingType ?? "in_person",
      outcome: body.outcome ?? "met",
      noteText: body.noteText?.trim() || null,
      noteType: "advisor_logged",
      termCode: CURRENT_TERM_CODE,
      syncedAt: new Date(),
    },
  });

  await writeAuditLog({
    userId,
    studentId,
    action: "log_meeting_note",
    panelName: "advising",
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return Response.json({ ok: true, record });
}
