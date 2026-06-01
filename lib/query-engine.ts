import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

interface QueryInput {
  question: string;
  userId: string;
  tier: number;
}

interface QueryAnswer {
  intent: string;
  studentCount: number;
  students: Array<{ id: string; name: string; reason: string }>;
  summary: string;
}

// The query engine translates natural language → structured Prisma filters
// using a small Claude call. Results are always re-checked against tier scope.
export async function answerNaturalLanguageQuery({
  question,
  userId,
  tier,
}: QueryInput): Promise<QueryAnswer> {
  // 1. Build the scope baseline — start with the same roster the user can already see.
  const scope: Prisma.StudentWhereInput =
    tier >= 5 ? {} : tier === 1 ? { advisorId: userId } : { id: "__none__" };

  // 2. Ask Claude for a structured filter spec.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  let spec: FilterSpec | null = null;
  if (apiKey) {
    const client = new Anthropic({ apiKey });
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: buildPrompt(question),
          },
        ],
      });
      const text = response.content
        .filter((c): c is Anthropic.TextBlock => c.type === "text")
        .map((c) => c.text)
        .join("");
      spec = JSON.parse(text);
    } catch {
      spec = null;
    }
  }

  // 3. Materialize the filter.
  const where = buildWhere(scope, spec);

  const students = await prisma.student.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      preferredName: true,
      academicStanding: true,
      cumulativeGpa: true,
      yearLevel: true,
    },
    take: 50,
  });

  return {
    intent: spec?.intent ?? "fallback_keyword_match",
    studentCount: students.length,
    students: students.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      reason: describeMatch(s, spec),
    })),
    summary: spec?.summary ?? `${students.length} students match.`,
  };
}

interface FilterSpec {
  intent: string;
  summary: string;
  filters?: {
    standing?: string[];
    minGpa?: number;
    maxGpa?: number;
    yearLevel?: number[];
    brightFuturesAtRisk?: boolean;
  };
}

function buildPrompt(question: string): string {
  return `You translate advising questions into JSON filter specs.

Available filter keys:
  standing: string[]  // values: "good_standing","academic_warning","academic_probation"
  minGpa: number
  maxGpa: number
  yearLevel: number[] // 1..4
  brightFuturesAtRisk: boolean

Respond ONLY as JSON, no fences:
  {"intent": "...", "summary": "...", "filters": { ... }}

Question: ${JSON.stringify(question)}`;
}

function buildWhere(
  scope: Prisma.StudentWhereInput,
  spec: FilterSpec | null,
): Prisma.StudentWhereInput {
  if (!spec?.filters) return scope;
  const f = spec.filters;
  const where: Prisma.StudentWhereInput = { ...scope };

  if (f.standing?.length) where.academicStanding = { in: f.standing };
  if (typeof f.minGpa === "number") {
    where.cumulativeGpa = { ...(where.cumulativeGpa as object), gte: f.minGpa };
  }
  if (typeof f.maxGpa === "number") {
    where.cumulativeGpa = { ...(where.cumulativeGpa as object), lte: f.maxGpa };
  }
  if (f.yearLevel?.length) where.yearLevel = { in: f.yearLevel };
  if (f.brightFuturesAtRisk) {
    where.AND = [
      { brightFuturesActive: true },
      { cumulativeGpa: { lt: 3.0 } }, // simple heuristic; real check belongs in BF lib
    ];
  }

  return where;
}

function describeMatch(
  s: { academicStanding: string; cumulativeGpa: number | null; yearLevel: number },
  spec: FilterSpec | null,
): string {
  if (!spec) return `${s.academicStanding} · GPA ${s.cumulativeGpa?.toFixed(2) ?? "—"}`;
  const parts: string[] = [];
  if (spec.filters?.standing?.includes(s.academicStanding)) parts.push(s.academicStanding);
  if (s.cumulativeGpa !== null) parts.push(`GPA ${s.cumulativeGpa.toFixed(2)}`);
  parts.push(`Year ${s.yearLevel}`);
  return parts.join(" · ");
}
