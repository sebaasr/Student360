/**
 * NCF course catalog reference.
 *
 * Course codes are real New College of Florida courses from the
 * 2025-2026 Undergraduate Catalog, which uses the Florida Statewide Course
 * Numbering System (SCNS). SCNS titles are standardized across all Florida
 * public institutions, so these codes/titles are accurate.
 *
 * This curated subset drives the "Suggested courses" engine. In production the
 * full catalog can be ingested by a connector and stored in the database; the
 * suggestion logic reads from the same shape.
 */

export interface CatalogCourse {
  code: string;
  title: string;
  level: "intro" | "intermediate" | "advanced";
}

// Keyed by AOC discipline (the text inside the parentheses of declaredAoc).
export const NCF_CATALOG: Record<string, CatalogCourse[]> = {
  Biology: [
    { code: "BSC 2010", title: "Biology I: Cellular Processes", level: "intro" },
    { code: "BSC 2011", title: "Biology II: Biodiversity", level: "intro" },
    { code: "BSC 3052", title: "Conservation Biology", level: "intermediate" },
    { code: "PCB 3023", title: "Cell Biology", level: "intermediate" },
    { code: "PCB 3063", title: "Genetics", level: "advanced" },
    { code: "ZOO 3713", title: "Comparative Anatomy", level: "advanced" },
  ],
  Chemistry: [
    { code: "CHM 2045", title: "General Chemistry I", level: "intro" },
    { code: "CHM 2046", title: "General Chemistry II", level: "intro" },
    { code: "CHM 2210", title: "Organic Chemistry I", level: "intermediate" },
    { code: "CHM 2211", title: "Organic Chemistry II", level: "intermediate" },
    { code: "CHM 3120", title: "Analytical Chemistry", level: "advanced" },
    { code: "CHM 4410", title: "Physical Chemistry", level: "advanced" },
  ],
  Physics: [
    { code: "PHY 2048", title: "General Physics I", level: "intro" },
    { code: "PHY 2049", title: "General Physics II", level: "intro" },
    { code: "PHY 3101", title: "Modern Physics", level: "intermediate" },
    { code: "PHY 3220", title: "Classical Mechanics", level: "advanced" },
    { code: "PHY 4604", title: "Quantum Mechanics", level: "advanced" },
  ],
  Mathematics: [
    { code: "MAC 2311", title: "Calculus I", level: "intro" },
    { code: "MAC 2312", title: "Calculus II", level: "intro" },
    { code: "MAS 3105", title: "Linear Algebra", level: "intermediate" },
    { code: "MAA 4211", title: "Real Analysis I", level: "advanced" },
    { code: "STA 4321", title: "Mathematical Statistics", level: "advanced" },
  ],
  "Environmental Science": [
    { code: "EVR 2001", title: "Introduction to Environmental Science", level: "intro" },
    { code: "OCE 1001", title: "Introduction to Oceanography", level: "intro" },
    { code: "EVR 3013", title: "Ecology", level: "intermediate" },
    { code: "EVR 4321", title: "Environmental Policy", level: "advanced" },
    { code: "EVR 4022", title: "Coastal & Marine Systems", level: "advanced" },
  ],
  Literature: [
    { code: "ENC 1101", title: "Composition I", level: "intro" },
    { code: "LIT 2000", title: "Introduction to Literature", level: "intro" },
    { code: "LIT 3024", title: "The Modern Novel", level: "intermediate" },
    { code: "LIT 4934", title: "Seminar in Literary Theory", level: "advanced" },
    { code: "CRW 3013", title: "Advanced Creative Writing", level: "advanced" },
  ],
  History: [
    { code: "AMH 2010", title: "American History to 1877", level: "intro" },
    { code: "AMH 2020", title: "American History since 1877", level: "intro" },
    { code: "EUH 2030", title: "Modern European History", level: "intro" },
    { code: "AMH 3420", title: "The American South", level: "intermediate" },
    { code: "HIS 4936", title: "Seminar in Historiography", level: "advanced" },
  ],
  Philosophy: [
    { code: "PHI 2010", title: "Introduction to Philosophy", level: "intro" },
    { code: "PHI 2103", title: "Introduction to Logic", level: "intro" },
    { code: "PHI 3300", title: "Theory of Knowledge", level: "intermediate" },
    { code: "PHI 3700", title: "Philosophy of Mind", level: "advanced" },
    { code: "PHM 4930", title: "Seminar in Ethics", level: "advanced" },
  ],
  "Art History": [
    { code: "ARH 2050", title: "History of Western Art I", level: "intro" },
    { code: "ARH 2051", title: "History of Western Art II", level: "intro" },
    { code: "ARH 3600", title: "Modern Art", level: "intermediate" },
    { code: "ARH 4930", title: "Seminar in Art History", level: "advanced" },
  ],
  Psychology: [
    { code: "PSY 2012", title: "Introduction to Psychology", level: "intro" },
    { code: "DEP 3000", title: "Developmental Psychology", level: "intermediate" },
    { code: "PSB 3002", title: "Behavioral Neuroscience", level: "intermediate" },
    { code: "CLP 4143", title: "Abnormal Psychology", level: "advanced" },
    { code: "PSY 4930", title: "Seminar in Psychological Research", level: "advanced" },
  ],
  "Political Science": [
    { code: "POS 2041", title: "American National Government", level: "intro" },
    { code: "CPO 2002", title: "Introduction to Comparative Politics", level: "intro" },
    { code: "INR 2002", title: "Introduction to International Relations", level: "intermediate" },
    { code: "POT 3013", title: "Ancient & Medieval Political Theory", level: "intermediate" },
    { code: "POS 4941", title: "Seminar in Public Policy", level: "advanced" },
  ],
  Economics: [
    { code: "ECO 2013", title: "Principles of Macroeconomics", level: "intro" },
    { code: "ECO 2023", title: "Principles of Microeconomics", level: "intro" },
    { code: "ECO 3101", title: "Intermediate Microeconomics", level: "intermediate" },
    { code: "ECO 4421", title: "Introduction to Econometrics", level: "advanced" },
  ],
  Anthropology: [
    { code: "ANT 2000", title: "Introduction to Anthropology", level: "intro" },
    { code: "ANT 2410", title: "Cultural Anthropology", level: "intro" },
    { code: "ANT 3620", title: "Language & Culture", level: "intermediate" },
    { code: "ANT 4930", title: "Seminar in Ethnography", level: "advanced" },
  ],
  Sociology: [
    { code: "SYG 2000", title: "Introduction to Sociology", level: "intro" },
    { code: "SYG 2010", title: "Social Problems", level: "intro" },
    { code: "SYP 3000", title: "Social Psychology", level: "intermediate" },
    { code: "SYA 4930", title: "Seminar in Social Theory", level: "advanced" },
  ],
};

// General-education / foundational courses common across AOCs.
export const NCF_GEN_ED: CatalogCourse[] = [
  { code: "ENC 1101", title: "Composition I", level: "intro" },
  { code: "STA 2023", title: "Statistics", level: "intro" },
  { code: "MGF 1106", title: "Mathematics for the Liberal Arts", level: "intro" },
  { code: "ISC 2076", title: "Scientific Inquiry & the Natural World", level: "intro" },
  { code: "HUM 1020", title: "The Odyssey (First-Year Humanities)", level: "intro" },
];

/** Pull the discipline name out of an AOC label like "Natural Sciences (Biology)". */
export function disciplineFromAoc(aoc: string | null | undefined): string | null {
  if (!aoc) return null;
  const m = aoc.match(/\(([^)]+)\)/);
  return m ? m[1].trim() : aoc.trim();
}

export function coursesForAoc(aoc: string | null | undefined): CatalogCourse[] {
  const d = disciplineFromAoc(aoc);
  return d ? NCF_CATALOG[d] ?? [] : [];
}
