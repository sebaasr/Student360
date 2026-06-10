"use client";

import { useState, useMemo } from "react";
import { LensBar, type Lens } from "./LensBar";
import { AcademicTimeline } from "./AcademicTimeline";
import { OverallProgress } from "./OverallProgress";
import { RequirementCallouts } from "./RequirementCallouts";
import { SuggestedCourses } from "./SuggestedCourses";
import { GraduationTracker } from "./GraduationTracker";
import { PredictiveInsightsPanel } from "./PredictiveInsightsPanel";
import { BrightFuturesCard } from "./BrightFuturesCard";
import { AcademicStandingCard } from "./AcademicStandingCard";
import { ContractCard } from "./ContractCard";
import { AdvisingHistoryCard } from "./AdvisingHistoryCard";
import { MSPRCard } from "./MSPRCard";
import { EvaluationsCard } from "./EvaluationsCard";
import { EvaluationsPanel } from "./EvaluationsPanel";
import { NarrativeEvalsTile } from "./NarrativeEvalsTile";
import { ServiceUsageCard } from "./ServiceUsageCard";
import { TutoringCard } from "./TutoringCard";
import { SSCVisitsCard } from "./SSCVisitsCard";
import { AthleticsCard } from "./AthleticsCard";
import { FinancialCard } from "./FinancialCard";

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
      {lens === "advising" && <AdvisingLens data={data} has={has} termCode={selectedTerm} />}
      {lens === "athletics" && <AthleticsLens data={data} has={has} />}
      {lens === "financial" && <FinancialLens data={data} has={has} />}
    </div>
  );
}

function SinceEntryLens({ data, has, termCode }: { data: any; has: (p: string) => boolean; termCode: string }) {
  const currentContracts = (data.contracts ?? []).filter((c: any) => c.termCode === termCode);

  return (
    <div className="space-y-4">
      {/* Academic timeline — horizontal, general view of the student's path */}
      {data.timeline && (
        <AcademicTimeline
          rows={data.timeline}
          currentTermCode={CURRENT_TERM_CODE}
          note="Engagement since entry — term GPAs from Banner, narratives from the NCF Evaluations System, ISP milestones from DegreeWorks."
        />
      )}

      {/* Predictive insights — the synthesized "so what" */}
      {has("predictive") && data.predictiveInsights?.length > 0 && (
        <PredictiveInsightsPanel studentId={data.student.id} insights={data.predictiveInsights} />
      )}

      {/* Row 1: Graduation Progress | Current Semester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {has("graduation_tracker") && data.degreeProgress && (
          <GraduationTracker
            degreeProgress={data.degreeProgress}
            creditsEarned={data.student.creditsEarned}
            yearLevel={data.student.yearLevel}
          />
        )}
        {has("contract") && (
          <ContractCard contracts={currentContracts.length > 0 ? currentContracts : data.contracts ?? []} />
        )}
      </div>

      {/* Row 2: Narrative Evaluations (+ AI summary) | GPA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {has("evaluations") && data.evaluations && (
          <NarrativeEvalsTile studentId={data.student.id} evaluations={data.evaluations} />
        )}
        {has("academic") && data.academic && <AcademicStandingCard {...data.academic} />}
      </div>

      {/* Row 3: MSPR | Academic Service Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(has("advising") || has("advising_limited")) && <MSPRCard msprs={data.msprs ?? []} />}
        {(has("tutoring") || has("ssc")) && (
          <ServiceUsageCard
            tutoring={data.tutoring ?? []}
            sscVisits={data.sscVisits ?? []}
            academicCoach={data.academicCoach ?? null}
          />
        )}
      </div>

      {/* Scholarship — moved here from This Semester */}
      {has("bright_futures") && data.brightFutures && (
        <BrightFuturesCard status={data.brightFutures} />
      )}
    </div>
  );
}

function NextSemesterLens({ data, has }: { data: any; has: (p: string) => boolean }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Planning for next semester
        </h3>
        <p className="text-xs text-gray-500">
          Course suggestions are drawn from the NCF Catalog 2025-26, matched to the student&apos;s
          AOC, year level, and remaining requirements.
        </p>
      </div>
      {has("graduation_tracker") && data.suggestedCourses?.length > 0 ? (
        <SuggestedCourses courses={data.suggestedCourses} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">
          No course suggestions yet — they appear once DegreeWorks shows clear requirement gaps.
        </div>
      )}
    </div>
  );
}

function ThisSemesterLens({ data, has, termCode }: { data: any; has: (p: string) => boolean; termCode: string }) {
  const currentContract = (data.contracts ?? []).filter(
    (c: any) => c.termCode === termCode,
  );
  const tutoringThis = (data.tutoring ?? []).filter(
    (t: any) => t.termCode === termCode,
  );
  const sscThis = (data.sscVisits ?? []).filter((v: any) => v.termCode === termCode);
  const advThis = (data.advising ?? []).filter(
    (a: any) => new Date(a.appointmentDate) >= startOfTerm(termCode),
  );

  return (
    <div className="space-y-4">
      {/* Two tiles: current registration/contract (left) | tutoring (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {has("contract") && (
          <ContractCard contracts={currentContract.length > 0 ? currentContract : data.contracts ?? []} />
        )}
        {has("tutoring") && <TutoringCard sessions={tutoringThis} />}
      </div>

      {/* Advising this term | SSC this term */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(has("advising") || has("advising_limited")) && (
          <AdvisingHistoryCard
            advising={advThis}
            earlyAlerts={data.earlyAlerts ?? []}
            noteVisibility={has("advising") ? "full" : "redacted"}
          />
        )}
        {has("ssc") && <SSCVisitsCard visits={sscThis} coach={data.academicCoach ?? null} />}
      </div>
    </div>
  );
}

function AcademicLens({ data, has, termCode: _termCode, onLens }: { data: any; has: (p: string) => boolean; termCode: string; onLens: (l: Lens) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {has("academic") && data.academic && <AcademicStandingCard {...data.academic} />}
        {has("graduation_tracker") && data.degreeProgress && (
          <GraduationTracker
            degreeProgress={data.degreeProgress}
            creditsEarned={data.student.creditsEarned}
            yearLevel={data.student.yearLevel}
            onOpenSinceEntry={() => onLens("since_entry")}
          />
        )}
        {has("evaluations") && data.evaluations && (
          <EvaluationsCard evaluations={data.evaluations} />
        )}
      </div>
      <div className="space-y-4">
        {has("graduation_tracker") && data.suggestedCourses && (
          <SuggestedCourses courses={data.suggestedCourses} />
        )}
        {has("graduation_tracker") && data.requirementCallouts && (
          <div className="grid grid-cols-1 gap-3">
            {data.requirementCallouts.map((c: any) => (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10.5px] uppercase tracking-wide text-gray-500 font-semibold">
                    {c.title}
                  </span>
                  <span className="text-base font-bold text-navy">{c.percent}%</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">{c.subtitle}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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

function AdvisingLens({ data, has, termCode: _termCode }: { data: any; has: (p: string) => boolean; termCode: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {(has("advising") || has("advising_limited")) && (
        <AdvisingHistoryCard
          advising={data.advising ?? []}
          earlyAlerts={data.earlyAlerts ?? []}
          noteVisibility={has("advising") ? "full" : "redacted"}
        />
      )}
      {(has("advising") || has("advising_limited")) && (
        <MSPRCard msprs={data.msprs ?? []} />
      )}
      {has("predictive") && data.predictiveInsights && (
        <PredictiveInsightsPanel
          studentId={data.student.id}
          insights={data.predictiveInsights}
        />
      )}
    </div>
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
