import fs from "fs";
import path from "path";

// One class/activity row for a student, including its 8-day rotating schedule.
export interface ClassEntry {
  rawName: string;
  name: string; // cleaned display name (course code and section stripped)
  teacher: string;
  gradingPeriods: string;
  schedule: Record<string, string>; // "Day 1" -> "A", "Day 2" -> "B", etc.
  room: string;
}

// A single student with all their classes loaded from the CSV.
// optedIn defaults to true at load time; the student can change it on the opt-in screen.
export interface Student {
  name: string; // "Last, First" as in CSV
  id: number;
  optedIn: boolean;
  classes: ClassEntry[];
}

const DAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8"];

// Parses a single CSV row into an array of field strings.
// Handles quoted fields that contain commas, and "" as an escaped quote character.
function parseCSVRow(row: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      // "" inside a quoted field is an escaped literal quote character.
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  // Push the last field (no trailing comma in CSV).
  fields.push(current);
  return fields;
}

// Strips the leading course code and trailing section/semester suffix from raw
// class names so students see human-readable titles.
//
// Raw format examples:
//   "3029 - 1: Honors Pre-Calculus - 1"          → "Honors Pre-Calculus"
//   "12055 - Fall - 1: Adv. Projects: CS - Fall - 1" → "Adv. Projects: CS"
//   "13024 - 3: Green House"                      → "Green House"
function extractClassName(raw: string): string {
  const colonIdx = raw.indexOf(": ");
  if (colonIdx === -1) return raw;
  let name = raw.slice(colonIdx + 2);
  // Remove trailing " - 1" or " - Fall - 2" section identifiers.
  name = name.replace(/ - (?:Fall - )?\d+$/, "");
  return name.trim();
}

// Reads and parses the schedule CSV, grouping rows by student ID.
// Called once per request from the server component; each call re-reads the file.
export function loadStudents(): Student[] {
  const csvPath = path.join(
    process.cwd(),
    "app/armen/data/schedule-data/schedule.csv"
  );
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim().length > 0);

  // Skip the header row.
  const dataLines = lines.slice(1);

  // Use a Map so multiple CSV rows for the same student get merged into one object.
  const studentMap = new Map<number, Student>();

  for (const line of dataLines) {
    const fields = parseCSVRow(line);
    if (fields.length < 14) continue; // skip malformed rows

    const studentName = fields[0].trim();
    const personId = parseInt(fields[1].trim(), 10);
    const rawClass = fields[2].trim();
    const teacher = fields[3].trim();
    const gradingPeriods = fields[4].trim();
    // Columns 5–12 map to Day 1 through Day 8 period assignments.
    const dayValues = fields.slice(5, 13);
    const room = fields[13]?.trim() ?? "";

    if (isNaN(personId)) continue;

    // Build schedule map, omitting days where the class doesn't meet ("-" or empty).
    const schedule: Record<string, string> = {};
    DAYS.forEach((day, i) => {
      const val = dayValues[i]?.trim() ?? "";
      if (val && val !== "-") {
        schedule[day] = val;
      }
    });

    const classEntry: ClassEntry = {
      rawName: rawClass,
      name: extractClassName(rawClass),
      teacher,
      gradingPeriods,
      schedule,
      room,
    };

    // Create the student record on first encounter; subsequent rows just add classes.
    if (!studentMap.has(personId)) {
      studentMap.set(personId, {
        name: studentName,
        id: personId,
        optedIn: true, // all students default to visible until they choose otherwise
        classes: [],
      });
    }

    studentMap.get(personId)!.classes.push(classEntry);
  }

  return Array.from(studentMap.values());
}
