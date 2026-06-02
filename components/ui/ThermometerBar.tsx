interface ThermometerBarProps {
  label: string;
  sublabel?: string;
  current: number;
  total: number;
  unit?: string;
  colorScheme?: "navy" | "gold" | "green" | "amber" | "red";
  ticks?: number[];
  alertLabel?: string;
  showPacingWarning?: boolean;
}

export function ThermometerBar({
  label,
  sublabel,
  current,
  total,
  unit = "credits",
  colorScheme = "navy",
  ticks = [],
  alertLabel,
  showPacingWarning,
}: ThermometerBarProps) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  const colorMap = {
    navy: "bg-gradient-to-r from-[#2d3f6b] to-[#202944]",
    gold: "bg-gradient-to-r from-[#c8b87a] to-[#B3A369]",
    green: "bg-gradient-to-r from-green-400 to-green-600",
    amber: "bg-gradient-to-r from-orange-400 to-amber-500",
    red: "bg-gradient-to-r from-red-400 to-red-600",
  };

  return (
    <div className="flex items-start gap-3 py-2">
      {/* Label column */}
      <div className="w-40 flex-shrink-0">
        <div className="text-sm font-semibold text-gray-800 flex items-center gap-1 flex-wrap">
          {label}
          {alertLabel && (
            <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
              {alertLabel}
            </span>
          )}
        </div>
        {sublabel && <div className="text-[11px] text-gray-500 mt-0.5">{sublabel}</div>}
      </div>

      {/* Bar column */}
      <div className="flex-1">
        <div className="relative h-[18px] bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorMap[colorScheme]}`}
            style={{ width: `${pct}%` }}
          />
          {ticks.map((tick) => (
            <div
              key={tick}
              className="absolute top-0 h-full w-px bg-white/40"
              style={{ left: `${(tick / total) * 100}%` }}
            />
          ))}
        </div>
        {ticks.length > 0 && (
          <div className="flex justify-between mt-0.5 px-0">
            <span className="text-[9px] text-gray-400">0</span>
            {ticks.map((t) => (
              <span key={t} className="text-[9px] text-gray-400">
                {t}
              </span>
            ))}
            <span className="text-[9px] text-gray-400">{total}</span>
          </div>
        )}
        {showPacingWarning && (
          <div className="text-[10.5px] text-amber-700 mt-0.5">Pacing risk — plan soon</div>
        )}
      </div>

      {/* Value column */}
      <div className="w-20 flex-shrink-0 text-right">
        <span className="text-sm font-bold text-[#202944]">{current}</span>
        <span className="text-xs text-gray-500"> / {total}</span>
        <div className="text-[10px] text-gray-400">
          {pct}% · {unit}
        </div>
      </div>
    </div>
  );
}
