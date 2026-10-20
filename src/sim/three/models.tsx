import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { SignId } from '../../components/signs/signs'
import { geo, mat, signMaterial } from './materials'

// Low-poly models. Every model faces -Z (forward) with its origin on the ground at its centre.

type V3 = [number, number, number]

export function B({ p, s, c, m, r, cast = true }: { p: V3; s: V3; c?: string; m?: THREE.Material; r?: V3; cast?: boolean }) {
  return <mesh geometry={geo.box()} material={m ?? mat(c ?? '#888')} position={p} scale={s} rotation={r} castShadow={cast} receiveShadow />
}

function Wheel({ p, r = 0.33, w = 0.22 }: { p: V3; r?: number; w?: number }) {
  return <mesh geometry={geo.wheel()} material={mat('#16181b', { rough: 0.9 })} position={p} scale={[w, r, r]} castShadow />
}

/** Mutable per-frame state an actor wrapper writes and a model reads. */
export interface AnimState {
  t: number
  speed: number
  distance: number
  braking: boolean
  indicate: 'left' | 'right' | null
  lookBack: boolean
  lights: boolean
}

export function newAnimState(): AnimState {
  return { t: 0, speed: 0, distance: 0, braking: false, indicate: null, lookBack: false, lights: false }
}

/** Indicator, brake and headlight materials that change per frame, so each vehicle gets its own. */
function useVehicleLights(anim?: AnimState) {
  const m = useMemo(
    () => ({
      head: new THREE.MeshStandardMaterial({ color: '#f5f3e8', emissive: '#fff6d5', emissiveIntensity: 0 }),
      tail: new THREE.MeshStandardMaterial({ color: '#7a0d0d', emissive: '#ff1a1a', emissiveIntensity: 0.15 }),
      indL: new THREE.MeshStandardMaterial({ color: '#7a4a00', emissive: '#ffa200', emissiveIntensity: 0 }),
      indR: new THREE.MeshStandardMaterial({ color: '#7a4a00', emissive: '#ffa200', emissiveIntensity: 0 }),
    }),
    [],
  )
  useFrame(() => {
    if (!anim) return
    m.head.emissiveIntensity = anim.lights ? 2.2 : 0
    m.tail.emissiveIntensity = anim.braking ? 3 : anim.lights ? 0.9 : 0.15
    const blink = Math.floor(anim.t * 3) % 2 === 0
    m.indL.emissiveIntensity = anim.indicate === 'left' && blink ? 3 : 0
    m.indR.emissiveIntensity = anim.indicate === 'right' && blink ? 3 : 0
  })
  return m
}

export function CarModel({ color = '#c0392b', anim }: { color?: string; anim?: AnimState }) {
  const L = useVehicleLights(anim)
  const paint = mat(color, { rough: 0.35, metal: 0.35 })
  const glass = mat('#1c2530', { rough: 0.1, metal: 0.6 })
  return (
    <group>
      <B p={[0, 0.3, 0]} s={[1.82, 0.22, 4.3]} c="#1d1f22" />
      <B p={[0, 0.58, 0]} s={[1.8, 0.5, 4.25]} m={paint} />
      <B p={[0, 0.86, -1.35]} s={[1.74, 0.1, 1.4]} m={paint} />
      <B p={[0, 1.08, 0.3]} s={[1.6, 0.5, 2.2]} m={glass} />
      <B p={[0, 1.36, 0.36]} s={[1.54, 0.07, 1.86]} m={paint} />
      <Wheel p={[-0.82, 0.33, -1.35]} />
      <Wheel p={[0.82, 0.33, -1.35]} />
      <Wheel p={[-0.82, 0.33, 1.35]} />
      <Wheel p={[0.82, 0.33, 1.35]} />
      <B p={[-0.6, 0.66, -2.13]} s={[0.4, 0.13, 0.04]} m={L.head} cast={false} />
      <B p={[0.6, 0.66, -2.13]} s={[0.4, 0.13, 0.04]} m={L.head} cast={false} />
      <B p={[-0.62, 0.72, 2.13]} s={[0.36, 0.14, 0.04]} m={L.tail} cast={false} />
      <B p={[0.62, 0.72, 2.13]} s={[0.36, 0.14, 0.04]} m={L.tail} cast={false} />
      <B p={[-0.86, 0.6, -2.08]} s={[0.1, 0.1, 0.12]} m={L.indL} cast={false} />
      <B p={[0.86, 0.6, -2.08]} s={[0.1, 0.1, 0.12]} m={L.indR} cast={false} />
      <B p={[-0.86, 0.72, 2.08]} s={[0.1, 0.1, 0.12]} m={L.indL} cast={false} />
      <B p={[0.86, 0.72, 2.08]} s={[0.1, 0.1, 0.12]} m={L.indR} cast={false} />
      <B p={[0, 0.44, -2.15]} s={[0.52, 0.11, 0.03]} c="#f4f4f4" cast={false} />
      <B p={[0, 0.5, 2.15]} s={[0.52, 0.11, 0.03]} c="#f7c600" cast={false} />
    </group>
  )
}

