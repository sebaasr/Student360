"use client";

import { useState, useMemo } from "react";
import { LensBar, type Lens } from "./LensBar";
import { AcademicTimeline } from "./AcademicTimeline";
import { SuggestedCourses } from "./SuggestedCourses";
import { GraduationTracker } from "./GraduationTracker";
import { BrightFuturesCard } from "./BrightFuturesCard";
import { AcademicStandingCard } from "./AcademicStandingCard";
import { ContractCard } from "./ContractCard";
import { AdvisingHistoryCard } from "./AdvisingHistoryCard";
import { MSPRCard } from "./MSPRCard";
import { EvaluationsPanel } from "./EvaluationsPanel";
import { NarrativeEvalsTile } from "./NarrativeEvalsTile";
import { ServiceUsageCard } from "./ServiceUsageCard";
import { AthleticsCard } from "./AthleticsCard";
import { FinancialCard } from "./FinancialCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { coursesForAoc } from "@/lib/ncf-catalog";

interface Props {
  data: any; // payload from /api/student/[id]
}

const CURRENT_TERM_CODE = "202601";

export function ProfileBody({ data }: Props) {
  const [lens, setLens] = useState<Lens>("since_entry");

  // Build sorted term list from semester GPAs
  const availableTerms: { code: string; label: string }[] = useMemo(() => {
    const gpas: { termCode: string; term: string }[] = data.academic?.semesterGpas ?? [];
    const seen = new Set<string>();
    const terms: { code: string; label: string }[] = [];
    for (const g of [...gpas].reverse()) {
      if (!seen.has(g.termCode)) {
        seen.add(g.termCode);
        terms.push({ code: g.termCode, label: g.term });
      }
    }
    if (!seen.has(CURRENT_TERM_CODE))
      terms.unshift({ code: CURRENT_TERM_CODE, label: "Spring 2026 (current)" });
    return terms;
  }, [data.academic?.semesterGpas]);

  const [selectedTerm, setSelectedTerm] = useState<string>(CURRENT_TERM_CODE);

  const allowed: string[] = data.allowedPanels ?? [];
  const has = (panel: string) => allowed.includes(panel);
  const hideLenses: Lens[] = [];
  if (!data.student.isStudentAthlete && !has("athletics")) hideLenses.push("athletics");
  if (!has("financial_flags") && !has("bright_futures")) hideLenses.push("financial");
  if (!has("evaluations")) hideLenses.push("evaluations");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LensBar active={lens} onChange={setLens} hideLenses={hideLenses} />
        {availableTerms.length > 1 && (
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-navy focus:border-navy"
          >
            {availableTerms.map((t) => (
              <option key={t.code} value={t.code}>{t.label}</option>
            ))}
          </select>
        )}
      </div>

      {lens === "since_entry" && <SinceEntryLens data={data} has={has} termCode={selectedTerm} />}
      {lens === "this_semester" && <ThisSemesterLens data={data} has={has} termCode={selectedTerm} />}
      {lens === "next_semester" && <NextSemesterLens data={data} has={has} />}
      {lens === "academic" && <AcademicLens data={data} has={has} termCode={selectedTerm} onLens={setLens} />}
      {lens === "evaluations" && <EvaluationsLens data={data} has={has} />}
      {lens === "athletics" && <AthleticsLens data={data} has={has} />}
      {lens === "financial" && <FinancialLens data={data} has={has} />}
    </div>
  );
}

// Shared athletics props for the NAIA eligibility checklist.
function athleticsProps(data: any) {
  const currentContract = (data.contracts ?? []).find((c: any) => c.termCode === CURRENT_TERM_CODE);
  const gpas: any[] = data.academic?.semesterGpas ?? [];
  const lastTwo = gpas.slice(-2);
  return {
    currentGpa: data.student.cumulativeGpa,
    creditsEarned: data.student.creditsEarned,
    currentTermCredits: currentContract?.totalCredits ?? null,
    hoursPrevTwoTerms: lastTwo.length === 2 ? lastTwo.reduce((s: number, g: any) => s + (g.credits ?? 0), 0) : null,
  };
}

