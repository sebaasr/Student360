import type { BrightFuturesStatus } from "@/lib/bright-futures";

interface Props {
  status: BrightFuturesStatus;
}

export function BrightFuturesCard({ status }: Props) {
  const colorConfig = {
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      dot: "bg-green-500",
      text: "text-green-800",
      label: "Maintaining ✓",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      dot: "bg-yellow-500",
      text: "text-yellow-800",
      label: "At Risk",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      dot: "bg-red-500",
      text: "text-red-800",
      label: "Below Threshold",
    },
    none: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      dot: "bg-gray-400",
      text: "text-gray-600",
      label: "No Award",
    },
  };
  const c = colorConfig[status.color];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-3">
        Bright Futures Scholarship
      </h3>

      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${c.bg} ${c.border} mb-3`}
      >
        <div className={`w-2 h-2 rounded-full ${c.dot}`} />
        <span className={`text-sm font-semibold ${c.text}`}>{c.label}</span>
      </div>

      <div className="space-y-1">
        {(
          [
            ["Award type", status.awardLabel ?? status.awardType ?? "—"],
            ["Required GPA", status.requiredGpa?.toFixed(2) ?? "—"],
            ["Current GPA", status.currentGpa?.toFixed(2) ?? "—"],
            [
              "GPA buffer",
              status.buffer !== null
                ? status.buffer >= 0
                  ? `+${status.buffer.toFixed(2)} above`
                  : `${status.buffer.toFixed(2)} below`
                : "—",
            ],
            ["Credits", status.creditsMet ? "Met" : "Below minimum"],
            [
              "Status",
              status.color === "green"
                ? "Safe — no risk"
                : status.color === "yellow"
                  ? "Monitor closely"
                  : status.color === "red"
                    ? "Contact Financial Aid"
                    : "—",
            ],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0"
          >
            <span className="text-gray-500">{k}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-100">
        Source: Banner / Financial Aid · {status.syncedAt}
      </div>
    </div>
  );
}
