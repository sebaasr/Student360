import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  icon?: string;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  accent?: "navy" | "green" | "amber" | "red" | "gold";
}

const accentBar: Record<string, string> = {
  navy: "border-t-2 border-t-navy",
  green: "border-t-2 border-t-emerald-500",
  amber: "border-t-2 border-t-amber-400",
  red: "border-t-2 border-t-red-500",
  gold: "border-t-2 border-t-gold",
};

export function Card({ title, icon, className, children, footer, accent }: CardProps) {
  return (
    <section
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden",
        accent && accentBar[accent],
        className,
      )}
    >
      <div className="p-4">
        {title && (
          <h3 className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            {icon && <span className="text-gray-300">{icon}</span>}
            {title}
          </h3>
        )}
        {children}
      </div>
      {footer && (
        <div className="text-[10px] text-gray-400 px-4 py-2 border-t border-gray-100 bg-gray-50/60">
          {footer}
        </div>
      )}
    </section>
  );
}
