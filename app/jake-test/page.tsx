"use client"; 
// This tells Next.js this page runs in the browser and can use state and effects.

import { useEffect, useState } from "react";
// useState lets us store data.
// useEffect lets us run code when the page loads.

type Room = {
  id: number; 
  // Unique ID for each room.

  roomNumber: string; 
  // The room number shown to users.

  className: string; 
  // The name of the scheduled class.

  classStart: string; 
  // When the class starts (HH:MM format).

  classEnd: string; 
  // When the class ends (HH:MM format).

  booked: boolean; 
  // True if someone manually booked the room.

  capacity: number; 
  // Max number of people allowed in the room.

  currentOccupancy: number; 
  // How many students are currently inside.

  teacher: string; 
  // Name of the teacher overseeing this room.
};

// This function checks if a class is happening right now.
function isClassInSession(start: string, end: string) {

  const now = new Date(); 
  // Get current time from the computer.

  const current = now.toTimeString().slice(0, 5); 
  // Convert time to HH:MM format.

  return current >= start && current <= end; 
  // Return true if current time is between start and end.
}

export default function Home() {
  // This is the main page component.

  const [rooms, setRooms] = useState<Room[]>([]);
  // rooms stores all classroom data.
  // setRooms updates that data.

  useEffect(() => {
    // This runs once when the page loads.

    const dummyRooms: Room[] = [
      // Fake test data for now.

      {
        id: 1,
        roomNumber: "101",
        className: "Algebra II",
        classStart: "09:15",
        classEnd: "10:00",
        booked: false,
        capacity: 20,
        currentOccupancy: 3,
        teacher: "Mr. Smith",
      },
      {
        id: 2,
        roomNumber: "204",
        className: "Physics",
        classStart: "11:45",
        classEnd: "12:30",
        booked: true,
        capacity: 20,
        currentOccupancy: 20,
        teacher: "Ms. Johnson",
      },
      {
        id: 3,
        roomNumber: "305",
        className: "English",
        classStart: "1:20",
        classEnd: "2:10",
        booked: false,
        capacity: 18,
        currentOccupancy: 0,
        teacher: "Mr. Lee",
      },
    ];

    setRooms(dummyRooms);
    // Save dummy data into state so it displays on screen.

  }, []); 
  // Empty brackets mean this runs only once on load.

  return (
    // Everything below is what gets displayed on the page.

    <div className="min-h-screen bg-zinc-100 p-8 dark:bg-zinc-900">
      {/* Page background styling */}

      <h1 className="mb-8 text-4xl font-bold text-zinc-800 dark:text-white">
        CGPS Room Availability Dashboard
      </h1>
      {/* Big page title */}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Creates a grid layout for the room cards */}

        {rooms.map((room) => {
          // Loop through every room and create a card.

          const classInSession = isClassInSession(
            room.classStart,
            room.classEnd
          );
          // Check if this room currently has class happening.

          let status = "Available";
          // Default status is Available.

          let statusColor = "bg-green-500";
          // Default color is green.

          if (classInSession) {
            // If class is happening now...
            status = "Class in Session";
            statusColor = "bg-red-500";
          } else if (room.booked) {
            // If no class but manually booked...
            status = "Booked";
            statusColor = "bg-yellow-500";
          }

          return (
            // Return a card for this room.

            <div
              key={room.id}
              className="rounded-2xl bg-white p-6 shadow-md dark:bg-zinc-800"
            >
              {/* Card container */}

              <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white">
                Room {room.roomNumber}
              </h2>
              {/* Room number */}

              <p className="mt-2 text-sm text-zinc-500">
                Scheduled Class: {room.className}
              </p>
              {/* Show scheduled class name */}

              <p className="text-sm text-zinc-500">
                {room.classStart} – {room.classEnd}
              </p>
              {/* Show class time range */}

              <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                Teacher: {room.teacher ? room.teacher : "N/A"}
              </p>
              {/* Show the teacher overseeing the room */}

              <div
                className={`mt-4 inline-block rounded-full px-4 py-1 text-sm font-medium text-white ${statusColor}`}
              >
                {status}
              </div>
              {/* Colored badge showing room status */}

              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                Occupancy: {room.currentOccupancy} / {room.capacity}
              </p>
              {/* Show how many students are inside */}

              {!classInSession && !room.booked && (
                // Only show button if room is actually available.

                <button className="mt-4 w-full rounded-xl bg-blue-600 py-2 text-white transition hover:bg-blue-700">
                  Book Space
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}