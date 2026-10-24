import type { SignId } from '../../components/signs/signs'
import type { MarkingItem } from '../../sim/three/Markings'
import type { RoadSeg, Vec } from './geometry'

export type Severity = 'minor' | 'serious' | 'dangerous'

export interface FaultInfo {
  /** Marking category, named the way the DVSA test report names it. */
  category: string
  title: string
  /** What to do instead. */
  advice: string
  severity: Severity
  /** Highway Code reference. */
  hc?: string
}

export interface Fault extends FaultInfo {
  key: string
  t: number
  x: number
  z: number
}

export type Signal = 'left' | 'right' | null
export type LightState = 'red' | 'redamber' | 'green' | 'amber'

export interface DriveInput {
  throttle: number
  brake: number
  steer: number
  /** One-off events for this step. Indicators toggle. */
  indicate?: 'left' | 'right' | 'off'
  mirror?: boolean
  look?: 'left' | 'right'
}

export interface NpcView {
  id: string
  kind: 'car' | 'person' | 'cyclist'
  color: string
  x: number
  z: number
  h: number
  v: number
  visible: boolean
  braking: boolean
}

export interface CarView {
  x: number
  z: number
  h: number
  v: number
  steer: number
  signal: Signal
  braking: boolean
}

export interface ViewState {
  t: number
  /** Distance along the lesson route. */
  s: number
  car: CarView
  npcs: NpcView[]
  lights: Record<string, LightState>
  /** Current glance, for the camera: yaw offset in radians (positive = left). */
  glance: number
  /** True while the mirror is being checked. */
  mirror: boolean
}

export interface NpcStatus {
  active: boolean
  done: boolean
  /** Metres travelled along its own path. */
  s: number
  x: number
  z: number
  v: number
}

/** What a scenario's rules can see and do. Implemented by the engine. */
export interface Ctx {
  readonly t: number
  readonly dt: number
  readonly car: { x: number; z: number; h: number; v: number; mph: number; s: number }
  /** Signed offset from the route centreline in metres (positive = left of the route). */
  readonly lane: number
  readonly brake: number
  readonly throttle: number
  readonly stopped: boolean
  readonly signal: Signal
  /** Seconds since the current indicator was switched on (Infinity when off). */
  readonly signalAgo: number
  /** Seconds since the last mirror check. */
  readonly mirrorAgo: number
  /** Seconds since the last look over each shoulder. */
  readonly lookAgo: { left: number; right: number }
  /** Seconds since the car was last stationary (0 while it is stopped). */
  readonly movingFor: number
  /** Seconds since the car first moved off in this lesson, or -1. */
  readonly sinceMoveOff: number
  npc(id: string): NpcStatus
  fault(key: string, info: FaultInfo): void
  hasFault(key: string): boolean
  tick(checkId: string): void
  isDone(checkId: string): boolean
  toast(text: string, seconds?: number): void
  setLight(id: string, state: LightState): void
  mem: Record<string, number | boolean | string | undefined>
  /** Distance along the route of an arbitrary point. */
  routeS(p: Vec): number
}

export interface NpcDef {
  id: string
  kind: 'car' | 'person' | 'cyclist'
  color: string
  path: Vec[]
  /** Metres per second. */
  speed: number
  /** Starts moving the first time this returns true. */
  trigger: (c: Ctx) => boolean
  /** Drawn at the start of its path before it is triggered (e.g. a pedestrian waiting at a crossing). */
  visibleBefore?: boolean
  /** Stays visible at the end of its path. */
  lingers?: boolean
}

export interface Waypoint {
  s: number
  label: string
  icon: 'straight' | 'left' | 'right' | 'roundabout' | 'stop' | 'finish' | 'crossing' | 'lights' | 'pullover'
}

export interface CheckDef {
  id: string
  label: string
}

export type Prop =
  | { kind: 'sign'; id: SignId; x: number; z: number; rot: number }
  | { kind: 'beacon'; x: number; z: number }
  | { kind: 'light'; id: string; x: number; z: number; rot: number }
  | { kind: 'tree' | 'house' | 'lamp'; x: number; z: number; rot: number; seed: number; w?: number; d?: number; h?: number }

export type DemoDo = 'mirror' | 'left' | 'right' | 'signal-off' | 'look-left' | 'look-right'
/** Fires once, when the car reaches route distance `s`, or `delay` seconds after the demo starts. */
export interface DemoAction {
  s?: number
  delay?: number
  do: DemoDo
}

/** What the demo driver does, in order of distance along the route. */
export interface DemoPlan {
  /** Target speed by route distance, linearly interpolated. */
  speed: [s: number, mph: number][]
  /** Come to a stop at s, and wait there until `until` is true. */
  holds: { s: number; until: (c: Ctx) => boolean; then?: DemoDo[] }[]
  /** One-off actions when the car reaches s. */
  actions: DemoAction[]
  /** Don't move until this is true (e.g. parked lessons). */
  waitFor?: (c: Ctx) => boolean
  /** Seconds between `waitFor` passing and pulling away. */
  startDelay?: number
}

export interface Scenario {
  id: string
  roads: RoadSeg[]
  discs: { c: Vec; r: number }[]
  island?: { c: Vec; r: number }
  markings: MarkingItem[]
  yellow?: MarkingItem[]
  props: Prop[]
  path: Vec[]
  start: { x: number; z: number; h: number; parked: boolean }
  /** The lesson ends when the car reaches this distance along the route. */
  finishS: number
  /** Lessons about speed switch the guided speed limiter off. */
  noLimiter?: boolean
  limits: { fromS: number; mph: number }[]
  waypoints: Waypoint[]
  checks: CheckDef[]
  npcs: NpcDef[]
  rules: (c: Ctx) => void
  demo: DemoPlan
}
