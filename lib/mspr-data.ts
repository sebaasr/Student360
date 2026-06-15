/**
 * Real, anonymized NCF MSPR data — MSPR Round 1, Fall 2025.
 *
 * These are AGGREGATE counts only (no student identifiers) drawn from the
 * Learning Commons' anonymized MSPR results export. Used to power the
 * institutional MSPR analytics view. Per-student MSPR records elsewhere are
 * synthetic; this aggregate layer is the real distribution.
 *
 * Source: NCF Learning Commons — "MSPR1 F25 Results" (anonymized).
 */

export const MSPR_SOURCE = "NCF Learning Commons · MSPR Round 1, Fall 2025 (anonymized)";

export const MSPR_OVERVIEW = {
  studentBody: 852,
  studentsWithConcerns: 278,
  percentWithConcerns: 33,
};

// Most common concern types (% of all concerns flagged).
export const MSPR_CONCERN_TYPES = [
  { label: "Submitting Late / Missing Assignments", pct: 30 },
  { label: "Other Assignment Concerns", pct: 21 },
  { label: "Needs to Improve Test Scores", pct: 20 },
  { label: "Needs More Class Participation", pct: 16 },
  { label: "Needs to Attend Class", pct: 13 },
];

// Students with concerns by academic year.
export const MSPR_BY_YEAR = [
  { year: "Freshman", withConcerns: 46, total: 106, pct: 43 },
  { year: "Sophomore", withConcerns: 71, total: 185, pct: 38 },
  { year: "Junior", withConcerns: 73, total: 219, pct: 33 },
  { year: "Senior", withConcerns: 88, total: 340, pct: 26 },
];

// Athlete vs non-athlete concern rates.
export const MSPR_BY_ATHLETE = [
  { group: "Student-Athletes", withConcerns: 130, total: 409, pct: 32 },
  { group: "Non-Athletes", withConcerns: 148, total: 443, pct: 33 },
];

// Distribution: how many concerns each student has.
export const MSPR_CONCERNS_PER_STUDENT = [
  { concerns: 0, students: 574, pct: 67 },
  { concerns: 1, students: 181, pct: 21 },
  { concerns: 2, students: 59, pct: 7 },
  { concerns: 3, students: 19, pct: 2 },
  { concerns: 4, students: 15, pct: 2 },
  { concerns: 5, students: 3, pct: 0 },
  { concerns: 7, students: 1, pct: 0 },
];

// Students in danger of unsatisfactory ("unsatting") courses.
export const MSPR_COURSE_DANGER = [
  { dangerCourses: 0, students: 738, pct: 87 },
  { dangerCourses: 1, students: 100, pct: 12 },
  { dangerCourses: 2, students: 14, pct: 2 },
];

// Real NCF concern categories, for use as MSPR ratings on individual records.
export const NCF_CONCERN_CATEGORIES = [
  "Submitting Late / Missing Assignments",
  "Other Assignment Concerns",
  "Needs to Improve Test Scores",
  "Needs More Class Participation",
  "Needs to Attend Class",
];
