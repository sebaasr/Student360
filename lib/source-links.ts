/**
 * Deep links to the source systems of record.
 *
 * Student 360 is READ-ONLY — it never writes back to any source system.
 * When an advisor needs to take an action (sign a contract, correct a record,
 * file an official note), they jump to the system of record using these links.
 *
 * URLs are configured per-environment via NEXT_PUBLIC_* env vars so they are
 * available in the browser. Use {id} as the placeholder for the student ID.
 * If a URL is not configured, the helper returns the system's base/home URL,
 * or null when nothing is configured at all (the button is then hidden).
 */

export type SourceSystem = "banner" | "degreeworks" | "navigate" | "knack" | "evaluations";

interface SystemConfig {
  label: string;
  short: string;
  // template may contain {id}; if absent, the id is ignored (opens home page)
  template: string | undefined;
}

// Demo fallbacks open the vendor's real product page so the buttons work
// out of the box. IT replaces these with deep-link templates containing {id},
// e.g. NEXT_PUBLIC_BANNER_URL="https://banner.ncf.edu/StudentProfile?id={id}".
const SYSTEMS: Record<SourceSystem, SystemConfig> = {
  banner: {
    label: "Banner",
    short: "Banner",
    template: process.env.NEXT_PUBLIC_BANNER_URL ?? "https://www.ellucian.com/solutions/ellucian-banner",
  },
  degreeworks: {
    label: "DegreeWorks",
    short: "DegreeWorks",
    template: process.env.NEXT_PUBLIC_DEGREEWORKS_URL ?? "https://www.ellucian.com/solutions/ellucian-degree-works",
  },
  navigate: {
    label: "Navigate 360",
    short: "Navigate",
    template: process.env.NEXT_PUBLIC_NAVIGATE_URL ?? "https://www.eab.com/products/navigate360/",
  },
  knack: {
    label: "Knack",
    short: "Knack",
    template: process.env.NEXT_PUBLIC_KNACK_URL ?? "https://www.knack.com/",
  },
  evaluations: {
    label: "Narrative Evaluations",
    short: "Narratives",
    template: process.env.NEXT_PUBLIC_EVALUATIONS_URL ?? "https://evaluations.ncf.edu",
  },
};

export function sourceLink(system: SourceSystem, studentId: string): string | null {
  const cfg = SYSTEMS[system];
  if (!cfg?.template) return null;
  return cfg.template.includes("{id}")
    ? cfg.template.replace("{id}", encodeURIComponent(studentId))
    : cfg.template;
}

export function sourceLabel(system: SourceSystem): string {
  return SYSTEMS[system]?.label ?? system;
}

// The major systems advisors jump to from the profile header.
export const PRIMARY_SYSTEMS: SourceSystem[] = ["banner", "degreeworks", "navigate"];

// Map a free-text "Source: X" panel footer to a system key, for clickable footers.
export function systemFromSourceText(text: string): SourceSystem | null {
  const t = text.toLowerCase();
  if (t.includes("degreeworks")) return "degreeworks";
  if (t.includes("banner")) return "banner";
  if (t.includes("navigate")) return "navigate";
  if (t.includes("knack")) return "knack";
  if (t.includes("evaluation")) return "evaluations";
  return null;
}
