"use client";

import { useState } from "react";

interface Insight {
  id: string;
  insightType: string;
  insightCode: string;
  title: string;
  body: string;
  subtext?: string | null;
  ctaText?: string | null;
  severity: string;
  isDiscussed?: boolean;
  isDismissed?: boolean;
}

interface Props {
  studentId: string;
  insights: Insight[];
}

const severityRank: Record<string, number> = { urgent: 0, warning: 1, info: 2 };

export function PredictiveInsightsPanel({ studentId, insights }: Props) {
  const [local, setLocal] = useState(insights);

  const sorted = [...local].sort(
    (a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9),
  );

  async function dismiss(id: string) {
    setLocal((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/student/${studentId}/insight/${id}/dismiss`, { method: "POST" });
  }

  async function discuss(id: string) {
    setLocal((prev) => prev.map((i) => (i.id === id ? { ...i, isDiscussed: true } : i)));
    await fetch(`/api/student/${studentId}/insight/${id}/discussed`, { method: "POST" });
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl p-4 bg-gradient-to-br from-navy to-navy-dark text-white">
        <h3 className="text-[10.5px] font-bold uppercase tracking-wide mb-2 text-gold">
          ✨ Predictive Insights
        </h3>
        <div className="text-sm text-gray-200">No active insights for this student.</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 bg-gradient-to-br from-navy to-navy-dark text-white">
      <h3 className="text-[10.5px] font-bold uppercase tracking-wide mb-3 text-gold">
        ✨ Predictive Insights
      </h3>
      <div className="space-y-2">
        {sorted.map((i) => (
          <div key={i.id} className="bg-white/95 rounded-lg p-3 text-gray-900 border border-white/40">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityDot severity={i.severity} />
                  <span className="text-sm font-semibold">{i.title}</span>
                </div>
                <p className="text-xs text-gray-700">{i.body}</p>
                {i.subtext && (
                  <p className="text-[11px] text-gray-500 mt-1">{i.subtext}</p>
                )}
                {i.ctaText && (
                  <p className="text-[11px] text-navy font-medium mt-1.5">{i.ctaText}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => discuss(i.id)}
                disabled={i.isDiscussed}
                className="text-[11px] px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                {i.isDiscussed ? "Discussed ✓" : "Mark discussed"}
              </button>
              <button
                onClick={() => dismiss(i.id)}
                className="text-[11px] px-2 py-1 rounded text-gray-500 hover:text-gray-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    urgent: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[severity] ?? "bg-gray-400"}`} />;
}
