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
    <main className="min-h-screen flex items-center justify-center bg-navy p-4 relative overflow-hidden">
      {/* subtle background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "radial-gradient(circle at 25% 25%, #B3A369 0%, transparent 50%), radial-gradient(circle at 75% 75%, #B3A369 0%, transparent 50%)" }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center mb-4">
            <img src="/ncf-shield.png" alt="New College of Florida" className="w-16 h-16 object-contain brightness-0 invert" />
          </div>
          <h1 className="text-white text-2xl font-serif font-bold tracking-wide">Student 360</h1>
          <p className="text-gold text-xs uppercase tracking-[0.2em] mt-1 font-medium">
            New College of Florida
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-navy via-navy/60 to-gold" />
          <div className="p-8">
            <p className="text-sm text-gray-600 mb-6 text-center">
              Sign in with your NCF credentials to access the advising dashboard.
            </p>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {error === "CredentialsSignin"
                  ? "Email not recognized. Make sure it matches a seeded user."
                  : `Sign-in error: ${error}`}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  NCF Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@ncf.edu"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-navy focus:border-navy outline-none transition-shadow"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-navy text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-navy-dark transition-colors disabled:opacity-60"
              >
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                Production uses NCF Single Sign-On via Microsoft Entra.
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Dev accounts</p>
                {[
                  { email: "mlopezzafra@ncf.edu", role: "Provost (all students)" },
                  { email: "faculty@ncf.edu", role: "Faculty Advisor" },
                  { email: "itadmin@ncf.edu", role: "IT Admin" },
                ].map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => setEmail(u.email)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] text-gray-500 hover:bg-gray-50 hover:text-navy transition-colors text-left"
                  >
                    <span className="font-mono">{u.email}</span>
                    <span className="text-gray-400">{u.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-navy-light/40 mt-6">
          FERPA-protected · Access is logged · For authorized NCF staff only
        </p>
      </div>
    </main>
  );
}
