import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  icon?: string;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ title, icon, className, children, footer }: CardProps) {
  return (
    <section className={cn("bg-white rounded-xl border border-gray-200 p-4", className)}>
      {title && (
        <h3 className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          {icon && <span aria-hidden>{icon}</span>}
          {title}
        </h3>
      )}
      {children}
      {footer && (
        <div className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-100">{footer}</div>
      )}
    </section>
  );
}
