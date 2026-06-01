import Link from "next/link";
import type { RosterStudent } from "@/types/student";
import { PriorityBadge } from "./PriorityBadge";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeDate, yearLabel } from "@/lib/utils";

const standingLabel: Record<string, { text: string; variant: "green" | "amber" | "red" }> = {
  good_standing: { text: "Good standing", variant: "green" },
  academic_warning: { text: "Academic warning", variant: "amber" },
  academic_probation: { text: "Probation", variant: "red" },
};

const contractStatusLabel: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  pending_advisor: "Pending advisor",
  signed: "Signed",
  finalized: "Finalized",
};

const bfLabel: Record<string, { text: string; variant: "green" | "amber" | "red" }> = {
  green: { text: "BF green", variant: "green" },
  yellow: { text: "BF yellow", variant: "amber" },
  red: { text: "BF red", variant: "red" },
};

export function RosterRow({ student }: { student: RosterStudent }) {
  const standing = standingLabel[student.academicStanding];
  const rowAccent = student.priority === "high" ? "bg-red-50/40" : "";

  return (
    <Link href={`/student/${student.id}`} className={`block hover:bg-gray-50 ${rowAccent}`}>
      <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 items-center">
        <div className="col-span-3 flex items-center gap-3">
          <Avatar name={student.name} size={36} />
          <div className="min-w-0">
            <div className="font-semibold text-navy truncate">{student.name}</div>
            <div className="text-[11px] text-gray-500 truncate">
              {student.id} · {student.email}
            </div>
          </div>
        </div>

        <div className="col-span-2 text-sm">
          <div>{yearLabel(student.yearLevel)}</div>
          <div className="text-[11px] text-gray-500">{student.aoc ?? "AOC undeclared"}</div>
        </div>

        <div className="col-span-2 flex flex-wrap gap-1">
          {standing && <Badge variant={standing.variant}>{standing.text}</Badge>}
          {student.brightFuturesStatus && (
            <Badge variant={bfLabel[student.brightFuturesStatus].variant}>
              {bfLabel[student.brightFuturesStatus].text}
            </Badge>
          )}
        </div>

        <div className="col-span-2 text-sm">
          {student.currentTermContract ? (
            <>
              <div className="font-medium">
                {contractStatusLabel[student.currentTermContract.status] ??
                  student.currentTermContract.status}
              </div>
              <div className="text-[11px] text-gray-500">
                {student.currentTermContract.signedByStudent ? "Student ✓" : "Student —"} ·{" "}
                {student.currentTermContract.signedByAdvisor ? "Advisor ✓" : "Advisor —"}
              </div>
            </>
          ) : (
            <span className="text-gray-400 text-sm">No contract</span>
          )}
        </div>

        <div className="col-span-2 text-sm">
          {student.lastAdvisingDate ? (
            <>
              <div>Met {formatRelativeDate(student.lastAdvisingDate)}</div>
              <div className="text-[11px] text-gray-500">Flags: {student.openFlagsCount}</div>
            </>
          ) : (
            <span className="text-red-700 font-medium">Not met this term</span>
          )}
        </div>

        <div className="col-span-1 flex justify-end">
          <PriorityBadge priority={student.priority} />
        </div>
      </div>
    </Link>
  );
}
