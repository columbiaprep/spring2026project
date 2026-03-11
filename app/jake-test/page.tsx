"use client"; 
// This tells Next.js that this component must run in the browser.
// We need this because we are using interactive features like button clicks.

import { useEffect, useState } from "react";
// Import React hooks.
// useState → allows the component to store changing data.
// useEffect → allows code to run automatically when the page loads.



type Room = {
  // This TypeScript "type" defines what data each room must contain.

  id: number; 
  // Unique numeric ID for the room.

  roomNumber: string; 
  // Visible room number.

  className: string; 
  // Scheduled class name.

  classStart: string; 
  // Class start time in HH:MM format.

  classEnd: string; 
  // Class end time in HH:MM format.

  booked: boolean; 
  // Indicates if the room is booked or locked.

  capacity: number; 
  // Maximum number of students allowed.

  currentOccupancy: number; 
  // Current number of students inside the room.

  teacher: string; 
  // Teacher supervising the room.

  userBooked: boolean;
  // NEW FIELD
  // Tracks whether THIS user has booked a spot.
  // This allows us to show an "Unbook" button later.
};



function isClassInSession(start: string, end: string) {
  // This function checks if the class is currently happening.

  const now = new Date();
  // Create a Date object containing the current time.

  const current = now.toTimeString().slice(0, 5);
  // Convert the time into HH:MM format.

  return current >= start && current <= end;
  // Returns TRUE if the current time falls between start and end.
}



