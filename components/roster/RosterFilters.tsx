"use client";

export type RosterFilterState = {
  query: string;
  year: "all" | "1" | "2" | "3" | "4";
  priority: "all" | "high" | "medium" | "low";
};

interface Props {
  value: RosterFilterState;
  onChange: (next: RosterFilterState) => void;
}

export function RosterFilters({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        placeholder="Search by name or ID…"
        value={value.query}
        onChange={(e) => onChange({ ...value, query: e.target.value })}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy min-w-[220px]"
      />
      <select
        value={value.year}
        onChange={(e) => onChange({ ...value, year: e.target.value as RosterFilterState["year"] })}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
      >
        <option value="all">All years</option>
        <option value="1">First-Year</option>
        <option value="2">Sophomore</option>
        <option value="3">Junior</option>
        <option value="4">Senior</option>
      </select>
      <select
        value={value.priority}
        onChange={(e) =>
          onChange({ ...value, priority: e.target.value as RosterFilterState["priority"] })
        }
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
      >
        <option value="all">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  );
}
