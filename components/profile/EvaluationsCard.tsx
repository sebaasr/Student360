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

const statusVariant: Record<string, "green" | "amber" | "red" | "neutral"> = {
  satisfactory: "green",
  unsatisfactory: "red",
  incomplete: "amber",
  missing: "neutral",
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
                <Badge variant={statusVariant[e.status] ?? "neutral"}>
                  {e.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-700 mt-1 line-clamp-4">{e.evaluationText}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
