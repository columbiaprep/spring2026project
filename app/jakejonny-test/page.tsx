"use client";
// Tells Next.js this file runs in the browser (not server-side)
// Required for all features like useState, clicks, etc.

import { useState, useEffect } from "react";
// useState → lets us store and update data that the component tracks
// useEffect → lets us run code when the page loads or when something changes

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// TypeScript "types" act like blueprints — they describe the exact shape every
// object of that kind must have. If you try to use a field that isn't listed
// here, TypeScript will show a red error before the code even runs.
// ─────────────────────────────────────────────────────────────────────────────

type Room = {
  // Every room object in our app must contain ALL of these fields.
  // If any field is missing or the wrong data type, TypeScript will warn us.
  id: number;               // Unique number used to tell rooms apart (e.g. 1, 2, 3)
  roomNumber: string;       // Human-readable label shown on the card (e.g. "302W")
  className: string;        // The class scheduled to use this room (e.g. "Algebra II")
  classStart: string;       // 24-hour start time as text, like "09:15" — string for easy comparison
  classEnd: string;         // 24-hour end time as text, like "10:00"
  capacity: number;         // Maximum number of students allowed in the room at once
  currentOccupancy: number; // How many students have booked — increases/decreases as users book
  teacher: string;          // Full name of the teacher supervising the room
  userBooked: boolean;      // true = this user has a booking here; false = they do not
  //                           Used to show "Unbook" instead of "Book" and apply blue card styling
};

type OfficeHour = {
  // Every office hours entry must contain ALL of these fields.
  // Teachers fill these in using the form; the dummy data uses them too.
  id: number;          // Unique number used to identify and update this specific entry
  name: string;        // The teacher's full name (e.g. "Mr. Anderson")
  subject: string;     // The subject or class they teach (e.g. "AP Biology")
  day: string;         // Day of the week as a plain string — must match a value in DAYS[]
  start: string;       // 24-hour start time string (e.g. "08:00")
  end: string;         // 24-hour end time string (e.g. "08:45")
  room: string;        // Room number where the session takes place (e.g. "302W")
  userBooked: boolean; // true = the student has RSVP'd; false = they have not
  //                      Used to show "Cancel RSVP" vs "RSVP" and apply blue card styling
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
// List of weekdays used to group and display office hours by day

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// These are small, self-contained functions that do one specific job.
// They're defined outside the main component so they don't get re-created
// on every render — they only need to exist once, shared across the whole file.
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  // PURPOSE: Converts 24-hour time (e.g. "13:30") into readable 12-hour time (e.g. "1:30 PM")
  // WHY: Our data stores times in HH:MM format (simpler to compare), but users expect AM/PM

  if (!t) return "";
  // Guard clause — if "t" is undefined, null, or an empty string, bail out immediately
  // Returning "" prevents crashes when a form field hasn't been filled in yet

  const [h, m] = t.split(":").map(Number);
  // t.split(":") breaks "13:30" into the array ["13", "30"]
  // .map(Number) converts each string to a number: [13, 30]
  // Destructuring [h, m] assigns: h = 13, m = 30

  const ampm = h >= 12 ? "PM" : "AM";
  // Ternary operator: if h is 12 or more → "PM", otherwise → "AM"
  // 12:00 = noon = PM, 0:00 = midnight = AM

  const hour = h % 12 || 12;
  // % is the modulo (remainder) operator
  // 13 % 12 = 1 (1 PM), 15 % 12 = 3 (3 PM), 12 % 12 = 0 — but we want 12, not 0
  // The "|| 12" means: if the result is 0 (falsy), use 12 instead

  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
  // Template literal builds the final string, e.g. "1:30 PM"
  // m.toString().padStart(2, "0") ensures minutes always have 2 digits: 5 → "05"
}

