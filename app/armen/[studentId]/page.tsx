import { loadStudents } from "../data/parseSchedule";
import StudentHome from "./StudentHome";

interface Props {
  params: Promise<{ studentId: string }>;
}

export default async function StudentPage({ params }: Props) {
  const { studentId } = await params;
  const students = loadStudents();
  const id = parseInt(studentId, 10);
  const student = students.find((s) => s.id === id);

  if (!student) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Student not found</p>
          <p className="text-zinc-400 text-sm mb-6">ID {studentId} is not in the system.</p>
          <a
            href="/armen"
            className="text-indigo-400 hover:text-indigo-300 text-sm underline"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return <StudentHome currentStudent={student} allStudents={students} />;
}
