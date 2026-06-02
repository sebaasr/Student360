import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { PageShell } from "@/components/layout/PageShell";
import type { RosterResponse } from "@/types/student";

async function fetchAllStudents(): Promise<RosterResponse> {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const res = await fetch(`${proto}://${host}/api/roster?scope=all`, {
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load reports (${res.status})`);
  return res.json();
}

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.accessTier < 7) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto p-6 text-center">
          <div className="bg-white border border-red-200 rounded-xl p-8">
            <div className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Access denied</div>
            <h2 className="text-lg font-semibold text-red-800">Reports</h2>
            <p className="text-sm text-gray-600 mt-1">
              Reports are available to Registrar / Provost Office and above.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  const roster = await fetchAllStudents();
  const total = roster.students.length;
  const byYear: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const byStanding: Record<string, number> = {};
  let bfAtRisk = 0;
  let probation = 0;
  let notMet = 0;

  for (const s of roster.students) {
    byYear[s.yearLevel] = (byYear[s.yearLevel] ?? 0) + 1;
    byStanding[s.academicStanding] = (byStanding[s.academicStanding] ?? 0) + 1;
    if (s.brightFuturesStatus === "yellow" || s.brightFuturesStatus === "red") bfAtRisk += 1;
    if (s.academicStanding === "academic_probation") probation += 1;
    if (s.lastAdvisingDate === null) notMet += 1;
  }

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Reports</div>
          <h1 className="text-xl font-bold text-navy">Institutional snapshot</h1>
          <p className="text-sm text-gray-600 mt-1">
            High-level cohort metrics computed from current Banner + Navigate + DegreeWorks data.
          </p>
        </div>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Tile label="Total students" value={total} />
          <Tile label="On probation" value={probation} accent="red" />
          <Tile label="BF at risk" value={bfAtRisk} accent="amber" />
          <Tile label="Not met this term" value={notMet} accent="red" />
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-3">
            By year level
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((y) => (
              <div key={y}>
                <div className="text-[10.5px] uppercase tracking-wide text-gray-500">
                  {["First-Year", "Sophomore", "Junior", "Senior"][y - 1]}
                </div>
                <div className="text-2xl font-bold text-navy">{byYear[y] ?? 0}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-3">
            By academic standing
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(byStanding).map(([k, v]) => (
              <div key={k}>
                <div className="text-[10.5px] uppercase tracking-wide text-gray-500">
                  {k.replace("_", " ")}
                </div>
                <div className="text-2xl font-bold text-navy">{v}</div>
              </div>
            ))}
          </div>
        </section>

        <p className="text-[11px] text-gray-400">
          Reports are read-only snapshots at the time the page was rendered. CSV exports + Title IX
          / NCAA compliance reports will land in this view.
        </p>
      </div>
    </PageShell>
  );
}

function Tile({ label, value, accent }: { label: string; value: number; accent?: "red" | "amber" }) {
  const tone =
    accent === "red" ? "text-red-700" : accent === "amber" ? "text-amber-700" : "text-navy";
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <div className="text-[10.5px] uppercase tracking-wide text-gray-500 font-semibold">
        {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${tone}`}>{value}</div>
    </div>
  );
}
