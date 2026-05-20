"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const features = [
  {
    title: "3D CGPS Map",
    description: "Explore the school in 3D. Click any room to see availability and book a study spot.",
    href: "/grant-test",
    icon: "🗺️",
    border: "hover:border-blue-500",
  },
  {
    title: "Office Hours & Rooms",
    description: "Book a quiet study space or RSVP for teacher office hours.",
    href: "/jakejonny-test",
    icon: "📋",
    border: "hover:border-cyan-500",
  },
  {
    title: "Study Buddies",
    description: "Find classmates to study with. Match by class and free period.",
    href: "/armen",
    icon: "🤝",
    border: "hover:border-purple-500",
  },
];

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20" style={{ background: "#0a0f1a", color: "#e2e8f0" }}>
      <div className="mb-2 text-xs tracking-widest uppercase" style={{ color: "#38bdf8", fontFamily: "monospace" }}>
        Columbia Grammar &amp; Preparatory School
      </div>
      <h1 className="text-4xl font-bold mb-3 tracking-tight text-white">CGPS Student Portal</h1>
      <p className="mb-12 text-base" style={{ color: "#64748b" }}>
        {loading ? "" : user ? `Welcome, ${user.displayName?.split(" ")[0]}` : "Sign in to get started"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`rounded-2xl p-6 flex flex-col gap-3 border border-white/10 transition-all duration-200 hover:scale-105 hover:shadow-xl ${f.border}`}
            style={{ background: "#0f172a" }}
          >
            <span className="text-4xl">{f.icon}</span>
            <h2 className="text-base font-semibold text-white">{f.title}</h2>
            <p className="text-sm" style={{ color: "#94a3b8" }}>{f.description}</p>
          </Link>
        ))}
      </div>

      {!loading && !user && (
        <p className="mt-10 text-sm" style={{ color: "#475569" }}>
          <Link href="/login" className="underline" style={{ color: "#38bdf8" }}>Sign in</Link>
          {" "}to book rooms and find study buddies.
        </p>
      )}
    </div>
  );
import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect immediately to the 3D map page
  redirect('/grant-test')
}
