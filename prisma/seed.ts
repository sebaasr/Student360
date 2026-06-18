import { PrismaClient } from "@prisma/client";
import { coursesForDivision, pickDesignation, designationToStatus, type Designation } from "../lib/ncf-enrollment";
import { TUTORING_SUBJECTS, subjectPrefix } from "../lib/service-usage";
import { divisionFromAoc } from "../lib/utils";

const prisma = new PrismaClient();

// ─── term helpers ────────────────────────────────────────────────────────────
function term(code: string): string {
  const y = code.slice(0, 4);
  const m = code.slice(4, 6);
  return m === "09" ? `Fall ${y}` : m === "01" ? `Spring ${y}` : `Summer ${y}`;
}

// Division → course-code prefix, for plausible codes on real course titles.
const DIV_PREFIX: Record<string, string> = {
  "Natural Sciences": "NSCI",
  Humanities: "HUM",
  "Social Sciences": "SOSC",
  Interdisciplinary: "IDST",
  Undeclared: "NCF",
};

// Short narrative text by evaluation designation.
function evalText(d: Designation, course: string): string {
  const map: Record<Designation, string[]> = {
    strong_sat: [
      `Outstanding work in ${course}. Engaged deeply with the material and consistently exceeded expectations in written and seminar work.`,
      `Among the strongest students in ${course} this term — insightful contributions, rigorous analysis, and excellent independent thinking.`,
    ],
    sat: [
      `Solid, consistent performance in ${course}. Met all expectations and participated thoughtfully throughout the term.`,
      `Reliable and engaged work in ${course}. Demonstrated a good command of the material and steady progress.`,
    ],
    marginal_sat: [
      `Adequate work in ${course}, though engagement was uneven. Would benefit from more consistent attendance and earlier communication when struggling.`,
      `Passed ${course} but performance was below potential. Some late assignments; recommend an advising check-in on workload.`,
    ],
    unsat: [
      `Did not meet the requirements of ${course}. Significant missing work and inconsistent attendance. Immediate advising intervention recommended.`,
      `Unsatisfactory work in ${course}. Multiple unsubmitted assignments and limited engagement this term.`,
    ],
  };
  const opts = map[d];
  return opts[Math.floor(Math.random() * opts.length)];
}

