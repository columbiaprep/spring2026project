"use client";

import { useEffect, useState } from "react";
import { fetchStudents } from "./data/actions";
import type { Student } from "./data/parseSchedule";
import StudyBuddiesApp from "./StudyBuddiesApp";

export default function Page() {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchStudents().then(setStudents);
  }, []);

  if (students.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#1C2B4A" }}
      >
        <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  return <StudyBuddiesApp students={students} />;
}
