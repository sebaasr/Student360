import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Student 360 dev database…");

  // ── ADVISORS / USERS ──────────────────────────────────────────────
  const advisor = await prisma.user.upsert({
    where: { email: "mlopezzafra@ncf.edu" },
    update: {},
    create: {
      email: "mlopezzafra@ncf.edu",
      name: "Manuel Lopez",
      ncfUsername: "mlopezzafra",
      accessTier: 8, // Provost office — sees all
    },
  });

  const facultyAdvisor = await prisma.user.upsert({
    where: { email: "faculty@ncf.edu" },
    update: {},
    create: {
      email: "faculty@ncf.edu",
      name: "Dr. Faculty Advisor",
      accessTier: 1, // Faculty advisor — advisees only
    },
  });

  const itAdmin = await prisma.user.upsert({
    where: { email: "itadmin@ncf.edu" },
    update: {},
    create: { email: "itadmin@ncf.edu", name: "IT Admin", accessTier: 9 },
  });

  // ── STUDENT 1: Theo Nakamura — Senior, Good Standing, all on track ───
  await seedStudent({
    id: "N2022-0034",
    firstName: "Theo",
    lastName: "Nakamura",
    preferredName: null,
    email: "theo.nakamura@ncf.edu",
    yearLevel: 4,
    declaredAoc: "Natural Sciences (Biology)",
    cumulativeGpa: 3.85,
    creditsEarned: 102,
    creditsAttempted: 102,
    academicStanding: "good_standing",
    advisorId: facultyAdvisor.id,
    brightFuturesAward: "academic_scholar",
    brightFuturesActive: true,
    degreeProgress: {
      aocName: "Biology",
      aocCreditRequired: 40,
      aocCreditCompleted: 36,
      aocPercentComplete: 0.9,
      genEdRequired: 20,
      genEdCompleted: 20,
      ispsRequired: 3,
      ispsCompleted: 2,
      thesisStatus: "in_progress",
      thesisSponsor: "Dr. Helena Park",
      projectedGradTerm: "Spring 2026",
      projectedGradTermCode: "202601",
      onTrackForGraduation: true,
      isps: [
        { title: "Marine Microbiome Sampling", term: "Fall 2024", termCode: "202409", status: "completed", supervisor: "Dr. Park" },
        { title: "Cell Signaling Lab Project", term: "Spring 2025", termCode: "202501", status: "completed", supervisor: "Dr. Iversen" },
      ],
      minors: [
        { minorName: "Statistics", isDeclared: true, coursesRequired: 6, coursesCompleted: 5, percentComplete: 0.83, coursesNeeded: ["STAT 350"] },
      ],
    },
    semesterGpas: [
      { term: "Fall 2023", termCode: "202309", gpa: 3.7, credits: 15, standing: "good_standing" },
      { term: "Spring 2024", termCode: "202401", gpa: 3.9, credits: 15, standing: "good_standing" },
      { term: "Fall 2024", termCode: "202409", gpa: 3.85, credits: 15, standing: "good_standing" },
    ],
    contract: {
      term: "Spring 2026",
      termCode: "202601",
      status: "signed",
      signedByStudent: true,
      signedByAdvisor: true,
      signedAt: new Date("2025-12-08"),
      totalCredits: 15,
      courses: [
        { courseCode: "BIO 412", courseTitle: "Cell Signaling", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "STAT 350", courseTitle: "Bayesian Methods", credits: 3, instructorName: "Dr. Chen" },
        { courseCode: "THESIS", courseTitle: "Senior Thesis", credits: 8, instructorName: "Dr. Park" },
      ],
    },
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-04-22"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Discussed thesis defense scheduling; on track." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-02-15"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Reviewed minor completion plan." },
    ],
    insights: [
      {
        insightType: "opportunity",
        insightCode: "minor_proximity",
        title: "1 course from completing Statistics Minor",
        body: "Theo has completed 5 of 6 required courses for the Statistics minor (83%). STAT 350 is on the Spring 26 contract.",
        subtext: "Completed: 5/6 courses · Status: Declared",
        ctaText: "→ Confirm remaining course",
        severity: "info",
      },
    ],
  });

  // ── STUDENT 2: Ava Thornton — Junior, minor proximity (undeclared) ───
  await seedStudent({
    id: "N2023-0055",
    firstName: "Ava",
    lastName: "Thornton",
    preferredName: null,
    email: "ava.thornton@ncf.edu",
    yearLevel: 3,
    declaredAoc: "Humanities (Literature)",
    cumulativeGpa: 3.72,
    creditsEarned: 78,
    creditsAttempted: 78,
    academicStanding: "good_standing",
    advisorId: facultyAdvisor.id,
    brightFuturesAward: "academic_scholar",
    brightFuturesActive: true,
    degreeProgress: {
      aocName: "Literature",
      aocCreditRequired: 36,
      aocCreditCompleted: 22,
      aocPercentComplete: 0.61,
      genEdRequired: 20,
      genEdCompleted: 18,
      ispsRequired: 3,
      ispsCompleted: 1,
      thesisStatus: "not_started",
      thesisSponsor: null,
      isps: [
        { title: "Translation Workshop", term: "Spring 2025", termCode: "202501", status: "completed", supervisor: "Dr. Almeida" },
      ],
      minors: [
        { minorName: "Philosophy", isDeclared: false, coursesRequired: 6, coursesCompleted: 4, percentComplete: 0.67, coursesNeeded: ["PHIL 305", "PHIL 410"] },
      ],
    },
    semesterGpas: [
      { term: "Fall 2024", termCode: "202409", gpa: 3.7, credits: 15, standing: "good_standing" },
      { term: "Spring 2025", termCode: "202501", gpa: 3.75, credits: 15, standing: "good_standing" },
    ],
    contract: {
      term: "Spring 2026",
      termCode: "202601",
      status: "signed",
      signedByStudent: true,
      signedByAdvisor: true,
      signedAt: new Date("2025-12-05"),
      totalCredits: 15,
      courses: [
        { courseCode: "LIT 305", courseTitle: "20th C. Latin American Lit", credits: 4 },
        { courseCode: "PHIL 305", courseTitle: "Philosophy of Language", credits: 3 },
      ],
    },
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-03-18"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Discussed possible minor declaration in Philosophy." },
    ],
    insights: [
      {
        insightType: "opportunity",
        insightCode: "minor_proximity",
        title: "2 courses from completing Philosophy Minor",
        body: "Ava has completed 4 of 6 required courses for the Philosophy minor (67%). The minor is currently undeclared.",
        subtext: "Completed: 4/6 courses · Status: Undeclared",
        ctaText: "→ Suggest declaring the minor",
        severity: "info",
      },
    ],
  });

  // ── STUDENT 3: Maya Chen — Senior, thesis without sponsor ───
  await seedStudent({
    id: "N2023-0012",
    firstName: "Maya",
    lastName: "Chen",
    preferredName: null,
    email: "maya.chen@ncf.edu",
    yearLevel: 4,
    declaredAoc: "Social Sciences (Psychology)",
    cumulativeGpa: 3.05,
    creditsEarned: 96,
    creditsAttempted: 102,
    academicStanding: "good_standing",
    advisorId: facultyAdvisor.id,
    brightFuturesAward: "academic_scholar",
    brightFuturesActive: true,
    degreeProgress: {
      aocName: "Psychology",
      aocCreditRequired: 40,
      aocCreditCompleted: 30,
      aocPercentComplete: 0.75,
      genEdRequired: 20,
      genEdCompleted: 18,
      ispsRequired: 3,
      ispsCompleted: 2,
      thesisStatus: "not_started",
      thesisSponsor: null,
      isps: [
        { title: "Adolescent Identity Study", term: "Fall 2024", termCode: "202409", status: "completed", supervisor: "Dr. Reyes" },
        { title: "Bias in Survey Design", term: "Spring 2025", termCode: "202501", status: "completed", supervisor: "Dr. Reyes" },
      ],
      minors: [],
    },
    semesterGpas: [
      { term: "Fall 2023", termCode: "202309", gpa: 3.4, credits: 15, standing: "good_standing" },
      { term: "Spring 2024", termCode: "202401", gpa: 3.1, credits: 15, standing: "good_standing" },
      { term: "Fall 2024", termCode: "202409", gpa: 2.9, credits: 12, standing: "good_standing" },
    ],
    contract: {
      term: "Spring 2026",
      termCode: "202601",
      status: "pending_advisor",
      signedByStudent: true,
      signedByAdvisor: false,
      totalCredits: 13,
      courses: [
        { courseCode: "PSYC 410", courseTitle: "Clinical Practicum", credits: 5 },
        { courseCode: "THESIS", courseTitle: "Senior Thesis (sponsor TBD)", credits: 8 },
      ],
    },
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-04-02"), duration: 45, meetingType: "in_person", outcome: "met", noteText: "Maya still searching for thesis sponsor. Two outreach attempts. Urgent." },
    ],
    insights: [
      {
        insightType: "risk",
        insightCode: "thesis_timeline",
        title: "Senior without a thesis sponsor identified",
        body: "Maya is a senior and has not yet identified a thesis sponsor. This should be addressed immediately.",
        subtext: "Thesis status: Not started",
        ctaText: "→ Connect Maya with Dr. Reyes or Dr. Almeida",
        severity: "urgent",
      },
      {
        insightType: "risk",
        insightCode: "gpa_trend",
        title: "GPA declining over the last 3 semesters",
        body: "GPA has trended 3.4 → 3.1 → 2.9. Monitor course load and check in on stressors.",
        subtext: "Current: 2.90 · Threshold: 2.0",
        ctaText: "→ Discuss course load and support access",
        severity: "warning",
      },
    ],
  });

  // ── STUDENT 4: Dylan Osei — Junior, has not met advisor ───
  await seedStudent({
    id: "N2023-0101",
    firstName: "Dylan",
    lastName: "Osei",
    preferredName: null,
    email: "dylan.osei@ncf.edu",
    yearLevel: 3,
    declaredAoc: "Natural Sciences (Mathematics)",
    cumulativeGpa: 3.4,
    creditsEarned: 72,
    creditsAttempted: 72,
    academicStanding: "good_standing",
    advisorId: facultyAdvisor.id,
    brightFuturesAward: null,
    brightFuturesActive: false,
    degreeProgress: {
      aocName: "Mathematics",
      aocCreditRequired: 40,
      aocCreditCompleted: 24,
      aocPercentComplete: 0.6,
      genEdRequired: 20,
      genEdCompleted: 16,
      ispsRequired: 3,
      ispsCompleted: 1,
      thesisStatus: "not_started",
      isps: [
        { title: "Graph Theory ISP", term: "Spring 2025", termCode: "202501", status: "completed", supervisor: "Dr. Becker" },
      ],
      minors: [],
    },
    semesterGpas: [
      { term: "Fall 2024", termCode: "202409", gpa: 3.5, credits: 15, standing: "good_standing" },
      { term: "Spring 2025", termCode: "202501", gpa: 3.3, credits: 15, standing: "good_standing" },
    ],
    contract: {
      term: "Spring 2026",
      termCode: "202601",
      status: "signed",
      signedByStudent: true,
      signedByAdvisor: true,
      signedAt: new Date("2025-12-01"),
      totalCredits: 15,
      courses: [{ courseCode: "MATH 320", courseTitle: "Real Analysis", credits: 4 }],
    },
    advising: [], // Has NOT met this term → priority HIGH
    insights: [],
  });

  // ── STUDENT 5: Jordan Reyes — Sophomore, probation + medical leave ───
  await seedStudent({
    id: "N2024-0087",
    firstName: "Jordan",
    lastName: "Reyes",
    preferredName: null,
    email: "jordan.reyes@ncf.edu",
    yearLevel: 2,
    declaredAoc: null,
    cumulativeGpa: 1.9,
    creditsEarned: 22,
    creditsAttempted: 30,
    academicStanding: "academic_probation",
    advisorId: facultyAdvisor.id,
    brightFuturesAward: "academic_scholar",
    brightFuturesActive: true,
    degreeProgress: {
      aocName: null,
      aocCreditRequired: 40,
      aocCreditCompleted: 0,
      aocPercentComplete: 0,
      genEdRequired: 20,
      genEdCompleted: 12,
      ispsRequired: 3,
      ispsCompleted: 0,
      thesisStatus: "not_started",
      isps: [],
      minors: [],
    },
    semesterGpas: [
      { term: "Fall 2024", termCode: "202409", gpa: 2.1, credits: 12, standing: "academic_warning" },
      { term: "Spring 2025", termCode: "202501", gpa: 1.7, credits: 10, standing: "academic_probation" },
    ],
    contract: {
      term: "Spring 2026",
      termCode: "202601",
      status: "not_started",
      signedByStudent: false,
      signedByAdvisor: false,
      totalCredits: 0,
      courses: [],
    },
    advising: [],
    earlyAlerts: [
      { alertType: "academic_concern", raisedBy: "Dr. Henderson", raisedAt: new Date("2025-11-12"), status: "open", notes: "Missing assignments + low quiz scores in PSYC 101." },
    ],
    flags: [
      { flagType: "tuition_hold", isActive: true, addedAt: new Date("2025-10-01") },
    ],
    insights: [
      {
        insightType: "risk",
        insightCode: "bright_futures_risk",
        title: "Bright Futures scholarship at risk",
        body: "Current GPA (1.90) is below the Florida Academic Scholar maintenance threshold of 3.00. Scholarship may be suspended.",
        subtext: "Current GPA: 1.90 · Required: 3.00",
        ctaText: "→ Contact Financial Aid · Review course load",
        severity: "urgent",
      },
      {
        insightType: "support_gap",
        insightCode: "support_gap",
        title: "On probation — not accessing tutoring or SSC",
        body: "Jordan is on academic probation but has not accessed tutoring or the Student Success Center this semester.",
        subtext: "Tutoring sessions: 0 · SSC visits: 0",
        ctaText: "→ Refer to tutoring and SSC · Assign academic coach",
        severity: "urgent",
      },
    ],
  });

  // ── STUDENT 6: Sofia Martínez — First-Year, contract in progress ───
  await seedStudent({
    id: "N2025-0008",
    firstName: "Sofia",
    lastName: "Martínez",
    preferredName: "Sofi",
    email: "sofia.martinez@ncf.edu",
    yearLevel: 1,
    declaredAoc: null,
    cumulativeGpa: 3.6,
    creditsEarned: 14,
    creditsAttempted: 14,
    academicStanding: "good_standing",
    advisorId: facultyAdvisor.id,
    brightFuturesAward: "medallion_scholar",
    brightFuturesActive: true,
    degreeProgress: {
      aocName: null,
      aocCreditRequired: 40,
      aocCreditCompleted: 0,
      aocPercentComplete: 0,
      genEdRequired: 20,
      genEdCompleted: 6,
      ispsRequired: 3,
      ispsCompleted: 0,
      thesisStatus: "not_started",
      isps: [],
      minors: [],
    },
    semesterGpas: [
      { term: "Fall 2025", termCode: "202509", gpa: 3.6, credits: 14, standing: "good_standing" },
    ],
    contract: {
      term: "Spring 2026",
      termCode: "202601",
      status: "in_progress",
      signedByStudent: false,
      signedByAdvisor: false,
      totalCredits: 12,
      courses: [
        { courseCode: "WRIT 100", courseTitle: "First-Year Writing", credits: 3 },
        { courseCode: "SOC 110", courseTitle: "Introduction to Sociology", credits: 3 },
      ],
    },
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-02-12"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "First-semester check-in. Doing well." },
    ],
    insights: [],
  });

  console.log("✓ Seed complete.");
  console.log(`  Advisor: ${advisor.email} (tier ${advisor.accessTier})`);
  console.log(`  Faculty: ${facultyAdvisor.email} (tier ${facultyAdvisor.accessTier})`);
  console.log(`  IT:      ${itAdmin.email} (tier ${itAdmin.accessTier})`);
}

