import { PRIMARY_SYSTEMS, sourceLink, sourceLabel } from "@/lib/source-links";

/**
 * Student 360 is a read-only view. To take action on a student's record,
 * the advisor jumps to the system of record. This bar surfaces those
 * deep links prominently on every profile.
 */
export function SourceSystemBar({ studentId }: { studentId: string }) {
  const links = PRIMARY_SYSTEMS.map((sys) => ({
    system: sys,
    label: sourceLabel(sys),
    href: sourceLink(sys, studentId),
  })).filter((l) => l.href);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-navy-light border border-navy/10 rounded-xl px-4 py-2.5 print:hidden">
      <span className="text-[11px] uppercase tracking-wide font-semibold text-navy/70">
        Read-only view · take action in
      </span>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <a
            key={l.system}
            href={l.href!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-white border border-navy/20 text-navy text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-navy hover:text-white transition-colors"
          >
            {l.label}
            <span className="text-[10px] opacity-60">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