export function VanModel({ color = '#f4f6f7', anim }: { color?: string; anim?: AnimState }) {
  const L = useVehicleLights(anim)
  const paint = mat(color, { rough: 0.5, metal: 0.2 })
  return (
    <group>
      <B p={[0, 0.36, 0]} s={[2.0, 0.24, 5.2]} c="#1d1f22" />
      <B p={[0, 1.35, 0.5]} s={[2.0, 1.9, 4.1]} m={paint} />
      <B p={[0, 0.85, -2.0]} s={[1.96, 0.9, 1.2]} m={paint} />
      <B p={[0, 1.55, -1.75]} s={[1.9, 0.75, 0.9]} c="#1c2530" />
      <Wheel p={[-0.9, 0.36, -1.7]} r={0.36} />
      <Wheel p={[0.9, 0.36, -1.7]} r={0.36} />
      <Wheel p={[-0.9, 0.36, 1.8]} r={0.36} />
      <Wheel p={[0.9, 0.36, 1.8]} r={0.36} />
      <B p={[-0.65, 0.9, -2.61]} s={[0.4, 0.14, 0.04]} m={L.head} cast={false} />
      <B p={[0.65, 0.9, -2.61]} s={[0.4, 0.14, 0.04]} m={L.head} cast={false} />
      <B p={[-0.85, 0.9, 2.56]} s={[0.2, 0.4, 0.04]} m={L.tail} cast={false} />
      <B p={[0.85, 0.9, 2.56]} s={[0.2, 0.4, 0.04]} m={L.tail} cast={false} />
    </group>
  )
}

export function BusModel({ color = '#c0392b', anim }: { color?: string; anim?: AnimState }) {
  const L = useVehicleLights(anim)
  const paint = mat(color, { rough: 0.45, metal: 0.2 })
  const glass = mat('#18212b', { rough: 0.1, metal: 0.5 })
  return (
    <group>
      <B p={[0, 1.6, 0]} s={[2.5, 2.8, 11.5]} m={paint} />
      <B p={[0, 2.15, 0.3]} s={[2.53, 0.95, 10.4]} m={glass} />
      <B p={[0, 1.7, -5.76]} s={[2.3, 1.9, 0.04]} m={glass} />
      <B p={[0, 2.85, -5.77]} s={[1.9, 0.32, 0.04]} c="#ffb000" m={mat('#3a2a00', { emissive: '#ffb000', emissiveIntensity: 1.4 })} cast={false} />
      <Wheel p={[-1.15, 0.5, -3.8]} r={0.5} w={0.3} />
      <Wheel p={[1.15, 0.5, -3.8]} r={0.5} w={0.3} />
      <Wheel p={[-1.15, 0.5, 3.6]} r={0.5} w={0.3} />
      <Wheel p={[1.15, 0.5, 3.6]} r={0.5} w={0.3} />
      <B p={[-0.85, 0.65, -5.77]} s={[0.36, 0.16, 0.04]} m={L.head} cast={false} />
      <B p={[0.85, 0.65, -5.77]} s={[0.36, 0.16, 0.04]} m={L.head} cast={false} />
      <B p={[-1.0, 0.9, 5.76]} s={[0.24, 0.4, 0.04]} m={L.tail} cast={false} />
      <B p={[1.0, 0.9, 5.76]} s={[0.24, 0.4, 0.04]} m={L.tail} cast={false} />
      <B p={[-1.27, 0.9, -5.5]} s={[0.06, 0.16, 0.3]} m={L.indL} cast={false} />
      <B p={[1.27, 0.9, -5.5]} s={[0.06, 0.16, 0.3]} m={L.indR} cast={false} />
      <B p={[-1.27, 0.9, 5.5]} s={[0.06, 0.16, 0.3]} m={L.indL} cast={false} />
      <B p={[1.27, 0.9, 5.5]} s={[0.06, 0.16, 0.3]} m={L.indR} cast={false} />
    </group>
  )
}

