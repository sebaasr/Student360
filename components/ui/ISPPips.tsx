"use client";

import { useState } from "react";

export interface ISPInfo {
  title: string;
  term: string;
  status: string;
  supervisorName: string | null;
}

interface ISPPipsProps {
  completed: number;
  required: number;
  semestersRemaining: number;
  isps?: ISPInfo[];
}

export function ISPPips({ completed, required, semestersRemaining, isps = [] }: ISPPipsProps) {
  const remaining = required - completed;
  const hasPacingRisk = remaining > semestersRemaining;
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2">
        {Array.from({ length: required }).map((_, i) => {
          const done = i < completed;
          const isp = isps[i];
          const clickable = done && !!isp;
          return (
            <div key={i} className="relative">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-transform ${
                  done
                    ? "bg-[#202944] text-white border-[#202944]"
                    : "bg-gray-100 text-gray-400 border-gray-200"
                } ${clickable ? "hover:scale-110 cursor-pointer ring-offset-1 hover:ring-2 hover:ring-gold" : "cursor-default"}`}
                title={clickable ? `${isp.title}` : done ? "ISP completed" : "ISP not yet completed"}
              >
                {i + 1}
              </button>

              {openIdx === i && isp && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenIdx(null)} />
                  <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-60 bg-white rounded-lg shadow-xl border border-gray-200 p-3 text-left">
                    <div className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-1">
                      ISP #{i + 1}
                    </div>
                    <div className="text-sm font-semibold text-navy leading-snug">{isp.title}</div>
                    <div className="mt-1.5 space-y-0.5 text-[11px] text-gray-600">
                      <div><span className="text-gray-400">Term:</span> {isp.term}</div>
                      {isp.supervisorName && (
                        <div><span className="text-gray-400">Supervisor:</span> {isp.supervisorName}</div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Status:</span>
                        <span className={`font-medium ${isp.status === "completed" ? "text-emerald-700" : "text-amber-700"}`}>
                          {isp.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-xs text-gray-600">
        {completed} complete ·{" "}
        <span className={hasPacingRisk ? "text-amber-700 font-semibold" : ""}>
          {remaining} remaining
        </span>
        {hasPacingRisk && " · Pacing risk — plan soon"}
        {isps.length > 0 && <span className="text-gray-400"> · click a pip for details</span>}
      </div>
    </div>
  );
}
