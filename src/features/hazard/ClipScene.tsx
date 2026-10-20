import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Billboard, PerspectiveCamera } from '@react-three/drei'
import { egoDistance, poseAt } from '../../sim/motion'
import { pieceAt } from '../../sim/piecewise'
import { rng } from '../../lib/random'
import { geo, mat } from '../../sim/three/materials'
import { Atmosphere } from '../../sim/three/Atmosphere'
import { Markings } from '../../sim/three/Markings'
import {
  B,
  BallModel,
  BelishaBeacon,
  BusModel,
  BusShelter,
  CarModel,
  CyclistModel,
  HorseModel,
  House,
  LampPost,
  newAnimState,
  PersonModel,
  SignPost,
  TractorModel,
  Tree,
  VanModel,
  type AnimState,
} from '../../sim/three/models'
import type { Actor, Clip } from './clips'

export interface ClipClock {
  t: number
  playing: boolean
  rate: number
  ended: boolean
}

export function ClipScene({ clip, clock, showHazards }: { clip: Clip; clock: ClipClock; showHazards: boolean }) {
  const follow = useRef(new THREE.Vector3())
  return (
    <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={(st) => import.meta.env.DEV && ((window as unknown as { __r3f?: unknown }).__r3f = st)}>
      <ClockDriver clip={clip} clock={clock} />
      <Atmosphere preset={clip.env} follow={follow} />
      <EgoRig clip={clip} clock={clock} follow={follow} />
      <ClipWorld clip={clip} clock={clock} />
      {clip.actors.map((a, i) => (
        <ActorView key={a.id} actor={a} clip={clip} clock={clock} showHazards={showHazards} seed={i} />
      ))}
    </Canvas>
  )
}

function ClockDriver({ clip, clock }: { clip: Clip; clock: ClipClock }) {
  useFrame((_, dt) => {
    if (!clock.playing) return
    clock.t = Math.min(clip.duration, clock.t + Math.min(dt, 0.1) * clock.rate)
    if (clock.t >= clip.duration) {
      clock.playing = false
      clock.ended = true
    }
  })
  return null
}

export function egoPose(clip: Clip, t: number) {
  const x = pieceAt(clip.egoX, t)
  const z = -egoDistance(clip.ego, t)
  const dx = pieceAt(clip.egoX, t + 0.15) - pieceAt(clip.egoX, t - 0.15)
  const dz = -(egoDistance(clip.ego, t + 0.15) - egoDistance(clip.ego, t - 0.15))
  const yaw = Math.abs(dz) > 0.02 ? Math.atan2(-dx, -dz) : 0
  return { x, z, yaw }
}

function EgoRig({ clip, clock, follow }: { clip: Clip; clock: ClipClock; follow: { current: THREE.Vector3 } }) {
  const rig = useRef<THREE.Group>(null)
  const cam = useRef<THREE.PerspectiveCamera>(null)
  useFrame(() => {
    const { x, z, yaw } = egoPose(clip, clock.t)
    const g = rig.current
    if (!g) return
    g.position.set(x, 0, z)
    // Ease the yaw so lane changes feel like steering rather than a snap.
    g.rotation.y += (yaw - g.rotation.y) * 0.2
    follow.current.set(x, 0, z)
    if (cam.current) {
      const speed = egoDistance(clip.ego, clock.t + 0.05) - egoDistance(clip.ego, clock.t)
      cam.current.position.y = 1.22 + Math.sin(clock.t * 11) * 0.006 * Math.min(1, speed * 3)
    }
  })
  // Just the edge of the bonnet at the bottom of the frame, like a dash-mounted camera.
  const bonnet = mat('#1f2a36', { rough: 0.35, metal: 0.4 })
  return (
    <group ref={rig}>
      <PerspectiveCamera ref={cam} makeDefault position={[0.35, 1.22, 0.1]} rotation={[-0.035, 0, 0]} fov={50} near={0.1} far={700} />
      <B p={[0, 0.62, -0.75]} s={[1.75, 0.06, 0.5]} m={bonnet} cast={false} />
    </group>
  )
}

