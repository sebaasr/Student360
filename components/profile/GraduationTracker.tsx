import { ThermometerBar } from "@/components/ui/ThermometerBar";
import { ISPPips } from "@/components/ui/ISPPips";
import {
  buildGraduationTracker,
  semestersRemaining,
  type DegreeProgressLike,
} from "@/lib/graduation-tracker";

interface Props {
  degreeProgress: DegreeProgressLike | null;
  creditsEarned: number;
  yearLevel: number;
}

export function GraduationTracker({ degreeProgress, creditsEarned, yearLevel }: Props) {
  const semRem = semestersRemaining(yearLevel);
  const bars = buildGraduationTracker(degreeProgress, creditsEarned, semRem);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-3">
        🎓 Graduation Progress
      </h3>
      <div className="divide-y divide-gray-50">
        {bars.map((b) =>
          b.displayType === "pips" ? (
            <div key={b.id} className="py-2 flex items-start gap-3">
              <div className="w-40 flex-shrink-0">
                <div className="text-sm font-semibold text-gray-800">{b.label}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{b.sublabel}</div>
              </div>
              <div className="flex-1">
                <ISPPips
                  completed={b.current}
                  required={b.total}
                  semestersRemaining={semRem}
                />
              </div>
            </div>
          ) : (
            <ThermometerBar
              key={b.id}
              label={b.label}
              sublabel={b.sublabel}
              current={b.current}
              total={b.total}
              unit={b.unit}
              colorScheme={b.colorScheme}
              ticks={b.ticks}
              alertLabel={b.alertLabel}
              showPacingWarning={b.showPacingWarning}
            />
          ),
        )}
      </div>
      <div className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-100">
        Source: DegreeWorks · Banner
      </div>
    </div>
  );
}
