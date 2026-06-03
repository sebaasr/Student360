"use client";

import { useMemo, useState } from "react";
import { RosterRow } from "./RosterRow";
import { RosterStats } from "./RosterStats";
import { EmptyState } from "@/components/ui/EmptyState";
import type { RosterResponse, RosterStudent } from "@/types/student";
import { yearLabel } from "@/lib/utils";

type ViewKey = "all" | "attention" | "no_contract" | "not_met" | "athletes" | "transfers";

export function RosterTable({
  initial,
}: {
  initial: RosterResponse;
}) {
  const [view, setView] = useState<ViewKey>("all");
  const [yearFilter, setYearFilter] = useState<"all" | "1" | "2" | "3" | "4">("all");
  const [query, setQuery] = useState("");

  const students = initial.students;

  // sidebar counts
  const [sportFilter, setSportFilter] = useState<string>("all");

  const counts = useMemo(() => ({
    all: students.length,
    attention: students.filter((s) => s.priority === "high").length,
    no_contract: students.filter(
      (s) => !s.currentTermContract || s.currentTermContract.status === "not_started",
    ).length,
    not_met: students.filter((s) => !s.lastAdvisingDate).length,
    athletes: students.filter((s) => s.isStudentAthlete).length,
    transfers: students.filter((s) => s.isTransfer).length,
  }), [students]);

  const sportGroups = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students.filter((s) => s.isStudentAthlete)) {
      const key = s.athleteSport ?? "Unknown";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [students]);

  // AOC counts
  const aocGroups = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) {
      const key = s.aoc ?? "Undeclared";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [students]);

  const filtered = useMemo(() => {
    let list = students;

    // view filter
    if (view === "attention") list = list.filter((s) => s.priority === "high");
    else if (view === "no_contract")
      list = list.filter(
        (s) => !s.currentTermContract || s.currentTermContract.status === "not_started",
      );
    else if (view === "not_met") list = list.filter((s) => !s.lastAdvisingDate);
    else if (view === "athletes") list = list.filter((s) => s.isStudentAthlete);
    else if (view === "transfers") list = list.filter((s) => s.isTransfer);

    // sport filter (only applies within athletes view or independently)
    if (sportFilter !== "all")
      list = list.filter((s) => s.athleteSport === sportFilter);

    // year filter
    if (yearFilter !== "all") list = list.filter((s) => String(s.yearLevel) === yearFilter);

    // search
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q),
      );

    return list;
  }, [students, view, yearFilter, query]);

  const yearCounts = useMemo(() => {
    const map: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0 };
    for (const s of students) map[String(s.yearLevel)] = (map[String(s.yearLevel)] ?? 0) + 1;
    return map;
  }, [students]);

  const views: { key: ViewKey; label: string }[] = [
    { key: "all", label: "All Advisees" },
    { key: "attention", label: "Needs Attention" },
    { key: "no_contract", label: "No Contract Yet" },
    { key: "not_met", label: "Not Met This Term" },
    { key: "athletes", label: "Student-Athletes" },
    { key: "transfers", label: "Transfer Students" },
  ];

  const years: { value: "1" | "2" | "3" | "4"; label: string }[] = [
    { value: "1", label: "First-Year" },
    { value: "2", label: "Sophomore" },
    { value: "3", label: "Junior" },
    { value: "4", label: "Senior" },
  ];

  return (
    <div className="flex gap-6 items-start">
      {/* ── Sidebar ── */}
      <aside className="w-52 shrink-0 space-y-6">
        {/* Views */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
            Views
          </p>
          <nav className="space-y-0.5">
            {views.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  view === v.key
                    ? "bg-navy text-white font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{v.label}</span>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    view === v.key ? "text-gold" : "text-gray-400"
                  }`}
                >
                  {counts[v.key]}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filter by Year */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
            Filter by Year
          </p>
          <nav className="space-y-0.5">
            {years.map((y) => (
              <button
                key={y.value}
                onClick={() =>
                  setYearFilter((prev) => (prev === y.value ? "all" : y.value))
                }
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  yearFilter === y.value
                    ? "bg-navy/10 text-navy font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{y.label}</span>
                <span className="text-xs text-gray-400 tabular-nums">
                  {yearCounts[y.value] ?? 0}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* By AOC */}
        {aocGroups.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
              By AOC
            </p>
            <nav className="space-y-0.5">
              {aocGroups.map(([aoc, count]) => (
                <div
                  key={aoc}
                  className="flex items-center justify-between px-3 py-1.5 text-sm text-gray-600"
                >
                  <span className="truncate">{aoc}</span>
                  <span className="text-xs text-gray-400 tabular-nums ml-2">{count}</span>
                </div>
              ))}
            </nav>
          </div>
        )}

        {/* By Sport */}
        {sportGroups.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
              By Sport
            </p>
            <nav className="space-y-0.5">
              <button
                onClick={() => { setSportFilter("all"); setView("athletes"); }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors text-left ${sportFilter === "all" && view === "athletes" ? "bg-navy/10 text-navy font-medium" : "text-gray-700 hover:bg-gray-100"}`}
              >
                <span>All athletes</span>
                <span className="text-xs text-gray-400 tabular-nums">{counts.athletes}</span>
              </button>
              {sportGroups.map(([sport, count]) => (
                <button
                  key={sport}
                  onClick={() => { setSportFilter(sport); setView("athletes"); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors text-left ${sportFilter === sport ? "bg-navy/10 text-navy font-medium" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <span className="truncate">{sport}</span>
                  <span className="text-xs text-gray-400 tabular-nums ml-2">{count}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 space-y-4">
        <RosterStats stats={initial.stats} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-navy">
            {views.find((v) => v.key === view)?.label}
            <span className="ml-2 text-sm font-normal text-gray-400">
              {filtered.length} student{filtered.length !== 1 ? "s" : ""}
            </span>
          </h2>
          <input
            type="search"
            placeholder="Search by name or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy w-64"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-[10.5px] font-bold uppercase tracking-wide text-gray-400">
            <div className="col-span-3">Student</div>
            <div className="col-span-2">Year · AOC</div>
            <div className="col-span-2">Standing</div>
            <div className="col-span-2">Contract</div>
            <div className="col-span-2">Last Meeting</div>
            <div className="col-span-1 text-right">Priority</div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              title="No students match"
              description="Try a different view or clear the search."
            />
          ) : (
            filtered.map((s) => <RosterRow key={s.id} student={s} />)
          )}
        </div>
      </div>
    </div>
  );
}
