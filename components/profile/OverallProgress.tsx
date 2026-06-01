import type { OverallProgress as OP } from "@/lib/student-progress";

interface Props {
  progress: OP;
  expectedGraduation?: string | null;
  yearLabel?: string;
}

export function OverallProgress({ progress, expectedGraduation, yearLabel }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy to-gold" />

      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <h2 className="text-base font-serif font-semibold text-navy">
          Overall progress to graduation
        </h2>
        {(expectedGraduation || yearLabel) && (
          <span className="text-[11px] text-gray-500">
            {yearLabel ?? ""}
            {expectedGraduation && yearLabel ? " · " : ""}
            {expectedGraduation ? `expected graduation ${expectedGraduation}` : ""}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3 flex flex-col items-center justify-center">
          <div className="text-6xl font-serif font-bold text-navy">{progress.percent}%</div>
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-gray-500 mt-1">
            Complete
          </div>
        </div>

        <div className="md:col-span-9 space-y-2">
          {progress.bars.map((b) => (
            <div key={b.id} className="flex items-center gap-3">
              <div className="w-28 text-sm font-medium text-gray-700">{b.label}</div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div
                  className={`h-full rounded-full ${barColor(b.colorScheme)}`}
                  style={{ width: `${Math.min(100, (b.current / b.total) * 100)}%` }}
                />
              </div>
              <div className="w-44 text-right text-[11px] text-gray-500">{b.status}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">
        {progress.remainingText}
      </div>
    </div>
  );
}

function barColor(scheme: OP["bars"][number]["colorScheme"]): string {
  switch (scheme) {
    case "green":
      return "bg-gradient-to-r from-green-400 to-green-600";
    case "amber":
      return "bg-gradient-to-r from-orange-400 to-amber-500";
    case "red":
      return "bg-gradient-to-r from-red-400 to-red-600";
    case "gold":
      return "bg-gradient-to-r from-[#c8b87a] to-[#B3A369]";
    default:
      return "bg-gradient-to-r from-[#2d3f6b] to-[#202944]";
  }
}
