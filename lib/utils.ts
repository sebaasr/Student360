import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string | null | undefined, fallback = "—"): string {
  if (!date) return fallback;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function yearLabel(yearLevel: number): string {
  return ["", "First-Year", "Sophomore", "Junior", "Senior"][yearLevel] ?? "Unknown";
}

// Consistent color per class year, used across the roster.
export interface YearColor {
  dot: string;      // bg color for a dot
  bar: string;      // left-border accent
  chip: string;     // badge bg+text+border
}
export function yearColor(yearLevel: number): YearColor {
  const map: Record<number, YearColor> = {
    1: { dot: "bg-sky-400",     bar: "border-l-sky-400",     chip: "bg-sky-50 text-sky-700 border-sky-200" },
    2: { dot: "bg-emerald-400", bar: "border-l-emerald-400", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    3: { dot: "bg-amber-400",   bar: "border-l-amber-400",   chip: "bg-amber-50 text-amber-700 border-amber-200" },
    4: { dot: "bg-violet-400",  bar: "border-l-violet-400",  chip: "bg-violet-50 text-violet-700 border-violet-200" },
  };
  return map[yearLevel] ?? { dot: "bg-gray-300", bar: "border-l-gray-300", chip: "bg-gray-50 text-gray-600 border-gray-200" };
}

// NCF groups AOCs into three divisions. The AOC label is "Division (AOC)",
// e.g. "Natural Sciences (Biology)" → division "Natural Sciences".
export function divisionFromAoc(aoc: string | null | undefined): string {
  if (!aoc) return "Undeclared";
  const before = aoc.split("(")[0].trim();
  return before || "Undeclared";
}

export function studentDisplayName(s: { firstName: string; lastName: string; preferredName?: string | null }): string {
  return s.preferredName ? `${s.preferredName} ${s.lastName}` : `${s.firstName} ${s.lastName}`;
}