const SKIN = ['#f1c27d', '#c68642', '#8d5524', '#e0ac69', '#ffdbac']

export function PersonModel({ color = '#2e86de', scale = 1, anim, seed = 0 }: { color?: string; scale?: number; anim?: AnimState; seed?: number }) {
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const skin = mat(SKIN[seed % SKIN.length])
  const trousers = mat(['#1f2a38', '#3b3b3b', '#4a3b2a', '#22313f'][seed % 4])
  useFrame(() => {
    if (!anim) return
    const swing = Math.sin(anim.distance * (3.2 / scale)) * Math.min(1, anim.speed / 1.2) * 0.65
    if (legL.current) legL.current.rotation.x = swing
    if (legR.current) legR.current.rotation.x = -swing
    if (armL.current) armL.current.rotation.x = -swing * 0.8
    if (armR.current) armR.current.rotation.x = swing * 0.8
  })
  return (
    <group scale={scale}>
      <group ref={legL} position={[-0.11, 0.86, 0]}>
        <B p={[0, -0.43, 0]} s={[0.15, 0.86, 0.17]} m={trousers} />
      </group>
      <group ref={legR} position={[0.11, 0.86, 0]}>
        <B p={[0, -0.43, 0]} s={[0.15, 0.86, 0.17]} m={trousers} />
      </group>
      <B p={[0, 1.18, 0]} s={[0.44, 0.64, 0.26]} c={color} />
      <group ref={armL} position={[-0.29, 1.46, 0]}>
        <B p={[0, -0.3, 0]} s={[0.11, 0.6, 0.13]} c={color} />
      </group>
      <group ref={armR} position={[0.29, 1.46, 0]}>
        <B p={[0, -0.3, 0]} s={[0.11, 0.6, 0.13]} c={color} />
      </group>
      <mesh geometry={geo.sphere()} material={skin} position={[0, 1.67, 0]} scale={0.13} castShadow />
      <mesh geometry={geo.sphere()} material={mat(['#2b1d0e', '#090806', '#b55239', '#e6cea8'][seed % 4])} position={[0, 1.72, 0.02]} scale={[0.135, 0.1, 0.135]} />
    </group>
  )
}

