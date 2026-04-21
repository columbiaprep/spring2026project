// ═══════════════════════════════════════════════════════════════════════════════
// FILE OVERVIEW — StudentHome.tsx
//
//  SECTION                               APPROX. LINES
//  ────────────────────────────────────────────────────
//  "use client" directive + imports          36 –  43
//  TypeScript interfaces & types             45 –  73
//  Brand color tokens  (C object)            75 –  96
//  Constants  (ALL_PERIODS, DAYS)            98 – 104
//  ────────────────────────────────────────────────────
//  Helper functions:                        106 – 273
//    getTodayKey()         build date key   110 – 117
//    formatDisplayDate()   pretty date      119 – 127
//    getFirstName()        name parsing     129 – 133
//    getDisplayName()      name parsing     135 – 139
//    initials()            avatar letters   141 – 149
//    getAllFreePeriods()    free per day     151 – 164
//    getFreePeriodsByDay()  free one day    166 – 174
//    getScheduleForDay()   today's sched    183 – 193
//    getSearchableClasses() filter admin    195 – 204
//    computeSharedFrees()  overlap calc     206 – 218
//    scoreAndTier()        match scoring    220 – 233
//    findMatches()         main algorithm   235 – 273
//  ────────────────────────────────────────────────────
//  Root component  (StudentHome)            275 – 368
//  OptInScreen                              370 – 457
//  HomeScreen                              459 – 692
//  ResultsScreen                           694 – 816
//  DetailScreen                            818 – 960
//  ────────────────────────────────────────────────────
//  Shared layout components:
//    NavHeader                             962 – 1004
//    SectionLabel, InfoCard               1006 – 1029
//    PeriodBadge, FreePeriodChip          1031 – 1059
//    CGPSMark logo                        1062 – 1094
//    ChevronRight, ChevronLeft icons      1096 – 1133
//mail gun 846, button 999
// ═══════════════════════════════════════════════════════════════════════════════

"use client"; // tells Next.js this file runs in the browser, not on the server — required for hooks like useState

import { useMemo, useState } from "react"; // named imports: pull specific exports out of a module — like Python's `from react import useMemo, useState`
import { useRouter } from "next/navigation"; // Next.js router hook for programmatic navigation
import type { Student, ClassEntry } from "../data/parseSchedule"; // `import type` imports only the TypeScript type shape, not actual runtime code
import { cycleDays } from "../data/cycleDays"; // object mapping "YYYY/MM/DD" → cycle day name (e.g. "Day 3")
import { getPeriodTime } from "../data/periodTimes"; // function that returns the time string for a given period letter + day

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

// One day's worth of overlapping free periods between two students.
interface SharedFree {
  day: string;
  periods: string[];
}

// A ranked study-buddy candidate for a specific class.
interface Match {
  student: Student;
  matchedClassName: string;
  currentTeacher: string;
  candidateTeacher: string;
  sameTeacher: boolean;
  sharedFrees: SharedFree[];    // shared free periods, grouped by day
  totalSharedFrees: number;     // sum of all shared free-period slots
  score: number;
  tier: "best" | "good" | "possible" | "fallback";
}

// Discriminated union drives which screen is currently rendered.
type View =
  | { type: "optin" }
  | { type: "home" }
  | { type: "results"; className: string }
  | { type: "detail"; className: string; match: Match };

// ─────────────────────────────────────────────────────────────────────────────
// Brand color tokens — centralised so every component uses the same palette.
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  navyBg:     "#1C2B4A",
  navyCard:   "#243361",
  navyBorder: "#2E4070",
  cgpsBlue:   "#4878B0",
  accentBlue: "#4A9ED4",
  gold:       "#C9A227",
  goldLight:  "#FDF3D0",
  goldBorder: "#E8CC70",
  softText:   "#A8BBCF",
  pageBg:     "#EEF2F8",
  cardBg:     "#FFFFFF",
  cardBorder: "#D0DAE8",
  navyText:   "#1C2B4A",
  bodyText:   "#374151",
  mutedText:  "#6B7280",
  errorRed:   "#E07070",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// All period letters in slot order — used to derive free periods.
const ALL_PERIODS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const DAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8"];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// FEATURE: Today's date key — converts current date to "YYYY/MM/DD" for cycle day lookup
function getTodayKey(): string { // : string is the return type annotation — TypeScript equivalent of Python's -> str
  const now = new Date(); // built-in JS Date object — like Python's datetime.now()
  const y = now.getFullYear(); // extracts the 4-digit year as a number, e.g. 2026
  const m = String(now.getMonth() + 1).padStart(2, "0"); // padStart pads with "0" so "3" → "03"; months are 0-indexed in JS, so +1
  const d = String(now.getDate()).padStart(2, "0");       // same zero-padding for day — getDate() returns 1-31
  return `${y}/${m}/${d}`; // backtick template literal — like Python's f"{y}/{m}/{d}"
}

