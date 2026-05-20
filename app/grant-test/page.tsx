"use client"

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

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
import { FloorThreeSouthHallway } from './FloorThreeSouthHallway'
import { FloorThreeWalkway } from './FloorThreeWalkway'
import { SouthStairsNearTheater } from './SouthStairsNearTheater'
import { SouthTheaterStairsBottom } from './SouthTheaterStairsBottom'
import { StairsSouth } from './StairsSouth'
import { TerraceEast } from './TerraceEast'
import { TerraceWest } from './TerraceWest'
import { TheaterLobby } from './TheaterLobby'
import { TheaterWalkLeft } from './TheaterWalkLeft'
import { TopOfTheater } from './TopOfTheater'
import { WeightRoom } from './WeightRoom'

const ROOM_LABELS: Record<string, string> = {
  TechHubModel: "Tech Hub",
  Model112N: "112N",
  Model111N: "111N",
  Model113N: "113N",
  Model110N: "110N",
  Model109N: "109N",
}

export default function MapOfSchool() {

  const [basement, setBasement] = useState(true)
  const [floorOne, setFloorOne] = useState(true)
  const [floorTwo, setFloorTwo] = useState(false)
  const [floorThree, setFloorThree] = useState(false)
  const [floorFour, setFloorFour] = useState(false)
  const [floorFive, setFloorFive] = useState(false)

  const { user, loading, signOut } = useAuth()
  const router = useRouter()

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
          const modelName = Model?.name || 'Room'
          const label = ROOM_LABELS[modelName] || modelName
          setSelectedRoom(label)
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


            {floorTwo && (
              <>
                <FloorThreeSouthHallway raycast={() => null} position={[0, 0, 0]} />
                <FloorThreeWalkway raycast={() => null} position={[-1.5, 0, -7.5]} rotation={[0, Math.PI/2, 0]} />
                
                
                <TerraceEast raycast={() => null} position={[0, 0, -15.5]} rotation={[0, Math.PI/2, 0]} />
                <TerraceWest raycast={() => null} position={[7, 0, -15.5]} rotation={[0, Math.PI/2, 0]} />
                <WeightRoom raycast={() => null} position={[-1.5, 0, -15.5]} rotation={[0, Math.PI/2, 0]} />
              </>
            )}

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

                {/* Ground plane — sits just below the lowest first-floor model (y≈-0.57) to create a
                    visual ground level and separate floor 1 from the basement below */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, -1.5, 1.7]}>
                  {/* Wide enough to cover the full building footprint */}
                  <planeGeometry args={[7.5, 20]} />
                  {/* Dark blue-grey tint matching the scene background, semi-transparent so the
                      basement is still faintly visible beneath it */}
                  <meshStandardMaterial color="lightgray" transparent opacity={1} />
                </mesh>
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
                
                <TopOfTheater raycast={() => null} position={[4, -2.9, 31.5]} rotation={[0, Math.PI/2, 0]} />
                <StairFromTheater raycast={() => null} position={[8.5, -5.55, 11.92]} rotation={[0, Math.PI/2, 0]} />
                <TheaterStage raycast={() => null} position={[4.15, -5.55, 17.61]} rotation={[0, -Math.PI/2, 0]} />
                <TheaterWalk raycast={() => null} position={[4.85, -5.55, 25.6]} rotation={[0, Math.PI, 0]} />
                <TheaterWalkLeft raycast={() => null} position={[-1.34, -5.9, 26.5]} rotation={[0, 0, 0]} />
                <TheaterBehindStage raycast={() => null} position={[11.18, -5.55, 17.1]} rotation={[0, Math.PI, 0]} />
                <TheaterLobby raycast={() => null} position={[4.7, -5.62, 34.88]} rotation={[0, -Math.PI/2, 0]} />

                <SouthTheaterStairsBottom raycast={() => null} position={[6.05, -5.68, 35.18]} rotation={[0, Math.PI, 0]} />
                <SouthStairsNearTheater raycast={() => null} position={[1.8, -3, 35.2]} rotation={[0, Math.PI/2, 0]} />
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

              <StairsSouth raycast={() => null} position={[0.5, 3, 38.2]} rotation={[0, -Math.PI/2, 0]} />
              <StairsSouth raycast={() => null} position={[0.5, 0.64, 38.2]} rotation={[0, -Math.PI/2, 0]} />
              <StairsSouth raycast={() => null} position={[0.5, -3, 38.2]} rotation={[0, -Math.PI/2, 0]} />
            </>
            
            <OrbitControls />
          </Suspense>
        </Canvas>
      </div>
      

      {/* Popup card shown when a room is clicked — fixed to the top-right, 20px from each edge to match floor controls */}
      {selectedRoom && (
        <div style={{ position: 'fixed', right: 20, top: 90, zIndex: 30 }}>
          <Card style={{
            background: 'rgba(30,30,30,0.75)',         /* translucent dark grey */
            backdropFilter: 'blur(12px)',               /* frosted glass blur */
            borderRadius: 16,
            minWidth: 240,
            border: '1px solid rgba(255,255,255,0.2)', /* subtle light border, matches floor controls */
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ padding: 20 }}>
              {/* Room name */}
              <div style={{ fontWeight: 700, fontSize: 17, color: 'white', marginBottom: 14 }}>{selectedRoom}</div>
              {/* Close button aligned to the right */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedRoom(null)}
                  style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13 }}
                >
                  Close
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Floor visibility toggle controls — fixed to the bottom-left, 20px from each edge to match room info card */}
      <div style={{ position: 'fixed', left: 20, bottom: 20, zIndex: 40 }}>
        {/* More transparent frosted glass card so it doesn't distract from the map */}
        <Card style={{
          background: 'rgba(30,30,30,0.45)',         /* more transparent than the room info card */
          backdropFilter: 'blur(12px)',               /* frosted glass blur */
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.2)', /* subtle light border, matches room info card */
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
            {/* Floors listed top-to-bottom from highest to lowest, so they feel spatially correct */}
            {/* Blue tint when the floor is toggled on, dim when off */}
            <button onClick={() => setFloorFive(!floorFive)}  style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, background: floorFive  ? 'rgba(80,130,255,0.55)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer' }}>Floor Five</button>
            <button onClick={() => setFloorFour(!floorFour)}  style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, background: floorFour  ? 'rgba(80,130,255,0.55)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer' }}>Floor Four</button>
            <button onClick={() => setFloorThree(!floorThree)} style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, background: floorThree ? 'rgba(80,130,255,0.55)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer' }}>Floor Three</button>
            <button onClick={() => setFloorTwo(!floorTwo)}   style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, background: floorTwo   ? 'rgba(80,130,255,0.55)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer' }}>Floor Two</button>
            <button onClick={() => setFloorOne(!floorOne)}   style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, background: floorOne   ? 'rgba(80,130,255,0.55)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer' }}>Floor One</button>
            <button onClick={() => setBasement(!basement)}   style={{ padding: '4px 10px', borderRadius: 7, fontSize: 12, background: basement   ? 'rgba(80,130,255,0.55)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer' }}>Basement</button>
          </div>
        </Card>
      </div>
    </>
  )
}