async function main() {
  console.log("Seeding Student 360 dev database…");

  // ── USERS ─────────────────────────────────────────────────────────────────
  const advisor = await prisma.user.upsert({
    where: { email: "mlopezzafra@ncf.edu" },
    update: {},
    create: { email: "mlopezzafra@ncf.edu", name: "Manuel Lopez", ncfUsername: "mlopezzafra", accessTier: 8 },
  });
  const fac = await prisma.user.upsert({
    where: { email: "faculty@ncf.edu" },
    update: {},
    create: { email: "faculty@ncf.edu", name: "Dr. Faculty Advisor", accessTier: 1 },
  });
  await prisma.user.upsert({
    where: { email: "itadmin@ncf.edu" },
    update: {},
    create: { email: "itadmin@ncf.edu", name: "IT Admin", accessTier: 9 },
  });

  // ── STUDENT 1: Theo Nakamura — Senior, Biology, on track ─────────────────
  await seedStudent({
    id: "N2022-0034", firstName: "Theo", lastName: "Nakamura", preferredName: null,
    email: "theo.nakamura@ncf.edu", yearLevel: 4,
    declaredAoc: "Natural Sciences (Biology)", cumulativeGpa: 3.85,
    creditsEarned: 102, creditsAttempted: 102, academicStanding: "good_standing",
    advisorId: advisor.id, brightFuturesAward: "academic_scholar", brightFuturesActive: true,
    degreeProgress: {
      aocName: "Biology", aocCreditRequired: 40, aocCreditCompleted: 36, aocPercentComplete: 0.9,
      genEdRequired: 20, genEdCompleted: 20, ispsRequired: 3, ispsCompleted: 2,
      thesisStatus: "in_progress", thesisSponsor: "Dr. Helena Park",
      projectedGradTerm: "Spring 2026", projectedGradTermCode: "202601", onTrackForGraduation: true,
      isps: [
        { title: "Marine Microbiome Sampling", term: "Fall 2024", termCode: "202409", status: "completed", supervisor: "Dr. Park" },
        { title: "Cell Signaling Lab Project", term: "Spring 2025", termCode: "202501", status: "completed", supervisor: "Dr. Iversen" },
      ],
      minors: [{ minorName: "Statistics", isDeclared: true, coursesRequired: 6, coursesCompleted: 5, percentComplete: 0.83, coursesNeeded: ["STAT 350"] }],
    },
    semesterGpas: [
      { term: "Fall 2022",   termCode: "202209", gpa: 3.5,  credits: 14, standing: "good_standing" },
      { term: "Spring 2023", termCode: "202301", gpa: 3.6,  credits: 15, standing: "good_standing" },
      { term: "Fall 2023",   termCode: "202309", gpa: 3.7,  credits: 15, standing: "good_standing" },
      { term: "Spring 2024", termCode: "202401", gpa: 3.9,  credits: 15, standing: "good_standing" },
      { term: "Fall 2024",   termCode: "202409", gpa: 3.85, credits: 15, standing: "good_standing" },
    ],
    contracts: [
      { termCode: "202209", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2022-09-02"), totalCredits: 14, courses: [
        { courseCode: "BIO 101", courseTitle: "Introduction to Biology", credits: 4, instructorName: "Dr. Park" },
        { courseCode: "WRIT 100", courseTitle: "First-Year Writing Seminar", credits: 3, instructorName: "Dr. Patel" },
        { courseCode: "MATH 150", courseTitle: "Calculus I", credits: 4, instructorName: "Dr. Chen" },
      ]},
      { termCode: "202301", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2023-01-10"), totalCredits: 15, courses: [
        { courseCode: "BIO 201", courseTitle: "Cell Biology", credits: 4, instructorName: "Dr. Park" },
        { courseCode: "CHEM 101", courseTitle: "General Chemistry", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "STAT 200", courseTitle: "Intro to Statistics", credits: 3, instructorName: "Dr. Chen" },
      ]},
      { termCode: "202309", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2023-09-05"), totalCredits: 15, courses: [
        { courseCode: "BIO 310", courseTitle: "Molecular Biology", credits: 4, instructorName: "Dr. Park" },
        { courseCode: "CHEM 220", courseTitle: "Organic Chemistry", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "STAT 305", courseTitle: "Statistical Inference", credits: 3, instructorName: "Dr. Chen" },
      ]},
      { termCode: "202401", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-01-08"), totalCredits: 15, courses: [
        { courseCode: "BIO 320", courseTitle: "Ecology & Evolution", credits: 4, instructorName: "Dr. Park" },
        { courseCode: "BIO 330", courseTitle: "Immunology", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "STAT 320", courseTitle: "Bayesian Inference", credits: 3, instructorName: "Dr. Chen" },
      ]},
      { termCode: "202409", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-09-03"), totalCredits: 15, courses: [
        { courseCode: "BIO 398", courseTitle: "Cell Biology Seminar", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "ISP-001", courseTitle: "Marine Microbiome ISP", credits: 6, instructorName: "Dr. Park" },
        { courseCode: "STAT 340", courseTitle: "Applied Statistics", credits: 3, instructorName: "Dr. Chen" },
      ]},
      { termCode: "202601", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-12-08"), totalCredits: 15, courses: [
        { courseCode: "BIO 412", courseTitle: "Cell Signaling", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "STAT 350", courseTitle: "Bayesian Methods", credits: 3, instructorName: "Dr. Chen" },
        { courseCode: "THESIS", courseTitle: "Senior Thesis", credits: 8, instructorName: "Dr. Park" },
      ]},
    ],
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2022-09-12"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "First-year orientation meeting. Strong interests in marine biology and data science." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2023-04-05"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Second semester check-in. Discussed possible AOC in Biology. Excellent progress." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2023-09-18"), duration: 45, meetingType: "in_person", outcome: "met", noteText: "Year 2 planning. Declared Biology AOC. Discussed Statistics minor as complement." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2024-09-10"), duration: 45, meetingType: "in_person", outcome: "met", noteText: "Fall check-in. ISP approved with Dr. Park. Strong semester ahead." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-02-15"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Reviewed minor completion plan. Thesis draft chapter 1 submitted to Dr. Park." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-04-22"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Discussed thesis defense scheduling; on track. Confirmed minor completion with STAT 350." },
    ],
    evaluations: [
      { instructorName: "Dr. Patel", courseCode: "WRIT 100", courseTitle: "First-Year Writing Seminar", term: "Fall 2022", termCode: "202209", text: "Theo arrived as a confident, analytical writer. His essays demonstrated strong scientific reasoning applied to humanistic questions. A promising first-year student who takes feedback seriously and revises with care.", status: "satisfactory", submittedAt: new Date("2023-01-05") },
      { instructorName: "Dr. Park", courseCode: "BIO 201", courseTitle: "Cell Biology", term: "Spring 2023", termCode: "202301", text: "Theo's understanding of cellular mechanisms exceeded expectations for a first-year student. His lab reports were meticulous and his questions in seminar consistently pushed the class forward. I look forward to working with him in advanced courses.", status: "satisfactory", submittedAt: new Date("2023-05-18") },
      { instructorName: "Dr. Park", courseCode: "BIO 310", courseTitle: "Molecular Biology", term: "Fall 2023", termCode: "202309", text: "Theo demonstrated exceptional aptitude in molecular biology. His ability to synthesize complex mechanisms in enzyme kinetics surpassed expectations. Lab reports were consistently thorough. He should consider thesis work in this area.", status: "satisfactory", submittedAt: new Date("2024-01-15") },
      { instructorName: "Dr. Chen", courseCode: "STAT 305", courseTitle: "Statistical Inference", term: "Spring 2024", termCode: "202401", text: "Theo's final project applying Bayesian inference to ecological data showed genuine intellectual initiative and strong computational skills. Well-prepared for advanced coursework.", status: "satisfactory", submittedAt: new Date("2024-05-20") },
      { instructorName: "Dr. Iversen", courseCode: "BIO 398", courseTitle: "Cell Biology Seminar", term: "Fall 2024", termCode: "202409", text: "Theo's contributions to seminar discussions were consistently insightful. His ISP proposal was among the most well-conceived I have reviewed. An excellent candidate for honors distinction.", status: "satisfactory", submittedAt: new Date("2025-01-12") },
    ],
    tutoring: [
      { date: new Date("2023-10-10"), durationMins: 60, subject: "Statistics", courseCode: "STAT 305", tutorName: "Maria S.", sessionType: "in_person", termCode: "202309" },
      { date: new Date("2026-02-03"), durationMins: 60, subject: "Statistics", courseCode: "STAT 350", tutorName: "Maria S.", sessionType: "in_person", termCode: "202601" },
      { date: new Date("2026-02-17"), durationMins: 60, subject: "Statistics", courseCode: "STAT 350", tutorName: "Maria S.", sessionType: "in_person", termCode: "202601" },
      { date: new Date("2026-03-10"), durationMins: 45, subject: "Statistics", courseCode: "STAT 350", tutorName: "Maria S.", sessionType: "virtual", termCode: "202601" },
    ],
    sscVisits: [
      { date: new Date("2023-02-14"), visitType: "scheduled", serviceType: "Writing Support", staffName: "Dr. Patel", notes: "First-year writing portfolio review.", termCode: "202301" },
      { date: new Date("2026-01-28"), visitType: "scheduled", serviceType: "Writing Support", staffName: "Dr. Patel", notes: "Thesis chapter 1 draft review.", termCode: "202601" },
      { date: new Date("2026-03-05"), visitType: "drop_in", serviceType: "Writing Support", staffName: "Dr. Patel", notes: "Citations and formatting guidance.", termCode: "202601" },
    ],
    insights: [
      { insightType: "opportunity", insightCode: "minor_proximity", title: "1 course from completing Statistics Minor", body: "Theo has completed 5 of 6 required courses for the Statistics minor (83%). STAT 350 is on the Spring 26 contract.", subtext: "Completed: 5/6 courses · Status: Declared", ctaText: "→ Confirm remaining course", severity: "info" },
    ],
  });

  // ── STUDENT 2: Ava Thornton — Junior, Literature, minor proximity ──────────
  await seedStudent({
    id: "N2023-0055", firstName: "Ava", lastName: "Thornton", preferredName: null,
    email: "ava.thornton@ncf.edu", yearLevel: 3,
    declaredAoc: "Humanities (Literature)", cumulativeGpa: 3.72,
    creditsEarned: 78, creditsAttempted: 78, academicStanding: "good_standing",
    advisorId: advisor.id, brightFuturesAward: "academic_scholar", brightFuturesActive: true,
    degreeProgress: {
      aocName: "Literature", aocCreditRequired: 36, aocCreditCompleted: 22, aocPercentComplete: 0.61,
      genEdRequired: 20, genEdCompleted: 18, ispsRequired: 3, ispsCompleted: 1,
      thesisStatus: "not_started", thesisSponsor: null,
      isps: [{ title: "Translation Workshop", term: "Spring 2025", termCode: "202501", status: "completed", supervisor: "Dr. Almeida" }],
      minors: [{ minorName: "Philosophy", isDeclared: false, coursesRequired: 6, coursesCompleted: 4, percentComplete: 0.67, coursesNeeded: ["PHIL 305", "PHIL 410"] }],
    },
    semesterGpas: [
      { term: "Fall 2023",   termCode: "202309", gpa: 3.6,  credits: 14, standing: "good_standing" },
      { term: "Spring 2024", termCode: "202401", gpa: 3.75, credits: 15, standing: "good_standing" },
      { term: "Fall 2024",   termCode: "202409", gpa: 3.7,  credits: 15, standing: "good_standing" },
      { term: "Spring 2025", termCode: "202501", gpa: 3.75, credits: 15, standing: "good_standing" },
    ],
    contracts: [
      { termCode: "202309", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2023-09-04"), totalCredits: 14, courses: [
        { courseCode: "WRIT 100", courseTitle: "First-Year Writing Seminar", credits: 3, instructorName: "Dr. Patel" },
        { courseCode: "LIT 101", courseTitle: "Introduction to Literary Study", credits: 4, instructorName: "Dr. Kim" },
        { courseCode: "PHIL 101", courseTitle: "Introduction to Philosophy", credits: 3, instructorName: "Dr. Reyes" },
      ]},
      { termCode: "202401", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-01-09"), totalCredits: 15, courses: [
        { courseCode: "LIT 210", courseTitle: "Contemporary Fiction", credits: 4, instructorName: "Dr. Kim" },
        { courseCode: "PHIL 201", courseTitle: "Ethics and Society", credits: 3, instructorName: "Dr. Reyes" },
        { courseCode: "HIST 150", courseTitle: "Modern Latin American History", credits: 4, instructorName: "Dr. Almeida" },
      ]},
      { termCode: "202409", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-09-02"), totalCredits: 15, courses: [
        { courseCode: "LIT 290", courseTitle: "Translation and Meaning", credits: 4, instructorName: "Dr. Almeida" },
        { courseCode: "PHIL 305", courseTitle: "Philosophy of Language", credits: 3, instructorName: "Dr. Reyes" },
        { courseCode: "LIT 280", courseTitle: "Postcolonial Narratives", credits: 4, instructorName: "Dr. Kim" },
      ]},
      { termCode: "202501", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-01-07"), totalCredits: 15, courses: [
        { courseCode: "LIT 301", courseTitle: "The Novel and History", credits: 4, instructorName: "Dr. Kim" },
        { courseCode: "ISP-002", courseTitle: "Translation Workshop ISP", credits: 6, instructorName: "Dr. Almeida" },
        { courseCode: "PHIL 320", courseTitle: "Mind and Language", credits: 3, instructorName: "Dr. Reyes" },
      ]},
      { termCode: "202601", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-12-05"), totalCredits: 15, courses: [
        { courseCode: "LIT 305", courseTitle: "20th C. Latin American Lit", credits: 4, instructorName: "Dr. Almeida" },
        { courseCode: "PHIL 305", courseTitle: "Philosophy of Language", credits: 3, instructorName: "Dr. Reyes" },
        { courseCode: "LIT 280", courseTitle: "Postcolonial Narratives", credits: 4, instructorName: "Dr. Kim" },
      ]},
    ],
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2023-09-14"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "First-year orientation. Strong writing background, interested in literary theory and translation." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2024-04-08"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "End of first year. Declared Literature AOC. Noted strong interest in Philosophy — suggested minor." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2025-09-15"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Fall planning. Identified strong thematic thread across coursework — bioethics and philosophy of mind emerging." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-03-18"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Discussed possible minor declaration in Philosophy. Ava is 2 courses away and should declare before next semester registration." },
    ],
    evaluations: [
      { instructorName: "Dr. Kim", courseCode: "LIT 101", courseTitle: "Introduction to Literary Study", term: "Fall 2023", termCode: "202309", text: "Ava arrived with a strong literary sensibility and genuine enthusiasm for close reading. Her first essay on narrative voice showed unusual sophistication for a first-year student. She participated actively in all discussions and took revision notes seriously.", status: "satisfactory", submittedAt: new Date("2024-01-08") },
      { instructorName: "Dr. Kim", courseCode: "LIT 210", courseTitle: "Contemporary Fiction", term: "Spring 2024", termCode: "202401", text: "Ava's work reflected a mature literary sensibility and genuine engagement with form. Her final paper on magical realism as political strategy was the strongest piece of work in the seminar.", status: "satisfactory", submittedAt: new Date("2024-05-22") },
      { instructorName: "Dr. Almeida", courseCode: "LIT 290", courseTitle: "Translation and Meaning", term: "Fall 2024", termCode: "202409", text: "Ava brought rigor and creativity to the translation workshop. Her ISP on three translations of Borges demonstrated command of Spanish and a nuanced understanding of how translation shapes literary meaning.", status: "satisfactory", submittedAt: new Date("2025-01-10") },
    ],
    tutoring: [
      { date: new Date("2024-10-14"), durationMins: 60, subject: "Philosophy", courseCode: "PHIL 305", tutorName: "James R.", sessionType: "in_person", termCode: "202409" },
      { date: new Date("2026-02-10"), durationMins: 60, subject: "Philosophy", courseCode: "PHIL 305", tutorName: "James R.", sessionType: "in_person", termCode: "202601" },
      { date: new Date("2026-03-03"), durationMins: 60, subject: "Philosophy", courseCode: "PHIL 305", tutorName: "James R.", sessionType: "in_person", termCode: "202601" },
    ],
    sscVisits: [
      { date: new Date("2024-02-20"), visitType: "scheduled", serviceType: "Writing Support", staffName: "Dr. Patel", notes: "Essay revision for Contemporary Fiction.", termCode: "202401" },
      { date: new Date("2026-02-20"), visitType: "scheduled", serviceType: "Academic Skills", staffName: "Coach Rivera", notes: "Discussed time management for spring workload.", termCode: "202601" },
    ],
    insights: [
      { insightType: "opportunity", insightCode: "minor_proximity", title: "2 courses from completing Philosophy Minor", body: "Ava has completed 4 of 6 required courses for the Philosophy minor (67%). The minor is currently undeclared.", subtext: "Completed: 4/6 courses · Status: Undeclared", ctaText: "→ Suggest declaring the minor", severity: "info" },
      { insightType: "thematic_pattern", insightCode: "thematic_cluster", title: "Emerging pattern: language, meaning, and mind", body: "Ava's coursework spans Literature, Philosophy of Language, and Translation Studies. Six courses across 3 disciplines show overlapping themes: consciousness, meaning-making, and representation.", subtext: "Detected from: LIT 210, LIT 290, PHIL 201, PHIL 305, and ISP", ctaText: "→ Worth exploring in next advising meeting", severity: "info" },
    ],
  });

  // ── STUDENT 3: Maya Chen — Senior, thesis without sponsor ─────────────────
  await seedStudent({
    id: "N2023-0012", firstName: "Maya", lastName: "Chen", preferredName: null,
    email: "maya.chen@ncf.edu", yearLevel: 4,
    declaredAoc: "Social Sciences (Psychology)", cumulativeGpa: 3.05,
    creditsEarned: 96, creditsAttempted: 102, academicStanding: "good_standing",
    advisorId: advisor.id, brightFuturesAward: "academic_scholar", brightFuturesActive: true,
    degreeProgress: {
      aocName: "Psychology", aocCreditRequired: 40, aocCreditCompleted: 30, aocPercentComplete: 0.75,
      genEdRequired: 20, genEdCompleted: 18, ispsRequired: 3, ispsCompleted: 2,
      thesisStatus: "not_started", thesisSponsor: null,
      isps: [
        { title: "Adolescent Identity Study", term: "Fall 2024", termCode: "202409", status: "completed", supervisor: "Dr. Reyes" },
        { title: "Bias in Survey Design", term: "Spring 2025", termCode: "202501", status: "completed", supervisor: "Dr. Reyes" },
      ],
      minors: [],
    },
    semesterGpas: [
      { term: "Fall 2022",   termCode: "202209", gpa: 3.6,  credits: 15, standing: "good_standing" },
      { term: "Spring 2023", termCode: "202301", gpa: 3.5,  credits: 15, standing: "good_standing" },
      { term: "Fall 2023",   termCode: "202309", gpa: 3.4,  credits: 15, standing: "good_standing" },
      { term: "Spring 2024", termCode: "202401", gpa: 3.1,  credits: 15, standing: "good_standing" },
      { term: "Fall 2024",   termCode: "202409", gpa: 2.9,  credits: 12, standing: "good_standing" },
    ],
    contracts: [
      { termCode: "202209", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2022-09-05"), totalCredits: 15, courses: [
        { courseCode: "PSYC 101", courseTitle: "Introduction to Psychology", credits: 4, instructorName: "Dr. Henderson" },
        { courseCode: "WRIT 100", courseTitle: "First-Year Writing Seminar", credits: 3, instructorName: "Dr. Patel" },
        { courseCode: "SOC 101", courseTitle: "Introduction to Sociology", credits: 4, instructorName: "Dr. Kim" },
      ]},
      { termCode: "202301", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2023-01-06"), totalCredits: 15, courses: [
        { courseCode: "PSYC 201", courseTitle: "Introduction to Critical Thinking", credits: 4, instructorName: "Dr. Reyes" },
        { courseCode: "STAT 200", courseTitle: "Intro to Statistics", credits: 3, instructorName: "Dr. Chen" },
        { courseCode: "PSYC 210", courseTitle: "Developmental Psychology", credits: 4, instructorName: "Dr. Henderson" },
      ]},
      { termCode: "202309", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2023-09-06"), totalCredits: 15, courses: [
        { courseCode: "PSYC 301", courseTitle: "Social Psychology", credits: 4, instructorName: "Dr. Reyes" },
        { courseCode: "PSYC 310", courseTitle: "Research Methods", credits: 4, instructorName: "Dr. Reyes" },
        { courseCode: "WRIT 200", courseTitle: "Advanced Writing", credits: 3, instructorName: "Dr. Patel" },
      ]},
      { termCode: "202401", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-01-08"), totalCredits: 15, courses: [
        { courseCode: "PSYC 380", courseTitle: "Cognitive Psychology", credits: 4, instructorName: "Dr. Reyes" },
        { courseCode: "PSYC 390", courseTitle: "Abnormal Psychology", credits: 4, instructorName: "Dr. Henderson" },
        { courseCode: "STAT 305", courseTitle: "Statistical Inference", credits: 3, instructorName: "Dr. Chen" },
      ]},
      { termCode: "202409", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-09-04"), totalCredits: 12, courses: [
        { courseCode: "PSYC 401", courseTitle: "Advanced Research Methods", credits: 4, instructorName: "Dr. Reyes" },
        { courseCode: "ISP-003", courseTitle: "Adolescent Identity Study", credits: 5, instructorName: "Dr. Reyes" },
      ]},
      { termCode: "202601", status: "pending_advisor", signedByStudent: true, signedByAdvisor: false, totalCredits: 13, courses: [
        { courseCode: "PSYC 410", courseTitle: "Clinical Practicum", credits: 5, instructorName: "Dr. Reyes" },
        { courseCode: "THESIS", courseTitle: "Senior Thesis (sponsor TBD)", credits: 8 },
      ]},
    ],
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2022-09-14"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "First-year orientation. Strong interest in social psychology and identity research." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2023-09-12"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Year 2 planning. Declared Psychology AOC. Discussed research methods pathway." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2024-09-09"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Year 3 check-in. ISP approved with Dr. Reyes. GPA trend noted — discussed workload balance." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-01-20"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Spring planning. Contract submitted without thesis sponsor confirmed — flagged as action item." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-04-02"), duration: 45, meetingType: "in_person", outcome: "met", noteText: "Maya still searching for thesis sponsor. Two outreach attempts. Urgent — must resolve before Week 4." },
    ],
    evaluations: [
      { instructorName: "Dr. Reyes", courseCode: "PSYC 201", courseTitle: "Introduction to Critical Thinking", term: "Spring 2023", termCode: "202301", text: "Maya showed strong analytical skills and curiosity about research design. Her written work was well-reasoned and she participated actively in seminar discussions throughout the term.", status: "satisfactory", submittedAt: new Date("2023-05-20") },
      { instructorName: "Dr. Reyes", courseCode: "PSYC 310", courseTitle: "Research Methods in Psychology", term: "Fall 2023", termCode: "202309", text: "Maya's ISP proposal showed strong methodological understanding. Her survey design work was among the most carefully considered in the course.", status: "satisfactory", submittedAt: new Date("2024-01-14") },
      { instructorName: "Dr. Reyes", courseCode: "PSYC 201", courseTitle: "Introduction to Critical Thinking", term: "Fall 2024", termCode: "202409", text: "Maya demonstrated genuine intellectual curiosity when engaged with the material. However, attendance became inconsistent in the latter half and two assignments were not submitted. Maya would benefit from consistent engagement and early communication with instructors.", status: "satisfactory", submittedAt: new Date("2025-01-14") },
    ],
    tutoring: [
      { date: new Date("2024-10-22"), durationMins: 60, subject: "Statistics", courseCode: "STAT 305", tutorName: "Carlos M.", sessionType: "in_person", termCode: "202409" },
      { date: new Date("2026-01-29"), durationMins: 60, subject: "Psychology / Statistics", courseCode: "PSYC 410", tutorName: "Carlos M.", sessionType: "in_person", termCode: "202601" },
      { date: new Date("2026-02-12"), durationMins: 60, subject: "Psychology / Statistics", courseCode: "PSYC 410", tutorName: "Carlos M.", sessionType: "in_person", termCode: "202601" },
      { date: new Date("2026-02-26"), durationMins: 45, subject: "Research Methods", courseCode: "PSYC 410", tutorName: "Carlos M.", sessionType: "virtual", termCode: "202601" },
      { date: new Date("2026-03-18"), durationMins: 60, subject: "Research Methods", courseCode: "PSYC 410", tutorName: "Carlos M.", sessionType: "in_person", termCode: "202601" },
    ],
    sscVisits: [
      { date: new Date("2023-10-05"), visitType: "scheduled", serviceType: "Academic Skills", staffName: "Coach Rivera", notes: "Time management and study strategies.", termCode: "202309" },
      { date: new Date("2026-02-05"), visitType: "scheduled", serviceType: "Academic Skills", staffName: "Coach Rivera", notes: "Study strategies and workload planning for thesis semester.", termCode: "202601" },
    ],
    academicCoach: { coachName: "Coach Rivera", coachEmail: "arivera@ncf.edu", assignedAt: new Date("2026-01-15") },
    msprs: [
      { term: "Spring 2026", termCode: "202601", courseCode: "PSYC 410", courseTitle: "Clinical Practicum", instructorName: "Dr. Reyes", rating: "concern", attendance: "irregular", feedback: "Maya is capable but has missed two practicum sessions. Engagement is inconsistent. Recommend an advising check-in before the withdrawal deadline.", submittedAt: new Date("2026-03-02") },
    ],
    insights: [
      { insightType: "risk", insightCode: "thesis_timeline", title: "Senior without a thesis sponsor identified", body: "Maya is a senior and has not yet identified a thesis sponsor. This should be addressed immediately.", subtext: "Thesis status: Not started", ctaText: "→ Connect Maya with Dr. Reyes or Dr. Almeida", severity: "urgent" },
      { insightType: "risk", insightCode: "gpa_trend", title: "GPA declining over the last 3 semesters", body: "GPA has trended 3.4 → 3.1 → 2.9. Monitor course load and check in on stressors.", subtext: "Current: 2.90 · Threshold: 2.0", ctaText: "→ Discuss course load and support access", severity: "warning" },
    ],
  });

  // ── STUDENT 4: Dylan Osei — Junior, Swimmer, not met advisor ─────────────
  await seedStudent({
    id: "N2023-0101", firstName: "Dylan", lastName: "Osei", preferredName: null,
    email: "dylan.osei@ncf.edu", yearLevel: 3,
    declaredAoc: "Natural Sciences (Mathematics)", cumulativeGpa: 3.4,
    creditsEarned: 72, creditsAttempted: 72, academicStanding: "good_standing",
    advisorId: advisor.id, brightFuturesAward: null, brightFuturesActive: false,
    isStudentAthlete: true, athleteSport: "Swimming",
    athletics: {
      sport: "Swimming", eligibilityStatus: "eligible", gpaRequired: 2.0, creditLoadRequired: 12,
      certHistory: [
        { term: "Fall 2023", status: "eligible" },
        { term: "Spring 2024", status: "eligible" },
        { term: "Fall 2024", status: "eligible" },
        { term: "Spring 2025", status: "eligible" },
      ],
      farNotes: "Student meets all NAIA Sun Conference eligibility requirements. Full-time enrollment confirmed. GPA well above minimum threshold.",
    },
    degreeProgress: {
      aocName: "Mathematics", aocCreditRequired: 40, aocCreditCompleted: 24, aocPercentComplete: 0.6,
      genEdRequired: 20, genEdCompleted: 16, ispsRequired: 3, ispsCompleted: 1, thesisStatus: "not_started",
      isps: [{ title: "Graph Theory ISP", term: "Spring 2025", termCode: "202501", status: "completed", supervisor: "Dr. Becker" }],
      minors: [],
    },
    semesterGpas: [
      { term: "Fall 2023",   termCode: "202309", gpa: 3.6, credits: 15, standing: "good_standing" },
      { term: "Spring 2024", termCode: "202401", gpa: 3.5, credits: 15, standing: "good_standing" },
      { term: "Fall 2024",   termCode: "202409", gpa: 3.5, credits: 15, standing: "good_standing" },
      { term: "Spring 2025", termCode: "202501", gpa: 3.3, credits: 15, standing: "good_standing" },
    ],
    contracts: [
      { termCode: "202309", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2023-09-03"), totalCredits: 15, courses: [
        { courseCode: "MATH 101", courseTitle: "Calculus I", credits: 4, instructorName: "Dr. Becker" },
        { courseCode: "WRIT 100", courseTitle: "First-Year Writing Seminar", credits: 3, instructorName: "Dr. Patel" },
        { courseCode: "CS 101", courseTitle: "Introduction to Programming", credits: 4, instructorName: "Dr. Lin" },
      ]},
      { termCode: "202401", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-01-08"), totalCredits: 15, courses: [
        { courseCode: "MATH 201", courseTitle: "Calculus II", credits: 4, instructorName: "Dr. Becker" },
        { courseCode: "MATH 210", courseTitle: "Linear Algebra", credits: 4, instructorName: "Dr. Becker" },
        { courseCode: "CS 201", courseTitle: "Data Structures", credits: 4, instructorName: "Dr. Lin" },
      ]},
      { termCode: "202409", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-09-02"), totalCredits: 15, courses: [
        { courseCode: "MATH 220", courseTitle: "Discrete Mathematics", credits: 4, instructorName: "Dr. Becker" },
        { courseCode: "MATH 230", courseTitle: "Probability Theory", credits: 4, instructorName: "Dr. Lin" },
        { courseCode: "CS 250", courseTitle: "Algorithms", credits: 4, instructorName: "Dr. Lin" },
      ]},
      { termCode: "202501", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-01-06"), totalCredits: 15, courses: [
        { courseCode: "MATH 310", courseTitle: "Real Analysis I", credits: 4, instructorName: "Dr. Becker" },
        { courseCode: "ISP-004", courseTitle: "Graph Theory ISP", credits: 4, instructorName: "Dr. Becker" },
        { courseCode: "CS 310", courseTitle: "Theory of Computation", credits: 4, instructorName: "Dr. Lin" },
      ]},
      { termCode: "202601", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-12-01"), totalCredits: 15, courses: [
        { courseCode: "MATH 320", courseTitle: "Real Analysis II", credits: 4, instructorName: "Dr. Becker" },
        { courseCode: "MATH 330", courseTitle: "Linear Algebra", credits: 4, instructorName: "Dr. Becker" },
        { courseCode: "CS 350", courseTitle: "Machine Learning", credits: 4, instructorName: "Dr. Lin" },
      ]},
    ],
    advising: [],
    evaluations: [
      { instructorName: "Dr. Becker", courseCode: "MATH 101", courseTitle: "Calculus I", term: "Fall 2023", termCode: "202309", text: "Dylan showed strong analytical ability from the first week. His problem sets were consistently elegant and he sought clarification when needed. A promising mathematics student with good foundational skills.", status: "satisfactory", submittedAt: new Date("2024-01-07") },
      { instructorName: "Dr. Becker", courseCode: "MATH 220", courseTitle: "Discrete Mathematics", term: "Fall 2024", termCode: "202409", text: "Dylan has a natural facility for mathematical abstraction. His work on graph theory proofs was rigorous and creative. I strongly encouraged him to pursue an ISP in graph theory — he did, and it was excellent.", status: "satisfactory", submittedAt: new Date("2025-01-08") },
      { instructorName: "Dr. Lin", courseCode: "MATH 310", courseTitle: "Probability Theory", term: "Spring 2025", termCode: "202501", text: "Dylan engaged consistently and thoughtfully. His final exam demonstrated mastery of the core material. He is quiet in seminar but his written work shows deep independent thinking.", status: "satisfactory", submittedAt: new Date("2025-05-25") },
    ],
    tutoring: [],
    sscVisits: [],
    insights: [],
  });

  // ── STUDENT 5: Jordan Reyes — Sophomore, probation + medical leave ─────────
  await seedStudent({
    id: "N2024-0087", firstName: "Jordan", lastName: "Reyes", preferredName: null,
    email: "jordan.reyes@ncf.edu", yearLevel: 2,
    declaredAoc: null, cumulativeGpa: 1.9, creditsEarned: 22, creditsAttempted: 30,
    academicStanding: "academic_probation", advisorId: advisor.id,
    brightFuturesAward: "academic_scholar", brightFuturesActive: true,
    degreeProgress: {
      aocName: null, aocCreditRequired: 40, aocCreditCompleted: 0, aocPercentComplete: 0,
      genEdRequired: 20, genEdCompleted: 12, ispsRequired: 3, ispsCompleted: 0, thesisStatus: "not_started",
      isps: [], minors: [],
    },
    semesterGpas: [
      { term: "Fall 2024",   termCode: "202409", gpa: 2.1, credits: 12, standing: "academic_warning" },
      { term: "Spring 2025", termCode: "202501", gpa: 1.7, credits: 10, standing: "academic_probation" },
    ],
    contracts: [
      { termCode: "202409", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-09-03"), totalCredits: 12, courses: [
        { courseCode: "PSYC 101", courseTitle: "Introduction to Psychology", credits: 4, instructorName: "Dr. Henderson" },
        { courseCode: "WRIT 100", courseTitle: "First-Year Writing Seminar", credits: 3, instructorName: "Dr. Patel" },
        { courseCode: "SOC 101", courseTitle: "Introduction to Sociology", credits: 4, instructorName: "Dr. Kim" },
      ]},
      { termCode: "202501", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-01-14"), totalCredits: 10, courses: [
        { courseCode: "PSYC 150", courseTitle: "Mind and Behavior", credits: 4, instructorName: "Dr. Henderson" },
        { courseCode: "WRIT 110", courseTitle: "Writing and Reasoning", credits: 3, instructorName: "Dr. Patel" },
      ]},
      { termCode: "202601", status: "not_started", signedByStudent: false, signedByAdvisor: false, totalCredits: 0, courses: [] },
    ],
    advising: [],
    earlyAlerts: [
      { alertType: "academic_concern", raisedBy: "Dr. Henderson", raisedAt: new Date("2025-11-12"), status: "open", notes: "Missing assignments and low quiz scores in PSYC 101. Student has not responded to two outreach attempts." },
    ],
    flags: [{ flagType: "tuition_hold", isActive: true, addedAt: new Date("2025-10-01") }],
    evaluations: [
      { instructorName: "Dr. Henderson", courseCode: "PSYC 101", courseTitle: "Introduction to Psychology", term: "Fall 2024", termCode: "202409", text: "Jordan showed genuine interest during the first half of the semester. However, attendance declined significantly after Week 8 and two major assignments were not submitted. I hope they are able to access the support they need going forward.", status: "satisfactory", submittedAt: new Date("2025-01-16") },
    ],
    tutoring: [],
    sscVisits: [],
    academicCoach: { coachName: "Coach Rivera", coachEmail: "arivera@ncf.edu", assignedAt: new Date("2026-01-20") },
    insights: [
      { insightType: "risk", insightCode: "bright_futures_risk", title: "Bright Futures scholarship at risk", body: "Current GPA (1.90) is below the Florida Academic Scholar maintenance threshold of 3.00. Scholarship may be suspended.", subtext: "Current GPA: 1.90 · Required: 3.00", ctaText: "→ Contact Financial Aid · Review course load", severity: "urgent" },
      { insightType: "risk", insightCode: "support_gap", title: "On probation — not accessing tutoring or SSC", body: "Jordan is on academic probation but has not accessed tutoring or the Student Success Center this semester.", subtext: "Tutoring sessions: 0 · SSC visits: 0", ctaText: "→ Refer to tutoring and SSC · Assign academic coach", severity: "urgent" },
    ],
  });

  // ── STUDENT 6: Sofia Martínez — First-Year Transfer ───────────────────────
  await seedStudent({
    id: "N2025-0008", firstName: "Sofia", lastName: "Martínez", preferredName: "Sofi",
    email: "sofia.martinez@ncf.edu", yearLevel: 1,
    declaredAoc: null, cumulativeGpa: 3.6, creditsEarned: 14, creditsAttempted: 14,
    academicStanding: "good_standing", advisorId: advisor.id,
    brightFuturesAward: "medallion_scholar", brightFuturesActive: true,
    isTransfer: true, transferCredits: 18,
    degreeProgress: {
      aocName: null, aocCreditRequired: 40, aocCreditCompleted: 0, aocPercentComplete: 0,
      genEdRequired: 20, genEdCompleted: 6, ispsRequired: 3, ispsCompleted: 0, thesisStatus: "not_started",
      isps: [], minors: [],
    },
    semesterGpas: [
      { term: "Fall 2025", termCode: "202509", gpa: 3.6, credits: 14, standing: "good_standing" },
    ],
    contracts: [
      { termCode: "202509", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-09-02"), totalCredits: 14, courses: [
        { courseCode: "WRIT 100", courseTitle: "First-Year Writing Seminar", credits: 3, instructorName: "Dr. Patel" },
        { courseCode: "SOC 110", courseTitle: "Introduction to Sociology", credits: 3, instructorName: "Dr. Kim" },
        { courseCode: "HIST 150", courseTitle: "Modern Latin American History", credits: 4, instructorName: "Dr. Almeida" },
      ]},
      { termCode: "202601", status: "in_progress", signedByStudent: false, signedByAdvisor: false, totalCredits: 12, courses: [
        { courseCode: "WRIT 110", courseTitle: "Advanced Writing", credits: 3, instructorName: "Dr. Patel" },
        { courseCode: "SOC 120", courseTitle: "Social Inequality", credits: 3, instructorName: "Dr. Kim" },
        { courseCode: "PHIL 101", courseTitle: "Introduction to Philosophy", credits: 3, instructorName: "Dr. Reyes" },
      ]},
    ],
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-02-12"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "First-semester check-in. Sofia is adjusting well as a transfer. Transfer credits evaluated — 18 accepted. Discussed possible AOC directions." },
    ],
    evaluations: [
      { instructorName: "Dr. Patel", courseCode: "WRIT 100", courseTitle: "First-Year Writing Seminar", term: "Fall 2025", termCode: "202509", text: "Sofia arrived as a strong writer and grew considerably over the semester. Her final essay on environmental policy demonstrated impressive research skills and analytical clarity unusual for a first-year student.", status: "satisfactory", submittedAt: new Date("2025-12-18") },
    ],
    tutoring: [
      { date: new Date("2026-02-08"), durationMins: 45, subject: "Sociology", courseCode: "SOC 110", tutorName: "Angela T.", sessionType: "in_person", termCode: "202509" },
    ],
    sscVisits: [
      { date: new Date("2025-09-18"), visitType: "scheduled", serviceType: "Orientation Workshop", staffName: "SSC Staff", notes: "New transfer student orientation to SSC services.", termCode: "202509" },
      { date: new Date("2026-02-19"), visitType: "drop_in", serviceType: "Writing Support", staffName: "Dr. Patel", notes: "Sociology essay outline review.", termCode: "202601" },
    ],
    insights: [],
  });

  // ── STUDENT 7: Marcus Rivera — Junior, Soccer ──────────────────────────────
  await seedStudent({
    id: "N2023-0221", firstName: "Marcus", lastName: "Rivera", preferredName: null,
    email: "marcus.rivera@ncf.edu", yearLevel: 3,
    declaredAoc: "Social Sciences (Political Science)", cumulativeGpa: 3.2,
    creditsEarned: 70, creditsAttempted: 72, academicStanding: "good_standing",
    advisorId: advisor.id, brightFuturesAward: "medallion_scholar", brightFuturesActive: true,
    isStudentAthlete: true, athleteSport: "Soccer",
    athletics: {
      sport: "Soccer", eligibilityStatus: "eligible", gpaRequired: 2.0, creditLoadRequired: 12,
      certHistory: [
        { term: "Fall 2023", status: "eligible" },
        { term: "Spring 2024", status: "eligible" },
        { term: "Fall 2024", status: "eligible" },
        { term: "Spring 2025", status: "eligible" },
      ],
      farNotes: "Strong academic performance. No eligibility concerns. Full-time status maintained across all semesters.",
    },
    degreeProgress: {
      aocName: "Political Science", aocCreditRequired: 36, aocCreditCompleted: 20, aocPercentComplete: 0.56,
      genEdRequired: 20, genEdCompleted: 16, ispsRequired: 3, ispsCompleted: 1, thesisStatus: "not_started",
      isps: [{ title: "Local Government and Civic Engagement", term: "Spring 2025", termCode: "202501", status: "completed", supervisor: "Dr. Morales" }],
      minors: [],
    },
    semesterGpas: [
      { term: "Fall 2023",   termCode: "202309", gpa: 3.1, credits: 14, standing: "good_standing" },
      { term: "Spring 2024", termCode: "202401", gpa: 3.2, credits: 15, standing: "good_standing" },
      { term: "Fall 2024",   termCode: "202409", gpa: 3.3, credits: 15, standing: "good_standing" },
      { term: "Spring 2025", termCode: "202501", gpa: 3.1, credits: 15, standing: "good_standing" },
    ],
    contracts: [
      { termCode: "202309", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2023-09-04"), totalCredits: 14, courses: [
        { courseCode: "WRIT 100", courseTitle: "First-Year Writing Seminar", credits: 3, instructorName: "Dr. Patel" },
        { courseCode: "POLS 101", courseTitle: "Introduction to Political Science", credits: 4, instructorName: "Dr. Morales" },
        { courseCode: "SOC 101", courseTitle: "Introduction to Sociology", credits: 4, instructorName: "Dr. Kim" },
      ]},
      { termCode: "202401", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-01-10"), totalCredits: 15, courses: [
        { courseCode: "POLS 201", courseTitle: "American Government", credits: 4, instructorName: "Dr. Morales" },
        { courseCode: "POLS 210", courseTitle: "Comparative Politics", credits: 4, instructorName: "Dr. Morales" },
        { courseCode: "ECON 101", courseTitle: "Introduction to Economics", credits: 4, instructorName: "Dr. Chen" },
      ]},
      { termCode: "202409", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-09-03"), totalCredits: 15, courses: [
        { courseCode: "POLS 301", courseTitle: "International Relations", credits: 4, instructorName: "Dr. Morales" },
        { courseCode: "POLS 310", courseTitle: "Political Theory", credits: 4, instructorName: "Dr. Morales" },
        { courseCode: "HIST 220", courseTitle: "U.S. Political History", credits: 4, instructorName: "Dr. Almeida" },
      ]},
      { termCode: "202501", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-01-09"), totalCredits: 15, courses: [
        { courseCode: "POLS 350", courseTitle: "Public Policy Analysis", credits: 4, instructorName: "Dr. Morales" },
        { courseCode: "ISP-005", courseTitle: "Local Government ISP", credits: 4, instructorName: "Dr. Morales" },
        { courseCode: "ECON 220", courseTitle: "Political Economy", credits: 4, instructorName: "Dr. Chen" },
      ]},
      { termCode: "202601", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-12-10"), totalCredits: 15, courses: [
        { courseCode: "POLS 380", courseTitle: "Environmental Politics", credits: 4, instructorName: "Dr. Morales" },
        { courseCode: "POLS 390", courseTitle: "Senior Seminar", credits: 4, instructorName: "Dr. Morales" },
        { courseCode: "SOC 310", courseTitle: "Social Movements", credits: 4, instructorName: "Dr. Kim" },
      ]},
    ],
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2023-09-15"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "First-year orientation. Marcus interested in political science and social change. Soccer schedule noted — will need to plan around practice times." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2024-09-11"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Year 2 planning. Declared Political Science AOC. Discussed ISP possibilities for next semester." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-03-20"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Spring check-in. On track. Thesis planning should begin next semester. Soccer season winding down." },
    ],
    evaluations: [
      { instructorName: "Dr. Morales", courseCode: "POLS 101", courseTitle: "Introduction to Political Science", term: "Fall 2023", termCode: "202309", text: "Marcus engaged thoughtfully with foundational concepts in political science. His written work was well-organized and his participation in seminar enriched our discussions, particularly on questions of civic participation. A strong first semester for a student-athlete managing competing demands.", status: "satisfactory", submittedAt: new Date("2024-01-10") },
      { instructorName: "Dr. Morales", courseCode: "POLS 310", courseTitle: "Political Theory", term: "Fall 2024", termCode: "202409", text: "Marcus produced excellent work in political theory this semester, engaging rigorously with primary texts. His essay on Rawlsian justice and sporting institutions showed creative interdisciplinary thinking. He manages his athletic commitments admirably without compromising academic work.", status: "satisfactory", submittedAt: new Date("2025-01-13") },
    ],
    tutoring: [
      { date: new Date("2024-02-15"), durationMins: 60, subject: "Economics", courseCode: "ECON 101", tutorName: "Ana P.", sessionType: "in_person", termCode: "202401" },
      { date: new Date("2026-02-22"), durationMins: 60, subject: "Political Science", courseCode: "POLS 380", tutorName: "Ana P.", sessionType: "in_person", termCode: "202601" },
    ],
    sscVisits: [
      { date: new Date("2024-03-10"), visitType: "drop_in", serviceType: "Academic Skills", staffName: "Coach Rivera", notes: "Balancing soccer season schedule with midterms.", termCode: "202401" },
    ],
    insights: [],
  });

  // ── STUDENT 8: Priya Nair — Sophomore, Softball ───────────────────────────
  await seedStudent({
    id: "N2024-0156", firstName: "Priya", lastName: "Nair", preferredName: null,
    email: "priya.nair@ncf.edu", yearLevel: 2,
    declaredAoc: "Natural Sciences (Environmental Science)", cumulativeGpa: 3.5,
    creditsEarned: 30, creditsAttempted: 30, academicStanding: "good_standing",
    advisorId: advisor.id, brightFuturesAward: "academic_scholar", brightFuturesActive: true,
    isStudentAthlete: true, athleteSport: "Softball",
    athletics: {
      sport: "Softball", eligibilityStatus: "eligible", gpaRequired: 2.0, creditLoadRequired: 12,
      certHistory: [
        { term: "Fall 2024", status: "eligible" },
        { term: "Spring 2025", status: "eligible" },
      ],
      farNotes: "Strong academic record. GPA well above the 2.0 minimum. Full-time status maintained.",
    },
    degreeProgress: {
      aocName: null, aocCreditRequired: 40, aocCreditCompleted: 6, aocPercentComplete: 0.15,
      genEdRequired: 20, genEdCompleted: 12, ispsRequired: 3, ispsCompleted: 0, thesisStatus: "not_started",
      isps: [], minors: [],
    },
    semesterGpas: [
      { term: "Fall 2024",   termCode: "202409", gpa: 3.5, credits: 15, standing: "good_standing" },
      { term: "Spring 2025", termCode: "202501", gpa: 3.5, credits: 15, standing: "good_standing" },
    ],
    contracts: [
      { termCode: "202409", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-09-02"), totalCredits: 15, courses: [
        { courseCode: "WRIT 100", courseTitle: "First-Year Writing Seminar", credits: 3, instructorName: "Dr. Patel" },
        { courseCode: "ENV 101", courseTitle: "Introduction to Environmental Science", credits: 4, instructorName: "Dr. Thompson" },
        { courseCode: "BIO 101", courseTitle: "Introduction to Biology", credits: 4, instructorName: "Dr. Park" },
      ]},
      { termCode: "202501", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-01-07"), totalCredits: 15, courses: [
        { courseCode: "ENV 201", courseTitle: "Ecology and Ecosystems", credits: 4, instructorName: "Dr. Thompson" },
        { courseCode: "CHEM 101", courseTitle: "General Chemistry", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "ENV 210", courseTitle: "Environmental Policy", credits: 4, instructorName: "Dr. Thompson" },
      ]},
      { termCode: "202601", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-12-09"), totalCredits: 15, courses: [
        { courseCode: "ENV 301", courseTitle: "Climate Science", credits: 4, instructorName: "Dr. Thompson" },
        { courseCode: "CHEM 201", courseTitle: "Organic Chemistry", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "STAT 200", courseTitle: "Intro to Statistics", credits: 3, instructorName: "Dr. Chen" },
      ]},
    ],
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2024-09-16"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "First-year orientation. Priya is interested in environmental science and climate policy. Softball season schedule noted — strong time management already evident." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2025-09-10"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Year 2 check-in. Exploring Environmental Science AOC. On track academically. Softball pre-season underway." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-03-14"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Spring meeting. Declared Environmental Science AOC. Discussed possible ISP in coastal ecology for Fall 2026." },
    ],
    evaluations: [
      { instructorName: "Dr. Thompson", courseCode: "ENV 101", courseTitle: "Introduction to Environmental Science", term: "Fall 2024", termCode: "202409", text: "Priya demonstrated a natural aptitude for systems thinking and a genuine passion for environmental issues. Her lab reports were meticulous and her participation in field exercises was enthusiastic and careful. A standout first-year student.", status: "satisfactory", submittedAt: new Date("2025-01-09") },
      { instructorName: "Dr. Thompson", courseCode: "ENV 201", courseTitle: "Ecology and Ecosystems", term: "Spring 2025", termCode: "202501", text: "Priya's understanding of ecological principles developed rapidly over the semester. Her ISP proposal for a coastal wetland survey showed strong scientific thinking and an ability to connect field observation to policy implications. I look forward to supervising her ISP work.", status: "satisfactory", submittedAt: new Date("2025-05-24") },
    ],
    tutoring: [
      { date: new Date("2025-02-18"), durationMins: 60, subject: "Chemistry", courseCode: "CHEM 101", tutorName: "Maria S.", sessionType: "in_person", termCode: "202501" },
      { date: new Date("2026-02-25"), durationMins: 60, subject: "Chemistry", courseCode: "CHEM 201", tutorName: "Maria S.", sessionType: "in_person", termCode: "202601" },
    ],
    sscVisits: [
      { date: new Date("2025-03-05"), visitType: "scheduled", serviceType: "Academic Skills", staffName: "Coach Rivera", notes: "Managing academic and athletic schedule during softball season.", termCode: "202501" },
    ],
    insights: [],
  });

  // ── STUDENT 9: Jake Thompson — Senior, Baseball, eligibility at risk ───────
  await seedStudent({
    id: "N2022-0091", firstName: "Jake", lastName: "Thompson", preferredName: null,
    email: "jake.thompson@ncf.edu", yearLevel: 4,
    declaredAoc: "Humanities (History)", cumulativeGpa: 2.1,
    creditsEarned: 98, creditsAttempted: 108, academicStanding: "academic_warning",
    advisorId: advisor.id, brightFuturesAward: null, brightFuturesActive: false,
    isStudentAthlete: true, athleteSport: "Baseball",
    athletics: {
      sport: "Baseball", eligibilityStatus: "at_risk", gpaRequired: 2.0, creditLoadRequired: 12,
      certHistory: [
        { term: "Fall 2022", status: "eligible" },
        { term: "Spring 2023", status: "eligible" },
        { term: "Fall 2023", status: "eligible" },
        { term: "Spring 2024", status: "at_risk" },
        { term: "Fall 2024", status: "at_risk" },
        { term: "Spring 2025", status: "at_risk" },
      ],
      farNotes: "GPA has been declining for three consecutive semesters and is now 0.10 above the 2.0 minimum eligibility threshold. Student must improve GPA this semester to maintain eligibility for the Spring 2026 season. Immediate advising intervention required.",
    },
    degreeProgress: {
      aocName: "History", aocCreditRequired: 36, aocCreditCompleted: 28, aocPercentComplete: 0.78,
      genEdRequired: 20, genEdCompleted: 18, ispsRequired: 3, ispsCompleted: 2,
      thesisStatus: "sponsor_identified", thesisSponsor: "Dr. Almeida",
      projectedGradTerm: "Spring 2026", projectedGradTermCode: "202601", onTrackForGraduation: true,
      isps: [
        { title: "Civil Rights Era Oral History", term: "Fall 2023", termCode: "202309", status: "completed", supervisor: "Dr. Almeida" },
        { title: "Florida Political History", term: "Spring 2025", termCode: "202501", status: "completed", supervisor: "Dr. Almeida" },
      ],
      minors: [],
    },
    semesterGpas: [
      { term: "Fall 2022",   termCode: "202209", gpa: 3.2, credits: 15, standing: "good_standing" },
      { term: "Spring 2023", termCode: "202301", gpa: 2.8, credits: 15, standing: "good_standing" },
      { term: "Fall 2023",   termCode: "202309", gpa: 2.5, credits: 15, standing: "good_standing" },
      { term: "Spring 2024", termCode: "202401", gpa: 2.3, credits: 15, standing: "good_standing" },
      { term: "Fall 2024",   termCode: "202409", gpa: 2.0, credits: 12, standing: "academic_warning" },
      { term: "Spring 2025", termCode: "202501", gpa: 1.8, credits: 12, standing: "academic_warning" },
    ],
    contracts: [
      { termCode: "202209", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2022-09-03"), totalCredits: 15, courses: [
        { courseCode: "HIST 101", courseTitle: "Introduction to History", credits: 4, instructorName: "Dr. Almeida" },
        { courseCode: "WRIT 100", courseTitle: "First-Year Writing Seminar", credits: 3, instructorName: "Dr. Patel" },
        { courseCode: "ANTH 101", courseTitle: "Cultural Anthropology", credits: 4, instructorName: "Dr. Kim" },
      ]},
      { termCode: "202301", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2023-01-08"), totalCredits: 15, courses: [
        { courseCode: "HIST 201", courseTitle: "American History", credits: 4, instructorName: "Dr. Almeida" },
        { courseCode: "HIST 210", courseTitle: "World History", credits: 4, instructorName: "Dr. Almeida" },
        { courseCode: "POLS 101", courseTitle: "Introduction to Political Science", credits: 4, instructorName: "Dr. Morales" },
      ]},
      { termCode: "202309", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2023-09-05"), totalCredits: 15, courses: [
        { courseCode: "HIST 301", courseTitle: "Civil Rights and Social Movements", credits: 4, instructorName: "Dr. Almeida" },
        { courseCode: "ISP-006", courseTitle: "Civil Rights Oral History ISP", credits: 5, instructorName: "Dr. Almeida" },
        { courseCode: "HIST 310", courseTitle: "The American South", credits: 4, instructorName: "Dr. Almeida" },
      ]},
      { termCode: "202401", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-01-10"), totalCredits: 15, courses: [
        { courseCode: "HIST 320", courseTitle: "Florida History", credits: 4, instructorName: "Dr. Almeida" },
        { courseCode: "HIST 330", courseTitle: "Colonial History", credits: 4, instructorName: "Dr. Almeida" },
        { courseCode: "WRIT 200", courseTitle: "Advanced Writing", credits: 3, instructorName: "Dr. Patel" },
      ]},
      { termCode: "202409", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-09-04"), totalCredits: 12, courses: [
        { courseCode: "HIST 401", courseTitle: "Historiography", credits: 4, instructorName: "Dr. Almeida" },
        { courseCode: "HIST 410", courseTitle: "History of Democracy", credits: 4, instructorName: "Dr. Almeida" },
      ]},
      { termCode: "202501", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-01-08"), totalCredits: 12, courses: [
        { courseCode: "HIST 420", courseTitle: "Historical Methods", credits: 4, instructorName: "Dr. Almeida" },
        { courseCode: "ISP-007", courseTitle: "Florida Political History ISP", credits: 4, instructorName: "Dr. Almeida" },
      ]},
      { termCode: "202601", status: "in_progress", signedByStudent: true, signedByAdvisor: false, totalCredits: 14, courses: [
        { courseCode: "THESIS", courseTitle: "Senior Thesis — Florida Civil Rights", credits: 8, instructorName: "Dr. Almeida" },
        { courseCode: "HIST 430", courseTitle: "Senior Seminar", credits: 4, instructorName: "Dr. Almeida" },
      ]},
    ],
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2022-09-13"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "First-year orientation. Jake is interested in American history, particularly civil rights. Baseball schedule noted." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2024-02-12"), duration: 45, meetingType: "in_person", outcome: "met", noteText: "GPA concern flagged. Declining trend over 2 semesters. Discussed time management and reducing outside commitments during baseball season." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2025-01-14"), duration: 45, meetingType: "in_person", outcome: "met", noteText: "Athletics eligibility at risk. GPA at 2.0 — must maintain above threshold this semester. FAR has been notified. Referred to tutoring and SSC." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-03-25"), duration: 60, meetingType: "in_person", outcome: "met", noteText: "Urgent eligibility meeting. Current GPA 2.1 — just above threshold. Thesis with Dr. Almeida identified. Must maintain credits and GPA through semester." },
    ],
    evaluations: [
      { instructorName: "Dr. Almeida", courseCode: "HIST 101", courseTitle: "Introduction to History", term: "Fall 2022", termCode: "202209", text: "Jake showed strong enthusiasm for historical inquiry in his first semester. His written work was competent and he participated actively in seminar. There are signs of a genuine historical imagination here worth cultivating.", status: "satisfactory", submittedAt: new Date("2023-01-06") },
      { instructorName: "Dr. Almeida", courseCode: "HIST 301", courseTitle: "Civil Rights and Social Movements", term: "Fall 2023", termCode: "202309", text: "Jake's oral history project was one of the most moving pieces of student work I have supervised. His interviews with local civil rights veterans showed empathy and historical rigor. However, his seminar attendance was inconsistent this term.", status: "satisfactory", submittedAt: new Date("2024-01-12") },
      { instructorName: "Dr. Almeida", courseCode: "HIST 401", courseTitle: "Historiography", term: "Fall 2024", termCode: "202409", text: "Jake's engagement with historiographical debates was thoughtful when present. However, two major writing assignments were late and the quality of work was below his demonstrated ability. I am concerned that his performance is not reflecting his actual understanding of the material.", status: "satisfactory", submittedAt: new Date("2025-01-15") },
    ],
    tutoring: [
      { date: new Date("2025-02-08"), durationMins: 60, subject: "History Writing", courseCode: "HIST 420", tutorName: "James R.", sessionType: "in_person", termCode: "202501" },
      { date: new Date("2025-02-22"), durationMins: 60, subject: "History Writing", courseCode: "HIST 420", tutorName: "James R.", sessionType: "in_person", termCode: "202501" },
      { date: new Date("2026-02-14"), durationMins: 60, subject: "Thesis Writing", courseCode: "THESIS", tutorName: "James R.", sessionType: "in_person", termCode: "202601" },
      { date: new Date("2026-03-07"), durationMins: 60, subject: "Thesis Writing", courseCode: "THESIS", tutorName: "James R.", sessionType: "in_person", termCode: "202601" },
    ],
    sscVisits: [
      { date: new Date("2025-02-25"), visitType: "scheduled", serviceType: "Academic Skills", staffName: "Coach Rivera", notes: "GPA recovery plan for spring semester.", termCode: "202501" },
      { date: new Date("2026-01-30"), visitType: "scheduled", serviceType: "Academic Skills", staffName: "Coach Rivera", notes: "Thesis time management and eligibility monitoring.", termCode: "202601" },
    ],
    academicCoach: { coachName: "Coach Rivera", coachEmail: "arivera@ncf.edu", assignedAt: new Date("2025-01-14") },
    msprs: [
      { term: "Spring 2026", termCode: "202601", courseCode: "HIST 430", courseTitle: "Senior Seminar", instructorName: "Dr. Almeida", rating: "at_risk", attendance: "irregular", feedback: "Jake's thesis progress is behind schedule and seminar attendance has slipped. Given the eligibility situation, immediate intervention is warranted.", submittedAt: new Date("2026-03-04") },
      { term: "Spring 2026", termCode: "202601", courseCode: "THESIS", courseTitle: "Senior Thesis", instructorName: "Dr. Almeida", rating: "concern", attendance: "good", feedback: "Engaged in meetings but written output is behind the expected milestone for this point in the term.", submittedAt: new Date("2026-03-04") },
    ],
    insights: [
      { insightType: "risk", insightCode: "athletics_eligibility", title: "Baseball eligibility at risk — GPA 0.10 above minimum", body: "Jake's cumulative GPA (2.10) is just above the 2.0 NAIA Sun Conference eligibility threshold. Three consecutive semesters of decline. Any further drop triggers ineligibility.", subtext: "Current GPA: 2.10 · Minimum: 2.00 · Buffer: +0.10", ctaText: "→ Coordinate with Athletics FAR · Monitor midterm performance", severity: "urgent" },
      { insightType: "risk", insightCode: "gpa_trend", title: "GPA declining for 4 consecutive semesters", body: "GPA trend: 3.2 → 2.8 → 2.5 → 2.3 → 2.0 → 1.8 → 2.1. Pattern suggests persistent difficulty. Thesis semester adds significant workload.", subtext: "Current: 2.10 · Threshold: 2.0", ctaText: "→ Increase tutoring frequency · Weekly check-ins", severity: "warning" },
    ],
  });

  // ── STUDENT 10: Emma Walsh — Junior, Tennis ───────────────────────────────
  await seedStudent({
    id: "N2023-0179", firstName: "Emma", lastName: "Walsh", preferredName: null,
    email: "emma.walsh@ncf.edu", yearLevel: 3,
    declaredAoc: "Natural Sciences (Chemistry)", cumulativeGpa: 3.9,
    creditsEarned: 76, creditsAttempted: 76, academicStanding: "good_standing",
    advisorId: advisor.id, brightFuturesAward: "academic_scholar", brightFuturesActive: true,
    isStudentAthlete: true, athleteSport: "Tennis",
    athletics: {
      sport: "Tennis", eligibilityStatus: "eligible", gpaRequired: 2.0, creditLoadRequired: 12,
      certHistory: [
        { term: "Fall 2023", status: "eligible" },
        { term: "Spring 2024", status: "eligible" },
        { term: "Fall 2024", status: "eligible" },
        { term: "Spring 2025", status: "eligible" },
      ],
      farNotes: "Excellent academic record. No eligibility concerns. One of the strongest student-athletes in the program academically.",
    },
    degreeProgress: {
      aocName: "Chemistry", aocCreditRequired: 40, aocCreditCompleted: 26, aocPercentComplete: 0.65,
      genEdRequired: 20, genEdCompleted: 18, ispsRequired: 3, ispsCompleted: 1,
      thesisStatus: "not_started", thesisSponsor: null,
      isps: [{ title: "Organic Synthesis Lab Research", term: "Spring 2025", termCode: "202501", status: "completed", supervisor: "Dr. Iversen" }],
      minors: [{ minorName: "Mathematics", isDeclared: true, coursesRequired: 6, coursesCompleted: 4, percentComplete: 0.67, coursesNeeded: ["MATH 310", "MATH 320"] }],
    },
    semesterGpas: [
      { term: "Fall 2023",   termCode: "202309", gpa: 3.8, credits: 15, standing: "good_standing" },
      { term: "Spring 2024", termCode: "202401", gpa: 3.9, credits: 15, standing: "good_standing" },
      { term: "Fall 2024",   termCode: "202409", gpa: 4.0, credits: 15, standing: "good_standing" },
      { term: "Spring 2025", termCode: "202501", gpa: 3.9, credits: 15, standing: "good_standing" },
    ],
    contracts: [
      { termCode: "202309", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2023-09-01"), totalCredits: 15, courses: [
        { courseCode: "CHEM 101", courseTitle: "General Chemistry I", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "WRIT 100", courseTitle: "First-Year Writing Seminar", credits: 3, instructorName: "Dr. Patel" },
        { courseCode: "MATH 150", courseTitle: "Calculus I", credits: 4, instructorName: "Dr. Becker" },
      ]},
      { termCode: "202401", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-01-07"), totalCredits: 15, courses: [
        { courseCode: "CHEM 201", courseTitle: "Organic Chemistry I", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "CHEM 210", courseTitle: "Analytical Chemistry", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "MATH 201", courseTitle: "Calculus II", credits: 4, instructorName: "Dr. Becker" },
      ]},
      { termCode: "202409", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2024-09-02"), totalCredits: 15, courses: [
        { courseCode: "CHEM 301", courseTitle: "Physical Chemistry", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "CHEM 310", courseTitle: "Organic Chemistry II", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "MATH 250", courseTitle: "Linear Algebra", credits: 4, instructorName: "Dr. Becker" },
      ]},
      { termCode: "202501", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-01-06"), totalCredits: 15, courses: [
        { courseCode: "CHEM 350", courseTitle: "Biochemistry", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "ISP-008", courseTitle: "Organic Synthesis ISP", credits: 5, instructorName: "Dr. Iversen" },
        { courseCode: "MATH 260", courseTitle: "Probability and Statistics", credits: 4, instructorName: "Dr. Becker" },
      ]},
      { termCode: "202601", status: "signed", signedByStudent: true, signedByAdvisor: true, signedAt: new Date("2025-12-03"), totalCredits: 15, courses: [
        { courseCode: "CHEM 401", courseTitle: "Advanced Organic Chemistry", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "CHEM 410", courseTitle: "Chemistry Research Methods", credits: 4, instructorName: "Dr. Iversen" },
        { courseCode: "MATH 310", courseTitle: "Real Analysis", credits: 4, instructorName: "Dr. Becker" },
      ]},
    ],
    advising: [
      { advisorName: "Dr. Faculty Advisor", date: new Date("2023-09-13"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "First-year orientation. Emma is exceptionally focused — Chemistry AOC from day one. Tennis schedule will require careful planning." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2024-09-08"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Year 2 planning. Emma declared Chemistry AOC and Mathematics minor. ISP proposal with Dr. Iversen approved." },
      { advisorName: "Dr. Faculty Advisor", date: new Date("2026-03-16"), duration: 30, meetingType: "in_person", outcome: "met", noteText: "Spring check-in. Excellent progress on all fronts. Discussed thesis possibilities — Dr. Iversen expects to supervise. Tennis season going well." },
    ],
    evaluations: [
      { instructorName: "Dr. Iversen", courseCode: "CHEM 101", courseTitle: "General Chemistry I", term: "Fall 2023", termCode: "202309", text: "Emma is the most academically able first-year student I have taught in the past five years. Her mastery of quantitative chemistry concepts was complete and her lab technique was exceptional. She will go far in chemistry.", status: "satisfactory", submittedAt: new Date("2024-01-09") },
      { instructorName: "Dr. Iversen", courseCode: "CHEM 301", courseTitle: "Physical Chemistry", term: "Fall 2024", termCode: "202409", text: "Emma continues to exceed all expectations. Her work in physical chemistry — particularly on thermodynamic models — was graduate-level in sophistication. She approaches problems creatively and communicates her reasoning with unusual clarity. Honors distinction seems likely.", status: "satisfactory", submittedAt: new Date("2025-01-11") },
      { instructorName: "Dr. Becker", courseCode: "MATH 250", courseTitle: "Linear Algebra", term: "Fall 2024", termCode: "202409", text: "Emma brings mathematical rigor and intuition to every problem set. Her final project applying linear algebra to spectroscopic data showed genuine interdisciplinary thinking. A pleasure to have in class.", status: "satisfactory", submittedAt: new Date("2025-01-14") },
    ],
    tutoring: [],
    sscVisits: [
      { date: new Date("2024-10-20"), visitType: "drop_in", serviceType: "Writing Support", staffName: "Dr. Patel", notes: "Lab report writing for Physical Chemistry.", termCode: "202409" },
    ],
    insights: [
      { insightType: "opportunity", insightCode: "honors_path", title: "On track for honors distinction", body: "Emma's GPA (3.90) and course trajectory align with honors designation criteria. Dr. Iversen has indicated willingness to supervise a high-distinction thesis.", subtext: "Current GPA: 3.90 · 4 semesters of excellent evaluations", ctaText: "→ Discuss honors thesis option with Emma and Dr. Iversen", severity: "info" },
      { insightType: "opportunity", insightCode: "minor_proximity", title: "2 courses from completing Mathematics Minor", body: "Emma has completed 4 of 6 required courses for the Mathematics minor (67%). MATH 310 is on the Spring 26 contract.", subtext: "Completed: 4/6 courses · Status: Declared", ctaText: "→ Confirm MATH 320 for next semester", severity: "info" },
    ],
  });

  // ── Bulk synthetic students for scale testing (~250/year → ~1000) ──────────
  // A few are assigned as advisees so each demo account has a realistic caseload
  // (mlopezzafra: 10 heroes + 5 = 15; faculty: 15). The rest are unassigned and
  // appear only in "All Students".
  const bulkCount = await generateBulkStudents(250, { provostId: advisor.id, facultyId: fac.id });

  console.log("Seed complete.");
  console.log(`  Advisor: ${advisor.email} (tier ${advisor.accessTier})`);
  console.log(`  Faculty: ${fac.email} (tier ${fac.accessTier})`);
  console.log(`  10 hero students + ${bulkCount} generated = ${10 + bulkCount} total`);
}

