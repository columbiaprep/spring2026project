// Maps student ID → graduation year (2-digit, e.g. 27 for 2027).
// Add students here until a full data source is available.
// Grade levels are relative to the 2025–2026 school year:
//   12th → 2026, 11th → 2027, 10th → 2028, 9th → 2029
export const GRAD_YEARS: Record<number, number> = {
  121450: 27, // Azadian, Armen   — 11th
  100314: 27, // Weiner, Jake     — 11th
  129473: 28, // Abarshalin, Daniel — 10th
  100250: 26, // Berman, Max      — 12th
  100532: 26, // Lawrence, Ryder  — 12th
};

// Override map: studentId → personal email for testing purposes.
// Remove entries when done testing.
const EMAIL_OVERRIDES: Record<number, string> = {
  // 121450: "youremail@gmail.com",
};

// Derives a CGPS email from a "Last, First" name and student ID.
// Returns null if the student's grad year is not yet in GRAD_YEARS.
// Example: ("Azadian, Armen", 121450) → "aazadian27@cgps.org"
export function getStudentEmail(name: string, studentId: number): string | null {
  if (EMAIL_OVERRIDES[studentId]) return EMAIL_OVERRIDES[studentId];

  const gradYear = GRAD_YEARS[studentId];
  if (gradYear === undefined) return null;

  const parts = name.split(", ");
  if (parts.length < 2) return null;

  const lastName  = parts[0].toLowerCase().replace(/[^a-z]/g, ""); // strip non-alpha
  const firstName = parts[1].toLowerCase().replace(/[^a-z]/g, "");
  const initial   = firstName[0];

  return `${initial}${lastName}${gradYear}@cgps.org`;
}