// FEATURE: Home screen date display — formats "YYYY/MM/DD" → "Wednesday, March 11"
function formatDisplayDate(key: string): string { // takes a "YYYY/MM/DD" string and returns a human-readable date
  const [y, m, d] = key.split("/").map(Number); // array destructuring — unpacks the 3 split pieces into named vars; .map(Number) converts each string to a number
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { // constructs a Date then formats it; m-1 because JS months are 0-indexed; "en-US" sets locale
    weekday: "long",  // include full weekday name, e.g. "Wednesday"
    month: "long",    // include full month name, e.g. "March"
    day: "numeric",   // include day number, e.g. "11" — produces "Wednesday, March 11"
  });
}

// FEATURE: Name parsing — extracts first name for nav greeting ("Azadian, Armen" → "Armen")
function getFirstName(name: string): string {
  const parts = name.split(", "); // splits "Azadian, Armen" into ["Azadian", "Armen"]
  return parts.length > 1 ? parts[1] : name; // ternary: condition ? valueIfTrue : valueIfFalse — same idea as Python's (a if cond else b); parts[1] is the first name
}

// FEATURE: Name parsing — full display name ("Azadian, Armen" → "Armen Azadian")
function getDisplayName(name: string): string {
  const parts = name.split(", "); // splits "Azadian, Armen" into ["Azadian", "Armen"]
  return parts.length > 1 ? `${parts[1]} ${parts[0]}` : name; // template literal builds "Armen Azadian" — parts[1] = first, parts[0] = last
}

// FEATURE: Avatar initials — "Armen Azadian" → "AA" for the opt-in welcome circle
function initials(name: string): string { // takes a raw "Last, First" name and returns uppercase initials like "AA"
  return getDisplayName(name)   // first converts to "First Last" form so initials are in the right order
    .split(" ")           // split on spaces → ["Armen", "Azadian"]
    .map((n) => n[0])     // arrow function: (n) => n[0] is like Python's lambda n: n[0]; grabs first char of each word
    .join("")             // joins array back into a string — like Python's "".join(...)
    .slice(0, 2)          // take at most 2 characters — like Python's [0:2]
    .toUpperCase();       // uppercase — like Python's .upper()
}

// FEATURE: Free period calculation (all 8 days) — used by study buddy matching algorithm
function getAllFreePeriods(student: Student): Record<string, string[]> { // Record<string, string[]> is a TypeScript type meaning "object whose keys are strings and values are string arrays" — like Dict[str, list[str]] in Python
  const result: Record<string, string[]> = {}; // empty object that will be filled in — like starting with an empty dict in Python
  for (const day of DAYS) { // loops over all 8 cycle days in order
    const scheduled = new Set<string>(); // Set<string> is a TypeScript generic — Set is the same concept as Python's set(); <string> just tells TS what type it holds
    for (const cls of student.classes) { // loop over every class the student is enrolled in
      const val = cls.schedule[day]; // look up what period(s) this class meets on this day — could be "B" or "C,D" or undefined
      if (val) val.split(",").map((p) => p.trim()).forEach((p) => scheduled.add(p)); // chained methods: split into array → trim each item (arrow fn) → add each to the Set
    }
    result[day] = ALL_PERIODS.filter((p) => !scheduled.has(p)); // .filter keeps only items where the arrow function returns true; .has() checks Set membership — like Python's `not in`
  }
  return result; // returns the full map, e.g. { "Day 1": ["A","C"], "Day 2": ["B","F"], ... }
}

// FEATURE: Free periods today — single-day version used on the home screen chips
function getFreePeriodsByDay(student: Student, dayKey: string): string[] { // returns a plain array of free period letters for just one day
  const scheduled = new Set<string>(); // Set for O(1) membership checks — faster than scanning an array
  for (const cls of student.classes) { // iterate over all of the student's classes
    const val = cls.schedule[dayKey]; // get the period string for this specific day, e.g. "B" or "C,D" or undefined
    if (val) val.split(",").map((p) => p.trim()).forEach((p) => scheduled.add(p)); // same chain as above: split → trim each → add each to Set
  }
  return ALL_PERIODS.filter((p) => !scheduled.has(p)); // keep only periods NOT in the scheduled Set
}

interface ScheduleItem {
  name: string;
  teacher: string;
  periods: string[];
  room: string;
}

// FEATURE: Today's schedule builder — ordered class list for a given cycle day
function getScheduleForDay(student: Student, dayKey: string): ScheduleItem[] { // returns an ordered list of ScheduleItem objects for the given cycle day
  const items: ScheduleItem[] = []; // start with an empty array typed as ScheduleItem[] — like an empty list in Python
  for (const cls of student.classes) { // iterate over each of the student's enrolled classes
    const val = cls.schedule[dayKey]; // look up whether this class meets on this day; undefined means it doesn't
    if (!val) continue; // skip this class if it doesn't meet today — `continue` jumps to the next loop iteration, same as Python
    const periods = val.split(",").map((p) => p.trim()).filter(Boolean); // .filter(Boolean) removes any empty strings after trimming — truthy check
    items.push({ name: cls.name, teacher: cls.teacher, periods, room: cls.room }); // push appends to the array — like Python's list.append(); object uses shorthand keys
  }
  return items.sort((a, b) => a.periods[0].localeCompare(b.periods[0])); // .sort takes a comparator fn; .localeCompare returns negative/0/positive — JS equivalent of Python's key= but manual
}

