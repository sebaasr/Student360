import {
  MSPR_SOURCE,
  MSPR_OVERVIEW,
  MSPR_CONCERN_TYPES,
  MSPR_BY_YEAR,
  MSPR_BY_ATHLETE,
  MSPR_CONCERNS_PER_STUDENT,
  MSPR_COURSE_DANGER,
} from "@/lib/mspr-data";

// Horizontal labeled bar — no chart lib, prints cleanly.
function Bar({ label, value, max, suffix = "%", tone = "navy" }: { label: string; value: number; max: number; suffix?: string; tone?: "navy" | "amber" | "gold" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = tone === "amber" ? "bg-amber-400" : tone === "gold" ? "bg-gold" : "bg-navy";
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-48 shrink-0 text-xs text-gray-700 truncate">{label}</div>
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-12 shrink-0 text-right text-xs font-semibold text-navy tabular-nums">
        {value}{suffix}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h3 className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</h3>
      {children}
    </div>
  );
}

export function MsprInsights() {
  const maxConcernType = Math.max(...MSPR_CONCERN_TYPES.map((c) => c.pct));
  const maxPerStudent = Math.max(...MSPR_CONCERNS_PER_STUDENT.map((c) => c.students));
  const maxDanger = Math.max(...MSPR_COURSE_DANGER.map((c) => c.students));

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="text-lg font-serif font-bold text-navy">MSPR Insights</h2>
        <span className="text-[11px] text-gray-400">{MSPR_SOURCE}</span>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Tile label="Students assessed" value={MSPR_OVERVIEW.studentBody.toLocaleString()} />
        <Tile label="With ≥1 concern" value={MSPR_OVERVIEW.studentsWithConcerns.toString()} accent="amber" />
        <Tile label="% with concerns" value={`${MSPR_OVERVIEW.percentWithConcerns}%`} accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Most common concern types">
          {MSPR_CONCERN_TYPES.map((c) => (
            <Bar key={c.label} label={c.label} value={c.pct} max={maxConcernType} tone="amber" />
          ))}
        </Panel>

        <Panel title="Students with concerns by academic year">
          {MSPR_BY_YEAR.map((y) => (
            <Bar key={y.year} label={`${y.year} (${y.withConcerns}/${y.total})`} value={y.pct} max={50} tone="navy" />
          ))}
          <p className="text-[11px] text-gray-400 mt-2">Concern rate is highest among first-year students.</p>
        </Panel>

        <Panel title="Concerns per student">
          {MSPR_CONCERNS_PER_STUDENT.filter((c) => c.students > 0).map((c) => (
            <Bar
              key={c.concerns}
              label={`${c.concerns} concern${c.concerns === 1 ? "" : "s"}`}
              value={c.students}
              max={maxPerStudent}
              suffix=""
              tone={c.concerns === 0 ? "navy" : "gold"}
            />
          ))}
        </Panel>

        <Panel title="Students in danger of unsatisfactory courses">
          {MSPR_COURSE_DANGER.map((d) => (
            <Bar
              key={d.dangerCourses}
              label={`${d.dangerCourses} course${d.dangerCourses === 1 ? "" : "s"} at risk`}
              value={d.students}
              max={maxDanger}
              suffix=""
              tone={d.dangerCourses === 0 ? "navy" : "amber"}
            />
          ))}
        </Panel>
      </div>

      <Panel title="Concern rate — athletes vs. non-athletes">
        <div className="grid grid-cols-2 gap-4">
          {MSPR_BY_ATHLETE.map((a) => (
            <div key={a.group} className="text-center">
              <div className="text-3xl font-bold text-navy">{a.pct}%</div>
              <div className="text-xs text-gray-500 mt-0.5">{a.group}</div>
              <div className="text-[11px] text-gray-400">{a.withConcerns} of {a.total}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 text-center">
          Athletes and non-athletes show nearly identical concern rates.
        </p>
      </Panel>
    </section>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: "amber" }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
      <div className="text-[10.5px] uppercase tracking-wide text-gray-500 font-semibold">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent === "amber" ? "text-amber-700" : "text-navy"}`}>{value}</div>
    </div>
  );
}
