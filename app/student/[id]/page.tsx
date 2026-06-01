import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageShell } from "@/components/layout/PageShell";
import { StudentHeader } from "@/components/profile/StudentHeader";
import { FlagBanner } from "@/components/profile/FlagBanner";
import { ProfileBody } from "@/components/profile/ProfileBody";

async function fetchProfile(id: string) {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const res = await fetch(`${proto}://${host}/api/student/${encodeURIComponent(id)}`, {
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (res.status === 403) return "forbidden" as const;
  if (!res.ok) throw new Error(`Failed to load student (${res.status})`);
  return res.json();
}

export default async function StudentPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await fetchProfile(params.id);
  if (data === null) notFound();
  if (data === "forbidden") {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto p-6 text-center">
          <div className="bg-white border border-red-200 rounded-xl p-8">
            <div className="text-3xl mb-2">🚫</div>
            <h2 className="text-lg font-semibold text-red-800">Access denied</h2>
            <p className="text-sm text-gray-600 mt-1">
              Your access tier does not allow viewing this student.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  const onTrack = data.degreeProgress?.onTrackForGraduation ?? true;
  const hasHold =
    (data.financialFlags ?? []).some((f: { isActive: boolean }) => f.isActive) ||
    (data.earlyAlerts ?? []).some((a: { status: string }) => a.status === "open");
  const contractsSatisfactory = (data.contracts ?? []).filter(
    (c: { status: string }) => c.status === "signed" || c.status === "finalized",
  ).length;

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <Breadcrumb id={data.student.id} name={`${data.student.firstName} ${data.student.lastName}`} />

        <StudentHeader
          student={data.student}
          expectedGraduation={data.degreeProgress?.projectedGradTerm ?? null}
          contractsSatisfactory={contractsSatisfactory}
          contractsTotal={8}
          onTrack={onTrack}
          hasHold={hasHold}
        />
        <FlagBanner
          academicStanding={data.flags.academicStanding}
          earlyAlerts={data.flags.earlyAlerts}
          financialFlags={data.flags.financialFlags}
        />
        <ProfileBody data={data} />
      </div>
    </PageShell>
  );
}

function Breadcrumb({ id, name }: { id: string; name: string }) {
  return (
    <nav className="text-sm text-gray-500">
      <Link href="/roster" className="hover:underline">
        My advisees
      </Link>
      <span className="mx-1.5">›</span>
      <span className="text-navy">{name}</span>
      <span className="text-gray-400"> · {id}</span>
    </nav>
  );
}
