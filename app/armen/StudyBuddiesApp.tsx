"use client";

import { useAuth } from "@/context/AuthContext";
import { getStudentEmail } from "./data/studentGradYears";
import type { Student } from "./data/parseSchedule";
import StudentHome from "./StudentHome";

interface Props {
  students: Student[];
}

export default function StudyBuddiesApp({ students }: Props) {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const matchedStudent = user?.email
    ? students.find(
        (s) => getStudentEmail(s.name, s.id)?.toLowerCase() === user.email!.toLowerCase()
      )
    : undefined;

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#1C2B4A" }}
      >
        <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user && matchedStudent) {
    return <StudentHome currentStudent={matchedStudent} allStudents={students} />;
  }

  const notFound = user !== null && !matchedStudent;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#1C2B4A" }}
    >
      {/* Logo + wordmark */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <CGPSMark />
        <div className="flex items-center gap-3">
          <div className="h-px w-8" style={{ backgroundColor: "#2E4070" }} />
          <p
            className="text-xs tracking-[0.3em] uppercase font-semibold"
            style={{ color: "#C9A227" }}
          >
            Study Buddies
          </p>
          <div className="h-px w-8" style={{ backgroundColor: "#2E4070" }} />
        </div>
      </div>

      {/* Login card */}
      <div
        className="w-full max-w-sm rounded-2xl border p-8 flex flex-col items-center gap-7"
        style={{ backgroundColor: "#243361", borderColor: "#2E4070" }}
      >
        {notFound ? (
          <>
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm" style={{ color: "#A8BBCF" }}>
                Signed in as{" "}
                <span className="font-medium text-white">{user!.email}</span>
              </p>
              <p className="text-sm" style={{ color: "#E07070" }}>
                This account is not in the Study Buddies system. Please use
                your CGPS school email.
              </p>
            </div>
            <button
              onClick={signOut}
              className="w-full font-semibold rounded-xl py-3 text-sm tracking-[0.12em] uppercase transition-colors text-white"
              style={{ backgroundColor: "#4878B0" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#5789C1")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#4878B0")
              }
            >
              Sign out and try again
            </button>
          </>
        ) : (
          <>
            <p
              className="text-sm text-center leading-relaxed"
              style={{ color: "#A8BBCF" }}
            >
              Sign in with your CGPS Google account to continue
            </p>
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium transition-colors"
              style={{ backgroundColor: "#FFFFFF", color: "#111827" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#F9FAFB")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#FFFFFF")
              }
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </>
        )}
      </div>

      <p
        className="mt-10 text-xs tracking-wider uppercase"
        style={{ color: "#344B76" }}
      >
        Columbia Grammar &amp; Preparatory School
      </p>
    </div>
  );
}

function CGPSMark() {
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-baseline leading-none">
        <span
          className="font-serif text-white"
          style={{ fontSize: "2.4rem", lineHeight: 1 }}
        >
          C
        </span>
        <span
          className="font-bold text-white tracking-tight"
          style={{ fontSize: "1.9rem", lineHeight: 1 }}
        >
          GPS
        </span>
      </div>
      <div
        className="h-[3px] w-6 rounded-full mt-1"
        style={{ backgroundColor: "#4A9ED4" }}
      />
    </div>
  );
}
