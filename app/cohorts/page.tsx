import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { PageShell } from "@/components/layout/PageShell";
import { CohortGrid, type CohortData } from "@/components/cohorts/CohortGrid";
import type { RosterResponse, RosterStudent } from "@/types/student";

async function fetchAllStudents(): Promise<RosterResponse> {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const res = await fetch(`${proto}://${host}/api/roster?scope=all`, {
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load cohorts (${res.status})`);
  return res.json();
}

interface Cohort {
  id: string;
  label: string;
  description: string;
  filter: (s: RosterStudent) => boolean;
}

const COHORTS: Cohort[] = [
  { id: "ftic", label: "FTIC (first-year)", description: "First-time-in-college students currently enrolled.", filter: (s) => s.yearLevel === 1 && !s.isTransfer },
  { id: "sophomores", label: "Sophomores", description: "Second-year students.", filter: (s) => s.yearLevel === 2 },
  { id: "juniors", label: "Juniors", description: "Third-year students.", filter: (s) => s.yearLevel === 3 },
  { id: "seniors", label: "Seniors", description: "Fourth-year students with thesis on the horizon.", filter: (s) => s.yearLevel === 4 },
  { id: "transfers", label: "Transfer students", description: "Students who transferred in with prior college credits.", filter: (s) => s.isTransfer },
  { id: "athletes", label: "Student-athletes", description: "Certified NAIA Sun Conference student-athletes.", filter: (s) => s.isStudentAthlete },
  { id: "probation", label: "On probation", description: "Students whose standing is academic probation.", filter: (s) => s.academicStanding === "academic_probation" },
  { id: "bf_at_risk", label: "Bright Futures at risk", description: "Students whose BF status is yellow or red.", filter: (s) => s.brightFuturesStatus === "yellow" || s.brightFuturesStatus === "red" },
  { id: "no_meet", label: "Not met this term", description: "Students with no advising meeting recorded this term.", filter: (s) => s.lastAdvisingDate === null },
  { id: "high_priority", label: "High priority", description: "Anyone the priority engine flags as high.", filter: (s) => s.priority === "high" },
];

export default async function CohortsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.accessTier < 7) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto p-6 text-center">
          <div className="bg-white border border-red-200 rounded-xl p-8">
            <div className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Access denied</div>
            <h2 className="text-lg font-semibold text-red-800">Cohort analytics</h2>
            <p className="text-sm text-gray-600 mt-1">
              Cohort analytics is available to Registrar / Provost Office and above.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  const roster = await fetchAllStudents();

  const cohortData: CohortData[] = COHORTS.map((c) => ({
    id: c.id,
    label: c.label,
    description: c.description,
    members: roster.students.filter(c.filter).map((s) => ({
      id: s.id,
      name: s.name,
      yearLevel: s.yearLevel,
      aoc: s.aoc,
      academicStanding: s.academicStanding,
      priority: s.priority,
    })),
  }));

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Cohorts</div>
          <h1 className="text-xl font-bold text-navy">Segmented views of the college</h1>
          <p className="text-sm text-gray-600 mt-1">
            Click a cohort tile to see every student in that group. Counts reflect all students you
            have access to.
          </p>
        </div>
        <CohortGrid cohorts={cohortData} />
      </div>
    </PageShell>
  );
}
