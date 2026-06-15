"use client";

import { useState } from "react";
import { ThermometerBar } from "@/components/ui/ThermometerBar";
import { ISPPips, type ISPInfo } from "@/components/ui/ISPPips";
import {
  buildGraduationTracker,
  semestersRemaining,
  type DegreeProgressLike,
} from "@/lib/graduation-tracker";
import { RequirementsModal } from "./RequirementsModal";
import { buildAocRequirements, buildGraduationRequirements } from "@/lib/requirements";

interface Minor {
  minorName: string;
  isDeclared: boolean;
  coursesCompleted: number;
  coursesRequired: number;
  percentComplete: number;
  coursesNeeded: string[];
}

type DP = Omit<DegreeProgressLike, "minors"> & {
  ispRecords?: ISPInfo[];
  minors?: Minor[];
  genEdRequired?: number;
  genEdCompleted?: number;
  aocCreditRequired?: number;
  aocCreditCompleted?: number;
};

interface Props {
  degreeProgress: DP | null;
  creditsEarned: number;
  yearLevel: number;
  declaredAoc?: string | null;
  contracts?: { term: string; status: string }[];
  onOpenSinceEntry?: () => void;
}

export function GraduationTracker({ degreeProgress, creditsEarned, yearLevel, declaredAoc, contracts = [], onOpenSinceEntry }: Props) {
  const semRem = semestersRemaining(yearLevel);
  const bars = buildGraduationTracker(degreeProgress, creditsEarned, semRem);
  const [openId, setOpenId] = useState<string | null>(null);
  const [modal, setModal] = useState<"aoc" | "grad" | null>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      {onOpenSinceEntry ? (
        <button onClick={onOpenSinceEntry} className="group flex items-center gap-1.5 mb-3" title="View engagement since entry">
          <span className="text-[10.5px] font-bold text-gray-500 group-hover:text-navy uppercase tracking-wide transition-colors">
            Graduation Progress
          </span>
          <span className="text-[10px] text-navy/50 group-hover:text-navy transition-colors">Since entry →</span>
        </button>
      ) : (
        <h3 className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-3">
          Graduation Progress
        </h3>
      )}
      <p className="text-[10px] text-gray-400 -mt-2 mb-2">Click a requirement to see what is completed and missing.</p>

      <div className="divide-y divide-gray-50">
        {bars.map((b) => {
          const open = openId === b.id;
          return (
            <div key={b.id}>
              <button
                onClick={() => setOpenId(open ? null : b.id)}
                className={`w-full text-left rounded-lg px-1 py-1 -mx-1 transition-colors ${open ? "bg-navy/[0.04]" : "hover:bg-gray-50"}`}
              >
                {b.displayType === "pips" ? (
                  <div className="py-1 flex items-start gap-3">
                    <div className="w-40 flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-800">{b.label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{b.sublabel}</div>
                    </div>
                    <div className="flex-1">
                      <ISPPips completed={b.current} required={b.total} semestersRemaining={semRem} isps={degreeProgress?.ispRecords ?? []} />
                    </div>
                  </div>
                ) : (
                  <ThermometerBar
                    label={b.label} sublabel={b.sublabel} current={b.current} total={b.total}
                    unit={b.unit} colorScheme={b.colorScheme} ticks={b.ticks}
                    alertLabel={b.alertLabel} showPacingWarning={b.showPacingWarning}
                  />
                )}
              </button>
              {open && (
                <div className="mx-1 mb-2 mt-1 rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs">
                  {renderDetail(b.id, degreeProgress, creditsEarned)}
                  <div className="text-[10px] text-gray-400 mt-2">Source: DegreeWorks</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* View full requirements (DegreeWorks breakdown) */}
      <div className="flex flex-wrap gap-3 mt-3 pt-2 border-t border-gray-100">
        <button onClick={() => setModal("aoc")} className="text-[11px] font-medium text-navy hover:underline">
          View AOC requirements →
        </button>
        <button onClick={() => setModal("grad")} className="text-[11px] font-medium text-navy hover:underline">
          View graduation requirements →
        </button>
        <span className="ml-auto text-[10px] text-gray-400">Source: DegreeWorks · Banner</span>
      </div>

      {modal === "aoc" && (
        <RequirementsModal
          breakdown={buildAocRequirements(degreeProgress, declaredAoc ?? null)}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "grad" && (
        <RequirementsModal
          breakdown={buildGraduationRequirements({ creditsEarned }, degreeProgress, contracts)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function renderDetail(id: string, dp: DP | null, creditsEarned: number) {
  if (id === "total_credits") {
    const remaining = Math.max(0, 120 - creditsEarned);
    return (
      <Detail
        completed={[`${creditsEarned} credits earned`]}
        missing={remaining > 0 ? [`${remaining} credits remaining toward 120`] : []}
        done={remaining === 0}
      />
    );
  }
  if (id === "aoc") {
    const req = dp?.aocCreditRequired ?? 40;
    const comp = dp?.aocCreditCompleted ?? 0;
    return (
      <Detail
        completed={[`${comp} of ${req} AOC credits complete${dp?.aocName ? ` (${dp.aocName})` : ""}`]}
        missing={req - comp > 0 ? [`${req - comp} AOC credits still required`] : []}
        done={req - comp <= 0}
      />
    );
  }
  if (id === "gen_ed") {
    const req = dp?.genEdRequired ?? 20;
    const comp = dp?.genEdCompleted ?? 0;
    return (
      <Detail
        completed={[`${comp} of ${req} general-education requirements complete`]}
        missing={req - comp > 0 ? [`${req - comp} gen-ed requirement(s) outstanding`] : []}
        done={req - comp <= 0}
      />
    );
  }
  if (id.startsWith("minor_")) {
    const minor = (dp?.minors ?? []).find(
      (m) => `minor_${m.minorName.replace(/\s+/g, "_").toLowerCase()}` === id,
    );
    if (!minor) return <p className="text-gray-500">No minor detail available.</p>;
    return (
      <Detail
        completed={[`${minor.coursesCompleted} of ${minor.coursesRequired} courses complete`, minor.isDeclared ? "Minor declared" : "Not yet declared"]}
        missing={minor.coursesNeeded.length ? minor.coursesNeeded.map((c) => `Needs: ${c}`) : []}
        done={minor.coursesCompleted >= minor.coursesRequired}
      />
    );
  }
  if (id === "isps") {
    const records = dp?.ispRecords ?? [];
    const req = dp?.ispsRequired ?? 3;
    const completed = records.map((r) => `${r.title} (${r.term})`);
    const remaining = Math.max(0, req - records.filter((r) => r.status === "completed").length);
    return (
      <Detail
        completed={completed.length ? completed : ["No ISPs completed yet"]}
        missing={remaining > 0 ? [`${remaining} more ISP(s) required for graduation`] : []}
        done={remaining === 0}
      />
    );
  }
  if (id === "thesis") {
    const status = (dp?.thesisStatus ?? "not_started").replace(/_/g, " ");
    const sponsor = dp?.thesisSponsor;
    const done = dp?.thesisStatus === "approved" || dp?.thesisStatus === "submitted";
    return (
      <Detail
        completed={sponsor ? [`Sponsor: ${sponsor}`, `Status: ${status}`] : [`Status: ${status}`]}
        missing={!sponsor ? ["Thesis sponsor not yet identified"] : done ? [] : ["Thesis not yet submitted"]}
        done={done}
      />
    );
  }
  return <p className="text-gray-500">No detail available.</p>;
}

function Detail({ completed, missing, done }: { completed: string[]; missing: string[]; done: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1">Completed</div>
        <ul className="space-y-0.5">
          {completed.map((c, i) => (
            <li key={i} className="text-gray-700 flex gap-1.5"><span className="text-emerald-500">✓</span>{c}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">Missing</div>
        {missing.length ? (
          <ul className="space-y-0.5">
            {missing.map((m, i) => (
              <li key={i} className="text-gray-700 flex gap-1.5"><span className="text-amber-500">•</span>{m}</li>
            ))}
          </ul>
        ) : (
          <p className="text-emerald-600 text-[11px]">{done ? "Requirement complete." : "Nothing outstanding."}</p>
        )}
      </div>
    </div>
  );
}
