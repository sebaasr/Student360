import { formatDate } from "@/lib/utils";

interface SourceLabelProps {
  source: string;
  syncedAt?: Date | string | null;
}

export function SourceLabel({ source, syncedAt }: SourceLabelProps) {
  return (
    <span>
      Source: {source}
      {syncedAt && ` · synced ${formatDate(syncedAt)}`}
    </span>
  );
}
