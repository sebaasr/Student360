"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

interface Evaluation {
  id: string;
  instructorName: string;
  courseCode: string;
  courseTitle: string;
  term: string;
  termCode: string;
  evaluationText: string;
  status: string;
}

const statusVariant: Record<string, "green" | "amber" | "red" | "neutral"> = {
  satisfactory: "green",
  unsatisfactory: "red",
  incomplete: "amber",
  missing: "neutral",
};

// Subject prefix from a course code: "BIO 310" -> "BIO", "ISP-001" -> "ISP"
function subjectOf(courseCode: string): string {
  const m = courseCode.match(/^[A-Za-z]+/);
  return m ? m[0].toUpperCase() : "OTHER";
}

export function EvaluationsPanel({
  evaluations,
  studentAoc,
}: {
  evaluations: Evaluation[];
  studentAoc?: string | null;
}) {
  const [term, setTerm] = useState<string>("all");
  const [subject, setSubject] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Build filter option lists (most recent term first)
  const terms = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of evaluations) seen.set(e.termCode, e.term);
    return [...seen.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [evaluations]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    for (const e of evaluations) set.add(subjectOf(e.courseCode));
    return [...set].sort();
  }, [evaluations]);

  const filtered = useMemo(() => {
    return evaluations
      .filter((e) => (term === "all" ? true : e.termCode === term))
      .filter((e) => (subject === "all" ? true : subjectOf(e.courseCode) === subject))
      .sort((a, b) => b.termCode.localeCompare(a.termCode));
  }, [evaluations, term, subject]);

  // Group filtered results by term for readable display
  const grouped = useMemo(() => {
    const map = new Map<string, Evaluation[]>();
    for (const e of filtered) {
      const arr = map.get(e.term) ?? [];
      arr.push(e);
      map.set(e.term, arr);
    }
    return [...map.entries()];
  }, [filtered]);

  const total = evaluations.length;
  const satisfactory = evaluations.filter((e) => e.status === "satisfactory").length;
  const flagged = evaluations.filter((e) => e.status === "unsatisfactory" || e.status === "incomplete").length;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <EmptyState title="No narrative evaluations on file" description="Evaluations sync nightly from the NCF Evaluations System." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header + summary */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">
            Narrative Evaluations
          </h3>
          <div className="flex gap-3 text-xs">
            <span className="text-gray-500">{total} total</span>
            <span className="text-emerald-700">{satisfactory} satisfactory</span>
            {flagged > 0 && <span className="text-amber-700">{flagged} flagged</span>}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-navy focus:border-navy"
          >
            <option value="all">All semesters</option>
            {terms.map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-navy focus:border-navy"
          >
            <option value="all">All subjects{studentAoc ? ` · AOC: ${studentAoc}` : ""}</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {(term !== "all" || subject !== "all") && (
            <button
              onClick={() => { setTerm("all"); setSubject("all"); }}
              className="text-[11px] text-gray-400 hover:text-navy"
            >
              Clear filters
            </button>
          )}
          <span className="text-[11px] text-gray-400 ml-auto">
            Showing {filtered.length} of {total}
          </span>
        </div>
      </div>

      {/* Grouped evaluations */}
      <div className="divide-y divide-gray-100">
        {grouped.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">No evaluations match these filters.</div>
        ) : (
          grouped.map(([termLabel, evals]) => (
            <div key={termLabel} className="p-4">
              <div className="text-[11px] font-bold text-navy uppercase tracking-wide mb-2">
                {termLabel}
                <span className="ml-2 text-gray-400 font-normal normal-case">
                  {evals.length} evaluation{evals.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-3">
                {evals.map((e) => {
                  const isOpen = expanded.has(e.id);
                  const isLong = e.evaluationText.length > 240;
                  return (
                    <div key={e.id} className="rounded-lg border border-gray-100 p-3 hover:border-gray-200 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-navy">
                            <span className="font-mono text-xs text-gray-400 mr-1.5">{e.courseCode}</span>
                            {e.courseTitle}
                          </div>
                          <div className="text-[11px] text-gray-500">Instructor: {e.instructorName}</div>
                        </div>
                        <Badge variant={statusVariant[e.status] ?? "neutral"}>{e.status}</Badge>
                      </div>
                      <p className={`text-xs text-gray-700 leading-relaxed ${isOpen || !isLong ? "" : "line-clamp-3"}`}>
                        {e.evaluationText}
                      </p>
                      {isLong && (
                        <button
                          onClick={() => toggle(e.id)}
                          className="text-[11px] text-navy font-medium mt-1 hover:underline"
                        >
                          {isOpen ? "Show less" : "Read full evaluation"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-[10px] text-gray-400 px-4 py-2 border-t border-gray-100 bg-gray-50/60">
        Source: NCF Evaluations System
      </div>
    </div>
  );
}
