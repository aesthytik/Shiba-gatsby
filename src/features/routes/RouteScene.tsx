import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { headingOf } from '../../sim/motion'
import { rng } from '../../lib/random'
import { geo, mat } from '../../sim/three/materials'
import { Atmosphere } from '../../sim/three/Atmosphere'
import { Markings, type MarkingItem } from '../../sim/three/Markings'
import { B, BelishaBeacon, BusShelter, CarModel, House, LampPost, newAnimState, PersonModel, SignPost, Tree } from '../../sim/three/models'
import { geom, LANE, LINE_AHEAD, ROAD_HALF, sampleAt, stateAt, type BuiltRoute, type V2 } from './build'

export interface RouteClock {
  t: number
  playing: boolean
  rate: number
}

export type CameraMode = 'driver' | 'chase' | 'top'

const { add, mul, left, sub, len } = geom
const PAVE = 2.6
const RING_ARM = 55
const ARM = 60
const CELL = 200

/** three.js rotation.y that points a model's front along a 2D direction. */
const rotY = (d: V2) => headingOf(d.x, -d.y)
const w3 = (p: V2, y = 0): [number, number, number] => [p.x, y, -p.y]

export function RouteScene({ built, clock, mode }: { built: BuiltRoute; clock: RouteClock; mode: CameraMode }) {
  const follow = useRef(new THREE.Vector3())
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 55, near: 0.1, far: 900, position: [0, 2, 0] }}
      onCreated={(st) => import.meta.env.DEV && ((window as unknown as { __r3f?: unknown }).__r3f = st)}
    >
      <Driver built={built} clock={clock} />
      <Atmosphere preset="sunny" follow={follow} />
      <Ego built={built} clock={clock} mode={mode} follow={follow} />
      <World built={built} clock={clock} />
    </Canvas>
  )
}

function Driver({ built, clock }: { built: BuiltRoute; clock: RouteClock }) {
  useFrame((_, dt) => {
    if (clock.playing) clock.t = Math.min(built.duration, clock.t + Math.min(dt, 0.1) * clock.rate)
    if (clock.t >= built.duration) clock.playing = false
  })
  return null
}

