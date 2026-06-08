import { ThermometerBar } from "@/components/ui/ThermometerBar";
import { ISPPips, type ISPInfo } from "@/components/ui/ISPPips";
import {
  buildGraduationTracker,
  semestersRemaining,
  type DegreeProgressLike,
} from "@/lib/graduation-tracker";

interface Props {
  degreeProgress: (DegreeProgressLike & { ispRecords?: ISPInfo[] }) | null;
  creditsEarned: number;
  yearLevel: number;
  onOpenSinceEntry?: () => void;
}

export function GraduationTracker({ degreeProgress, creditsEarned, yearLevel, onOpenSinceEntry }: Props) {
  const semRem = semestersRemaining(yearLevel);
  const bars = buildGraduationTracker(degreeProgress, creditsEarned, semRem);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {onOpenSinceEntry ? (
        <button
          onClick={onOpenSinceEntry}
          className="group flex items-center gap-1.5 mb-3"
          title="View engagement since entry"
        >
          <span className="text-[10.5px] font-bold text-gray-500 group-hover:text-navy uppercase tracking-wide transition-colors">
            Graduation Progress
          </span>
          <span className="text-[10px] text-navy/50 group-hover:text-navy transition-colors">
            Since entry →
          </span>
        </button>
      ) : (
        <h3 className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-3">
          Graduation Progress
        </h3>
      )}
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
                  isps={degreeProgress?.ispRecords ?? []}
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