// ──────────────────────────────────────────────────────────────────────
// helpers

interface SeedISP {
  title: string;
  term: string;
  termCode: string;
  status: string;
  supervisor?: string;
}
interface SeedMinor {
  minorName: string;
  isDeclared: boolean;
  coursesRequired: number;
  coursesCompleted: number;
  percentComplete: number;
  coursesNeeded: string[];
}
interface SeedDegreeProgress {
  aocName?: string | null;
  aocCreditRequired: number;
  aocCreditCompleted: number;
  aocPercentComplete: number;
  genEdRequired: number;
  genEdCompleted: number;
  ispsRequired: number;
  ispsCompleted: number;
  thesisStatus: string;
  thesisSponsor?: string | null;
  projectedGradTerm?: string;
  projectedGradTermCode?: string;
  onTrackForGraduation?: boolean;
  isps: SeedISP[];
  minors: SeedMinor[];
}
interface SeedSemesterGpa {
  term: string;
  termCode: string;
  gpa: number;
  credits: number;
  standing: string;
}
interface SeedContract {
  term: string;
  termCode: string;
  status: string;
  signedByStudent: boolean;
  signedByAdvisor: boolean;
  signedAt?: Date;
  totalCredits: number;
  courses: { courseCode: string; courseTitle: string; credits: number; instructorName?: string }[];
}
interface SeedAdvisingRecord {
  advisorName: string;
  date: Date;
  duration: number;
  meetingType: string;
  outcome: string;
  noteText?: string;
}
interface SeedEarlyAlert {
  alertType: string;
  raisedBy: string;
  raisedAt: Date;
  status: string;
  notes?: string;
}
interface SeedFlag {
  flagType: string;
  isActive: boolean;
  addedAt: Date;
}
interface SeedInsight {
  insightType: string;
  insightCode: string;
  title: string;
  body: string;
  subtext?: string;
  ctaText?: string;
  severity: string;
}

