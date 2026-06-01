import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageShell } from "@/components/layout/PageShell";
import { QueryInterface } from "@/components/query/QueryInterface";

export default async function QueryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <PageShell>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-xl font-bold text-navy mb-1">Ask Student 360</h1>
        <p className="text-sm text-gray-500 mb-4">
          Natural language access to your advisee roster. Results are always scoped to what your
          tier allows.
        </p>
        <QueryInterface />
      </div>
    </PageShell>
  );
}