// FEATURE: Study buddy class filter — removes homeroom and house classes from the picker
function getSearchableClasses(student: Student): ClassEntry[] { // returns only classes a student can realistically search study buddies for
  return student.classes.filter((cls) => { // .filter iterates every class; the arrow function inside returns true to keep or false to drop
    const hasSchedule = Object.keys(cls.schedule).length > 0; // Object.keys() returns an array of keys — like Python's dict.keys(); length > 0 means at least one day is scheduled
    const isHomeroom = /homeroom/i.test(cls.name); // /homeroom/i is a regex literal; the i flag = case-insensitive; .test() returns true/false — like Python's re.search()
    const isHouse = /\b(red|green|silver|gold|blue)\s+house\b/i.test(cls.name); // \b = word boundary, \s+ = one or more spaces, | = OR inside the group
    return hasSchedule && !isHomeroom && !isHouse; // keep the class only if it has a real schedule AND is not homeroom AND is not a house
  });
}

// FEATURE: Study buddy matching — shared free period overlap across all 8 days
function computeSharedFrees(
  a: Record<string, string[]>, // free periods for student A, keyed by day
  b: Record<string, string[]>  // free periods for student B, keyed by day
): SharedFree[] { // returns only the days where both students have at least one overlapping free period
  const result: SharedFree[] = []; // accumulator array — starts empty, days with overlap get pushed in
  for (const day of DAYS) { // check all 8 cycle days
    const aSet = new Set(a[day] ?? []); // ?? is the "nullish coalescing" operator — returns right side if left side is null or undefined; like Python's `a[day] or []` but only for null/undefined
    const shared = (b[day] ?? []).filter((p) => aSet.has(p)); // keep only periods that also appear in student A's free Set
    if (shared.length > 0) result.push({ day, periods: shared }); // only include this day if there is at least one overlapping period
  }
  return result; // e.g. [{ day: "Day 3", periods: ["B", "D"] }, ...]
}

// FEATURE: Study buddy matching — scoring formula (same teacher = 100pts, each shared free = 10pts) and tier assignment
function scoreAndTier(
  sameTeacher: boolean,
  totalSharedFrees: number
): { score: number; tier: Match["tier"] } { // return type is an inline object type — { score: number; tier: ... }
  const score = (sameTeacher ? 100 : 0) + totalSharedFrees * 10; // ternary inside arithmetic: if sameTeacher, contribute 100 pts, else 0; each shared free adds 10 pts
  let tier: Match["tier"]; // Match["tier"] reads the "tier" field type from the Match interface — TypeScript index access; using let so it can be reassigned below
  if (sameTeacher && totalSharedFrees > 0) tier = "best";     // both conditions met → strongest match
  else if (sameTeacher) tier = "good";                        // same teacher but no overlapping frees
  else if (totalSharedFrees > 0) tier = "possible";           // different teacher but some free overlap
  else tier = "fallback";                                      // only shares the class name — weakest match
  return { score, tier }; // shorthand object literal: { score: score, tier: tier } — keys match variable names
}

// FEATURE: Study buddy matching — main algorithm (loops all students, skips opted-out, scores + sorts results)
function findMatches(
  currentStudent: Student,
  allStudents: Student[],
  targetClassName: string
): Match[] {
  const currentClass = currentStudent.classes.find((c) => c.name === targetClassName); // .find() returns the first element where the arrow fn is true, or undefined
  if (!currentClass) return []; // early return if this student doesn't actually have that class — guard clause
  const currentFrees = getAllFreePeriods(currentStudent); // pre-compute current student's free periods once, reused in every loop iteration
  const matches: Match[] = []; // accumulator — candidates get pushed in below

  for (const candidate of allStudents) { // iterate every student in the school dataset
    // if (candidate.id === currentStudent.id) continue; // (Testing)
    if (!candidate.optedIn) continue;                 // respect privacy setting — hidden students are excluded
    const candidateClass = candidate.classes.find((c) => c.name === targetClassName); // check if this candidate also has the target class
    if (!candidateClass) continue; // if they don't share this class, skip them entirely

    const sameTeacher = currentClass.teacher === candidateClass.teacher; // true if both students have the same section/teacher
    const candidateFrees = getAllFreePeriods(candidate); // compute the candidate's free periods for all 8 days
    const sharedFrees = computeSharedFrees(currentFrees, candidateFrees); // find days/periods both students are free at the same time
    const totalSharedFrees = sharedFrees.reduce((s, sf) => s + sf.periods.length, 0); // .reduce() accumulates a value across an array; (s, sf) => s + sf.periods.length adds up all period counts; 0 is the starting value — like Python's functools.reduce or sum()
    const { score, tier } = scoreAndTier(sameTeacher, totalSharedFrees); // object destructuring — unpacks the returned object's fields into local variables

    matches.push({ // build a Match object and append it to the results array
      student: candidate,           // the candidate student object
      matchedClassName: targetClassName, // which class triggered this match
      currentTeacher: currentClass.teacher,       // current student's section teacher
      candidateTeacher: candidateClass.teacher,   // candidate's section teacher
      sameTeacher,      // shorthand: sameTeacher: sameTeacher
      sharedFrees,      // shorthand: sharedFrees: sharedFrees
      totalSharedFrees, // shorthand: totalSharedFrees: totalSharedFrees
      score,            // numeric score used for ranking
      tier,             // "best" | "good" | "possible" | "fallback" label
    });
  }

  return matches.sort((a, b) => b.score - a.score); // sort descending: if b.score - a.score is positive, b comes first
}

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  currentStudent: Student;
  allStudents: Student[];
}

