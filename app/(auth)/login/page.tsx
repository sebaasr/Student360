"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const params = useSearchParams();
  const error = params.get("error");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await signIn("dev-credentials", { email, callbackUrl: "/roster" });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-navy to-navy-dark p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy">Student 360</h1>
          <p className="text-sm text-gray-500 mt-1">New College of Florida · Advising Dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            Sign-in failed: {error === "CredentialsSignin" ? "email not recognized" : error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NCF email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@ncf.edu"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-navy text-white py-2 rounded-lg hover:bg-navy-dark transition disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-[11px] text-gray-400 border-t border-gray-100 pt-4">
          Dev mode: enter a seeded user email (e.g. <code>mlopezzafra@ncf.edu</code>). Production
          uses NCF SSO via Microsoft Entra.
        </div>
      </div>
    </main>
  );
}
