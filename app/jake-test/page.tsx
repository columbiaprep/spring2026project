"use client"; 
// This line tells Next.js that this file should run in the browser.
// By default, Next.js components can run on the server.
// We need browser execution because we use interactive features like state and button clicks.

import { useEffect, useState } from "react";
// We are importing two special React tools called "hooks".
// Hooks are built-in functions that allow React components to store data and react to events.
//
// useState → allows us to store changing data inside the page.
// useEffect → allows us to run code automatically when the page loads.

type Room = {
  // "type" defines the structure of a Room object.
  // Think of it as a blueprint describing what information every room must contain.

  id: number; 
  // A unique numeric identifier for the room.
  // This helps React keep track of each room when rendering lists.

  roomNumber: string; 
  // The visible room number (example: "302W").

  className: string; 
  // The name of the class normally scheduled in this room.

  classStart: string; 
  // The time the class starts.
  // Stored as a string in HH:MM format.

  classEnd: string; 
  // The time the class ends.
  // Also stored as HH:MM.

  booked: boolean; 
  // A boolean means true or false.
  // true = the room has been booked manually.
  // false = the room is not booked.

  capacity: number; 
  // Maximum number of students allowed inside the room.

  currentOccupancy: number; 
  // Current number of students inside the room.

  teacher: string; 
  // The teacher supervising this room.
};



function isClassInSession(start: string, end: string) {
  // This is a normal JavaScript function.
  // Functions group together code so we can reuse it easily.
  //
  // This function checks whether a class is happening RIGHT NOW.
  //
  // It takes two inputs:
  // start → class start time
  // end → class end time

  const now = new Date();
  // This creates a new Date object containing the current date and time.

  const current = now.toTimeString().slice(0, 5);
  // now.toTimeString() converts the time into text.
  // Example: "09:42:31 GMT..."
  //
  // .slice(0,5) extracts only the first five characters.
  // That gives us "HH:MM".

  return current >= start && current <= end;
  // This compares the current time to the class start and end times.
  //
  // >= means "greater than or equal to"
  // <= means "less than or equal to"
  //
  // If the current time is between those values,
  // the function returns TRUE.
  //
  // Otherwise it returns FALSE.
}