// FEATURE: Root component — screen navigation controller (optin → home → results → detail)
export default function StudentHome({ currentStudent, allStudents }: Props) {
  const router = useRouter(); // Next.js hook that lets you navigate programmatically (like a redirect)
  const [view, setView] = useState<View>({ type: "optin" }); // useState is a React hook — returns [currentValue, setterFn]; <View> is a TypeScript generic saying "this state holds a View type"
  const [optedIn, setOptedIn] = useState<boolean | null>(null); // boolean | null is a union type — the value can be true, false, or null

  // Compute once per render — shared with child screens so they don't recalculate.
  const todayKey = getTodayKey(); // calls our helper above to get "YYYY/MM/DD" string for today
  const cycleDay = cycleDays[todayKey] ?? null; // ?? null: if cycleDays lookup returns undefined (date not in calendar), use null instead

  // Memoize match results so findMatches (which iterates all students) only reruns
  // when the selected class or the opted-in flag changes, not on every keystroke/render.
  const matches = useMemo(
    () =>                                      // arrow function passed to useMemo — runs only when dependencies change
      view.type === "results"
        ? findMatches(currentStudent, allStudents, view.className)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view.type === "results" ? view.className : null, optedIn] // dependency array — useMemo re-runs when any of these values change
  );

  // FEATURE: Opt-in choice handler — saves choice, updates student visibility, navigates to home
  const handleOptIn = (choice: boolean) => {  // arrow function assigned to a variable — same as writing function handleOptIn(choice) {}
    setOptedIn(choice); // update React state so the UI re-renders with the new opt-in value
    // Also update the student object so findMatches reflects the opt-in choice
    // when this student appears as a candidate in another student's session.
    currentStudent.optedIn = choice; // mutate the object directly so other students searching don't see this student if they opted out
    setView({ type: "home" }); // navigate to the home screen — changes the `view` state which triggers a re-render
  };

  const signOut = () => router.push("/armen"); // concise arrow function with no curly braces — the expression after => is the return value

  if (view.type === "optin") {
    return (
      <OptInScreen
        student={currentStudent}
        onJoin={() => handleOptIn(true)}
        onSkip={() => handleOptIn(false)}
      />
    );
  }

  if (view.type === "home") {
    return (
      <HomeScreen
        currentStudent={currentStudent}
        optedIn={optedIn ?? false}
        cycleDay={cycleDay}
        todayKey={todayKey}
        onSelectClass={(cls) => setView({ type: "results", className: cls })}
        onToggleOptIn={() => {
          const next = !optedIn;
          setOptedIn(next);
          currentStudent.optedIn = next;
        }}
        onSignOut={signOut}
      />
    );
  }

  if (view.type === "results") {
    return (
      <ResultsScreen
        className={view.className}
        matches={matches}
        onBack={() => setView({ type: "home" })}
        onSelectMatch={(match) =>
          setView({ type: "detail", className: view.className, match })
        }
      />
    );
  }

  if (view.type === "detail") {
    return (
      <DetailScreen
        match={view.match}
        todayKey={todayKey}
        currentStudent={currentStudent}
        onBack={() => setView({ type: "results", className: view.className })}
      />
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE: Opt-In Screen — first screen after ID scan; student chooses visibility
// ─────────────────────────────────────────────────────────────────────────────

function OptInScreen({
  student,
  onJoin,
  onSkip,
}: {
  student: Student;
  onJoin: () => void;
  onSkip: () => void;
}) {
  const displayName = getDisplayName(student.name);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: C.navyBg }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <CGPSMark />

        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white select-none"
          style={{ backgroundColor: C.cgpsBlue }}
        >
          {initials(student.name)}
        </div>

        {/* Welcome */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-3">{displayName}</h1>
          <p className="text-sm leading-relaxed" style={{ color: C.softText }}>
            Study Buddies matches you with classmates who share your classes and
            free periods — so you can find time to study together.
          </p>
        </div>

        {/* Choice */}
        <div
          className="w-full rounded-2xl border p-6 flex flex-col gap-3"
          style={{ backgroundColor: C.navyCard, borderColor: C.navyBorder }}
        >
          <p className="text-center text-sm font-medium text-white mb-1">
            Join Study Buddies?
          </p>

          <button
            onClick={onJoin}
            className="w-full text-white font-semibold rounded-xl py-3.5 text-sm tracking-[0.1em] uppercase transition-colors"
            style={{ backgroundColor: C.cgpsBlue }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "#5789C1") // "as HTMLButtonElement" is a TypeScript type cast — tells TS to treat e.target as a button so we can access .style on it
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = C.cgpsBlue)
            }
          >
            Yes — Join Study Buddies
          </button>

          <button
            onClick={onSkip}
            className="w-full font-medium rounded-xl py-3.5 text-sm tracking-[0.08em] uppercase transition-colors border"
            style={{ color: C.softText, borderColor: C.navyBorder }}
            onMouseEnter={(e) => {
              (e.currentTarget.style.backgroundColor = C.navyBorder);
              (e.currentTarget.style.color = "#FFFFFF");
            }}
            onMouseLeave={(e) => {
              (e.currentTarget.style.backgroundColor = "transparent");
              (e.currentTarget.style.color = C.softText);
            }}
          >
            Browse only — stay hidden
          </button>
        </div>

        <p className="text-xs" style={{ color: C.navyBorder }}>
          You can change this anytime from your home screen
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE: Home Screen — main dashboard with schedule, free periods, class picker, opt-in toggle
// ─────────────────────────────────────────────────────────────────────────────

interface HomeScreenProps {
  currentStudent: Student;
  optedIn: boolean;
  cycleDay: string | null;
  todayKey: string;
  onSelectClass: (cls: string) => void;
  onToggleOptIn: () => void;
  onSignOut: () => void;
}

function HomeScreen({
  currentStudent,
  optedIn,
  cycleDay,
  todayKey,
  onSelectClass,
  onToggleOptIn,
  onSignOut,
}: HomeScreenProps) {
  const firstName = getFirstName(currentStudent.name);
  const displayDate = formatDisplayDate(todayKey);
  const scheduleItems = cycleDay ? getScheduleForDay(currentStudent, cycleDay) : [];
  const freePeriods = cycleDay ? getFreePeriodsByDay(currentStudent, cycleDay) : [];
  const searchableClasses = getSearchableClasses(currentStudent);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.pageBg }}>

      {/* FEATURE: Home screen nav header — student name, opt-in status indicator, sign out button */}
      {/* Nav header */}
      {/* borderBottom uses a template literal (`1px solid ${C.navyBorder}`) to insert the color variable into the CSS string — like Python's f-strings */}
      <div
        className="px-5 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ backgroundColor: C.navyBg, borderBottom: `1px solid ${C.navyBorder}` }}
      >
        <div className="flex items-center gap-3">
          <CGPSMark small />
          <div
            className="h-6 w-px mx-1"
            style={{ backgroundColor: C.navyBorder }}
          />
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{firstName}</p>
            {/* optedIn ? C.gold : C.softText — ternary picks the color based on opt-in state */}
          <p className="text-xs leading-tight" style={{ color: optedIn ? C.gold : C.softText }}>
              {optedIn ? "Visible to others" : "Hidden from searches"} {/* same ternary pattern in JSX — curly braces {} let you embed JS expressions inside HTML-like tags */}
            </p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
          style={{ color: C.softText, borderColor: C.navyBorder }}
          onMouseEnter={(e) => {
            (e.currentTarget.style.backgroundColor = C.navyBorder);
            (e.currentTarget.style.color = "#FFFFFF");
          }}
          onMouseLeave={(e) => {
            (e.currentTarget.style.backgroundColor = "transparent");
            (e.currentTarget.style.color = C.softText);
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full pb-16">

        {/* FEATURE: Home screen date + cycle day — shows today's date and current day in the 8-day cycle */}
        {/* Date + cycle day */}
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.15em] mb-1"
              style={{ color: C.mutedText }}
            >
              Today
            </p>
            <p className="text-xl font-bold" style={{ color: C.navyText }}>
              {displayDate}
            </p>
          </div>
          {cycleDay ? (
            <span
              className="font-bold text-sm px-4 py-2 rounded-xl text-white"
              style={{ backgroundColor: C.navyBg }}
            >
              {cycleDay}
            </span>
          ) : (
            <span
              className="text-sm px-4 py-2 rounded-xl"
              style={{ backgroundColor: C.cardBorder, color: C.mutedText }}
            >
              No School
            </span>
          )}
        </div>

        {/* FEATURE: Home screen today's schedule — class name, teacher, room, period badges sorted by period */}
        {/* Schedule */}
        <section>
          {/* ternary with template literal: if cycleDay exists, show "Schedule · Day 3"; otherwise just "Schedule" */}
          <SectionLabel>{cycleDay ? `Schedule · ${cycleDay}` : "Schedule"}</SectionLabel>

          {!cycleDay ? (
            <InfoCard>No school today — enjoy the break!</InfoCard>
          ) : scheduleItems.length === 0 ? (
            <InfoCard>No classes scheduled.</InfoCard>
          ) : (
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder }}
            >
              {scheduleItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 px-4 py-3"
                  style={{
                    borderTop: i > 0 ? `1px solid ${C.cardBorder}` : "none", // ternary: add a divider line above every row except the first (i === 0)
                  }}
                >
                  <div className="flex gap-1 mt-0.5 shrink-0">
                    {item.periods.map((p) => (
                      <PeriodBadge key={p} period={p} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold leading-tight"
                      style={{ color: C.navyText }}
                    >
                      {item.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: C.mutedText }}>
                      {item.teacher}
                      {item.room && ` · ${item.room}`} {/* short-circuit &&: if item.room is truthy, render the template literal; if empty string (falsy), renders nothing — like Python's `' · ' + room if room else ''` */}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FEATURE: Home screen free periods today — gold chips showing each free period letter + time */}
        {/* Free periods */}
        {cycleDay && (
          <section>
            <SectionLabel>Free Periods Today</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {freePeriods.length === 0 ? (
                <span className="text-sm" style={{ color: C.mutedText }}>
                  No free periods today
                </span>
              ) : (
                freePeriods.map((p) => (
                  <FreePeriodChip key={p} period={p} cycleDay={cycleDay} />
                ))
              )}
            </div>
          </section>
        )}

        {/* FEATURE: Home screen study buddy class picker — one button per searchable class, triggers findMatches */}
        {/* Find a Study Buddy */}
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
                className="w-full rounded-xl border px-4 py-3 text-left flex items-center justify-between gap-3 transition-all group"
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
                  <p
                    className="text-sm font-semibold leading-tight truncate"
                    style={{ color: C.navyText }}
                  >
                    {cls.name}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: C.mutedText }}>
                    {cls.teacher}
                  </p>
                </div>
                <ChevronRight color={C.cgpsBlue} />
              </button>
            ))}
          </div>
        </section>

        {/* FEATURE: Home screen opt-in toggle — gold/gray pill switch to show/hide yourself from other students */}
        {/* Opt-in toggle */}
        <section>
          <div
            className="rounded-2xl border px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder }}
          >
            <div className="min-w-0 pr-4">
              <p className="text-sm font-semibold" style={{ color: C.navyText }}>
                Study Buddies visibility
              </p>
              <p className="text-xs mt-0.5" style={{ color: C.mutedText }}>
                {optedIn
                  ? "You appear in other students' search results"
                  : "You are hidden from search results"}
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

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE: Results Screen — ranked list of study buddy candidates for a selected class
// ─────────────────────────────────────────────────────────────────────────────

