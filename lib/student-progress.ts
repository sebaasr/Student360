/**
 * Server-side computations for the student profile:
 *   - per-semester timeline rows (from semester GPAs + ISP records + AOC declaration)
 *   - overall progress percentage + per-requirement bars
 *   - rule-based next-semester course suggestions
 *
 * Read-only — never mutates state.
 */

export interface TimelineRow {
  term: string;
  termCode: string;
  yearShort: string;
  coursesPassed: number | null;
  coursesTotal: number | null;
  gpa: number | null;
  narratives: number | null;
  narrativesMissing: number;
  milestones: string[];
  note?: string;
}

export interface ProgressBar {
  id: string;
  label: string;
  current: number;
  total: number;
  unit: string;
  status: string; // human-readable right-side text
  colorScheme: "navy" | "green" | "amber" | "red" | "gold";
}

export interface OverallProgress {
  percent: number;
  bars: ProgressBar[];
  remainingText: string;
}

export interface RequirementCallout {
  id: "aoc" | "gen_ed" | "graduation";
  title: string;
  subtitle: string;
  percent: number;
  detail: string;
}

export interface SuggestedCourse {
  courseCode: string;
  courseTitle: string;
  reason: string;
  category: "AOC" | "Gen Ed" | "Minor" | "Thesis";
}

interface SemesterGpa {
  term: string;
  termCode: string;
  gpa: number;
  credits: number;
  standing: string;
}

interface ISP {
  id: string;
  title: string;
  term: string;
  termCode: string;
  status: string;
  supervisorName: string | null;
}

interface Minor {
  minorName: string;
  isDeclared: boolean;
  coursesCompleted: number;
  coursesRequired: number;
  percentComplete: number;
  coursesNeeded: string[];
}

interface DegreeProgress {
  aocName: string | null;
  aocCreditRequired: number;
  aocCreditCompleted: number;
  aocPercentComplete: number;
  genEdRequired: number;
  genEdCompleted: number;
  ispsRequired: number;
  ispsCompleted: number;
  thesisStatus: string;
  thesisSponsor: string | null;
  projectedGradTerm: string | null;
  ispRecords: ISP[];
  minors: Minor[];
}

interface Evaluation {
  termCode: string;
  status: string;
}

interface Contract {
  termCode: string;
  totalCredits: number;
  courses: { courseCode: string; courseTitle: string; credits: number }[];
}

interface StudentMeta {
  yearLevel: number;
  creditsEarned: number;
  declaredAoc: string | null;
  aocDeclaredAt: Date | string | null;
}

const SEMESTERS_PER_YEAR = 2;

export function buildTimeline(
  semesterGpas: SemesterGpa[],
  evaluations: Evaluation[],
  ispRecords: ISP[],
  contracts: Contract[],
  student: StudentMeta,
): TimelineRow[] {
  // Index narratives by term so we can show counts.
  const narrativesByTerm = new Map<string, { total: number; missing: number }>();
  for (const e of evaluations) {
    const slot = narrativesByTerm.get(e.termCode) ?? { total: 0, missing: 0 };
    slot.total += 1;
    if (e.status === "missing" || e.status === "incomplete") slot.missing += 1;
    narrativesByTerm.set(e.termCode, slot);
  }

  // Index courses-taken per term from contracts.
  const coursesByTerm = new Map<string, number>();
  for (const c of contracts) {
    coursesByTerm.set(c.termCode, c.courses.length);
  }

  // Index ISP completions to surface as milestones.
  const milestonesByTerm = new Map<string, string[]>();
  for (const isp of ispRecords) {
    if (!isp.termCode) continue;
    const arr = milestonesByTerm.get(isp.termCode) ?? [];
    arr.push(isp.status === "completed" ? "ISP ✓" : "ISP in progress");
    milestonesByTerm.set(isp.termCode, arr);
  }
  if (student.declaredAoc && student.aocDeclaredAt) {
    const declaredCode = termCodeFromDate(new Date(student.aocDeclaredAt));
    const arr = milestonesByTerm.get(declaredCode) ?? [];
    arr.push("AOC declared");
    milestonesByTerm.set(declaredCode, arr);
  }

  const rows: TimelineRow[] = semesterGpas.map((g) => {
    const narratives = narrativesByTerm.get(g.termCode);
    const taken = coursesByTerm.get(g.termCode) ?? null;
    return {
      term: g.term,
      termCode: g.termCode,
      yearShort: shortTerm(g.term),
      coursesPassed: taken,
      coursesTotal: taken,
      gpa: g.gpa,
      narratives: narratives?.total ?? null,
      narrativesMissing: narratives?.missing ?? 0,
      milestones: milestonesByTerm.get(g.termCode) ?? [],
    };
  });

  return rows;
}

