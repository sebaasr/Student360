"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { yearLabel } from "@/lib/utils";

interface Item {
  id: string;
  name: string;
  yearLevel: number;
  aoc: string | null;
}

const MAX_RESULTS = 50;

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Track whether the last navigation was keyboard, so the mouse doesn't fight it.
  const usingKeyboard = useRef(false);

  // ── Global hotkey + open event ──────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpenEvent() { setOpen(true); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpenEvent);
    };
  }, []);

  // ── Load roster on first open ───────────────────────────────────────
  useEffect(() => {
    if (open && !loaded) {
      fetch("/api/roster")
        .then((r) => r.json())
        .then((d) => {
          setItems(
            (d.students ?? []).map((s: Item) => ({
              id: s.id, name: s.name, yearLevel: s.yearLevel, aoc: s.aoc,
            })),
          );
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    }
  }, [open, loaded]);

  // ── Focus input + lock body scroll while open ───────────────────────
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        document.body.style.overflow = prevOverflow;
      };
    } else {
      // reset on close
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.id.toLowerCase().includes(q) ||
            (i.aoc ?? "").toLowerCase().includes(q),
        )
      : items;
    return list.slice(0, MAX_RESULTS);
  }, [items, query]);

  // Keep the active index in range whenever results change.
  useEffect(() => {
    setActive((a) => (a >= results.length ? 0 : a));
  }, [results.length]);

  // Scroll the active row into view when navigating by keyboard.
  useEffect(() => {
    if (usingKeyboard.current) {
      itemRefs.current[active]?.scrollIntoView({ block: "nearest" });
    }
  }, [active]);

  const go = useCallback((id: string) => {
    setOpen(false);
    router.push(`/student/${id}`);
  }, [router]);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      usingKeyboard.current = true;
      setActive((a) => (a + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      usingKeyboard.current = true;
      setActive((a) => (a - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) go(results[active].id);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center pt-[14vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-gray-100">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); usingKeyboard.current = false; }}
            onKeyDown={onInputKey}
            placeholder="Search a student by name, ID, or AOC…"
            className="flex-1 py-3.5 text-sm outline-none placeholder:text-gray-400"
          />
          {query && (
            <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="text-gray-300 hover:text-gray-500 text-lg leading-none">
              ×
            </button>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[22rem] overflow-y-auto py-1.5">
          {!loaded ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Loading roster…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              {query ? `No students match “${query}”.` : "No students on your roster."}
            </div>
          ) : (
            results.map((i, idx) => (
              <button
                key={i.id}
                ref={(el) => { itemRefs.current[idx] = el; }}
                onMouseMove={() => { usingKeyboard.current = false; setActive(idx); }}
                onClick={() => go(i.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                  idx === active ? "bg-navy/[0.06]" : ""
                }`}
              >
                <Avatar name={i.name} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-navy truncate">{i.name}</div>
                  <div className="text-[11px] text-gray-400 truncate">
                    <span className="font-mono">{i.id}</span> · {yearLabel(i.yearLevel)}
                    {i.aoc ? ` · ${i.aoc}` : ""}
                  </div>
                </div>
                {idx === active && (
                  <span className="text-[10px] text-navy/50 font-medium shrink-0">Open ↵</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50/70 text-[10.5px] text-gray-400">
          <div className="flex items-center gap-3">
            <span><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
            <span><Kbd>↵</Kbd> open</span>
            <span><Kbd>esc</Kbd> close</span>
          </div>
          {loaded && (
            <span>{results.length}{items.length > results.length ? `+` : ""} result{results.length === 1 ? "" : "s"}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 mx-0.5 bg-white border border-gray-200 rounded text-[9px] text-gray-500">
      {children}
    </kbd>
  );
}
