import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface AthleticsRecord {
  sport: string;
  eligibilityStatus: string;
  gpaRequired: number;
  creditLoadRequired: number;
  semesterCertHistory: unknown;
  farNotes: string | null;
}

interface Props {
  athletics: AthleticsRecord;
  currentGpa?: number | null;
  creditsEarned?: number;
}

const statusConfig: Record<string, { variant: "green" | "amber" | "red" | "neutral"; label: string }> = {
  eligible:          { variant: "green",   label: "Eligible" },
  at_risk:           { variant: "amber",   label: "At Risk" },
  ineligible:        { variant: "red",     label: "Ineligible" },
  not_yet_certified: { variant: "neutral", label: "Not Yet Certified" },
};

export function AthleticsCard({ athletics, currentGpa, creditsEarned }: Props) {
  const status = statusConfig[athletics.eligibilityStatus] ?? { variant: "neutral" as const, label: athletics.eligibilityStatus };

  const gpaOk = currentGpa != null && currentGpa >= athletics.gpaRequired;
  const gpaBuffer = currentGpa != null ? (currentGpa - athletics.gpaRequired).toFixed(2) : null;

  const history: { term: string; status: string }[] = (() => {
    try {
      const v = JSON.parse(athletics.semesterCertHistory as string);
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  })();

  return (
    <Card title="NAIA Sun Conference Athletics" footer="Source: Banner Athletics · FAR">
      {/* Sport + eligibility */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-bold text-navy">{athletics.sport}</div>
          <div className="text-xs text-gray-500">NAIA Sun Conference</div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* GPA requirement */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">
            Required GPA
          </div>
          <div className="text-xl font-bold text-navy">{athletics.gpaRequired.toFixed(2)}</div>
          {currentGpa != null && (
            <div className={`text-xs mt-0.5 font-medium ${gpaOk ? "text-emerald-700" : "text-red-700"}`}>
              Current: {currentGpa.toFixed(2)}
              {gpaBuffer && ` (${Number(gpaBuffer) >= 0 ? "+" : ""}${gpaBuffer})`}
            </div>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">
            Credit Load / Sem
          </div>
          <div className="text-xl font-bold text-navy">{athletics.creditLoadRequired}</div>
          {creditsEarned != null && (
            <div className="text-xs mt-0.5 text-gray-500">
              Earned total: {creditsEarned} cr
            </div>
          )}
        </div>
      </div>

      {/* Certification history */}
      {history.length > 0 && (
        <div className="mb-3">
          <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
            Certification history
          </div>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-700">{h.term}</span>
                <Badge variant={h.status === "eligible" ? "green" : h.status === "at_risk" ? "amber" : "red"}>
                  {h.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAR notes */}
      {athletics.farNotes && (
        <div className="text-[11px] text-gray-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <span className="font-semibold text-amber-800">FAR note: </span>
          {athletics.farNotes}
        </div>
      )}
    </Card>
  );
}
