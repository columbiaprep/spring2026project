"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, DocumentData } from "firebase/firestore";
import { db } from "@/firebase-config";

/* ───────────────────────────────
   TYPES (SAFE FIRESTORE)
─────────────────────────────── */

type Room = {
  id: string;
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
  id: string;
  teacherName: string;
  subject: string;
  day: string;
  start: string;
  end: string;
  room: string;
  userBooked: boolean;
};

/* ───────────────────────────────
   MOCK DATA
─────────────────────────────── */

const MOCK_ROOMS: Room[] = [
  {
    id: "1",
    roomNumber: "201",
    className: "AP Biology",
    classStart: "09:00",
    classEnd: "10:30",
    capacity: 10,
    currentOccupancy: 4,
    teacher: "Ms. Johnson",
    userBooked: false,
  },
];

const MOCK_OFFICE_HOURS: OfficeHour[] = [
  {
    id: "1",
    teacherName: "Ms. Johnson",
    subject: "AP Biology",
    day: "Monday",
    start: "15:00",
    end: "16:00",
    room: "201",
    userBooked: false,
  },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/* ───────────────────────────────
   SAFE TIME SYSTEM (FIXED)
─────────────────────────────── */

function toMinutes(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function isClassNow(start: string, end: string): boolean {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= toMinutes(start) && current <= toMinutes(end);
}

/* ───────────────────────────────
   COMPONENT
─────────────────────────────── */

export default function CGPSDashboard() {
  const { user, signInWithGoogle, signOut } = useAuth();

  const [attested, setAttested] = useState(false);
  const [activeTab, setActiveTab] = useState<"rooms" | "officehours">("rooms");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [officeHours, setOfficeHours] = useState<OfficeHour[]>([]);

  const [loading, setLoading] = useState(true);

  const [bookedRoomId, setBookedRoomId] = useState<string | null>(null);
  const [roomBookingDocId, setRoomBookingDocId] = useState<string | null>(null);
  const [ohRsvpDocIds, setOhRsvpDocIds] = useState<Record<string, string>>({});
  const [roomMessage, setRoomMessage] = useState<string | null>(null);
  const [ohMessage, setOhMessage] = useState<string | null>(null);

  const [ohSearch, setOhSearch] = useState("");

  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    subject: "",
    day: "Monday",
    start: "",
    end: "",
    room: "",
  });

  const [formSaved, setFormSaved] = useState(false);

  /* ───────────────────────────────
     DEBUG LOG (PRESERVED)
  ─────────────────────────────── */

  console.log(db);

  /* ───────────────────────────────
     FIRESTORE ROOMS
  ─────────────────────────────── */

  useEffect(() => {
    console.log("📡 Fetching rooms...");

    let alive = true;

    async function fetchRooms() {
      try {
        const snap = await getDocs(collection(db, "rooms"));

        if (!alive) return;

        if (snap.empty) {
          setRooms(MOCK_ROOMS);
          return;
        }

        const parsed: Room[] = snap.docs.map((docSnap) => {
          const d = docSnap.data() as DocumentData;

          return {
            id: docSnap.id,
            roomNumber: String(d.roomNumber ?? ""),
            className: String(d.className ?? ""),
            classStart: String(d.classStart ?? "00:00"),
            classEnd: String(d.classEnd ?? "00:00"),
            capacity: Math.max(Number(d.capacity ?? 1), 1),
            currentOccupancy: Math.max(Number(d.currentOccupancy ?? 0), 0),
            teacher: String(d.teacher ?? ""),
            userBooked: false,
          };
        });

        setRooms(parsed);
      } catch (err) {
        console.error(err);
        setRooms(MOCK_ROOMS);
      }
    }

    fetchRooms();

    return () => {
      alive = false;
    };
  }, [db]);

  /* ───────────────────────────────
     FIRESTORE OFFICE HOURS
  ─────────────────────────────── */

  useEffect(() => {
    console.log("📡 Fetching office hours...");

    let alive = true;

    async function fetchOH() {
      try {
        const snap = await getDocs(collection(db, "officeHours"));

        if (!alive) return;

        if (snap.empty) {
          setOfficeHours(MOCK_OFFICE_HOURS);
          setLoading(false);
          return;
        }

        const parsed: OfficeHour[] = snap.docs.map((docSnap) => {
          const d = docSnap.data() as DocumentData;

          return {
            id: docSnap.id,
            teacherName: String(d.teacherName ?? ""),
            subject: String(d.subject ?? ""),
            day: String(d.day ?? "Monday"),
            start: String(d.start ?? "00:00"),
            end: String(d.end ?? "00:00"),
            room: String(d.room ?? ""),
            userBooked: false,
          };
        });

        setOfficeHours(parsed);
      } catch (err) {
        console.error(err);
        setOfficeHours(MOCK_OFFICE_HOURS);
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchOH();

    return () => {
      alive = false;
    };
  }, [db]);

  /* ───────────────────────────────
     SAFE DERIVED DATA (NO CRASHES)
  ─────────────────────────────── */

  const filteredOH = useMemo(() => {
    const q = ohSearch.toLowerCase();

    return officeHours.filter((oh) =>
      `${oh.teacherName} ${oh.subject} ${oh.day} ${oh.room}`
        .toLowerCase()
        .includes(q)
    );
  }, [officeHours, ohSearch]);

  const groupedOH = useMemo(() => {
    const acc: Record<string, OfficeHour[]> = Object.fromEntries(
      DAYS.map(d => [d, []])
    );

    for (const oh of filteredOH) {
      acc[oh.day]?.push(oh);
    }

    return acc;
  }, [filteredOH]);

  /* ───────────────────────────────
     EMAIL (SAFE)
  ─────────────────────────────── */

  const sendEmail = useCallback(async (to: string, subject: string, html: string) => {
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  /* ───────────────────────────────
     BOOKING (SIDE-EFFECT SAFE)
  ─────────────────────────────── */

  async function bookRoom(id: string) {
    if (bookedRoomId) {
      setRoomMessage("You already have a room booked.");
      return;
    }

    const target = rooms.find(r => r.id === id);
    if (!target) return;

    if (target.currentOccupancy >= target.capacity) {
      setRoomMessage(`Room ${target.roomNumber} is full.`);
      return;
    }

    setRooms(prev =>
      prev.map(room =>
        room.id === id
          ? { ...room, currentOccupancy: room.currentOccupancy + 1, userBooked: true }
          : room
      )
    );
    setBookedRoomId(id);
    setRoomMessage(`✓ Booked Room ${target.roomNumber}`);

    try {
      const bookingRef = await addDoc(collection(db, "roomBookings"), {
        userEmail: user?.email ?? "anonymous",
        roomNumber: target.roomNumber,
        bookedAt: serverTimestamp(),
      });
      setRoomBookingDocId(bookingRef.id);
    } catch (err) {
      console.error("Failed to save room booking:", err);
    }
  }

  async function unbookRoom(id: string) {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== id) return room;
        setBookedRoomId(null);
        setRoomMessage(`✓ Unbooked Room ${room.roomNumber}`);
        return { ...room, currentOccupancy: Math.max(room.currentOccupancy - 1, 0), userBooked: false };
      })
    );

    if (roomBookingDocId) {
      try {
        await deleteDoc(doc(db, "roomBookings", roomBookingDocId));
        setRoomBookingDocId(null);
      } catch (err) {
        console.error("Failed to delete room booking:", err);
      }
    }
  }

  async function bookOfficeHour(id: string) {
    const target = officeHours.find(o => o.id === id);
    if (!target) return;

    if (target.userBooked) {
      setOhMessage("Already RSVP'd");
      return;
    }

    setOfficeHours(prev => prev.map(o => o.id === id ? { ...o, userBooked: true } : o));
    setOhMessage(`✓ RSVP'd ${target.teacherName}`);

    try {
      const rsvpRef = await addDoc(collection(db, "officeHourRSVPs"), {
        userEmail: user?.email ?? "anonymous",
        officeHourId: id,
        rsvpAt: serverTimestamp(),
      });
      setOhRsvpDocIds(prev => ({ ...prev, [id]: rsvpRef.id }));
    } catch (err) {
      console.error("Failed to save RSVP:", err);
    }
  }

  async function unbookOfficeHour(id: string) {
    setOfficeHours((prev) => prev.map((oh) => oh.id === id ? { ...oh, userBooked: false } : oh));
    setOhMessage("✓ Cancelled RSVP");

    const rsvpDocId = ohRsvpDocIds[id];
    if (rsvpDocId) {
      try {
        await deleteDoc(doc(db, "officeHourRSVPs", rsvpDocId));
        setOhRsvpDocIds(prev => { const next = { ...prev }; delete next[id]; return next; });
      } catch (err) {
        console.error("Failed to delete RSVP:", err);
      }
    }
  }

  /* ───────────────────────────────
     LOADING GUARD (CRASH SAFE)
  ─────────────────────────────── */

  if (loading) {
    return <div style={{ color: "white", padding: 40 }}>Loading CGPS Portal...</div>;
  }

  function formatTime(time: string) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const hour = h % 12 || 12;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/* ───────────────────────────────
   LOGO (UI PLACEHOLDER - SAFE)
─────────────────────────────── */
function CGPSLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: "linear-gradient(135deg,#1d4ed8,#38bdf8)",
      }} />
      <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.08em" }}>
        CGPS
      </div>
    </div>
  );
}

