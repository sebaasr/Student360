import { cn } from "@/lib/utils";

type Variant = "info" | "warning" | "urgent" | "success";

interface CalloutBoxProps {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantMap: Record<Variant, { bg: string; border: string; text: string; dot: string; label: string }> = {
  info:    { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-900",   dot: "bg-blue-500",   label: "Info" },
  warning: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-900",  dot: "bg-amber-500",  label: "Warning" },
  urgent:  { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-900",    dot: "bg-red-500",    label: "Action required" },
  success: { bg: "bg-emerald-50",border: "border-emerald-200",text: "text-emerald-900",dot: "bg-emerald-500",label: "OK" },
};

export function CalloutBox({ variant = "info", title, children, className }: CalloutBoxProps) {
  const v = variantMap[variant];
  return (
    <div className={cn("rounded-lg border px-3 py-2.5 flex items-start gap-2.5 text-sm", v.bg, v.border, v.text, className)}>
      <span className={cn("mt-1 w-2 h-2 rounded-full shrink-0", v.dot)} />
      <div className="flex-1 min-w-0">
        {title && <span className="font-semibold mr-1.5">{title}</span>}
        <span>{children}</span>
      </div>
    </div>
  );
}
