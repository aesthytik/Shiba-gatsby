import type { SignId } from '../../components/signs/signs'
import { arcKeys, chain, headingOf, holdKey, lastKey, lineKeys, type Key } from '../../sim/motion'
import type { HazardWindow } from './scoring'

export type ActorKind = 'car' | 'van' | 'bus' | 'pedestrian' | 'child' | 'cyclist' | 'ball' | 'horse' | 'tractor'
export type EnvPreset = 'sunny' | 'overcast' | 'dusk' | 'rain'

export interface Actor {
  id: string
  kind: ActorKind
  color?: string
  keys: Key[]
  /** Only rendered between these times (e.g. a ball that appears from behind a car). */
  visible?: [number, number]
  indicate?: { t0: number; t1: number; side: 'left' | 'right' }[]
  brake?: [number, number][]
  /** Cyclist looks over their right shoulder. */
  lookBack?: [number, number]
  /** Hazard this actor creates, used to highlight it when reviewing. */
  hazard?: string
  beacon?: boolean
}

export interface ParkedVehicle {
  side: 'left' | 'right'
  z: number
  kind?: 'car' | 'van'
  color?: string
}

export interface SceneSpec {
  kind: 'urban' | 'rural'
  /** Road runs from z=+40 to z=-length. */
  length: number
  roadHalf: number
  pavement: number
  junctions?: { side: 'left' | 'right'; z: number; width: number }[]
  parked?: ParkedVehicle[]
  zebra?: number
  busStop?: number
  gateway?: number
  signs?: { id: SignId; side: 'left' | 'right'; z: number }[]
  seed: number
}

export interface Hazard extends HazardWindow {
  label: string
  explain: string
}

export interface Clip {
  id: string
  title: string
  summary: string
  env: EnvPreset
  duration: number
  scene: SceneSpec
  /** Camera car speed keyframes [time s, speed m/s]. */
  ego: [number, number][]
  /** Camera car lateral position keyframes [time s, x m]. */
  egoX: [number, number][]
  actors: Actor[]
  hazards: Hazard[]
}

const SOUTH = Math.PI // facing +Z (towards the camera car)
const NORTH = 0
const EAST = headingOf(1, 0)
const WEST = headingOf(-1, 0)

const CAR_COLOURS = ['#c0392b', '#2c3e50', '#ecf0f1', '#7f8c8d', '#2980b9', '#16a085', '#8e44ad', '#d35400', '#1b1b1b', '#bdc3c7']
const paint = (i: number) => CAR_COLOURS[i % CAR_COLOURS.length]

function parkedRow(side: 'left' | 'right', zs: number[], offset = 0): ParkedVehicle[] {
  return zs.map((z, i) => ({ side, z, color: paint(i + offset) }))
}

/** A pedestrian strolling along a pavement for the whole clip. */
function stroller(id: string, x: number, z0: number, z1: number, t0: number, speed = 1.3, color?: string): Actor {
  return { id, kind: 'pedestrian', color, keys: lineKeys([x, z0], [x, z1], t0, speed, speed, 2) }
}

/** An oncoming car driving south in the right-hand lane at constant speed. */
function oncoming(id: string, x: number, z0: number, t0: number, speed: number, color: string, length = 420): Actor {
  return { id, kind: 'car', color, keys: lineKeys([x, z0], [x, z0 + length], t0, speed, speed, 2) }
}

