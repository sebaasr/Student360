import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewStudent, canViewPanel, visiblePanelsForTier } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";
import { computeBrightFuturesStatus } from "@/lib/bright-futures";
import {
  buildTimeline,
  buildOverallProgress,
  buildRequirementCallouts,
  buildSuggestedCourses,
} from "@/lib/student-progress";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const studentId = params.id;
  const userId = session.user.id;
  const tier = session.user.accessTier;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      degreeProgress: { include: { ispRecords: true, minors: true } },
      contracts: { orderBy: { termCode: "desc" }, include: { courses: true } },
      advisingRecords: { orderBy: { appointmentDate: "desc" }, take: 10 },
      earlyAlerts: { orderBy: { raisedAt: "desc" } },
      msprs: { orderBy: { termCode: "desc" }, take: 30 },
      evaluations: { orderBy: { termCode: "desc" }, take: 50 },
      tutoringSessions: { orderBy: { sessionDate: "desc" }, take: 20 },
      sscVisits: { orderBy: { visitDate: "desc" }, take: 20 },
      academicCoach: true,
      athleticsRecord: true,
      financialFlags: true,
      semesterGpas: { orderBy: { termCode: "asc" } },
      predictiveInsights: {
        where: { isDismissed: false, expiresAt: null },
        orderBy: [{ severity: "desc" }, { generatedAt: "desc" }],
      },
      advisor: { select: { id: true, name: true, email: true } },
    },
  });

  if (!student) return Response.json({ error: "Not found" }, { status: 404 });

  if (!canViewStudent(tier, userId, student.advisorId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const requestedPanel = new URL(req.url).searchParams.get("panel") ?? "all";
  const allowedPanels = visiblePanelsForTier(tier);

  await writeAuditLog({
    userId,
    studentId,
    action: "view_profile",
    panelName: requestedPanel,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  const brightFutures = computeBrightFuturesStatus(
    student.brightFuturesAward,
    student.brightFuturesActive,
    student.cumulativeGpa,
    student.creditsEarned,
  );

  // Build response with tier-filtered panels
  const payload: Record<string, unknown> = {
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      preferredName: student.preferredName,
      email: student.email,
      phone: student.phone,
      yearLevel: student.yearLevel,
      declaredAoc: student.declaredAoc,
      cumulativeGpa: student.cumulativeGpa,
      creditsEarned: student.creditsEarned,
      creditsAttempted: student.creditsAttempted,
      academicStanding: student.academicStanding,
      enrollmentStatus: student.enrollmentStatus,
      isFirstGeneration: student.isFirstGeneration,
      isStudentAthlete: student.isStudentAthlete,
      athleteSport: student.athleteSport,
      advisor: student.advisor,
      brightFuturesAward: student.brightFuturesAward,
      brightFuturesActive: student.brightFuturesActive,
    },
    allowedPanels,
    flags: {
      academicStanding: student.academicStanding,
      earlyAlerts: student.earlyAlerts.filter((a) => a.status === "open").length,
      financialFlags: student.financialFlags.filter((f) => f.isActive).length,
    },
  };

  if (canViewPanel(tier, "academic")) {
    payload.academic = {
      cumulativeGpa: student.cumulativeGpa,
      semesterGpas: student.semesterGpas,
      creditsEarned: student.creditsEarned,
      creditsAttempted: student.creditsAttempted,
      academicStanding: student.academicStanding,
    };
  }
  if (canViewPanel(tier, "contract")) {
    payload.contracts = student.contracts;
  }
  // Hydrate degree progress (parse coursesNeeded JSON) so downstream computations
  // can rely on real arrays.
  const hydratedDp = student.degreeProgress
    ? {
        ...student.degreeProgress,
        minors: student.degreeProgress.minors.map((m) => ({
          ...m,
          coursesNeeded: safeJsonParseArray(m.coursesNeeded),
        })),
      }
    : null;

  if (canViewPanel(tier, "graduation_tracker")) {
    payload.degreeProgress = hydratedDp;
    payload.timeline = buildTimeline(
      student.semesterGpas,
      student.evaluations,
      student.degreeProgress?.ispRecords ?? [],
      student.contracts.map((c) => ({
        termCode: c.termCode,
        totalCredits: c.totalCredits,
        courses: c.courses.map((cc) => ({
          courseCode: cc.courseCode,
          courseTitle: cc.courseTitle,
          credits: cc.credits,
        })),
      })),
      {
        yearLevel: student.yearLevel,
        creditsEarned: student.creditsEarned,
        declaredAoc: student.declaredAoc,
        aocDeclaredAt: student.aocDeclaredAt,
      },
    );
    payload.overallProgress = buildOverallProgress(
      {
        yearLevel: student.yearLevel,
        creditsEarned: student.creditsEarned,
        declaredAoc: student.declaredAoc,
        aocDeclaredAt: student.aocDeclaredAt,
      },
      hydratedDp,
      student.contracts.map((c) => ({
        termCode: c.termCode,
        totalCredits: c.totalCredits,
        courses: c.courses.map((cc) => ({
          courseCode: cc.courseCode,
          courseTitle: cc.courseTitle,
          credits: cc.credits,
        })),
      })),
    );
    payload.requirementCallouts = buildRequirementCallouts(hydratedDp);
    payload.suggestedCourses = buildSuggestedCourses(
      {
        yearLevel: student.yearLevel,
        creditsEarned: student.creditsEarned,
        declaredAoc: student.declaredAoc,
        aocDeclaredAt: student.aocDeclaredAt,
      },
      hydratedDp,
    );
  }
  if (canViewPanel(tier, "bright_futures")) {
    payload.brightFutures = brightFutures;
  }
  if (canViewPanel(tier, "advising") || canViewPanel(tier, "advising_limited")) {
    payload.advising = student.advisingRecords.map((a) => ({
      id: a.id,
      advisorName: a.advisorName,
      appointmentDate: a.appointmentDate,
      duration: a.duration,
      meetingType: a.meetingType,
      outcome: a.outcome,
      // Tier 2 (academic coach) sees no full notes
      noteText: canViewPanel(tier, "advising") ? a.noteText : null,
    }));
    payload.earlyAlerts = student.earlyAlerts;
    payload.msprs = student.msprs;
  }
  if (canViewPanel(tier, "evaluations")) {
    payload.evaluations = student.evaluations;
  }
  if (canViewPanel(tier, "tutoring")) {
    payload.tutoring = student.tutoringSessions;
  }
  if (canViewPanel(tier, "ssc")) {
    payload.sscVisits = student.sscVisits;
    payload.academicCoach = student.academicCoach;
  }
  if (canViewPanel(tier, "athletics") && student.isStudentAthlete) {
    payload.athletics = student.athleticsRecord;
  }
  if (canViewPanel(tier, "financial_flags")) {
    payload.financialFlags = student.financialFlags;
  }
  if (canViewPanel(tier, "predictive")) {
    payload.predictiveInsights = student.predictiveInsights;
  }

  return Response.json(payload);
}

function safeJsonParseArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
