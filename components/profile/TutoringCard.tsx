import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { TutoringBarChart } from "@/components/ui/Charts";

interface TutoringSession {
  id: string;
  sessionDate: Date | string;
  durationMins: number;
  subject: string;
  courseCode: string | null;
  tutorName: string | null;
  sessionType: string;
  wasNoShow: boolean;
}

export function TutoringCard({ sessions }: { sessions: TutoringSession[] }) {
  const totalMins = sessions.filter((s) => !s.wasNoShow).reduce((acc, s) => acc + s.durationMins, 0);
  const noShows = sessions.filter((s) => s.wasNoShow).length;

  return (
    <Card title="Tutoring" footer="Source: Knack (Tutoring)">
      {sessions.length === 0 ? (
        <EmptyState title="No tutoring sessions this term" />
      ) : (
        <>
          <div className="flex gap-4 mb-3 text-sm">
            <div>
              <div className="font-bold text-navy">{sessions.length - noShows}</div>
              <div className="text-[10px] uppercase tracking-wide text-gray-500">Attended</div>
            </div>
            <div>
              <div className="font-bold text-navy">{Math.round(totalMins / 60)} h</div>
              <div className="text-[10px] uppercase tracking-wide text-gray-500">Total time</div>
            </div>
            {noShows > 0 && (
              <div>
                <div className="font-bold text-red-700">{noShows}</div>
                <div className="text-[10px] uppercase tracking-wide text-gray-500">No-shows</div>
              </div>
            )}
          </div>
          {sessions.length >= 2 && (
            <div className="mb-3">
              <TutoringBarChart
                data={[...sessions]
                  .reverse()
                  .map((s) => ({
                    label: formatDate(s.sessionDate).replace(/,?\s\d{4}$/, ""),
                    minutes: s.durationMins,
                    noShow: s.wasNoShow,
                  }))}
              />
            </div>
          )}
          <div className="space-y-1">
            {sessions.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0"
              >
                <div>
                  <span className="font-medium">{formatDate(s.sessionDate)}</span> · {s.subject}
                  {s.tutorName && <span className="text-gray-500"> · {s.tutorName}</span>}
                </div>
                <span className={s.wasNoShow ? "text-red-700" : "text-gray-500"}>
                  {s.wasNoShow ? "No-show" : `${s.durationMins}m`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
