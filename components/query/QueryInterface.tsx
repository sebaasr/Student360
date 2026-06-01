"use client";

import { useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";

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
];

export function QueryInterface() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    setLoading(true);
    setError(null);
    setResult(null);
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
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) ask(question);
        }}
        className="bg-white rounded-xl border border-gray-200 p-4"
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ask a question about your advisees
        </label>
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Which seniors don't have a thesis sponsor?"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
          />
          <button
            type="submit"
            disabled={loading || question.trim().length < 3}
            className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-dark disabled:opacity-50"
          >
            {loading ? <Spinner /> : "Ask"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuestion(s);
                ask(s);
              }}
              className="text-[11px] px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-700">{result.summary}</div>
          <div className="text-[11px] text-gray-400 mt-1">
            Intent: {result.intent} · {result.studentCount} matches
          </div>
          <div className="mt-3 space-y-1">
            {result.students.map((s) => (
              <Link
                key={s.id}
                href={`/student/${s.id}`}
                className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-1 rounded"
              >
                <span className="font-medium text-navy">{s.name}</span>
                <span className="text-xs text-gray-500">{s.reason}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
