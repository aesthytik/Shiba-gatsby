import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Atmosphere } from '../../sim/three/Atmosphere'
import { Markings } from '../../sim/three/Markings'
import { geo, mat } from '../../sim/three/materials'
import { B, BelishaBeacon, CarModel, House, LampPost, newAnimState, PersonModel, SignPost, Tree, type AnimState } from '../../sim/three/models'
import { headingFor, offRoadDistance } from './geometry'
import type { LightState, Prop, Scenario, ViewState } from './types'

export type CamMode = 'chase' | 'driver' | 'top'

type ViewRef = MutableRefObject<ViewState>

/** The 3D lesson world. A parent keeps `view` up to date (live engine or replay) from a child component. */
export function DriveCanvas({
  scenario,
  view,
  mode,
  mirror = false,
  children,
}: {
  scenario: Scenario
  view: ViewRef
  mode: CamMode
  mirror?: boolean
  children?: ReactNode
}) {
  const follow = useRef(new THREE.Vector3())
  return (
    <Canvas dpr={[1, 1.6]} camera={{ fov: 55, near: 0.1, far: 700, position: [0, 4, 10] }} gl={{ antialias: true }} onCreated={(st) => import.meta.env.DEV && ((window as unknown as { __r3f?: unknown }).__r3f = st)}>
      {children}
      <Atmosphere preset="sunny" follow={follow} />
      <Ground />
      <Roads scenario={scenario} />
      <Markings items={scenario.markings} />
      {scenario.island && <Island c={scenario.island.c} r={scenario.island.r} />}
      <Props props={scenario.props} view={view} />
      <Actors scenario={scenario} view={view} mode={mode} />
      <Rig view={view} mode={mode} follow={follow} />
      {mirror && <RearMirror view={view} />}
    </Canvas>
  )
}

function Ground() {
  return <mesh geometry={geo.plane()} material={mat('#86b866', { rough: 1 })} position={[0, -0.04, 0]} scale={[2400, 1, 2400]} receiveShadow />
}

const ROAD = '#4b4f55'
const PAVE = '#b9bcc0'

function Roads({ scenario }: { scenario: Scenario }) {
  const { roads, discs } = scenario
  const road = mat(ROAD, { rough: 0.95 })
  const pave = useMemo(() => pavementItems(scenario), [scenario])
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const o = new THREE.Object3D()
    pave.forEach((p, i) => {
      o.position.set(p.x, 0.06, p.z)
      o.rotation.set(0, p.rot, 0)
      o.scale.set(p.w, 0.12, p.l)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  }, [pave])
  return (
    <>
      {roads.map((r, i) => {
        const len = Math.hypot(r.b.x - r.a.x, r.b.z - r.a.z)
        return <mesh key={i} geometry={geo.box()} material={road} position={[(r.a.x + r.b.x) / 2, 0, (r.a.z + r.b.z) / 2]} rotation={[0, headingFor(r.b.x - r.a.x, r.b.z - r.a.z), 0]} scale={[r.width, 0.03, len]} receiveShadow />
      })}
      {discs.map((d, i) => (
        <mesh key={i} geometry={geo.cyl()} material={road} position={[d.c.x, 0, d.c.z]} scale={[d.r, 0.03, d.r]} receiveShadow />
      ))}
      <instancedMesh ref={ref} args={[geo.box(), mat(PAVE, { rough: 0.9 }), pave.length]} frustumCulled={false} receiveShadow />
    </>
  )
}

/** Pavement slabs beside each road, left out where another road or junction patch crosses. */
function pavementItems(sc: Scenario) {
  const out: { x: number; z: number; rot: number; w: number; l: number }[] = []
  sc.roads.forEach((rd, ri) => {
    const others = sc.roads.filter((_, i) => i !== ri)
    const len = Math.hypot(rd.b.x - rd.a.x, rd.b.z - rd.a.z)
    const dx = (rd.b.x - rd.a.x) / len
    const dz = (rd.b.z - rd.a.z) / len
    const rot = headingFor(dx, dz)
    for (const side of [1, -1]) {
      const off = side * (rd.width / 2 + 1.1)
      for (let d = 1; d < len; d += 2) {
        const p = { x: rd.a.x + dx * d + dz * off, z: rd.a.z + dz * d - dx * off }
        if (offRoadDistance(p, others, sc.discs) < 1.5) continue
        out.push({ ...p, rot, w: 2.2, l: 2.05 })
      }
    }
  })
  return out
}

function Island({ c, r }: { c: { x: number; z: number }; r: number }) {
  return <mesh geometry={geo.cyl()} material={mat('#f2f2f2', { rough: 0.7 })} position={[c.x, 0.025, c.z]} scale={[r, 0.02, r]} />
}

// ---- props ---------------------------------------------------------------------------------------

