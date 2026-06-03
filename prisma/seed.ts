import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Student 360 dev database…");

  // ── USERS ─────────────────────────────────────────────────────────────
  const advisor = await prisma.user.upsert({
    where: { email: "mlopezzafra@ncf.edu" },
    update: {},
    create: {
      email: "mlopezzafra@ncf.edu",
      name: "Manuel Lopez",
      ncfUsername: "mlopezzafra",
      accessTier: 8,
    },
  });

  const facultyAdvisor = await prisma.user.upsert({
    where: { email: "faculty@ncf.edu" },
    update: {},
    create: { email: "faculty@ncf.edu", name: "Dr. Faculty Advisor", accessTier: 1 },
  });

  await prisma.user.upsert({
    where: { email: "itadmin@ncf.edu" },
    update: {},
    create: { email: "itadmin@ncf.edu", name: "IT Admin", accessTier: 9 },
  });

  // ── STUDENT 1: Theo Nakamura — Senior, all on track ───────────────────
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
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-04-22"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Discussed thesis defense scheduling; on track. Confirmed minor completion with STAT 350 this semester." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-02-15"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Reviewed minor completion plan. Thesis draft chapter 1 submitted to Dr. Park." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2025-09-10"), duration: 45, meetingType: "in_person", outcome: "met", noteText: "Fall check-in. ISP approved with Dr. Park. Strong semester ahead." },
    ],
    evaluations: [
      {
        instructorName: "Dr. Helena Park",
        courseCode: "BIO 310",
        courseTitle: "Molecular Biology",
        term: "Fall 2023",
        termCode: "202309",
        text: "Theo demonstrated exceptional aptitude in molecular biology this semester. His ability to synthesize complex mechanisms — particularly in enzyme kinetics — surpassed expectations for a third-year student. Lab reports were consistently thorough and analytically sound. Theo should consider pursuing thesis work in this area.",
        status: "satisfactory",
        submittedAt: new Date("2024-01-15"),
      },
      {
        instructorName: "Dr. Chen",
        courseCode: "STAT 305",
        courseTitle: "Statistical Inference",
        term: "Spring 2024",
        termCode: "202401",
        text: "Theo engaged deeply with the material throughout the semester. His final project — applying Bayesian inference to ecological data — showed genuine intellectual initiative and strong computational skills. He is well-prepared for advanced statistical coursework and for quantitative methods in his thesis.",
        status: "satisfactory",
        submittedAt: new Date("2024-05-20"),
      },
      {
        instructorName: "Dr. Iversen",
        courseCode: "BIO 398",
        courseTitle: "Cell Biology Seminar",
        term: "Fall 2024",
        termCode: "202409",
        text: "Theo's contributions to seminar discussions this semester were consistently insightful and well-prepared. He demonstrated the ability to connect primary literature to broader questions in cell biology with sophistication. His ISP proposal was among the most well-conceived I have reviewed. An excellent candidate for honors distinction.",
        status: "satisfactory",
        submittedAt: new Date("2025-01-12"),
      },
    ],
    tutoring: [
      { date: new Date("2026-02-03"), durationMins: 60, subject: "Statistics", courseCode: "STAT 350", tutorName: "Maria S.", sessionType: "in_person", termCode: "202601" },
      { date: new Date("2026-02-17"), durationMins: 60, subject: "Statistics", courseCode: "STAT 350", tutorName: "Maria S.", sessionType: "in_person", termCode: "202601" },
      { date: new Date("2026-03-10"), durationMins: 45, subject: "Statistics", courseCode: "STAT 350", tutorName: "Maria S.", sessionType: "virtual", termCode: "202601" },
    ],
    sscVisits: [
      { date: new Date("2026-01-28"), visitType: "scheduled", serviceType: "Writing Support", staffName: "Dr. Patel", notes: "Thesis chapter 1 draft review.", termCode: "202601" },
      { date: new Date("2026-03-05"), visitType: "drop_in", serviceType: "Writing Support", staffName: "Dr. Patel", notes: "Citations and formatting guidance.", termCode: "202601" },
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

  // ── STUDENT 2: Ava Thornton — Junior, minor proximity ─────────────────
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
        { courseCode: "LIT 305", courseTitle: "20th C. Latin American Lit", credits: 4, instructorName: "Dr. Almeida" },
        { courseCode: "PHIL 305", courseTitle: "Philosophy of Language", credits: 3, instructorName: "Dr. Reyes" },
        { courseCode: "LIT 280", courseTitle: "Postcolonial Narratives", credits: 4, instructorName: "Dr. Kim" },
      ],
    },
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-03-18"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Discussed possible minor declaration in Philosophy. Ava is 2 courses away and should declare before next semester registration." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2025-09-15"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Fall planning meeting. Identified strong thematic thread across coursework — bioethics and philosophy of mind emerging." },
    ],
    evaluations: [
      {
        instructorName: "Dr. Kim",
        courseCode: "LIT 210",
        courseTitle: "Contemporary Fiction",
        term: "Fall 2024",
        termCode: "202409",
        text: "Ava's work this semester reflected a mature literary sensibility and a genuine engagement with form and narrative. Her essays demonstrated careful close reading and a willingness to take interpretive risks. I was particularly impressed by her final paper on magical realism as political strategy — it was the strongest piece of work in the seminar.",
        status: "satisfactory",
        submittedAt: new Date("2025-01-10"),
      },
      {
        instructorName: "Dr. Almeida",
        courseCode: "LIT 290",
        courseTitle: "Translation and Meaning",
        term: "Spring 2025",
        termCode: "202501",
        text: "Ava brought both rigor and creativity to the translation workshop. Her ISP — a comparative study of three translations of Borges — demonstrated impressive command of Spanish and a nuanced understanding of how translation shapes literary meaning. She is developing a distinctive scholarly voice that will serve her well in thesis work.",
        status: "satisfactory",
        submittedAt: new Date("2025-05-18"),
      },
    ],
    tutoring: [
      { date: new Date("2026-02-10"), durationMins: 60, subject: "Philosophy", courseCode: "PHIL 305", tutorName: "James R.", sessionType: "in_person", termCode: "202601" },
      { date: new Date("2026-03-03"), durationMins: 60, subject: "Philosophy", courseCode: "PHIL 305", tutorName: "James R.", sessionType: "in_person", termCode: "202601" },
    ],
    sscVisits: [
      { date: new Date("2026-02-20"), visitType: "scheduled", serviceType: "Academic Skills", staffName: "Coach Rivera", notes: "Discussed time management for spring workload.", termCode: "202601" },
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
      {
        insightType: "thematic_pattern",
        insightCode: "thematic_cluster",
        title: "Emerging cross-disciplinary pattern: language, meaning, and mind",
        body: "Ava's coursework spans Literature, Philosophy of Language, and Translation Studies. Six courses across 3 disciplines show overlapping themes: consciousness, meaning-making, and representation — a possible emerging interest in philosophy of mind or cognitive linguistics.",
        subtext: "Detected from: LIT 210, LIT 290, PHIL 201, PHIL 305, and ISP",
        ctaText: "→ Worth exploring in next advising meeting",
        severity: "info",
      },
    ],
  });

  // ── STUDENT 3: Maya Chen — Senior, thesis without sponsor ─────────────
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
        { courseCode: "PSYC 410", courseTitle: "Clinical Practicum", credits: 5, instructorName: "Dr. Reyes" },
        { courseCode: "THESIS", courseTitle: "Senior Thesis (sponsor TBD)", credits: 8 },
      ],
    },
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-04-02"), duration: 45, meetingType: "in_person", outcome: "met", noteText: "Maya still searching for thesis sponsor. Two outreach attempts made — Dr. Reyes and Dr. Almeida both at capacity. Urgent. Must resolve before Week 4." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-01-20"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Spring planning. Contract submitted without thesis sponsor confirmed — flagged as action item. GPA trend discussed." },
    ],
    evaluations: [
      {
        instructorName: "Dr. Reyes",
        courseCode: "PSYC 201",
        courseTitle: "Introduction to Critical Thinking",
        term: "Fall 2024",
        termCode: "202409",
        text: "Maya demonstrated genuine intellectual curiosity when engaged with the material, contributing thoughtful observations during seminar discussions. However, attendance became inconsistent in the latter half of the semester and two written assignments were not submitted. Maya would benefit greatly from consistent engagement and early communication with instructors when challenges arise.",
        status: "satisfactory",
        submittedAt: new Date("2025-01-14"),
      },
      {
        instructorName: "Dr. Reyes",
        courseCode: "PSYC 310",
        courseTitle: "Research Methods in Psychology",
        term: "Spring 2024",
        termCode: "202401",
        text: "Maya's ISP proposal this semester showed strong methodological understanding and a clear research question. Her survey design work was among the most carefully considered in the course. I encourage her to build on this momentum and bring the same rigor to her thesis planning.",
        status: "satisfactory",
        submittedAt: new Date("2024-05-22"),
      },
    ],
    tutoring: [
      { date: new Date("2026-01-29"), durationMins: 60, subject: "Psychology / Statistics", courseCode: "PSYC 410", tutorName: "Carlos M.", sessionType: "in_person", termCode: "202601" },
      { date: new Date("2026-02-12"), durationMins: 60, subject: "Psychology / Statistics", courseCode: "PSYC 410", tutorName: "Carlos M.", sessionType: "in_person", termCode: "202601" },
      { date: new Date("2026-02-26"), durationMins: 45, subject: "Research Methods", courseCode: "PSYC 410", tutorName: "Carlos M.", sessionType: "virtual", termCode: "202601" },
      { date: new Date("2026-03-18"), durationMins: 60, subject: "Research Methods", courseCode: "PSYC 410", tutorName: "Carlos M.", sessionType: "in_person", termCode: "202601" },
    ],
    sscVisits: [
      { date: new Date("2026-02-05"), visitType: "scheduled", serviceType: "Academic Skills", staffName: "Coach Rivera", notes: "Study strategies and workload planning for thesis semester.", termCode: "202601" },
    ],
    academicCoach: { coachName: "Coach Rivera", coachEmail: "arivera@ncf.edu", assignedAt: new Date("2026-01-15") },
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

  // ── STUDENT 4: Dylan Osei — Junior, not met advisor ───────────────────
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
    isStudentAthlete: true,
    athleteSport: "Swimming",
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
      courses: [
        { courseCode: "MATH 320", courseTitle: "Real Analysis", credits: 4, instructorName: "Dr. Becker" },
        { courseCode: "MATH 310", courseTitle: "Linear Algebra", credits: 4, instructorName: "Dr. Becker" },
        { courseCode: "CS 250", courseTitle: "Algorithms", credits: 4, instructorName: "Dr. Lin" },
      ],
    },
    advising: [],
    evaluations: [
      {
        instructorName: "Dr. Becker",
        courseCode: "MATH 220",
        courseTitle: "Discrete Mathematics",
        term: "Fall 2024",
        termCode: "202409",
        text: "Dylan has a natural facility for mathematical abstraction. His work on graph theory proofs was rigorous and creative, often finding elegant approaches that differed from the expected solutions. I strongly encouraged him to pursue an ISP in combinatorics or graph theory — he did, and it was excellent. A promising student for the mathematics AOC.",
        status: "satisfactory",
        submittedAt: new Date("2025-01-08"),
      },
      {
        instructorName: "Dr. Lin",
        courseCode: "MATH 310",
        courseTitle: "Probability Theory",
        term: "Spring 2025",
        termCode: "202501",
        text: "Dylan engaged consistently and thoughtfully throughout the semester. His final exam demonstrated mastery of the core material. He is quiet in seminar but his written work shows deep independent thinking. I would welcome him in advanced courses.",
        status: "satisfactory",
        submittedAt: new Date("2025-05-25"),
      },
    ],
    tutoring: [],
    sscVisits: [],
    insights: [],
  });

  // ── STUDENT 5: Jordan Reyes — Sophomore, probation + medical leave ─────
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
      { alertType: "academic_concern", raisedBy: "Dr. Henderson", raisedAt: new Date("2025-11-12"), status: "open", notes: "Missing assignments and low quiz scores in PSYC 101. Student has not responded to two outreach attempts." },
    ],
    flags: [
      { flagType: "tuition_hold", isActive: true, addedAt: new Date("2025-10-01") },
    ],
    evaluations: [
      {
        instructorName: "Dr. Henderson",
        courseCode: "PSYC 101",
        courseTitle: "Introduction to Psychology",
        term: "Fall 2024",
        termCode: "202409",
        text: "Jordan showed genuine interest during the first half of the semester and contributed meaningfully to early discussions. However, attendance declined significantly after Week 8 and two major assignments were not submitted. I made two attempts to reach Jordan before the end of term. I hope they are able to access the support they need going forward.",
        status: "satisfactory",
        submittedAt: new Date("2025-01-16"),
      },
    ],
    tutoring: [],
    sscVisits: [],
    academicCoach: { coachName: "Coach Rivera", coachEmail: "arivera@ncf.edu", assignedAt: new Date("2026-01-20") },
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
        insightType: "risk",
        insightCode: "support_gap",
        title: "On probation — not accessing tutoring or SSC",
        body: "Jordan is on academic probation but has not accessed tutoring or the Student Success Center this semester.",
        subtext: "Tutoring sessions: 0 · SSC visits: 0",
        ctaText: "→ Refer to tutoring and SSC · Assign academic coach",
        severity: "urgent",
      },
    ],
  });

  // ── STUDENT 6: Sofia Martínez — First-Year, contract in progress ───────
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
    isTransfer: true,
    transferCredits: 18,
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
        { courseCode: "WRIT 100", courseTitle: "First-Year Writing", credits: 3, instructorName: "Dr. Patel" },
        { courseCode: "SOC 110", courseTitle: "Introduction to Sociology", credits: 3, instructorName: "Dr. Kim" },
        { courseCode: "PHIL 101", courseTitle: "Introduction to Philosophy", credits: 3, instructorName: "Dr. Reyes" },
      ],
    },
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-02-12"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "First-semester check-in. Sofia is adjusting well. Discussed possible AOC directions — interested in social sciences or humanities. Contract still in progress." },
    ],
    evaluations: [
      {
        instructorName: "Dr. Patel",
        courseCode: "WRIT 100",
        courseTitle: "First-Year Writing Seminar",
        term: "Fall 2025",
        termCode: "202509",
        text: "Sofia arrived at NCF as a strong writer and has grown considerably over the course of the semester. Her final essay — a comparative analysis of two environmental policy frameworks — demonstrated impressive research skills and analytical clarity unusual for a first-year student. She participates thoughtfully in class and takes revision seriously. I look forward to seeing her develop as a scholar.",
        status: "satisfactory",
        submittedAt: new Date("2025-12-18"),
      },
    ],
    tutoring: [
      { date: new Date("2026-02-08"), durationMins: 45, subject: "Sociology", courseCode: "SOC 110", tutorName: "Angela T.", sessionType: "in_person", termCode: "202601" },
    ],
    sscVisits: [
      { date: new Date("2026-01-22"), visitType: "scheduled", serviceType: "Orientation Workshop", staffName: "SSC Staff", notes: "New student orientation to SSC services.", termCode: "202601" },
      { date: new Date("2026-02-19"), visitType: "drop_in", serviceType: "Writing Support", staffName: "Dr. Patel", notes: "Sociology essay outline review.", termCode: "202601" },
    ],
    insights: [],
  });

  console.log("Seed complete.");
  console.log(`  Advisor: ${advisor.email} (tier ${advisor.accessTier})`);
  console.log(`  Faculty: ${facultyAdvisor.email} (tier ${facultyAdvisor.accessTier})`);
}