function isClassNow(start: string, end: string): boolean {
  // PURPOSE: Checks if a class is currently happening right now
  // RETURNS: true if the current clock time falls between start and end
  // WHY: Used to mark rooms as "Unavailable" during scheduled class times

  const now = new Date();
  // new Date() creates an object containing the current date AND time

  const current = now.toTimeString().slice(0, 5);
  // toTimeString() returns something like "13:30:00 GMT-0500 (Eastern Standard Time)"
  // .slice(0, 5) cuts out only the first 5 characters → "13:30"
  // This gives us the current time in the same HH:MM format as our data

  return current >= start && current <= end;
  // String comparison works here because both sides are in "HH:MM" format
  // "13:30" >= "09:15" → true, "13:30" <= "10:00" → false
  // The && means BOTH must be true for the class to be in session right now
}

function getOccupancyColor(current: number, capacity: number): string {
  // PURPOSE: Returns a hex color string based on how full the room is
  // WHY: Used by the OccupancyBar component to visually signal how crowded a room is

  const ratio = current / capacity;
  // Divides current students by max capacity to get a decimal between 0 and 1
  // e.g. 15 students in a room of 20 → 15/20 = 0.75 (75% full)

  if (ratio >= 1) return "#ef4444";
  // 100% full (or over) → red — room is at capacity, can't book
  // We check >= 1 first because it's the most urgent condition

  if (ratio >= 0.75) return "#f97316";
  // 75% to 99% full → orange — getting crowded

  if (ratio >= 0.5) return "#eab308";
  // 50% to 74% full → yellow — moderate occupancy

  return "#22c55e";
  // Under 50% full → green — plenty of space available
  // This is the default that runs if none of the above conditions matched
}

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY DATA
// Hard-coded fake data that lets the app work without a real database.
// In a real school system this would be fetched from an API or database.
// Each object must match the Room or OfficeHour type exactly — TypeScript
// will throw an error at build time if a field is wrong or missing.
// ─────────────────────────────────────────────────────────────────────────────

const DUMMY_ROOMS: Room[] = [
  // Room[] means this is an array where every element must be a Room object
  // The "const" means this array reference never changes (though its contents can via state)
  {
    id: 1,
    roomNumber: "302W",        // "W" = west wing — real school-style room codes
    className: "Algebra II",
    classStart: "09:15",
    classEnd: "10:00",
    capacity: 20,
    currentOccupancy: 3,       // 3/20 = 15% full → will show green occupancy bar
    teacher: "Mr. Anderson",
    userBooked: false,         // No one has booked yet when the page first loads
  },
  {
    id: 2,
    roomNumber: "504N",
    className: "Physics",
    classStart: "11:45",
    classEnd: "12:30",
    capacity: 20,
    currentOccupancy: 20,      // Intentionally full (20/20) — demonstrates "Room Full" state
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
    currentOccupancy: 6,       // 6/18 = 33% full → green bar
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
    currentOccupancy: 9,       // 9/16 = 56% full → yellow bar
    teacher: "Dr. Patel",
    userBooked: false,
  },
];

