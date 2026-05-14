import type { Student } from "../data/parseSchedule";
import { ALL_PERIODS, DAYS } from "./types";
import type { SharedFree, Match } from "./types";

// Builds a map of day → free periods for a student across all 8 cycle days
export function getAllFreePeriods(student: Student): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const day of DAYS) {
    const scheduled = new Set<string>();
    for (const cls of student.classes) {
      const val = cls.schedule[day];
      if (val) val.split(",").map((p) => p.trim()).forEach((p) => scheduled.add(p));
    }
    result[day] = ALL_PERIODS.filter((p) => !scheduled.has(p));
  }
  return result;
}

// Returns the days + periods where both students are free at the same time
export function computeSharedFrees(
  a: Record<string, string[]>,
  b: Record<string, string[]>
): SharedFree[] {
  const result: SharedFree[] = [];
  for (const day of DAYS) {
    const aSet = new Set(a[day] ?? []);
    const shared = (b[day] ?? []).filter((p) => aSet.has(p));
    if (shared.length > 0) result.push({ day, periods: shared });
  }
  return result;
}

// Scoring: same teacher = 100 pts, each shared free = 10 pts
// Tiers: best (same teacher + free overlap) > good (same teacher) > possible (free overlap) > fallback
export function scoreAndTier(
  sameTeacher: boolean,
  totalSharedFrees: number
): { score: number; tier: Match["tier"] } {
  const score = (sameTeacher ? 100 : 0) + totalSharedFrees * 10;
  let tier: Match["tier"];
  if (sameTeacher && totalSharedFrees > 0) tier = "best";
  else if (sameTeacher) tier = "good";
  else if (totalSharedFrees > 0) tier = "possible";
  else tier = "fallback";
  return { score, tier };
}

// Main algorithm: finds and ranks all opted-in students who share a given class
export function findMatches(
  currentStudent: Student,
  allStudents: Student[],
  targetClassName: string
): Match[] {
  const currentClass = currentStudent.classes.find((c) => c.name === targetClassName);
  if (!currentClass) return [];
  const currentFrees = getAllFreePeriods(currentStudent);
  const matches: Match[] = [];

  for (const candidate of allStudents) {
    if (!candidate.optedIn) continue;
    const candidateClass = candidate.classes.find((c) => c.name === targetClassName);
    if (!candidateClass) continue;

    const sameTeacher = currentClass.teacher === candidateClass.teacher;
    const candidateFrees = getAllFreePeriods(candidate);
    const sharedFrees = computeSharedFrees(currentFrees, candidateFrees);
    const totalSharedFrees = sharedFrees.reduce((s, sf) => s + sf.periods.length, 0);
    const { score, tier } = scoreAndTier(sameTeacher, totalSharedFrees);

    matches.push({
      student: candidate,
      matchedClassName: targetClassName,
      currentTeacher: currentClass.teacher,
      candidateTeacher: candidateClass.teacher,
      sameTeacher,
      sharedFrees,
      totalSharedFrees,
      score,
      tier,
    });
  }

  return matches.sort((a, b) => b.score - a.score);
}