export default function Home() {
  // This is the main React component for the page.
  // In Next.js, a page is simply a function that returns visual content.
  //
  // "export default" means this is the main thing this file provides.



  const [rooms, setRooms] = useState<Room[]>([]);
  // useState creates a piece of stored data called "state".
  //
  // rooms → the current list of room objects
  // setRooms → a function used to update that list
  //
  // <Room[]> tells TypeScript that the state will contain an array of Room objects.
  //
  // [] means we start with an empty list.



  const [message, setMessage] = useState<string | null>(null);
  // This creates another state variable called "message".
  //
  // This will store booking confirmation messages.
  //
  // string | null means:
  // - either a text message
  // - or nothing (null)



  useEffect(() => {
    // useEffect runs code automatically when the component loads.
    //
    // This is useful for things like:
    // - fetching data
    // - initializing values
    // - loading test data

    const dummyRooms: Room[] = [
      // This is fake test data.
      // Each object inside this list represents a classroom.

      {
        id: 1,
        // Unique ID used by React.

        roomNumber: "302W",
        // Visible room number.

        className: "Algebra II",
        // Scheduled class.

        classStart: "09:15",
        // Class start time.

        classEnd: "10:00",
        // Class end time.

        booked: false,
        // Room is not currently booked.

        capacity: 20,
        // Maximum allowed students.

        currentOccupancy: 3,
        // Currently 3 students inside.

        teacher: "Mr. A",
        // Teacher supervising.
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
      },
    ];



    setRooms(dummyRooms);
    // This saves the dummy data into the rooms state.
    // React will automatically update the page display when state changes.

  }, []);
  // The empty array means this effect runs ONLY once when the page loads.



  function bookRoom(id: number) {
    // This function runs when someone clicks "Book Space".
    //
    // The id parameter tells us which room is being booked.

    setRooms((prevRooms) =>
      // setRooms updates the room state.
      //
      // Instead of replacing the entire list,
      // we pass a function that receives the previous value.
      //
      // prevRooms represents the previous array of rooms.

      prevRooms.map((room) => {
        // map() loops through every room in the list.
        //
        // For each room, we return either:
        // - the original room
        // - or an updated version.

        if (room.id === id) {
          // If the current room matches the clicked room...

          if (room.currentOccupancy >= room.capacity) {
            // If the room is already full...

            setMessage(`Room ${room.roomNumber} is already full.`);
            // Show a message saying the room cannot be booked.

            return room;
            // Return the original room unchanged.
          }

          const newOccupancy = room.currentOccupancy + 1;
          // Increase the occupancy by 1.



          const updatedRoom = {
            ...room,
            // The "spread operator" (...) copies all properties
            // from the existing room object.
            //
            // Example:
            //
            // room = { id:1, capacity:20 }
            //
            // ...room copies those values into the new object.
            //
            // This prevents us from manually rewriting every field.

            currentOccupancy: newOccupancy,
            // Replace the occupancy value with the new one.

            booked: newOccupancy >= room.capacity ? true : room.booked
            // If the room reaches capacity,
            // automatically mark it as booked.
          };



          setMessage(`You successfully booked a space in Room ${room.roomNumber}!`);
          // Show confirmation message.

          return updatedRoom;
          // Return the updated room object.
        }

        return room;
        // If this is not the selected room,
        // return it unchanged.
      })
    );
  }



  return (
    // Everything inside return() is what gets displayed on the webpage.

    <div className="min-h-screen bg-zinc-100 p-8 dark:bg-zinc-900">
      {/* This creates the main page container */}

      <h1 className="mb-6 text-4xl font-bold text-zinc-800 dark:text-white">
        CGPS Room Availability Dashboard
      </h1>
      {/* Large title text */}



      {message && (
        // This is conditional rendering.
        //
        // If "message" contains text,
        // React will display this box.

        <div className="mb-6 rounded-lg bg-green-600 p-3 text-white">
          {message}
          {/* The actual message text */}
        </div>
      )}



      <div className="grid gap-6 md:grid-cols-3">
        {/* This creates a grid layout for the room cards. */}



        {rooms.map((room) => {
          // This loops through each room and creates a card.

          const classInSession = isClassInSession(
            room.classStart,
            room.classEnd
          );
          // Check if the class is currently happening.



          let status = "Available";
          // Default room status.

          let statusColor = "bg-green-500";
          // Default status color (green).



          if (classInSession) {
            status = "Class in Session";
            statusColor = "bg-red-500";
          }

          else if (room.currentOccupancy >= room.capacity) {
            status = "Full";
            statusColor = "bg-gray-600";
          }

          else if (room.booked) {
            status = "Booked";
            statusColor = "bg-yellow-500";
          }



          return (

            <div
              key={room.id}
              // key helps React track elements when rendering lists.

              className="rounded-2xl bg-white p-6 shadow-md dark:bg-zinc-800"
            >

              <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white">
                Room {room.roomNumber}
              </h2>



              <p className="mt-2 text-sm text-zinc-500">
                Scheduled Class: {room.className}
              </p>



              <p className="text-sm text-zinc-500">
                {room.classStart} – {room.classEnd}
              </p>



              <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                Teacher: {room.teacher ? room.teacher : "N/A"}
              </p>
              {/* If teacher exists, show it.
                 Otherwise show "N/A". */}



              <div
                className={`mt-4 inline-block rounded-full px-4 py-1 text-sm font-medium text-white ${statusColor}`}
              >
                {status}
              </div>



              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                Occupancy: {room.currentOccupancy} / {room.capacity}
              </p>



              {!classInSession &&
                !room.booked &&
                room.currentOccupancy < room.capacity && (

                <button
                  onClick={() => bookRoom(room.id)}
                  // When the button is clicked,
                  // run the bookRoom function.

                  className="mt-4 w-full rounded-xl bg-blue-600 py-2 text-white transition hover:bg-blue-700"
                >
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