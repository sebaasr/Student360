"use client";

export type Lens =
  | "since_entry"
  | "this_semester"
  | "next_semester"
  | "academic"
  | "evaluations"
  | "athletics"
  | "financial";

const LENSES: { id: Lens; label: string }[] = [
  { id: "since_entry", label: "Since entry" },
  { id: "this_semester", label: "This semester" },
  { id: "next_semester", label: "Next semester" },
  { id: "academic", label: "Academic" },
  { id: "evaluations", label: "Evaluations" },
  { id: "athletics", label: "Athletics" },
  { id: "financial", label: "Financial" },
];

interface Props {
  active: Lens;
  onChange: (next: Lens) => void;
  hideLenses?: Lens[];
}

export function LensBar({ active, onChange, hideLenses = [] }: Props) {
  const visible = LENSES.filter((l) => !hideLenses.includes(l.id));
  return (
    <div className="inline-flex flex-wrap items-center gap-1 bg-white rounded-xl border border-gray-200 p-1">
      {visible.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => onChange(l.id)}
          className={`px-3 py-1.5 rounded-md text-sm transition ${
            active === l.id
              ? "bg-navy text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