const DUMMY_OFFICE_HOURS: OfficeHour[] = [
  // One entry per teacher, spread across different days to demonstrate the grouping
  {
    id: 1,
    name: "Mr. Anderson",
    subject: "Algebra II",
    day: "Monday",             // Must exactly match a string in the DAYS[] constant
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
    room: "110W",              // This room isn't in DUMMY_ROOMS — that's intentional and fine
    userBooked: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// These are smaller React components used inside the main component.
// Defining them separately keeps the main component readable and lets us
// reuse them in multiple places without copy-pasting the same JSX.
// ─────────────────────────────────────────────────────────────────────────────

function DayPill({ day }: { day: string }) {
  // PURPOSE: Renders a small colored pill/badge showing the day name (e.g. "MONDAY")
  // RECEIVES: "day" as a prop — a string like "Monday", "Tuesday", etc.
  // { day }: { day: string } is "destructured props with a type annotation"
  //   → It means: this component accepts one prop called "day" which must be a string

  const palette: Record<string, { bg: string; text: string }> = {
    // Record<string, { bg: string; text: string }> is a TypeScript type meaning:
    // "an object whose keys are strings and whose values are objects with bg and text string fields"
    // Each day gets a unique background color (bg) and contrasting text color (text)
    Monday:    { bg: "#1e3a5f", text: "#93c5fd" }, // Deep blue bg, light blue text
    Tuesday:   { bg: "#1a3a2a", text: "#86efac" }, // Deep green bg, light green text
    Wednesday: { bg: "#3b1f5e", text: "#c4b5fd" }, // Deep purple bg, light purple text
    Thursday:  { bg: "#3b2a0e", text: "#fcd34d" }, // Deep amber bg, yellow text
    Friday:    { bg: "#3b1414", text: "#fca5a5" }, // Deep red bg, light red text
  };

  const colors = palette[day] || { bg: "#1e293b", text: "#94a3b8" };
  // Look up the color pair for this day in the palette object
  // The || operator provides a fallback: if "day" isn't in the palette (e.g. a typo),
  // we use a neutral dark slate color instead of crashing

  return (
    <span style={{
      background: colors.bg,              // Unique background color per day
      color: colors.text,                 // Unique text color per day
      padding: "3px 12px",               // Small vertical, larger horizontal padding → pill shape
      borderRadius: 999,                  // Very large radius makes it a perfect pill/capsule shape
      fontSize: 11,                       // Small text to fit compactly next to other elements
      fontWeight: 700,                    // Bold so it reads clearly at small size
      letterSpacing: "0.1em",            // Slightly spread-out letters look better at small sizes
      textTransform: "uppercase" as const, // Forces text to ALL CAPS regardless of input
      // "as const" tells TypeScript this is a specific CSS value, not just any string
      fontFamily: "'IBM Plex Mono', monospace", // Monospace font for the data/label aesthetic
    }}>
      {day}
      {/* Renders the actual day name text passed in as a prop */}
    </span>
  );
}

function OccupancyBar({ current, capacity }: { current: number; capacity: number }) {
  // PURPOSE: Renders a horizontal progress bar showing how full a room is
  // RECEIVES: "current" (how many booked) and "capacity" (the max allowed)
  // Both are numbers — TypeScript enforces this with the type annotation

  const pct = Math.min((current / capacity) * 100, 100);
  // Calculate fill percentage: e.g. 15 students out of 20 capacity = 75%
  // (current / capacity) * 100 gives a number between 0 and 100+
  // Math.min(..., 100) caps it at 100 so the bar never overflows its container
  // Math.min returns the smaller of the two values passed to it

  const color = getOccupancyColor(current, capacity);
  // Calls our helper function defined above to get the right color
  // e.g. 75% full → "#f97316" (orange)

  return (
    <div style={{ marginTop: 10 }}>
      {/* Outer container — adds breathing room above the bar */}

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        {/* Row layout: label "Occupancy" on left, numbers "15/20" on right */}
        {/* justifyContent: "space-between" pushes the two children to opposite ends */}

        <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "'IBM Plex Mono', monospace" }}>
          Occupancy
          {/* Static label — always reads "OCCUPANCY" */}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace" }}>
          {current}/{capacity}
          {/* Dynamic fraction — updates whenever current or capacity changes */}
          {/* Uses the same color as the bar fill for visual consistency */}
        </span>
      </div>

      <div style={{ height: 6, background: "#1e293b", borderRadius: 999, overflow: "hidden" }}>
        {/* The "track" — the gray background bar that the fill sits on top of */}
        {/* overflow: "hidden" clips the fill bar so it can't peek out past the rounded ends */}

        <div style={{
          height: "100%",               // Fill bar always matches the track's full height
          width: `${pct}%`,             // Width is the percentage — this is what makes the bar fill up
          background: color,             // Color changes dynamically based on fullness
          borderRadius: 999,            // Rounded ends on the fill bar too
          transition: "width 0.4s ease", // Smooth animation: if occupancy changes, the bar slides
          //                               The "0.4s" is the duration, "ease" means start/end slowly
        }} />
        {/* This inner div IS the colored fill bar — its width drives the visual */}
      </div>
    </div>
  );
}

function CGPSLogo() {
  // Inline text-based logo so this page can render the mark without an external asset
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "flex-end",
        lineHeight: 0.82,
        paddingBottom: 8,
      }}
      aria-label="CGPS logo"
    >
      <span
        style={{
          fontFamily: "'Times New Roman', Georgia, serif",
          fontSize: 56,
          fontWeight: 400,
          color: "#ffffff",
          letterSpacing: "-0.07em",
        }}
      >
        C
      </span>
      <span
        style={{
          fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
          fontSize: 56,
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: "-0.07em",
          marginLeft: -4,
        }}
      >
        GPS
      </span>

      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 1,
          bottom: 0,
          width: 44,
          height: 7,
          background: "#46b2e9",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// This is the single component that renders the entire page.
