/**
 * Dynamic requirement breakdowns for the student profile, in the style of the
 * original Student 360 dashboard. These mirror what DegreeWorks returns:
 * grouped requirement categories, each with line items and a completion status.
 *
 * Until the live DegreeWorks connector is wired, the breakdowns are derived
 * from the student's aggregate degree-progress record plus the NCF course
 * catalog, so they are dynamic per student. The connector will later replace
 * the derivation with the official audit's exact line items.
 */

import { coursesForAoc, disciplineFromAoc, type CatalogCourse } from "./ncf-catalog";
import { NCF_COURSES_BY_DIVISION } from "./ncf-enrollment";

export type ReqStatus = "complete" | "in_progress" | "not_fulfilled";

export interface ReqItem {
  name: string;
  subtext?: string;
  status: ReqStatus;
}
export interface ReqSection {
  label: string;
  summary: string;
  items: ReqItem[];
}
export interface RequirementBreakdown {
  title: string;
  percent: number;
  subtitle: string;
  sections: ReqSection[];
}

interface DPLike {
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
  ispRecords?: { title: string; term: string; status: string }[];
}

const STATUS_LABEL: Record<ReqStatus, string> = {
  complete: "Complete",
  in_progress: "In progress",
  not_fulfilled: "Not yet fulfilled",
};
export function statusLabel(s: ReqStatus): string {
  return STATUS_LABEL[s];
}

// ── AOC requirements ────────────────────────────────────────────────────────
export function buildAocRequirements(dp: DPLike | null, declaredAoc: string | null): RequirementBreakdown {
  const discipline = disciplineFromAoc(declaredAoc) ?? "Undeclared";
  const catalog = coursesForAoc(declaredAoc);
  const pct = Math.round((dp?.aocPercentComplete ?? 0) * 100);

  // How many catalog courses count as "done" given completion %.
  const done = Math.round((catalog.length * pct) / 100);

  const foundations = catalog.filter((c) => c.level === "intro");
  const core = catalog.filter((c) => c.level === "intermediate" || c.level === "advanced");

  // Assign statuses across the ordered catalog: first `done` complete, next 1-2 in progress.
  let cursor = 0;
  const withStatus = (courses: CatalogCourse[]): ReqItem[] =>
    courses.map((c) => {
      const idx = cursor++;
      const status: ReqStatus = idx < done ? "complete" : idx < done + 2 ? "in_progress" : "not_fulfilled";
      return {
        name: c.title,
        subtext: `${c.code}${status === "in_progress" ? " · currently enrolled" : status === "not_fulfilled" ? " · not yet taken" : ""}`,
        status,
      };
    });

  const foundationItems = withStatus(foundations);
  const coreItems = withStatus(core);

  const sections: ReqSection[] = [];
  if (foundationItems.length)
    sections.push({ label: "Foundations", summary: countSummary(foundationItems), items: foundationItems });
  if (coreItems.length)
    sections.push({ label: `Core ${discipline}`, summary: countSummary(coreItems), items: coreItems });

  // Electives requirement (derived, no specific courses)
  const electivesNeeded = Math.max(0, (dp?.aocCreditRequired ?? 40) - (dp?.aocCreditCompleted ?? 0));
  sections.push({
    label: "Electives & advanced work",
    summary: electivesNeeded > 0 ? `${electivesNeeded} credits remaining` : "Complete",
    items: [
      {
        name: "Additional AOC electives",
        subtext: electivesNeeded > 0 ? `${electivesNeeded} credits still required` : "Requirement met",
        status: electivesNeeded > 0 ? "not_fulfilled" : "complete",
      },
    ],
  });

  // Senior thesis
  sections.push(thesisSection(dp));

  const reqTotal = sections.reduce((n, s) => n + s.items.length, 0);
  const reqDone = sections.reduce((n, s) => n + s.items.filter((i) => i.status === "complete").length, 0);

  return {
    title: `Area of Concentration — ${pct}% complete`,
    percent: pct,
    subtitle: `${discipline} · ${reqDone} of ${reqTotal} requirements complete`,
    sections,
  };
}

// ── General education requirements ──────────────────────────────────────────
// NCF / Florida liberal-arts general-education program: first-year foundations,
// breadth across the three divisions, and advanced general-education work.
export function buildGenEdRequirements(dp: DPLike | null): RequirementBreakdown {
  const req = dp?.genEdRequired ?? 20;
  const done = Math.max(0, Math.min(req, dp?.genEdCompleted ?? 0));
  const pct = req > 0 ? Math.round((done / req) * 100) : 0;

  // A representative real course for a division (first in catalog).
  const ex = (division: string) => NCF_COURSES_BY_DIVISION[division]?.[0]?.title;

  // Named requirements in completion order; the first `mapped` are complete,
  // the next one or two are in progress, the rest are not yet fulfilled.
  const ordered: { name: string; subtext?: string }[] = [
    { name: "First-Year Writing Seminar", subtext: "Rhetoric and Writing: Writing about Writing" },
    { name: "Quantitative Reasoning", subtext: "Introduction to Applied Statistics or Calculus" },
    { name: "Humanities exploration", subtext: ex("Humanities") },
    { name: "Natural Sciences exploration", subtext: ex("Natural Sciences") },
    { name: "Social Sciences exploration", subtext: ex("Social Sciences") },
    { name: "Writing-Enhanced course", subtext: "Upper-level writing-intensive coursework" },
    { name: "Global / cross-cultural perspective", subtext: "Language or area-studies coursework" },
    { name: "Liberal Arts Capstone connection", subtext: "Integrative general-education requirement" },
  ];

  const mapped = Math.round((ordered.length * done) / req);
  const items: ReqItem[] = ordered.map((o, idx) => {
    const status: ReqStatus = idx < mapped ? "complete" : idx < mapped + 2 ? "in_progress" : "not_fulfilled";
    return {
      name: o.name,
      subtext: o.subtext
        ? `${o.subtext}${status === "in_progress" ? " · in progress" : status === "not_fulfilled" ? " · not yet taken" : ""}`
        : undefined,
      status,
    };
  });

  const foundations = items.slice(0, 2);
  const breadth = items.slice(2, 5);
  const advanced = items.slice(5);

  const sections: ReqSection[] = [
    { label: "First-Year Foundations", summary: countSummary(foundations), items: foundations },
    { label: "Liberal Arts Breadth (by division)", summary: countSummary(breadth), items: breadth },
    { label: "Advanced General Education", summary: countSummary(advanced), items: advanced },
  ];

  return {
    title: `General Education — ${pct}% complete`,
    percent: pct,
    subtitle: `Florida liberal-arts general-education program · ${done} of ${req} requirements complete`,
    sections,
  };
}

