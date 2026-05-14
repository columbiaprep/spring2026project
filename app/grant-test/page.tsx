"use client"

import { useAuth } from "@/context/AuthContext";

import { db } from "@/firebase-config"
import { collection, getDocs } from "firebase/firestore"
import { useEffect } from "react"

import { Card } from "@heroui/react"

import * as THREE from 'three'
import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, ThreeElements, useLoader, ThreeEvent } from '@react-three/fiber'

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { useGLTF, OrbitControls } from '@react-three/drei'

import { Model112N } from './112N'
import { MusicHallwayModel } from './MusicHallwayModel'
import { Model111N } from './111N'
import { LoungeModel } from './LoungeModel'
import { FrontDeskModel } from './FrontDeskModel'
import { LobbyHallway } from './LobbyHallway'
import { Model113N } from './113N'
import { Model110N } from './110N'
import { Model109N } from './109N'
import { CorridorModel } from './CorridorModel'
import { TechHubModel } from './TechHubModel'
import { OutsideTechHubModel } from './OutsideTechHubModel'
import { West92streetDeskModel } from './West92streetDeskModel'
import { UpperLibraryModel } from './UpperLibraryModel'
import { BasementHallway } from './BasementHallway'
import { BasementHallwayNearLibrary } from './BasementHallwayNearLibrary'
import { HallwayToTheater } from './HallwayToTheater'
import { LibraryBack } from './LibraryBack'
import { LibraryMain } from './LibraryMain'
import { LibraryRoom } from './LibraryRoom'
import { LibraryStair } from './LibraryStair'
import { StairDownNorth } from './StairDownNorth'
import { StairFromTheater } from './StairFromTheater'
import { StairFrontdesk } from './StairFrontdesk'
import { TheaterBehindStage } from './TheaterBehindStage'
import { TheaterStage } from './TheaterStage'
import { TheaterWalk } from './TheaterWalk'

