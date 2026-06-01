import { cn } from "@/lib/utils";

type Variant = "info" | "warning" | "urgent" | "success";

interface CalloutBoxProps {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantMap: Record<Variant, { bg: string; border: string; text: string; icon: string }> = {
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", icon: "ℹ️" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", icon: "⚠️" },
  urgent: { bg: "bg-red-50", border: "border-red-200", text: "text-red-900", icon: "🚨" },
  success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-900", icon: "✓" },
};

export function CalloutBox({ variant = "info", title, children, className }: CalloutBoxProps) {
  const v = variantMap[variant];
  return (
    <div
      className={cn(
        "rounded-lg border p-3 flex gap-2 text-sm",
        v.bg,
        v.border,
        v.text,
        className,
      )}
    >
      <span aria-hidden>{v.icon}</span>
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}
