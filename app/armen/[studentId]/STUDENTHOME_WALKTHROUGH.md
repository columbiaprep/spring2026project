# StudentHome.tsx — Full Feature Walkthrough

This document walks through the entire `StudentHome.tsx` file in the order a real user experiences it,
explaining every feature with the exact lines responsible for it.

---

## 1. Setup: Types, Colors, and Constants (Lines 47–106)

Before any screen renders, the file defines the building blocks everything else uses.

**Lines 52–55 — `SharedFree` type**
Defines what a "shared free period" looks like: a day name (e.g. "Day 3") paired with an array of period
letters (e.g. ["B", "D"]) that both students are free on that day.

**Lines 58–68 — `Match` type**
Defines everything stored about a potential study buddy:
- The candidate student object
- Which class they matched on
- Both teachers (yours and theirs)
- Whether it's the same teacher
- The shared free periods
- A numeric score and a tier label ("best", "good", "possible", "fallback")

**Lines 71–75 — `View` type**
Tracks which screen is currently showing. Instead of a single string like `"home"`, each screen is its own
object with its own extra data. For example, the results screen also stores `className`, and the detail
screen stores both `className` and the full `match` object.

**Lines 81–98 — Color tokens (`C` object)**
All colors in the app are defined here in one place so every component uses the same palette.
Key colors:
- `C.navyBg` (#1C2B4A) — dark navy background used on login, nav bars
- `C.cgpsBlue` (#4878B0) — primary button and link color
- `C.gold` (#C9A227) — highlights, best match badges, opt-in indicator
- `C.pageBg` (#EEF2F8) — light gray background of the main app screens
- `C.mutedText` (#6B7280) — secondary/helper text throughout

**Lines 105–106 — `ALL_PERIODS` and `DAYS` constants**
`ALL_PERIODS` is the list ["A","B","C","D","E","F","G","H"] — all 8 period slots in a school day.
`DAYS` is the list ["Day 1" through "Day 8"] — the 8-day rotating cycle.
Both are used throughout the helper functions to iterate over schedule data.

---

## 2. Helper Functions (Lines 110–275)

These functions run behind the scenes to prepare data for the UI. They are not components — they just
compute and return values.

**Lines 113–119 — `getTodayKey()`**
Grabs today's date using JavaScript's built-in `Date` object and formats it as `"YYYY/MM/DD"` (e.g.
`"2026/03/17"`). This string is used as the key to look up today's cycle day in the `cycleDays` data file.

**Lines 122–129 — `formatDisplayDate(key)`**
Takes a `"YYYY/MM/DD"` string and converts it into a human-readable format like `"Tuesday, March 17"`.
This is what appears at the top of the home screen under "Today".

**Lines 132–135 — `getFirstName(name)`**
Student names in the CSV are stored as `"Last, First"` (e.g. `"Azadian, Armen"`). This function splits on
`", "` and returns just the first name (`"Armen"`). Used for the personalized greeting in the nav header.

**Lines 138–141 — `getDisplayName(name)`**
Same split as above, but returns `"First Last"` format (`"Armen Azadian"`). Used anywhere the full name
is displayed: match cards, detail screen header, opt-in welcome.

**Lines 144–151 — `initials(name)`**
Converts a raw CSV name to a 2-character uppercase initials string (e.g. `"Armen Azadian"` → `"AA"`).
Used to populate the avatar circle on the opt-in welcome screen.

**Lines 155–166 — `getAllFreePeriods(student)`**
Computes which periods a student is free on every one of the 8 cycle days. For each day, it looks at every
class the student is enrolled in and records what period(s) that class meets. Any period from A–H that
isn't scheduled becomes a free period. Returns an object like:
```
{ "Day 1": ["A","C","G"], "Day 2": ["B","D","F"], ... }
```
This is the foundation of the matching algorithm — called once for the current student and once per
candidate.

**Lines 169–176 — `getFreePeriodsByDay(student, dayKey)`**
Does the same thing as `getAllFreePeriods` but for a single day. More efficient when you only need today's
free periods (used on the home screen's "Free Periods Today" section).

**Lines 186–195 — `getScheduleForDay(student, dayKey)`**
Builds an ordered list of the student's classes for a given cycle day. For each class, it checks if that
class meets on that day, collects the period letter(s), and assembles an item with the class name, teacher,
room, and periods. The final list is sorted alphabetically by the first period letter (so A comes before B
comes before C, etc.) — this is how the schedule appears in order on the home screen.

**Lines 199–206 — `getSearchableClasses(student)`**
Filters the student's class list to remove administrative entries that aren't useful for study buddy
searches:
- Any class whose name matches `/homeroom/i` is removed
- Any class matching `/\b(red|green|silver|gold|blue)\s+house\b/i` is removed (house classes)
- Any class with no days scheduled is removed

The remaining classes are what appear as clickable buttons in the "Find a Study Buddy" section.

**Lines 209–220 — `computeSharedFrees(a, b)`**
Takes the free period maps for two students and finds the overlap. For each of the 8 days, it checks which
free periods student A has, then keeps only the ones student B also has free. Days where there's no overlap
at all are dropped entirely. Returns a list like:
```
[{ day: "Day 3", periods: ["B"] }, { day: "Day 6", periods: ["C","E"] }]
```

**Lines 224–235 — `scoreAndTier(sameTeacher, totalSharedFrees)`**
The scoring formula:
- Same teacher = **+100 points**
- Each shared free period = **+10 points**

After scoring, a tier label is assigned:
- **"best"** — same teacher AND shared free periods (score ≥ 110)
- **"good"** — same teacher but no shared free periods (score = 100)
- **"possible"** — different teacher but at least one shared free period (score ≥ 10)
- **"fallback"** — same class only, no teacher match, no free overlap (score = 0)

**Lines 239–275 — `findMatches(currentStudent, allStudents, targetClassName)`**
The main matching algorithm. Called when a student taps a class button. Steps:
1. Find the current student's entry for the selected class (line 244)
2. Pre-compute the current student's free periods for all 8 days (line 246)
3. Loop through every student in the school dataset (line 249)
4. Skip self (line 250)
5. Skip anyone who opted out (line 251)
6. Skip anyone who doesn't have the same class (line 253)
7. Check if they have the same teacher (line 255)
8. Compute the candidate's free periods (line 256)
9. Find overlapping free periods (line 257)
10. Count total shared free slots (line 258)
11. Score and tier the match (line 259)
12. Build a `Match` object and add it to results (lines 261–271)

After all candidates are processed, the results are sorted by score descending (line 274) so the best
matches appear first.

---

## 3. Root Component — StudentHome (Lines 288–370)

This is the top-level component that owns all screen navigation. It doesn't render much UI itself — it
decides which screen to show and passes the right data down.

**Lines 290–291 — State**
- `view` — tracks which screen is active (starts at `{ type: "optin" }`)
- `optedIn` — the student's current visibility preference (starts as `null` until they choose)

**Lines 294–295 — Today's date and cycle day**
`todayKey` is computed once (e.g. `"2026/03/17"`), then used to look up `cycleDay` from the `cycleDays`
data file (e.g. `"Day 2"`). If today isn't in the calendar (weekend, holiday), `cycleDay` is `null`.

**Lines 299–306 — Memoized match results**
`findMatches` is expensive — it loops every student in the school. `useMemo` ensures it only re-runs when
the selected class name changes or when the opt-in setting changes. Any other re-render (like a hover
effect) skips the recalculation.

**Lines 308–313 — `handleOptIn(choice)`**
When the student makes their opt-in choice, this function:
1. Saves the choice to React state (`setOptedIn`)
2. Directly updates `currentStudent.optedIn` on the object so that if another student's session is
   searching, this student's visibility is respected immediately
3. Navigates to the home screen

**Lines 318–369 — Screen routing**
Four `if` blocks check `view.type` and render the appropriate screen component. Each screen receives
exactly the props it needs, no more. Navigation between screens is handled by callbacks that call
`setView(...)` with the next screen's data.

---

## 4. Screen 1 — Opt-In Screen (Lines 376–459)

The first thing a student sees after their ID is accepted.

**Lines 394 — CGPS Logo**
The `CGPSMark` component renders at full size (no `small` prop).

**Lines 397–402 — Avatar circle**
A round blue circle displays the student's 2-letter initials using `initials(student.name)`.

**Lines 406–411 — Welcome text**
Shows the student's full display name as a heading, with a subtitle explaining what Study Buddies does.

**Lines 422–434 — "Yes — Join Study Buddies" button**
Calls `onJoin()`, which flows back to `handleOptIn(true)`. Sets the student as visible in other students'
searches. On hover, the button lightens to `#5789C1`.

**Lines 436–450 — "Browse only — stay hidden" button**
Calls `onSkip()`, which flows back to `handleOptIn(false)`. The student can still search and see matches,
but won't appear when other students search. On hover, the border fills with navy.

**Line 453 — "You can change this anytime" note**
A small reminder below the buttons so students don't feel locked in by their choice.

---

## 5. Screen 2 — Home Screen (Lines 475–697)

The main dashboard. Rendered after the opt-in choice is made.

### Nav Header (Lines 495–528)
Sticky bar at the top of the screen containing:
- CGPS logo (small variant)
- A vertical divider line
- Student's first name and opt-in status
  - If opted in: text is gold and says "Visible to others"
  - If hidden: text is muted gray and says "Hidden from searches"
- A "Sign Out" button that returns to `/armen` (the ID scanner)

### Date + Cycle Day (Lines 534–561)
Displays today's formatted date on the left. On the right, either:
- A navy badge showing the cycle day (e.g. "Day 2") if it's a school day
- A gray "No School" badge if today isn't in the cycle day calendar

### Today's Schedule (Lines 564–605)
Shows the student's classes for today's cycle day. If there's no school, shows an "enjoy the break!" card.
For each class:
- Period badge(s) on the left (e.g. a navy "B" square)
- Class name and teacher on the right
- Room number appended to the teacher line if available (e.g. "Jergens, Katie · 504S")
- A divider line between each row (but not above the first)

The class list comes from `getScheduleForDay()` and is already sorted by period letter.

### Free Periods Today (Lines 609–624)
Only shows if it's a school day. Displays each free period as a gold chip showing the period letter and
its time (e.g. "B" over "10:05 – 10:50"). The time is computed by `getPeriodTime()` from `periodTimes.ts`
using the rotating schedule formula.

If there are no free periods, shows "No free periods today" in muted text.

### Find a Study Buddy (Lines 627–663)
Shows one button per searchable class (homeroom and house classes already filtered out by
`getSearchableClasses()`). Each button shows:
- Class name (bold, truncated if long)
- Teacher name beneath it
- A blue chevron arrow on the right

On hover, the border turns CGPS blue and the background lightens. Clicking calls `onSelectClass(cls.name)`
which changes the view to `{ type: "results", className: cls.name }`, triggering `findMatches()` via
`useMemo`.

### Opt-In Toggle (Lines 666–693)
A card at the bottom of the home screen with a toggle switch. Shows:
- "Study Buddies visibility" as the label
- A subtitle describing current status ("You appear in other students' search results" or "You are hidden
  from search results")
- A toggle pill: gold when opted in, gray when hidden. The white circle inside slides right (opted in) or
  stays left (hidden)

Tapping the toggle calls `onToggleOptIn()` which flips the `optedIn` state and updates
`currentStudent.optedIn` directly.

---

## 6. Screen 3 — Results Screen (Lines 703–825)

Shown after a student selects a class from the home screen.

### Tier Config (Lines 703–711)
Before any rendering, a `TIER_CONFIG` object maps each tier to its display label, background color, and
text color:
- **"best"** → "Best Match" — gold background, navy text
- **"good"** → "Same Teacher" — CGPS blue background, white text
- **"possible"** → "Has Overlap" — light blue background, navy text
- **"fallback"** → "Class Match" — light gray background, muted text

### Header (Line 723)
`NavHeader` component shows a back arrow, "Study Buddies" as the label, and the selected class name as the
title.

### Empty State (Lines 726–729)
If no opted-in students share the class yet, shows an `InfoCard` saying so.

### Match Count (Lines 733–736)
Shows how many matches were found, with correct pluralization ("1 match" vs "2 matches"), and a subtitle
explaining the ranking criteria.

### Match Cards (Lines 738–819)
Each match is rendered as a tappable card. From left to right:
- **Rank circle** (lines 755–761): A small circle with the match's position number (1, 2, 3…)
- **Name + tier badge** (lines 764–773): Student's display name in bold, and a colored tier badge
  pulled from `TIER_CONFIG` based on the match's tier
- **Teacher line** (lines 776–781): Either "Same teacher · [name]" or "[name] (different teacher)"
- **Shared free period chips** (lines 783–807): Up to 4 gold chips showing day and time. If a day has
  only 1 shared free, the time is shown directly (e.g. "Day 3 · 10:05 – 10:50"). If a day has multiple
  shared frees, it shows "Day 3 · 2 slots". If there are more than 4 chips, a "+X more" count appears.
- **Chevron** (line 816): Blue right arrow indicating the card is tappable

On hover, the card border turns CGPS blue with a subtle shadow.

Clicking a card calls `onSelectMatch(match)` which changes view to
`{ type: "detail", className, match }`.

---

## 7. Screen 4 — Detail Screen (Lines 837–969)

Shows the full details for a single selected match.

### Header (Line 843)
`NavHeader` with "Match Details" as the label and the candidate's full name as the title. Back arrow
returns to the results screen.

### Matched Class Section (Lines 848–890)
A card showing:
- The class name in bold at the top
- A two-row layout with "You" and "Them" labels showing each student's teacher
- If it's the same teacher, a blue "Same teacher" badge appears next to the candidate's teacher name

### When You Can Study Together (Lines 893–955)
Shows every day in the 8-day cycle where both students are simultaneously free.

At the top: total shared slot count with correct pluralization ("3 shared slots across the 8-day cycle").

For each shared day (lines 907–952):
- The card's background and border are checked: if `todayCycleDay === sf.day` (it's today's cycle day),
  the card turns gold
- **Left side**: Day label (e.g. "Day 3"), and if it's today, a gold "Today" badge appears next to it
- **Right side**: For each overlapping period, the time range is shown (from `getPeriodTime()`) alongside
  a small navy period letter badge (e.g. "B")

If there are no shared free periods at all, an info card says "No overlapping free periods across the
8-day cycle."

### Discovery Note (Lines 959–965)
A small text block at the bottom reminding the student: "Study Buddies is discovery only — reach out to
[first name] directly to plan a study session." This keeps the app's role clear — it finds potential
partners but doesn't facilitate communication directly.

---

## 8. Shared UI Components (Lines 975–1142)

Small reusable components used across multiple screens.

**Lines 975–1013 — `NavHeader`**
Sticky top bar used on Results and Detail screens. Takes a back button callback, a small uppercase label,
and a bold title. The back button turns white on hover.

**Lines 1015–1023 — `SectionLabel`**
A small uppercase gray header used to label sections within screens (e.g. "Schedule · Day 2",
"Free Periods Today", "Find a Study Buddy").

**Lines 1026–1039 — `InfoCard`**
A centered card used for empty states or notes (e.g. "No school today", "No opted-in students found").

**Lines 1041–1050 — `PeriodBadge`**
A small navy square with rounded corners showing a single period letter (e.g. "B"). Used in schedule rows
and the detail screen's period time rows.

**Lines 1052–1069 — `FreePeriodChip`**
A gold pill-shaped chip showing a period letter over its time (e.g. "B" over "10:05 – 10:50"). Used in
the Free Periods Today section on the home screen. The time is fetched at render time from `getPeriodTime`.

**Lines 1075–1103 — `CGPSMark`**
The school logo: a serif "C" next to a bold "GPS", with a short CGPS-blue underline bar beneath. Accepts
an optional `small` prop that scales the font sizes down for the nav header vs. the full welcome screen.

**Lines 1109–1125 — `ChevronRight`**
A 16×16 right-pointing arrow SVG. Accepts an optional `color` prop (defaults to gray). Used on class
buttons and match cards to signal they're tappable.

**Lines 1127–1141 — `ChevronLeft`**
A 16×16 left-pointing arrow SVG using `currentColor` (inherits color from parent). Used exclusively on
`NavHeader` back buttons.
