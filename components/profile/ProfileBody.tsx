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
      {lens === "academic" && <AcademicLens data={data} has={has} termCode={selectedTerm} />}
      {lens === "advising" && <AdvisingLens data={data} has={has} termCode={selectedTerm} />}
      {lens === "athletics" && <AthleticsLens data={data} has={has} />}
      {lens === "financial" && <FinancialLens data={data} has={has} />}
    </div>
  );
}

function SinceEntryLens({ data, has, termCode }: { data: any; has: (p: string) => boolean; termCode: string }) {
  const currentContracts = (data.contracts ?? []).filter(
    (c: any) => c.termCode === termCode,
  );

  return (
    <div className="space-y-4">
      {/* Predictive insights — full width, first thing the advisor sees */}
      {has("predictive") && data.predictiveInsights?.length > 0 && (
        <PredictiveInsightsPanel
          studentId={data.student.id}
          insights={data.predictiveInsights}
        />
      )}

      {/* Row 1: Academic Standing | Contract | Degree Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {has("academic") && data.academic && (
          <AcademicStandingCard {...data.academic} />
        )}
        {has("contract") && (
          <ContractCard
            contracts={currentContracts.length > 0 ? currentContracts : data.contracts ?? []}
          />
        )}
        {has("graduation_tracker") && data.degreeProgress && (
          <DegreeProgressCard dp={data.degreeProgress} />
        )}
      </div>

      {/* Row 2: Advising History | Most Recent Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(has("advising") || has("advising_limited")) && (
          <AdvisingHistoryCard
            advising={data.advising ?? []}
            earlyAlerts={data.earlyAlerts ?? []}
            noteVisibility={has("advising") ? "full" : "redacted"}
          />
        )}
        {has("evaluations") && data.evaluations && (
          <EvaluationsCard evaluations={data.evaluations.slice(0, 1)} />
        )}
      </div>

      {/* Row 3: Graduation tracker bars (full width) */}
      {has("graduation_tracker") && data.degreeProgress && (
        <GraduationTracker
          degreeProgress={data.degreeProgress}
          creditsEarned={data.student.creditsEarned}
          yearLevel={data.student.yearLevel}
        />
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

function AcademicLens({ data, has, termCode: _termCode }: { data: any; has: (p: string) => boolean; termCode: string }) {
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
