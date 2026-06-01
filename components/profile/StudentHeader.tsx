import { Avatar } from "@/components/ui/Avatar";
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

const standingConfig: Record<string, { label: string; cls: string }> = {
  good_standing: { label: "Good Standing", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  academic_warning: { label: "Academic Warning", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  academic_probation: { label: "Academic Probation", cls: "bg-red-100 text-red-800 border-red-200" },
};

export function StudentHeader({
  student,
  expectedGraduation,
  contractsSatisfactory,
  contractsTotal,
  onTrack = true,
  hasHold = false,
}: Props) {
  const name = studentDisplayName(student);
  const standing = standingConfig[student.academicStanding] ?? standingConfig.good_standing;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-navy via-navy/60 to-gold" />

      <div className="p-5">
        <div className="flex flex-wrap items-start gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="w-[72px] h-[72px] rounded-full bg-navy text-white flex items-center justify-center text-2xl font-bold font-serif select-none">
              {initials}
            </div>
            {student.academicStanding === "academic_probation" && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-bold">!</span>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-[240px]">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl font-serif font-bold text-navy leading-tight">{name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${standing.cls}`}>
                {standing.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
              <span className="font-mono">{student.id}</span>
              <span>·</span>
              <span>{yearLabel(student.yearLevel)}</span>
              <span>·</span>
              <span>{student.declaredAoc ?? "AOC Undeclared"}</span>
              {student.advisor && (
                <>
                  <span>·</span>
                  <span>Advisor: {student.advisor.name}</span>
                </>
              )}
              {expectedGraduation && (
                <>
                  <span>·</span>
                  <span>Exp. graduation: {expectedGraduation}</span>
                </>
              )}
            </div>

            {/* Status chips */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {student.isFirstGeneration && (
                <Chip label="First-Gen" cls="bg-purple-50 text-purple-700 border-purple-200" />
              )}
              {student.isStudentAthlete && (
                <Chip
                  label={student.athleteSport ? `Athlete · ${student.athleteSport}` : "Student-Athlete"}
                  cls="bg-sky-50 text-sky-700 border-sky-200"
                />
              )}
              {!onTrack && (
                <Chip label="Off track for graduation" cls="bg-amber-50 text-amber-800 border-amber-200" />
              )}
              {hasHold && (
                <Chip label="Hold / Open alert" cls="bg-red-50 text-red-700 border-red-200" />
              )}
            </div>
          </div>

          {/* Stats + actions */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            {/* Quick stats */}
            <div className="flex gap-5">
              <StatBlock
                label="Cum. GPA"
                value={student.cumulativeGpa?.toFixed(2) ?? "—"}
                accent={gpaAccent(student.cumulativeGpa)}
              />
              <StatBlock label="Credits" value={`${student.creditsEarned} / 120`} />
              {typeof contractsSatisfactory === "number" && (
                <StatBlock
                  label="Contracts"
                  value={`${contractsSatisfactory} signed`}
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <ActionButton
                href={`mailto:${student.email}`}
                label="Email Student"
                icon="✉"
                variant="ghost"
              />
              <ActionButton
                href="#"
                label="View in Navigate"
                icon="↗"
                variant="ghost"
              />
              <ActionButton
                href="#"
                label="Log Meeting Note"
                icon="✎"
                variant="primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function StatBlock({ label, value, accent = "text-navy" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{label}</div>
      <div className={`text-xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function ActionButton({
  href,
  label,
  icon,
  variant,
}: {
  href: string;
  label: string;
  icon: string;
  variant: "primary" | "ghost";
}) {
  const base = "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors";
  const cls =
    variant === "primary"
      ? `${base} bg-navy text-white hover:bg-navy-dark`
      : `${base} border border-gray-200 text-gray-600 hover:bg-gray-50`;
  return (
    <a href={href} className={cls}>
      <span>{icon}</span>
      {label}
    </a>
  );
}

function gpaAccent(gpa: number | null | undefined): string {
  if (!gpa) return "text-navy";
  if (gpa < 2.0) return "text-red-700";
  if (gpa < 2.5) return "text-amber-700";
  return "text-navy";
}
