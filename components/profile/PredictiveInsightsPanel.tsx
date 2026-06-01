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

// Map each insight into one of the 3 display buckets
type Bucket = "opportunity" | "thematic" | "action";

const bucketConfig: Record<Bucket, {
  label: string;
  icon: string;
  bg: string;
  border: string;
  headerBg: string;
  headerText: string;
  dot: string;
}> = {
  opportunity: {
    label: "Opportunity",
    icon: "◆",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    headerBg: "bg-emerald-600",
    headerText: "text-white",
    dot: "bg-emerald-500",
  },
  thematic: {
    label: "Thematic Pattern",
    icon: "⬡",
    bg: "bg-blue-50",
    border: "border-blue-200",
    headerBg: "bg-blue-600",
    headerText: "text-white",
    dot: "bg-blue-500",
  },
  action: {
    label: "Action Needed",
    icon: "▲",
    bg: "bg-red-50",
    border: "border-red-200",
    headerBg: "bg-red-600",
    headerText: "text-white",
    dot: "bg-red-500",
  },
};

function toBucket(insight: Insight): Bucket {
  if (insight.insightType === "opportunity") return "opportunity";
  if (insight.insightType === "thematic_pattern") return "thematic";
  return "action";
}

const severityRank: Record<string, number> = { urgent: 0, warning: 1, info: 2 };

export function PredictiveInsightsPanel({ studentId, insights }: Props) {
  const [local, setLocal] = useState(insights);

  const active = [...local]
    .filter((i) => !i.isDismissed)
    .sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9));

  const buckets: Record<Bucket, Insight[]> = {
    opportunity: active.filter((i) => toBucket(i) === "opportunity"),
    thematic: active.filter((i) => toBucket(i) === "thematic"),
    action: active.filter((i) => toBucket(i) === "action"),
  };

  async function dismiss(id: string) {
    setLocal((prev) => prev.map((i) => (i.id === id ? { ...i, isDismissed: true } : i)));
    await fetch(`/api/student/${studentId}/insight/${id}/dismiss`, { method: "POST" });
  }

  async function discuss(id: string) {
    setLocal((prev) => prev.map((i) => (i.id === id ? { ...i, isDiscussed: true } : i)));
    await fetch(`/api/student/${studentId}/insight/${id}/discussed`, { method: "POST" });
  }

  const totalActive = active.length;

  return (
    <div className="rounded-xl overflow-hidden border border-navy/20 shadow-sm">
      {/* Panel header */}
      <div className="bg-navy px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gold text-sm">✦</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-white">
            Predictive Insights & Advisor Suggestions
          </span>
        </div>
        <span className="text-[10px] text-gray-400">
          Generated from academic history · Updated today
        </span>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 bg-white">
        {(["opportunity", "thematic", "action"] as Bucket[]).map((bucket) => {
          const cfg = bucketConfig[bucket];
          const items = buckets[bucket];

          return (
            <div key={bucket} className="flex flex-col">
              {/* Column header */}
              <div className={`${cfg.headerBg} ${cfg.headerText} px-3 py-2 flex items-center gap-1.5`}>
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {cfg.icon} {cfg.label}
                </span>
              </div>

              {/* Column body */}
              <div className="flex-1 p-3 space-y-2.5 min-h-[120px]">
                {items.length === 0 ? (
                  <p className="text-xs text-gray-400 italic mt-2">No {cfg.label.toLowerCase()} insights.</p>
                ) : (
                  items.map((insight) => (
                    <div key={insight.id} className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-snug">
                            {insight.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {insight.body}
                          </p>
                          {insight.subtext && (
                            <p className="text-[11px] text-gray-500 mt-1">{insight.subtext}</p>
                          )}
                          {insight.ctaText && (
                            <p className="text-[11px] font-semibold text-navy mt-1.5">
                              {insight.ctaText}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => discuss(insight.id)}
                              disabled={insight.isDiscussed}
                              className="text-[10px] px-2 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                              {insight.isDiscussed ? "Discussed ✓" : "Mark discussed"}
                            </button>
                            <button
                              onClick={() => dismiss(insight.id)}
                              className="text-[10px] px-2 py-0.5 text-gray-400 hover:text-gray-700 transition-colors"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalActive === 0 && (
        <div className="bg-white px-4 py-5 text-center text-sm text-gray-400">
          No active insights for this student.
        </div>
      )}
    </div>
  );
}