export function buildOverallProgress(
  student: StudentMeta,
  dp: DegreeProgress | null,
  contracts: Contract[],
): OverallProgress {
  const creditsTotal = 120;
  const creditsEarned = student.creditsEarned;
  const satisfactoryContracts = contracts.length; // every signed contract is treated as satisfactory in dev
  const ispsRequired = dp?.ispsRequired ?? 3;
  const ispsCompleted = dp?.ispsCompleted ?? 0;
  const aocPct = dp?.aocPercentComplete ?? 0;
  const genEdPct = dp?.genEdRequired ? (dp.genEdCompleted / dp.genEdRequired) : 0;
  const thesisPct = thesisPercent(dp?.thesisStatus ?? "not_started") / 100;

  // Six weighted components → overall %
  const weights = {
    credits: 0.3,
    contracts: 0.15,
    isps: 0.15,
    aoc: 0.15,
    genEd: 0.1,
    thesis: 0.15,
  };
  const overall =
    weights.credits * (creditsEarned / creditsTotal) +
    weights.contracts * Math.min(1, satisfactoryContracts / 8) +
    weights.isps * (ispsCompleted / ispsRequired) +
    weights.aoc * aocPct +
    weights.genEd * genEdPct +
    weights.thesis * thesisPct;
  const percent = Math.min(100, Math.round(overall * 100));

  const bars: ProgressBar[] = [
    {
      id: "credits",
      label: "Credits",
      current: creditsEarned,
      total: creditsTotal,
      unit: "credits",
      status: `${creditsEarned} / ${creditsTotal}`,
      colorScheme: "navy",
    },
    {
      id: "contracts",
      label: "Contracts",
      current: satisfactoryContracts,
      total: 8,
      unit: "contracts",
      status: `${satisfactoryContracts} / 8 satisfactory`,
      colorScheme: "navy",
    },
    {
      id: "isps",
      label: "ISPs",
      current: ispsCompleted,
      total: ispsRequired,
      unit: "ISPs",
      status: `${ispsCompleted} / ${ispsRequired} satisfactory`,
      colorScheme: ispsCompleted === ispsRequired ? "green" : "navy",
    },
    {
      id: "aoc",
      label: "AOC",
      current: dp?.aocCreditCompleted ?? 0,
      total: dp?.aocCreditRequired ?? 40,
      unit: "credits",
      status: `${Math.round(aocPct * 100)}% complete`,
      colorScheme: aocPct >= 0.8 ? "green" : "gold",
    },
    {
      id: "gen_ed",
      label: "General Ed",
      current: dp?.genEdCompleted ?? 0,
      total: dp?.genEdRequired ?? 20,
      unit: "courses",
      status: `${Math.round(genEdPct * 100)}% complete`,
      colorScheme: genEdPct >= 0.9 ? "green" : genEdPct >= 0.5 ? "navy" : "amber",
    },
    {
      id: "thesis",
      label: "Senior thesis",
      current: thesisPercent(dp?.thesisStatus ?? "not_started"),
      total: 100,
      unit: "%",
      status: humanThesisStatus(dp?.thesisStatus ?? "not_started"),
      colorScheme: thesisColor(dp?.thesisStatus ?? "not_started"),
    },
  ];

  const creditsRemaining = Math.max(0, creditsTotal - creditsEarned);
  const ispsRemaining = Math.max(0, ispsRequired - ispsCompleted);
  const contractsRemaining = Math.max(0, 8 - satisfactoryContracts);
  const aocPctInt = Math.round(aocPct * 100);
  const genEdPctInt = Math.round(genEdPct * 100);

  const parts: string[] = [];
  if (creditsRemaining > 0) parts.push(`${creditsRemaining} more credits`);
  if (contractsRemaining > 0)
    parts.push(`${contractsRemaining} more satisfactory contract${contractsRemaining > 1 ? "s" : ""}`);
  if (ispsRemaining > 0)
    parts.push(`${ispsRemaining} more ISP${ispsRemaining > 1 ? "s" : ""}`);
  if (aocPctInt < 100) parts.push(`AOC at ${aocPctInt}%`);
  if (genEdPctInt < 100) parts.push(`Gen Ed at ${genEdPctInt}%`);
  if ((dp?.thesisStatus ?? "not_started") !== "approved") parts.push("plus the senior thesis");

  const remainingText =
    parts.length === 0
      ? "All graduation requirements complete."
      : `Still required to graduate: ${parts.join(", ")}.`;

  return { percent, bars, remainingText };
}