// ════════════════════════════════════════════════════════════════════════════
// Bulk generator — efficient createMany with self-assigned IDs (no per-row await)
// ════════════════════════════════════════════════════════════════════════════

const FIRST_NAMES = [
  "Liam","Olivia","Noah","Emma","Oliver","Ava","Elijah","Sophia","Mateo","Isabella",
  "Lucas","Mia","Levi","Amelia","Asher","Harper","James","Evelyn","Leo","Luna",
  "Ezra","Camila","Aiden","Gianna","Sebastian","Elena","Daniel","Layla","Michael","Nora",
  "Kai","Zoe","Omar","Aaliyah","Andre","Priya","Diego","Maya","Tariq","Sofia",
  "Hana","Yuki","Ravi","Nina","Marcus","Aisha","Felix"," Imani","Theo","Carmen",
  "Jamal","Lucia","Wei","Anya","Kofi","Esperanza","Dmitri","Fatima","Sven","Rosa",
];
const LAST_NAMES = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Martinez","Davis","Rodriguez","Lopez",
  "Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez",
  "Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young",
  "Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams",
  "Nakamura","Okafor","Patel","Cohen","Rossi","Kim","Mbeki","Haddad","Andersson","Reyes",
];
const AOCS = [
  "Natural Sciences (Biology)","Natural Sciences (Chemistry)","Natural Sciences (Physics)",
  "Natural Sciences (Mathematics)","Natural Sciences (Environmental Science)",
  "Humanities (Literature)","Humanities (History)","Humanities (Philosophy)","Humanities (Art History)",
  "Social Sciences (Psychology)","Social Sciences (Political Science)","Social Sciences (Economics)",
  "Social Sciences (Anthropology)","Social Sciences (Sociology)",
];
const SPORTS = ["Soccer","Baseball","Softball","Tennis","Swimming","Basketball","Cross Country","Volleyball","Golf"];

