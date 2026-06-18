/**
 * Real, anonymized academic-service-usage data — derived from the NCF Learning
 * Commons weekly reports (Fall 2025 + Spring 2026, 33 weeks). All student
 * identifiers were anonymized ("Random #") in the source; only aggregate rates
 * and the real service catalog are retained here. No student PII is present.
 *
 * Services tracked by the Learning Commons:
 *   - Study Hall  (athletics study-hall hours)
 *   - AC          (Academic Coaching)
 *   - ARC         (Academic Resource Center — staff/professional tutoring)
 *   - Knack       (peer tutoring platform)
 *   - WRC         (Writing Resource Center)
 *   - SSC         (Student Success Center)
 *
 * Source: NCF Learning Commons — anonymized weekly reports.
 */

export interface ServiceStat {
  key: "study_hall" | "ac" | "arc" | "knack" | "wrc" | "ssc";
  label: string;
  /** Student-weeks with any use across the 33-week sample (relative popularity). */
  studentWeeksWithUse: number;
  /** Average hours per use session. */
  avgHoursPerUse: number;
}

/** Real aggregate usage across 33 weeks (~206 distinct students active per week). */
export const SERVICE_USAGE_STATS: ServiceStat[] = [
  { key: "study_hall", label: "Athletics Study Hall", studentWeeksWithUse: 2636, avgHoursPerUse: 2.79 },
  { key: "ssc", label: "Student Success Center", studentWeeksWithUse: 2336, avgHoursPerUse: 2.22 },
  { key: "knack", label: "Knack Peer Tutoring", studentWeeksWithUse: 1346, avgHoursPerUse: 1.76 },
  { key: "ac", label: "Academic Coaching", studentWeeksWithUse: 1025, avgHoursPerUse: 0.49 },
  { key: "wrc", label: "Writing Resource Center", studentWeeksWithUse: 659, avgHoursPerUse: 1.24 },
  { key: "arc", label: "Academic Resource Center", studentWeeksWithUse: 236, avgHoursPerUse: 1.56 },
];

export const SERVICE_USAGE_META = {
  weeksSampled: 33,
  avgActiveStudentsPerWeek: 206,
  totalStudentWeekRows: 6793,
  totalHours: 12734,
  terms: "Fall 2025 + Spring 2026",
};

/** Real most-popular tutoring subjects (Knack/ARC), in popularity order. */
export const TUTORING_SUBJECTS = [
  "Economics (including Finance)",
  "Spanish Language and Literature",
  "Mathematics",
  "Biology",
  "Statistics",
  "Chemistry (including Biochemistry)",
  "Psychology",
  "Physics",
  "English",
  "Computer Science",
  "Political Science",
  "History",
  "Writing",
  "Portuguese",
];

/** Map a tutoring subject to a plausible NCF course-code prefix. */
const SUBJECT_PREFIX: Record<string, string> = {
  "Economics (including Finance)": "ECON",
  "Spanish Language and Literature": "SPAN",
  Mathematics: "MATH",
  Biology: "BIO",
  Statistics: "STAT",
  "Chemistry (including Biochemistry)": "CHEM",
  Psychology: "PSYC",
  Physics: "PHYS",
  English: "ENGL",
  "Computer Science": "CMPS",
  "Political Science": "POSC",
  History: "HIST",
  Writing: "WRIT",
  Portuguese: "POR",
};

export function subjectPrefix(subject: string): string {
  return SUBJECT_PREFIX[subject] ?? "NCF";
}
