"use client";

import type { Student } from "../data/parseSchedule";
import { C } from "../lib/types";
import {
  getFirstName,
  formatDisplayDate,
  initials,
  getScheduleForDay,
  getFreePeriodsByDay,
  getSearchableClasses,
} from "../lib/helpers";
import { useAuth } from "@/context/AuthContext";
import {
  CGPSMark,
  SectionLabel,
  InfoCard,
  PeriodBadge,
  FreePeriodChip,
  ChevronRight,
} from "../components/ui";

interface Props {
  currentStudent: Student;
  optedIn: boolean;
  cycleDay: string | null;
  todayKey: string;
  onSelectClass: (cls: string) => void;
  onToggleOptIn: () => void;
  onSignOut: () => void;
}

export default function HomeScreen({
  currentStudent,
  optedIn,
  cycleDay,
  todayKey,
  onSelectClass,
  onToggleOptIn,
  onSignOut,
}: Props) {
  const { user } = useAuth();
  const firstName = getFirstName(currentStudent.name);
  const displayDate = formatDisplayDate(todayKey);
  const scheduleItems = cycleDay ? getScheduleForDay(currentStudent, cycleDay) : [];
  const freePeriods = cycleDay ? getFreePeriodsByDay(currentStudent, cycleDay) : [];
  const searchableClasses = getSearchableClasses(currentStudent);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.pageBg }}>

      {/* ── Nav bar ── */}
      <div
        className="px-5 py-3 flex items-center justify-between sticky top-0 z-10"
        style={{ backgroundColor: C.navyBg, borderBottom: `1px solid ${C.navyBorder}` }}
      >
        <CGPSMark small />

        <div className="flex items-center gap-3">
          {/* Visible / Hidden pill */}
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full hidden sm:block"
            style={{
              backgroundColor: optedIn ? "#1A3A1A" : C.navyBorder,
              color: optedIn ? C.gold : C.softText,
            }}
          >
            {optedIn ? "Visible" : "Hidden"}
          </span>

          {/* Google profile photo or initials fallback */}
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
              style={{ outline: `2px solid ${C.navyBorder}` }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: C.cgpsBlue }}
            >
              {initials(currentStudent.name)}
            </div>
          )}

          <p className="text-sm font-semibold text-white hidden sm:block">
            {user?.displayName ?? firstName}
          </p>

          <button
            onClick={onSignOut}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
            style={{ color: C.softText, borderColor: C.navyBorder }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = C.navyBorder;
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = C.softText;
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 px-5 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full pb-16">

        {/* Date + cycle day */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: C.mutedText }}>
              Today
            </p>
            <p className="text-xl font-bold" style={{ color: C.navyText }}>{displayDate}</p>
          </div>
          {cycleDay ? (
            <span className="font-bold text-sm px-4 py-2 rounded-xl text-white" style={{ backgroundColor: C.navyBg }}>
              {cycleDay}
            </span>
          ) : (
            <span className="text-sm px-4 py-2 rounded-xl" style={{ backgroundColor: C.cardBorder, color: C.mutedText }}>
              No School
            </span>
          )}
        </div>

        {/* Today's schedule */}
        <section>
          <SectionLabel>{cycleDay ? `Schedule · ${cycleDay}` : "Schedule"}</SectionLabel>
          {!cycleDay ? (
            <InfoCard>No school today — enjoy the break!</InfoCard>
          ) : scheduleItems.length === 0 ? (
            <InfoCard>No classes scheduled.</InfoCard>
          ) : (
            <div className="rounded-2xl overflow-hidden border" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder }}>
              {scheduleItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 px-4 py-3"
                  style={{ borderTop: i > 0 ? `1px solid ${C.cardBorder}` : "none" }}
                >
                  <div className="flex gap-1 mt-0.5 shrink-0">
                    {item.periods.map((p) => <PeriodBadge key={p} period={p} />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight" style={{ color: C.navyText }}>
                      {item.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: C.mutedText }}>
                      {item.teacher}{item.room && ` · ${item.room}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Free periods today */}
        {cycleDay && (
          <section>
            <SectionLabel>Free Periods Today</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {freePeriods.length === 0 ? (
                <span className="text-sm" style={{ color: C.mutedText }}>No free periods today</span>
              ) : (
                freePeriods.map((p) => <FreePeriodChip key={p} period={p} cycleDay={cycleDay} />)
              )}
            </div>
          </section>
        )}

        {/* Study buddy class picker */}
        <section>
          <SectionLabel>Find a Study Buddy</SectionLabel>
          <p className="text-xs mb-3" style={{ color: C.mutedText }}>
            Select a class to find classmates ranked by shared teacher and free periods
          </p>
          <div className="flex flex-col gap-2">
            {searchableClasses.map((cls) => (
              <button
                key={cls.name}
                onClick={() => onSelectClass(cls.name)}
                className="w-full rounded-xl border px-4 py-3 text-left flex items-center justify-between gap-3 transition-all"
                style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.cgpsBlue;
                  e.currentTarget.style.backgroundColor = "#F0F5FC";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.cardBorder;
                  e.currentTarget.style.backgroundColor = C.cardBg;
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate" style={{ color: C.navyText }}>
                    {cls.name}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: C.mutedText }}>{cls.teacher}</p>
                </div>
                <ChevronRight color={C.cgpsBlue} />
              </button>
            ))}
          </div>
        </section>

        {/* Opt-in visibility toggle */}
        <section>
          <div
            className="rounded-2xl border px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder }}
          >
            <div className="min-w-0 pr-4">
              <p className="text-sm font-semibold" style={{ color: C.navyText }}>Study Buddies visibility</p>
              <p className="text-xs mt-0.5" style={{ color: C.mutedText }}>
                {optedIn ? "You appear in other students' search results" : "You are hidden from search results"}
              </p>
            </div>
            <button
              onClick={onToggleOptIn}
              className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
              style={{ backgroundColor: optedIn ? C.gold : C.cardBorder }}
              aria-label="Toggle Study Buddies visibility"
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: optedIn ? "translateX(24px)" : "translateX(4px)" }}
              />
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