// ── Clip 1: ball and child ──────────────────────────────────────────────────────────
const ballChild: Clip = {
  id: 'ball-child',
  title: 'Residential street',
  summary: 'A quiet street lined with parked cars on a sunny afternoon.',
  env: 'sunny',
  duration: 18,
  scene: {
    kind: 'urban',
    length: 260,
    roadHalf: 5,
    pavement: 3,
    parked: [
      ...parkedRow('left', [-38, -52, -70, -84, -96, -106, -118, -134, -158, -176, -200]),
      ...parkedRow('right', [-30, -48, -62, -132, -150, -168, -196], 4),
    ],
    signs: [{ id: 'speed-20', side: 'left', z: -12 }],
    seed: 11,
  },
  ego: [
    [0, 11],
    [7.2, 11],
    [10.2, 0],
    [12.8, 0],
    [16, 8],
    [18, 8],
  ],
  egoX: [[0, -1.8]],
  actors: [
    {
      id: 'ball',
      kind: 'ball',
      hazard: 'child',
      visible: [5.9, 99],
      keys: chain(
        holdKey(-5.6, -100.8, 0, 6.0),
        lineKeys([-5.6, -100.8], [-1.8, -100.9], 6.0, 4.2, 3.4, 4),
        lineKeys([-1.8, -100.9], [2.6, -101.2], 7.0, 3.4, 0, 4),
        lineKeys([2.6, -101.2], [5.8, -101.1], 12.7, 1.6, 1.6, 2),
      ),
    },
    {
      id: 'child',
      kind: 'child',
      color: '#e67e22',
      hazard: 'child',
      visible: [6.3, 99],
      keys: chain(
        holdKey(-6.6, -101.6, 0, 6.4, EAST),
        lineKeys([-6.6, -101.6], [-2.6, -101.6], 6.4, 3.2, 1.6, 4),
        holdKey(-2.6, -101.6, 8.2, 9.2, SOUTH),
        lineKeys([-2.6, -101.6], [2.2, -101.4], 9.2, 1.4, 1.4, 3),
        lineKeys([2.2, -101.4], [6.2, -101.4], 12.6, 1.6, 1.6, 2),
        holdKey(6.2, -101.4, 15.1, 18, WEST),
      ),
    },
    stroller('walker-1', 6.4, -140, -40, 0, 1.3, '#34495e'),
    stroller('walker-2', -6.8, -60, -130, 2, 1.2, '#7d3c98'),
    oncoming('oncoming-1', 1.8, -300, 4, 9, '#2980b9'),
  ],
  hazards: [
    {
      id: 'child',
      label: 'Child runs out after a ball',
      start: 6.0,
      end: 8.4,
      explain:
        'The ball rolling out from between the parked cars is the first clue: a child is likely to follow it. The earliest scoring moment is when the ball appears and you should start slowing down.',
    },
  ],
}

// ── Clip 2: car emerging from a side road ───────────────────────────────────────────
// Approach the junction too fast, creep at the line, then turn left in front of the camera car.
const emergingTurn = arcKeys(-6.5, -146.7, 4.7, -Math.PI / 2, 0, 9.83, 3.5, 10)
const emergingAccel = lineKeys([-1.8, -146.7], [-1.8, -200], lastKey(emergingTurn).t, 3.5, 13, 8)
const emergingCar: Actor = {
  id: 'emerging',
  kind: 'car',
  color: '#c0392b',
  hazard: 'emerging',
  keys: chain(
    lineKeys([-60, -142], [-12, -142], 1.5, 9, 5, 6),
    lineKeys([-12, -142], [-6.5, -142], 8.36, 5, 2.5, 4),
    emergingTurn,
    emergingAccel,
    lineKeys([-1.8, -200], [-1.8, -340], lastKey(emergingAccel).t, 13, 13, 2),
  ),
  brake: [[7.4, 9.8]],
}

const sideRoad: Clip = {
  id: 'side-road',
  title: 'Side road on the left',
  summary: 'A 30 mph road through a housing estate on a grey day.',
  env: 'overcast',
  duration: 20,
  scene: {
    kind: 'urban',
    length: 320,
    roadHalf: 5,
    pavement: 2.5,
    junctions: [{ side: 'left', z: -140, width: 8 }],
    parked: [...parkedRow('right', [-58, -96, -210, -232], 2), ...parkedRow('left', [-86, -190, -224], 6)],
    signs: [{ id: 'speed-30', side: 'left', z: -10 }],
    seed: 23,
  },
  ego: [
    [0, 13.4],
    [8.4, 13.4],
    [10.8, 3],
    [12.6, 3],
    [16, 10],
    [20, 10],
  ],
  egoX: [[0, -1.8]],
  actors: [emergingCar, stroller('walker-1', 6.2, -180, -60, 0, 1.4, '#2e4053'), oncoming('oncoming-1', 1.8, -330, 0, 12, '#ecf0f1'), oncoming('oncoming-2', 1.8, -400, 6, 12, '#16a085')],
  hazards: [
    {
      id: 'emerging',
      label: 'Car pulls out of the side road',
      start: 7.8,
      end: 10.4,
      explain:
        'The red car approaches the junction too quickly and does not stop at the give-way line. The hazard starts developing as soon as it is clear the driver is not going to stop — slow down and be ready to brake.',
    },
  ],
}

// ── Clip 3: cyclist passing a parked van ────────────────────────────────────────────
const cyclistKeys = chain(
  lineKeys([-3.1, -90], [-3.1, -136], 0, 5, 5, 4),
  lineKeys([-3.1, -136], [-1.4, -144], 9.2, 5, 5, 3),
  lineKeys([-1.4, -144], [-1.4, -158], 10.84, 5, 5, 2),
  lineKeys([-1.4, -158], [-3.1, -166], 13.64, 5, 5, 3),
  lineKeys([-3.1, -166], [-3.1, -280], 15.28, 5, 5, 2),
)

