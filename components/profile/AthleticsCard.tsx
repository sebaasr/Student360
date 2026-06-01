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

const statusVariant: Record<string, "green" | "amber" | "red" | "neutral"> = {
  eligible: "green",
  at_risk: "amber",
  ineligible: "red",
  not_yet_certified: "neutral",
};

export function AthleticsCard({ athletics }: { athletics: AthleticsRecord }) {
  return (
    <Card title="Athletics" icon="🏆" footer="Source: Banner Athletics · FAR notes">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={statusVariant[athletics.eligibilityStatus] ?? "neutral"}>
          {athletics.eligibilityStatus.replace("_", " ")}
        </Badge>
        <span className="text-sm font-medium">{athletics.sport}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-gray-500">Required GPA</div>
          <div className="font-medium">{athletics.gpaRequired.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-500">Credit load</div>
          <div className="font-medium">{athletics.creditLoadRequired}/sem</div>
        </div>
      </div>
      {athletics.farNotes && (
        <div className="mt-2 text-[11px] text-gray-700 border-t border-gray-100 pt-2">
          {athletics.farNotes}
        </div>
      )}
    </Card>
  );
}