// "export default" means this is the component Next.js will use as the page.
// ─────────────────────────────────────────────────────────────────────────────

export default function CGPSDashboard() {
  // Everything inside this function is re-evaluated every time state changes.
  // React automatically re-renders (re-runs this function and updates the DOM)
  // whenever any useState value is updated via its setter function.

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"rooms" | "officehours">("rooms");
  // activeTab → the currently selected tab: either "rooms" or "officehours"
  // setActiveTab → the function we call to switch tabs
  // useState<"rooms" | "officehours"> → TypeScript restricts the value to only those two strings
  // "rooms" → the initial/default value when the page first loads

  // ── Room booking state ─────────────────────────────────────────────────────
  const [rooms, setRooms] = useState<Room[]>(DUMMY_ROOMS);
  // rooms → the live array of room objects that React is tracking
  // setRooms → the function used to update the array (triggers a re-render)
  // DUMMY_ROOMS → the starting value; used once on first load

  const [bookedRoomId, setBookedRoomId] = useState<number | null>(null);
  // Tracks which room ID (if any) the current user has booked
  // null → user hasn't booked anything yet
  // A number → the id of the room they've booked
  // This is what prevents double-booking: if it's not null, we disable other Book buttons

  const [roomMessage, setRoomMessage] = useState<string | null>(null);
  // Holds the text of the toast message shown after booking/unbooking a room
  // null → no message currently showing
  // A string → the message to display (e.g. "✓ Booked a spot in Room 302W!")

  const [attested, setAttested] = useState(false);
  // Controls the attestation gate on the Quiet Spaces tab
  // false (default) → rooms are hidden; the checkbox prompt is shown instead
  // true → user has confirmed they're not in class; room cards are revealed

  // ── Office hours state ─────────────────────────────────────────────────────
  const [officeHours, setOfficeHours] = useState<OfficeHour[]>(DUMMY_OFFICE_HOURS);
  // officeHours → the live array of office hours entries
  // Starts with dummy data; can grow when a teacher submits the form

  const [ohMessage, setOhMessage] = useState<string | null>(null);
  // Same pattern as roomMessage but for the office hours tab
  // Shows RSVP confirmations and error messages

  const [ohSearch, setOhSearch] = useState("");
  // Stores whatever text the user has typed into the office hours search bar
  // Default is "" (empty string) = no filter applied = all entries shown
  // Updates on every keystroke via the input's onChange handler

  // ── Teacher form state ─────────────────────────────────────────────────────
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  // Controls whether the collapsible teacher form is visible
  // false (default) → form is hidden; only the "+ Post Office Hours" button shows
  // true → the form slides into view below the button

  const [teacherForm, setTeacherForm] = useState({
    name: "", subject: "", day: "Monday", start: "", end: "", room: ""
  });
  // Stores the current values of every field in the teacher form
  // Each key matches a field in the OfficeHour type (except id and userBooked)
  // "Monday" is pre-selected as a sensible default for the day dropdown
  // All text fields start empty so the form appears blank

  const [formSaved, setFormSaved] = useState(false);
  // Controls the "✓ Posted successfully!" message that briefly appears after submitting
  // false (default) → message is hidden
  // true → message appears; auto-reset to false after 2.5 seconds via setTimeout

  // ── Auto-dismiss toast messages ────────────────────────────────────────────
  useEffect(() => {
    // useEffect runs AFTER the component renders, whenever its dependencies change
    // This specific effect watches "roomMessage" and runs whenever it gets a new value

    if (!roomMessage) return;
    // If roomMessage is null or empty, there's nothing to dismiss — exit early

    const t = setTimeout(() => setRoomMessage(null), 3000);
    // setTimeout schedules a function to run after a delay
    // After 3000 milliseconds (3 seconds), we call setRoomMessage(null) to clear the toast
    // "t" stores the timer's ID so we can cancel it if needed

    return () => clearTimeout(t);
    // This is the "cleanup" function — React calls it before the next effect runs
    // If roomMessage changes again before 3 seconds are up, this cancels the old timer
    // Prevents bugs where multiple timers stack up and fight each other
  }, [roomMessage]);
  // The dependency array [roomMessage] means: re-run this effect whenever roomMessage changes
  // If we passed [] (empty), it would only run once on mount; if we passed nothing, every render

  useEffect(() => {
    // Same exact pattern as above, but for the office hours message
    if (!ohMessage) return;
    const t = setTimeout(() => setOhMessage(null), 3000);
    return () => clearTimeout(t);
  }, [ohMessage]);

  // ─────────────────────────────────────────────────────────────────────────
  // ROOM BOOKING FUNCTIONS
  // These functions update React state, which triggers an automatic re-render.
  // We never mutate (directly change) state — we always use the setter function.
  // ─────────────────────────────────────────────────────────────────────────

  function bookRoom(id: number) {
    // Called when the user clicks "Book Space" on a room card
    // "id" is the room's unique identifier passed in from the onClick handler

    if (bookedRoomId !== null) {
      // Guard: if bookedRoomId already holds a number, the user has another booking
      // We prevent them from booking a second room until they unbook the first
      setRoomMessage("You already have a room booked. Unbook it first.");
      return;
      // "return" exits the function immediately — nothing below this line runs
    }

    setRooms(prev =>
      // setRooms receives a function instead of a value — this is called the "functional update" form
      // "prev" is guaranteed to be the most up-to-date state, even if React batched updates
      prev.map(room => {
        // .map() creates a NEW array by transforming each element
        // React requires we return a new array/object rather than mutating the old one

        if (room.id !== id) return room;
        // If this isn't the room being booked, return it completely unchanged

        if (room.currentOccupancy >= room.capacity) {
          // Double-check capacity even though the button should already be disabled
          // This handles edge cases where two users book simultaneously
          setRoomMessage(`Room ${room.roomNumber} is full.`);
          return room;
          // Return the room unchanged
        }

        const newOcc = room.currentOccupancy + 1;
        // Calculate the new occupancy before building the updated room object

        setBookedRoomId(id);
        // Record that the user has now booked this room
        // This disables the "Book Space" button on all other room cards

        setRoomMessage(`✓ Booked a spot in Room ${room.roomNumber}! Your teacher has been notified.`);
        // Set the success toast message — the ✓ prefix is used to detect success vs error

        return { ...room, currentOccupancy: newOcc, userBooked: true };
        // Return a NEW object with updated fields — never mutate the original
        // { ...room } copies all existing fields; then we override just the two that changed
      })
    );
  }

  function unbookRoom(id: number) {
    // Called when the user clicks "Unbook Space" on a room card

    setRooms(prev =>
      prev.map(room => {
        if (room.id !== id) return room;
        // Skip all rooms that don't match the one being unbooked

        const newOcc = Math.max(room.currentOccupancy - 1, 0);
        // Decrement occupancy by 1
        // Math.max(..., 0) ensures the count never goes negative (a safety net)
        // Math.max(a, b) returns whichever argument is larger

        setBookedRoomId(null);
        // Clear the booked room tracker — user is now free to book a different room

        setRoomMessage(`✓ Removed your booking from Room ${room.roomNumber}.`);

        return { ...room, currentOccupancy: newOcc, userBooked: false };
        // Return the room with decremented occupancy and userBooked cleared
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OFFICE HOURS BOOKING FUNCTIONS
  // Same pattern as the room functions — functional updates, no mutation
  // ─────────────────────────────────────────────────────────────────────────

  function bookOfficeHour(id: number) {
    // Called when the user clicks "RSVP" on an office hours card

    setOfficeHours(prev =>
      prev.map(oh => {
        if (oh.id !== id) return oh;
        // Skip entries that don't match the clicked card

        if (oh.userBooked) {
          // Prevent booking the same session twice
          // This shouldn't happen since the button is hidden after booking,
          // but it's good defensive programming to check anyway
          setOhMessage("You've already RSVP'd to this session.");
          return oh;
        }

        setOhMessage(`✓ RSVP'd for ${oh.name}'s office hours on ${oh.day}!`);
        // Template literal builds a personalized confirmation message

        return { ...oh, userBooked: true };
        // Return updated entry — spread copies all fields, then override userBooked
      })
    );
  }

  function unbookOfficeHour(id: number) {
    // Called when the user clicks "Cancel RSVP" on an office hours card

    setOfficeHours(prev =>
      prev.map(oh => {
        if (oh.id !== id) return oh;
        // Skip non-matching entries

        setOhMessage(`✓ Cancelled your RSVP with ${oh.name}.`);

        return { ...oh, userBooked: false };
        // Clear the user's RSVP on this entry
      })
    );
  }

  function handleTeacherFormSubmit() {
    // Called when the teacher clicks "Post Hours" in the form

    const { name, subject, start, end, room } = teacherForm;
    // Destructuring: pulls these five fields out of the teacherForm object
    // Equivalent to writing: const name = teacherForm.name; const subject = teacherForm.subject; etc.

    if (!name || !subject || !start || !end || !room) return;
    // Validate all required fields — if ANY are empty/falsy, stop and don't submit
    // The "!" converts the string to a boolean: empty string "" → false → !false = true → we return early
    // "day" is not validated because it always has "Monday" as a default — it can never be empty

    const newEntry: OfficeHour = {
      ...teacherForm,    // Spread all form fields (name, subject, day, start, end, room) into the new object
      id: Date.now(),    // Date.now() returns the current time in milliseconds — always a unique number
      //                    e.g. 1712345678901 — effectively a unique ID
      userBooked: false, // A brand new entry always starts with nobody booked
    };

    setOfficeHours(prev => [...prev, newEntry]);
    // [...prev, newEntry] creates a new array with all existing entries PLUS the new one at the end
    // The spread "..." copies all existing items; we can't use prev.push() because that mutates state

    setTeacherForm({ name: "", subject: "", day: "Monday", start: "", end: "", room: "" });
    // Reset all form fields to their initial empty state so the form is ready for the next entry

    setFormSaved(true);
    // Show the "✓ Posted successfully!" message

    setTimeout(() => setFormSaved(false), 2500);
    // Hide the success message after 2.5 seconds
    // We don't need a cleanup here (vs useEffect) because this is a one-shot action, not a subscription
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED DATA
  // These are NOT stored in state — they're computed fresh on every render
  // from the current state values. React re-runs the whole component function
  // when state changes, so these automatically stay up-to-date.
  // ─────────────────────────────────────────────────────────────────────────

  const filteredOH = officeHours.filter(oh =>
    // .filter() returns a new array containing only the items that pass the test
    // The test: does this entry match the search string in ANY of its text fields?
    oh.name.toLowerCase().includes(ohSearch.toLowerCase()) ||
    // .toLowerCase() on both sides makes the search case-insensitive
    // "anderson".includes("and") → true, "anderson".includes("xyz") → false
    // The || (OR) means the entry passes if ANY of the four checks is true
    oh.subject.toLowerCase().includes(ohSearch.toLowerCase()) ||
    oh.day.toLowerCase().includes(ohSearch.toLowerCase()) ||
    oh.room.toLowerCase().includes(ohSearch.toLowerCase())
    // If ohSearch is "" (empty string), every .includes("") returns true
    // So an empty search box shows all entries — perfect default behavior
  );

  const groupedOH = DAYS.reduce((acc: Record<string, OfficeHour[]>, day) => {
    // .reduce() transforms an array into a single value — here, an object grouped by day
    // We iterate over the DAYS array (["Monday", "Tuesday", ...]) and build up "acc"
    // "acc" starts as {} and we add a key for each day that has entries

    const entries = filteredOH.filter(oh => oh.day === day);
    // For each day we're iterating over, find all filtered entries that belong to it

    if (entries.length > 0) acc[day] = entries;
    // Only add this day to the grouped object if it has at least one entry
    // This prevents rendering empty day sections with no cards underneath

    return acc;
    // Return the accumulator so the next iteration can build on it
  }, {});
  // The second argument {} is the initial value of acc — we start with an empty object

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
            <div style={{ marginBottom: 10 }}>
              <CGPSLogo />
            </div>
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