const cyclistVan: Clip = {
  id: 'cyclist-van',
  title: 'Cyclist ahead',
  summary: 'Following a cyclist on a town road with a van parked ahead.',
  env: 'sunny',
  duration: 22,
  scene: {
    kind: 'urban',
    length: 320,
    roadHalf: 4,
    pavement: 2.5,
    parked: [{ side: 'left', z: -150, kind: 'van', color: '#f4f6f7' }],
    seed: 37,
  },
  ego: [
    [0, 12],
    [8.6, 12],
    [11, 5],
    [16.5, 5],
    [18.5, 9],
    [22, 9],
  ],
  egoX: [
    [0, -2],
    [13, -2],
    [14.6, -0.8],
    [18, -0.8],
    [20, -0.3],
    [22, -0.3],
  ],
  actors: [
    { id: 'cyclist', kind: 'cyclist', color: '#1abc9c', hazard: 'cyclist', keys: cyclistKeys, lookBack: [8.5, 9.3] },
    oncoming('oncoming-1', 2, -300, 0, 12, '#2c3e50'),
    stroller('walker-1', -5.3, -120, -200, 0, 1.3, '#a93226'),
    stroller('walker-2', 5.3, -210, -90, 3, 1.4, '#1f618d'),
  ],
  hazards: [
    {
      id: 'cyclist',
      label: 'Cyclist moves out to pass the van',
      start: 8.4,
      end: 11.0,
      explain:
        'The parked van will force the cyclist to move out. The lifesaver glance over their shoulder confirms it. Hold back and give them room rather than trying to squeeze past.',
    },
  ],
}

// ── Clip 4: bus pulling out at dusk ─────────────────────────────────────────────────
const busKeys = chain(
  holdKey(-3.8, -130, 0, 7.6, NORTH),
  lineKeys([-3.8, -130], [-2.1, -137], 7.6, 0.8, 3, 4),
  lineKeys([-2.1, -136], [-2.1, -300], 10, 3, 12, 10),
)

const busStop: Clip = {
  id: 'bus-stop',
  title: 'Bus stop at dusk',
  summary: 'Driving through a town centre as the light fades.',
  env: 'dusk',
  duration: 18,
  scene: {
    kind: 'urban',
    length: 320,
    roadHalf: 5.2,
    pavement: 3,
    busStop: -130,
    parked: [...parkedRow('right', [-60, -78, -170, -190], 1)],
    signs: [{ id: 'speed-30', side: 'left', z: -12 }],
    seed: 41,
  },
  ego: [
    [0, 12.5],
    [6.5, 12.5],
    [9.5, 3.5],
    [11.5, 3.5],
    [14.5, 6.5],
    [18, 6.5],
  ],
  egoX: [[0, -2.1]],
  actors: [
    { id: 'bus', kind: 'bus', color: '#c0392b', hazard: 'bus', keys: busKeys, indicate: [{ t0: 5.6, t1: 11, side: 'right' }] },
    { id: 'waiting-1', kind: 'pedestrian', color: '#5d6d7e', keys: holdKey(-7.2, -128, 0, 18, EAST) },
    { id: 'waiting-2', kind: 'pedestrian', color: '#af601a', keys: chain(holdKey(-7.6, -132, 0, 4, EAST), lineKeys([-7.6, -132], [-7.6, -160], 4, 1.2, 1.2, 2)) },
    oncoming('oncoming-1', 2.1, -320, 0, 11, '#f7f9f9'),
    oncoming('oncoming-2', 2.1, -420, 3, 11, '#5b2c6f'),
    stroller('walker-1', 7.6, -200, -60, 0, 1.3, '#17202a'),
  ],
  hazards: [
    {
      id: 'bus',
      label: 'Bus signals and pulls away from the stop',
      start: 5.4,
      end: 8.0,
      explain:
        'The bus is at a stop with its right indicator on: it is about to pull out. The Highway Code asks you to give way to buses signalling to move off when it is safe to do so.',
    },
  ],
}

// ── Clip 5: zebra crossing in the rain ──────────────────────────────────────────────
const crosser: Actor = {
  id: 'crosser',
  kind: 'pedestrian',
  color: '#f1c40f',
  hazard: 'crosser',
  keys: chain(
    lineKeys([6.4, -133], [6.4, -123], 0, 1.4, 1.4, 2),
    holdKey(5.6, -122, 7.7, 8.2, WEST),
    lineKeys([5.6, -122], [-5.6, -122], 8.2, 1.3, 1.3, 4),
    lineKeys([-5.6, -122], [-6.6, -95], 16.82, 1.3, 1.3, 2),
  ),
}