/* ───────────────────────────────
   OCCUPANCY BAR
─────────────────────────────── */
function OccupancyBar({ current, capacity }: { current: number; capacity: number }) {
  const pct = Math.min(100, (current / capacity) * 100);

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 11,
        color: "#64748b",
        marginBottom: 6,
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        <span>Occupancy</span>
        <span>{current}/{capacity}</span>
      </div>

      <div style={{
        width: "100%",
        height: 6,
        background: "#1e293b",
        borderRadius: 999,
        overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: pct > 90 ? "#ef4444" : "#38bdf8",
        }} />
      </div>
    </div>
  );
}

async function handleTeacherFormSubmit() {
  if (
    !teacherForm.name ||
    !teacherForm.subject ||
    !teacherForm.start ||
    !teacherForm.end
  ) {
    return;
  }

  const docData = {
    teacherName: teacherForm.name,
    subject: teacherForm.subject,
    day: teacherForm.day,
    start: teacherForm.start,
    end: teacherForm.end,
    room: teacherForm.room,
    postedAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, "officeHours"), docData);

    const newOH: OfficeHour = {
      id: docRef.id,
      teacherName: teacherForm.name,
      subject: teacherForm.subject,
      day: teacherForm.day,
      start: teacherForm.start,
      end: teacherForm.end,
      room: teacherForm.room,
      userBooked: false,
    };

    setOfficeHours((prev) => [newOH, ...prev]);
    setFormSaved(true);
    setTimeout(() => setFormSaved(false), 2000);

    setTeacherForm({
      name: "",
      subject: "",
      day: "Monday",
      start: "",
      end: "",
      room: "",
    });
  } catch (err) {
    console.error("Failed to post office hours:", err);
  }
}
/* ───────────────────────────────
   DAY PILL
─────────────────────────────── */
function DayPill({ day }: { day: string }) {
  return (
    <div style={{
      padding: "6px 12px",
      borderRadius: 999,
      background: "#0f172a",
      border: "1px solid #1e293b",
      fontSize: 12,
      fontWeight: 700,
      color: "#38bdf8",
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {day}
    </div>
  );
}
  /* ───────────────────────────────
     🔥 YOUR ORIGINAL UI (UNCHANGED BELOW)
─────────────────────────────── */

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f1a",
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      color: "#e2e8f0",
    }}>

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

      <header style={{
        background: "linear-gradient(180deg, #0d1526 0%, #0a0f1a 100%)",
        borderBottom: "1px solid #1e293b",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

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

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 0,
          }}>
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

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 32px 64px" }}>
        {activeTab === "rooms" && (
          <div>
            <div style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={attested}
                  onChange={(e) => setAttested(e.target.checked)}
                  style={{
                    marginTop: 2,
                    width: 18,
                    height: 18,
                    accentColor: "#38bdf8",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>
                  I attest that I will be using this classroom space for <strong>quiet, independent work</strong> and will respect the teacher and ongoing class. I understand that disruptive behavior may result in loss of booking privileges.
                </span>
              </label>
            </div>

            {roomMessage && (
              <div className="toast" style={{
                background: roomMessage.startsWith("✓") ? "#065f46" : "#991b1b",
                border: roomMessage.startsWith("✓") ? "1px solid #047857" : "1px solid #b91c1c",
                color: roomMessage.startsWith("✓") ? "#86efac" : "#fca5a5",
                borderRadius: 10,
                padding: "12px 18px",
                marginBottom: 20,
                fontSize: 14,
                fontWeight: 600,
              }}>
                {roomMessage}
              </div>
            )}

            {!attested ? (
              <div style={{
                background: "#0f172a",
                border: "1px dashed #1e293b",
                borderRadius: 16,
                padding: "56px 24px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>☝️</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#475569" }}>
                  Check the box above to view and book rooms
                </div>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 16,
              }}>
                {rooms.map(room => {
                  const inSession = isClassNow(room.classStart, room.classEnd);
                  const isFull = room.currentOccupancy >= room.capacity;
                  const isDisabled = bookedRoomId !== null && bookedRoomId !== room.id;

                  let statusLabel = "Available";
                  let statusBg = "#052e16";
                  let statusColor = "#86efac";

                  if (inSession) {
                    statusLabel = "Class in Session";
                    statusBg = "#3b0f0f";
                    statusColor = "#fca5a5";
                  } else if (isFull) {
                    statusLabel = "Full";
                    statusBg = "#1c1917";
                    statusColor = "#78716c";
                  } else if (room.userBooked) {
                    statusLabel = "Your Booking";
                    statusBg = "#0c1a3b";
                    statusColor = "#93c5fd";
                  }

                  return (
                    <div
                      key={room.id}
                      className="card-hover"
                      style={{
                        background: room.userBooked
                          ? "linear-gradient(135deg, #0c1a3b, #0f172a)"
                          : "#0f172a",
                        border: room.userBooked ? "1px solid #1d4ed8" : "1px solid #1e293b",
                        borderRadius: 16,
                        padding: 22,
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div>
                          <div style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 22,
                            fontWeight: 700,
                            color: "#f8fafc",
                            letterSpacing: "-0.02em",
                          }}>
                            {room.roomNumber}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            {room.teacher}
                          </div>
                        </div>

                        <span style={{
                          background: statusBg,
                          color: statusColor,
                          border: `1px solid ${statusColor}30`,
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}>
                          {statusLabel}
                        </span>
                      </div>

                      <div style={{
                        background: "#0a0f1a",
                        borderRadius: 8,
                        padding: "10px 14px",
                        marginBottom: 12,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>
                          {room.className}
                        </div>
                        <div style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 12,
                          color: "#38bdf8",
                          marginTop: 3,
                        }}>
                          {formatTime(room.classStart)} – {formatTime(room.classEnd)}
                        </div>
                      </div>

                      <OccupancyBar current={room.currentOccupancy} capacity={room.capacity} />

                      <div style={{ marginTop: 16 }}>
                        {room.userBooked ? (
                          <button
                            onClick={() => unbookRoom(room.id)}
                            style={{
                              width: "100%",
                              padding: "10px",
                              background: "transparent",
                              border: "1px solid #ef4444",
                              color: "#ef4444",
                              borderRadius: 8,
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            Unbook Space
                          </button>
                        ) : inSession ? (
                          <button disabled style={{
                            width: "100%",
                            padding: "10px",
                            background: "#1e293b",
                            border: "1px solid #334155",
                            color: "#475569",
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "not-allowed",
                          }}>
                            Unavailable
                          </button>
                        ) : isFull ? (
                          <button disabled style={{
                            width: "100%",
                            padding: "10px",
                            background: "#1e293b",
                            border: "1px solid #334155",
                            color: "#475569",
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "not-allowed",
                          }}>
                            Room Full
                          </button>
                        ) : (
                          <button
                            onClick={() => bookRoom(room.id)}
                            disabled={isDisabled}
                            style={{
                              width: "100%",
                              padding: "10px",
                              background: isDisabled ? "transparent" : "linear-gradient(135deg, #1d4ed8, #0284c7)",
                              border: isDisabled ? "1px solid #334155" : "none",
                              color: isDisabled ? "#475569" : "#fff",
                              borderRadius: 8,
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: isDisabled ? "not-allowed" : "pointer",
                            }}
                          >
                            {isDisabled ? "Already Booked Elsewhere" : "Book Space"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "officehours" && (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                  Teacher Office Hours
                </h2>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  {officeHours.length} session{officeHours.length !== 1 ? "s" : ""} available this week
                </p>
              </div>

              <button
                onClick={() => setShowTeacherForm(f => !f)}
                style={{
                  background: showTeacherForm ? "#1e293b" : "linear-gradient(135deg, #1d4ed8, #0284c7)",
                  color: showTeacherForm ? "#94a3b8" : "#fff",
                  border: showTeacherForm ? "1px solid #334155" : "none",
                  borderRadius: 10,
                  padding: "10px 18px",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {showTeacherForm ? "✕ Cancel" : "+ Post Office Hours"}
              </button>
            </div>

            {showTeacherForm && (
              <div style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 16,
                padding: 24,
                marginBottom: 28,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginBottom: 18, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace" }}>
                  New Office Hours Entry
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 14 }}>
                  {[
                    { label: "Teacher Name", key: "name", placeholder: "e.g. Ms. Johnson" },
                    { label: "Subject", key: "subject", placeholder: "e.g. AP Biology" },
                    { label: "Room", key: "room", placeholder: "e.g. 204N" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "'IBM Plex Mono', monospace" }}>
                        {label}
                      </label>
                      <input
                        type="text"
                        value={(teacherForm as any)[key]}
                        onChange={e => setTeacherForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={{
                          width: "100%",
                          background: "#0a0f1a",
                          border: "1px solid #1e293b",
                          borderRadius: 8,
                          padding: "10px 12px",
                          color: "#e2e8f0",
                          fontSize: 14,
                          fontFamily: "'IBM Plex Sans', sans-serif",
                        }}
                      />
                    </div>
                  ))}

                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "'IBM Plex Mono', monospace" }}>
                      Day
                    </label>
                    <select
                      value={teacherForm.day}
                      onChange={e => setTeacherForm(f => ({ ...f, day: e.target.value }))}
                      style={{
                        width: "100%",
                        background: "#0a0f1a",
                        border: "1px solid #1e293b",
                        borderRadius: 8,
                        padding: "10px 12px",
                        color: "#e2e8f0",
                        fontSize: 14,
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        appearance: "none",
                      }}
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "'IBM Plex Mono', monospace" }}>
                      Start
                    </label>
                    <input
                      type="time"
                      value={teacherForm.start}
                      onChange={e => setTeacherForm(f => ({ ...f, start: e.target.value }))}
                      style={{
                        width: "100%",
                        background: "#0a0f1a",
                        border: "1px solid #1e293b",
                        borderRadius: 8,
                        padding: "10px 12px",
                        color: "#e2e8f0",
                        fontSize: 14,
                        colorScheme: "dark",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "'IBM Plex Mono', monospace" }}>
                      End
                    </label>
                    <input
                      type="time"
                      value={teacherForm.end}
                      onChange={e => setTeacherForm(f => ({ ...f, end: e.target.value }))}
                      style={{
                        width: "100%",
                        background: "#0a0f1a",
                        border: "1px solid #1e293b",
                        borderRadius: 8,
                        padding: "10px 12px",
                        color: "#e2e8f0",
                        fontSize: 14,
                        colorScheme: "dark",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button
                    onClick={handleTeacherFormSubmit}
                    style={{
                      background: "linear-gradient(135deg, #1d4ed8, #0284c7)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "11px 24px",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    Post Hours
                  </button>

                  {formSaved && (
                    <span className="toast" style={{ fontSize: 14, color: "#86efac", fontWeight: 600 }}>
                      ✓ Posted successfully!
                    </span>
                  )}
                </div>
              </div>
            )}

            {ohMessage && (
              <div className="toast" style={{
                background: ohMessage.startsWith("✓") ? "#052e16" : "#3b0f0f",
                border: `1px solid ${ohMessage.startsWith("✓") ? "#166534" : "#7f1d1d"}`,
                color: ohMessage.startsWith("✓") ? "#86efac" : "#fca5a5",
                borderRadius: 10,
                padding: "12px 18px",
                marginBottom: 20,
                fontSize: 14,
                fontWeight: 600,
              }}>
                {ohMessage}
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <input
                value={ohSearch}
                onChange={e => setOhSearch(e.target.value)}
                placeholder="Search by teacher, subject, day, or room…"
                style={{
                  width: "100%",
                  maxWidth: 400,
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: 10,
                  padding: "11px 16px",
                  color: "#e2e8f0",
                  fontSize: 14,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              />
            </div>

            {Object.keys(groupedOH).length === 0 && (
              <div style={{
                background: "#0f172a",
                border: "1px dashed #1e293b",
                borderRadius: 16,
                padding: "64px 24px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#475569" }}>
                  No office hours found
                </div>
                <div style={{ fontSize: 13, color: "#334155", marginTop: 6 }}>
                  Try a different search, or post new hours using the button above
                </div>
              </div>
            )}

            {DAYS.filter(d => groupedOH[d]).map(day => (
              <div key={day} style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <DayPill day={day} />
                  <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    color: "#334155",
                  }}>
                    {groupedOH[day].length} session{groupedOH[day].length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {groupedOH[day].map(oh => (
                    <div
                      key={oh.id}
                      className="card-hover"
                      style={{
                        background: oh.userBooked
                          ? "linear-gradient(135deg, #0c1a3b, #0f172a)"
                          : "#0f172a",
                        border: oh.userBooked ? "1px solid #1d4ed8" : "1px solid #1e293b",
                        borderRadius: 14,
                        padding: "18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>
                            {oh.teacherName}
                          </div>
                          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                            {oh.subject}
                          </div>
                        </div>
                        {oh.userBooked && (
                          <span style={{
                            background: "#0c1a3b",
                            color: "#93c5fd",
                            border: "1px solid #1d4ed830",
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}>
                            RSVP'd
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 3 }}>
                            Time
                          </div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>
                            {formatTime(oh.start)} – {formatTime(oh.end)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 3 }}>
                            Room
                          </div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
                            {oh.room}
                          </div>
                        </div>
                      </div>

                      {oh.userBooked ? (
                        <button
                          onClick={() => unbookOfficeHour(oh.id)}
                          style={{
                            width: "100%",
                            padding: "9px",
                            background: "transparent",
                            border: "1px solid #ef4444",
                            color: "#ef4444",
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          Cancel RSVP
                        </button>
                      ) : (
                        <button
                          onClick={() => bookOfficeHour(oh.id)}
                          style={{
                            width: "100%",
                            padding: "9px",
                            background: "linear-gradient(135deg, #1d4ed8, #0284c7)",
                            border: "none",
                            color: "#fff",
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          RSVP
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

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