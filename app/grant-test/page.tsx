"use client"

import * as THREE from 'three'
import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, ThreeElements, useLoader } from '@react-three/fiber'

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { useGLTF, OrbitControls } from '@react-three/drei'

import { Model } from './Model'

export default function Grant() {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Canvas>
                <Suspense fallback={null}>
                    <ambientLight intensity={Math.PI / 2} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
                    <Model position={[-1.2, 0, 0]} />
                    <OrbitControls />
                </Suspense>
            </Canvas>
        </div>
    )
}
