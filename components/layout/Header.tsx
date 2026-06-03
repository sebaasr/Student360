"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { TIER_LABELS, TIER_SEES_ALL } from "@/lib/rbac";
import { CommandPalette } from "./CommandPalette";

interface NavTab {
  href: string;
  label: string;
  // Lowest tier that may see this tab.
  minTier?: number;
  // Tabs that require "sees all students" rather than a tier number.
  requiresSeesAll?: boolean;
}

const TABS: NavTab[] = [
  { href: "/roster", label: "My advisees" },
  { href: "/students", label: "All students", requiresSeesAll: true },
  { href: "/cohorts", label: "Cohorts", minTier: 7 },
  { href: "/reports", label: "Reports", minTier: 7 },
];

export function Header() {
  const pathname = usePathname() ?? "";
  const { data: session } = useSession();
  const tier = session?.user?.accessTier ?? 0;
  const visibleTabs = TABS.filter((t) => {
    if (t.requiresSeesAll) return TIER_SEES_ALL[tier] ?? false;
    if (t.minTier !== undefined) return tier >= t.minTier;
    return true;
  });

  return (
    <header className="bg-navy text-white border-b-4 border-gold">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        <Link href="/roster" className="flex items-center gap-3 shrink-0">
          <img
            src="/ncf-shield.png"
            alt="New College of Florida"
            className="w-8 h-8 object-contain brightness-0 invert"
          />
          <div className="leading-tight">
            <div className="text-base font-serif font-bold tracking-wide">Student 360</div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-gray-300">
              New College of Florida
            </div>
          </div>
        </Link>

        <nav className="flex-1 flex justify-center gap-1">
          {visibleTabs.map((tab) => {
            const active =
              pathname === tab.href ||
              (tab.href === "/roster" && pathname.startsWith("/student"));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2 rounded-md text-sm transition relative ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute left-3 right-3 -bottom-[7px] h-0.5 bg-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        {session?.user && (
          <div className="flex items-center gap-3 shrink-0">
            <CommandPaletteHint />
            <div className="text-right">
              <div className="text-sm font-medium">{session.user.name}</div>
              <div className="text-[10px] uppercase tracking-wide text-gray-300">
                {TIER_LABELS[tier] ?? "Unknown"}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-gold text-navy flex items-center justify-center text-sm font-bold">
              {initials(session.user.name ?? session.user.email ?? "?")}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-gray-300 hover:text-white"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
      <CommandPalette />
    </header>
  );
}

function initials(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CommandPaletteHint() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
      className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs transition-colors"
      title="Quick jump to a student"
    >
      <span>Search students</span>
      <kbd className="text-[10px] bg-white/15 rounded px-1 py-0.5">⌘K</kbd>
    </button>
  );
}
