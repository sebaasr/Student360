import type { RosterStats as Stats } from "@/types/student";

export function RosterStats({ stats }: { stats: Stats }) {
  const items = [
    { label: "Total advisees", value: stats.total, accent: "navy" },
    { label: "Contracts signed", value: stats.contractsSigned, accent: "green" },
    { label: "Contracts pending", value: stats.contractsPending, accent: "amber" },
    { label: "Met this term", value: stats.metThisTerm, accent: "navy" },
    { label: "Not met this term", value: stats.notMetThisTerm, accent: "red" },
    { label: "Open flags", value: stats.openFlags, accent: "red" },
  ];
  const accentMap: Record<string, string> = {
    navy: "text-navy",
    green: "text-green-700",
    amber: "text-amber-700",
    red: "text-red-700",
  };
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((i) => (
        <div key={i.label} className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="text-[10.5px] uppercase tracking-wide text-gray-500 font-semibold">
            {i.label}
          </div>
          <div className={`text-2xl font-bold mt-1 ${accentMap[i.accent]}`}>{i.value}</div>
        </div>
      ))}
    </div>
  );
}
