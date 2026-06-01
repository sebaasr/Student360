import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface SemesterGpa {
  term: string;
  gpa: number;
  credits: number;
  standing: string;
}

interface Props {
  cumulativeGpa: number | null;
  semesterGpas: SemesterGpa[];
  creditsEarned: number;
  creditsAttempted: number;
  academicStanding: string;
}

export function AcademicStandingCard({
  cumulativeGpa,
  semesterGpas,
  creditsEarned,
  creditsAttempted,
  academicStanding,
}: Props) {
  const standingVariant: Record<string, "green" | "amber" | "red"> = {
    good_standing: "green",
    academic_warning: "amber",
    academic_probation: "red",
  };

  return (
    <Card title="Academic Standing" icon="📚" footer="Source: Banner · DegreeWorks">
      <div className="grid grid-cols-3 gap-3 mb-3 text-center">
        <Stat label="Cumulative GPA" value={cumulativeGpa?.toFixed(2) ?? "—"} />
        <Stat label="Credits earned" value={String(creditsEarned)} />
        <Stat label="Attempted" value={String(creditsAttempted)} />
      </div>
      <div className="mb-3">
        <Badge variant={standingVariant[academicStanding] ?? "neutral"}>
          {academicStanding.replace("_", " ")}
        </Badge>
      </div>
      {semesterGpas.length > 0 && (
        <div>
          <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-1">
            Semester history
          </div>
          <div className="space-y-1">
            {semesterGpas.map((g) => (
              <div
                key={g.term}
                className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0"
              >
                <span className="text-gray-700">{g.term}</span>
                <span className="font-medium">{g.gpa.toFixed(2)} · {g.credits} cr</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-bold text-navy">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  );
}
