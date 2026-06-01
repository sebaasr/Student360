import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { yearLabel, studentDisplayName } from "@/lib/utils";

interface Props {
  student: {
    firstName: string;
    lastName: string;
    preferredName?: string | null;
    id: string;
    email: string;
    yearLevel: number;
    declaredAoc?: string | null;
    cumulativeGpa?: number | null;
    creditsEarned: number;
    academicStanding: string;
    isFirstGeneration?: boolean;
    isStudentAthlete?: boolean;
    athleteSport?: string | null;
    advisor?: { name: string } | null;
  };
  expectedGraduation?: string | null;
  contractsSatisfactory?: number;
  contractsTotal?: number;
  onTrack?: boolean;
  hasHold?: boolean;
}

export function StudentHeader({
  student,
  expectedGraduation,
  contractsSatisfactory,
  contractsTotal,
  onTrack = true,
  hasHold = false,
}: Props) {
  const name = studentDisplayName(student);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy via-navy/70 to-gold" />
      <div className="flex flex-wrap items-start gap-5">
        <Avatar name={name} size={72} />

        <div className="flex-1 min-w-[260px]">
          <h1 className="text-2xl font-serif font-bold text-navy">{name}</h1>
          <div className="text-xs text-gray-600 mt-1">
            {student.id}
            {student.isStudentAthlete && student.athleteSport && (
              <> · Student-athlete ({student.athleteSport})</>
            )}
            {student.advisor && <> · Advisor: {student.advisor.name}</>}
            {expectedGraduation && <> · Expected graduation: {expectedGraduation}</>}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {yearLabel(student.yearLevel)}
            {student.declaredAoc ? ` · AOC: ${student.declaredAoc}` : " · AOC: Undeclared"}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {student.isFirstGeneration && <Badge variant="neutral">First-Gen</Badge>}
            {student.isStudentAthlete && <Badge variant="neutral">Student-Athlete</Badge>}
            <Badge variant={standingVariant(student.academicStanding)}>
              {student.academicStanding.replace("_", " ")}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-2">
            {onTrack ? (
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                On track
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
                Off track
              </span>
            )}
            {hasHold && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
                Advising hold
              </span>
            )}
          </div>
          <div className="flex gap-6 text-right">
            <Stat label="GPA" value={student.cumulativeGpa?.toFixed(2) ?? "—"} />
            <Stat label="Credits" value={`${student.creditsEarned} / 120`} />
            {typeof contractsSatisfactory === "number" &&
              typeof contractsTotal === "number" && (
                <Stat
                  label="Contracts"
                  value={`${contractsSatisfactory} / ${contractsTotal}`}
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wide text-gray-500 font-semibold">
        {label}
      </div>
      <div className="text-lg font-bold text-navy">{value}</div>
    </div>
  );
}

function standingVariant(s: string): "green" | "amber" | "red" {
  if (s === "academic_probation") return "red";
  if (s === "academic_warning") return "amber";
  return "green";
}
