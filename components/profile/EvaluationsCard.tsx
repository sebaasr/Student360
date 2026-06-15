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
  designation?: string | null;
  status: string;
}

const statusVariant: Record<string, "green" | "amber" | "red" | "neutral"> = {
  satisfactory: "green",
  unsatisfactory: "red",
  incomplete: "amber",
  missing: "neutral",
};

// Narrative-evaluation course designations (from the NCF Evaluations app).
const designationMeta: Record<string, { label: string; variant: "green" | "amber" | "red" | "neutral" }> = {
  strong_sat:   { label: "SS",   variant: "green" },
  sat:          { label: "S",    variant: "green" },
  marginal_sat: { label: "MS",   variant: "amber" },
  unsat:        { label: "U",    variant: "red" },
  pass:         { label: "Pass", variant: "green" },
  fail:         { label: "F",    variant: "red" },
};

export function EvaluationsCard({ evaluations }: { evaluations: Evaluation[] }) {
  return (
    <Card title="Narrative Evaluations" footer="Source: NCF Evaluations">
      {evaluations.length === 0 ? (
        <EmptyState title="No evaluations on file" />
      ) : (
        <div className="space-y-2">
          {evaluations.map((e) => (
            <div key={e.id} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="text-sm font-semibold">
                    {e.courseCode} · {e.courseTitle}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {e.term} · {e.instructorName}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {e.designation && designationMeta[e.designation] && (
                    <Badge variant={designationMeta[e.designation].variant}>
                      {designationMeta[e.designation].label}
                    </Badge>
                  )}
                  <Badge variant={statusVariant[e.status] ?? "neutral"}>
                    {e.status}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-700 mt-1 line-clamp-4">{e.evaluationText}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
