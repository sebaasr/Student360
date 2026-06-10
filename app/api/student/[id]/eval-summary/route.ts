import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewStudent, canViewPanel } from "@/lib/rbac";

interface EvalSummary {
  positives: string[];
  issues: string[];
  source: "ai" | "rules";
}

// POST — summarize a student's narrative evaluations into positives + issues.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId, accessTier } = session.user;
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    select: { advisorId: true },
  });
  if (!student) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canViewStudent(accessTier, userId, student.advisorId) || !canViewPanel(accessTier, "evaluations")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const evals = await prisma.evaluation.findMany({
    where: { studentId: params.id },
    orderBy: { termCode: "desc" },
    take: 20,
    select: { courseCode: true, term: true, evaluationText: true },
  });

  if (evals.length === 0) {
    return Response.json({ positives: [], issues: [], source: "rules" } satisfies EvalSummary);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      // Anonymize: only course + text, no student identity, leaves NCF only as
      // text patterns (FERPA — see DATA-GOVERNANCE.md §8).
      const corpus = evals
        .map((e) => `[${e.courseCode}, ${e.term}] ${e.evaluationText}`)
        .join("\n\n");
      const response = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 500,
        messages: [{ role: "user", content: buildPrompt(corpus) }],
      });
      const text = response.content
        .filter((c): c is Anthropic.TextBlock => c.type === "text")
        .map((c) => c.text)
        .join("");
      const parsed = JSON.parse(text) as Omit<EvalSummary, "source">;
      return Response.json({ ...parsed, source: "ai" } satisfies EvalSummary);
    } catch {
      // fall through to rules
    }
  }

  return Response.json(rulesSummary(evals.map((e) => e.evaluationText)));
}

function buildPrompt(corpus: string): string {
  return `You are summarizing a New College of Florida student's narrative course evaluations for their faculty advisor. Identify recurring themes.

Evaluations:
${corpus}

Respond ONLY as JSON, no fences:
{
  "positives": ["2-4 short bullet points of consistent strengths / positive feedback"],
  "issues": ["2-4 short bullet points of recurring concerns or areas to address; empty array if none"]
}
Each bullet is a short phrase. Base everything on the text; do not invent.`;
}

const POS_RE = /\b(strong|excellent|exceptional|impressive|thoughtful|insightful|outstanding|rigorous|creative|genuine|mature|sophisticated|curiosity|initiative)\b/i;
const NEG_RE = /\b(inconsistent|missed|missing|late|not submitted|concern|below|declined|struggl|absent|attendance|incomplete|behind|unresolved)\b/i;

function rulesSummary(texts: string[]): EvalSummary {
  const positives = new Set<string>();
  const issues = new Set<string>();
  for (const t of texts) {
    for (const sentence of t.split(/(?<=[.!?])\s+/)) {
      if (POS_RE.test(sentence) && positives.size < 4) positives.add(trim(sentence));
      else if (NEG_RE.test(sentence) && issues.size < 4) issues.add(trim(sentence));
    }
  }
  return { positives: [...positives], issues: [...issues], source: "rules" };
}

function trim(s: string): string {
  const t = s.trim();
  return t.length > 140 ? t.slice(0, 137) + "…" : t;
}
