import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface ContractCourse {
  courseCode: string;
  courseTitle: string;
  credits: number;
  instructorName?: string | null;
}

interface Contract {
  term: string;
  status: string;
  signedByStudent: boolean;
  signedByAdvisor: boolean;
  signedAt: Date | string | null;
  totalCredits: number;
  courses: ContractCourse[];
}

const statusLabel: Record<string, { text: string; variant: "green" | "amber" | "red" | "neutral" }> = {
  not_started: { text: "Not started", variant: "red" },
  in_progress: { text: "In progress", variant: "amber" },
  pending_advisor: { text: "Pending advisor signature", variant: "amber" },
  signed: { text: "Signed", variant: "green" },
  finalized: { text: "Finalized", variant: "green" },
};

export function ContractCard({ contracts }: { contracts: Contract[] }) {
  const current = contracts[0];
  if (!current) {
    return (
      <Card title="Contract">
        <div className="text-sm text-gray-500">No contract on file.</div>
      </Card>
    );
  }
  const s = statusLabel[current.status] ?? { text: current.status, variant: "neutral" as const };

  return (
    <Card title={current.term} footer="Source: Banner / Registrar">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={s.variant}>{s.text}</Badge>
        <span className="text-[11px] uppercase tracking-wide text-gray-400">Contract</span>
        <div className="text-xs text-gray-500 ml-auto">{current.totalCredits} credits</div>
      </div>
      <div className="flex gap-3 text-xs mb-3">
        <span className={current.signedByStudent ? "text-green-700" : "text-gray-400"}>
          {current.signedByStudent ? "Student ✓" : "Student —"}
        </span>
        <span className={current.signedByAdvisor ? "text-green-700" : "text-gray-400"}>
          {current.signedByAdvisor ? "Advisor ✓" : "Advisor —"}
        </span>
        {current.signedAt && (
          <span className="text-gray-500">Signed {formatDate(current.signedAt)}</span>
        )}
      </div>
      <div className="space-y-1">
        {current.courses.length === 0 ? (
          <div className="text-xs text-gray-400">No courses listed</div>
        ) : (
          current.courses.map((c, i) => (
            <div
              key={i}
              className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0"
            >
              <div>
                <span className="font-medium">{c.courseCode}</span> · {c.courseTitle}
                {c.instructorName && <span className="text-gray-500"> · {c.instructorName}</span>}
              </div>
              <span className="text-gray-500">{c.credits} cr</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
