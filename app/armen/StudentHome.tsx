"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase-config";
import { useAuth } from "@/context/AuthContext";
import type { Student } from "./data/parseSchedule";
import { cycleDays } from "./data/cycleDays";
import { getTodayKey } from "./lib/helpers";
import { findMatches } from "./lib/matching";
import type { View } from "./lib/types";
import { C } from "./lib/types";
import OptInScreen from "./screens/OptInScreen";
import HomeScreen from "./screens/HomeScreen";
import ResultsScreen from "./screens/ResultsScreen";
import DetailScreen from "./screens/DetailScreen";

interface Props {
  currentStudent: Student;
  allStudents: Student[];
}

// Writes the student's opt-in choice to Firestore (collection: studyBuddies_users).
// Document ID is their email address. See schema.txt for full field definitions.
async function saveOptIn(email: string, student: Student, optedIn: boolean) {
  await setDoc(doc(db, "studyBuddies_users", email), {
    studentId: student.id,
    name: student.name,
    email,
    optedIn,
    updatedAt: serverTimestamp(),
  });
}

// Screen router — decides which screen to render based on `view` state.
// All actual UI lives in the screens/ folder.
export default function StudentHome({ currentStudent, allStudents }: Props) {
  const router = useRouter();
  const { user, signOut: googleSignOut } = useAuth();
  const [view, setView] = useState<View>({ type: "optin" });
  const [optedIn, setOptedIn] = useState<boolean | null>(null);
  // null = still loading from Firestore; true/false = loaded
  const [firestoreLoaded, setFirestoreLoaded] = useState(false);

  const todayKey = getTodayKey();
  const cycleDay = cycleDays[todayKey] ?? null;

  // On mount: check Firestore for a saved opt-in choice.
  // If one exists, restore it and skip the opt-in screen.
  useEffect(() => {
    if (!user?.email) return;
    const email = user.email;

    getDoc(doc(db, "studyBuddies_users", email)).then((snap) => {
      if (snap.exists()) {
        const saved = snap.data().optedIn as boolean;
        setOptedIn(saved);
        currentStudent.optedIn = saved;
        setView({ type: "home" });
      }
      setFirestoreLoaded(true);
    }).catch(() => {
      // If Firestore is unreachable, still show the opt-in screen
      setFirestoreLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Only recompute matches when the selected class changes
  const matches = useMemo(
    () => view.type === "results" ? findMatches(currentStudent, allStudents, view.className) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view.type === "results" ? view.className : null, optedIn]
  );

  const handleOptIn = async (choice: boolean) => {
    setOptedIn(choice);
    currentStudent.optedIn = choice;
    if (user?.email) {
      await saveOptIn(user.email, currentStudent, choice);
    }
    setView({ type: "home" });
  };

  const handleSignOut = async () => {
    await googleSignOut();
    router.push("/armen");
  };

  // Show a spinner while we check Firestore so the opt-in screen
  // doesn't flash briefly for returning students.
  if (!firestoreLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: C.navyBg }}
      >
        <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  if (view.type === "optin") {
    return <OptInScreen student={currentStudent} onJoin={() => handleOptIn(true)} onSkip={() => handleOptIn(false)} />;
  }

  if (view.type === "home") {
    return (
      <HomeScreen
        currentStudent={currentStudent}
        optedIn={optedIn ?? false}
        cycleDay={cycleDay}
        todayKey={todayKey}
        onSelectClass={(cls) => setView({ type: "results", className: cls })}
        onToggleOptIn={async () => {
          const next = !optedIn;
          setOptedIn(next);
          currentStudent.optedIn = next;
          if (user?.email) {
            await saveOptIn(user.email, currentStudent, next);
          }
        }}
        onSignOut={handleSignOut}
      />
    );
  }

  if (view.type === "results") {
    return (
      <ResultsScreen
        className={view.className}
        matches={matches}
        onBack={() => setView({ type: "home" })}
        onSelectMatch={(match) => setView({ type: "detail", className: view.className, match })}
      />
    );
  }

  if (view.type === "detail") {
    return (
      <DetailScreen
        match={view.match}
        todayKey={todayKey}
        currentStudent={currentStudent}
        onBack={() => setView({ type: "results", className: view.className })}
      />
    );
  }

  return null;
}
