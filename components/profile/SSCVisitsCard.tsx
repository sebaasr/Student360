import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

interface SSCVisit {
  id: string;
  visitDate: Date | string;
  visitType: string;
  serviceType: string;
  staffName: string | null;
  notes: string | null;
}

interface AcademicCoach {
  coachName: string;
  coachEmail: string | null;
}

export function SSCVisitsCard({
  visits,
  coach,
}: {
  visits: SSCVisit[];
  coach: AcademicCoach | null;
}) {
  return (
    <Card title="Student Success Center" icon="🌱" footer="Source: Knack (SSC)">
      {coach && (
        <div className="mb-3 p-2 bg-navy-light rounded">
          <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
            Academic coach
          </div>
          <div className="text-sm font-medium">{coach.coachName}</div>
          {coach.coachEmail && <div className="text-xs text-gray-600">{coach.coachEmail}</div>}
        </div>
      )}
      {visits.length === 0 ? (
        <EmptyState title="No SSC visits this term" icon="🌿" />
      ) : (
        <div className="space-y-1">
          {visits.slice(0, 8).map((v) => (
            <div
              key={v.id}
              className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0"
            >
              <div>
                <span className="font-medium">{formatDate(v.visitDate)}</span> · {v.serviceType.replace("_", " ")}
                {v.staffName && <span className="text-gray-500"> · {v.staffName}</span>}
              </div>
              <span className="text-gray-500">{v.visitType.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
