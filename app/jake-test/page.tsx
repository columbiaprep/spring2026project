"use client";
// Tells Next.js this file runs in the browser (not server-side)
// Required for all interactive features like useState, clicks, etc.

import { useState, useEffect } from "react";
// useState → lets us store and update data that the component tracks
// useEffect → lets us run code when the page loads or when something changes

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// These describe the "shape" of our data objects (TypeScript types)
// ─────────────────────────────────────────────────────────────────────────────

type Room = {
  // Defines what fields every room object must have
  id: number;              // Unique number to identify each room
  roomNumber: string;      // The room label shown to users (e.g. "302W")
  className: string;       // Name of the class scheduled in that room
  classStart: string;      // When the class starts, in "HH:MM" format
  classEnd: string;        // When the class ends, in "HH:MM" format
  capacity: number;        // Max students allowed in the room
  currentOccupancy: number; // How many students are currently booked in
  teacher: string;         // Name of the supervising teacher
  userBooked: boolean;     // true if the current user has booked a spot
};

type OfficeHour = {
  // Defines what fields every office hours entry must have
  id: number;       // Unique identifier for this entry
  name: string;     // Teacher's name
  subject: string;  // Class or subject they teach
  day: string;      // Day of the week (e.g. "Monday")
  start: string;    // Start time in "HH:MM" format
  end: string;      // End time in "HH:MM" format
  room: string;     // Room number where office hours are held
  userBooked: boolean; // true if the current user has RSVP'd to this session
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
// List of weekdays used to group and display office hours by day

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// Small reusable functions used throughout the component
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  // Converts 24-hour time (e.g. "13:30") into 12-hour time (e.g. "1:30 PM")
  if (!t) return "";
  // If time is empty or undefined, return an empty string to avoid crashes

  const [h, m] = t.split(":").map(Number);
  // Split "13:30" by ":" → ["13", "30"], then convert both to numbers
  // h = 13 (hours), m = 30 (minutes)

  const ampm = h >= 12 ? "PM" : "AM";
  // If hour is 12 or more, it's afternoon (PM); otherwise morning (AM)

  const hour = h % 12 || 12;
  // Convert 24-hour to 12-hour: 13 % 12 = 1, 0 % 12 = 0 → we make 0 into 12

  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
  // padStart(2, "0") makes single-digit minutes like "5" into "05"
  // Returns something like "1:30 PM"
}

function isClassNow(start: string, end: string): boolean {
  // Returns true if the current time falls between the class start and end times
  const now = new Date();
  // Get the current date and time

  const current = now.toTimeString().slice(0, 5);
  // toTimeString() gives "13:30:00 GMT..." — we slice only the first 5 chars → "13:30"

  return current >= start && current <= end;
  // Returns true if current time is within the range [start, end]
}

function getOccupancyColor(current: number, capacity: number): string {
  // Returns a color string based on how full the room is
  const ratio = current / capacity;
  // Divide current occupancy by max capacity to get a percentage as a decimal

  if (ratio >= 1) return "#ef4444";
  // 100% full → red

  if (ratio >= 0.75) return "#f97316";
  // 75%+ full → orange

  if (ratio >= 0.5) return "#eab308";
  // 50%+ full → yellow

  return "#22c55e";
  // Under 50% → green
}

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY DATA
// Pre-made fake data so the app works without a real database
// ─────────────────────────────────────────────────────────────────────────────