export default function Home() {
  // Main page component.



  const [rooms, setRooms] = useState<Room[]>([]);
  // "rooms" stores all classroom objects.
  // setRooms updates that data.



  const [message, setMessage] = useState<string | null>(null);
  // Stores confirmation messages such as:
  // "You booked a space in Room 302W".



  useEffect(() => {
    // This code runs once when the page loads.

    const dummyRooms: Room[] = [
      {
        id: 1,
        roomNumber: "302W",
        className: "Algebra II",
        classStart: "09:15",
        classEnd: "10:00",
        booked: false,
        capacity: 20,
        currentOccupancy: 3,
        teacher: "Mr. A",
        userBooked: false
        // Initially the user has not booked this room.
      },
      {
        id: 2,
        roomNumber: "504N",
        className: "Physics",
        classStart: "11:45",
        classEnd: "12:30",
        booked: true,
        capacity: 20,
        currentOccupancy: 20,
        teacher: "Ms. B",
        userBooked: false
      },
      {
        id: 3,
        roomNumber: "408N",
        className: "English",
        classStart: "13:20",
        classEnd: "14:10",
        booked: false,
        capacity: 18,
        currentOccupancy: 0,
        teacher: "Mr. C",
        userBooked: false
      },
    ];

    setRooms(dummyRooms);
    // Save dummy data into state so React can display it.

  }, []);



  function bookRoom(id: number) {
    // This function runs when the user presses "Book Space".

    setRooms((prevRooms) =>
      prevRooms.map((room) => {

        if (room.id === id) {
          // If this is the selected room...

          if (room.userBooked) {
            // Prevent double booking.

            setMessage("You already booked this room.");
            return room;
          }

          if (room.currentOccupancy >= room.capacity) {
            // Prevent booking if room is full.

            setMessage(`Room ${room.roomNumber} is full.`);
            return room;
          }

          const newOccupancy = room.currentOccupancy + 1;
          // Increase occupancy by 1.

          const updatedRoom = {
            ...room,
            // Spread operator (...) copies all original room properties.

            currentOccupancy: newOccupancy,
            // Replace occupancy with new value.

            userBooked: true,
            // Mark that THIS user booked a seat.

            booked: newOccupancy >= room.capacity
            // Automatically mark room as booked if capacity reached.
          };

          setMessage(`You booked a space in Room ${room.roomNumber}!`);

          return updatedRoom;
        }

        return room;
      })
    );
  }



  function unbookRoom(id: number) {
    // This function runs when the user presses "Unbook".

    setRooms((prevRooms) =>
      prevRooms.map((room) => {

        if (room.id === id) {

          if (!room.userBooked) {
            // Prevent unbooking if user never booked.

            return room;
          }

          const newOccupancy = Math.max(room.currentOccupancy - 1, 0);
          // Reduce occupancy by 1.
          // Math.max ensures the number never goes below 0.

          const updatedRoom = {
            ...room,

            currentOccupancy: newOccupancy,

            userBooked: false,
            // User no longer has a booking.

            booked: false
            // Unlock the room if someone leaves.
          };

          setMessage(`You removed your booking from Room ${room.roomNumber}.`);

          return updatedRoom;
        }

        return room;
      })
    );
  }



  return (
  // The return statement tells React what HTML (JSX) to display on the page.
  // Everything inside the parentheses is the content of the page.

  <div className="min-h-screen bg-zinc-100 p-8 dark:bg-zinc-900">
    {/* 
      This is the main container for the page.
      - min-h-screen → minimum height is the full browser window.
      - bg-zinc-100 → light background color.
      - p-8 → padding around the edges.
      - dark:bg-zinc-900 → dark mode background color.
    */}

    <h1 className="mb-6 text-4xl font-bold text-zinc-800 dark:text-white">
      CGPS Room Availability Dashboard
    </h1>
    {/* 
      Page title.
      - mb-6 → margin bottom spacing.
      - text-4xl → large font size.
      - font-bold → bold text.
      - text-zinc-800 → dark text for light mode.
      - dark:text-white → white text for dark mode.
    */}

    {message && (
      // Conditional rendering: only show this block if "message" has text.
      // The && operator works like: if message exists, display the following JSX.

      <div className="mb-6 rounded-lg bg-green-600 p-3 text-white">
        {message}
        {/* Display the message text from the state, e.g., "You booked a space!" */}
      </div>
    )}

    <div className="grid gap-6 md:grid-cols-3">
      {/* 
        Grid container for all the room cards.
        - grid → use CSS grid layout.
        - gap-6 → space between grid items.
        - md:grid-cols-3 → on medium screens and up, show 3 columns.
      */}

      {rooms.map((room) => {
        // Loop through the rooms array.
        // For each room, we create a card.
        // "room" represents the current room object in this iteration.

        const classInSession = isClassInSession(
          room.classStart,
          room.classEnd
        );
        // Call the helper function to check if the class is happening now.
        // Returns true or false.

        let status = "Available";
        let statusColor = "bg-green-500";
        // Default status values.
        // status → text shown on the badge.
        // statusColor → color class for the badge.

        if (classInSession) {
          status = "Class in Session";
          statusColor = "bg-red-500";
        }
        // If the class is happening right now, override defaults.

        else if (room.currentOccupancy >= room.capacity) {
          status = "Full";
          statusColor = "bg-gray-600";
        }
        // If the room reached max capacity, show as Full.

        else if (room.booked) {
          status = "Booked";
          statusColor = "bg-yellow-500";
        }
        // If room is manually booked but not full, show as Booked.

        return (
          // Return a JSX card for this room.

          <div
            key={room.id}
            // key is required by React to efficiently track list items.
            className="rounded-2xl bg-white p-6 shadow-md dark:bg-zinc-800"
          >
            {/* 
              Room card container.
              - rounded-2xl → rounded corners.
              - bg-white → white background.
              - p-6 → padding inside the card.
              - shadow-md → drop shadow.
              - dark:bg-zinc-800 → dark mode background.
            */}

            <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white">
              Room {room.roomNumber}
            </h2>
            {/* Room number title. */}

            <p className="mt-2 text-sm text-zinc-500">
              Scheduled Class: {room.className}
            </p>
            {/* Display the class scheduled in this room. */}

            <p className="text-sm text-zinc-500">
              {room.classStart} – {room.classEnd}
            </p>
            {/* Display the start and end times. */}

            <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200 font-medium">
              Teacher: {room.teacher || "N/A"}
            </p>
            {/* Display the teacher. If teacher is empty/null, show "N/A". */}

            <div
              className={`mt-4 inline-block rounded-full px-4 py-1 text-sm font-medium text-white ${statusColor}`}
            >
              {status}
            </div>
            {/* 
              Badge showing room status.
              - mt-4 → margin top.
              - inline-block → size matches content.
              - rounded-full → pill shape.
              - px-4 py-1 → padding inside badge.
              - text-sm → small text.
              - font-medium → medium weight font.
              - text-white → text color.
              - ${statusColor} → dynamic color based on room status.
            */}

            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
              Occupancy: {room.currentOccupancy} / {room.capacity}
            </p>
            {/* Show current occupancy out of total capacity. */}

            {/* BOOK BUTTON */}
            {!classInSession &&
              !room.userBooked &&
              room.currentOccupancy < room.capacity && (
                // Conditional rendering:
                // Only show Book button if:
                // - Class is not in session.
                // - User has not already booked this room.
                // - Room is not full.

                <button
                  onClick={() => bookRoom(room.id)}
                  // When clicked, call the bookRoom function with the room's ID.
                  className="mt-4 w-full rounded-xl bg-blue-600 py-2 text-white hover:bg-blue-700"
                >
                  Book Space
                </button>
            )}

            {/* UNBOOK BUTTON */}
            {!classInSession && room.userBooked && (
              // Conditional rendering:
              // Only show Unbook button if:
              // - Class is not in session.
              // - User has booked this room.

              <button
                onClick={() => unbookRoom(room.id)}
                // When clicked, call the unbookRoom function with the room's ID.
                className="mt-4 w-full rounded-xl bg-red-600 py-2 text-white hover:bg-red-700"
              >
                Unbook Space
              </button>
            )}
          </div>
        );
      })}
    </div>
  </div>
  )
}