const zebra: Clip = {
  id: 'zebra',
  title: 'Zebra crossing in the rain',
  summary: 'A wet high street with a zebra crossing ahead.',
  env: 'rain',
  duration: 20,
  scene: {
    kind: 'urban',
    length: 280,
    roadHalf: 5,
    pavement: 3,
    zebra: -122,
    parked: [...parkedRow('left', [-60, -80, -170], 5), ...parkedRow('right', [-50, -175, -195], 8)],
    seed: 53,
  },
  ego: [
    [0, 12],
    [7.9, 12],
    [11.3, 0],
    [15.6, 0],
    [18.6, 8],
    [20, 8],
  ],
  egoX: [[0, -1.8]],
  actors: [
    crosser,
    {
      id: 'oncoming-stop',
      kind: 'car',
      color: '#566573',
      keys: chain(lineKeys([1.8, -210], [1.8, -160], 0, 11, 11, 2), lineKeys([1.8, -160], [1.8, -127.5], 4.55, 11, 0, 6), holdKey(1.8, -127.5, 10.45, 12.8, SOUTH), lineKeys([1.8, -127.5], [1.8, 40], 12.8, 0, 12, 8)),
      brake: [[4.6, 12.8]],
    },
    stroller('walker-1', -7.2, -150, -60, 0, 1.3, '#283747'),
  ],
  hazards: [
    {
      id: 'crosser',
      label: 'Pedestrian steps onto the zebra crossing',
      start: 5.4,
      end: 8.4,
      explain:
        'The pedestrian is walking purposefully towards the crossing and turns to face the road. In the wet your stopping distance is at least doubled, so start slowing early and be ready to stop.',
    },
  ],
}

// ── Clip 6: country lane, two hazards ───────────────────────────────────────────────
const tractorKeys = chain(
  holdKey(-10, -302, 0, 22, EAST),
  lineKeys([-10, -302], [-5.5, -302], 22, 0.5, 2.5, 4),
  arcKeys(-5.5, -305.85, 3.85, -Math.PI / 2, 0, 25, 2.5, 8),
)
const tractorFull = chain(tractorKeys, lineKeys([-1.65, -305.85], [-1.65, -420], lastKey(tractorKeys).t, 2.5, 4, 6))

const countryLane: Clip = {
  id: 'country-lane',
  title: 'Country lane',
  summary: 'A narrow national-speed-limit road between hedges and fields. This clip has two hazards.',
  env: 'sunny',
  duration: 30,
  scene: {
    kind: 'rural',
    length: 440,
    roadHalf: 3.3,
    pavement: 0,
    gateway: -302,
    signs: [{ id: 'national-speed-limit', side: 'left', z: -8 }],
    seed: 67,
  },
  ego: [
    [0, 17],
    [6.2, 17],
    [8.6, 4.5],
    [17.2, 4.5],
    [20.5, 15],
    [24.6, 15],
    [27.6, 3],
    [30, 3],
  ],
  egoX: [
    [0, -1.65],
    [10.5, -1.65],
    [12, 0.4],
    [17.5, 0.4],
    [19, -1.65],
  ],
  actors: [
    { id: 'horse', kind: 'horse', hazard: 'horse', keys: lineKeys([-2.2, -130], [-2.2, -200], 0, 1.8, 1.8, 2) },
    { id: 'tractor', kind: 'tractor', hazard: 'tractor', keys: tractorFull, beacon: true },
    oncoming('oncoming-1', 1.65, -300, 0, 18, '#f39c12', 500),
  ],
  hazards: [
    {
      id: 'horse',
      label: 'Horse rider ahead',
      start: 3.8,
      end: 7.0,
      explain:
        'You are closing quickly on a horse rider. Slow down early, wait for a safe place to pass, then pass wide (at least 2 metres) and slowly (under 10 mph).',
    },
    {
      id: 'tractor',
      label: 'Tractor pulls out of a field',
      start: 22.2,
      end: 25.0,
      explain:
        'Field gateways are a clue that farm vehicles may emerge. The flashing amber beacon and the tractor creeping forward mean it is about to pull out.',
    },
  ],
}

export const CLIPS: Clip[] = [ballChild, sideRoad, cyclistVan, busStop, zebra, countryLane]

export function clipById(id: string) {
  return CLIPS.find((c) => c.id === id)
}

export const TOTAL_HAZARDS = CLIPS.reduce((n, c) => n + c.hazards.length, 0)
