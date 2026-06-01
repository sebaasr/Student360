import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

interface FinancialFlag {
  id: string;
  flagType: string;
  isActive: boolean;
  addedAt: Date | string;
  clearedAt: Date | string | null;
}

export function FinancialCard({ flags }: { flags: FinancialFlag[] }) {
  const active = flags.filter((f) => f.isActive);
  return (
    <Card title="Financial Flags" icon="💰" footer="Source: Banner (flag only — no balance)">
      {active.length === 0 ? (
        <EmptyState title="No active financial flags" icon="✓" />
      ) : (
        <div className="space-y-2">
          {active.map((f) => (
            <div key={f.id} className="flex justify-between items-center">
              <Badge variant="red">{f.flagType.replace("_", " ")}</Badge>
              <span className="text-[11px] text-gray-500">Added {formatDate(f.addedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
