import { Card } from "@/components/ui/Card";

interface ISP {
  id: string;
  title: string;
  term: string;
  status: string;
  supervisorName: string | null;
}

interface Minor {
  id: string;
  minorName: string;
  isDeclared: boolean;
  coursesCompleted: number;
  coursesRequired: number;
  percentComplete: number;
  coursesNeeded: string[];
}

interface DegreeProgress {
  aocName: string | null;
  thesisStatus: string;
  thesisSponsor: string | null;
  projectedGradTerm: string | null;
  ispRecords: ISP[];
  minors: Minor[];
}

export function DegreeProgressCard({ dp }: { dp: DegreeProgress | null }) {
  if (!dp) {
    return (
      <Card title="Degree Progress" icon="🎯">
        <div className="text-sm text-gray-500">No degree audit available.</div>
      </Card>
    );
  }
  return (
    <Card title="Degree Audit Details" icon="🎯" footer="Source: DegreeWorks">
      <div className="space-y-3">
        {dp.projectedGradTerm && (
          <div className="text-xs">
            <span className="text-gray-500">Projected graduation: </span>
            <span className="font-medium">{dp.projectedGradTerm}</span>
          </div>
        )}
        {dp.ispRecords.length > 0 && (
          <div>
            <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-1">
              ISPs
            </div>
            {dp.ispRecords.map((isp) => (
              <div
                key={isp.id}
                className="text-xs py-1 border-b border-gray-50 last:border-0 flex justify-between"
              >
                <div>
                  <span className="font-medium">{isp.title}</span>
                  {isp.supervisorName && (
                    <span className="text-gray-500"> · {isp.supervisorName}</span>
                  )}
                </div>
                <span className="text-gray-500">
                  {isp.term} · {isp.status}
                </span>
              </div>
            ))}
          </div>
        )}
        {dp.minors.length > 0 && (
          <div>
            <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-1">
              Minor progress
            </div>
            {dp.minors.map((m) => (
              <div key={m.id} className="text-xs py-1 border-b border-gray-50 last:border-0">
                <div className="flex justify-between">
                  <span className="font-medium">{m.minorName} Minor</span>
                  <span className="text-gray-500">
                    {m.coursesCompleted}/{m.coursesRequired} ·{" "}
                    {m.isDeclared ? "declared" : "undeclared"}
                  </span>
                </div>
                {m.coursesNeeded.length > 0 && (
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Needs: {m.coursesNeeded.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div>
          <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-1">
            Thesis
          </div>
          <div className="text-xs">
            Status: <span className="font-medium">{dp.thesisStatus.replace("_", " ")}</span>
            {dp.thesisSponsor && (
              <>
                {" "}
                · Sponsor: <span className="font-medium">{dp.thesisSponsor}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
