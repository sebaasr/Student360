"use client";

import { useMemo, useState } from "react";
import { RosterRow } from "./RosterRow";
import { RosterFilters, type RosterFilterState } from "./RosterFilters";
import { RosterStats } from "./RosterStats";
import { EmptyState } from "@/components/ui/EmptyState";
import type { RosterResponse } from "@/types/student";

export function RosterTable({
  initial,
  title = "Your Advisees",
}: {
  initial: RosterResponse;
  title?: string;
}) {
  const [filters, setFilters] = useState<RosterFilterState>({
    query: "",
    year: "all",
    priority: "all",
  });

  const filtered = useMemo(() => {
    return initial.students.filter((s) => {
      if (filters.year !== "all" && String(s.yearLevel) !== filters.year) return false;
      if (filters.priority !== "all" && s.priority !== filters.priority) return false;
      const q = filters.query.trim().toLowerCase();
      if (q) {
        return (
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.preferredName ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [initial.students, filters]);

  return (
    <div className="space-y-4">
      <RosterStats stats={initial.stats} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-navy">{title}</h2>
        <RosterFilters value={filters} onChange={setFilters} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-[10.5px] font-bold uppercase tracking-wide text-gray-500">
          <div className="col-span-3">Student</div>
          <div className="col-span-2">Year · AOC</div>
          <div className="col-span-2">Standing</div>
          <div className="col-span-2">Contract</div>
          <div className="col-span-2">Advising</div>
          <div className="col-span-1 text-right">Priority</div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No students match" description="Adjust filters or clear the search." />
        ) : (
          filtered.map((s) => <RosterRow key={s.id} student={s} />)
        )}
      </div>
    </div>
  );
}
