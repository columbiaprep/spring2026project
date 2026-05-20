"use client";

import type { Student } from "../data/parseSchedule";
import { C } from "../lib/types";
import { getDisplayName, initials } from "../lib/helpers";
import { CGPSMark } from "../components/ui";

interface Props {
  student: Student;
  onJoin: () => void;
  onSkip: () => void;
}

export default function OptInScreen({ student, onJoin, onSkip }: Props) {
  const displayName = getDisplayName(student.name);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: C.navyBg }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <CGPSMark />

        {/* Avatar circle with initials */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white select-none"
          style={{ backgroundColor: C.cgpsBlue }}
        >
          {initials(student.name)}
        </div>

        {/* Welcome message */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-3">{displayName}</h1>
          <p className="text-sm leading-relaxed" style={{ color: C.softText }}>
            Study Buddies matches you with classmates who share your classes and
            free periods — so you can find time to study together.
          </p>
        </div>

        {/* Join / browse-only buttons */}
        <div
          className="w-full rounded-2xl border p-6 flex flex-col gap-3"
          style={{ backgroundColor: C.navyCard, borderColor: C.navyBorder }}
        >
          <p className="text-center text-sm font-medium text-white mb-1">
            Join Study Buddies?
          </p>

          <button
            onClick={onJoin}
            className="w-full text-white font-semibold rounded-xl py-3.5 text-sm tracking-[0.1em] uppercase transition-colors"
            style={{ backgroundColor: C.cgpsBlue }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "#5789C1")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = C.cgpsBlue)
            }
          >
            Yes — Join Study Buddies
          </button>

          <button
            onClick={onSkip}
            className="w-full font-medium rounded-xl py-3.5 text-sm tracking-[0.08em] uppercase transition-colors border"
            style={{ color: C.softText, borderColor: C.navyBorder }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = C.navyBorder;
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = C.softText;
            }}
          >
            Browse only — stay hidden
          </button>
        </div>

        <p className="text-xs" style={{ color: C.navyBorder }}>
          You can change this anytime from your home screen
        </p>
      </div>
    </div>
  );
}
