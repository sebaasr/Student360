interface Props {
  academicStanding: string;
  earlyAlerts: number;
  financialFlags: number;
}

export function FlagBanner({ academicStanding, earlyAlerts, financialFlags }: Props) {
  const flags: string[] = [];
  const isUrgent = academicStanding === "academic_probation";
  const isWarning = academicStanding === "academic_warning";

  if (isUrgent) flags.push("Academic probation");
  else if (isWarning) flags.push("Academic warning");
  if (earlyAlerts > 0) flags.push(`${earlyAlerts} open early alert${earlyAlerts > 1 ? "s" : ""}`);
  if (financialFlags > 0) flags.push(`${financialFlags} financial flag${financialFlags > 1 ? "s" : ""}`);

  if (flags.length === 0) return null;

  const urgent = isUrgent || earlyAlerts > 0;
  const bg = urgent ? "bg-red-600" : "bg-amber-500";
  const border = urgent ? "border-red-700" : "border-amber-600";

  return (
    <div className={`${bg} ${border} border rounded-lg px-4 py-2.5 flex items-center gap-3`}>
      <span className="text-white font-bold text-xs uppercase tracking-wide shrink-0">
        {urgent ? "Action required" : "Note"}
      </span>
      <span className="text-white/30 shrink-0">|</span>
      <p className="text-white text-sm font-medium">
        {flags.join(" · ")}
      </p>
    </div>
  );
}
