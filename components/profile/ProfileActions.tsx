"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  studentId: string;
  studentEmail: string;
  studentName: string;
}

export function ProfileActions({ studentId, studentEmail, studentName }: Props) {
  const [modal, setModal] = useState<null | "note" | "prep">(null);

  return (
    <>
      <div className="flex gap-2 print:hidden">
        <a
          href={`mailto:${studentEmail}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Email Student
        </a>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Print / PDF
        </button>
        <button
          onClick={() => setModal("prep")}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gold/40 bg-gold-light text-gold-dark hover:bg-gold/20 transition-colors"
        >
          Prep for Meeting
        </button>
        <button
          onClick={() => setModal("note")}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-navy text-white hover:bg-navy-dark transition-colors"
        >
          Log Meeting Note
        </button>
      </div>

      {modal === "note" && (
        <LogNoteModal
          studentId={studentId}
          studentName={studentName}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "prep" && (
        <MeetingPrepModal
          studentId={studentId}
          studentName={studentName}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── Log Note Modal ──────────────────────────────────────────────────────────
function LogNoteModal({
  studentId,
  studentName,
  onClose,
}: {
  studentId: string;
  studentName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [meetingType, setMeetingType] = useState("in_person");
  const [outcome, setOutcome] = useState("met");
  const [duration, setDuration] = useState(30);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/student/${studentId}/advising`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingType, outcome, duration, noteText }),
    });
    if (res.ok) {
      onClose();
      router.refresh();
    } else {
      setError("Could not save note. Check your access level and try again.");
      setSaving(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-lg font-serif font-bold text-navy">Log Meeting Note</h3>
        <p className="text-xs text-gray-500 mt-0.5">{studentName}</p>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Type">
            <select value={meetingType} onChange={(e) => setMeetingType(e.target.value)} className={selectCls}>
              <option value="in_person">In person</option>
              <option value="virtual">Virtual</option>
              <option value="phone">Phone</option>
            </select>
          </Field>
          <Field label="Outcome">
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className={selectCls}>
              <option value="met">Met</option>
              <option value="no_show">No-show</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
          <Field label="Minutes">
            <input
              type="number"
              value={duration}
              min={5}
              step={5}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={selectCls}
            />
          </Field>
        </div>
        <Field label="Note">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={5}
            placeholder="What did you discuss? Any follow-up items?"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy resize-none"
          />
        </Field>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/60">
        <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg text-gray-600 hover:bg-gray-100">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-1.5 text-sm rounded-lg bg-navy text-white hover:bg-navy-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save note"}
        </button>
      </div>
    </Overlay>
  );
}

// ── Meeting Prep Modal ──────────────────────────────────────────────────────
interface BriefData {
  headline: string;
  talkingPoints: string[];
  sinceLastMeeting: string;
  source: "ai" | "rules";
}

function MeetingPrepModal({
  studentId,
  studentName,
  onClose,
}: {
  studentId: string;
  studentName: string;
  onClose: () => void;
}) {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);

  if (loading && brief === null) {
    fetch(`/api/student/${studentId}/brief`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => { setBrief(d); setLoading(false); })
      .catch(() => setLoading(false));
  }

  return (
    <Overlay onClose={onClose}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-serif font-bold text-navy">Meeting Prep</h3>
          <p className="text-xs text-gray-500 mt-0.5">{studentName}</p>
        </div>
        {brief && (
          <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">
            {brief.source === "ai" ? "AI-generated" : "Rule-based"}
          </span>
        )}
      </div>
      <div className="p-5 space-y-4 min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
            <p className="text-sm">Preparing your brief…</p>
          </div>
        ) : brief ? (
          <>
            <div className="bg-navy text-white rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-widest text-gold font-bold mb-1">
                Most important
              </div>
              <p className="text-sm font-medium">{brief.headline}</p>
            </div>
            <div>
              <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Talking points
              </div>
              <ul className="space-y-2">
                {brief.talkingPoints.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-800">
                    <span className="text-gold font-bold">{i + 1}.</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Since last meeting
              </div>
              <p className="text-sm text-gray-600">{brief.sinceLastMeeting}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center py-10">Could not generate a brief.</p>
        )}
      </div>
      <div className="px-5 py-3 border-t border-gray-100 flex justify-end bg-gray-50/60">
        <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg bg-navy text-white hover:bg-navy-dark">
          Done
        </button>
      </div>
    </Overlay>
  );
}

// ── shared ──────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const selectCls =
  "w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy";
