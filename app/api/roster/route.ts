import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIER_SEES_ALL } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";
import { computeBrightFuturesStatus } from "@/lib/bright-futures";
import type { RosterResponse, RosterStudent, Priority } from "@/types/student";

const CURRENT_TERM_CODE = "202601"; // TODO: derive from server-side term clock

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const tier = session.user.accessTier;

  // Tier 9 (IT admin) sees no student data
  if (tier === 9) {
    return Response.json({
      stats: {
        total: 0,
        contractsSigned: 0,
        contractsPending: 0,
        metThisTerm: 0,
        notMetThisTerm: 0,
        openFlags: 0,
      },
      students: [],
    } satisfies RosterResponse);
  }

  // ?scope=all forces the all-students view (still gated by TIER_SEES_ALL below).
  // Default is "advisees" — the user's own caseload.
  const scope = new URL(req.url).searchParams.get("scope") ?? "advisees";

  if (scope === "all" && !TIER_SEES_ALL[tier]) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let where: Prisma.StudentWhereInput;
  if (scope === "all") {
    where = {}; // gate above already enforced TIER_SEES_ALL
  } else if (TIER_SEES_ALL[tier]) {
    where = {}; // staff who see all use the same default view as "advisees"
  } else if (tier === 1) {
    where = { advisorId: userId };
  } else {
    where = { id: "__none__" }; // tiers 2-4 scoping not yet implemented
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      contracts: { where: { termCode: CURRENT_TERM_CODE } },
      advisingRecords: {
        where: { termCode: CURRENT_TERM_CODE },
        orderBy: { appointmentDate: "desc" },
        take: 1,
      },
      earlyAlerts: { where: { status: "open" } },
      financialFlags: { where: { isActive: true } },
    },
    orderBy: [{ academicStanding: "asc" }, { lastName: "asc" }],
  });

  const rosterStudents: RosterStudent[] = students.map((s) => {
    const contract = s.contracts[0] ?? null;
    const lastAdvising = s.advisingRecords[0] ?? null;
    const flagTypes: string[] = [
      ...(s.academicStanding === "academic_probation" ? ["academic_probation"] : []),
      ...(s.academicStanding === "academic_warning" ? ["academic_warning"] : []),
      ...s.earlyAlerts.map(() => "early_alert_open"),
      ...s.financialFlags.map((f) => `financial_${f.flagType}`),
    ];

    const bf = computeBrightFuturesStatus(
      s.brightFuturesAward,
      s.brightFuturesActive,
      s.cumulativeGpa,
      s.creditsEarned,
    );

    const rs: RosterStudent = {
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      preferredName: s.preferredName,
      email: s.email,
      yearLevel: s.yearLevel,
      aoc: s.declaredAoc,
      academicStanding: s.academicStanding,
      isTransfer: s.isTransfer,
      isStudentAthlete: s.isStudentAthlete,
      athleteSport: s.athleteSport,
      currentTermContract: contract
        ? {
            status: contract.status,
            signedByStudent: contract.signedByStudent,
            signedByAdvisor: contract.signedByAdvisor,
          }
        : null,
      lastAdvisingDate: lastAdvising ? lastAdvising.appointmentDate.toISOString() : null,
      openFlagsCount: s.earlyAlerts.length + s.financialFlags.length,
      flagTypes,
      brightFuturesStatus: bf.color === "none" ? null : bf.color,
      priority: "low", // placeholder, computed below
    };
    rs.priority = computePriority(rs);
    return rs;
  });

  // Sort: high → medium → low, then by last name
  const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  rosterStudents.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  const stats = {
    total: rosterStudents.length,
    contractsSigned: rosterStudents.filter((s) => s.currentTermContract?.status === "signed")
      .length,
    contractsPending: rosterStudents.filter((s) =>
      ["pending_advisor", "in_progress", "not_started"].includes(
        s.currentTermContract?.status ?? "",
      ),
    ).length,
    metThisTerm: rosterStudents.filter((s) => s.lastAdvisingDate !== null).length,
    notMetThisTerm: rosterStudents.filter((s) => s.lastAdvisingDate === null).length,
    openFlags: rosterStudents.reduce((acc, s) => acc + s.openFlagsCount, 0),
  };

  await writeAuditLog({
    userId,
    action: "view_roster",
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return Response.json({ stats, students: rosterStudents } satisfies RosterResponse);
}

function computePriority(s: RosterStudent): Priority {
  if (
    s.academicStanding === "academic_probation" ||
    s.currentTermContract?.status === "not_started" ||
    s.lastAdvisingDate === null ||
    s.flagTypes.includes("early_alert_open") ||
    s.brightFuturesStatus === "red"
  )
    return "high";

  if (
    s.currentTermContract?.status === "pending_advisor" ||
    s.academicStanding === "academic_warning" ||
    s.brightFuturesStatus === "yellow"
  )
    return "medium";

  return "low";
}