// ──────────────────────────────────────────────────────────────────────────
// Types

interface SeedISP { title: string; term: string; termCode: string; status: string; supervisor?: string }
interface SeedMinor { minorName: string; isDeclared: boolean; coursesRequired: number; coursesCompleted: number; percentComplete: number; coursesNeeded: string[] }
interface SeedDegreeProgress {
  aocName?: string | null; aocCreditRequired: number; aocCreditCompleted: number; aocPercentComplete: number;
  genEdRequired: number; genEdCompleted: number; ispsRequired: number; ispsCompleted: number;
  thesisStatus: string; thesisSponsor?: string | null; projectedGradTerm?: string; projectedGradTermCode?: string;
  onTrackForGraduation?: boolean; isps: SeedISP[]; minors: SeedMinor[];
}
interface SeedSemesterGpa { term: string; termCode: string; gpa: number; credits: number; standing: string }
interface SeedContract {
  term: string; termCode: string; status: string; signedByStudent: boolean; signedByAdvisor: boolean;
  signedAt?: Date; totalCredits: number;
  courses: { courseCode: string; courseTitle: string; credits: number; instructorName?: string }[];
}
interface SeedAdvising { advisorName: string; date: Date; duration: number; meetingType: string; outcome: string; noteText?: string }
interface SeedEarlyAlert { alertType: string; raisedBy: string; raisedAt: Date; status: string; notes?: string }
interface SeedFlag { flagType: string; isActive: boolean; addedAt: Date }
interface SeedEvaluation { instructorName: string; courseCode: string; courseTitle: string; term: string; termCode: string; text: string; status: string; submittedAt: Date }
interface SeedTutoring { date: Date; durationMins: number; subject: string; courseCode?: string; tutorName?: string; sessionType: string; termCode: string }
interface SeedSSCVisit { date: Date; visitType: string; serviceType: string; staffName?: string; notes?: string; termCode: string }
interface SeedAcademicCoach { coachName: string; coachEmail?: string; assignedAt?: Date }
interface SeedInsight { insightType: string; insightCode: string; title: string; body: string; subtext?: string; ctaText?: string; severity: string }

