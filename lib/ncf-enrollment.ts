/**
 * Real, anonymized NCF enrollment data — derived from the Registrar's Argos
 * course-registration export (Fall 2025 + Spring 2026), with all student
 * identifiers removed.
 *
 * Provides real NCF course titles, real instructor names (faculty, public
 * record), and the real distribution of narrative-evaluation designations.
 * Used to make the synthetic students' contracts and narrative evaluations
 * resemble real NCF coursework. No student PII is present.
 *
 * Source: NCF Registrar — anonymized Argos enrollment export.
 */

export interface RealCourse {
  title: string;
  instructor: string;
}

// Real courses grouped by NCF division (the part before "(" in an AOC label).
export const NCF_COURSES_BY_DIVISION: Record<string, RealCourse[]> = {
  "Natural Sciences": [
    { title: "General Chemistry I", instructor: "Sherman, Suzanne E" },
    { title: "Cell Biology", instructor: "Clore, Amy M" },
    { title: "Cell Biology Laboratory", instructor: "Clore, Amy M" },
    { title: "Applied Statistics I", instructor: "Skripnikov, Andrey V" },
    { title: "Data Munging and Exploratory Data Analysis", instructor: "Ryba, Tyrone R" },
    { title: "Dealing with Data II", instructor: "Skripnikov, Andrey V" },
    { title: "Ordinary Differential Equations", instructor: "Yildirim, Necmettin" },
    { title: "Calculus I", instructor: "Yildirim, Necmettin" },
    { title: "Calculus III", instructor: "Yildirim, Necmettin" },
    { title: "Physics I (Calculus-Based)", instructor: "Colladay, Donald C" },
    { title: "Modern Physics", instructor: "Colladay, Donald C" },
    { title: "Thermal Physics", instructor: "Ruppeiner, George" },
    { title: "Science of Light and Color", instructor: "Sendova, Mariana S" },
    { title: "Invertebrate Zoology", instructor: "Gilchrist, Sandra L" },
    { title: "Data Structures", instructor: "Hamid, Fahmida" },
    { title: "Embedded Systems", instructor: "Hamid, Fahmida" },
    { title: "Linear Models", instructor: "Skripnikov, Andrey V" },
  ],
  Humanities: [
    { title: "Homer's Odyssey — Introduction to Humanities", instructor: "Zamsky, Robert L" },
    { title: "Classical Philosophy: Know Thyself", instructor: "Flakne, April N" },
    { title: "Theory of Knowledge", instructor: "Edidin, Aron Z" },
    { title: "Formal Logic", instructor: "Edidin, Aron Z" },
    { title: "Introduction to Poetry", instructor: "Hubbard, Melanie A" },
    { title: "Painting Principles: Color to Form", instructor: "Anderson, Kim S" },
    { title: "Perceptual Drawing Methods", instructor: "Anderson, Kim S" },
    { title: "Music Theory III", instructor: "Dancigers, Mark C" },
    { title: "Music Composition I", instructor: "Dancigers, Mark C" },
    { title: "Elementary Spanish I", instructor: "Portugal, Jose A" },
    { title: "Latin American Literature in Translation", instructor: "Portugal, Jose A" },
    { title: "Greek Monsters and Marvels", instructor: "Shaw, Carl A" },
    { title: "First-Year Modern Chinese I", instructor: "Zhang, Jing" },
    { title: "Rhetoric and Writing: Writing about Writing", instructor: "Wells, Jennifer M" },
    { title: "Early Modern Europe: The World in Maps", instructor: "Benes, Carrie E" },
  ],
  "Social Sciences": [
    { title: "Introduction to Applied Statistics", instructor: "Cooper, Robin D" },
    { title: "Applied Advanced Statistics", instructor: "Cooper, Robin D" },
    { title: "Principles of Microeconomics", instructor: "Collins, Tracy M" },
    { title: "Intermediate Macroeconomics", instructor: "Yu, Sherry X" },
    { title: "Econometrics", instructor: "Khemraj, Tarron" },
    { title: "Introduction to Accounting and Finance", instructor: "Yu, Sherry X" },
    { title: "International Business", instructor: "Collins, Tracy M" },
    { title: "Introduction to World Politics", instructor: "Alcock, Frank R" },
    { title: "International Political Economy", instructor: "Ellis, David C" },
    { title: "Social Networks and the Context of Political Behavior", instructor: "Ellis, David C" },
    { title: "Modern European History I", instructor: "Harvey, David A" },
    { title: "Heritage: History and the Past Today", instructor: "Baram, Uzi I" },
    { title: "Space, Place and Community", instructor: "Brain, David K" },
    { title: "Climate Change: Science, Politics, Media and Policy", instructor: "Alcock, Frank R" },
    { title: "Psychology Senior Seminar 1", instructor: "Barton, Michelle E" },
  ],
  Interdisciplinary: [
    { title: "Introduction to Statistics for the Social Sciences", instructor: "Lee, Travis R" },
    { title: "Math Tools for the Social Sciences", instructor: "Lee, Travis R" },
    { title: "To Infinity and Beyond", instructor: "Lee, Travis R" },
  ],
};

// Real first-year / general-education style courses (cross-division).
export const NCF_GENED_COURSES: RealCourse[] = [
  { title: "Homer's Odyssey — Introduction to Humanities", instructor: "Zamsky, Robert L" },
  { title: "Rhetoric and Writing: Writing about Writing", instructor: "Wells, Jennifer M" },
  { title: "Introduction to Applied Statistics", instructor: "Cooper, Robin D" },
  { title: "Math Tools for the Social Sciences", instructor: "Lee, Travis R" },
  { title: "Science of Light and Color", instructor: "Sendova, Mariana S" },
];

/**
 * Real narrative-evaluation designations and their observed frequency in the
 * anonymized export. Used to assign realistic designations to evaluations.
 */
export type Designation = "strong_sat" | "sat" | "marginal_sat" | "unsat";

export const DESIGNATION_DISTRIBUTION: { key: Designation; weight: number; label: string }[] = [
  { key: "strong_sat", weight: 1494, label: "Strong Satisfactory" },
  { key: "sat", weight: 1337, label: "Satisfactory" },
  { key: "marginal_sat", weight: 442, label: "Marginal Satisfactory" },
  { key: "unsat", weight: 146, label: "Unsatisfactory" },
];

const TOTAL_WEIGHT = DESIGNATION_DISTRIBUTION.reduce((n, d) => n + d.weight, 0);

/** Pick a designation by the real distribution, given a [0,1) random value. */
export function pickDesignation(r: number): Designation {
  let acc = 0;
  const target = r * TOTAL_WEIGHT;
  for (const d of DESIGNATION_DISTRIBUTION) {
    acc += d.weight;
    if (target < acc) return d.key;
  }
  return "sat";
}

export function designationToStatus(d: Designation): string {
  return d === "unsat" ? "unsatisfactory" : "satisfactory";
}

export function coursesForDivision(division: string): RealCourse[] {
  return NCF_COURSES_BY_DIVISION[division] ?? NCF_GENED_COURSES;
}