function Ego({ built, clock, mode, follow }: { built: BuiltRoute; clock: RouteClock; mode: CameraMode; follow: { current: THREE.Vector3 } }) {
  const car = useRef<THREE.Group>(null)
  const bonnet = useRef<THREE.Group>(null)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const look = useRef(new THREE.Vector3())
  const anim = useMemo(() => newAnimState(), [])

  useFrame(() => {
    const st = stateAt(built, clock.t)
    const yaw = rotY(st.dir)
    follow.current.set(st.p.x, 0, -st.p.y)
    anim.t = clock.t
    anim.braking = st.v < 0.3 || (stateAt(built, clock.t + 0.4).v < st.v - 0.15)
    if (car.current) {
      car.current.position.set(st.p.x, 0, -st.p.y)
      car.current.rotation.y = yaw
      car.current.visible = mode !== 'driver'
    }
    if (bonnet.current) {
      bonnet.current.position.set(st.p.x, 0, -st.p.y)
      bonnet.current.rotation.y = yaw
      bonnet.current.visible = mode === 'driver'
    }
    const right = mul(left(st.dir), -1)
    let target: THREE.Vector3
    // Look further ahead at speed; when stopped, look straight ahead rather than round the corner.
    const lookDist = 5 + st.v * 1.1
    const blend = Math.min(1, st.v / 6)
    const along = add(st.p, mul(st.dir, lookDist))
    const onPath = sampleAt(built, st.s + lookDist).p
    const aim = add(mul(along, 1 - blend * 0.7), mul(onPath, blend * 0.7))
    if (mode === 'driver') {
      const eye = add(add(st.p, mul(st.dir, 0.2)), mul(right, 0.35))
      camera.position.set(eye.x, 1.22, -eye.y)
      const ahead = add(aim, mul(right, 0.35))
      target = new THREE.Vector3(ahead.x, 1.0, -ahead.y)
      camera.up.set(0, 1, 0)
    } else if (mode === 'chase') {
      const back = sub(st.p, mul(st.dir, 11))
      const want = new THREE.Vector3(back.x, 4.4, -back.y)
      if (camera.position.distanceTo(want) > 40) camera.position.copy(want)
      else camera.position.lerp(want, 0.15)
      target = new THREE.Vector3(aim.x, 0.8, -aim.y)
      camera.up.set(0, 1, 0)
    } else {
      camera.position.set(st.p.x, 150, -st.p.y + 0.01)
      target = new THREE.Vector3(st.p.x, 0, -st.p.y)
      camera.up.set(0, 0, -1)
    }
    // Smooth the look target so corners feel like steering rather than snapping — but snap after a
    // jump (seeking or scrubbing), or the camera would briefly look back towards where it was.
    if (look.current.lengthSq() === 0 || mode === 'top' || look.current.distanceTo(target) > 25) look.current.copy(target)
    else look.current.lerp(target, 0.12)
    camera.lookAt(look.current)
  })

  return (
    <>
      <group ref={car}>
        <CarModel color="#f4f4f4" anim={anim} />
        <B p={[0, 1.45, 0.35]} s={[0.45, 0.32, 0.04]} c="#ffffff" cast={false} />
        <B p={[0, 1.45, 0.38]} s={[0.12, 0.24, 0.02]} c="#d4111e" cast={false} />
      </group>
      <group ref={bonnet}>
        <B p={[0, 0.62, -0.55]} s={[1.75, 0.06, 0.5]} m={mat('#e8e8e8', { rough: 0.35, metal: 0.3 })} cast={false} />
      </group>
    </>
  )
}

