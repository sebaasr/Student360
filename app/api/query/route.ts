import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { answerNaturalLanguageQuery } from "@/lib/query-engine";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { question } = await req.json().catch(() => ({}));
  if (typeof question !== "string" || question.length < 3) {
    return Response.json({ error: "Question is required" }, { status: 400 });
  }

  const result = await answerNaturalLanguageQuery({
    question,
    userId: session.user.id,
    tier: session.user.accessTier,
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "query",
    metadata: { question, matchCount: result.studentCount },
  });

  return Response.json(result);
}
