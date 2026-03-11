"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Student } from "./data/parseSchedule";

interface Props {
  students: Student[];
}

// Login/sign-in screen. Validates a student ID and navigates to that
// student's home page. Students array is pre-loaded by the server component.
export default function StudyBuddiesApp({ students }: Props) {
  const router = useRouter();
  const [inputId, setInputId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the ID input on mount so the user can start typing immediately.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = inputId.trim();
    if (!trimmed) return;

    const id = parseInt(trimmed, 10);
    if (isNaN(id)) {
      setError("Please enter a valid numeric student ID.");
      return;
    }

    const student = students.find((s) => s.id === id);
    if (student) {
      // Show loading state while Next.js navigates to the student's page.
      setLoading(true);
      router.push(`/armen/${student.id}`);
    } else {
      setError("Student ID not found. Please try again.");
      setInputId("");
      inputRef.current?.focus();
    }
  };

  // Allow submitting with the Enter key for faster sign-in.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

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
        <div className="flex flex-col items-center gap-3">
          <BarcodeIcon />
          <p className="text-sm text-center leading-relaxed" style={{ color: "#A8BBCF" }}>
            Enter your student ID to sign in
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={inputId}
            onChange={(e) => {
              setInputId(e.target.value);
              setError(""); // clear error when the user starts retyping
            }}
            onKeyDown={handleKeyDown}
            placeholder="Student ID"
            disabled={loading}
            className="w-full rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest outline-none border transition-all disabled:opacity-50"
            style={{
              backgroundColor: "#1C2B4A",
              borderColor: "#344B76",
              color: "#FFFFFF",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#4878B0")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#344B76")}
          />
          {/* Use e.currentTarget (always the button element) instead of e.target,
              which can resolve to a child text node and silently fail. */}
          <button
            onClick={handleSubmit}
            disabled={loading || !inputId.trim()}
            className="w-full font-semibold rounded-xl py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm tracking-[0.12em] uppercase"
            style={{ backgroundColor: "#4878B0" }}
            onMouseEnter={(e) =>
              !loading && (e.currentTarget.style.backgroundColor = "#5789C1")
            }
            onMouseLeave={(e) =>
              !loading && (e.currentTarget.style.backgroundColor = "#4878B0")
            }
          >
            {loading ? "Loading…" : "Continue"}
          </button>
        </div>

        {error && (
          <p className="text-sm text-center" style={{ color: "#E07070" }}>
            {error}
          </p>
        )}
      </div>

      <p className="mt-10 text-xs tracking-wider uppercase" style={{ color: "#344B76" }}>
        Columbia Grammar &amp; Preparatory School
      </p>
    </div>
  );
}

// ── CGPS Logo Mark ────────────────────────────────────────────────────────────
// Renders the "CGPS" logotype with a serif "C" and a blue accent underline.

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

// ── Barcode icon ──────────────────────────────────────────────────────────────
// Decorative SVG barcode using alternating narrow/wide bars to hint at student
// ID scanning. Every 3rd bar is 2px wide; the rest are 1px.

function BarcodeIcon() {
  const bars = [0, 3, 5, 9, 12, 15, 19, 22, 25, 29, 32, 35, 39, 42, 45, 49, 52, 55, 59, 62];
  return (
    <svg
      width="64"
      height="40"
      viewBox="0 0 64 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.25 }}
    >
      {bars.map((x, i) => (
        <rect key={i} x={x} y={0} width={i % 3 === 0 ? 2 : 1} height={40} fill="white" />
      ))}
    </svg>
  );
}
