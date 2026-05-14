import type { Student } from "../data/parseSchedule";

export interface SharedFree {
  day: string;
  periods: string[];
}

export interface Match {
  student: Student;
  matchedClassName: string;
  currentTeacher: string;
  candidateTeacher: string;
  sameTeacher: boolean;
  sharedFrees: SharedFree[];
  totalSharedFrees: number;
  score: number;
  tier: "best" | "good" | "possible" | "fallback";
}

export type View =
  | { type: "optin" }
  | { type: "home" }
  | { type: "results"; className: string }
  | { type: "detail"; className: string; match: Match };

// Brand color tokens — used across all screens
export const C = {
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

export const TIER_CONFIG: Record<
  Match["tier"],
  { label: string; bg: string; text: string }
> = {
  best:     { label: "Best Match",    bg: C.gold,      text: C.navyBg },
  good:     { label: "Same Teacher",  bg: C.cgpsBlue,  text: "#FFFFFF" },
  possible: { label: "Has Overlap",   bg: "#DDE8F5",   text: C.navyBg },
  fallback: { label: "Class Match",   bg: "#E8ECF2",   text: C.mutedText },
};

export const ALL_PERIODS = ["A", "B", "C", "D", "E", "F", "G", "H"];
export const DAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8"];