export function buildRequirementCallouts(dp: DegreeProgress | null): RequirementCallout[] {
  const aocPct = dp?.aocPercentComplete ?? 0;
  const genEdPct = dp?.genEdRequired ? (dp.genEdCompleted / dp.genEdRequired) : 0;
  const thesisPct = thesisPercent(dp?.thesisStatus ?? "not_started") / 100;
  // Treat graduation callout as the same weighted overall percentage.
  return [
    {
      id: "aoc",
      title: "AOC",
      subtitle: dp?.aocName ?? "Undeclared",
      percent: Math.round(aocPct * 100),
      detail: dp?.aocName
        ? `${dp.aocCreditCompleted} of ${dp.aocCreditRequired} credits complete`
        : "Declare an Area of Concentration to populate progress.",
    },
    {
      id: "gen_ed",
      title: "General Education",
      subtitle: "NCF core + state requirements",
      percent: Math.round(genEdPct * 100),
      detail: dp
        ? `${dp.genEdCompleted} of ${dp.genEdRequired} requirements complete`
        : "Requirements not loaded.",
    },
    {
      id: "graduation",
      title: "Graduation",
      subtitle: "Contracts, ISPs, credits, thesis",
      percent: Math.round(
        ((aocPct + genEdPct + thesisPct) / 3) * 100,
      ), // approximate
      detail: dp ? "View the full requirements panel for breakdown." : "—",
    },
  ];
}

export function buildSuggestedCourses(
  student: StudentMeta,
  dp: DegreeProgress | null,
): SuggestedCourse[] {
  const out: SuggestedCourse[] = [];
  if (!dp) return out;

  // 1. AOC gap → suggest an upper-division AOC course.
  const aocGap = (dp.aocCreditRequired ?? 0) - (dp.aocCreditCompleted ?? 0);
  if (dp.aocName && aocGap > 0) {
    out.push({
      courseCode: aocCode(dp.aocName),
      courseTitle: `${dp.aocName} Seminar (advanced)`,
      reason: `Closes ${Math.min(4, aocGap)} of ${aocGap} AOC credits still required.`,
      category: "AOC",
    });
  }

  // 2. Gen Ed gap → suggest a remaining gen-ed.
  const genEdGap = (dp.genEdRequired ?? 0) - (dp.genEdCompleted ?? 0);
  if (genEdGap > 0) {
    out.push({
      courseCode: "GEN ED",
      courseTitle: genEdGap >= 2 ? "Quantitative Reasoning + Lab Science" : "Remaining gen-ed",
      reason: `${genEdGap} general-education requirement${genEdGap > 1 ? "s" : ""} outstanding.`,
      category: "Gen Ed",
    });
  }

  // 3. Minor proximity → push the next course.
  for (const m of dp.minors ?? []) {
    if (m.percentComplete >= 0.5 && m.coursesNeeded.length > 0) {
      out.push({
        courseCode: m.coursesNeeded[0],
        courseTitle: `${m.minorName} minor — next course`,
        reason: `Only ${m.coursesRequired - m.coursesCompleted} course${m.coursesRequired - m.coursesCompleted > 1 ? "s" : ""} from completing the ${m.minorName} minor.`,
        category: "Minor",
      });
    }
  }

  // 4. Senior thesis prep.
  if (student.yearLevel === 4 && dp.thesisStatus === "not_started") {
    out.push({
      courseCode: "THESIS PREP",
      courseTitle: "Thesis prep + sponsor identification",
      reason: "Senior with no thesis sponsor — schedule meetings with prospective sponsors.",
      category: "Thesis",
    });
  } else if (student.yearLevel === 4 && dp.thesisStatus === "in_progress") {
    out.push({
      courseCode: "THESIS",
      courseTitle: "Senior Thesis (continuation)",
      reason: "Continue thesis work toward submission.",
      category: "Thesis",
    });
  }

  return out;
}

// ── helpers ───────────────────────────────────────────────────────────

function thesisPercent(status: string): number {
  return (
    {
      not_started: 0,
      sponsor_identified: 25,
      in_progress: 60,
      submitted: 90,
      approved: 100,
    }[status] ?? 0
  );
}

function thesisColor(status: string): "red" | "amber" | "green" | "navy" {
  if (status === "not_started") return "red";
  if (status === "sponsor_identified" || status === "in_progress") return "amber";
  if (status === "submitted" || status === "approved") return "green";
  return "navy";
}

function humanThesisStatus(status: string): string {
  return (
    {
      not_started: "Not started",
      sponsor_identified: "Sponsor identified",
      in_progress: "In progress",
      submitted: "Submitted",
      approved: "Approved",
    }[status] ?? status
  );
}

function shortTerm(term: string): string {
  // "Fall 2024" → "F '24" · "Spring 2025" → "S '25"
  const [season, year] = term.split(/\s+/);
  const prefix = season?.startsWith("F") ? "F" : season?.startsWith("S") ? "S" : season?.slice(0, 1) ?? "?";
  const yy = year?.slice(-2) ?? "";
  return `${prefix} '${yy}`;
}

function termCodeFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  // term codes follow Ellucian: YYYY09 = Fall (Aug–Dec), YYYY01 = Spring (Jan–May), YYYY05 = Summer
  if (m >= 8) return `${y}09`;
  if (m >= 6) return `${y}05`;
  return `${y}01`;
}

function aocCode(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)[0]
    .slice(0, 4)
    .toUpperCase();
}
