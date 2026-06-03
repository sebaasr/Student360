"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { yearLabel } from "@/lib/utils";

interface Item {
  id: string;
  name: string;
  yearLevel: number;
  aoc: string | null;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey
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

  // Load roster once when first opened
  useEffect(() => {
    if (open && !loaded) {
      fetch("/api/roster")
        .then((r) => r.json())
        .then((d) => {
          setItems(
            (d.students ?? []).map((s: { id: string; name: string; yearLevel: number; aoc: string | null }) => ({
              id: s.id, name: s.name, yearLevel: s.yearLevel, aoc: s.aoc,
            })),
          );
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    if (!open) { setQuery(""); setActive(0); }
  }, [open, loaded]);

  const filtered = query.trim()
    ? items.filter((i) =>
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.id.toLowerCase().includes(query.toLowerCase()) ||
        (i.aoc ?? "").toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  const go = useCallback((id: string) => {
    setOpen(false);
    router.push(`/student/${id}`);
  }, [router]);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && filtered[active]) { e.preventDefault(); go(filtered[active].id); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center pt-[15vh] px-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 border-b border-gray-100">
          <span className="text-gray-400 text-sm">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onInputKey}
            placeholder="Jump to a student by name, ID, or AOC…"
            className="flex-1 py-3.5 text-sm outline-none"
          />
          <kbd className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {!loaded ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Loading roster…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No students found.</div>
          ) : (
            filtered.slice(0, 30).map((i, idx) => (
              <button
                key={i.id}
                onMouseEnter={() => setActive(idx)}
                onClick={() => go(i.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left ${idx === active ? "bg-navy/5" : ""}`}
              >
                <Avatar name={i.name} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-navy truncate">{i.name}</div>
                  <div className="text-[11px] text-gray-400 truncate">
                    {i.id} · {yearLabel(i.yearLevel)}{i.aoc ? ` · ${i.aoc}` : ""}
                  </div>
                </div>
                {idx === active && <kbd className="text-[10px] text-gray-400">↵</kbd>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