export function CyclistModel({ color = '#1abc9c', anim }: { color?: string; anim?: AnimState }) {
  const head = useRef<THREE.Group>(null)
  const crank = useRef<THREE.Group>(null)
  const frame = mat('#2c3e50', { metal: 0.5, rough: 0.4 })
  useFrame(() => {
    if (!anim) return
    if (crank.current) crank.current.rotation.x = -anim.distance * 2.2
    if (head.current) head.current.rotation.y += ((anim.lookBack ? -1.3 : 0) - head.current.rotation.y) * 0.18
  })
  return (
    <group>
      <mesh geometry={geo.torus()} material={mat('#111')} position={[0, 0.34, -0.52]} scale={0.34} rotation={[0, 0, Math.PI / 2]} castShadow />
      <mesh geometry={geo.torus()} material={mat('#111')} position={[0, 0.34, 0.52]} scale={0.34} rotation={[0, 0, Math.PI / 2]} castShadow />
      <B p={[0, 0.62, 0]} s={[0.05, 0.05, 1.0]} m={frame} r={[0.2, 0, 0]} />
      <B p={[0, 0.55, 0.15]} s={[0.05, 0.5, 0.05]} m={frame} r={[-0.3, 0, 0]} />
      <B p={[0, 0.82, -0.5]} s={[0.5, 0.04, 0.04]} m={frame} />
      <group ref={crank} position={[0, 0.36, 0.05]}>
        <B p={[0, 0.16, 0]} s={[0.36, 0.06, 0.06]} c="#333" />
        <B p={[0, -0.16, 0]} s={[0.36, 0.06, 0.06]} c="#333" />
      </group>
      <B p={[0, 1.22, -0.12]} s={[0.4, 0.6, 0.24]} c={color} r={[-0.45, 0, 0]} />
      <B p={[-0.12, 0.72, 0.08]} s={[0.13, 0.62, 0.15]} c="#1f2a38" r={[0.3, 0, 0]} />
      <B p={[0.12, 0.72, 0.08]} s={[0.13, 0.62, 0.15]} c="#1f2a38" r={[-0.2, 0, 0]} />
      <B p={[-0.24, 1.15, -0.4]} s={[0.09, 0.5, 0.1]} c={color} r={[-1.0, 0, 0]} />
      <B p={[0.24, 1.15, -0.4]} s={[0.09, 0.5, 0.1]} c={color} r={[-1.0, 0, 0]} />
      <group ref={head} position={[0, 1.6, -0.32]}>
        <mesh geometry={geo.sphere()} material={mat('#e0ac69')} scale={0.12} castShadow />
        <mesh geometry={geo.sphere()} material={mat('#f1c40f')} position={[0, 0.06, 0]} scale={[0.14, 0.09, 0.16]} castShadow />
      </group>
    </group>
  )
}

export function HorseModel({ anim }: { anim?: AnimState }) {
  const legs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)]
  const coat = mat('#6b4423')
  useFrame(() => {
    if (!anim) return
    const a = Math.sin(anim.distance * 2.6) * 0.45 * Math.min(1, anim.speed)
    legs.forEach((l, i) => l.current && (l.current.rotation.x = i % 3 === 0 ? a : -a))
  })
  const legPos: V3[] = [
    [-0.22, 1.0, -0.75],
    [0.22, 1.0, -0.75],
    [-0.22, 1.0, 0.75],
    [0.22, 1.0, 0.75],
  ]
  return (
    <group>
      <B p={[0, 1.35, 0]} s={[0.62, 0.7, 2.0]} m={coat} />
      <B p={[0, 1.85, -1.0]} s={[0.32, 0.8, 0.4]} m={coat} r={[0.55, 0, 0]} />
      <B p={[0, 2.2, -1.38]} s={[0.26, 0.28, 0.62]} m={coat} r={[0.3, 0, 0]} />
      <B p={[0, 1.3, 1.1]} s={[0.12, 0.6, 0.12]} c="#2b1d0e" r={[-0.4, 0, 0]} />
      {legPos.map((p, i) => (
        <group key={i} ref={legs[i]} position={p}>
          <B p={[0, -0.5, 0]} s={[0.14, 1.0, 0.16]} m={coat} />
        </group>
      ))}
      {/* Rider in hi-vis */}
      <B p={[0, 2.05, 0.05]} s={[0.42, 0.62, 0.28]} c="#d4ff00" />
      <B p={[-0.2, 1.62, -0.05]} s={[0.13, 0.55, 0.15]} c="#2c2c2c" r={[0.9, 0, 0.3]} />
      <B p={[0.2, 1.62, -0.05]} s={[0.13, 0.55, 0.15]} c="#2c2c2c" r={[0.9, 0, -0.3]} />
      <mesh geometry={geo.sphere()} material={mat('#e0ac69')} position={[0, 2.52, 0.05]} scale={0.13} castShadow />
      <mesh geometry={geo.sphere()} material={mat('#111')} position={[0, 2.59, 0.05]} scale={[0.15, 0.1, 0.17]} />
    </group>
  )
}

