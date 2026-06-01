import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

interface AdvisingRecord {
  id: string;
  advisorName: string;
  appointmentDate: Date | string;
  duration: number | null;
  meetingType: string;
  outcome: string;
  noteText: string | null;
}

interface EarlyAlert {
  id: string;
  alertType: string;
  raisedBy: string;
  raisedAt: Date | string;
  status: string;
  notes?: string | null;
}

export function AdvisingHistoryCard({
  advising,
  earlyAlerts,
  noteVisibility = "full",
}: {
  advising: AdvisingRecord[];
  earlyAlerts: EarlyAlert[];
  noteVisibility?: "full" | "redacted";
}) {
  return (
    <Card title="Advising" icon="🗣️" footer="Source: Navigate 360 (EAB)">
      {earlyAlerts.length > 0 && (
        <div className="mb-3">
          <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-1">
            Early alerts
          </div>
          <div className="space-y-1">
            {earlyAlerts.map((a) => (
              <div
                key={a.id}
                className="text-xs p-2 rounded bg-amber-50 border border-amber-200"
              >
                <div className="font-medium">{a.alertType.replace("_", " ")} — {a.status}</div>
                <div className="text-gray-600">
                  By {a.raisedBy} · {formatDate(a.raisedAt)}
                </div>
                {a.notes && <div className="mt-1 text-gray-700">{a.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-1">
        Recent meetings
      </div>
      {advising.length === 0 ? (
        <EmptyState title="No advising meetings this term" icon="🗓️" />
      ) : (
        <div className="space-y-1">
          {advising.map((r) => (
            <div
              key={r.id}
              className="text-xs py-2 border-b border-gray-50 last:border-0"
            >
              <div className="flex justify-between">
                <span className="font-medium">
                  {formatDate(r.appointmentDate)} · {r.meetingType.replace("_", " ")}
                </span>
                <span className="text-gray-500">
                  {r.advisorName}
                  {r.duration && ` · ${r.duration}m`}
                </span>
              </div>
              {r.noteText ? (
                <div className="text-gray-700 mt-1">{r.noteText}</div>
              ) : noteVisibility === "redacted" ? (
                <div className="text-gray-400 italic mt-1">Notes restricted at your tier.</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
