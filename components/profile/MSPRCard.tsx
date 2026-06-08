import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

interface MSPR {
  id: string;
  term: string;
  termCode: string;
  courseCode: string;
  courseTitle: string;
  instructorName: string;
  rating: string;
  attendance: string | null;
  feedback: string | null;
  submittedAt: Date | string;
}

const ratingConfig: Record<string, { variant: "green" | "amber" | "red" | "neutral"; label: string }> = {
  satisfactory: { variant: "green", label: "Satisfactory" },
  concern:      { variant: "amber", label: "Concern" },
  at_risk:      { variant: "red",   label: "At Risk" },
};

const attendanceColor: Record<string, string> = {
  good: "text-emerald-700",
  irregular: "text-amber-700",
  poor: "text-red-700",
};

export function MSPRCard({ msprs }: { msprs: MSPR[] }) {
  return (
    <Card title="Mid-Semester Progress Reports" footer="Source: Navigate 360 (EAB) · MSPR">
      {msprs.length === 0 ? (
        <EmptyState
          title="No MSPR feedback this term"
          description="Instructor mid-semester reports appear here when submitted through Navigate."
        />
      ) : (
        <div className="space-y-2.5">
          {msprs.map((m) => {
            const r = ratingConfig[m.rating] ?? { variant: "neutral" as const, label: m.rating };
            return (
              <div key={m.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-navy">
                      <span className="font-mono text-xs text-gray-400 mr-1.5">{m.courseCode}</span>
                      {m.courseTitle}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {m.instructorName} · {m.term} · {formatDate(m.submittedAt)}
                    </div>
                  </div>
                  <Badge variant={r.variant}>{r.label}</Badge>
                </div>
                {(m.attendance || m.feedback) && (
                  <div className="mt-1.5 text-xs text-gray-700">
                    {m.attendance && (
                      <span className="mr-2">
                        Attendance:{" "}
                        <span className={`font-medium ${attendanceColor[m.attendance] ?? ""}`}>
                          {m.attendance}
                        </span>
                      </span>
                    )}
                    {m.feedback && <p className="mt-1 text-gray-600 leading-relaxed">{m.feedback}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
