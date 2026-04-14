"use client"

import * as THREE from 'three'
import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, ThreeElements, useLoader } from '@react-three/fiber'

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { useGLTF, OrbitControls } from '@react-three/drei'

import { MusicRoom1Model } from './MusicRoom1Model'
import { MusicHallwayModel } from './MusicHallwayModel'
import { MusicRoom2Model } from './MusicRoom2Model'
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

export default function Grant() {

  const [floorOne, setFloorOne] = useState(false)

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <button
        onClick={() => {
          setFloorOne(!floorOne)
        }}
      >
        Floor 1
      </button>
      <Canvas camera={{ position: [-2, 15, 10], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={Math.PI / 2} />

          <FrontDeskModel position={[7, 0.2, -9.15]} rotation={[0, Math.PI, 0]} />
          <LoungeModel position={[5.3, 0.35, 15.3]} />
          <LobbyHallway position={[8.14, 0.1, 4.53]} />
          <OutsideTechHubModel position={[2.1, 0.27, 23.99]} />
          <West92streetDeskModel position={[5.15, 1, 31.96]} rotation={[0, Math.PI/2, 0]} />

          <MusicHallwayModel position={[0, 0, 0]} />

          <CorridorModel position={[-13.78, 0.17, 11.64]} rotation={[0, Math.PI/2, 0]} />
          
          <UpperLibraryModel position={[3.52, 0.25, -12.73]} rotation={[0, Math.PI, 0]} />

          <Room
          model={TechHubModel}
          position={[9.3, 0.83, 25.65]}
          rotation={[0, Math.PI, 0]}
          />
          <Room 
          model={MusicRoom1Model}
          position={[0.8, -0.57, 2.1]}
          rotation={[0, Math.PI, 0]}
          />
          <Room 
          model={MusicRoom2Model}
          position={[-5.93, 0.17, -5.2]}
          rotation={[0, Math.PI, 0]}
          />
          <Room
          model={Model113N}
          position={[-5.93, 0.09, 5.5]}
          rotation={[0, Math.PI, 0]}
          />
          <Room
          model={Model110N}
          position={[-3.55, 0.35, -12.38]}
          rotation={[0, 2 * Math.PI, 0]}
          />
          <Room
          model={Model109N}
          position={[0.57, 0.07, -12.27]}
          rotation={[0, 2 * Math.PI, 0]}
          />

          {floorOne && (
            <Room
            model={Model109N}
            position={[0.57, 2.75, -12.27]}
            rotation={[0, 2 * Math.PI, 0]}
            />
          )}
          
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  )
}


function Room({ model: Model, ...props }) {
  const [hovered, setHovered] = React.useState(false)
  const [active, setActive] = React.useState(false)

  return (
    <Model
      {...props}
      color = {hovered ? [0.5, 0.6, 1] : 'white'}
      hovered={hovered}
      active={active}
      
      onPointerEnter={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerLeave={(e) => {
        e.stopPropagation()
        setHovered(false)
      }}
      onClick={(e) => {
        e.stopPropagation()
        setActive(!active)
      }}
    />
  )
}