function showAthletics(data: any, has: (p: string) => boolean) {
  return data.student.isStudentAthlete && has("athletics") && data.athletics;
}

// ── SINCE ENTRY (sketch ②) ──────────────────────────────────────────────────
function SinceEntryLens({ data, has }: { data: any; has: (p: string) => boolean; termCode: string }) {
  return (
    <div className="space-y-4">
      {/* Row 1: Graduation Progress | This Semester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {has("graduation_tracker") && data.degreeProgress && (
          <GraduationTracker
            degreeProgress={data.degreeProgress}
            creditsEarned={data.student.creditsEarned}
            yearLevel={data.student.yearLevel}
          />
        )}
        {has("contract") && (
          <ContractCard contracts={currentTermFirst(data)} />
        )}
      </div>

      {/* Row 2: Narratives (access to all) | Advising Notes (Navigate 360) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {has("evaluations") && data.evaluations && (
          <NarrativeEvalsTile studentId={data.student.id} evaluations={data.evaluations} />
        )}
        {(has("advising") || has("advising_limited")) && (
          <AdvisingHistoryCard
            advising={data.advising ?? []}
            earlyAlerts={data.earlyAlerts ?? []}
            noteVisibility={has("advising") ? "full" : "redacted"}
          />
        )}
      </div>

      {/* Row 3: SSC / Tutoring / Writing Program | MSPR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(has("tutoring") || has("ssc")) && (
          <ServiceUsageCard
            tutoring={data.tutoring ?? []}
            sscVisits={data.sscVisits ?? []}
            academicCoach={data.academicCoach ?? null}
          />
        )}
        {(has("advising") || has("advising_limited")) && <MSPRCard msprs={data.msprs ?? []} />}
      </div>

      {/* Row 4: GPA | Bright Futures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {has("academic") && data.academic && <AcademicStandingCard {...data.academic} />}
        {has("bright_futures") && data.brightFutures && (
          <BrightFuturesCard status={data.brightFutures} />
        )}
      </div>

      {/* Athletic info (if certified student-athlete) */}
      {showAthletics(data, has) && (
        <AthleticsCard athletics={data.athletics} {...athleticsProps(data)} />
      )}
    </div>
  );
}

// ── THIS SEMESTER (sketch ③) ─────────────────────────────────────────────────
function ThisSemesterLens({ data, has, termCode }: { data: any; has: (p: string) => boolean; termCode: string }) {
  const tutoringThis = (data.tutoring ?? []).filter((t: any) => t.termCode === termCode);
  const sscThis = (data.sscVisits ?? []).filter((v: any) => v.termCode === termCode);
  const advThis = (data.advising ?? []).filter(
    (a: any) => new Date(a.appointmentDate) >= startOfTerm(termCode),
  );

  return (
    <div className="space-y-4">
      {/* Current Semester | Advising Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {has("contract") && <ContractCard contracts={currentTermFirst(data, termCode)} />}
        {(has("advising") || has("advising_limited")) && (
          <AdvisingHistoryCard
            advising={advThis}
            earlyAlerts={data.earlyAlerts ?? []}
            noteVisibility={has("advising") ? "full" : "redacted"}
          />
        )}
      </div>

      {/* MSPR | SSC / Tutoring / Writing Program */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(has("advising") || has("advising_limited")) && <MSPRCard msprs={data.msprs ?? []} />}
        {(has("tutoring") || has("ssc")) && (
          <ServiceUsageCard tutoring={tutoringThis} sscVisits={sscThis} academicCoach={data.academicCoach ?? null} />
        )}
      </div>

      {/* Athletic eligibility (if athlete) */}
      {showAthletics(data, has) && (
        <AthleticsCard athletics={data.athletics} {...athleticsProps(data)} />
      )}
    </div>
  );
}