// FEATURE: Study buddy matching — tier badge labels and colors (best/good/possible/fallback)
const TIER_CONFIG: Record<
  Match["tier"],
  { label: string; bg: string; text: string }
> = {
  best:     { label: "Best Match",    bg: C.gold,      text: C.navyBg },
  good:     { label: "Same Teacher",  bg: C.cgpsBlue,  text: "#FFFFFF" },
  possible: { label: "Has Overlap",   bg: "#DDE8F5",   text: C.navyBg },
  fallback: { label: "Class Match",   bg: "#E8ECF2",   text: C.mutedText },
};

interface ResultsScreenProps {
  className: string;
  matches: Match[];
  onBack: () => void;
  onSelectMatch: (m: Match) => void;
}

function ResultsScreen({ className, matches, onBack, onSelectMatch }: ResultsScreenProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.pageBg }}>
      <NavHeader onBack={onBack} label="Study Buddies" title={className} />

      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col gap-4">
        {matches.length === 0 ? (
          <InfoCard>
            No opted-in students share {className} yet.
          </InfoCard>
        ) : (
          <>
            <p className="text-xs" style={{ color: C.mutedText }}>
              {/* matches.length !== 1 ? "es" : "" — adds "es" for plural ("2 matches") but not singular ("1 match") */}
              {matches.length} match{matches.length !== 1 ? "es" : ""} — sorted by
              teacher overlap and shared free periods
            </p>

            {matches.map((match, i) => {
              const tier = TIER_CONFIG[match.tier];
              return (
                <button
                  key={match.student.id}
                  onClick={() => onSelectMatch(match)}
                  className="w-full rounded-2xl border px-4 py-4 text-left flex items-start gap-4 transition-all"
                  style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.cgpsBlue;
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(72,120,176,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.cardBorder;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Rank */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: C.pageBg, color: C.mutedText }}
                  >
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold" style={{ color: C.navyText }}>
                        {getDisplayName(match.student.name)}
                      </p>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: tier.bg, color: tier.text }}
                      >
                        {tier.label}
                      </span>
                    </div>

                    {/* ternary picks between two template literals depending on whether the teacher is the same */}
                    <p className="text-xs mb-2" style={{ color: C.mutedText }}>
                      {match.sameTeacher
                        ? `Same teacher · ${match.candidateTeacher}`
                        : `${match.candidateTeacher} (different teacher)`}
                    </p>

                    {match.sharedFrees.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {/* .slice(0, 4) keeps only the first 4 items — like Python's list[0:4] */}
                        {match.sharedFrees.slice(0, 4).map((sf) => (
                          <span
                            key={sf.day}
                            className="text-xs font-medium px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: C.goldLight,
                              borderColor: C.goldBorder,
                              color: C.navyText,
                            }}
                          >
                            {sf.day} ·{" "}
                            {/* ternary: show exact time if 1 period, otherwise show "N slots" using a template literal */}
                            {sf.periods.length === 1
                              ? getPeriodTime(sf.periods[0], sf.day)
                              : `${sf.periods.length} slots`}
                          </span>
                        ))}
                        {match.sharedFrees.length > 4 && (
                          <span className="text-xs self-center" style={{ color: C.mutedText }}>
                            +{match.sharedFrees.length - 4} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: C.mutedText }}>
                        No shared free periods
                      </p>
                    )}
                  </div>

                  <ChevronRight color={C.cgpsBlue} />
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE: Detail Screen — full match info: matched class, teachers, and shared free period schedule
// ─────────────────────────────────────────────────────────────────────────────

