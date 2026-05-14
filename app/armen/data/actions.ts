"use server";
import { loadStudents as _load } from "./parseSchedule";
import type { Student } from "./parseSchedule";

export async function fetchStudents(): Promise<Student[]> {
  return _load();
}
