import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewStudent } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

const CURRENT_TERM_CODE = "202601";

interface Brief {
  headline: string;
  talkingPoints: string[];
  sinceLastMeeting: string;
  source: "ai" | "rules";
}

// POST — generate a pre-meeting advising brief for a student.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const studentId = params.id;
  const { id: userId, accessTier } = session.user;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      degreeProgress: true,
      contracts: { where: { termCode: CURRENT_TERM_CODE } },
      advisingRecords: { orderBy: { appointmentDate: "desc" }, take: 3 },
      earlyAlerts: { where: { status: "open" } },
      predictiveInsights: { where: { isDismissed: false } },
      financialFlags: { where: { isActive: true } },
      semesterGpas: { orderBy: { termCode: "asc" } },
      athleticsRecord: true,
    },
  });
  if (!student) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canViewStudent(accessTier, userId, student.advisorId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await writeAuditLog({ userId, studentId, action: "generate_brief", panelName: "meeting_prep" });

  const facts = buildFacts(student);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Try AI; fall back to rules.
  if (apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 600,
        messages: [{ role: "user", content: buildPrompt(facts) }],
      });
      const text = response.content
        .filter((c): c is Anthropic.TextBlock => c.type === "text")
        .map((c) => c.text)
        .join("");
      const parsed = JSON.parse(text) as Omit<Brief, "source">;
      return Response.json({ ...parsed, source: "ai" } satisfies Brief);
    } catch {
      // fall through to rules
    }
  }

  return Response.json(rulesBrief(student, facts));
}

interface StudentForBrief {
  firstName: string;
  preferredName: string | null;
  yearLevel: number;
  academicStanding: string;
  cumulativeGpa: number | null;
  declaredAoc: string | null;
  degreeProgress: { thesisStatus: string; thesisSponsor: string | null } | null;
  contracts: { status: string }[];
  advisingRecords: { appointmentDate: Date; noteText: string | null }[];
  earlyAlerts: unknown[];
  predictiveInsights: { title: string; severity: string }[];
  financialFlags: unknown[];
  semesterGpas: { term: string; gpa: number }[];
  athleticsRecord: { sport: string; eligibilityStatus: string } | null;
}

function buildFacts(s: StudentForBrief): string {
  const name = s.preferredName ?? s.firstName;
  const yr = ["", "first-year", "sophomore", "junior", "senior"][s.yearLevel] ?? "student";
  const gpaTrend = s.semesterGpas.map((g) => `${g.term}: ${g.gpa.toFixed(2)}`).join(", ");
  const contract = s.contracts[0]?.status ?? "none";
  const lastNote = s.advisingRecords[0]?.noteText ?? "none on record";
  const insights = s.predictiveInsights.map((i) => `[${i.severity}] ${i.title}`).join("; ") || "none";
  return [
    `Name: ${name} (${yr})`,
    `AOC: ${s.declaredAoc ?? "undeclared"}`,
    `Academic standing: ${s.academicStanding.replace("_", " ")}`,
    `Cumulative GPA: ${s.cumulativeGpa?.toFixed(2) ?? "n/a"}`,
    `GPA history: ${gpaTrend || "n/a"}`,
    `Current term contract: ${contract}`,
    `Thesis: ${s.degreeProgress?.thesisStatus ?? "n/a"}${s.degreeProgress?.thesisSponsor ? ` (sponsor: ${s.degreeProgress.thesisSponsor})` : ""}`,
    `Open early alerts: ${s.earlyAlerts.length}`,
    `Active financial flags: ${s.financialFlags.length}`,
    s.athleticsRecord ? `Athlete: ${s.athleticsRecord.sport}, eligibility ${s.athleticsRecord.eligibilityStatus}` : "",
    `Predictive insights: ${insights}`,
    `Last advising note: ${lastNote}`,
  ].filter(Boolean).join("\n");
}

function buildPrompt(facts: string): string {
  return `You are helping a New College of Florida faculty advisor prepare for a one-on-one advising meeting. Below is the student's current record. Produce a concise pre-meeting brief.

Student record:
${facts}

Respond ONLY as JSON, no fences:
{
  "headline": "one sentence capturing the single most important thing to address",
  "talkingPoints": ["3-5 specific, actionable talking points the advisor should raise, each a short sentence"],
  "sinceLastMeeting": "one sentence on what appears to have changed or needs follow-up since the last meeting"
}

Be specific to this student. Reference real data (GPA, contract status, thesis, alerts). Do not invent facts.`;
}

function rulesBrief(s: StudentForBrief, _facts: string): Brief {
  const name = s.preferredName ?? s.firstName;
  const points: string[] = [];

  if (s.academicStanding === "academic_probation")
    points.push(`${name} is on academic probation — review the path back to good standing and required support.`);
  if (s.contracts[0]?.status === "not_started")
    points.push("No contract on file for the current term — finalizing it should be the priority.");
  else if (s.contracts[0]?.status === "pending_advisor")
    points.push("Contract is awaiting your signature — review and sign if appropriate.");
  if (s.degreeProgress?.thesisStatus === "not_started" && s.yearLevel === 4)
    points.push("Senior with no thesis started — discuss sponsor and timeline.");
  if (s.earlyAlerts.length > 0)
    points.push(`${s.earlyAlerts.length} open early alert(s) — check resolution status.`);
  if (s.athleticsRecord?.eligibilityStatus === "at_risk")
    points.push(`Athletic eligibility at risk in ${s.athleticsRecord.sport} — coordinate with the FAR.`);
  for (const ins of s.predictiveInsights.slice(0, 2)) points.push(ins.title);

  if (points.length === 0) points.push(`${name} is on track — check in on goals and any emerging interests.`);

  const last = s.advisingRecords[0];
  return {
    headline: points[0],
    talkingPoints: points.slice(0, 5),
    sinceLastMeeting: last
      ? `Last met ${new Date(last.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. ${last.noteText ?? ""}`.trim()
      : "No prior advising meeting on record — this may be a first meeting.",
    source: "rules",
  };
}
