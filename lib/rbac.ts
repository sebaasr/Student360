export const ACCESS_TIERS = {
  FACULTY_ADVISOR: 1,
  ACADEMIC_COACH: 2,
  AOC_DIRECTOR: 3,
  ATHLETICS_STAFF: 4,
  FINANCIAL_AID: 5,
  DEAN_OF_STUDENTS: 6,
  REGISTRAR: 7,
  PROVOST_OFFICE: 8,
  IT_ADMIN: 9,
} as const;

export type AccessTier = (typeof ACCESS_TIERS)[keyof typeof ACCESS_TIERS];

export const TIER_LABELS: Record<number, string> = {
  1: "Faculty Advisor",
  2: "Academic Coach",
  3: "AOC Director",
  4: "Athletics Staff",
  5: "Financial Aid",
  6: "Dean of Students",
  7: "Registrar",
  8: "Provost Office",
  9: "IT Administrator",
};

export const TIER_PANELS: Record<number, string[]> = {
  1: [
    "academic",
    "contract",
    "evaluations",
    "advising",
    "tutoring",
    "ssc",
    "financial_flags",
    "predictive",
    "graduation_tracker",
    "bright_futures",
  ],
  2: ["academic", "tutoring", "ssc", "advising_limited", "predictive", "graduation_tracker"],
  3: ["academic", "contract", "evaluations", "graduation_tracker"],
  4: ["academic", "contract", "athletics"],
  5: ["financial_flags"],
  6: [
    "academic",
    "contract",
    "advising",
    "ssc",
    "wellness_flags",
    "graduation_tracker",
    "bright_futures",
  ],
  7: [
    "academic",
    "contract",
    "evaluations",
    "advising",
    "tutoring",
    "ssc",
    "financial_flags",
    "athletics",
    "graduation_tracker",
    "bright_futures",
  ],
  8: [
    "academic",
    "contract",
    "evaluations",
    "advising",
    "tutoring",
    "ssc",
    "financial_flags",
    "athletics",
    "graduation_tracker",
    "bright_futures",
    "cohort_analytics",
  ],
  9: [],
};

export const TIER_SEES_ALL: Record<number, boolean> = {
  1: false,
  2: false,
  3: false,
  4: false,
  5: true,
  6: true,
  7: true,
  8: true,
  9: false,
};

export function canViewPanel(tier: number, panel: string): boolean {
  return TIER_PANELS[tier]?.includes(panel) ?? false;
}

export function canViewStudent(
  tier: number,
  userId: string,
  studentAdvisorId: string | null,
): boolean {
  if (TIER_SEES_ALL[tier]) return true;
  if (tier === 1) return studentAdvisorId === userId;
  // Tiers 2/3/4 are scoped via query layer (Knack roster, AOC roster, athletics roster)
  return false;
}

export function visiblePanelsForTier(tier: number): string[] {
  return TIER_PANELS[tier] ?? [];
}