// ── Graduation requirements ─────────────────────────────────────────────────
export function buildGraduationRequirements(
  student: { creditsEarned: number },
  dp: DPLike | null,
  contracts: { term: string; status: string }[],
): RequirementBreakdown {
  const creditsEarned = student.creditsEarned;
  const creditsRemaining = Math.max(0, 120 - creditsEarned);

  // Contracts
  const contractItems: ReqItem[] = [...contracts]
    .sort((a, b) => a.term.localeCompare(b.term))
    .map((c) => {
      const status: ReqStatus =
        c.status === "signed" || c.status === "finalized"
          ? "complete"
          : c.status === "in_progress" || c.status === "pending_advisor"
            ? "in_progress"
            : "not_fulfilled";
      return { name: `Contract — ${c.term}`, subtext: c.status.replace(/_/g, " "), status };
    });

  // ISPs
  const ispsReq = dp?.ispsRequired ?? 3;
  const ispRecords = dp?.ispRecords ?? [];
  const ispItems: ReqItem[] = [];
  for (let i = 0; i < ispsReq; i++) {
    const r = ispRecords[i];
    ispItems.push(
      r
        ? { name: r.title || `ISP ${i + 1}`, subtext: `${r.term} · ${r.status}`, status: r.status === "completed" ? "complete" : "in_progress" }
        : { name: `ISP ${i + 1}`, subtext: "Not yet started", status: "not_fulfilled" },
    );
  }

  // Credits, AOC, gen-ed, thesis (AOC and gen-ed each have their own detailed modal)
  const aocPct = Math.round((dp?.aocPercentComplete ?? 0) * 100);
  const genEdReq = dp?.genEdRequired ?? 20;
  const genEdDone = Math.min(genEdReq, dp?.genEdCompleted ?? 0);
  const creditsThesis: ReqItem[] = [
    {
      name: "120 total credits",
      subtext: `${creditsEarned} earned · ${creditsRemaining} remaining`,
      status: creditsRemaining === 0 ? "complete" : "in_progress",
    },
    {
      name: "AOC completed",
      subtext: `${dp?.aocName ?? "Undeclared"} · ${aocPct}% complete`,
      status: aocPct >= 100 ? "complete" : aocPct > 0 ? "in_progress" : "not_fulfilled",
    },
    {
      name: "General education completed",
      subtext: `${genEdDone} of ${genEdReq} requirements complete`,
      status: genEdDone >= genEdReq ? "complete" : genEdDone > 0 ? "in_progress" : "not_fulfilled",
    },
    thesisItem(dp),
  ];

  const sections: ReqSection[] = [
    { label: "Contracts", summary: countSummary(contractItems, "satisfactory"), items: contractItems },
    { label: "Independent Study Projects", summary: countSummary(ispItems), items: ispItems },
    { label: "Credits, AOC & Thesis", summary: countSummary(creditsThesis), items: creditsThesis },
  ];

  const reqTotal = sections.reduce((n, s) => n + s.items.length, 0);
  const reqDone = sections.reduce((n, s) => n + s.items.filter((i) => i.status === "complete").length, 0);
  const percent = reqTotal > 0 ? Math.round((reqDone / reqTotal) * 100) : 0;

  return {
    title: `Graduation requirements — ${percent}% complete`,
    percent,
    subtitle: `Contracts, ISPs, credits, AOC, and senior thesis · 120 credits required · ${creditsEarned} earned · ${creditsRemaining} remaining`,
    sections,
  };
}

// ── helpers ─────────────────────────────────────────────────────────────────
function countSummary(items: ReqItem[], word = "complete"): string {
  const done = items.filter((i) => i.status === "complete").length;
  return `${done} of ${items.length} ${word}`;
}

function thesisItem(dp: DPLike | null): ReqItem {
  const status = dp?.thesisStatus ?? "not_started";
  return {
    name: "Senior thesis",
    subtext: dp?.thesisSponsor ? `Sponsor: ${dp.thesisSponsor}` : status.replace(/_/g, " "),
    status: status === "approved" || status === "submitted" ? "complete" : status === "not_started" ? "not_fulfilled" : "in_progress",
  };
}

function thesisSection(dp: DPLike | null): ReqSection {
  const status = dp?.thesisStatus ?? "not_started";
  const items: ReqItem[] = [
    {
      name: "Thesis prospectus",
      subtext: status === "not_started" ? "Not yet started" : "Submitted",
      status: status === "not_started" ? "not_fulfilled" : "complete",
    },
    {
      name: "Thesis defense",
      subtext: status === "approved" ? "Defended" : "Scheduled in final year",
      status: status === "approved" ? "complete" : status === "submitted" ? "in_progress" : "not_fulfilled",
    },
  ];
  return { label: `Senior Thesis (${status.replace(/_/g, " ")})`, summary: countSummary(items), items };
}
