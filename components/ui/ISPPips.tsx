interface ISPPipsProps {
  completed: number;
  required: number;
  semestersRemaining: number;
}

export function ISPPips({ completed, required, semestersRemaining }: ISPPipsProps) {
  const remaining = required - completed;
  const hasPacingRisk = remaining > semestersRemaining;

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2">
        {Array.from({ length: required }).map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
              i < completed
                ? "bg-[#202944] text-white border-[#202944]"
                : "bg-gray-100 text-gray-400 border-gray-200"
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-600">
        {completed} complete ·{" "}
        <span className={hasPacingRisk ? "text-amber-700 font-semibold" : ""}>
          {remaining} remaining
        </span>
        {hasPacingRisk && " · ⚠️ Pacing risk"}
      </div>
    </div>
  );
}
