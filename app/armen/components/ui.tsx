"use client";

import { C } from "../lib/types";
import { getPeriodTime } from "../data/periodTimes";

// ─── Nav header — sticky top bar with back button used on Results + Detail screens ───

export function NavHeader({
  onBack,
  label,
  title,
}: {
  onBack: () => void;
  label: string;
  title: string;
}) {
  return (
    <div
      className="px-5 py-4 flex items-center gap-3 sticky top-0 z-10"
      style={{ backgroundColor: C.navyBg, borderBottom: `1px solid ${C.navyBorder}` }}
    >
      <button
        onClick={onBack}
        className="p-1 -ml-1 rounded-lg transition-colors"
        style={{ color: C.softText }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
        onMouseLeave={(e) => (e.currentTarget.style.color = C.softText)}
        aria-label="Back"
      >
        <ChevronLeft />
      </button>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: C.softText }}>
          {label}
        </p>
        <p className="text-base font-bold text-white truncate">{title}</p>
      </div>
    </div>
  );
}

// ─── Section label — small uppercase gray heading between content blocks ───

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: C.mutedText }}>
      {children}
    </h2>
  );
}

// ─── Info card — centered empty-state message (e.g. "No school today") ───

export function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border px-5 py-6 text-center text-sm"
      style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, color: C.mutedText }}
    >
      {children}
    </div>
  );
}

// ─── Period badge — small navy square showing a period letter (e.g. "B") ───

export function PeriodBadge({ period }: { period: string }) {
  return (
    <span
      className="font-bold text-xs w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
      style={{ backgroundColor: C.navyBg }}
    >
      {period}
    </span>
  );
}

// ─── Free period chip — gold pill showing period letter + time on the home screen ───

export function FreePeriodChip({ period, cycleDay }: { period: string; cycleDay: string }) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 rounded-xl border px-2.5 py-2"
      style={{ backgroundColor: C.goldLight, borderColor: C.goldBorder }}
    >
      <span className="text-sm font-bold" style={{ color: C.navyText }}>{period}</span>
      <span className="text-xs font-medium tabular-nums" style={{ color: "#7A6010" }}>
        {getPeriodTime(period, cycleDay)}
      </span>
    </div>
  );
}

// ─── CGPS logo mark — serif "C" + bold "GPS" with blue underline ───

export function CGPSMark({ small = false }: { small?: boolean }) {
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-baseline leading-none">
        <span className="font-serif text-white" style={{ fontSize: small ? "1.5rem" : "2.4rem", lineHeight: 1 }}>
          C
        </span>
        <span className="font-bold text-white tracking-tight" style={{ fontSize: small ? "1.2rem" : "1.9rem", lineHeight: 1 }}>
          GPS
        </span>
      </div>
      <div
        className="rounded-full"
        style={{ height: "3px", width: small ? "18px" : "24px", marginTop: "3px", backgroundColor: C.accentBlue }}
      />
    </div>
  );
}

// ─── Icons ───

export function ChevronRight({ color = "#6B7280" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

export function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4L6 8l4 4" />
    </svg>
  );
}