// ── NEXT SEMESTER (sketch ④) ─────────────────────────────────────────────────
function NextSemesterLens({ data, has }: { data: any; has: (p: string) => boolean }) {
  return (
    <div className="space-y-4">
      {/* Academic timeline */}
      {data.timeline && (
        <AcademicTimeline
          rows={data.timeline}
          currentTermCode={CURRENT_TERM_CODE}
          note="Student path since entry — for planning context."
        />
      )}

      {/* This Semester | Next Semester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {has("contract") && <ContractCard contracts={currentTermFirst(data)} />}
        <NextSemesterTile suggestedCount={data.suggestedCourses?.length ?? 0} />
      </div>

      {/* Suggested courses next semester */}
      {has("graduation_tracker") && data.suggestedCourses?.length > 0 && (
        <SuggestedCourses courses={data.suggestedCourses} />
      )}

      {/* Next semester offerings (catalog — for advising reference) */}
      <NextSemesterOfferings aoc={data.student.declaredAoc} />
    </div>
  );
}

// ── ACADEMIC (sketch ⑤) ──────────────────────────────────────────────────────
function AcademicLens({ data, has, onLens }: { data: any; has: (p: string) => boolean; termCode: string; onLens: (l: Lens) => void }) {
  return (
    <div className="space-y-4">
      {/* Academic timeline */}
      {data.timeline && (
        <AcademicTimeline
          rows={data.timeline}
          currentTermCode={CURRENT_TERM_CODE}
          note="Engagement since entry — term GPAs, narratives, and ISP milestones."
        />
      )}

      {/* Grad Progress | GPA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {has("graduation_tracker") && data.degreeProgress && (
          <GraduationTracker
            degreeProgress={data.degreeProgress}
            creditsEarned={data.student.creditsEarned}
            yearLevel={data.student.yearLevel}
            onOpenSinceEntry={() => onLens("since_entry")}
          />
        )}
        {has("academic") && data.academic && <AcademicStandingCard {...data.academic} />}
      </div>

      {/* Senior Thesis */}
      {has("graduation_tracker") && data.degreeProgress && (
        <SeniorThesisTile dp={data.degreeProgress} />
      )}
    </div>
  );
}

// ── small tiles ──────────────────────────────────────────────────────────────
function currentTermFirst(data: any, termCode: string = CURRENT_TERM_CODE) {
  const current = (data.contracts ?? []).filter((c: any) => c.termCode === termCode);
  return current.length > 0 ? current : data.contracts ?? [];
}