export default function MapOfSchool() {

  const [basement, setBasement] = useState(true)
  const [floorOne, setFloorOne] = useState(true)
  const [floorTwo, setFloorTwo] = useState(false)
  const [floorThree, setFloorThree] = useState(false)
  const [floorFour, setFloorFour] = useState(false)
  const [floorFive, setFloorFive] = useState(false)

  const { user, loading, signOut } = useAuth()
  
  const [data, setData] = useState<object[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)

  useEffect(() => {
        async function fetchData() {
          const snapshot = await getDocs(collection(db, "students"))
          const result = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setData(result)
          console.log(data)
        }
        fetchData()
      }, [])

  // Room component defined inside MapOfSchool so it can call setSelectedRoom
  function Room({ model: Model, ...props }: { model: any; [key: string]: any }) {
    const [hovered, setHovered] = React.useState(false)
    const [active, setActive] = React.useState(false)

    return (
      <Model
        {...props}
        color={hovered ? [0.5, 0.6, 1] : 'white'}
        hovered={hovered}
        active={active}
        onPointerEnter={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerLeave={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setHovered(false)
        }}
        onClick={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          // set the selected room to the model's name (fallback to 'Room')
          const name = Model?.name || 'Room'
          setSelectedRoom(name)
          setActive(!active)
        }}
      />
    )
  }

  if (loading) return null;
  return (
    <>
      <div style={{ width: 'auto', height: '53vw' }}>

        <Canvas camera={{ position: [-2, 15, 10], fov: 50 }}>
          
          <color attach="background" args={["rgba(31, 47, 77, 1)"]} />

          <Suspense fallback={null}>
            <ambientLight intensity={Math.PI / 2} />

            {floorOne && (
              <>
                <FrontDeskModel raycast={() => null} position={[7, 0.2, -9.15]} rotation={[0, Math.PI, 0]} />
                <LoungeModel raycast={() => null} position={[5.3, 0.35, 15.3]} />
                <LobbyHallway raycast={() => null} position={[8.14, 0.1, 4.53]} />
                <OutsideTechHubModel raycast={() => null} position={[2.1, 0.27, 23.99]} />
                <West92streetDeskModel raycast={() => null} position={[5.15, 1, 31.96]} rotation={[0, Math.PI/2, 0]} />

                <MusicHallwayModel raycast={() => null} position={[0, 0, 0]} />

                <CorridorModel raycast={() => null} position={[-13.78, 0.17, 11.64]} rotation={[0, Math.PI/2, 0]} />
                
                <UpperLibraryModel raycast={() => null} position={[3.52, 0.25, -12.73]} rotation={[0, Math.PI, 0]} />

                {/* Rooms that should be clickable */}
                <Room model={TechHubModel} position={[9.3, 0.83, 25.65]} rotation={[0, Math.PI, 0]} />
                <Room model={Model112N} position={[0.8, -0.57, 2.1]} rotation={[0, Math.PI, 0]} />
                <Room model={Model111N} position={[-5.93, 0.17, -5.2]} rotation={[0, Math.PI, 0]} />
                <Room model={Model113N} position={[-5.93, 0.09, 5.5]} rotation={[0, Math.PI, 0]} />
                <Room model={Model110N} position={[-3.55, 0.35, -12.38]} rotation={[0, 2 * Math.PI, 0]} />
                <Room model={Model109N} position={[0.57, 0.07, -12.27]} rotation={[0, 2 * Math.PI, 0]} />
              </>
            )}

            {basement && (
              <>
                <LibraryStair raycast={() => null} position={[2.85, -1.8, -15.6]} rotation={[0, Math.PI, 0]} />
                <LibraryMain raycast={() => null} position={[-2.15, -2.7, -12.47]} />
                <LibraryBack raycast={() => null} position={[-4.18, -2.57, -8.43]} />
                <LibraryRoom raycast={() => null} position={[2.05, -2.65, -9.35]} rotation={[0, Math.PI, 0]} />
                <BasementHallwayNearLibrary raycast={() => null} position={[0.85, -2.63, -4.45]} rotation={[0, Math.PI/2, 0]} />
                <BasementHallway raycast={() => null} position={[9.28, -2.63, -7]} rotation={[0, 0, 0]} />
                <HallwayToTheater raycast={() => null} position={[6.78, -3.1, 5.3]} rotation={[0, Math.PI, 0]} />
                
                <StairFromTheater raycast={() => null} position={[8.5, -5.55, 11.92]} rotation={[0, Math.PI/2, 0]} />
                <TheaterStage raycast={() => null} position={[4.15, -5.55, 17.61]} rotation={[0, -Math.PI/2, 0]} />
                <TheaterWalk raycast={() => null} position={[4.85, -5.55, 25.6]} rotation={[0, Math.PI, 0]} />
                <TheaterBehindStage raycast={() => null} position={[11.18, -5.55, 17.1]} rotation={[0, Math.PI, 0]} />
              </>
            )}

            <>
              <StairFrontdesk raycast={() => null} position={[11.8, -2.45, -8.35]} />
              <StairFrontdesk raycast={() => null} position={[11.8, 0.25, -8.35]} />
              <StairFrontdesk raycast={() => null} position={[11.8, 2.95, -8.35]} />
              <StairFrontdesk raycast={() => null} position={[11.8, 5.65, -8.35]} />

              <StairDownNorth raycast={() => null} position={[11.8, -2.9, -1.1]} rotation={[0, Math.PI, 0]} />
              <StairDownNorth raycast={() => null} position={[11.8, 0.45, -1.1]} rotation={[0, Math.PI, 0]} />
              <StairDownNorth raycast={() => null} position={[11.8, 3, -1.1]} rotation={[0, Math.PI, 0]} />
              <StairDownNorth raycast={() => null} position={[11.8, 6, -1.1]} rotation={[0, Math.PI, 0]} />
            </>
            
            <OrbitControls />
          </Suspense>
        </Canvas>
      </div>
      

      {/* popup card for selected room */}
      {selectedRoom && (
        <div style={{ position: 'fixed', right: 20, top: 65, zIndex: 30 }}>
          <Card>
            <div style={{ padding: 12, minWidth: 180 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{selectedRoom}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedRoom(null)} style={{ padding: '6px 10px' }}>Close</button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <div style={{ position: 'fixed', left: 20, top: 70, zIndex: 40, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setBasement(!basement)}>Basement</button>
          <button onClick={() => setFloorOne(!floorOne)}>Floor One</button>
          <button onClick={() => setFloorTwo(!floorTwo)}>Floor Two</button>
          <button onClick={() => setFloorThree(!floorThree)}>Floor Three</button>
          <button onClick={() => setFloorFour(!floorFour)}>Floor Four</button>
          <button onClick={() => setFloorFive(!floorFive)}>Floor Five</button>
        </div>
      </Card>
    </>
  )
}