// Deterministic PRNG so reseeds are stable.
let _seed = 123456789;
function rnd(): number {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
function pick<T>(arr: T[]): T { return arr[Math.floor(rnd() * arr.length)]; }
function range(min: number, max: number): number { return min + rnd() * (max - min); }

const HERO_IDS = [
  "N2022-0034","N2022-0091","N2023-0012","N2023-0055","N2023-0101",
  "N2023-0179","N2023-0221","N2024-0087","N2024-0156","N2025-0008",
];

async function generateBulkStudents(
  perYear: number,
  advisors: { provostId: string; facultyId: string },
): Promise<number> {
  // Idempotent: remove any previously generated students (cascades to children),
  // leaving the 10 hand-crafted hero students intact.
  await prisma.student.deleteMany({ where: { id: { notIn: HERO_IDS } } });

  // Assign the first few generated students as advisees so each demo account
  // has a realistic caseload. The 10 heroes already belong to the provost.
  let assignedProvost = 0; // target 5 (→ 15 with heroes)
  let assignedFaculty = 0; // target 15

  const students: any[] = [];
  const semGpas: any[] = [];
  const degreeProgress: any[] = [];
  const athletics: any[] = [];
  const contracts: any[] = [];
  const insights: any[] = [];
  const evaluations: any[] = [];
  const tutoring: any[] = [];
  const sscVisits: any[] = [];

  let counter = 1000; // start high to avoid colliding with hero IDs

  for (let yearLevel = 1; yearLevel <= 4; yearLevel++) {
    const enrollYear = 2026 - yearLevel; // senior→2022 … first-year→2025
    for (let i = 0; i < perYear; i++) {
      counter++;
      const id = `N${enrollYear}-${counter}`;
      const firstName = pick(FIRST_NAMES).trim();
      const lastName = pick(LAST_NAMES);
      const isAthlete = rnd() < 0.15;
      const isTransfer = !isAthlete && rnd() < 0.12 && yearLevel <= 3;

      // GPA weighted toward 2.8–3.8
      let gpa = Math.round(range(1.5, 4.0) * 100) / 100;
      if (rnd() < 0.6) gpa = Math.round(range(2.8, 3.9) * 100) / 100;
      const standing = gpa < 1.9 ? "academic_probation" : gpa < 2.2 ? "academic_warning" : "good_standing";

      const creditsEarned = Math.min(120, Math.round((yearLevel - 1) * 30 + range(4, 28)));
      const aoc = yearLevel >= 2 ? pick(AOCS) : (rnd() < 0.4 ? pick(AOCS) : null);
      const sport = isAthlete ? pick(SPORTS) : null;
      const bfAward = rnd() < 0.4 ? pick(["academic_scholar", "medallion_scholar"]) : null;

      // Assign a small caseload to each demo account; everyone else unassigned.
      let assigned: string | null = null;
      if (assignedProvost < 5) { assigned = advisors.provostId; assignedProvost++; }
      else if (assignedFaculty < 15) { assigned = advisors.facultyId; assignedFaculty++; }

      students.push({
        id, firstName, lastName, preferredName: null,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${counter}@ncf.edu`,
        enrollmentStatus: "full-time", yearLevel, declaredAoc: aoc,
        cumulativeGpa: gpa, creditsEarned, creditsAttempted: creditsEarned + Math.round(range(0, 8)),
        academicStanding: standing, advisorId: assigned,
        brightFuturesAward: bfAward, brightFuturesActive: bfAward !== null,
        isTransfer, transferCredits: isTransfer ? Math.round(range(12, 30)) : 0,
        isStudentAthlete: isAthlete, athleteSport: sport,
        bannerSyncedAt: new Date(),
      });

      // Semester GPAs (2 per completed year)
      const numTerms = yearLevel * 2 - 1;
      for (let t = 0; t < numTerms; t++) {
        const yr = enrollYear + Math.floor(t / 2);
        const isFall = t % 2 === 0;
        const termCode = `${yr}${isFall ? "09" : "01"}`;
        const termGpa = Math.max(0.5, Math.min(4.0, Math.round((gpa + range(-0.4, 0.4)) * 100) / 100));
        semGpas.push({
          studentId: id, term: term(termCode), termCode,
          gpa: termGpa, credits: Math.round(range(12, 16)),
          standing: termGpa < 1.9 ? "academic_probation" : termGpa < 2.2 ? "academic_warning" : "good_standing",
        });
      }

      // Degree progress
      const aocPct = Math.min(1, creditsEarned / 120 + range(-0.1, 0.1));
      degreeProgress.push({
        studentId: id, aocName: aoc ? aoc.replace(/^.*\((.*)\)$/, "$1") : null,
        aocCreditRequired: 40, aocCreditCompleted: Math.round(aocPct * 40),
        aocPercentComplete: Math.round(aocPct * 100) / 100,
        genEdRequired: 20, genEdCompleted: Math.min(20, Math.round(yearLevel * 5 + range(0, 4))),
        ispsRequired: 3, ispsCompleted: Math.min(3, Math.max(0, yearLevel - 1)),
        thesisStatus: yearLevel === 4 ? pick(["not_started", "sponsor_identified", "in_progress"]) : "not_started",
        thesisSponsor: null, totalCreditsRequired: 120, totalCreditsEarned: creditsEarned,
        onTrackForGraduation: standing === "good_standing", syncedAt: new Date(),
      });

      // Athletics record
      if (isAthlete) {
        athletics.push({
          studentId: id, sport: sport!, gpaRequired: 2.0, creditLoadRequired: 12,
          eligibilityStatus: gpa < 2.3 ? "at_risk" : "eligible",
          semesterCertHistory: "[]",
          farNotes: gpa < 2.3 ? "GPA near the 2.0 NAIA Sun Conference eligibility threshold. Monitor closely." : "Meets all NAIA Sun Conference eligibility requirements.",
          syncedAt: new Date(),
        });
      }

      // Current-term contract
      const cStatus = pick(["signed", "signed", "signed", "in_progress", "pending_advisor", "not_started"]);
      contracts.push({
        id: `c_${id}_202601`, studentId: id, term: "Spring 2026", termCode: "202601",
        status: cStatus, signedByStudent: cStatus !== "not_started",
        signedByAdvisor: cStatus === "signed", totalCredits: cStatus === "not_started" ? 0 : Math.round(range(12, 16)),
        syncedAt: new Date(),
      });

      // At-risk insight
      if (standing === "academic_probation") {
        insights.push({
          studentId: id, insightType: "risk", insightCode: "gpa_trend",
          title: "GPA below good-standing threshold", body: `Cumulative GPA ${gpa.toFixed(2)} places this student on academic probation.`,
          subtext: `Current: ${gpa.toFixed(2)} · Threshold: 2.00`, ctaText: "→ Review support access and course load",
          severity: "urgent",
        });
      }

      // Narrative evaluations — real NCF courses (matched to AOC division) +
      // real evaluation designations. Lower-GPA students skew toward marginal/unsat.
      const division = divisionFromAoc(aoc);
      const pool = coursesForDivision(division);
      const prefix = DIV_PREFIX[division] ?? "NCF";
      const numEvals = Math.min(5, Math.max(1, yearLevel + 1));
      for (let e = 0; e < numEvals; e++) {
        const course = pool[(counter + e) % pool.length];
        // Bias designation by GPA: strong students get better designations.
        const r = gpa >= 3.3 ? rnd() * 0.55 : gpa >= 2.5 ? rnd() * 0.8 + 0.1 : rnd() * 0.5 + 0.5;
        const designation = pickDesignation(Math.min(0.999, r));
        const yr = enrollYear + Math.min(yearLevel - 1, Math.floor(e / 2));
        const tc = `${yr}${e % 2 === 0 ? "09" : "01"}`;
        evaluations.push({
          studentId: id,
          instructorName: course.instructor,
          courseCode: `${prefix} ${200 + ((counter + e) % 250)}`,
          courseTitle: course.title,
          term: term(tc),
          termCode: tc,
          evaluationText: evalText(designation, course.title),
          designation,
          status: designationToStatus(designation),
          submittedAt: new Date(`${yr}-12-15`),
          syncedAt: new Date(),
        });
      }

      // Academic service usage — derived from real NCF Learning Commons weekly
      // reports (Study Hall, SSC, Knack/ARC tutoring, Writing, Academic Coaching).
      // Engagement is biased by need: athletes use Study Hall; lower-GPA and
      // at-risk students use SSC/coaching more; everyone may use peer tutoring.
      const svcYear = 2026; // current academic year activity
      function sscDate(monthOffset: number) {
        const base = rnd() < 0.5 ? new Date("2025-10-01") : new Date("2026-02-15");
        return new Date(base.getTime() + monthOffset * 86400000 * 14 * rnd());
      }

      // Athletics study hall (most athletes participate)
      if (isAthlete && rnd() < 0.85) {
        const nSessions = 1 + Math.floor(rnd() * 4);
        for (let v = 0; v < nSessions; v++) {
          sscVisits.push({
            studentId: id, visitDate: sscDate(v), visitType: "scheduled",
            serviceType: "Athletics Study Hall",
            staffName: "Athletics Academic Support",
            notes: "Required student-athlete study hall hours.",
            termCode: "202601", _term: true,
          });
        }
      }

      // Student Success Center — heaviest for at-risk students
      const sscProb = standing === "academic_probation" ? 0.9 : standing === "academic_warning" ? 0.7 : 0.28;
      if (rnd() < sscProb) {
        const nVisits = 1 + Math.floor(rnd() * (standing === "good_standing" ? 2 : 4));
        for (let v = 0; v < nVisits; v++) {
          sscVisits.push({
            studentId: id, visitDate: sscDate(v), visitType: rnd() < 0.5 ? "drop_in" : "scheduled",
            serviceType: "Student Success Center",
            staffName: "SSC Staff",
            notes: "Academic success check-in and resource referral.",
            termCode: "202601", _term: true,
          });
        }
      }

      // Academic coaching — short, frequent for students needing structure
      if (rnd() < (standing === "good_standing" ? 0.15 : 0.45)) {
        sscVisits.push({
          studentId: id, visitDate: sscDate(0), visitType: "scheduled",
          serviceType: "Academic Coaching",
          staffName: "Coach Rivera",
          notes: "Time management and study strategies.",
          termCode: "202601", _term: true,
        });
      }

      // Peer tutoring (Knack) / ARC tutoring — subject matched where possible
      const tutoringProb = gpa < 2.5 ? 0.6 : gpa < 3.2 ? 0.4 : 0.22;
      if (rnd() < tutoringProb) {
        const nSessions = 1 + Math.floor(rnd() * 3);
        for (let v = 0; v < nSessions; v++) {
          const subject = TUTORING_SUBJECTS[(counter + v) % TUTORING_SUBJECTS.length];
          const isKnack = rnd() < 0.75; // Knack is more popular than ARC
          tutoring.push({
            studentId: id, sessionDate: sscDate(v),
            durationMins: isKnack ? 60 + Math.floor(rnd() * 60) : 45 + Math.floor(rnd() * 75),
            subject,
            courseCode: `${subjectPrefix(subject)} ${100 + Math.floor(rnd() * 300)}`,
            tutorName: isKnack ? "Peer Tutor (Knack)" : "ARC Tutor",
            sessionType: isKnack ? "peer_tutoring" : "scheduled",
            termCode: "202601", _term: true,
          });
        }
      }

      // Writing Resource Center
      if (rnd() < 0.18) {
        const subject = "Writing";
        tutoring.push({
          studentId: id, sessionDate: sscDate(0),
          durationMins: 45 + Math.floor(rnd() * 45),
          subject,
          courseCode: `WRIT ${100 + Math.floor(rnd() * 200)}`,
          tutorName: "Writing Consultant (WRC)",
          sessionType: "drop_in",
          termCode: "202601", _term: true,
        });
      }
    }
  }

  // Bulk insert in dependency order
  await prisma.student.createMany({ data: students });
  await prisma.semesterGpa.createMany({ data: semGpas });
  await prisma.degreeProgress.createMany({ data: degreeProgress });
  if (athletics.length) await prisma.athleticsRecord.createMany({ data: athletics });
  await prisma.contract.createMany({ data: contracts });
  if (insights.length) await prisma.predictiveInsight.createMany({ data: insights });
  if (evaluations.length) await prisma.evaluation.createMany({ data: evaluations });
  if (tutoring.length)
    await prisma.tutoringSession.createMany({
      data: tutoring.map((t) => ({
        studentId: t.studentId, sessionDate: t.sessionDate, durationMins: t.durationMins,
        subject: t.subject, courseCode: t.courseCode, tutorName: t.tutorName,
        sessionType: t.sessionType, wasNoShow: false,
        term: term(t.termCode), termCode: t.termCode, syncedAt: new Date(),
      })),
    });
  if (sscVisits.length)
    await prisma.sSCVisit.createMany({
      data: sscVisits.map((v) => ({
        studentId: v.studentId, visitDate: v.visitDate, visitType: v.visitType,
        serviceType: v.serviceType, staffName: v.staffName, notes: v.notes,
        term: term(v.termCode), termCode: v.termCode, syncedAt: new Date(),
      })),
    });

  return students.length;
}

// ─── Types ────────────────────────────────────────────────────────────────────
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
  termCode: string; status: string; signedByStudent: boolean; signedByAdvisor: boolean;
  signedAt?: Date; totalCredits: number;
  courses: { courseCode: string; courseTitle: string; credits: number; instructorName?: string }[];
}
interface SeedAdvising { advisorName: string; date: Date; duration: number; meetingType: string; outcome: string; noteText?: string }
interface SeedEarlyAlert { alertType: string; raisedBy: string; raisedAt: Date; status: string; notes?: string }
interface SeedFlag { flagType: string; isActive: boolean; addedAt: Date }
interface SeedEval { instructorName: string; courseCode: string; courseTitle: string; term: string; termCode: string; text: string; status: string; submittedAt: Date }
interface SeedMSPR { term: string; termCode: string; courseCode: string; courseTitle: string; instructorName: string; rating: string; attendance?: string; feedback?: string; submittedAt: Date }
interface SeedTutoring { date: Date; durationMins: number; subject: string; courseCode?: string; tutorName?: string; sessionType: string; termCode: string }
interface SeedSSC { date: Date; visitType: string; serviceType: string; staffName?: string; notes?: string; termCode: string }
interface SeedCoach { coachName: string; coachEmail?: string; assignedAt?: Date }
interface SeedAthletics { sport: string; eligibilityStatus: string; gpaRequired: number; creditLoadRequired: number; certHistory?: { term: string; status: string }[]; farNotes?: string }
interface SeedInsight { insightType: string; insightCode: string; title: string; body: string; subtext?: string; ctaText?: string; severity: string }

interface SeedStudent {
  id: string; firstName: string; lastName: string; preferredName: string | null; email: string;
  yearLevel: number; declaredAoc: string | null; cumulativeGpa: number | null;
  creditsEarned: number; creditsAttempted: number; academicStanding: string;
  advisorId: string | null; brightFuturesAward: string | null; brightFuturesActive: boolean;
  isTransfer?: boolean; transferCredits?: number; isStudentAthlete?: boolean; athleteSport?: string | null;
  degreeProgress: SeedDegreeProgress; semesterGpas: SeedSemesterGpa[];
  contracts: SeedContract[]; advising: SeedAdvising[];
  earlyAlerts?: SeedEarlyAlert[]; flags?: SeedFlag[]; msprs?: SeedMSPR[];
  evaluations?: SeedEval[]; tutoring?: SeedTutoring[]; sscVisits?: SeedSSC[];
  academicCoach?: SeedCoach; athletics?: SeedAthletics; insights: SeedInsight[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────
async function seedStudent(s: SeedStudent) {
  const studentData = {
    firstName: s.firstName, lastName: s.lastName, preferredName: s.preferredName,
    email: s.email, enrollmentStatus: "full-time", yearLevel: s.yearLevel,
    declaredAoc: s.declaredAoc, cumulativeGpa: s.cumulativeGpa,
    creditsEarned: s.creditsEarned, creditsAttempted: s.creditsAttempted,
    academicStanding: s.academicStanding, advisorId: s.advisorId,
    brightFuturesAward: s.brightFuturesAward, brightFuturesActive: s.brightFuturesActive,
    isTransfer: s.isTransfer ?? false, transferCredits: s.transferCredits ?? 0,
    isStudentAthlete: s.isStudentAthlete ?? false, athleteSport: s.athleteSport ?? null,
    bannerSyncedAt: new Date(),
  };
  await prisma.student.upsert({ where: { id: s.id }, update: studentData, create: { id: s.id, ...studentData } });

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
    if (s.degreeProgress.isps.length)
      await prisma.iSPRecord.createMany({ data: s.degreeProgress.isps.map((isp) => ({ degreeProgressId: dp.id, title: isp.title, term: isp.term, termCode: isp.termCode, status: isp.status, supervisorName: isp.supervisor ?? null })) });
    await prisma.minorProgress.deleteMany({ where: { degreeProgressId: dp.id } });
    if (s.degreeProgress.minors.length)
      await prisma.minorProgress.createMany({ data: s.degreeProgress.minors.map((m) => ({ degreeProgressId: dp.id, minorName: m.minorName, isDeclared: m.isDeclared, coursesRequired: m.coursesRequired, coursesCompleted: m.coursesCompleted, percentComplete: m.percentComplete, coursesNeeded: JSON.stringify(m.coursesNeeded) })) });
  }

  // All contracts
  await prisma.contract.deleteMany({ where: { studentId: s.id } });
  for (const c of s.contracts) {
    const created = await prisma.contract.create({
      data: { studentId: s.id, term: term(c.termCode), termCode: c.termCode, status: c.status, signedByStudent: c.signedByStudent, signedByAdvisor: c.signedByAdvisor, signedAt: c.signedAt ?? null, totalCredits: c.totalCredits, syncedAt: new Date() },
    });
    if (c.courses.length)
      await prisma.contractCourse.createMany({ data: c.courses.map((cc) => ({ contractId: created.id, courseCode: cc.courseCode, courseTitle: cc.courseTitle, credits: cc.credits, instructorName: cc.instructorName ?? null })) });
  }

  await prisma.advisingRecord.deleteMany({ where: { studentId: s.id } });
  if (s.advising.length)
    await prisma.advisingRecord.createMany({ data: s.advising.map((a) => ({ studentId: s.id, advisorId: s.advisorId, advisorName: a.advisorName, appointmentDate: a.date, duration: a.duration, meetingType: a.meetingType, outcome: a.outcome, noteText: a.noteText ?? null, termCode: "202601", syncedAt: new Date() })) });

  await prisma.earlyAlert.deleteMany({ where: { studentId: s.id } });
  if (s.earlyAlerts?.length)
    await prisma.earlyAlert.createMany({ data: s.earlyAlerts.map((a) => ({ studentId: s.id, alertType: a.alertType, raisedBy: a.raisedBy, raisedAt: a.raisedAt, status: a.status, notes: a.notes ?? null, syncedAt: new Date() })) });

  await prisma.mSPR.deleteMany({ where: { studentId: s.id } });
  if (s.msprs?.length)
    await prisma.mSPR.createMany({ data: s.msprs.map((m) => ({ studentId: s.id, term: m.term, termCode: m.termCode, courseCode: m.courseCode, courseTitle: m.courseTitle, instructorName: m.instructorName, rating: m.rating, attendance: m.attendance ?? null, feedback: m.feedback ?? null, submittedAt: m.submittedAt, syncedAt: new Date() })) });

  await prisma.financialFlag.deleteMany({ where: { studentId: s.id } });
  if (s.flags?.length)
    await prisma.financialFlag.createMany({ data: s.flags.map((f) => ({ studentId: s.id, flagType: f.flagType, isActive: f.isActive, addedAt: f.addedAt, syncedAt: new Date() })) });

  await prisma.evaluation.deleteMany({ where: { studentId: s.id } });
  if (s.evaluations?.length)
    await prisma.evaluation.createMany({ data: s.evaluations.map((e) => ({ studentId: s.id, instructorName: e.instructorName, courseCode: e.courseCode, courseTitle: e.courseTitle, term: e.term, termCode: e.termCode, evaluationText: e.text, designation: e.status === "unsatisfactory" ? "unsat" : "strong_sat", status: e.status, submittedAt: e.submittedAt, syncedAt: new Date() })) });

  await prisma.tutoringSession.deleteMany({ where: { studentId: s.id } });
  if (s.tutoring?.length)
    await prisma.tutoringSession.createMany({ data: s.tutoring.map((t) => ({ studentId: s.id, sessionDate: t.date, durationMins: t.durationMins, subject: t.subject, courseCode: t.courseCode ?? null, tutorName: t.tutorName ?? null, sessionType: t.sessionType, wasNoShow: false, term: term(t.termCode), termCode: t.termCode, syncedAt: new Date() })) });

  await prisma.sSCVisit.deleteMany({ where: { studentId: s.id } });
  if (s.sscVisits?.length)
    await prisma.sSCVisit.createMany({ data: s.sscVisits.map((v) => ({ studentId: s.id, visitDate: v.date, visitType: v.visitType, serviceType: v.serviceType, staffName: v.staffName ?? null, notes: v.notes ?? null, term: term(v.termCode), termCode: v.termCode, syncedAt: new Date() })) });

  await prisma.academicCoach.deleteMany({ where: { studentId: s.id } });
  if (s.academicCoach)
    await prisma.academicCoach.create({ data: { studentId: s.id, coachName: s.academicCoach.coachName, coachEmail: s.academicCoach.coachEmail ?? null, assignedAt: s.academicCoach.assignedAt ?? null, syncedAt: new Date() } });

  await prisma.athleticsRecord.deleteMany({ where: { studentId: s.id } });
  if (s.athletics)
    await prisma.athleticsRecord.create({ data: { studentId: s.id, sport: s.athletics.sport, eligibilityStatus: s.athletics.eligibilityStatus, gpaRequired: s.athletics.gpaRequired, creditLoadRequired: s.athletics.creditLoadRequired, semesterCertHistory: JSON.stringify(s.athletics.certHistory ?? []), farNotes: s.athletics.farNotes ?? null, syncedAt: new Date() } });

  await prisma.predictiveInsight.deleteMany({ where: { studentId: s.id } });
  if (s.insights.length)
    await prisma.predictiveInsight.createMany({ data: s.insights.map((i) => ({ studentId: s.id, insightType: i.insightType, insightCode: i.insightCode, title: i.title, body: i.body, subtext: i.subtext ?? null, ctaText: i.ctaText ?? null, severity: i.severity })) });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
