import { loadStudents } from "./data/parseSchedule";
import StudyBuddiesApp from "./StudyBuddiesApp";

// Server component — reads the CSV once per request and passes data to the
// client component. No "use client" here so fs/path work fine.
export default function Page() {
  const students = loadStudents();
  return <StudyBuddiesApp students={students} />;
}