function ActorView({ actor, clip, clock, showHazards, seed }: { actor: Actor; clip: Clip; clock: ClipClock; showHazards: boolean; seed: number }) {
  const group = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Group>(null)
  const anim = useMemo<AnimState>(() => newAnimState(), [])
  const lightsOn = clip.env === 'dusk' || clip.env === 'rain'
  const windows = clip.hazards.filter((h) => h.id === actor.hazard)

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const t = clock.t
    const visible = !actor.visible || (t >= actor.visible[0] && t <= actor.visible[1])
    g.visible = visible
    const p = poseAt(actor.keys, t)
    g.position.set(p.x, 0, p.z)
    g.rotation.y = p.rot
    anim.t = t
    anim.speed = p.speed
    if (clock.playing) anim.distance += p.speed * Math.min(dt, 0.1) * clock.rate
    anim.braking = !!actor.brake?.some(([a, b]) => t >= a && t <= b)
    anim.indicate = actor.indicate?.find((s) => t >= s.t0 && t <= s.t1)?.side ?? null
    anim.lookBack = !!actor.lookBack && t >= actor.lookBack[0] && t <= actor.lookBack[1]
    anim.lights = lightsOn
    if (ring.current) {
      const active = showHazards && windows.some((w) => t >= w.start - 0.5 && t <= w.end + 0.5)
      ring.current.visible = active && visible
      ring.current.scale.setScalar((actor.kind === 'bus' ? 3.2 : actor.kind === 'ball' ? 0.6 : 1.3) + Math.sin(t * 8) * 0.12)
    }
  })

  return (
    <group ref={group}>
      {actor.kind === 'car' && <CarModel color={actor.color} anim={anim} />}
      {actor.kind === 'van' && <VanModel color={actor.color} anim={anim} />}
      {actor.kind === 'bus' && <BusModel color={actor.color} anim={anim} />}
      {actor.kind === 'pedestrian' && <PersonModel color={actor.color} anim={anim} seed={seed} />}
      {actor.kind === 'child' && <PersonModel color={actor.color} anim={anim} scale={0.62} seed={seed + 1} />}
      {actor.kind === 'cyclist' && <CyclistModel color={actor.color} anim={anim} />}
      {actor.kind === 'ball' && <BallModel />}
      {actor.kind === 'horse' && <HorseModel anim={anim} />}
      {actor.kind === 'tractor' && <TractorModel beacon={actor.beacon} anim={anim} />}
      {actor.hazard && (
        // Upright ring that faces the camera and draws through obstacles, so hidden hazards show on replay.
        <Billboard ref={ring} position={[0, 0.9, 0]} visible={false}>
          <mesh renderOrder={10}>
            <torusGeometry args={[1, 0.07, 8, 40]} />
            <meshBasicMaterial color="#ff2d55" toneMapped={false} depthTest={false} transparent opacity={0.9} />
          </mesh>
        </Billboard>
      )}
    </group>
  )
}