export function TractorModel({ beacon, anim }: { beacon?: boolean; anim?: AnimState }) {
  const beaconMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b36b00', emissive: '#ffa200', emissiveIntensity: 0 }), [])
  useFrame(() => {
    if (anim) beaconMat.emissiveIntensity = beacon && Math.floor(anim.t * 4) % 2 === 0 ? 4 : 0.2
  })
  const body = mat('#c62828', { rough: 0.45, metal: 0.2 })
  return (
    <group>
      <B p={[0, 1.0, -0.9]} s={[1.0, 0.9, 2.0]} m={body} />
      <B p={[0, 1.55, 0.7]} s={[1.5, 0.2, 1.6]} m={body} />
      <B p={[0, 2.25, 0.7]} s={[1.45, 1.3, 1.5]} c="#9fb8c8" m={mat('#9fb8c8', { rough: 0.15, metal: 0.3 })} />
      <B p={[0, 2.95, 0.7]} s={[1.6, 0.1, 1.7]} m={body} />
      <mesh geometry={geo.sphere()} material={beaconMat} position={[0.4, 3.08, 0.7]} scale={0.12} />
      <Wheel p={[-0.95, 0.75, 0.75]} r={0.75} w={0.45} />
      <Wheel p={[0.95, 0.75, 0.75]} r={0.75} w={0.45} />
      <Wheel p={[-0.75, 0.45, -1.45]} r={0.45} w={0.28} />
      <Wheel p={[0.75, 0.45, -1.45]} r={0.45} w={0.28} />
    </group>
  )
}

export function BallModel() {
  return <mesh geometry={geo.sphere()} material={mat('#e74c3c', { rough: 0.4 })} position={[0, 0.12, 0]} scale={0.12} castShadow />
}

// ── Static scenery ──────────────────────────────────────────────────────────────────

const WALLS = ['#a0522d', '#b5651d', '#8b4a3a', '#d8c3a5', '#e8dcc8', '#c97d5d', '#9c6b53', '#f0e6d2']
const ROOFS = ['#4a4a4a', '#5b3a29', '#3d3d45', '#6b4a3a']
const DOORS = ['#1f3a5f', '#7b1e1e', '#1e5631', '#2c2c2c', '#e8e8e8']

export function House({ w = 8, d = 8, h = 6, seed = 0 }: { w?: number; d?: number; h?: number; seed?: number }) {
  const wall = mat(WALLS[seed % WALLS.length])
  const glass = mat('#2a3a4a', { rough: 0.15, metal: 0.5 })
  const frame = mat('#f3f3f3')
  const front = -d / 2 - 0.04
  const win = (x: number, y: number) => (
    <group key={`${x}-${y}`}>
      <B p={[x, y, front + 0.01]} s={[1.35, 1.25, 0.06]} m={frame} cast={false} />
      <B p={[x, y, front - 0.01]} s={[1.15, 1.05, 0.06]} m={glass} cast={false} />
    </group>
  )
  return (
    <group>
      <B p={[0, h / 2, 0]} s={[w, h, d]} m={wall} />
      <mesh geometry={geo.roof()} material={mat(ROOFS[seed % ROOFS.length], { flat: true })} position={[0, h, 0]} scale={[w + 0.5, 2.4, d + 0.6]} castShadow receiveShadow />
      <B p={[w * 0.28, h + 1.6, 0.8]} s={[0.6, 1.6, 0.6]} c="#7a4a3a" />
      {win(-w * 0.25, h * 0.32)}
      {win(w * 0.25, h * 0.72)}
      {win(-w * 0.25, h * 0.72)}
      <B p={[w * 0.22, 1.05, front]} s={[0.95, 2.1, 0.08]} c={DOORS[seed % DOORS.length]} cast={false} />
    </group>
  )
}

