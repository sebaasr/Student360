/**
 * NAIA eligibility reference — sourced from the NAIA 2025-2026 Official Handbook,
 * Article V (Standards of Eligibility). New College of Florida competes in the
 * NAIA Sun Conference.
 *
 * These are reference thresholds shown to advisors/FAR; the official eligibility
 * determination is made by the NAIA Eligibility Center.
 */

export const NAIA_HANDBOOK_URL =
  "https://www.naia.org/legislative/official-policy-handbook";

export interface NaiaRule {
  id: string;
  label: string;
  requirement: string;
  citation: string;
}

// Continuing-eligibility standards most relevant to an advising view.
export const NAIA_RULES: NaiaRule[] = [
  {
    id: "full_time",
    label: "Full-time enrollment",
    requirement: "Identified as a full-time student — minimum 12 institutional credit hours.",
    citation: "Art. V, Sec. C",
  },
  {
    id: "gpa",
    label: "Cumulative GPA",
    requirement:
      "Minimum 2.000 cumulative GPA (4.0 scale), certified each grading period at junior standing and to maintain each season of competition.",
    citation: "Art. V, Sec. C, Item 8",
  },
  {
    id: "progress_24",
    label: "24-hour progress rule",
    requirement:
      "After the second term of attendance, must have accumulated at least 24 institutional credit hours in the two immediately previous terms.",
    citation: "Art. V, Sec. C, Item 6",
  },
  {
    id: "second_season",
    label: "Hours for additional seasons",
    requirement:
      "At least 24 semester institutional credit hours accumulated to participate in a second (and each subsequent) season of a sport.",
    citation: "Art. V, Sec. C, Item 9",
  },
];

export interface NaiaCheck {
  id: string;
  label: string;
  status: "met" | "at_risk" | "unknown";
  detail: string;
  citation: string;
}

interface NaiaInputs {
  cumulativeGpa: number | null;
  creditsEarned: number;
  creditLoadRequired: number; // full-time threshold (default 12)
  currentTermCredits?: number | null;
  hoursPrevTwoTerms?: number | null;
}

export function computeNaiaChecks({
  cumulativeGpa,
  creditsEarned,
  creditLoadRequired,
  currentTermCredits,
  hoursPrevTwoTerms,
}: NaiaInputs): NaiaCheck[] {
  const checks: NaiaCheck[] = [];

  // Full-time
  if (currentTermCredits != null) {
    checks.push({
      id: "full_time",
      label: "Full-time enrollment",
      status: currentTermCredits >= creditLoadRequired ? "met" : "at_risk",
      detail: `${currentTermCredits} of ${creditLoadRequired} credits this term`,
      citation: "Art. V, Sec. C",
    });
  } else {
    checks.push({
      id: "full_time",
      label: "Full-time enrollment",
      status: "unknown",
      detail: `Requires ${creditLoadRequired}+ credits this term`,
      citation: "Art. V, Sec. C",
    });
  }

  // GPA 2.0
  if (cumulativeGpa != null) {
    const buffer = (cumulativeGpa - 2.0).toFixed(2);
    checks.push({
      id: "gpa",
      label: "Cumulative GPA ≥ 2.00",
      status: cumulativeGpa >= 2.0 ? (cumulativeGpa < 2.2 ? "at_risk" : "met") : "at_risk",
      detail:
        cumulativeGpa >= 2.0
          ? `${cumulativeGpa.toFixed(2)} (+${buffer} above minimum)`
          : `${cumulativeGpa.toFixed(2)} — below 2.00 minimum`,
      citation: "Art. V, Sec. C, Item 8",
    });
  } else {
    checks.push({
      id: "gpa",
      label: "Cumulative GPA ≥ 2.00",
      status: "unknown",
      detail: "GPA not available",
      citation: "Art. V, Sec. C, Item 8",
    });
  }

  // 24-hour progress rule
  if (hoursPrevTwoTerms != null) {
    checks.push({
      id: "progress_24",
      label: "24-hour progress rule",
      status: hoursPrevTwoTerms >= 24 ? "met" : "at_risk",
      detail: `${hoursPrevTwoTerms} credits in the last two terms (24 required)`,
      citation: "Art. V, Sec. C, Item 6",
    });
  } else {
    checks.push({
      id: "progress_24",
      label: "24-hour progress rule",
      status: "unknown",
      detail: "24 credits required across the previous two terms",
      citation: "Art. V, Sec. C, Item 6",
    });
  }

  return checks;
}