/** Flat strip between two lateral offsets along a run of samples. */
function stripGeometry(runs: number[][], centre: V2[], dirs: V2[], offA: number, offB: number, y: number, yB = y) {
  const pos: number[] = []
  const idx: number[] = []
  for (const run of runs) {
    const base = pos.length / 3
    run.forEach((i) => {
      const l = left(dirs[i])
      const a = add(centre[i], mul(l, offA))
      const b = add(centre[i], mul(l, offB))
      pos.push(a.x, y, -a.y, b.x, yB, -b.y)
    })
    for (let k = 0; k < run.length - 1; k++) {
      const v = base + k * 2
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

function runsWhere(n: number, ok: (i: number) => boolean, step = 2) {
  const runs: number[][] = []
  let cur: number[] = []
  for (let i = 0; i < n; i += step) {
    if (ok(i)) cur.push(i)
    else if (cur.length) {
      if (cur.length > 1) runs.push(cur)
      cur = []
    }
  }
  if (cur.length > 1) runs.push(cur)
  return runs
}

interface SceneryItem {
  kind: 'house' | 'tree' | 'lamp' | 'hedge' | 'shelter' | 'farm'
  p: V2
  rot: number
  w?: number
  d?: number
  h?: number
  scale?: number
  seed: number
}

function World({ built, clock }: { built: BuiltRoute; clock: RouteClock }) {
  const L = useMemo(() => layout(built), [built])
  const roadMat = mat('#4b4f55', { rough: 0.95 })
  const pave = mat('#b8bbbe')
  // Strips are built from sample pairs, so render both faces rather than depend on winding.
  const strips = useMemo(
    () => ({
      road: new THREE.MeshStandardMaterial({ color: '#4b4f55', roughness: 0.95, side: THREE.DoubleSide }),
      pave: new THREE.MeshStandardMaterial({ color: '#b8bbbe', roughness: 0.9, side: THREE.DoubleSide }),
      kerb: new THREE.MeshStandardMaterial({ color: '#8f9296', roughness: 0.9, side: THREE.DoubleSide }),
    }),
    [],
  )
  const cells = useRef<(THREE.Group | null)[]>([])
  const camera = useThree((s) => s.camera)
  const beacon = useMemo(() => newAnimState(), [])

  useFrame(() => {
    beacon.t = clock.t
    // Only draw scenery near the camera; long routes would otherwise mean thousands of meshes.
    const cx = camera.position.x
    const cz = camera.position.z
    L.cellKeys.forEach((k, i) => {
      const g = cells.current[i]
      if (!g) return
      const [gx, gz] = k.split(',').map(Number)
      g.visible = Math.hypot((gx + 0.5) * CELL - cx, (gz + 0.5) * CELL - cz) < 520
    })
  })

  const b = built.bounds
  const size = Math.max(b.maxX - b.minX, b.maxY - b.minY) + 1200

  return (
    <group>
      <mesh geometry={geo.plane()} material={mat('#73975a')} position={[(b.minX + b.maxX) / 2, -0.06, -(b.minY + b.maxY) / 2]} scale={[size, 1, size]} receiveShadow />
      <mesh geometry={L.road} material={strips.road} receiveShadow />
      <mesh geometry={L.paveL} material={strips.pave} receiveShadow />
      <mesh geometry={L.paveR} material={strips.pave} receiveShadow />
      <mesh geometry={L.kerbL} material={strips.kerb} />
      <mesh geometry={L.kerbR} material={strips.kerb} />
      <Markings items={L.dashes} />
      <Markings items={L.lines} />

      {L.arms.map((a, i) => (
        <group key={i}>
          <mesh geometry={geo.plane()} material={roadMat} position={w3(a.mid, 0.004)} rotation={[0, a.rot, 0]} scale={[ROAD_HALF * 2, 1, a.length]} receiveShadow />
          {a.urban &&
            [-1, 1].map((side) => (
              <mesh
                key={side}
                geometry={geo.box()}
                material={pave}
                position={w3(add(a.paveMid, mul(a.left, side * (ROAD_HALF + PAVE / 2))), 0.06)}
                rotation={[0, a.rot, 0]}
                scale={[PAVE, 0.12, a.paveLength]}
                receiveShadow
              />
            ))}
        </group>
      ))}

      {built.roundabouts.map((r, i) => (
        <group key={i} position={w3(r.centre)}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} material={roadMat} receiveShadow>
            <ringGeometry args={[r.radius - ROAD_HALF, r.radius + ROAD_HALF, 64]} />
          </mesh>
          <mesh material={mat('#6f9a4e')} position={[0, 0.12, 0]} receiveShadow>
            <cylinderGeometry args={[r.radius - ROAD_HALF - 0.2, r.radius - ROAD_HALF, 0.24, 48]} />
          </mesh>
          <group position={[2, 0.2, -1]}>
            <Tree scale={1.1} seed={i} />
          </group>
        </group>
      ))}
      {built.junctions
        .filter((j) => j.kind === 'mini')
        .map((j, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={w3(j.node, 0.02)}>
            <circleGeometry args={[1.8, 32]} />
            <meshStandardMaterial color="#f2f2f2" polygonOffset polygonOffsetFactor={-2} />
          </mesh>
        ))}

      {L.zebras.map((z, i) => (
        <group key={i}>
          <Markings items={z.stripes} />
          <group position={w3(z.left)}>
            <BelishaBeacon anim={beacon} />
          </group>
          <group position={w3(z.right)}>
            <BelishaBeacon anim={beacon} />
          </group>
        </group>
      ))}
      {L.humps.map((h, i) => (
        <B key={i} p={w3(h.p, 0.04)} s={[ROAD_HALF * 2, 0.08, 1.6]} r={[0, h.rot, 0]} c="#565a60" cast={false} />
      ))}
      {L.lights.map((l, i) => (
        <TrafficLight key={i} p={l.p} rot={l.rot} redUntil={l.redUntil} clock={clock} />
      ))}
      {L.signs.map((s, i) => (
        <group key={i} position={w3(s.p)} rotation={[0, s.rot, 0]}>
          <SignPost id={s.id} />
        </group>
      ))}
      {L.walkers.map((w, i) => (
        <Walker key={i} built={built} clock={clock} {...w} seed={i} />
      ))}

      {L.cellKeys.map((k, ci) => (
        <group key={k} ref={(g) => void (cells.current[ci] = g)}>
          {L.cellItems[ci].map((it, i) => (
            <group key={i} position={w3(it.p)} rotation={[0, it.rot, 0]}>
              {it.kind === 'house' && <House w={it.w} d={it.d} h={it.h} seed={it.seed} />}
              {it.kind === 'farm' && <House w={12} d={9} h={7} seed={it.seed} />}
              {it.kind === 'tree' && <Tree scale={it.scale} seed={it.seed} />}
              {it.kind === 'lamp' && <LampPost facing={1} />}
              {it.kind === 'shelter' && <BusShelter />}
              {it.kind === 'hedge' && <B p={[0, 0.75, 0]} s={[1.2, 1.5, it.d ?? 8.4]} m={mat('#5a8a40', { rough: 1, flat: true })} />}
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

function TrafficLight({ p, rot, redUntil, clock }: { p: V2; rot: number; redUntil: number; clock: RouteClock }) {
  const m = useMemo(
    () => ({
      red: new THREE.MeshStandardMaterial({ color: '#3a0a0a', emissive: '#ff2020', emissiveIntensity: 0 }),
      amber: new THREE.MeshStandardMaterial({ color: '#3a2a00', emissive: '#ffb000', emissiveIntensity: 0 }),
      green: new THREE.MeshStandardMaterial({ color: '#06300f', emissive: '#20ff60', emissiveIntensity: 0 }),
    }),
    [],
  )
  useFrame(() => {
    const t = clock.t
    const red = t < redUntil
    const redAmber = t >= redUntil - 1.2 && t < redUntil
    m.red.emissiveIntensity = red ? 3 : 0
    m.amber.emissiveIntensity = redAmber ? 3 : 0
    m.green.emissiveIntensity = red ? 0 : 3
  })
  return (
    <group position={w3(p)} rotation={[0, rot, 0]}>
      <mesh geometry={geo.cyl()} material={mat('#2b2e33')} position={[0, 1.6, 0]} scale={[0.07, 3.2, 0.07]} castShadow />
      <B p={[0, 3.35, 0]} s={[0.36, 1.0, 0.25]} c="#15171a" />
      {[m.red, m.amber, m.green].map((mt, i) => (
        <mesh key={i} geometry={geo.sphere()} material={mt} position={[0, 3.67 - i * 0.32, 0.13]} scale={0.1} />
      ))}
    </group>
  )
}

function Walker({ built, clock, s0, side, speed, seed }: { built: BuiltRoute; clock: RouteClock; s0: number; side: number; speed: number; seed: number }) {
  const g = useRef<THREE.Group>(null)
  const anim = useMemo(() => newAnimState(), [])
  useFrame(() => {
    // Walk back and forth along 80 m of pavement.
    const span = 80
    const raw = (clock.t * speed) % (span * 2)
    const along = raw < span ? raw : span * 2 - raw
    const forward = raw < span
    const smp = sampleAt(built, s0 + along)
    const p = add(smp.p, mul(left(smp.dir), side * (ROAD_HALF + 1.3)))
    if (g.current) {
      g.current.position.set(p.x, 0.12, -p.y)
      g.current.rotation.y = rotY(forward ? smp.dir : mul(smp.dir, -1))
    }
    anim.speed = speed
    anim.distance = clock.t * speed
  })
  return (
    <group ref={g}>
      <PersonModel anim={anim} seed={seed} color={['#34495e', '#8e44ad', '#16a085', '#c0392b', '#d35400'][seed % 5]} />
    </group>
  )
}

function layout(built: BuiltRoute) {
  const { ego, centre } = built
  const n = ego.length
  const dirs = ego.map((e) => e.dir)
  const random = rng(built.route.id.length * 977 + n)
  const nonRing = built.junctions.filter((j) => j.kind !== 'roundabout')

  const nearJunction = (p: V2, pad: number) =>
    nonRing.some((j) => len(sub(p, j.node)) < ROAD_HALF + pad) || built.roundabouts.some((r) => len(sub(p, r.centre)) < r.radius + ROAD_HALF + pad - 2)

  // Spatial hash of every road point, used to keep scenery off the roads.
  const hash = new Map<string, V2[]>()
  const keyOf = (p: V2) => `${Math.floor(p.x / 16)},${Math.floor(p.y / 16)}`
  const addPt = (p: V2) => {
    const k = keyOf(p)
    hash.set(k, [...(hash.get(k) ?? []), p])
  }
  centre.forEach((p, i) => i % 3 === 0 && addPt(p))
  for (const j of nonRing) for (const a of j.arms) for (let d = 0; d <= ARM; d += 3) addPt(add(j.node, mul(a, d)))
  for (const r of built.roundabouts) {
    for (let k = 0; k < 48; k++) addPt(add(r.centre, { x: Math.cos((k / 48) * Math.PI * 2) * r.radius, y: Math.sin((k / 48) * Math.PI * 2) * r.radius }))
    for (const a of r.arms) for (let d = r.radius; d <= r.radius + RING_ARM; d += 3) addPt(add(r.centre, mul(a, d)))
  }
  const clearOfRoads = (p: V2, radius: number) => {
    const cx = Math.floor(p.x / 16)
    const cy = Math.floor(p.y / 16)
    const reach = Math.ceil(radius / 16)
    for (let x = cx - reach; x <= cx + reach; x++)
      for (let y = cy - reach; y <= cy + reach; y++) for (const q of hash.get(`${x},${y}`) ?? []) if ((q.x - p.x) ** 2 + (q.y - p.y) ** 2 < radius * radius) return false
    return true
  }

  // Road surface, pavements and kerbs.
  const all = [Array.from({ length: Math.ceil(n / 2) }, (_, k) => Math.min(n - 1, k * 2))]
  const road = stripGeometry(all, centre, dirs, ROAD_HALF, -ROAD_HALF, 0.005)
  const paveRuns = runsWhere(n, (i) => ego[i].urban && !nearJunction(centre[i], 5))
  const paveL = stripGeometry(paveRuns, centre, dirs, ROAD_HALF, ROAD_HALF + PAVE, 0.12)
  const paveR = stripGeometry(paveRuns, centre, dirs, -ROAD_HALF, -ROAD_HALF - PAVE, 0.12)
  const kerbL = stripGeometry(paveRuns, centre, dirs, ROAD_HALF, ROAD_HALF, 0.0, 0.12)
  const kerbR = stripGeometry(paveRuns, centre, dirs, -ROAD_HALF, -ROAD_HALF, 0.0, 0.12)

  // Centre-line dashes.
  const zebraS = built.features.filter((f) => f.kind === 'zebra').map((f) => f.s)
  const dashes: MarkingItem[] = []
  for (let i = 0; i < n; i += 9) {
    if (nearJunction(centre[i], 9) || zebraS.some((z) => Math.abs(z - ego[i].s) < 10)) continue
    dashes.push([centre[i].x, -centre[i].y, 0.12, ego[i].urban ? 4 : 3, rotY(dirs[i])])
  }

  // Stop and give-way lines across the ego lane.
  const lines: MarkingItem[] = []
  const lights: { p: V2; rot: number; redUntil: number }[] = []
  const signs: { p: V2; rot: number; id: (typeof built.signs)[number]['id'] }[] = []
  for (const st of built.stops) {
    if (!['give-way', 'stop', 'lights'].includes(st.reason)) continue
    const smp = sampleAt(built, st.s + LINE_AHEAD)
    const l = left(smp.dir)
    const rot = rotY(smp.dir)
    if (st.reason === 'give-way') {
      for (const off of [0, 0.6])
        for (let k = -1.5; k <= 1.5; k += 0.75) {
          const p = add(add(smp.p, mul(smp.dir, off)), mul(l, k))
          lines.push([p.x, -p.y, 0.5, 0.2, rot])
        }
    } else {
      lines.push([smp.p.x, -smp.p.y, 3.6, 0.3, rot])
    }
    if (st.reason === 'lights') {
      const idx = Math.round(st.s)
      // Lamps face back towards the approaching car.
      lights.push({ p: add(smp.p, mul(l, LANE + 2.2)), rot: rotY(smp.dir), redUntil: built.tDepart[idx] - 0.3 })
    }
  }
  for (const sg of built.signs) {
    const smp = sampleAt(built, sg.s)
    const c = sub(smp.p, mul(left(smp.dir), LANE))
    const p = add(c, mul(left(smp.dir), (sg.side === 'left' ? 1 : -1) * (ROAD_HALF + 0.8)))
    signs.push({ p, rot: rotY(smp.dir), id: sg.id })
  }

  // Junction arms (side roads) with pavements.
  const arms: { mid: V2; rot: number; length: number; left: V2; paveMid: V2; paveLength: number; urban: boolean }[] = []
  for (const j of nonRing)
    for (const a of j.arms) {
      const urban = ego[Math.min(n - 1, Math.max(0, built.instructions.find((ins) => ins.seg === j.seg)?.s ?? 0))].urban
      const start = ROAD_HALF + PAVE + 0.5
      arms.push({ mid: add(j.node, mul(a, ARM / 2)), rot: rotY(a), length: ARM, left: left(a), paveMid: add(j.node, mul(a, (start + ARM) / 2)), paveLength: ARM - start, urban })
    }
  for (const r of built.roundabouts)
    for (const a of r.arms) arms.push({ mid: add(r.centre, mul(a, r.radius + RING_ARM / 2)), rot: rotY(a), length: RING_ARM, left: left(a), paveMid: add(r.centre, mul(a, r.radius + ROAD_HALF + 4 + (RING_ARM - ROAD_HALF - 4) / 2)), paveLength: RING_ARM - ROAD_HALF - 4, urban: true })

  // Features.
  const zebras = built.features
    .filter((f) => f.kind === 'zebra')
    .map((f) => {
      const smp = sampleAt(built, f.s)
      const c = sub(smp.p, mul(left(smp.dir), LANE))
      const l = left(smp.dir)
      const stripes: MarkingItem[] = []
      for (let k = -ROAD_HALF + 0.5; k < ROAD_HALF - 0.2; k += 1.0) {
        const p = add(c, mul(l, k + 0.25))
        stripes.push([p.x, -p.y, 0.5, 3, rotY(smp.dir)])
      }
      return { stripes, left: add(c, mul(l, ROAD_HALF + 0.5)), right: add(c, mul(l, -ROAD_HALF - 0.5)) }
    })
  const humps = built.features
    .filter((f) => f.kind === 'humps')
    .flatMap((f) =>
      [0, 35, 70].map((d) => {
        const smp = sampleAt(built, f.s + d)
        return { p: sub(smp.p, mul(left(smp.dir), LANE)), rot: rotY(smp.dir) }
      }),
    )

  // Scenery: houses, trees, lamps, hedges, kept clear of every road.
  const items: SceneryItem[] = []
  const placed: { p: V2; r: number }[] = []
  // Road points are centrelines, so clearance includes the road and pavement width. Roundabout islands are off-limits too.
  const free = (p: V2, r: number) =>
    clearOfRoads(p, r + ROAD_HALF + PAVE) && built.roundabouts.every((rb) => len(sub(p, rb.centre)) > rb.radius + ROAD_HALF + PAVE + r) && placed.every((q) => len(sub(q.p, p)) > q.r + r)
  for (const f of built.features.filter((x) => x.kind === 'bus-stop')) {
    const smp = sampleAt(built, f.s)
    const c = sub(smp.p, mul(left(smp.dir), LANE))
    items.push({ kind: 'shelter', p: add(c, mul(left(smp.dir), ROAD_HALF + PAVE - 0.9)), rot: rotY(mul(smp.dir, -1)), seed: 0 })
  }
  for (let i = 0; i < n; i += 11) {
    const c = centre[i]
    const l = left(dirs[i])
    for (const side of [-1, 1]) {
      if (ego[i].urban) {
        const w = 7 + random() * 2.5
        const d = 8 + random() * 1.5
        const h = 5.6 + random() * 1.4
        const off = ROAD_HALF + PAVE + 2.5 + random() * 3 + d / 2
        const p = add(c, mul(l, side * off))
        const r = Math.max(w, d) / 2
        if (free(p, r - 1)) {
          placed.push({ p, r })
          items.push({ kind: 'house', p, rot: rotY(mul(l, -side)), w, d, h, seed: Math.floor(random() * 1000) })
        } else if (random() < 0.5) {
          const tp = add(c, mul(l, side * (ROAD_HALF + PAVE + 2)))
          if (free(tp, 2)) items.push({ kind: 'tree', p: tp, rot: 0, scale: 0.8 + random() * 0.4, seed: i })
        }
        if (side === 1 && i % 33 === 0 && !nearJunction(c, 6)) items.push({ kind: 'lamp', p: add(c, mul(l, ROAD_HALF + 0.5)), rot: rotY(dirs[i]), seed: 0 })
      } else {
        if (!nearJunction(c, 12)) items.push({ kind: 'hedge', p: add(c, mul(l, side * (ROAD_HALF + 1.8))), rot: rotY(dirs[i]), d: 11.4, seed: 0 })
        for (let k = 0; k < 2; k++) {
          const tp = add(c, mul(l, side * (ROAD_HALF + 5 + random() * 70)))
          if (free(tp, 3)) items.push({ kind: 'tree', p: tp, rot: 0, scale: 0.9 + random() * 0.9, seed: i + k })
        }
        if (random() < 0.03) {
          const fp = add(c, mul(l, side * (ROAD_HALF + 40 + random() * 40)))
          if (free(fp, 9)) {
            placed.push({ p: fp, r: 8 })
            items.push({ kind: 'farm', p: fp, rot: rotY(mul(l, -side)), seed: i })
          }
        }
      }
    }
  }
  // Background trees.
  const b = built.bounds
  for (let k = 0; k < 260; k++) {
    const p = { x: b.minX - 150 + random() * (b.maxX - b.minX + 300), y: b.minY - 150 + random() * (b.maxY - b.minY + 300) }
    if (free(p, 14)) items.push({ kind: 'tree', p, rot: 0, scale: 1 + random(), seed: k })
  }

  const cellMap = new Map<string, SceneryItem[]>()
  for (const it of items) {
    const k = `${Math.floor(it.p.x / CELL)},${Math.floor(-it.p.y / CELL)}`
    cellMap.set(k, [...(cellMap.get(k) ?? []), it])
  }
  const cellKeys = [...cellMap.keys()]

  // Pedestrians strolling on urban pavements.
  const walkers: { s0: number; side: number; speed: number }[] = []
  for (let k = 0; k < 24 && walkers.length < 14; k++) {
    const i = Math.floor(random() * (n - 100))
    if (ego[i].urban && ego[i + 80]?.urban && !nearJunction(centre[i], 12)) walkers.push({ s0: ego[i].s, side: random() < 0.5 ? -1 : 1, speed: 1.1 + random() * 0.5 })
  }

  return { road, paveL, paveR, kerbL, kerbR, dashes, lines, lights, signs, arms, zebras, humps, cellKeys, cellItems: cellKeys.map((k) => cellMap.get(k)!), walkers }
}
