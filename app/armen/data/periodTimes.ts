// 8-period rotating schedule at CGPS
// On Day 1: A=slot 1, B=slot 2, ..., H=slot 8
// Each day the sequence shifts back by 1 (Day 2: H=slot 1, A=slot 2, ...)

const SLOT_TIMES: [string, string][] = [
  ["8:20",  "9:10"],   // slot 1
  ["9:15",  "10:00"],  // slot 2
  ["10:05", "10:50"],  // slot 3
  ["10:55", "11:40"],  // slot 4
  ["11:45", "12:30"],  // slot 5
  ["12:35", "1:20"],   // slot 6
  ["1:25",  "2:10"],   // slot 7
  ["2:15",  "3:00"],   // slot 8
];

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// Returns the 1-based slot number for a period letter on a given cycle day.
// e.g. getPeriodSlot("A", "Day 1") → 1
//      getPeriodSlot("A", "Day 2") → 2
//      getPeriodSlot("H", "Day 2") → 1
export function getPeriodSlot(letter: string, cycleDay: string): number {
  const li = LETTERS.indexOf(letter.toUpperCase());
  const day = parseInt(cycleDay.replace("Day ", ""), 10);
  if (li === -1 || isNaN(day)) return -1;
  return ((li + day - 1) % 8) + 1;
}

// Returns a formatted time range string, e.g. "10:05 – 10:50"
export function getPeriodTime(letter: string, cycleDay: string): string {
  const slot = getPeriodSlot(letter, cycleDay);
  if (slot === -1) return "";
  const [start, end] = SLOT_TIMES[slot - 1];
  return `${start} – ${end}`;
}

// Returns just the start time with am/pm, e.g. "10:55 am" or "1:25 pm"
export function getPeriodStartTime(letter: string, cycleDay: string): string {
  const slot = getPeriodSlot(letter, cycleDay);
  if (slot === -1) return "";
  const [start] = SLOT_TIMES[slot - 1];
  const hour = parseInt(start.split(":")[0], 10);
  return `${start} ${hour >= 12 ? "pm" : "am"}`;
}