function Props({ props, view }: { props: Prop[]; view: ViewRef }) {
  const groups = useRef<(THREE.Group | null)[]>([])
  const frame = useRef(0)
  const beacon = useMemo(() => newAnimState(), [])
  useFrame(() => {
    beacon.t = view.current.t
    if (frame.current++ % 12) return
    const { x, z } = view.current.car
    props.forEach((p, i) => {
      const g = groups.current[i]
      if (g) g.visible = Math.hypot(p.x - x, p.z - z) < (p.kind === 'house' ? 170 : 210)
    })
  })
  return (
    <>
      {props.map((p, i) => (
        <group key={i} ref={(g) => void (groups.current[i] = g)} position={[p.x, 0, p.z]} rotation={[0, p.kind === 'beacon' ? 0 : p.rot, 0]}>
          <PropModel p={p} view={view} beacon={beacon} />
        </group>
      ))}
    </>
  )
}

function PropModel({ p, view, beacon }: { p: Prop; view: ViewRef; beacon: AnimState }) {
  switch (p.kind) {
    case 'house':
      return <House w={p.w} d={p.d} h={p.h} seed={p.seed} />
    case 'tree':
      return <Tree seed={p.seed} scale={0.9 + (p.seed % 5) * 0.08} />
    case 'lamp':
      return <LampPost />
    case 'sign':
      return <SignPost id={p.id} size={1} height={2.4} />
    case 'beacon':
      return <BelishaBeacon anim={beacon} />
    case 'light':
      return <TrafficLight id={p.id} view={view} />
  }
}

const LAMPS: Record<LightState, [boolean, boolean, boolean]> = {
  red: [true, false, false],
  redamber: [true, true, false],
  amber: [false, true, false],
  green: [false, false, true],
}

function TrafficLight({ id, view }: { id: string; view: ViewRef }) {
  const mats = useMemo(
    () => ({
      red: new THREE.MeshStandardMaterial({ color: '#4a1010', emissive: '#ff2a1a', emissiveIntensity: 0 }),
      amber: new THREE.MeshStandardMaterial({ color: '#4a3200', emissive: '#ffa200', emissiveIntensity: 0 }),
      green: new THREE.MeshStandardMaterial({ color: '#0f3a1f', emissive: '#27e06a', emissiveIntensity: 0 }),
    }),
    [],
  )
  useFrame(() => {
    const [r, a, g] = LAMPS[view.current.lights[id] ?? 'green']
    mats.red.emissiveIntensity = r ? 3 : 0
    mats.amber.emissiveIntensity = a ? 3 : 0
    mats.green.emissiveIntensity = g ? 3 : 0
  })
  return (
    <group>
      <mesh geometry={geo.cyl()} material={mat('#3b3f44', { metal: 0.4 })} position={[0, 1.6, 0]} scale={[0.07, 3.2, 0.07]} castShadow />
      <B p={[0, 3.55, 0.02]} s={[0.46, 1.3, 0.3]} c="#1b1d20" />
      <mesh geometry={geo.sphere()} material={mats.red} position={[0, 3.95, 0.2]} scale={0.14} />
      <mesh geometry={geo.sphere()} material={mats.amber} position={[0, 3.55, 0.2]} scale={0.14} />
      <mesh geometry={geo.sphere()} material={mats.green} position={[0, 3.15, 0.2]} scale={0.14} />
    </group>
  )
}

// ---- cars and people --------------------------------------------------------------------------------

function Actors({ scenario, view, mode }: { scenario: Scenario; view: ViewRef; mode: CamMode }) {
  const player = useRef<THREE.Group>(null)
  const cockpit = useRef<THREE.Group>(null)
  const npcRefs = useRef<(THREE.Group | null)[]>([])
  const pAnim = useMemo(() => newAnimState(), [])
  const nAnims = useMemo(() => scenario.npcs.map(() => newAnimState()), [scenario])
  useFrame(() => {
    const v = view.current
    pAnim.t = v.t
    pAnim.speed = v.car.v
    pAnim.braking = v.car.braking
    pAnim.indicate = v.car.signal
    if (player.current) {
      player.current.position.set(v.car.x, 0, v.car.z)
      player.current.rotation.y = v.car.h
      player.current.visible = mode !== 'driver'
    }
    if (cockpit.current) {
      cockpit.current.position.set(v.car.x, 0, v.car.z)
      cockpit.current.rotation.y = v.car.h
      cockpit.current.visible = mode === 'driver'
    }
    v.npcs.forEach((n, i) => {
      const g = npcRefs.current[i]
      if (!g) return
      g.visible = n.visible
      g.position.set(n.x, 0, n.z)
      g.rotation.y = n.h
      const a = nAnims[i]
      a.t = v.t
      a.speed = n.v
      a.distance += n.v * (1 / 60)
    })
  })
  return (
    <>
      <group ref={player}>
        <CarModel color="#f4f4f4" anim={pAnim} />
        <B p={[0, 1.45, 0.35]} s={[0.45, 0.32, 0.04]} c="#ffffff" cast={false} />
        <B p={[0, 1.45, 0.38]} s={[0.12, 0.24, 0.02]} c="#d4111e" cast={false} />
      </group>
      <group ref={cockpit}>
        <B p={[0, 0.62, -0.75]} s={[1.75, 0.06, 0.6]} m={mat('#e8e8e8', { rough: 0.35, metal: 0.3 })} cast={false} />
      </group>
      {scenario.npcs.map((n, i) => (
        <group key={n.id} ref={(g) => void (npcRefs.current[i] = g)} visible={false}>
          {n.kind === 'person' ? <PersonModel color={n.color} anim={nAnims[i]} seed={i + 2} /> : <CarModel color={n.color} anim={nAnims[i]} />}
        </group>
      ))}
    </>
  )
}

