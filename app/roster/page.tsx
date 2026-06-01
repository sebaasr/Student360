import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PageShell } from "@/components/layout/PageShell";
import { RosterTable } from "@/components/roster/RosterTable";
import type { RosterResponse } from "@/types/student";

async function fetchRoster(): Promise<RosterResponse> {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const res = await fetch(`${proto}://${host}/api/roster`, {
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load roster (${res.status})`);
  }
  return res.json();
}

export default async function RosterPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const roster = await fetchRoster();

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto p-6">
        <RosterTable initial={roster} />
      </div>
    </PageShell>
  );
}
