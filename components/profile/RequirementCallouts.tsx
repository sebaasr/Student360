import type { RequirementCallout } from "@/lib/student-progress";

const iconMap: Record<RequirementCallout["id"], string> = {
  aoc: "📘",
  gen_ed: "🧭",
  graduation: "🎓",
};

export function RequirementCallouts({ callouts }: { callouts: RequirementCallout[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {callouts.map((c) => (
        <div
          key={c.id}
          className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-navy-light flex items-center justify-center text-base">
                {iconMap[c.id]}
              </div>
              <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                {c.title}
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-navy">{c.percent}%</div>
          </div>
          <div className="text-sm font-semibold text-navy mt-2">{c.subtitle}</div>
          <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-navy to-gold rounded-full"
              style={{ width: `${Math.min(100, c.percent)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2 flex-1">{c.detail}</div>
          <button
            type="button"
            className="text-[11px] text-navy font-medium mt-3 text-left hover:underline"
          >
            View requirements →
          </button>
        </div>
      ))}
    </div>
  );
}
