"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { yearLabel } from "@/lib/utils";

export interface CohortMember {
  id: string;
  name: string;
  yearLevel: number;
  aoc: string | null;
  academicStanding: string;
  priority: "high" | "medium" | "low";
}

export interface CohortData {
  id: string;
  label: string;
  description: string;
  members: CohortMember[];
}

const standingVariant: Record<string, "green" | "amber" | "red"> = {
  good_standing: "green",
  academic_warning: "amber",
  academic_probation: "red",
};

export function CohortGrid({ cohorts }: { cohorts: CohortData[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openCohort = cohorts.find((c) => c.id === openId) ?? null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cohorts.map((c) => (
          <button
            key={c.id}
            onClick={() => setOpenId(c.id)}
            disabled={c.members.length === 0}
            className="text-left bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-navy/40 hover:shadow transition-all disabled:opacity-60 disabled:hover:border-gray-200 disabled:cursor-default"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-navy">{c.label}</h2>
              <span className="text-2xl font-bold text-navy tabular-nums">{c.members.length}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 mb-3">{c.description}</p>
            <div className="flex items-center gap-1.5">
              {c.members.slice(0, 5).map((m) => (
                <div key={m.id} title={m.name}>
                  <Avatar name={m.name} size={24} />
                </div>
              ))}
              {c.members.length > 5 && (
                <span className="text-[11px] text-gray-400 ml-1">+{c.members.length - 5}</span>
              )}
              {c.members.length === 0 && (
                <span className="text-[11px] text-gray-400 italic">No students match.</span>
              )}
            </div>
            {c.members.length > 0 && (
              <div className="text-[11px] text-navy/60 font-medium mt-3">View all {c.members.length} →</div>
            )}
          </button>
        ))}
      </div>

      {/* Modal */}
      {openCohort && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[8vh] px-4"
          onClick={() => setOpenId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-navy">{openCohort.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {openCohort.description} · {openCohort.members.length} students
                </p>
              </div>
              <button onClick={() => setOpenId(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="overflow-y-auto divide-y divide-gray-50">
              {openCohort.members.map((m) => (
                <Link
                  key={m.id}
                  href={`/student/${m.id}`}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <Avatar name={m.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-navy truncate">{m.name}</div>
                    <div className="text-[11px] text-gray-400 truncate">
                      <span className="font-mono">{m.id}</span> · {yearLabel(m.yearLevel)}
                      {m.aoc ? ` · ${m.aoc}` : ""}
                    </div>
                  </div>
                  <Badge variant={standingVariant[m.academicStanding] ?? "green"}>
                    {m.academicStanding.replace(/_/g, " ")}
                  </Badge>
                </Link>
              ))}
            </div>
            <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/60 text-[11px] text-gray-400">
              Click a student to open their full profile.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