interface SeedStudent {
  id: string; firstName: string; lastName: string; preferredName: string | null; email: string;
  yearLevel: number; declaredAoc: string | null; cumulativeGpa: number | null;
  creditsEarned: number; creditsAttempted: number; academicStanding: string;
  advisorId: string | null; brightFuturesAward: string | null; brightFuturesActive: boolean;
  isTransfer?: boolean; transferCredits?: number; isStudentAthlete?: boolean; athleteSport?: string | null;
  degreeProgress: SeedDegreeProgress; semesterGpas: SeedSemesterGpa[]; contract: SeedContract;
  advising: SeedAdvising[]; earlyAlerts?: SeedEarlyAlert[]; flags?: SeedFlag[];
  evaluations?: SeedEvaluation[]; tutoring?: SeedTutoring[]; sscVisits?: SeedSSCVisit[];
  academicCoach?: SeedAcademicCoach; insights: SeedInsight[];
}

// ──────────────────────────────────────────────────────────────────────────
// seedStudent helper

async function seedStudent(s: SeedStudent) {
  await prisma.student.upsert({
    where: { id: s.id },
    update: {},
    create: {
      id: s.id, firstName: s.firstName, lastName: s.lastName, preferredName: s.preferredName,
      email: s.email, enrollmentStatus: "full-time", yearLevel: s.yearLevel,
      declaredAoc: s.declaredAoc, cumulativeGpa: s.cumulativeGpa,
      creditsEarned: s.creditsEarned, creditsAttempted: s.creditsAttempted,
      academicStanding: s.academicStanding, advisorId: s.advisorId,
      brightFuturesAward: s.brightFuturesAward, brightFuturesActive: s.brightFuturesActive,
      isTransfer: s.isTransfer ?? false, transferCredits: s.transferCredits ?? 0,
      isStudentAthlete: s.isStudentAthlete ?? false, athleteSport: s.athleteSport ?? null,
      bannerSyncedAt: new Date(),
    },
  });

  await prisma.semesterGpa.deleteMany({ where: { studentId: s.id } });
  await prisma.semesterGpa.createMany({ data: s.semesterGpas.map((g) => ({ ...g, studentId: s.id })) });

  await prisma.degreeProgress.upsert({
    where: { studentId: s.id },
    update: {
      aocName: s.degreeProgress.aocName ?? null, aocCreditRequired: s.degreeProgress.aocCreditRequired,
      aocCreditCompleted: s.degreeProgress.aocCreditCompleted, aocPercentComplete: s.degreeProgress.aocPercentComplete,
      genEdRequired: s.degreeProgress.genEdRequired, genEdCompleted: s.degreeProgress.genEdCompleted,
      ispsRequired: s.degreeProgress.ispsRequired, ispsCompleted: s.degreeProgress.ispsCompleted,
      thesisStatus: s.degreeProgress.thesisStatus, thesisSponsor: s.degreeProgress.thesisSponsor ?? null,
      projectedGradTerm: s.degreeProgress.projectedGradTerm ?? null, projectedGradTermCode: s.degreeProgress.projectedGradTermCode ?? null,
      onTrackForGraduation: s.degreeProgress.onTrackForGraduation ?? true,
      totalCreditsRequired: 120, totalCreditsEarned: s.creditsEarned, syncedAt: new Date(),
    },
    create: {
      studentId: s.id, aocName: s.degreeProgress.aocName ?? null, aocCreditRequired: s.degreeProgress.aocCreditRequired,
      aocCreditCompleted: s.degreeProgress.aocCreditCompleted, aocPercentComplete: s.degreeProgress.aocPercentComplete,
      genEdRequired: s.degreeProgress.genEdRequired, genEdCompleted: s.degreeProgress.genEdCompleted,
      ispsRequired: s.degreeProgress.ispsRequired, ispsCompleted: s.degreeProgress.ispsCompleted,
      thesisStatus: s.degreeProgress.thesisStatus, thesisSponsor: s.degreeProgress.thesisSponsor ?? null,
      projectedGradTerm: s.degreeProgress.projectedGradTerm ?? null, projectedGradTermCode: s.degreeProgress.projectedGradTermCode ?? null,
      onTrackForGraduation: s.degreeProgress.onTrackForGraduation ?? true,
      totalCreditsRequired: 120, totalCreditsEarned: s.creditsEarned, syncedAt: new Date(),
    },
  });

  const dp = await prisma.degreeProgress.findUnique({ where: { studentId: s.id } });
  if (dp) {
    await prisma.iSPRecord.deleteMany({ where: { degreeProgressId: dp.id } });
    await prisma.iSPRecord.createMany({
      data: s.degreeProgress.isps.map((isp) => ({
        degreeProgressId: dp.id, title: isp.title, term: isp.term,
        termCode: isp.termCode, status: isp.status, supervisorName: isp.supervisor ?? null,
      })),
    });
    await prisma.minorProgress.deleteMany({ where: { degreeProgressId: dp.id } });
    await prisma.minorProgress.createMany({
      data: s.degreeProgress.minors.map((m) => ({
        degreeProgressId: dp.id, minorName: m.minorName, isDeclared: m.isDeclared,
        coursesRequired: m.coursesRequired, coursesCompleted: m.coursesCompleted,
        percentComplete: m.percentComplete, coursesNeeded: JSON.stringify(m.coursesNeeded),
      })),
    });
  }

  await prisma.contract.upsert({
    where: { studentId_termCode: { studentId: s.id, termCode: s.contract.termCode } },
    update: { status: s.contract.status, signedByStudent: s.contract.signedByStudent, signedByAdvisor: s.contract.signedByAdvisor, signedAt: s.contract.signedAt ?? null, totalCredits: s.contract.totalCredits, syncedAt: new Date() },
    create: { studentId: s.id, term: s.contract.term, termCode: s.contract.termCode, status: s.contract.status, signedByStudent: s.contract.signedByStudent, signedByAdvisor: s.contract.signedByAdvisor, signedAt: s.contract.signedAt ?? null, totalCredits: s.contract.totalCredits, syncedAt: new Date() },
  });
  const contract = await prisma.contract.findUnique({ where: { studentId_termCode: { studentId: s.id, termCode: s.contract.termCode } } });
  if (contract) {
    await prisma.contractCourse.deleteMany({ where: { contractId: contract.id } });
    if (s.contract.courses.length > 0) {
      await prisma.contractCourse.createMany({ data: s.contract.courses.map((c) => ({ contractId: contract.id, courseCode: c.courseCode, courseTitle: c.courseTitle, credits: c.credits, instructorName: c.instructorName ?? null })) });
    }
  }

  await prisma.advisingRecord.deleteMany({ where: { studentId: s.id } });
  if (s.advising.length > 0) {
    await prisma.advisingRecord.createMany({ data: s.advising.map((a) => ({ studentId: s.id, advisorId: s.advisorId, advisorName: a.advisorName, appointmentDate: a.date, duration: a.duration, meetingType: a.meetingType, outcome: a.outcome, noteText: a.noteText ?? null, termCode: "202601", syncedAt: new Date() })) });
  }

  await prisma.earlyAlert.deleteMany({ where: { studentId: s.id } });
  if (s.earlyAlerts?.length) {
    await prisma.earlyAlert.createMany({ data: s.earlyAlerts.map((a) => ({ studentId: s.id, alertType: a.alertType, raisedBy: a.raisedBy, raisedAt: a.raisedAt, status: a.status, notes: a.notes ?? null, syncedAt: new Date() })) });
  }

  await prisma.financialFlag.deleteMany({ where: { studentId: s.id } });
  if (s.flags?.length) {
    await prisma.financialFlag.createMany({ data: s.flags.map((f) => ({ studentId: s.id, flagType: f.flagType, isActive: f.isActive, addedAt: f.addedAt, syncedAt: new Date() })) });
  }

  await prisma.evaluation.deleteMany({ where: { studentId: s.id } });
  if (s.evaluations?.length) {
    await prisma.evaluation.createMany({
      data: s.evaluations.map((e) => ({
        studentId: s.id, instructorName: e.instructorName, courseCode: e.courseCode,
        courseTitle: e.courseTitle, term: e.term, termCode: e.termCode,
        evaluationText: e.text, status: e.status, submittedAt: e.submittedAt, syncedAt: new Date(),
      })),
    });
  }

  await prisma.tutoringSession.deleteMany({ where: { studentId: s.id } });
  if (s.tutoring?.length) {
    await prisma.tutoringSession.createMany({
      data: s.tutoring.map((t) => ({
        studentId: s.id, sessionDate: t.date, durationMins: t.durationMins,
        subject: t.subject, courseCode: t.courseCode ?? null, tutorName: t.tutorName ?? null,
        sessionType: t.sessionType, wasNoShow: false,
        term: t.termCode === "202601" ? "Spring 2026" : "Fall 2025",
        termCode: t.termCode, syncedAt: new Date(),
      })),
    });
  }

  await prisma.sSCVisit.deleteMany({ where: { studentId: s.id } });
  if (s.sscVisits?.length) {
    await prisma.sSCVisit.createMany({
      data: s.sscVisits.map((v) => ({
        studentId: s.id, visitDate: v.date, visitType: v.visitType, serviceType: v.serviceType,
        staffName: v.staffName ?? null, notes: v.notes ?? null,
        term: v.termCode === "202601" ? "Spring 2026" : "Fall 2025",
        termCode: v.termCode, syncedAt: new Date(),
      })),
    });
  }

  await prisma.academicCoach.deleteMany({ where: { studentId: s.id } });
  if (s.academicCoach) {
    await prisma.academicCoach.create({
      data: { studentId: s.id, coachName: s.academicCoach.coachName, coachEmail: s.academicCoach.coachEmail ?? null, assignedAt: s.academicCoach.assignedAt ?? null, syncedAt: new Date() },
    });
  }

  await prisma.predictiveInsight.deleteMany({ where: { studentId: s.id } });
  if (s.insights.length > 0) {
    await prisma.predictiveInsight.createMany({
      data: s.insights.map((i) => ({ studentId: s.id, insightType: i.insightType, insightCode: i.insightCode, title: i.title, body: i.body, subtext: i.subtext ?? null, ctaText: i.ctaText ?? null, severity: i.severity })),
    });
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
