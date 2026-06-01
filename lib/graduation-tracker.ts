export interface ProgressBar {
  id: string;
  label: string;
  sublabel: string;
  current: number;
  total: number;
  unit: string;
  colorScheme: "navy" | "gold" | "green" | "amber" | "red";
  ticks: number[];
  alertLabel?: string;
  showPacingWarning?: boolean;
  displayType: "bar" | "pips";
}

export interface DegreeProgressLike {
  aocName?: string | null;
  aocCreditRequired?: number;
  aocCreditCompleted?: number;
  aocPercentComplete?: number;
  genEdRequired?: number;
  genEdCompleted?: number;
  ispsRequired?: number;
  ispsCompleted?: number;
  thesisStatus?: string;
  thesisSponsor?: string | null;
  minors?: Array<{
    minorName: string;
    isDeclared: boolean;
    coursesCompleted: number;
    coursesRequired: number;
    percentComplete: number;
  }>;
}

export function buildGraduationTracker(
  degreeProgress: DegreeProgressLike | null | undefined,
  creditsEarned: number,
  semestersRemaining: number,
): ProgressBar[] {
  const bars: ProgressBar[] = [];

  // 1. Total credits
  bars.push({
    id: "total_credits",
    label: "Total Credits",
    sublabel: "Graduation requirement",
    current: creditsEarned,
    total: 120,
    unit: "credits",
    colorScheme: "navy",
    ticks: [30, 60, 90],
    displayType: "bar",
  });

  // 2. AOC credits
  if ((degreeProgress?.aocCreditRequired ?? 0) > 0) {
    const aocPct = degreeProgress!.aocPercentComplete ?? 0;
    bars.push({
      id: "aoc",
      label: `AOC — ${degreeProgress!.aocName ?? "Undeclared"}`,
      sublabel: "Area of Concentration",
      current: degreeProgress!.aocCreditCompleted ?? 0,
      total: degreeProgress!.aocCreditRequired!,
      unit: "credits",
      colorScheme: aocPct >= 0.8 ? "green" : "gold",
      ticks: [Math.round(degreeProgress!.aocCreditRequired! / 2)],
      displayType: "bar",
    });
  }

  // 3. Gen Ed Core
  if ((degreeProgress?.genEdRequired ?? 0) > 0) {
    const genEdPct = (degreeProgress!.genEdCompleted ?? 0) / degreeProgress!.genEdRequired!;
    bars.push({
      id: "gen_ed",
      label: "General Education Core",
      sublabel: "Core curriculum",
      current: degreeProgress!.genEdCompleted ?? 0,
      total: degreeProgress!.genEdRequired!,
      unit: "credits",
      colorScheme: genEdPct >= 0.9 ? "green" : genEdPct >= 0.5 ? "navy" : "amber",
      ticks: [],
      displayType: "bar",
    });
  }

  // 4. Minors (only those ≥ 50% complete)
  for (const minor of degreeProgress?.minors ?? []) {
    if (minor.percentComplete >= 0.5) {
      bars.push({
        id: `minor_${minor.minorName.replace(/\s+/g, "_").toLowerCase()}`,
        label: `${minor.minorName} Minor`,
        sublabel: minor.isDeclared ? "Declared" : "Proximity alert active",
        current: minor.coursesCompleted,
        total: minor.coursesRequired,
        unit: "courses",
        colorScheme: minor.isDeclared ? "navy" : "amber",
        ticks: [],
        alertLabel: !minor.isDeclared ? "Undeclared ✨" : undefined,
        displayType: "bar",
      });
    }
  }

  // 5. ISPs
  const ispsRequired = degreeProgress?.ispsRequired ?? 3;
  const ispsCompleted = degreeProgress?.ispsCompleted ?? 0;
  const ispsRemaining = ispsRequired - ispsCompleted;
  bars.push({
    id: "isps",
    label: "ISPs Completed",
    sublabel: `${ispsRequired} required for graduation`,
    current: ispsCompleted,
    total: ispsRequired,
    unit: "ISPs",
    colorScheme: ispsRemaining === 0 ? "green" : "navy",
    ticks: [],
    showPacingWarning: ispsRemaining > semestersRemaining,
    displayType: "pips",
  });

  // 6. Senior Thesis
  const thesisMap: Record<string, { pct: number; color: "red" | "amber" | "green" }> = {
    not_started: { pct: 0, color: "red" },
    sponsor_identified: { pct: 25, color: "amber" },
    in_progress: { pct: 60, color: "amber" },
    submitted: { pct: 90, color: "green" },
    approved: { pct: 100, color: "green" },
  };
  const thesis = thesisMap[degreeProgress?.thesisStatus ?? "not_started"];
  bars.push({
    id: "thesis",
    label: "Senior Thesis",
    sublabel: degreeProgress?.thesisSponsor
      ? `Sponsor: ${degreeProgress.thesisSponsor}`
      : "Sponsor not yet identified",
    current: thesis.pct,
    total: 100,
    unit: "%",
    colorScheme: thesis.color,
    ticks: [],
    displayType: "bar",
  });

  return bars;
}

export function semestersRemaining(yearLevel: number): number {
  // Each year is 2 semesters; a senior has ~2 semesters left.
  return Math.max(1, (4 - yearLevel + 1) * 2 - 1);
}
