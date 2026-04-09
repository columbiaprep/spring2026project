"use client"

import * as THREE from 'three'
import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, ThreeElements, useLoader } from '@react-three/fiber'

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { useGLTF, OrbitControls } from '@react-three/drei'

import { MusicRoom1Model } from './MusicRoom1Model'
import { MusicHallwayModel } from './MusicHallwayModel'
import { MusicRoom2Model } from './MusicRoom2Model'

export default function Grant() {

    const [hovered, setHovered] = useState(false)

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Canvas>
                <Suspense fallback={null}>
                        <ambientLight intensity={Math.PI / 2} />

                        <MusicHallwayModel position={[0, 0, 0]} />
                        <MusicRoom1Model 
                        position={[0.8, -0.57, 2.1]}
                        rotation={[0, Math.PI, 0]}
                        color = {hovered ? [0.5, 0.6, 1] : 'white'}
                        hovered = {hovered}
                        onPointerOver={(e) => {
                            e.stopPropagation()
                            setHovered(true)
                        }}
                        onPointerOut={(e) => {
                            e.stopPropagation()
                            setHovered(false)
                        }}
                        />
                        <MusicRoom2Model
                        position={[-5.93, 0.17, -5.2]}
                        rotation={[0, Math.PI, 0]}
                        color = {hovered ? [0.5, 0.6, 1] : 'white'}
                        hovered = {hovered}
                        onPointerOver={(e) => {
                            e.stopPropagation()
                            setHovered(true)
                        }}
                        onPointerOut={(e) => {
                            e.stopPropagation()
                            setHovered(false)
                        }}
                        />
                        
                        <OrbitControls />
                </Suspense>
            </Canvas>
        </div>
    )
}