// ---- camera ----------------------------------------------------------------------------------------

function Rig({ view, mode, follow }: { view: ViewRef; mode: CamMode; follow: { current: THREE.Vector3 } }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const yaw = useRef(0)
  const pos = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())
  const first = useRef(true)
  useFrame((_, dt) => {
    const v = view.current
    const c = v.car
    follow.current.set(c.x, 0, c.z)
    yaw.current += (v.glance - yaw.current) * Math.min(1, dt * 7)
    const ang = c.h + yaw.current
    const dx = -Math.sin(ang)
    const dz = -Math.cos(ang)
    const k = first.current ? 1 : 1 - Math.exp(-dt * 7)
    let wantPos: THREE.Vector3
    let wantLook: THREE.Vector3
    if (mode === 'top') {
      camera.fov = 40
      camera.up.set(0, 0, -1)
      wantPos = new THREE.Vector3(c.x, 56, c.z + 0.01)
      wantLook = new THREE.Vector3(c.x, 0, c.z)
      pos.current.copy(wantPos)
      look.current.copy(wantLook)
    } else if (mode === 'driver') {
      camera.fov = 62
      camera.up.set(0, 1, 0)
      const hx = -Math.sin(c.h)
      const hz = -Math.cos(c.h)
      const rx = Math.cos(c.h)
      const rz = -Math.sin(c.h)
      pos.current.set(c.x + hx * 0.15 + rx * 0.36, 1.2, c.z + hz * 0.15 + rz * 0.36)
      look.current.set(pos.current.x + dx * 20, 1.05, pos.current.z + dz * 20)
    } else {
      camera.fov = 55
      camera.up.set(0, 1, 0)
      wantPos = new THREE.Vector3(c.x - dx * 8.8, 3.5, c.z - dz * 8.8)
      wantLook = new THREE.Vector3(c.x + dx * 6, 0.9, c.z + dz * 6)
      pos.current.lerp(wantPos, k)
      look.current.lerp(wantLook, k)
    }
    first.current = false
    camera.position.copy(pos.current)
    camera.lookAt(look.current)
    camera.updateProjectionMatrix()
  })
  return null
}

/** Rear-view mirror: renders the scene backwards into a small target and draws it, flipped, at the top of the screen. */
function RearMirror({ view, width = 272, height = 62, top = 53 }: { view: ViewRef; width?: number; height?: number; top?: number }) {
  const { scene, camera, gl, size } = useThree()
  const cam = camera as THREE.PerspectiveCamera
  const target = useMemo(() => new THREE.WebGLRenderTarget(512, 128), [])
  const rear = useMemo(() => new THREE.PerspectiveCamera(38, 512 / 128, 0.3, 320), [])
  const quad = useRef<THREE.Mesh>(null)
  const n = useRef(0)
  useEffect(() => {
    cam.layers.enable(1)
    scene.add(cam)
    target.texture.wrapS = THREE.RepeatWrapping
    target.texture.repeat.x = -1
    target.texture.offset.x = 1
    quad.current?.layers.set(1)
    return () => {
      scene.remove(cam)
      target.dispose()
    }
  }, [cam, scene, target])
  useFrame(() => {
    const c = view.current.car
    const hx = -Math.sin(c.h)
    const hz = -Math.cos(c.h)
    // Place and size the quad in camera space so it stays a fixed pixel size at the top of the view.
    if (quad.current) {
      const viewH = 2 * Math.tan((cam.fov * Math.PI) / 360)
      const unit = viewH / size.height
      quad.current.position.set(0, viewH / 2 - top * unit, -1)
      quad.current.scale.set(width * unit, height * unit, 1)
    }
    if (n.current++ % 2) return
    rear.position.set(c.x - hx * 0.4, 1.3, c.z - hz * 0.4)
    rear.lookAt(c.x - hx * 30, 1.0, c.z - hz * 30)
    gl.setRenderTarget(target)
    gl.render(scene, rear)
    gl.setRenderTarget(null)
  })
  return (
    <primitive object={cam}>
      <mesh ref={quad} renderOrder={999}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={target.texture} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
    </primitive>
  )
}
