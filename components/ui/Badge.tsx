import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "green" | "amber" | "red" | "navy" | "gold";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
  green: "bg-green-50 text-green-800 border-green-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-red-50 text-red-800 border-red-200",
  navy: "bg-navy text-white border-navy",
  gold: "bg-gold-light text-gold-dark border-gold/40",
};

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
        variantMap[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
