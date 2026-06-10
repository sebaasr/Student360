import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

interface TutoringSession {
  id: string;
  sessionDate: Date | string;
  subject: string;
  wasNoShow: boolean;
}
interface SSCVisit {
  id: string;
  visitDate: Date | string;
  serviceType: string;
}
interface Coach {
  coachName: string;
}

interface Props {
  tutoring: TutoringSession[];
  sscVisits: SSCVisit[];
  academicCoach: Coach | null;
}

export function ServiceUsageCard({ tutoring, sscVisits, academicCoach }: Props) {
  const tutoringCount = tutoring.filter((t) => !t.wasNoShow).length;
  const writing = sscVisits.filter((v) => /writing/i.test(v.serviceType));
  const otherSsc = sscVisits.filter((v) => !/writing/i.test(v.serviceType));

  const total = tutoringCount + sscVisits.length;
  const recent = [
    ...tutoring.map((t) => ({ date: t.sessionDate, label: `Tutoring · ${t.subject}`, kind: "tutoring" })),
    ...sscVisits.map((v) => ({ date: v.visitDate, label: `SSC · ${v.serviceType}`, kind: "ssc" })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Card title="Student Academic Service Usage" footer="Source: Knack · SSC · Writing Program">
      {total === 0 && !academicCoach ? (
        <EmptyState
          title="No support services accessed"
          description="Tutoring, Writing Program, and SSC engagement appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Stat label="Tutoring" sub="Knack" value={tutoringCount} accent="text-navy" />
            <Stat label="Writing Pgm" sub="SSC" value={writing.length} accent="text-navy" />
            <Stat label="SSC visits" sub="other" value={otherSsc.length} accent="text-navy" />
          </div>

          {academicCoach && (
            <div className="text-xs bg-navy-light rounded-lg px-3 py-2 mb-3">
              <span className="text-gray-500">Academic coach: </span>
              <span className="font-medium text-navy">{academicCoach.coachName}</span>
            </div>
          )}

          {recent.length > 0 && (
            <div>
              <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                Recent activity
              </div>
              <div className="space-y-1">
                {recent.map((r, i) => (
                  <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-700 truncate">{r.label}</span>
                    <span className="text-gray-400 shrink-0 ml-2">{formatDate(r.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {total === 0 && (
            <p className="text-xs text-amber-700 mt-2">
              No tutoring or SSC engagement on record — consider a referral.
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function Stat({ label, sub, value, accent }: { label: string; sub: string; value: number; accent: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2 text-center">
      <div className={`text-xl font-bold ${accent}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500 leading-tight">{label}</div>
      <div className="text-[9px] text-gray-400">{sub}</div>
    </div>
  );
}