const LEAVES = ['#3f7d3a', '#4f8a3d', '#2f6b35', '#5a9445']

export function Tree({ scale = 1, seed = 0 }: { scale?: number; seed?: number }) {
  const leaf = mat(LEAVES[seed % LEAVES.length], { flat: true })
  return (
    <group scale={scale}>
      <mesh geometry={geo.cyl()} material={mat('#5b4232')} position={[0, 1.3, 0]} scale={[0.18, 2.6, 0.18]} castShadow />
      <mesh geometry={geo.ico()} material={leaf} position={[0, 3.6, 0]} scale={[1.7, 1.9, 1.7]} castShadow />
      <mesh geometry={geo.ico()} material={leaf} position={[0.5, 4.4, 0.3]} scale={[1.1, 1.2, 1.1]} rotation={[0.3, seed, 0]} castShadow />
    </group>
  )
}

export function LampPost({ lit = false, facing = 1 }: { lit?: boolean; facing?: 1 | -1 }) {
  return (
    <group>
      <mesh geometry={geo.cyl()} material={mat('#5d6166', { metal: 0.6, rough: 0.4 })} position={[0, 3.2, 0]} scale={[0.07, 6.4, 0.07]} castShadow />
      <B p={[facing * 0.6, 6.35, 0]} s={[1.3, 0.08, 0.1]} c="#5d6166" />
      <B p={[facing * 1.2, 6.25, 0]} s={[0.5, 0.12, 0.25]} m={lit ? mat('#fff3c4', { emissive: '#ffd27a', emissiveIntensity: 2.5 }) : mat('#d9d9d9')} cast={false} />
    </group>
  )
}

export function SignPost({ id, height = 2.2, size = 0.9 }: { id: SignId; height?: number; size?: number }) {
  return (
    <group>
      <mesh geometry={geo.cyl()} material={mat('#8a8f94', { metal: 0.5 })} position={[0, height / 2, 0]} scale={[0.04, height, 0.04]} castShadow />
      <mesh material={signMaterial(id)} position={[0, height + size / 2 - 0.1, 0.05]}>
        <planeGeometry args={[size, size]} />
      </mesh>
    </group>
  )
}

export function BelishaBeacon({ anim }: { anim?: AnimState }) {
  const globe = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c98a00', emissive: '#ffb000', emissiveIntensity: 1 }), [])
  useFrame(() => {
    if (anim) globe.emissiveIntensity = Math.floor(anim.t * 1.5) % 2 === 0 ? 3 : 0.3
  })
  return (
    <group>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} geometry={geo.cyl()} material={mat(i % 2 ? '#111' : '#f5f5f5')} position={[0, 0.25 + i * 0.5, 0]} scale={[0.06, 0.5, 0.06]} castShadow />
      ))}
      <mesh geometry={geo.sphere()} material={globe} position={[0, 3.2, 0]} scale={0.22} />
    </group>
  )
}

export function BusShelter() {
  const glass = mat('#9fc5d8', { rough: 0.1, metal: 0.2 })
  return (
    <group>
      <B p={[0, 2.4, 0]} s={[1.6, 0.1, 4]} c="#3d4a57" />
      <B p={[0.75, 1.2, 0]} s={[0.06, 2.4, 4]} m={glass} />
      <B p={[0, 1.2, 1.97]} s={[1.6, 2.4, 0.06]} m={glass} />
      <B p={[0, 1.2, -1.97]} s={[1.6, 2.4, 0.06]} m={glass} />
      <B p={[-0.2, 0.5, 0]} s={[0.4, 0.06, 3]} c="#3d4a57" />
      <mesh geometry={geo.cyl()} material={mat('#5d6166')} position={[-1.6, 1.4, -3]} scale={[0.05, 2.8, 0.05]} />
      <B p={[-1.6, 2.7, -3]} s={[0.06, 0.5, 0.5]} c="#c0392b" />
    </group>
  )
}
