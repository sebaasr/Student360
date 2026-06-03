"use client";

import { useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";

interface Result {
  intent: string;
  studentCount: number;
  students: { id: string; name: string; reason: string }[];
  summary: string;
}

const SUGGESTIONS = [
  "Which seniors don't have a thesis sponsor?",
  "Show me probation students with no tutoring this term",
  "Who's at risk of losing Bright Futures?",
  "Which juniors are close to finishing a minor?",
  "Which student-athletes have eligibility concerns?",
  "Show me students I haven't met with this term",
];

export function QueryInterface() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asked, setAsked] = useState<string | null>(null);

  async function ask(q: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setAsked(q);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error(`Query failed (${res.status})`);
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Search box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) ask(question);
        }}
        className="bg-gradient-to-br from-navy to-navy-dark rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-gold text-lg">✦</span>
          <h2 className="text-white font-serif font-bold text-lg">Ask about your advisees</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything — e.g. Which seniors don't have a thesis sponsor?"
            className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-white/95 focus:bg-white focus:ring-2 focus:ring-gold outline-none"
          />
          <button
            type="submit"
            disabled={loading || question.trim().length < 3}
            className="px-5 py-2.5 bg-gold text-navy font-semibold rounded-lg hover:bg-gold/90 disabled:opacity-50 text-sm"
          >
            {loading ? <Spinner /> : "Ask"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setQuestion(s); ask(s); }}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
          <div className="w-6 h-6 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
          <p className="text-sm">Searching your roster…</p>
        </div>
      )}

      {result && !loading && (
        <div>
          {/* Answer summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-3">
            {asked && <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">You asked</p>}
            {asked && <p className="text-sm text-gray-500 italic mb-2">&ldquo;{asked}&rdquo;</p>}
            <p className="text-base font-medium text-navy">{result.summary}</p>
            <p className="text-[11px] text-gray-400 mt-1">
              {result.studentCount} {result.studentCount === 1 ? "student" : "students"} matched
            </p>
          </div>

          {/* Result cards */}
          {result.students.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400 bg-white rounded-xl border border-gray-200">
              No students matched this query.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.students.map((s) => (
                <Link
                  key={s.id}
                  href={`/student/${s.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 hover:border-navy/40 hover:shadow-sm transition-all"
                >
                  <Avatar name={s.name} size={38} />
                  <div className="min-w-0">
                    <div className="font-semibold text-navy text-sm truncate">{s.name}</div>
                    <div className="text-[11px] text-gray-500 truncate">{s.reason}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
