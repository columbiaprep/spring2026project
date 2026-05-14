import type { Student, ClassEntry } from "../data/parseSchedule";
import { ALL_PERIODS } from "./types";

export interface ScheduleItem {
  name: string;
  teacher: string;
  periods: string[];
  room: string;
}

// Returns "YYYY/MM/DD" key for today — used to look up the cycle day
export function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

// "YYYY/MM/DD" → "Wednesday, March 11"
export function formatDisplayDate(key: string): string {
  const [y, m, d] = key.split("/").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// "Azadian, Armen" → "Armen"
export function getFirstName(name: string): string {
  const parts = name.split(", ");
  return parts.length > 1 ? parts[1] : name;
}

// "Azadian, Armen" → "Armen Azadian"
export function getDisplayName(name: string): string {
  const parts = name.split(", ");
  return parts.length > 1 ? `${parts[1]} ${parts[0]}` : name;
}

// "Azadian, Armen" → "AA"
export function initials(name: string): string {
  return getDisplayName(name)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Returns free period letters for a student on a specific cycle day
export function getFreePeriodsByDay(student: Student, dayKey: string): string[] {
  const scheduled = new Set<string>();
  for (const cls of student.classes) {
    const val = cls.schedule[dayKey];
    if (val) val.split(",").map((p) => p.trim()).forEach((p) => scheduled.add(p));
  }
  return ALL_PERIODS.filter((p) => !scheduled.has(p));
}

// Returns today's class list sorted by period letter
export function getScheduleForDay(student: Student, dayKey: string): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  for (const cls of student.classes) {
    const val = cls.schedule[dayKey];
    if (!val) continue;
    const periods = val.split(",").map((p) => p.trim()).filter(Boolean);
    items.push({ name: cls.name, teacher: cls.teacher, periods, room: cls.room });
  }
  return items.sort((a, b) => a.periods[0].localeCompare(b.periods[0]));
}

// Filters out homeroom and house classes — only real academic classes shown in the buddy picker
export function getSearchableClasses(student: Student): ClassEntry[] {
  return student.classes.filter((cls) => {
    const hasSchedule = Object.keys(cls.schedule).length > 0;
    const isHomeroom = /homeroom/i.test(cls.name);
    const isHouse = /\b(red|green|silver|gold|blue)\s+house\b/i.test(cls.name);
    return hasSchedule && !isHomeroom && !isHouse;
  });
}
