import type { Priority } from "@/types/student";

const config: Record<Priority, { dot: string; text: string; bg: string }> = {
  high:   { dot: "bg-red-500",   text: "text-red-700",   bg: "bg-red-50 border-red-200" },
  medium: { dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  low:    { dot: "bg-emerald-400",text: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const c = config[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}
