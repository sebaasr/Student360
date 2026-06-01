import type { TimelineRow } from "@/lib/student-progress";

interface Props {
  rows: TimelineRow[];
  currentTermCode: string;
  note?: string;
}

export function AcademicTimeline({ rows, currentTermCode, note }: Props) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-navy">Academic timeline</h2>
        <p className="text-sm text-gray-500 mt-2">
          No semester history yet. The timeline populates as Banner syncs term GPAs.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-baseline mb-3">
        <h2 className="text-base font-serif font-semibold text-navy">
          Academic timeline — {rows[0].term} to present
        </h2>
        <span className="text-[11px] text-gray-500">
          {rows.length} semester{rows.length > 1 ? "s" : ""} on record
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-wide text-gray-500">
              <th className="text-left py-1 pr-3 font-semibold">Term</th>
              {rows.map((r) => (
                <th
                  key={r.termCode}
                  className={`px-2 py-1 text-center font-semibold ${
                    r.termCode === currentTermCode ? "text-navy" : ""
                  }`}
                >
                  {r.yearShort}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Courses" rows={rows} pickCell={(r) =>
              r.coursesPassed !== null
                ? { text: `${r.coursesPassed}/${r.coursesTotal}`, tone: "green" }
                : { text: "—", tone: "neutral" }
            } currentTermCode={currentTermCode} />
            <Row label="GPA" rows={rows} pickCell={(r) =>
              r.gpa !== null
                ? { text: r.gpa.toFixed(2), tone: gpaTone(r.gpa) }
                : { text: "—", tone: "neutral" }
            } currentTermCode={currentTermCode} />
            <Row label="Narratives" rows={rows} pickCell={(r) => {
              if (r.narratives === null) return { text: "—", tone: "neutral" };
              if (r.narrativesMissing > 0)
                return {
                  text: `${r.narrativesMissing} missing`,
                  tone: "amber",
                };
              return { text: String(r.narratives), tone: "neutral" };
            }} currentTermCode={currentTermCode} />
            <Row label="Milestones" rows={rows} pickCell={(r) =>
              r.milestones.length > 0
                ? { text: r.milestones.join(" · "), tone: "navy" }
                : { text: "—", tone: "neutral" }
            } currentTermCode={currentTermCode} />
          </tbody>
        </table>
      </div>

      {note && <p className="text-[11px] text-gray-500 mt-3 italic">{note}</p>}
    </div>
  );
}

type Tone = "neutral" | "green" | "amber" | "red" | "navy";

interface CellSpec {
  text: string;
  tone: Tone;
}

function Row({
  label,
  rows,
  pickCell,
  currentTermCode,
}: {
  label: string;
  rows: TimelineRow[];
  pickCell: (r: TimelineRow) => CellSpec;
  currentTermCode: string;
}) {
  return (
    <tr className="border-t border-gray-100">
      <td className="py-1.5 pr-3 text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
        {label}
      </td>
      {rows.map((r) => {
        const c = pickCell(r);
        return (
          <td
            key={r.termCode}
            className={`px-2 py-1.5 text-center ${cellBg(c.tone, r.termCode === currentTermCode)}`}
          >
            <span className={`text-xs ${toneText(c.tone)}`}>{c.text}</span>
          </td>
        );
      })}
    </tr>
  );
}

function cellBg(tone: Tone, isCurrent: boolean): string {
  if (isCurrent) return "bg-navy/10";
  if (tone === "green") return "bg-green-50";
  if (tone === "amber") return "bg-amber-50";
  if (tone === "red") return "bg-red-50";
  return "";
}

function toneText(tone: Tone): string {
  if (tone === "green") return "text-green-800";
  if (tone === "amber") return "text-amber-800";
  if (tone === "red") return "text-red-800";
  if (tone === "navy") return "text-navy font-medium";
  return "text-gray-700";
}

function gpaTone(gpa: number): Tone {
  if (gpa < 2.0) return "red";
  if (gpa < 2.7) return "amber";
  return "green";
}