const THESIS_STEPS = ["not_started", "sponsor_identified", "in_progress", "submitted", "approved"];
const THESIS_LABEL: Record<string, string> = {
  not_started: "Not started",
  sponsor_identified: "Sponsor identified",
  in_progress: "In progress",
  submitted: "Submitted",
  approved: "Approved",
};
function SeniorThesisTile({ dp }: { dp: any }) {
  const status = dp.thesisStatus ?? "not_started";
  const idx = Math.max(0, THESIS_STEPS.indexOf(status));
  const variant = status === "not_started" ? "red" : status === "approved" || status === "submitted" ? "green" : "amber";
  return (
    <Card title="Senior Thesis" footer="Source: DegreeWorks">
      <div className="flex items-center justify-between mb-3">
        <Badge variant={variant as "red" | "green" | "amber"}>{THESIS_LABEL[status] ?? status}</Badge>
        <span className="text-xs text-gray-500">
          {dp.thesisSponsor ? `Sponsor: ${dp.thesisSponsor}` : "No sponsor identified"}
        </span>
      </div>
      {/* Step tracker */}
      <div className="flex items-center gap-1">
        {THESIS_STEPS.map((step, i) => (
          <div key={step} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-1.5 rounded-full ${i <= idx ? "bg-navy" : "bg-gray-200"}`} />
            <span className={`text-[9px] text-center leading-tight ${i <= idx ? "text-navy font-medium" : "text-gray-400"}`}>
              {THESIS_LABEL[step]}
            </span>
          </div>
        ))}
      </div>
      {status === "not_started" && (
        <p className="text-[11px] text-amber-700 mt-3">
          Thesis not yet started — for seniors this should be a priority advising topic.
        </p>
      )}
    </Card>
  );
}

function NextSemesterTile({ suggestedCount }: { suggestedCount: number }) {
  return (
    <Card title="Next Semester" footer="Planning view">
      <div className="text-sm text-gray-700 space-y-2">
        <p>Next-term registration is not yet finalized in Banner.</p>
        <p className="text-xs text-gray-500">
          {suggestedCount > 0
            ? `${suggestedCount} suggested course${suggestedCount > 1 ? "s" : ""} below, based on remaining requirements.`
            : "Course suggestions appear once DegreeWorks shows requirement gaps."}
        </p>
      </div>
    </Card>
  );
}

function NextSemesterOfferings({ aoc }: { aoc: string | null }) {
  const offerings = coursesForAoc(aoc);
  return (
    <Card title="Next Semester Offerings" footer="Source: NCF Catalog 2025-26 · for advising reference">
      {offerings.length === 0 ? (
        <p className="text-sm text-gray-500">Declare an AOC to see relevant course offerings.</p>
      ) : (
        <>
          <p className="text-[11px] text-gray-500 mb-2">
            Courses in the student&apos;s area of concentration — access to offerings for advising purposes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {offerings.map((c) => (
              <div key={c.code} className="flex items-baseline gap-2 text-xs py-1 border-b border-gray-50">
                <span className="font-mono text-gray-400 shrink-0">{c.code}</span>
                <span className="text-gray-800 truncate">{c.title}</span>
                <span className="ml-auto text-[10px] text-gray-400 capitalize">{c.level}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function EvaluationsLens({ data, has }: { data: any; has: (p: string) => boolean }) {
  if (!has("evaluations")) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500 text-sm">
        Narrative evaluations are not available at your access level.
      </div>
    );
  }
  return (
    <EvaluationsPanel
      evaluations={data.evaluations ?? []}
      studentAoc={data.student.declaredAoc}
    />
  );
}


function AthleticsLens({ data, has }: { data: any; has: (p: string) => boolean }) {
  if (!data.student.isStudentAthlete) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500 text-sm">
        This student is not a certified student-athlete.
      </div>
    );
  }
  if (!has("athletics") || !data.athletics) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500 text-sm">
        Athletics eligibility data not available at your access level.
      </div>
    );
  }
  // NAIA progress inputs: current-term credit load + hours in the last two terms
  const currentContract = (data.contracts ?? []).find((c: any) => c.termCode === CURRENT_TERM_CODE);
  const gpas: any[] = data.academic?.semesterGpas ?? [];
  const lastTwo = gpas.slice(-2);
  const hoursPrevTwoTerms = lastTwo.reduce((sum: number, g: any) => sum + (g.credits ?? 0), 0);

  return (
    <AthleticsCard
      athletics={data.athletics}
      currentGpa={data.student.cumulativeGpa}
      creditsEarned={data.student.creditsEarned}
      currentTermCredits={currentContract?.totalCredits ?? null}
      hoursPrevTwoTerms={lastTwo.length === 2 ? hoursPrevTwoTerms : null}
    />
  );
}

function FinancialLens({ data, has }: { data: any; has: (p: string) => boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {has("bright_futures") && data.brightFutures && (
        <BrightFuturesCard status={data.brightFutures} />
      )}
      {has("financial_flags") && data.financialFlags && (
        <FinancialCard flags={data.financialFlags} />
      )}
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────

function yearLabel(level: number): string {
  return ["", "First-Year", "Sophomore", "Junior", "Senior"][level] ?? "Unknown";
}

function startOfTerm(termCode: string): Date {
  const year = parseInt(termCode.slice(0, 4), 10);
  const month = parseInt(termCode.slice(4, 6), 10);
  return new Date(year, month - 1, 1);
}
