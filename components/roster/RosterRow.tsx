import Link from "next/link";
import type { RosterStudent } from "@/types/student";
import { PriorityBadge } from "./PriorityBadge";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeDate, yearLabel } from "@/lib/utils";

const standingConfig: Record<string, { text: string; variant: "green" | "amber" | "red" }> = {
  good_standing:      { text: "Good standing",    variant: "green" },
  academic_warning:   { text: "Warning",           variant: "amber" },
  academic_probation: { text: "Probation",         variant: "red"   },
};

const contractConfig: Record<string, { text: string; cls: string }> = {
  not_started:     { text: "Not started",         cls: "text-red-600 font-semibold" },
  in_progress:     { text: "In progress",         cls: "text-amber-600 font-semibold" },
  pending_advisor: { text: "Advisor sig. needed", cls: "text-amber-600 font-semibold" },
  signed:          { text: "Signed",              cls: "text-emerald-700 font-semibold" },
  finalized:       { text: "Finalized",           cls: "text-emerald-700 font-semibold" },
};

const bfConfig: Record<string, { text: string; variant: "green" | "amber" | "red" }> = {
  green:  { text: "BF: On track",    variant: "green" },
  yellow: { text: "BF: Near limit",  variant: "amber" },
  red:    { text: "BF: At risk",     variant: "red"   },
};

export function RosterRow({ student }: { student: RosterStudent }) {
  const standing = standingConfig[student.academicStanding];
  const contract = student.currentTermContract
    ? contractConfig[student.currentTermContract.status]
    : null;
  const bf = student.brightFuturesStatus ? bfConfig[student.brightFuturesStatus] : null;

  const rowHighlight =
    student.priority === "high"
      ? "border-l-2 border-l-red-400 bg-red-50/30 hover:bg-red-50/60"
      : "border-l-2 border-l-transparent hover:bg-gray-50/80";

  return (
    <Link
      href={`/student/${student.id}`}
      className={`block transition-colors ${rowHighlight}`}
    >
      <div className="grid grid-cols-12 gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0 items-center">
        {/* Student */}
        <div className="col-span-3 flex items-center gap-3">
          <Avatar name={student.name} size={34} />
          <div className="min-w-0">
            <div className="font-semibold text-navy text-sm truncate">{student.name}</div>
            <div className="text-[11px] text-gray-400 truncate font-mono">{student.id}</div>
          </div>
        </div>

        {/* Year · AOC */}
        <div className="col-span-2">
          <div className="text-sm text-gray-800">{yearLabel(student.yearLevel)}</div>
          <div className="text-[11px] text-gray-400 truncate">{student.aoc ?? "Undeclared"}</div>
        </div>

        {/* Standing */}
        <div className="col-span-2 flex flex-col gap-1">
          {standing && <Badge variant={standing.variant}>{standing.text}</Badge>}
          {bf && <Badge variant={bf.variant}>{bf.text}</Badge>}
        </div>

        {/* Contract */}
        <div className="col-span-2">
          {contract ? (
            <>
              <div className={`text-sm ${contract.cls}`}>{contract.text}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {student.currentTermContract?.signedByStudent ? "Student ✓" : "Student —"}
                {" · "}
                {student.currentTermContract?.signedByAdvisor ? "Advisor ✓" : "Advisor —"}
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-400">No contract</span>
          )}
        </div>

        {/* Last meeting */}
        <div className="col-span-2">
          {student.lastAdvisingDate ? (
            <>
              <div className="text-sm text-gray-700">
                Met {formatRelativeDate(student.lastAdvisingDate)}
              </div>
              {student.openFlagsCount > 0 && (
                <div className="text-[11px] text-amber-600 font-medium mt-0.5">
                  {student.openFlagsCount} open flag{student.openFlagsCount > 1 ? "s" : ""}
                </div>
              )}
            </>
          ) : (
            <span className="text-sm text-red-600 font-semibold">Never met</span>
          )}
        </div>

        {/* Priority */}
        <div className="col-span-1 flex justify-end">
          <PriorityBadge priority={student.priority} />
        </div>
      </div>
    </Link>
  );
}
