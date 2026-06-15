interface Props {
  academicStanding: string;
  earlyAlerts: number;
  financialFlags: number;
}

// Prominent warning tile — amber/gold so it stands out without the alarm of red.
export function FlagBanner({ academicStanding, earlyAlerts, financialFlags }: Props) {
  const warnings: string[] = [];
  if (academicStanding === "academic_probation") warnings.push("Academic probation");
  else if (academicStanding === "academic_warning") warnings.push("Academic warning");
  if (earlyAlerts > 0) warnings.push(`${earlyAlerts} open early alert${earlyAlerts > 1 ? "s" : ""}`);
  if (financialFlags > 0) warnings.push(`${financialFlags} financial flag${financialFlags > 1 ? "s" : ""}`);

  if (warnings.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-amber-400 bg-amber-50 shadow-sm overflow-hidden">
      <div className="flex items-stretch">
        <div className="bg-amber-400 w-1.5 shrink-0" />
        <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wide shrink-0">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-[11px] font-black">!</span>
            Needs attention
          </span>
          <div className="flex flex-wrap gap-2">
            {warnings.map((w) => (
              <span key={w} className="text-sm font-medium text-amber-900 bg-amber-100 border border-amber-200 rounded-full px-2.5 py-0.5">
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