function ClipWorld({ clip, clock }: { clip: Clip; clock: ClipClock }) {
  const s = clip.scene
  const lit = clip.env === 'dusk'
  const wet = clip.env === 'rain'
  const beaconAnim = useMemo(() => newAnimState(), [])
  useFrame(() => {
    beaconAnim.t = clock.t
  })

  const layout = useMemo(() => {
    const random = rng(s.seed)
    const egoEnd = egoDistance(clip.ego, clip.duration)
    const length = Math.max(s.length, egoEnd + 300)
    const zStart = 40
    const junctions = s.junctions ?? []
    const nearJunction = (side: number, z: number, pad: number) =>
      junctions.some((j) => (j.side === 'left' ? -1 : 1) === side && Math.abs(z - j.z) < j.width / 2 + pad)
    const outer = s.roadHalf + s.pavement

    // Centre line dashes, skipping junction mouths and zebra zig-zag zones.
    const dashes: [number, number, number, number][] = []
    for (let z = zStart; z > -length; z -= 9) {
      if (s.zebra !== undefined && Math.abs(z - s.zebra) < 16) continue
      if (junctions.some((j) => Math.abs(z - j.z) < j.width / 2 + 1)) continue
      dashes.push([0, z, 0.12, s.kind === 'rural' ? 3 : 4])
    }

    const houses: { x: number; z: number; rot: number; w: number; d: number; h: number; seed: number }[] = []
    const trees: { x: number; z: number; scale: number; seed: number }[] = []
    const lamps: { x: number; z: number; facing: 1 | -1 }[] = []
    const hedges: { x: number; z0: number; z1: number }[] = []

    if (s.kind === 'urban') {
      for (const side of [-1, 1] as const) {
        let z = zStart - random() * 6
        while (z > -length) {
          const w = 7 + random() * 2.5
          const d = 8 + random() * 1.5
          const h = 5.6 + random() * 1.4
          const setback = 3 + random() * 3
          const zc = z - w / 2
          if (!nearJunction(side, zc, w / 2 + 3) && !(s.busStop !== undefined && side === -1 && Math.abs(zc - s.busStop) < 6)) {
            houses.push({ x: side * (outer + setback + d / 2), z: zc, rot: side === -1 ? -Math.PI / 2 : Math.PI / 2, w, d, h, seed: Math.floor(random() * 1000) })
            if (random() < 0.35) trees.push({ x: side * (outer + 1.4), z: zc + w / 2, scale: 0.7 + random() * 0.4, seed: Math.floor(random() * 100) })
          }
          z -= w + 0.6 + (random() < 0.15 ? 4 : 0)
        }
        for (let lz = zStart - (side === -1 ? 0 : 16); lz > -length; lz -= 32) {
          if (!nearJunction(side, lz, 3)) lamps.push({ x: side * (s.roadHalf + 0.5), z: lz, facing: side === -1 ? 1 : -1 })
        }
      }
      // Background trees behind the houses.
      for (let i = 0; i < 90; i++) {
        const side = random() < 0.5 ? -1 : 1
        trees.push({ x: side * (outer + 22 + random() * 40), z: zStart - random() * (length + 40), scale: 1 + random() * 0.8, seed: i })
      }
    } else {
      for (const side of [-1, 1] as const) {
        const x = side * (s.roadHalf + 1.6)
        if (side === -1 && s.gateway !== undefined) {
          hedges.push({ x, z0: zStart, z1: s.gateway + 5 }, { x, z0: s.gateway - 5, z1: -length })
        } else hedges.push({ x, z0: zStart, z1: -length })
      }
      for (let i = 0; i < 160; i++) {
        const side = random() < 0.5 ? -1 : 1
        const near = random() < 0.4
        trees.push({ x: side * (s.roadHalf + (near ? 3 + random() * 3 : 10 + random() * 70)), z: zStart - random() * (length + 40), scale: 0.9 + random() * 0.9, seed: i })
      }
      houses.push({ x: -48, z: -210, rot: -Math.PI / 2, w: 10, d: 8, h: 6.5, seed: 4 }, { x: 60, z: -380, rot: Math.PI / 2, w: 9, d: 8, h: 6, seed: 2 })
    }

    // Pavement segments, split where side roads join.
    const pavements: { x: number; z0: number; z1: number }[] = []
    if (s.pavement > 0) {
      for (const side of [-1, 1] as const) {
        const gaps = junctions.filter((j) => (j.side === 'left' ? -1 : 1) === side).sort((a, b) => b.z - a.z)
        let z0 = zStart + 20
        for (const j of gaps) {
          pavements.push({ x: side * (s.roadHalf + s.pavement / 2), z0, z1: j.z + j.width / 2 })
          z0 = j.z - j.width / 2
        }
        pavements.push({ x: side * (s.roadHalf + s.pavement / 2), z0, z1: -length - 20 })
      }
    }

    const zebra: [number, number, number, number, number?][] = []
    const giveWay: [number, number, number, number, number?][] = []
    if (s.zebra !== undefined) {
      for (let x = -s.roadHalf + 0.5; x < s.roadHalf - 0.3; x += 1.0) zebra.push([x + 0.25, s.zebra, 0.5, 3])
      for (const dz of [2.6, -2.6]) for (let x = -s.roadHalf + 0.3; x < s.roadHalf; x += 0.9) giveWay.push([x + 0.25, s.zebra + dz, 0.5, 0.18])
      // Zig-zags along both kerbs and the centre line.
      for (const xLine of [-s.roadHalf + 0.25, 0, s.roadHalf - 0.25])
        for (const dir of [1, -1])
          for (let k = 0; k < 8; k++) {
            // Segments 1.6 m long, swinging 0.3 m either side of the line so their ends meet.
            const zc = s.zebra + dir * (3.6 + k * 1.6 + 0.8)
            giveWay.push([xLine, zc, 0.1, 1.71, k % 2 ? 0.36 : -0.36])
          }
    }
    for (const j of junctions) {
      const side = j.side === 'left' ? -1 : 1
      for (const off of [0.4, 0.95]) for (let z = j.z - j.width / 2 + 0.3; z < j.z + j.width / 2; z += 0.9) giveWay.push([side * (s.roadHalf + off), z + 0.25, 0.18, 0.5])
      for (let x = s.roadHalf + 6; x < s.roadHalf + 80; x += 9) dashes.push([side * x, j.z, 3, 0.12])
    }

    const busBox: [number, number, number, number, number?][] = []
    if (s.busStop !== undefined) {
      for (let z = s.busStop + 12; z > s.busStop - 14; z -= 1.2) busBox.push([-s.roadHalf + 0.15, z, 0.1, 0.6], [-s.roadHalf + 2.9, z, 0.1, 0.6])
    }

    return { length, zStart, dashes, houses, trees, lamps, hedges, pavements, zebra, giveWay, busBox }
  }, [clip, s])

  const L = layout
  const roadLen = L.length + L.zStart + 20
  const roadMat = mat(wet ? '#3d4045' : '#4b4f55', { rough: wet ? 0.5 : 0.95 })
  const grass = mat(s.kind === 'rural' ? '#7d9c4f' : '#6f9254')
  const pavement = mat(wet ? '#9a9da0' : '#b8bbbe')

  return (
    <group>
      {/* Grass sits well below the road: a huge plane only 1-2 cm lower loses the depth test on some GPUs. */}
      <mesh geometry={geo.plane()} material={grass} position={[0, -0.06, L.zStart - roadLen / 2]} scale={[900, 1, roadLen + 400]} receiveShadow />
      <mesh geometry={geo.plane()} material={roadMat} position={[0, 0.005, L.zStart - roadLen / 2 + 10]} scale={[s.roadHalf * 2, 1, roadLen]} receiveShadow />
      <Markings items={L.dashes} y={0.012} />
      <Markings items={L.zebra} y={0.012} />
      <Markings items={L.giveWay} y={0.012} />
      <Markings items={L.busBox} color="#f2c200" y={0.012} />

      {L.pavements.map((p, i) => (
        <group key={i}>
          <B p={[p.x, 0.07, (p.z0 + p.z1) / 2]} s={[s.pavement, 0.14, Math.abs(p.z0 - p.z1)]} m={pavement} cast={false} />
          <B p={[p.x - Math.sign(p.x) * (s.pavement / 2 - 0.1), 0.08, (p.z0 + p.z1) / 2]} s={[0.2, 0.16, Math.abs(p.z0 - p.z1)]} c="#8f9296" cast={false} />
        </group>
      ))}

      {(s.junctions ?? []).map((j, i) => {
        const side = j.side === 'left' ? -1 : 1
        const len = 90
        return (
          <group key={i}>
            <mesh geometry={geo.plane()} material={roadMat} position={[side * (s.roadHalf + len / 2), 0.006, j.z]} scale={[len, 1, j.width]} receiveShadow />
            {[-1, 1].map((e) => (
              <B key={e} p={[side * (s.roadHalf + len / 2), 0.07, j.z + e * (j.width / 2 + s.pavement / 2)]} s={[len, 0.14, s.pavement]} m={pavement} cast={false} />
            ))}
            {Array.from({ length: 6 }, (_, k) => (
              <group key={k}>
                <group position={[side * (s.roadHalf + s.pavement + 14 + k * 12), 0, j.z - j.width / 2 - s.pavement - 6]} rotation={[0, Math.PI, 0]}>
                  <House w={8} d={8} h={6} seed={k * 3 + 1} />
                </group>
                <group position={[side * (s.roadHalf + s.pavement + 14 + k * 12), 0, j.z + j.width / 2 + s.pavement + 6]}>
                  <House w={8} d={8} h={6} seed={k * 5 + 2} />
                </group>
              </group>
            ))}
          </group>
        )
      })}

      {(s.parked ?? []).map((pv, i) => {
        const side = pv.side === 'left' ? -1 : 1
        const half = pv.kind === 'van' ? 1.0 : 0.9
        return (
          <group key={i} position={[side * (s.roadHalf - half - 0.15), 0, pv.z]} rotation={[0, side === -1 ? 0 : Math.PI, 0]}>
            {pv.kind === 'van' ? <VanModel color={pv.color} /> : <CarModel color={pv.color} />}
          </group>
        )
      })}

      {L.houses.map((h, i) => (
        <group key={i} position={[h.x, 0, h.z]} rotation={[0, h.rot, 0]}>
          <House w={h.w} d={h.d} h={h.h} seed={h.seed} />
        </group>
      ))}
      {L.trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <Tree scale={t.scale} seed={t.seed} />
        </group>
      ))}
      {L.lamps.map((l, i) => (
        <group key={i} position={[l.x, 0, l.z]}>
          <LampPost lit={lit} facing={l.facing} />
        </group>
      ))}
      {L.hedges.map((h, i) => (
        <B key={i} p={[h.x, 0.7, (h.z0 + h.z1) / 2]} s={[1.3, 1.4, Math.abs(h.z0 - h.z1)]} m={mat('#5a8a40', { rough: 1, flat: true })} />
      ))}
      {s.gateway !== undefined && (
        <>
          <mesh geometry={geo.plane()} material={mat('#8a7350')} position={[-(s.roadHalf + 10), 0.004, s.gateway]} scale={[20, 1, 6]} receiveShadow />
          <B p={[-(s.roadHalf + 1.8), 0.6, s.gateway - 4.6]} s={[0.15, 1.2, 0.15]} c="#6b4f2f" />
          <B p={[-(s.roadHalf + 1.8), 0.6, s.gateway + 4.6]} s={[0.15, 1.2, 0.15]} c="#6b4f2f" />
          <B p={[-(s.roadHalf + 3.8), 0.75, s.gateway + 4.6]} s={[4, 0.1, 0.08]} c="#9c8360" r={[0, -0.9, 0]} />
        </>
      )}
      {s.zebra !== undefined && (
        <>
          <group position={[-(s.roadHalf + 0.5), 0, s.zebra + 2]}>
            <BelishaBeacon anim={beaconAnim} />
          </group>
          <group position={[s.roadHalf + 0.5, 0, s.zebra - 2]}>
            <BelishaBeacon anim={beaconAnim} />
          </group>
        </>
      )}
      {s.busStop !== undefined && (
        <group position={[-(s.roadHalf + s.pavement - 0.9), 0.14, s.busStop]} rotation={[0, Math.PI, 0]}>
          <BusShelter />
        </group>
      )}
      {(s.signs ?? []).map((sg, i) => (
        <group key={i} position={[(sg.side === 'left' ? -1 : 1) * (s.roadHalf + 0.6), 0, sg.z]}>
          <SignPost id={sg.id} />
        </group>
      ))}
    </group>
  )
}