const DUMMY_ROOMS: Room[] = [
  // Array of room objects using the Room type defined above
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
    // This room is intentionally at full capacity as an example
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
  // Array of office hour entries using the OfficeHour type defined above
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

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// Small reusable visual pieces used inside the main component
// ─────────────────────────────────────────────────────────────────────────────

function DayPill({ day }: { day: string }) {
  // Renders a colored pill badge showing the day name (e.g. "MONDAY")
  // { day } destructures the "day" prop from the object passed to this component

  const palette: Record<string, { bg: string; text: string }> = {
    // Maps each day name to a background color and text color
    Monday:    { bg: "#1e3a5f", text: "#93c5fd" },
    Tuesday:   { bg: "#1a3a2a", text: "#86efac" },
    Wednesday: { bg: "#3b1f5e", text: "#c4b5fd" },
    Thursday:  { bg: "#3b2a0e", text: "#fcd34d" },
    Friday:    { bg: "#3b1414", text: "#fca5a5" },
  };

  const colors = palette[day] || { bg: "#1e293b", text: "#94a3b8" };
  // Use the day's color pair, or fall back to a neutral gray if the day isn't found

  return (
    <span style={{
      background: colors.bg,    // Colored background based on day
      color: colors.text,       // Colored text based on day
      padding: "3px 12px",
      borderRadius: 999,        // Makes it a fully rounded "pill" shape
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const, // Makes text all-caps
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {day}
      {/* Renders the day name text inside the pill */}
    </span>
  );
}

function OccupancyBar({ current, capacity }: { current: number; capacity: number }) {
  // Renders a horizontal bar showing how full a room is
  const pct = Math.min((current / capacity) * 100, 100);
  // Calculate percentage full, capped at 100% using Math.min

  const color = getOccupancyColor(current, capacity);
  // Get the appropriate color for the fill level

  return (
    <div style={{ marginTop: 10 }}>
      {/* Container with spacing above it */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        {/* Row with label on the left and numbers on the right */}
        <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "'IBM Plex Mono', monospace" }}>
          Occupancy
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace" }}>
          {current}/{capacity}
          {/* Shows current number / max number */}
        </span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 999, overflow: "hidden" }}>
        {/* Gray track behind the fill bar */}
        <div style={{
          height: "100%",
          width: `${pct}%`,      // Width is the percentage full
          background: color,     // Color changes based on fullness
          borderRadius: 999,
          transition: "width 0.4s ease",  // Smooth animation if value changes
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CGPSDashboard() {
  // The main exported component — this is what gets rendered as the page

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<"rooms" | "officehours">("rooms");
  // Tracks which tab is currently selected: "rooms" or "officehours"
  // useState<"rooms" | "officehours"> limits the value to only those two strings

  // ── Room state ──
  const [rooms, setRooms] = useState<Room[]>(DUMMY_ROOMS);
  // Stores the array of all room objects; starts with the dummy data

  const [bookedRoomId, setBookedRoomId] = useState<number | null>(null);
  // Tracks which room the current user has booked (by its id), or null if none

  const [roomMessage, setRoomMessage] = useState<string | null>(null);
  // Stores a toast message to show after booking/unbooking a room

  const [attested, setAttested] = useState(false);
  // Tracks whether the user has checked the "I'm not in class" checkbox

  // ── Office Hours state ──
  const [officeHours, setOfficeHours] = useState<OfficeHour[]>(DUMMY_OFFICE_HOURS);
  // Stores the array of all office hour entries; starts with the dummy data

  const [ohMessage, setOhMessage] = useState<string | null>(null);
  // Stores a toast message to show after booking/unbooking office hours

  const [ohSearch, setOhSearch] = useState("");
  // Stores the text typed into the office hours search bar

  // ── Teacher Form state (for adding new office hours) ──
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  // Controls whether the "Add Office Hours" form is visible

  const [teacherForm, setTeacherForm] = useState({
    name: "", subject: "", day: "Monday", start: "", end: "", room: ""
  });
  // Stores the values typed into the teacher form fields
  // Starts with an empty form and Monday as default day

  const [formSaved, setFormSaved] = useState(false);
  // Controls whether the "Saved!" confirmation message shows after submitting the form

  // ── Auto-dismiss messages after 3 seconds ──
  useEffect(() => {
    if (!roomMessage) return;
    // If there's no message, do nothing

    const t = setTimeout(() => setRoomMessage(null), 3000);
    // After 3000ms (3 seconds), clear the room message

    return () => clearTimeout(t);
    // Cleanup: cancel the timer if the component re-renders before 3s is up
  }, [roomMessage]);
  // This runs every time roomMessage changes

  useEffect(() => {
    if (!ohMessage) return;
    // If there's no message, do nothing

    const t = setTimeout(() => setOhMessage(null), 3000);
    // After 3 seconds, clear the office hours message

    return () => clearTimeout(t);
    // Cleanup the timer
  }, [ohMessage]);
  // This runs every time ohMessage changes

  // ─────────────────────────────────────────────────────────────────────────
  // ROOM BOOKING FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────

  function bookRoom(id: number) {
    // Called when user clicks "Book Space" on a room card

    if (bookedRoomId !== null) {
      // If the user already has a booking somewhere, prevent double-booking
      setRoomMessage("You already have a room booked. Unbook it first.");
      return;
      // Exit the function early
    }

    setRooms(prev =>
      // prev is the current rooms array; we map over it to update one entry
      prev.map(room => {
        if (room.id !== id) return room;
        // If this room isn't the one being booked, return it unchanged

        if (room.currentOccupancy >= room.capacity) {
          setRoomMessage(`Room ${room.roomNumber} is full.`);
          return room;
          // Don't book if room is already at capacity
        }

        const newOcc = room.currentOccupancy + 1;
        // Increment occupancy by 1

        setBookedRoomId(id);
        // Remember that the user booked this room

        setRoomMessage(`✓ Booked a spot in Room ${room.roomNumber}! Your teacher has been notified.`);
        // Show a confirmation message

        return { ...room, currentOccupancy: newOcc, userBooked: true };
        // Return the room with updated occupancy and userBooked = true
        // The spread ...room copies all other fields unchanged
      })
    );
  }

  function unbookRoom(id: number) {
    // Called when user clicks "Unbook" on a room card

    setRooms(prev =>
      prev.map(room => {
        if (room.id !== id) return room;
        // Skip rooms that don't match

        const newOcc = Math.max(room.currentOccupancy - 1, 0);
        // Decrease occupancy by 1, but never below 0 (Math.max prevents negatives)

        setBookedRoomId(null);
        // User no longer has a booked room

        setRoomMessage(`✓ Removed your booking from Room ${room.roomNumber}.`);
        // Show confirmation

        return { ...room, currentOccupancy: newOcc, userBooked: false };
        // Return updated room with occupancy decreased and userBooked = false
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OFFICE HOURS BOOKING FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────

  function bookOfficeHour(id: number) {
    // Called when user clicks "RSVP" on an office hours card

    setOfficeHours(prev =>
      prev.map(oh => {
        if (oh.id !== id) return oh;
        // Skip entries that don't match

        if (oh.userBooked) {
          setOhMessage("You've already RSVP'd to this session.");
          return oh;
          // Prevent double-booking the same session
        }

        setOhMessage(`✓ RSVP'd for ${oh.name}'s office hours on ${oh.day}!`);
        // Show confirmation message

        return { ...oh, userBooked: true };
        // Return the entry with userBooked set to true
      })
    );
  }

  function unbookOfficeHour(id: number) {
    // Called when user clicks "Cancel RSVP" on an office hours card

    setOfficeHours(prev =>
      prev.map(oh => {
        if (oh.id !== id) return oh;
        // Skip non-matching entries

        setOhMessage(`✓ Cancelled your RSVP with ${oh.name}.`);
        // Show confirmation

        return { ...oh, userBooked: false };
        // Mark this entry as no longer booked by the user
      })
    );
  }

  function handleTeacherFormSubmit() {
    // Called when teacher clicks "Post Hours" in the form

    const { name, subject, start, end, room } = teacherForm;
    // Destructure the form fields we need to validate

    if (!name || !subject || !start || !end || !room) return;
    // If any required field is empty, stop here (don't submit)

    const newEntry: OfficeHour = {
      ...teacherForm,                // Copy all form fields into the new entry
      id: Date.now(),                // Use current timestamp as a unique id
      userBooked: false,             // New entry starts with no one booked
    };

    setOfficeHours(prev => [...prev, newEntry]);
    // Add the new entry to the existing office hours array

    setTeacherForm({ name: "", subject: "", day: "Monday", start: "", end: "", room: "" });
    // Reset the form back to empty

    setFormSaved(true);
    // Show the "Saved!" message

    setTimeout(() => setFormSaved(false), 2500);
    // Hide it after 2.5 seconds
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED DATA
  // Computed values based on current state — recalculated on every render
  // ─────────────────────────────────────────────────────────────────────────

  const filteredOH = officeHours.filter(oh =>
    // Filter office hours based on what the user typed in the search box
    oh.name.toLowerCase().includes(ohSearch.toLowerCase()) ||
    // Check if teacher name matches (case-insensitive)
    oh.subject.toLowerCase().includes(ohSearch.toLowerCase()) ||
    // Check if subject matches
    oh.day.toLowerCase().includes(ohSearch.toLowerCase()) ||
    // Check if day matches
    oh.room.toLowerCase().includes(ohSearch.toLowerCase())
    // Check if room matches
  );

  const groupedOH = DAYS.reduce((acc: Record<string, OfficeHour[]>, day) => {
    // Group the filtered office hours by day of the week
    const entries = filteredOH.filter(oh => oh.day === day);
    // Get all office hours entries for this specific day

    if (entries.length > 0) acc[day] = entries;
    // Only add the day to the group if it has at least one entry

    return acc;
    // Return the accumulator to build up the grouped object
  }, {});
  // Start with an empty object {} and build it up day by day

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — the JSX that gets displayed in the browser
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh",
      // Page is at least as tall as the browser window
      background: "#0a0f1a",
      // Very dark navy background
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      // Clean modern font
      color: "#e2e8f0",
      // Light gray text for dark background
    }}>

      {/* ── Google Font Import ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
        /* Loads IBM Plex fonts from Google — Mono for labels/data, Sans for body */

        * { box-sizing: border-box; }
        /* Includes padding/border in element width calculations — prevents layout surprises */

        ::-webkit-scrollbar { width: 6px; background: #0a0f1a; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
        /* Custom thin scrollbar styling */

        input, select { outline: none; }
        /* Removes the default blue browser outline on focused inputs */

        button { cursor: pointer; font-family: inherit; }
        /* Shows a hand cursor on buttons and inherits the page font */

        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        /* Smooth lift animation when hovering over any element with class "card-hover" */

        .tab-btn { transition: all 0.2s ease; }
        /* Smooth color/style transitions for tab buttons */

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Slide-in animation used for toast messages */

        .toast { animation: slideDown 0.3s ease; }
        /* Apply the slideDown animation to elements with class "toast" */
      `}</style>

      {/* ── Header ── */}
      <header style={{
        background: "linear-gradient(180deg, #0d1526 0%, #0a0f1a 100%)",
        // Subtle gradient from slightly lighter to the page background
        borderBottom: "1px solid #1e293b",
        // Thin separator line at the bottom of the header
        padding: "0 32px",
        position: "sticky",
        // Header stays visible when you scroll down
        top: 0,
        zIndex: 50,
        // Ensures header sits on top of all other elements
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Centers the header content with a max width */}

          {/* School name row */}
          <div style={{ paddingTop: 20, paddingBottom: 4 }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: "#38bdf8",
              // Sky blue accent color
              letterSpacing: "0.2em",
              textTransform: "uppercase" as const,
            }}>
              Columbia Grammar & Preparatory School
            </div>
          </div>

          {/* Title + subtitle row */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 0 }}>
            <div>
              <h1 style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#f8fafc",
                margin: 0,
                letterSpacing: "-0.03em",
                // Slightly tight letter spacing for a modern look
              }}>
                CGPS Portal
              </h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0", fontWeight: 400 }}>
                Room availability · Office hours · Bookings
              </p>
            </div>

            {/* Live indicator dot */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 16 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
                // Glowing green dot to indicate "live" status
              }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#64748b" }}>
                LIVE
              </span>
            </div>
          </div>

          {/* Tab buttons */}
          <div style={{ display: "flex", gap: 2, marginTop: 8 }}>
            {/* Map over the two tab options and render a button for each */}
            {[
              { id: "rooms" as const, label: "Quiet Spaces", icon: "🏫" },
              { id: "officehours" as const, label: "Office Hours", icon: "📋" },
            ].map(tab => (
              <button
                key={tab.id}
                // React requires a unique "key" when rendering lists of elements
                onClick={() => setActiveTab(tab.id)}
                // Switch the active tab when clicked
                className="tab-btn"
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px 8px 0 0",
                  // Rounded only on top corners to look like folder tabs
                  border: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  background: activeTab === tab.id ? "#0f172a" : "transparent",
                  // Active tab gets a darker background
                  color: activeTab === tab.id ? "#38bdf8" : "#475569",
                  // Active tab text is blue; inactive is gray
                  borderTop: activeTab === tab.id ? "2px solid #38bdf8" : "2px solid transparent",
                  // Blue top border on the active tab
                }}
              >
                {tab.icon} {tab.label}
                {/* Shows the emoji icon and tab label */}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 32px 64px" }}>
        {/* Centers the main content and adds spacing around it */}

        {/* ══════════════════════════════════════════════════════
            ROOMS TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === "rooms" && (
          // Only renders this section if the "rooms" tab is active
          <div>

            {/* Section header */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                Available Quiet Spaces
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                Book a free space to study or work — your teacher will be notified automatically
              </p>
            </div>

            {/* Attestation checkbox — must be checked before booking */}
            <div style={{
              background: "#0f172a",
              border: `1px solid ${attested ? "#38bdf8" : "#1e293b"}`,
              // Border turns blue when checked
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 28,
              display: "flex",
              alignItems: "center",
              gap: 14,
              transition: "border-color 0.2s",
              // Smooth border color change when checkbox is clicked
            }}>
              <input
                type="checkbox"
                id="attest"
                checked={attested}
                // Controlled input — its state is managed by the attested variable
                onChange={e => setAttested(e.target.checked)}
                // Update attested state to true or false when clicked
                style={{ width: 17, height: 17, accentColor: "#38bdf8", cursor: "pointer", flexShrink: 0 }}
              />
              <label htmlFor="attest" style={{ fontSize: 14, color: "#cbd5e1", cursor: "pointer", fontWeight: 500 }}>
                I confirm I am not currently in class and I am free to use a quiet space
              </label>
            </div>

            {/* Room grid — only shows if checkbox is checked */}
            {!attested ? (
              // If not attested, show a placeholder message instead of rooms
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
              // If attested, show the room cards grid
              <>
                {/* Toast notification */}
                {roomMessage && (
                  <div className="toast" style={{
                    background: roomMessage.startsWith("✓") ? "#052e16" : "#3b0f0f",
                    // Green background for success, red for error
                    border: `1px solid ${roomMessage.startsWith("✓") ? "#166534" : "#7f1d1d"}`,
                    color: roomMessage.startsWith("✓") ? "#86efac" : "#fca5a5",
                    borderRadius: 10,
                    padding: "12px 18px",
                    marginBottom: 20,
                    fontSize: 14,
                    fontWeight: 600,
                  }}>
                    {roomMessage}
                    {/* Displays the current booking status message */}
                  </div>
                )}

                {/* Responsive grid of room cards */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  // Auto-fills columns, each at least 260px wide — responsive!
                  gap: 16,
                }}>
                  {rooms.map(room => {
                    // Loop through each room and render a card
                    const inSession = isClassNow(room.classStart, room.classEnd);
                    // Is there a class happening right now in this room?

                    const isFull = room.currentOccupancy >= room.capacity;
                    // Is the room at max capacity?

                    const isDisabled = bookedRoomId !== null && bookedRoomId !== room.id;
                    // Should the book button be disabled?
                    // True if user already booked a DIFFERENT room

                    let statusLabel = "Available";
                    let statusBg = "#052e16";
                    let statusColor = "#86efac";
                    // Default status: green "Available"

                    if (inSession) {
                      statusLabel = "Class in Session";
                      statusBg = "#3b0f0f";
                      statusColor = "#fca5a5";
                      // Red when a class is currently happening
                    } else if (isFull) {
                      statusLabel = "Full";
                      statusBg = "#1c1917";
                      statusColor = "#78716c";
                      // Gray when at capacity
                    } else if (room.userBooked) {
                      statusLabel = "Your Booking";
                      statusBg = "#0c1a3b";
                      statusColor = "#93c5fd";
                      // Blue when the current user has booked this room
                    }

                    return (
                      <div
                        key={room.id}
                        // Unique key required by React for list rendering
                        className="card-hover"
                        style={{
                          background: room.userBooked
                            ? "linear-gradient(135deg, #0c1a3b, #0f172a)"
                            : "#0f172a",
                          // User's booked room gets a blue-tinted background
                          border: room.userBooked ? "1px solid #1d4ed8" : "1px solid #1e293b",
                          // Booked room has a blue border
                          borderRadius: 16,
                          padding: 22,
                          position: "relative",
                          // Needed for absolute positioning of children
                        }}
                      >

                        {/* Room number in top-left, status badge in top-right */}
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
                              {/* The room number like "302W" */}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                              {room.teacher}
                              {/* The teacher's name */}
                            </div>
                          </div>

                          {/* Status badge pill */}
                          <span style={{
                            background: statusBg,
                            color: statusColor,
                            border: `1px solid ${statusColor}30`,
                            // Semi-transparent border matching the text color
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Class name and time */}
                        <div style={{
                          background: "#0a0f1a",
                          borderRadius: 8,
                          padding: "10px 14px",
                          marginBottom: 12,
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>
                            {room.className}
                            {/* Name of the scheduled class */}
                          </div>
                          <div style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 12,
                            color: "#38bdf8",
                            marginTop: 3,
                          }}>
                            {formatTime(room.classStart)} – {formatTime(room.classEnd)}
                            {/* Formatted start and end times */}
                          </div>
                        </div>

                        {/* Occupancy progress bar */}
                        <OccupancyBar current={room.currentOccupancy} capacity={room.capacity} />
                        {/* Renders the colored occupancy bar component defined above */}

                        {/* Book / Unbook buttons */}
                        <div style={{ marginTop: 16 }}>
                          {room.userBooked ? (
                            // If the user has booked this room, show the Unbook button
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
                            // If class is in session, disable button
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
                            // If room is full, show a grayed-out button
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
                            // Otherwise show the active Book button
                            <button
                              onClick={() => bookRoom(room.id)}
                              disabled={isDisabled}
                              // Disabled if user already booked another room
                              style={{
                                width: "100%",
                                padding: "10px",
                                background: isDisabled ? "transparent" : "linear-gradient(135deg, #1d4ed8, #0284c7)",
                                // Blue gradient when active, transparent when disabled
                                border: isDisabled ? "1px solid #334155" : "none",
                                color: isDisabled ? "#475569" : "#fff",
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: isDisabled ? "not-allowed" : "pointer",
                              }}
                            >
                              {isDisabled ? "Already Booked Elsewhere" : "Book Space"}
                              {/* Button text changes based on booking state */}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            OFFICE HOURS TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === "officehours" && (
          // Only renders if "officehours" tab is active
          <div>

            {/* Header row with title and Add Hours button */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                  Teacher Office Hours
                </h2>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  {officeHours.length} session{officeHours.length !== 1 ? "s" : ""} available this week
                  {/* Shows count of total office hours sessions */}
                </p>
              </div>

              <button
                onClick={() => setShowTeacherForm(f => !f)}
                // Toggle the form open/closed on each click
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
                {/* Label changes based on whether the form is open */}
              </button>
            </div>

            {/* Teacher form — only visible when showTeacherForm is true */}
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

                {/* Form grid — 3 columns on wide screens */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 14 }}>
                  {/* Map over each text field and render an input */}
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
                        // Access the form field by its key name
                        onChange={e => setTeacherForm(f => ({ ...f, [key]: e.target.value }))}
                        // Update only this field; spread keeps other fields unchanged
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

                  {/* Day dropdown */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "'IBM Plex Mono', monospace" }}>
                      Day
                    </label>
                    <select
                      value={teacherForm.day}
                      onChange={e => setTeacherForm(f => ({ ...f, day: e.target.value }))}
                      // Update the "day" field in the form state
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
                        // Removes default browser dropdown arrow styling
                      }}
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      {/* Renders one dropdown option per day */}
                    </select>
                  </div>

                  {/* Start time */}
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
                        // Tells the browser to use dark mode for the time picker UI
                      }}
                    />
                  </div>

                  {/* End time */}
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

                {/* Submit button and saved confirmation */}
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button
                    onClick={handleTeacherFormSubmit}
                    // Calls the submit function when clicked
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
                    // Only visible for 2.5 seconds after a successful submission
                    <span className="toast" style={{ fontSize: 14, color: "#86efac", fontWeight: 600 }}>
                      ✓ Posted successfully!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Toast notification for booking/unbooking office hours */}
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

            {/* Search bar */}
            <div style={{ marginBottom: 24 }}>
              <input
                value={ohSearch}
                onChange={e => setOhSearch(e.target.value)}
                // Updates the search filter as the user types
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

            {/* Empty state — shown when no results match */}
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

            {/* Office hours grouped by day */}
            {DAYS.filter(d => groupedOH[d]).map(day => (
              // Only render days that have at least one entry
              <div key={day} style={{ marginBottom: 32 }}>

                {/* Day header with colored pill and horizontal rule */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <DayPill day={day} />
                  {/* Renders the colored day pill badge */}
                  <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
                  {/* Horizontal divider line after the pill */}
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    color: "#334155",
                  }}>
                    {groupedOH[day].length} session{groupedOH[day].length !== 1 ? "s" : ""}
                    {/* Shows count of sessions for this day */}
                  </span>
                </div>

                {/* Cards for each office hours session on this day */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {groupedOH[day].map(oh => (
                    <div
                      key={oh.id}
                      className="card-hover"
                      style={{
                        background: oh.userBooked
                          ? "linear-gradient(135deg, #0c1a3b, #0f172a)"
                          : "#0f172a",
                        // Blue tint for user's own booked session
                        border: oh.userBooked ? "1px solid #1d4ed8" : "1px solid #1e293b",
                        borderRadius: 14,
                        padding: "18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {/* Teacher name, subject, and RSVP badge */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>
                            {oh.name}
                            {/* Teacher's name */}
                          </div>
                          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                            {oh.subject}
                            {/* Subject they teach */}
                          </div>
                        </div>
                        {oh.userBooked && (
                          // Only shows if the user has RSVP'd
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

                      {/* Time and room info row */}
                      <div style={{ display: "flex", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 3 }}>
                            Time
                          </div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>
                            {formatTime(oh.start)} – {formatTime(oh.end)}
                            {/* Formatted start and end times */}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 3 }}>
                            Room
                          </div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
                            {oh.room}
                            {/* Room number */}
                          </div>
                        </div>
                      </div>

                      {/* RSVP / Cancel button */}
                      {oh.userBooked ? (
                        <button
                          onClick={() => unbookOfficeHour(oh.id)}
                          // Cancel RSVP when clicked
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
                          // RSVP to this session when clicked
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
        {/* Shows the current year dynamically so it never goes out of date */}
      </footer>
    </div>
  );
}