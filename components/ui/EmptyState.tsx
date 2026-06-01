interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
}

export function EmptyState({ title = "No data", description, icon = "—" }: EmptyStateProps) {
  return (
    <div className="text-center py-6 text-sm text-gray-500">
      <div className="text-2xl text-gray-300 mb-1">{icon}</div>
      <div className="font-medium text-gray-700">{title}</div>
      {description && <div className="text-xs text-gray-400 mt-0.5">{description}</div>}
    </div>
  );
}
