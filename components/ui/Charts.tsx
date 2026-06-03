"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine,
} from "recharts";

const NAVY = "#202944";
const GOLD = "#B3A369";

// ── GPA trend line ───────────────────────────────────────────────────────────
export function GpaTrendChart({
  data,
  probationThreshold = 2.0,
}: {
  data: { term: string; gpa: number }[];
  probationThreshold?: number;
}) {
  if (data.length < 2) return null;
  const shortTerms = data.map((d) => ({
    ...d,
    short: d.term.replace(/(\w+)\s(\d{4})/, (_, s: string, y: string) => `${s.slice(0, 2)} '${y.slice(2)}`),
  }));

  return (
    <div className="h-28 -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={shortTerms} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="short" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 4]} ticks={[0, 2, 4]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={20} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(v: number) => [v.toFixed(2), "GPA"]}
          />
          <ReferenceLine y={probationThreshold} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
          <Line type="monotone" dataKey="gpa" stroke={NAVY} strokeWidth={2.5} dot={{ r: 3, fill: NAVY }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Tutoring frequency bars ──────────────────────────────────────────────────
export function TutoringBarChart({
  data,
}: {
  data: { label: string; minutes: number; noShow: boolean }[];
}) {
  if (data.length === 0) return null;
  return (
    <div className="h-24 -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={20} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(v: number) => [`${v} min`, "Duration"]}
          />
          <Bar dataKey="minutes" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.noShow ? "#ef4444" : GOLD} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
