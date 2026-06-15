"use client";

import type { RequirementBreakdown, ReqStatus } from "@/lib/requirements";

const statusStyle: Record<ReqStatus, { icon: string; iconCls: string; text: string; textCls: string }> = {
  complete: { icon: "✓", iconCls: "bg-emerald-100 text-emerald-700", text: "Complete", textCls: "text-emerald-700" },
  in_progress: { icon: "◐", iconCls: "bg-amber-100 text-amber-700", text: "In progress", textCls: "text-amber-700" },
  not_fulfilled: { icon: "○", iconCls: "bg-red-100 text-red-600", text: "Not yet fulfilled", textCls: "text-red-600" },
};

export function RequirementsModal({
  breakdown,
  onClose,
}: {
  breakdown: RequirementBreakdown;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[8vh] px-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[82vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-serif font-bold text-navy">{breakdown.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{breakdown.subtitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none shrink-0">×</button>
        </div>

        {/* Sections */}
        <div className="overflow-y-auto px-5 py-3">
          {breakdown.sections.map((section) => (
            <div key={section.label} className="mb-4 last:mb-0">
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                {section.label} <span className="text-gray-300">· {section.summary}</span>
              </div>
              <div className="space-y-1.5">
                {section.items.map((item, i) => {
                  const st = statusStyle[item.status];
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${st.iconCls}`}>
                        {st.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 leading-tight">{item.name}</div>
                        {item.subtext && <div className="text-[11px] text-gray-400">{item.subtext}</div>}
                      </div>
                      <span className={`text-[11px] font-medium shrink-0 ${st.textCls}`}>{st.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/70">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Source: Banner · DegreeWorks. This panel reflects data as of last sync and is intended for
            advising use. The official degree audit is maintained by the Office of the Registrar.
          </p>
        </div>
      </div>
    </div>
  );
}
