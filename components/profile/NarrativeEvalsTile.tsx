"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

interface Evaluation {
  id: string;
  instructorName: string;
  courseCode: string;
  courseTitle: string;
  term: string;
  evaluationText: string;
  status: string;
}

interface Summary {
  positives: string[];
  issues: string[];
  source: "ai" | "rules";
}

const statusVariant: Record<string, "green" | "amber" | "red" | "neutral"> = {
  satisfactory: "green",
  unsatisfactory: "red",
  incomplete: "amber",
  missing: "neutral",
};

export function NarrativeEvalsTile({
  studentId,
  evaluations,
}: {
  studentId: string;
  evaluations: Evaluation[];
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/student/${studentId}/eval-summary`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => { if (active) { setSummary(d); setLoading(false); } })
      .catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId]);

  return (
    <Card title="Narrative Evaluations" footer="Source: NCF Evaluations System">
      {/* AI summary */}
      <div className="mb-3 rounded-lg border border-navy/15 bg-navy-light/60 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-gold text-xs">✦</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-navy">
            AI summary of comments
          </span>
          {summary && (
            <span className="text-[9px] text-gray-400 ml-auto uppercase">
              {summary.source === "ai" ? "AI-generated" : "Rule-based"}
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
            <div className="w-3.5 h-3.5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
            Reading evaluations…
          </div>
        ) : summary && (summary.positives.length || summary.issues.length) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1">
                Positive feedback
              </div>
              <ul className="space-y-0.5">
                {summary.positives.length ? summary.positives.map((p, i) => (
                  <li key={i} className="text-[11px] text-gray-700 flex gap-1.5">
                    <span className="text-emerald-500 mt-0.5">+</span><span>{p}</span>
                  </li>
                )) : <li className="text-[11px] text-gray-400 italic">—</li>}
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">
                Issues to address
              </div>
              <ul className="space-y-0.5">
                {summary.issues.length ? summary.issues.map((p, i) => (
                  <li key={i} className="text-[11px] text-gray-700 flex gap-1.5">
                    <span className="text-amber-500 mt-0.5">!</span><span>{p}</span>
                  </li>
                )) : <li className="text-[11px] text-gray-400 italic">No recurring concerns.</li>}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-gray-400">No evaluation comments to summarize yet.</p>
        )}
      </div>

      {/* Evaluation list */}
      {evaluations.length === 0 ? (
        <EmptyState title="No evaluations on file" />
      ) : (
        <div className="space-y-2">
          {evaluations.slice(0, 4).map((e) => (
            <div key={e.id} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-navy truncate">
                    <span className="font-mono text-xs text-gray-400 mr-1">{e.courseCode}</span>
                    {e.courseTitle}
                  </div>
                  <div className="text-[11px] text-gray-500">{e.term} · {e.instructorName}</div>
                </div>
                <Badge variant={statusVariant[e.status] ?? "neutral"}>{e.status}</Badge>
              </div>
              <p className="text-xs text-gray-700 mt-1 line-clamp-3">{e.evaluationText}</p>
            </div>
          ))}
          {evaluations.length > 4 && (
            <p className="text-[11px] text-gray-400">+ {evaluations.length - 4} more — see the Evaluations tab</p>
          )}
        </div>
      )}
    </Card>
  );
}
