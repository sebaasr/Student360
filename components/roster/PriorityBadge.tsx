import { Badge } from "@/components/ui/Badge";
import type { Priority } from "@/types/student";

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "high") return <Badge variant="red">● High</Badge>;
  if (priority === "medium") return <Badge variant="amber">● Medium</Badge>;
  return <Badge variant="green">● Low</Badge>;
}
