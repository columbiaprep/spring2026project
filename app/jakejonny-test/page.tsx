"use client";
// Tells Next.js this file runs in the browser (not server-side)

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext"; // your auth context
import { useRouter } from "next/navigation"; // Next.js router

// ── TYPE DEFINITIONS ──
type Room = {
  id: number;
  roomNumber: string;
  className: string;
  classStart: string;
  classEnd: string;
  capacity: number;
  currentOccupancy: number;
  teacher: string;
  userBooked: boolean;
};

type OfficeHour = {
  id: number;
  name: string;
  subject: string;
  day: string;
  start: string;
  end: string;
  room: string;
  userBooked: boolean;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// ── Helper functions ──
function formatTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function isClassNow(start: string, end: string): boolean {
  const now = new Date();
  const current = now.toTimeString().slice(0, 5);
  return current >= start && current <= end;
}

function getOccupancyColor(current: number, capacity: number): string {
  const ratio = current / capacity;
  if (ratio >= 1) return "#ef4444";
  if (ratio >= 0.75) return "#f97316";
  if (ratio >= 0.5) return "#eab308";
  return "#22c55e";
}

// ── Dummy data ──
const DUMMY_ROOMS: Room[] = [
  {
    id: 1,
    roomNumber: "302W",
    className: "Algebra II",
    classStart: "09:15",
    classEnd: "10:00",
    capacity: 20,
    currentOccupancy: 3,
    teacher: "Mr. Anderson",
    userBooked: false,
  },
  {
    id: 2,
    roomNumber: "504N",
    className: "Physics",
    classStart: "11:45",
    classEnd: "12:30",
    capacity: 20,
    currentOccupancy: 20,
    teacher: "Ms. Bennett",
    userBooked: false,
  },
  {
    id: 3,
    roomNumber: "408N",
    className: "English",
    classStart: "13:20",
    classEnd: "14:10",
    capacity: 18,
    currentOccupancy: 6,
    teacher: "Mr. Chen",
    userBooked: false,
  },
  {
    id: 4,
    roomNumber: "201S",
    className: "AP Chemistry",
    classStart: "14:30",
    classEnd: "15:20",
    capacity: 16,
    currentOccupancy: 9,
    teacher: "Dr. Patel",
    userBooked: false,
  },
];

const DUMMY_OFFICE_HOURS: OfficeHour[] = [
  {
    id: 1,
    name: "Mr. Anderson",
    subject: "Algebra II",
    day: "Monday",
    start: "08:00",
    end: "08:45",
    room: "302W",
    userBooked: false,
  },
  {
    id: 2,
    name: "Ms. Bennett",
    subject: "Physics",
    day: "Tuesday",
    start: "13:00",
    end: "13:45",
    room: "504N",
    userBooked: false,
  },
  {
    id: 3,
    name: "Mr. Chen",
    subject: "English",
    day: "Wednesday",
    start: "15:30",
    end: "16:15",
    room: "408N",
    userBooked: false,
  },
  {
    id: 4,
    name: "Dr. Patel",
    subject: "AP Chemistry",
    day: "Thursday",
    start: "07:45",
    end: "08:30",
    room: "201S",
    userBooked: false,
  },
  {
    id: 5,
    name: "Ms. Rivera",
    subject: "AP History",
    day: "Friday",
    start: "12:00",
    end: "12:45",
    room: "110W",
    userBooked: false,
  },
];

// ── Sub-components ──
function DayPill({ day }: { day: string }) {
  const palette: Record<string, { bg: string; text: string }> = {
    Monday: { bg: "#1e3a5f", text: "#93c5fd" },
    Tuesday: { bg: "#1a3a2a", text: "#86efac" },
    Wednesday: { bg: "#3b1f5e", text: "#c4b5fd" },
    Thursday: { bg: "#3b2a0e", text: "#fcd34d" },
    Friday: { bg: "#3b1414", text: "#fca5a5" },
  };
  const colors = palette[day] || { bg: "#1e293b", text: "#94a3b8" };
  return (
    <span style={{
      background: colors.bg,
      color: colors.text,
      padding: "3px 12px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {day}
    </span>
  );
}

function OccupancyBar({ current, capacity }: { current: number; capacity: number }) {
  const pct = Math.min((current / capacity) * 100, 100);
  const color = getOccupancyColor(current, capacity);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "'IBM Plex Mono', monospace" }}>Occupancy</span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace" }}>{current}/{capacity}</span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 999,
          transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

function CGPSLogo() {
  return (
    <div style={{
      position: "relative",
      display: "inline-flex",
      alignItems: "flex-end",
      lineHeight: 0.82,
      paddingBottom: 8,
    }} aria-label="CGPS logo">
      <span style={{
        fontFamily: "'Times New Roman', Georgia, serif",
        fontSize: 56,
        fontWeight: 400,
        color: "#ffffff",
        letterSpacing: "-0.07em",
      }}>C</span>
      <span style={{
        fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
        fontSize: 56,
        fontWeight: 700,
        color: "#ffffff",
        letterSpacing: "-0.07em",
        marginLeft: -4,
      }}>GPS</span>
      <span aria-hidden="true" style={{
        position: "absolute",
        left: 1,
        bottom: 0,
        width: 44,
        height: 7,
        background: "#46b2e9",
      }} />
    </div>
  );
}

// ── Main component ──
export default function CGPSDashboard() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const router = useRouter();

  // Your existing states
  const [activeTab, setActiveTab] = useState<"rooms" | "officehours">("rooms");
  const [rooms, setRooms] = useState<Room[]>(DUMMY_ROOMS);
  const [bookedRoomId, setBookedRoomId] = useState<number | null>(null);
  const [roomMessage, setRoomMessage] = useState<string | null>(null);
  const [attested, setAttested] = useState(false);
  const [officeHours, setOfficeHours] = useState<OfficeHour[]>(DUMMY_OFFICE_HOURS);
  const [ohMessage, setOhMessage] = useState<string | null>(null);
  const [ohSearch, setOhSearch] = useState("");
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ name: "", subject: "", day: "Monday", start: "", end: "", room: "" });
  const [formSaved, setFormSaved] = useState(false);

  // Auto-dismiss messages
  useEffect(() => {
    if (!roomMessage) return;
    const t = setTimeout(() => setRoomMessage(null), 3000);
    return () => clearTimeout(t);
  }, [roomMessage]);

  useEffect(() => {
    if (!ohMessage) return;
    const t = setTimeout(() => setOhMessage(null), 3000);
    return () => clearTimeout(t);
  }, [ohMessage]);

  // ── Functions: booking, unbooking, form submission, etc. ──
  function bookRoom(id: number) {
    if (bookedRoomId !== null) {
      setRoomMessage("You already have a room booked. Unbook it first.");
      return;
    }
    setRooms(prev =>
      prev.map(room => {
        if (room.id !== id) return room;
        if (room.currentOccupancy >= room.capacity) {
          setRoomMessage(`Room ${room.roomNumber} is full.`);
          return room;
        }
        const newOcc = room.currentOccupancy + 1;
        setBookedRoomId(id);
        setRoomMessage(`✓ Booked a spot in Room ${room.roomNumber}! Your teacher has been notified.`);
        return { ...room, currentOccupancy: newOcc, userBooked: true };
      })
    );
  }

  function unbookRoom(id: number) {
    setRooms(prev =>
      prev.map(room => {
        if (room.id !== id) return room;
        const newOcc = Math.max(room.currentOccupancy - 1, 0);
        setBookedRoomId(null);
        setRoomMessage(`✓ Removed your booking from Room ${room.roomNumber}.`);
        return { ...room, currentOccupancy: newOcc, userBooked: false };
      })
    );
  }

  // Office hours booking functions
  function bookOfficeHour(id: number) {
    setOfficeHours(prev =>
      prev.map(oh => {
        if (oh.id !== id) return oh;
        if (oh.userBooked) {
          setOhMessage("You've already RSVP'd to this session.");
          return oh;
        }
        setOhMessage(`✓ RSVP'd for ${oh.name}'s office hours on ${oh.day}!`);
        return { ...oh, userBooked: true };
      })
    );
  }

  function unbookOfficeHour(id: number) {
    setOfficeHours(prev =>
      prev.map(oh => {
        if (oh.id !== id) return oh;
        setOhMessage(`✓ Cancelled your RSVP with ${oh.name}.`);
        return { ...oh, userBooked: false };
      })
    );
  }

  function handleTeacherFormSubmit() {
    const { name, subject, start, end, room } = teacherForm;
    if (!name || !subject || !start || !end || !room) return;
    const newEntry: OfficeHour = {
      ...teacherForm,
      id: Date.now(),
      userBooked: false,
    };
    setOfficeHours(prev => [...prev, newEntry]);
    setTeacherForm({ name: "", subject: "", day: "Monday", start: "", end: "", room: "" });
    setFormSaved(true);
    setTimeout(() => setFormSaved(false), 2500);
  }

  // Derived data
  const filteredOH = officeHours.filter(oh =>
    oh.name.toLowerCase().includes(ohSearch.toLowerCase()) ||
    oh.subject.toLowerCase().includes(ohSearch.toLowerCase()) ||
    oh.day.toLowerCase().includes(ohSearch.toLowerCase()) ||
    oh.room.toLowerCase().includes(ohSearch.toLowerCase())
  );

  const groupedOH = DAYS.reduce((acc: Record<string, OfficeHour[]>, day) => {
    const entries = filteredOH.filter(oh => oh.day === day);
    if (entries.length > 0) acc[day] = entries;
    return acc;
  }, {});

  // Render
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f1a",
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      color: "#e2e8f0",
    }}>

      {/* ── Inline styles for fonts and scrollbar ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; background: #0a0f1a; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
        input, select { outline: none; }
        button { cursor: pointer; font-family: inherit; }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .tab-btn { transition: all 0.2s ease; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .toast { animation: slideDown 0.3s ease; }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        background: "linear-gradient(180deg, #0d1526 0%, #0a0f1a 100%)",
        borderBottom: "1px solid #1e293b",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* School name */}
          <div style={{ paddingTop: 20, paddingBottom: 4 }}>
            <div style={{ marginBottom: 10 }}><CGPSLogo /></div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: "#38bdf8",
              letterSpacing: "0.2em",
              textTransform: "uppercase" as const,
            }}>
              Columbia Grammar & Preparatory School
            </div>
          </div>

          {/* Title + sign-in/out */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 0,
          }}>
            {/* Title */}
            <div>
              <h1 style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#f8fafc",
                margin: 0,
                letterSpacing: "-0.03em",
              }}>CGPS Portal</h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0", fontWeight: 400 }}>
                Room availability · Office hours · Bookings
              </p>
            </div>

            {/* Sign-in / Sign-out button */}
            <div style={{ position: "absolute", top: 20, right: 40, zIndex: 1000 }}>
              {user ? (
                <button onClick={signOut} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  border: "1px solid #38bdf8",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#38bdf8",
                }}>
                  <img src={user.photoURL || "/default-avatar.png"} alt="User Avatar" style={{
                    width: 24, height: 24, borderRadius: "50%", objectFit: "cover"
                  }} />
                  Sign Out
                </button>
              ) : (
                <button onClick={signInWithGoogle} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                }}>
                  {/* Google icon SVG */}
                  <svg viewBox="0 0 24 24" width="20" height="20" style={{ display: "block" }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, marginTop: 8 }}>
            {[
              { id: "rooms" as const, label: "Quiet Spaces", icon: "🏫" },
              { id: "officehours" as const, label: "Office Hours", icon: "📋" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="tab-btn"
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px 8px 0 0",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  background: activeTab === tab.id ? "#0f172a" : "transparent",
                  color: activeTab === tab.id ? "#38bdf8" : "#475569",
                  borderTop: activeTab === tab.id ? "2px solid #38bdf8" : "2px solid transparent",
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 32px 64px" }}>
        {/* ROOMS TAB */}
        {activeTab === "rooms" && (
          <div>
            {/* Your existing rooms tab content, including attestation checkbox, messages, and room grid */}
            {/* You can copy your prior rooms code here, unchanged */}
            {/* For brevity, I won't paste it all again, but just keep your JSX for that section */}
            {/* ... your rooms code ... */}
            {/* Example placeholder */}
            <div>
              {/* Your Room booking UI here, as previously */}
            </div>
          </div>
        )}

        {/* OFFICE HOURS TAB */}
        {activeTab === "officehours" && (
          <div>
            {/* Your existing office hours content, including form, search, grouped sessions */}
            {/* ... your office hours code ... */}
            {/* Make sure to include all your JSX here */}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid #1e293b",
        padding: "20px 32px",
        textAlign: "center",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        color: "#334155",
        letterSpacing: "0.08em",
      }}>
        COLUMBIA GRAMMAR & PREPARATORY SCHOOL · STUDENT PORTAL · {new Date().getFullYear()}
      </footer>
    </div>
  );
}