interface DetailScreenProps {
  match: Match;
  todayKey: string;
  currentStudent: Student;
  onBack: () => void;
}

function DetailScreen({ match, todayKey, currentStudent, onBack }: DetailScreenProps) {
  const candidateName = getDisplayName(match.student.name);
  const todayCycleDay = cycleDays[todayKey] ?? null;

  // FEATURE: Connect button state — tracks whether the email request is in-flight, sent, or errored
  const [connectState, setConnectState] = useState<"idle" | "sending" | "sent" | "ratelimit" | "error">("idle");
  const [invitesRemaining, setInvitesRemaining] = useState<number | null>(null);

  async function handleConnect() {
    setConnectState("sending");
    try {
      const res = await fetch("/api/send-connect-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName:    currentStudent.name,
          senderId:      currentStudent.id,
          recipientName: match.student.name,
          recipientId:   match.student.id,
          className:     match.matchedClassName,
          sharedFrees:   match.sharedFrees,
        }),
      });
      if (res.status === 429) {
        setConnectState("ratelimit");
      } else if (res.ok) {
        const data = await res.json();
        setInvitesRemaining(data.invitesRemaining ?? null);
        setConnectState("sent");
      } else {
        setConnectState("error");
      }
    } catch {
      setConnectState("error");
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.pageBg }}>
      <NavHeader onBack={onBack} label="Match Details" title={candidateName} />

      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col gap-5 pb-16">

        {/* FEATURE: Detail screen matched class — class name, your teacher vs their teacher, same-teacher badge */}
        {/* Matched class */}
        <section>
          <SectionLabel>Matched Class</SectionLabel>
          <div
            className="rounded-2xl border px-5 py-4 flex flex-col gap-3"
            style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder }}
          >
            <p className="text-base font-bold" style={{ color: C.navyText }}>
              {match.matchedClassName}
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wide w-10 shrink-0"
                  style={{ color: C.mutedText }}
                >
                  You
                </span>
                <span className="text-sm" style={{ color: C.bodyText }}>
                  {match.currentTeacher}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wide w-10 shrink-0"
                  style={{ color: C.mutedText }}
                >
                  Them
                </span>
                <span className="text-sm" style={{ color: C.bodyText }}>
                  {match.candidateTeacher}
                </span>
                {match.sameTeacher && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: C.cgpsBlue }}
                  >
                    Same teacher
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE: Detail screen study schedule — shared free periods per day; today's day is highlighted gold */}
        {/* When you can study together */}
        <section>
          <SectionLabel>When you can study together</SectionLabel>

          {match.sharedFrees.length === 0 ? (
            <InfoCard>
              No overlapping free periods across the 8-day cycle.
            </InfoCard>
          ) : (
            <>
              <p className="text-xs mb-3" style={{ color: C.mutedText }}>
                {match.totalSharedFrees} shared slot
                {match.totalSharedFrees !== 1 ? "s" : ""} across the 8-day cycle {/* ternary adds "s" for plural: "2 slots" vs "1 slot" */}
              </p>
              <div className="flex flex-col gap-2">
                {match.sharedFrees.map((sf, i) => {
                  const isToday = todayCycleDay === sf.day;
                  return (
                    <div
                      key={i}
                      className="rounded-xl border px-4 py-3 flex items-center justify-between gap-3"
                      style={{
                        backgroundColor: isToday ? C.goldLight : C.cardBg,
                        borderColor: isToday ? C.goldBorder : C.cardBorder,
                      }}
                    >
                      {/* Left: day + today badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-sm font-bold"
                          style={{ color: isToday ? "#7A6010" : C.navyText }}
                        >
                          {sf.day}
                        </span>
                        {isToday && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: C.gold }}
                          >
                            Today
                          </span>
                        )}
                      </div>

                      {/* Right: time + period badge */}
                      <div className="flex flex-col items-end gap-1">
                        {sf.periods.map((p) => (
                          <div key={p} className="flex items-center gap-2">
                            <span
                              className="text-sm font-semibold tabular-nums"
                              style={{ color: C.navyText }}
                            >
                              {getPeriodTime(p, sf.day)}
                            </span>
                            <PeriodBadge period={p} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* FEATURE: Connect button — sends a Mailgun email to the match on behalf of the current student */}
        <div className="flex flex-col items-center gap-3">
          {connectState === "ratelimit" ? (
            <div
              className="w-full rounded-2xl px-5 py-3 text-sm font-bold text-center"
              style={{ backgroundColor: "#FDE8E8", border: `1px solid ${C.errorRed}`, color: C.errorRed }}
            >
              3 invite limit reached — try again tomorrow.
            </div>
          ) : connectState !== "sent" ? (
            <button
              onClick={handleConnect}
              disabled={connectState === "sending"}
              className="w-full rounded-2xl px-5 py-3 text-sm font-bold transition-all"
              style={{
                backgroundColor: connectState === "sending" ? C.cgpsBlue + "99" : C.cgpsBlue,
                color: "#FFFFFF",
                cursor: connectState === "sending" ? "not-allowed" : "pointer",
              }}
            >
              {connectState === "sending"
                ? "Sending…"
                : `Connect with ${getFirstName(match.student.name)}`}
            </button>
          ) : (
            <div
              className="w-full rounded-2xl px-5 py-3 text-sm font-bold text-center"
              style={{ backgroundColor: C.goldLight, border: `1px solid ${C.goldBorder}`, color: "#7A6010" }}
            >
              Email sent to {getFirstName(match.student.name)}!
            </div>
          )}

          {connectState === "error" && (
            <p className="text-xs text-center" style={{ color: C.errorRed }}>
              Something went wrong — check your Mailgun setup.
            </p>
          )}

          <p className="text-xs text-center" style={{ color: C.mutedText }}>
            {connectState === "sent" && invitesRemaining !== null
              ? `${invitesRemaining} invite${invitesRemaining !== 1 ? "s" : ""} remaining today.`
              : `Sends ${getFirstName(match.student.name)} your email so they can reach out.`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared layout components
// ─────────────────────────────────────────────────────────────────────────────

// FEATURE: Shared nav header — sticky top bar with back button, screen label, and title
function NavHeader({
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
      style={{
        backgroundColor: C.navyBg,
        borderBottom: `1px solid ${C.navyBorder}`, // template literal — inserts the color token into the CSS string
      }}
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
        <p
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: C.softText }}
        >
          {label}
        </p>
        <p className="text-base font-bold text-white truncate">{title}</p>
      </div>
    </div>
  );
}

// FEATURE: Shared section label — small uppercase gray heading used between content blocks
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-semibold uppercase tracking-[0.15em] mb-3"
      style={{ color: C.mutedText }}
    >
      {children}
    </h2>
  );
}

// FEATURE: Shared info card — centered empty-state card (e.g. "No school today", "No matches found")
function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border px-5 py-6 text-center text-sm"
      style={{
        backgroundColor: C.cardBg,
        borderColor: C.cardBorder,
        color: C.mutedText,
      }}
    >
      {children}
    </div>
  );
}

// FEATURE: Shared period badge — small navy square showing a period letter (e.g. "B")
function PeriodBadge({ period }: { period: string }) {
  return (
    <span
      className="font-bold text-xs w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
      style={{ backgroundColor: C.navyBg }}
    >
      {period}
    </span>
  );
}

// FEATURE: Shared free period chip — gold pill showing period letter + time (used on home screen)
function FreePeriodChip({ period, cycleDay }: { period: string; cycleDay: string }) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 rounded-xl border px-2.5 py-2"
      style={{
        backgroundColor: C.goldLight,
        borderColor: C.goldBorder,
      }}
    >
      <span className="text-sm font-bold" style={{ color: C.navyText }}>
        {period}
      </span>
      <span className="text-xs font-medium tabular-nums" style={{ color: "#7A6010" }}>
        {getPeriodTime(period, cycleDay)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CGPS Logo Mark
// ─────────────────────────────────────────────────────────────────────────────

// FEATURE: Shared CGPS logo mark — serif "C" + bold "GPS" with blue underline; small prop scales it for nav bar
function CGPSMark({ small = false }: { small?: boolean }) { // destructuring with default: small defaults to false if not passed; small?: boolean means the prop is optional (the ? marks it optional in TypeScript)
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-baseline leading-none">
        <span
          className="font-serif text-white"
          style={{ fontSize: small ? "1.5rem" : "2.4rem", lineHeight: 1 }}
        >
          C
        </span>
        <span
          className="font-bold text-white tracking-tight"
          style={{ fontSize: small ? "1.2rem" : "1.9rem", lineHeight: 1 }}
        >
          GPS
        </span>
      </div>
      <div
        className="rounded-full"
        style={{
          height: "3px",
          width: small ? "18px" : "24px",
          marginTop: "3px",
          backgroundColor: C.accentBlue,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

// FEATURE: Shared icon — right-pointing chevron arrow used on class buttons and match cards
function ChevronRight({ color = "#6B7280" }: { color?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

// FEATURE: Shared icon — left-pointing chevron arrow used as the back button in nav headers
function ChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 4L6 8l4 4" />
    </svg>
  );
}
