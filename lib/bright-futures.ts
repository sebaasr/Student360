export interface BrightFuturesStatus {
  color: "green" | "yellow" | "red" | "none";
  awardType: string | null;
  awardLabel: string | null;
  requiredGpa: number | null;
  currentGpa: number | null;
  buffer: number | null;
  creditsMet: boolean;
  syncedAt: string;
}

const THRESHOLDS: Record<string, number> = {
  academic_scholar: parseFloat(process.env.BRIGHT_FUTURES_ACADEMIC_GPA ?? "3.0"),
  medallion_scholar: parseFloat(process.env.BRIGHT_FUTURES_MEDALLION_GPA ?? "2.75"),
  gold_scholar: parseFloat(process.env.BRIGHT_FUTURES_GOLD_GPA ?? "2.0"),
};

const AWARD_LABELS: Record<string, string> = {
  academic_scholar: "Florida Academic Scholar",
  medallion_scholar: "Florida Medallion Scholar",
  gold_scholar: "Florida Gold Seal Vocational Scholar",
};

const YELLOW_BUFFER = 0.2;

export function computeBrightFuturesStatus(
  awardType: string | null,
  isActive: boolean,
  currentGpa: number | null,
  currentCredits: number,
  minimumCreditsRequired = 12,
): BrightFuturesStatus {
  if (!awardType || !isActive) {
    return {
      color: "none",
      awardType: null,
      awardLabel: null,
      requiredGpa: null,
      currentGpa: null,
      buffer: null,
      creditsMet: true,
      syncedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  }

  const requiredGpa = THRESHOLDS[awardType] ?? 3.0;
  const buffer = currentGpa !== null ? parseFloat((currentGpa - requiredGpa).toFixed(2)) : null;
  const creditsMet = currentCredits >= minimumCreditsRequired;

  let color: "green" | "yellow" | "red";
  if (currentGpa === null) {
    color = "yellow";
  } else if (currentGpa < requiredGpa || !creditsMet) {
    color = "red";
  } else if (currentGpa < requiredGpa + YELLOW_BUFFER) {
    color = "yellow";
  } else {
    color = "green";
  }

  return {
    color,
    awardType,
    requiredGpa,
    currentGpa,
    buffer,
    creditsMet,
    awardLabel: AWARD_LABELS[awardType] ?? awardType,
    syncedAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}
