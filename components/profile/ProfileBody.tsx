"use client";

import { useState } from "react";
import { LensBar, type Lens } from "./LensBar";
import { AcademicTimeline } from "./AcademicTimeline";
import { OverallProgress } from "./OverallProgress";
import { RequirementCallouts } from "./RequirementCallouts";
import { SuggestedCourses } from "./SuggestedCourses";
import { PredictiveInsightsPanel } from "./PredictiveInsightsPanel";
import { BrightFuturesCard } from "./BrightFuturesCard";
import { AcademicStandingCard } from "./AcademicStandingCard";
import { ContractCard } from "./ContractCard";
import { AdvisingHistoryCard } from "./AdvisingHistoryCard";
import { EvaluationsCard } from "./EvaluationsCard";
import { TutoringCard } from "./TutoringCard";
import { SSCVisitsCard } from "./SSCVisitsCard";
import { AthleticsCard } from "./AthleticsCard";
import { FinancialCard } from "./FinancialCard";
import { DegreeProgressCard } from "./DegreeProgressCard";

interface Props {
  data: any; // payload from /api/student/[id]
}

const CURRENT_TERM_CODE = "202601";

export function ProfileBody({ data }: Props) {
  const [lens, setLens] = useState<Lens>("since_entry");

  const allowed: string[] = data.allowedPanels ?? [];
  const has = (panel: string) => allowed.includes(panel);
  const hideLenses: Lens[] = [];
  if (!data.student.isStudentAthlete && !has("athletics")) hideLenses.push("athletics");
  if (!has("financial_flags") && !has("bright_futures")) hideLenses.push("financial");

  return (
    <div className="space-y-4">
      <LensBar active={lens} onChange={setLens} hideLenses={hideLenses} />

      {lens === "since_entry" && <SinceEntryLens data={data} has={has} />}
      {lens === "this_semester" && <ThisSemesterLens data={data} has={has} />}
      {lens === "academic" && <AcademicLens data={data} has={has} />}
      {lens === "advising" && <AdvisingLens data={data} has={has} />}
      {lens === "athletics" && <AthleticsLens data={data} has={has} />}
      {lens === "financial" && <FinancialLens data={data} has={has} />}
    </div>
  );
}

function SinceEntryLens({ data, has }: { data: any; has: (p: string) => boolean }) {
  return (
    <div className="space-y-4">
      {data.timeline && (
        <AcademicTimeline
          rows={data.timeline}
          currentTermCode={CURRENT_TERM_CODE}
          note="Numbers come from Banner term GPAs and DegreeWorks audit. Missing narratives are flagged amber."
        />
      )}
      {has("graduation_tracker") && data.overallProgress && (
        <OverallProgress
          progress={data.overallProgress}
          expectedGraduation={data.degreeProgress?.projectedGradTerm}
          yearLabel={yearLabel(data.student.yearLevel)}
        />
      )}
      {has("graduation_tracker") && data.requirementCallouts && (
        <RequirementCallouts callouts={data.requirementCallouts} />
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

function ThisSemesterLens({ data, has }: { data: any; has: (p: string) => boolean }) {
  const currentContract = (data.contracts ?? []).filter(
    (c: any) => c.termCode === CURRENT_TERM_CODE,
  );
  const tutoringThis = (data.tutoring ?? []).filter(
    (t: any) => t.termCode === CURRENT_TERM_CODE,
  );
  const sscThis = (data.sscVisits ?? []).filter((v: any) => v.termCode === CURRENT_TERM_CODE);
  const advThis = (data.advising ?? []).filter(
    (a: any) => new Date(a.appointmentDate) >= startOfTerm(CURRENT_TERM_CODE),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {has("predictive") && data.predictiveInsights && (
          <PredictiveInsightsPanel
            studentId={data.student.id}
            insights={data.predictiveInsights}
          />
        )}
        {has("contract") && (
          <ContractCard contracts={currentContract.length > 0 ? currentContract : data.contracts ?? []} />
        )}
        {(has("advising") || has("advising_limited")) && (
          <AdvisingHistoryCard
            advising={advThis}
            earlyAlerts={data.earlyAlerts ?? []}
            noteVisibility={has("advising") ? "full" : "redacted"}
          />
        )}
      </div>
      <div className="space-y-4">
        {has("tutoring") && <TutoringCard sessions={tutoringThis} />}
        {has("ssc") && <SSCVisitsCard visits={sscThis} coach={data.academicCoach ?? null} />}
        {has("bright_futures") && data.brightFutures && (
          <BrightFuturesCard status={data.brightFutures} />
        )}
      </div>
    </div>
  );
}

function AcademicLens({ data, has }: { data: any; has: (p: string) => boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {has("academic") && data.academic && <AcademicStandingCard {...data.academic} />}
        {has("evaluations") && data.evaluations && (
          <EvaluationsCard evaluations={data.evaluations} />
        )}
        {has("graduation_tracker") && data.degreeProgress && (
          <DegreeProgressCard dp={data.degreeProgress} />
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

function AdvisingLens({ data, has }: { data: any; has: (p: string) => boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {(has("advising") || has("advising_limited")) && (
        <AdvisingHistoryCard
          advising={data.advising ?? []}
          earlyAlerts={data.earlyAlerts ?? []}
          noteVisibility={has("advising") ? "full" : "redacted"}
        />
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
  if (!has("athletics") || !data.athletics) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500 text-sm">
        Athletics data not available for this student.
      </div>
    );
  }
  return <AthleticsCard athletics={data.athletics} />;
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
