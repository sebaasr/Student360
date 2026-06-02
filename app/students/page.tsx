import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { TIER_SEES_ALL } from "@/lib/rbac";
import { PageShell } from "@/components/layout/PageShell";
import { RosterTable } from "@/components/roster/RosterTable";
import type { RosterResponse } from "@/types/student";

async function fetchAllStudents(): Promise<RosterResponse> {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const res = await fetch(`${proto}://${host}/api/roster?scope=all`, {
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load students (${res.status})`);
  return res.json();
}

export default async function AllStudentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!TIER_SEES_ALL[session.user.accessTier]) {
    return (
      <PageShell>
        <Forbidden message="Your access tier does not allow viewing the all-students roster." />
      </PageShell>
    );
  }

  const roster = await fetchAllStudents();
  return (
    <PageShell>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">All students</div>
        <RosterTable initial={roster} title="All students across the college" />
      </div>
    </PageShell>
  );
}

function Forbidden({ message }: { message: string }) {
  return (
    <div className="max-w-3xl mx-auto p-6 text-center">
      <div className="bg-white border border-red-200 rounded-xl p-8">
        <div className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Access denied</div>
        <h2 className="text-lg font-semibold text-red-800">All students</h2>
        <p className="text-sm text-gray-600 mt-1">{message}</p>
      </div>
    </div>
  );
}