interface SeedStudent {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  email: string;
  yearLevel: number;
  declaredAoc: string | null;
  cumulativeGpa: number | null;
  creditsEarned: number;
  creditsAttempted: number;
  academicStanding: string;
  advisorId: string | null;
  brightFuturesAward: string | null;
  brightFuturesActive: boolean;
  degreeProgress: SeedDegreeProgress;
  semesterGpas: SeedSemesterGpa[];
  contract: SeedContract;
  advising: SeedAdvisingRecord[];
  earlyAlerts?: SeedEarlyAlert[];
  flags?: SeedFlag[];
  insights: SeedInsight[];
}

async function seedStudent(s: SeedStudent) {
  await prisma.student.upsert({
    where: { id: s.id },
    update: {},
    create: {
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      preferredName: s.preferredName,
      email: s.email,
      enrollmentStatus: "full-time",
      yearLevel: s.yearLevel,
      declaredAoc: s.declaredAoc,
      cumulativeGpa: s.cumulativeGpa,
      creditsEarned: s.creditsEarned,
      creditsAttempted: s.creditsAttempted,
      academicStanding: s.academicStanding,
      advisorId: s.advisorId,
      brightFuturesAward: s.brightFuturesAward,
      brightFuturesActive: s.brightFuturesActive,
      bannerSyncedAt: new Date(),
    },
  });

  // Wipe and re-seed child rows to keep idempotent.
  await prisma.semesterGpa.deleteMany({ where: { studentId: s.id } });
  await prisma.semesterGpa.createMany({
    data: s.semesterGpas.map((g) => ({ ...g, studentId: s.id })),
  });

  // Degree progress
  await prisma.degreeProgress.upsert({
    where: { studentId: s.id },
    update: {
      aocName: s.degreeProgress.aocName ?? null,
      aocCreditRequired: s.degreeProgress.aocCreditRequired,
      aocCreditCompleted: s.degreeProgress.aocCreditCompleted,
      aocPercentComplete: s.degreeProgress.aocPercentComplete,
      genEdRequired: s.degreeProgress.genEdRequired,
      genEdCompleted: s.degreeProgress.genEdCompleted,
      ispsRequired: s.degreeProgress.ispsRequired,
      ispsCompleted: s.degreeProgress.ispsCompleted,
      thesisStatus: s.degreeProgress.thesisStatus,
      thesisSponsor: s.degreeProgress.thesisSponsor ?? null,
      projectedGradTerm: s.degreeProgress.projectedGradTerm ?? null,
      projectedGradTermCode: s.degreeProgress.projectedGradTermCode ?? null,
      onTrackForGraduation: s.degreeProgress.onTrackForGraduation ?? true,
      totalCreditsRequired: 120,
      totalCreditsEarned: s.creditsEarned,
      syncedAt: new Date(),
    },
    create: {
      studentId: s.id,
      aocName: s.degreeProgress.aocName ?? null,
      aocCreditRequired: s.degreeProgress.aocCreditRequired,
      aocCreditCompleted: s.degreeProgress.aocCreditCompleted,
      aocPercentComplete: s.degreeProgress.aocPercentComplete,
      genEdRequired: s.degreeProgress.genEdRequired,
      genEdCompleted: s.degreeProgress.genEdCompleted,
      ispsRequired: s.degreeProgress.ispsRequired,
      ispsCompleted: s.degreeProgress.ispsCompleted,
      thesisStatus: s.degreeProgress.thesisStatus,
      thesisSponsor: s.degreeProgress.thesisSponsor ?? null,
      projectedGradTerm: s.degreeProgress.projectedGradTerm ?? null,
      projectedGradTermCode: s.degreeProgress.projectedGradTermCode ?? null,
      onTrackForGraduation: s.degreeProgress.onTrackForGraduation ?? true,
      totalCreditsRequired: 120,
      totalCreditsEarned: s.creditsEarned,
      syncedAt: new Date(),
    },
  });

  const dp = await prisma.degreeProgress.findUnique({ where: { studentId: s.id } });
  if (dp) {
    await prisma.iSPRecord.deleteMany({ where: { degreeProgressId: dp.id } });
    await prisma.iSPRecord.createMany({
      data: s.degreeProgress.isps.map((isp) => ({
        degreeProgressId: dp.id,
        title: isp.title,
        term: isp.term,
        termCode: isp.termCode,
        status: isp.status,
        supervisorName: isp.supervisor ?? null,
      })),
    });

    await prisma.minorProgress.deleteMany({ where: { degreeProgressId: dp.id } });
    await prisma.minorProgress.createMany({
      data: s.degreeProgress.minors.map((m) => ({
        degreeProgressId: dp.id,
        minorName: m.minorName,
        isDeclared: m.isDeclared,
        coursesRequired: m.coursesRequired,
        coursesCompleted: m.coursesCompleted,
        percentComplete: m.percentComplete,
        coursesNeeded: JSON.stringify(m.coursesNeeded),
      })),
    });
  }

  // Contract + courses
  await prisma.contract.upsert({
    where: { studentId_termCode: { studentId: s.id, termCode: s.contract.termCode } },
    update: {
      status: s.contract.status,
      signedByStudent: s.contract.signedByStudent,
      signedByAdvisor: s.contract.signedByAdvisor,
      signedAt: s.contract.signedAt ?? null,
      totalCredits: s.contract.totalCredits,
      syncedAt: new Date(),
    },
    create: {
      studentId: s.id,
      term: s.contract.term,
      termCode: s.contract.termCode,
      status: s.contract.status,
      signedByStudent: s.contract.signedByStudent,
      signedByAdvisor: s.contract.signedByAdvisor,
      signedAt: s.contract.signedAt ?? null,
      totalCredits: s.contract.totalCredits,
      syncedAt: new Date(),
    },
  });
  const contract = await prisma.contract.findUnique({
    where: { studentId_termCode: { studentId: s.id, termCode: s.contract.termCode } },
  });
  if (contract) {
    await prisma.contractCourse.deleteMany({ where: { contractId: contract.id } });
    if (s.contract.courses.length > 0) {
      await prisma.contractCourse.createMany({
        data: s.contract.courses.map((c) => ({
          contractId: contract.id,
          courseCode: c.courseCode,
          courseTitle: c.courseTitle,
          credits: c.credits,
          instructorName: c.instructorName ?? null,
        })),
      });
    }
  }

  // Advising records
  await prisma.advisingRecord.deleteMany({ where: { studentId: s.id } });
  if (s.advising.length > 0) {
    await prisma.advisingRecord.createMany({
      data: s.advising.map((a) => ({
        studentId: s.id,
        advisorId: s.advisorId,
        advisorName: a.advisorName,
        appointmentDate: a.date,
        duration: a.duration,
        meetingType: a.meetingType,
        outcome: a.outcome,
        noteText: a.noteText ?? null,
        termCode: "202601",
        syncedAt: new Date(),
      })),
    });
  }

  // Early alerts
  await prisma.earlyAlert.deleteMany({ where: { studentId: s.id } });
  if (s.earlyAlerts?.length) {
    await prisma.earlyAlert.createMany({
      data: s.earlyAlerts.map((a) => ({
        studentId: s.id,
        alertType: a.alertType,
        raisedBy: a.raisedBy,
        raisedAt: a.raisedAt,
        status: a.status,
        notes: a.notes ?? null,
        syncedAt: new Date(),
      })),
    });
  }

  // Financial flags
  await prisma.financialFlag.deleteMany({ where: { studentId: s.id } });
  if (s.flags?.length) {
    await prisma.financialFlag.createMany({
      data: s.flags.map((f) => ({
        studentId: s.id,
        flagType: f.flagType,
        isActive: f.isActive,
        addedAt: f.addedAt,
        syncedAt: new Date(),
      })),
    });
  }

  // Insights — expire old, insert new
  await prisma.predictiveInsight.deleteMany({ where: { studentId: s.id } });
  if (s.insights.length > 0) {
    await prisma.predictiveInsight.createMany({
      data: s.insights.map((i) => ({
        studentId: s.id,
        insightType: i.insightType,
        insightCode: i.insightCode,
        title: i.title,
        body: i.body,
        subtext: i.subtext ?? null,
        ctaText: i.ctaText ?? null,
        severity: i.severity,
      })),
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
