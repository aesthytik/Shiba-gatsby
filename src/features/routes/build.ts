import type { Control, JunctionKind, Segment, TestRoute } from './types'

// Geometry works in a flat 2D frame: x east, y north (metres). three.js scenes map (x, y) → (x, 0, -y).

export interface V2 {
  x: number
  y: number
}

const add = (a: V2, b: V2): V2 => ({ x: a.x + b.x, y: a.y + b.y })
const sub = (a: V2, b: V2): V2 => ({ x: a.x - b.x, y: a.y - b.y })
const mul = (a: V2, k: number): V2 => ({ x: a.x * k, y: a.y * k })
const len = (a: V2) => Math.hypot(a.x, a.y)
const norm = (a: V2): V2 => {
  const l = len(a) || 1
  return { x: a.x / l, y: a.y / l }
}
const left = (u: V2): V2 => ({ x: -u.y, y: u.x })
const cross = (a: V2, b: V2) => a.x * b.y - a.y * b.x
const dot = (a: V2, b: V2) => a.x * b.x + a.y * b.y
const dirOf = (deg: number): V2 => ({ x: Math.cos((deg * Math.PI) / 180), y: Math.sin((deg * Math.PI) / 180) })
const angleOf = (u: V2) => (Math.atan2(u.y, u.x) * 180) / Math.PI
const rotate = (u: V2, deg: number): V2 => {
  const c = Math.cos((deg * Math.PI) / 180)
  const s = Math.sin((deg * Math.PI) / 180)
  return { x: u.x * c - u.y * s, y: u.x * s + u.y * c }
}

export const LANE = 1.75
export const ROAD_HALF = 3.7
// Centreline turn radius: in-lane that's ~4.5 m turning left and ~8 m turning right, and both arcs
// start 6.2 m before the junction centre — just after the stop line.
const TURN_R = 6.2
// Where the car's centre stops: its front bumper is then ~2.4 m further on, at the line.
const STOP_BACK = ROAD_HALF + 4
export const LINE_AHEAD = 2.6
const RING_R = 16
const ACC = 1.4
const DEC = 2.0
const LAT = 1.9

interface Node {
  p: V2
  /** Centreline fillet radius at this node, if it's a corner. */
  r?: number
  seg: number
}

export interface Arm {
  node: V2
  dir: V2
  length: number
}

export interface JunctionGeo {
  seg: number
  node: V2
  kind: JunctionKind | 'mini' | 'roundabout'
  control: Control
  arms: V2[]
  approach: V2
  stopLine?: V2
}

export interface RoundaboutGeo {
  seg: number
  centre: V2
  radius: number
  arms: V2[]
}

export interface Sample {
  s: number
  p: V2
  dir: V2
  seg: number
  limit: number
  urban: boolean
}

export interface Instruction {
  seg: number
  s: number
  text: string
  short: string
  icon: 'left' | 'right' | 'ahead' | 'roundabout' | 'task'
  exit?: number
  /** Keep showing this direction until here (e.g. until you leave the roundabout). */
  until?: number
}

export interface Stop {
  s: number
  dwell: number
  reason: 'give-way' | 'stop' | 'lights' | 'zebra' | 'task' | 'emergency'
  hard?: boolean
}

export interface FeatureGeo {
  s: number
  kind: 'zebra' | 'bus-stop' | 'humps' | 'school'
}

export interface SignGeo {
  s: number
  id: 'speed-20' | 'speed-30' | 'speed-40' | 'speed-50' | 'national-speed-limit' | 'warn-roundabout' | 'mini-roundabout' | 'give-way' | 'stop' | 'warn-traffic-signals' | 'warn-humps'
  side: 'left' | 'right'
}

export interface BuiltRoute {
  route: TestRoute
  ego: Sample[]
  centre: V2[]
  junctions: JunctionGeo[]
  roundabouts: RoundaboutGeo[]
  instructions: Instruction[]
  stops: Stop[]
  features: FeatureGeo[]
  signs: SignGeo[]
  speed: number[]
  tArrive: number[]
  tDepart: number[]
  duration: number
  length: number
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}

/** Replace sharp corners with circular arcs. Tangent lengths are clamped so neighbouring fillets never overlap. */
function fillet(nodes: Node[]): { p: V2; seg: number }[] {
  const out: { p: V2; seg: number }[] = [{ p: nodes[0].p, seg: nodes[0].seg }]
  for (let i = 1; i < nodes.length - 1; i++) {
    const n = nodes[i]
    const a = nodes[i - 1].p
    const b = nodes[i + 1].p
    const u1 = norm(sub(n.p, a))
    const u2 = norm(sub(b, n.p))
    const turn = Math.atan2(cross(u1, u2), dot(u1, u2))
    if (!n.r || Math.abs(turn) < 1e-3) {
      out.push({ p: n.p, seg: n.seg })
      continue
    }
    const half = Math.abs(turn) / 2
    let T = n.r * Math.tan(half)
    T = Math.min(T, 0.48 * len(sub(n.p, a)), 0.48 * len(sub(b, n.p)))
    const r = T / Math.tan(half)
    const start = sub(n.p, mul(u1, T))
    const normal = turn > 0 ? left(u1) : mul(left(u1), -1)
    const centre = add(start, mul(normal, r))
    const a0 = Math.atan2(start.y - centre.y, start.x - centre.x)
    const steps = Math.max(2, Math.ceil((Math.abs(turn) * r) / 1.5))
    for (let k = 0; k <= steps; k++) {
      const ang = a0 + (turn * k) / steps
      out.push({ p: { x: centre.x + r * Math.cos(ang), y: centre.y + r * Math.sin(ang) }, seg: n.seg })
    }
  }
  const last = nodes[nodes.length - 1]
  out.push({ p: last.p, seg: last.seg })
  return out
}

/** Even resampling every `step` metres; each sample keeps the segment of the edge it lies on. */
function resample(pts: { p: V2; seg: number }[], step: number) {
  const out: { p: V2; seg: number; s: number }[] = [{ ...pts[0], s: 0 }]
  let carry = 0
  let s = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1].p
    const b = pts[i].p
    const d = len(sub(b, a))
    if (d < 1e-6) continue
    let pos = step - carry
    while (pos <= d) {
      s += step
      out.push({ p: add(a, mul(sub(b, a), pos / d)), seg: pts[i].seg, s })
      pos += step
    }
    carry = d - (pos - step)
  }
  return out
}

/** Nearest sample to p among samples belonging to segments segLo..segHi (so revisited places can't match the wrong pass). */
function nearestIdx(samples: Sample[], p: V2, segLo: number, segHi: number) {
  let best = -1
  let bd = Infinity
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].seg < segLo || samples[i].seg > segHi) continue
    const d = (samples[i].p.x - p.x) ** 2 + (samples[i].p.y - p.y) ** 2
    if (d < bd) {
      bd = d
      best = i
    }
  }
  return Math.max(0, best)
}

const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

export function buildRoute(route: TestRoute): BuiltRoute {
  const nodes: Node[] = [{ p: { x: 0, y: 0 }, seg: 0 }]
  let pos: V2 = { x: 0, y: 0 }
  let dir: V2 = { x: 0, y: 1 }
  const junctions: JunctionGeo[] = []
  const roundabouts: RoundaboutGeo[] = []
  const pending: { seg: number; kind: 'task'; at: V2 }[] = []
  const roadInfo: { limit: number; urban: boolean }[] = []
  let current = { limit: 30, urban: true }

  route.segments.forEach((seg, i) => {
    if (seg.t === 'road') {
      current = { limit: seg.limit, urban: (seg.area ?? (seg.limit >= 50 ? 'rural' : 'urban')) === 'urban' }
      // Road lengths are measured from the junction or roundabout centre. If the path already
      // runs ahead of that point (leaving a roundabout), start from where it actually is.
      const ahead = dot(sub(nodes[nodes.length - 1].p, pos), dir)
      const start = ahead > 0.01 ? ahead : 0
      if (seg.bend) {
        pos = add(pos, mul(dir, start))
        const steps = Math.max(2, Math.ceil((seg.len - start) / 8))
        for (let k = 0; k < steps; k++) {
          dir = rotate(dir, seg.bend / steps)
          pos = add(pos, mul(dir, (seg.len - start) / steps))
          nodes.push({ p: pos, seg: i })
        }
      } else {
        pos = add(pos, mul(dir, seg.len))
        nodes.push({ p: pos, seg: i })
      }
    } else if (seg.t === 'turn') {
      const node = nodes[nodes.length - 1]
      const out = seg.dir === 'left' ? left(dir) : seg.dir === 'right' ? mul(left(dir), -1) : dir
      if (seg.dir !== 'ahead') node.r = TURN_R
      const back = mul(dir, -1)
      const arms: V2[] =
        seg.at === 'side-road' ? [back, dir, out] : seg.at === 't-junction' ? [back, left(dir), mul(left(dir), -1)] : [back, dir, left(dir), mul(left(dir), -1)]
      const control = seg.control ?? (seg.at === 'side-road' ? 'none' : 'give-way')
      const approach = sub(pos, mul(dir, STOP_BACK))
      junctions.push({ seg: i, node: pos, kind: seg.at, control, arms, approach, stopLine: control === 'none' ? undefined : approach })
      dir = out
    } else if (seg.t === 'roundabout') {
      const exits = seg.exits ?? 4
      const centre = pos
      const phiE = angleOf(mul(dir, -1))
      const phiX = phiE - (seg.exit * 360) / exits
      const arms = Array.from({ length: exits }, (_, k) => dirOf(phiE - (k * 360) / exits))
      const approach = sub(centre, mul(dir, (seg.mini ? 3 : RING_R) + STOP_BACK))
      if (seg.mini) {
        const out = seg.exit === 1 ? left(dir) : seg.exit === 3 ? mul(left(dir), -1) : dir
        if (seg.exit !== 2) nodes[nodes.length - 1].r = TURN_R
        junctions.push({ seg: i, node: centre, kind: 'mini', control: 'give-way', arms, approach, stopLine: approach })
        dir = out
      } else {
        roundabouts.push({ seg: i, centre, radius: RING_R, arms })
        nodes.pop()
        nodes.push({ p: sub(centre, mul(dir, RING_R + 22)), r: 18, seg: i })
        const from = phiE - 32
        const to = phiX + 32
        const steps = Math.max(1, Math.ceil(Math.abs(from - to) / 28))
        for (let k = 0; k <= steps; k++) {
          const phi = from + ((to - from) * k) / steps
          nodes.push({ p: add(centre, mul(dirOf(phi), RING_R)), r: k === 0 || k === steps ? 10 : RING_R, seg: i })
        }
        dir = dirOf(phiX)
        nodes.push({ p: add(centre, mul(dir, RING_R + 22)), r: 18, seg: i })
        junctions.push({ seg: i, node: centre, kind: 'roundabout', control: 'give-way', arms, approach, stopLine: approach })
      }
    } else {
      pending.push({ seg: i, kind: 'task', at: pos })
    }
    roadInfo[i] = current
  })

  // Ego lane path: the centreline offset to the left by half a lane (mitred at corners).
  const egoNodes: Node[] = nodes.map((n, i) => {
    const uIn = i > 0 ? norm(sub(n.p, nodes[i - 1].p)) : norm(sub(nodes[1].p, n.p))
    const uOut = i < nodes.length - 1 ? norm(sub(nodes[i + 1].p, n.p)) : uIn
    const miter = mul(add(left(uIn), left(uOut)), LANE / Math.max(0.2, 1 + dot(uIn, uOut)))
    const turnLeft = cross(uIn, uOut) > 0
    return { p: add(n.p, miter), seg: n.seg, r: n.r ? Math.max(3, n.r + (turnLeft ? -LANE : LANE)) : undefined }
  })

  const dense = resample(fillet(egoNodes), 1)
  const ego: Sample[] = dense.map((d, i) => {
    const a = dense[Math.max(0, i - 1)].p
    const b = dense[Math.min(dense.length - 1, i + 1)].p
    const info = roadInfo[d.seg] ?? current
    return { s: d.s, p: d.p, dir: norm(sub(b, a)), seg: d.seg, limit: info.limit, urban: info.urban }
  })
  const centre = ego.map((e) => sub(e.p, mul(left(e.dir), LANE)))

  // Directions, stops and roadside furniture.
  const instructions: Instruction[] = []
  const stops: Stop[] = []
  const signs: SignGeo[] = []
  const features: FeatureGeo[] = []

  route.segments.forEach((seg, i) => {
    const firstOfSeg = ego.findIndex((e) => e.seg === i)
    if (seg.t === 'road') {
      const s0 = firstOfSeg >= 0 ? ego[firstOfSeg].s : 0
      const prevLimit = i > 0 ? roadInfo[i - 1]?.limit : undefined
      if (seg.limit !== prevLimit || i === 0) {
        const id = seg.limit === 60 ? 'national-speed-limit' : (`speed-${seg.limit}` as SignGeo['id'])
        signs.push({ s: s0 + 6, id, side: 'left' }, { s: s0 + 6, id, side: 'right' })
      }
      for (const f of seg.features ?? []) {
        features.push({ s: s0 + f.at, kind: f.kind })
        if (f.kind === 'zebra') stops.push({ s: s0 + f.at - 4, dwell: 2.5, reason: 'zebra' })
        if (f.kind === 'humps') signs.push({ s: s0 + Math.max(4, f.at - 40), id: 'warn-humps', side: 'left' })
      }
      return
    }
    if (seg.t === 'task') {
      const at = pending.find((p) => p.seg === i)!.at
      const s = ego[nearestIdx(ego, at, i - 1, i + 1)].s
      // Announce shortly before the stop, but never ahead of the previous direction.
      const prev = instructions.length ? instructions[instructions.length - 1].s + 3 : 0
      instructions.push({ seg: i, s: Math.max(prev, s - 30), text: seg.say, short: seg.say, icon: 'task' })
      stops.push({ s, dwell: seg.kind === 'emergency-stop' ? 3 : 6, reason: seg.kind === 'emergency-stop' ? 'emergency' : 'task', hard: seg.kind === 'emergency-stop' })
      return
    }
    const j = junctions.find((x) => x.seg === i)!
    const k = nearestIdx(ego, j.node, i - 1, i + 1)
    const sStop = ego[nearestIdx(ego, add(j.approach, mul(left(ego[Math.max(0, k - 25)].dir), LANE)), i - 1, i)].s
    // Roundabout directions refer to the entry; junction directions to the turn itself.
    const sNode = seg.t === 'roundabout' && !seg.mini ? sStop + 4 : ego[k].s
    if (seg.t === 'roundabout') {
      const place = seg.mini ? 'mini-roundabout' : 'roundabout'
      const exitText = seg.exit === 2 && (seg.exits ?? 4) === 4 ? `go straight ahead (${ordinal(seg.exit)} exit)` : `take the ${ordinal(seg.exit)} exit`
      const leave = ego.reduce((m, e) => (e.seg === i ? e.s : m), sNode)
      instructions.push({ seg: i, s: sNode, until: leave, text: `At the ${place}, ${exitText} onto ${seg.into}`, short: `${ordinal(seg.exit)} exit`, icon: 'roundabout', exit: seg.exit })
      stops.push({ s: sStop, dwell: seg.mini ? 1.2 : 0.8, reason: 'give-way' })
      signs.push({ s: Math.max(4, sNode - 90), id: seg.mini ? 'mini-roundabout' : 'warn-roundabout', side: 'left' })
    } else {
      const verb = seg.dir === 'ahead' ? 'go straight ahead' : `turn ${seg.dir}`
      const where =
        seg.at === 'side-road' ? `Take the next ${seg.dir} into ${seg.into}` : seg.at === 't-junction' ? `At the end of the road, ${verb} onto ${seg.into}` : `At the ${seg.control === 'lights' ? 'traffic lights' : 'crossroads'}, ${verb} onto ${seg.into}`
      instructions.push({ seg: i, s: sNode, text: where, short: seg.dir === 'ahead' ? 'Straight on' : `Turn ${seg.dir}`, icon: seg.dir })
      if (j.control === 'stop') {
        stops.push({ s: sStop, dwell: 2, reason: 'stop' })
        signs.push({ s: sStop - 2, id: 'stop', side: 'left' })
      } else if (j.control === 'lights') {
        stops.push({ s: sStop, dwell: 5, reason: 'lights' })
        signs.push({ s: Math.max(4, sNode - 80), id: 'warn-traffic-signals', side: 'left' })
      } else if (j.control === 'give-way') {
        stops.push({ s: sStop, dwell: 1, reason: 'give-way' })
        signs.push({ s: sStop - 2, id: 'give-way', side: 'left' })
      }
    }
  })
  instructions.sort((a, b) => a.s - b.s)
  stops.sort((a, b) => a.s - b.s)

  // Speed profile: limits, curvature and stops, then acceleration and braking passes.
  const n = ego.length
  const vmax = ego.map((e, i) => {
    const a = ego[Math.max(0, i - 3)].dir
    const b = ego[Math.min(n - 1, i + 3)].dir
    const kappa = Math.abs(Math.atan2(cross(a, b), dot(a, b))) / Math.max(1, Math.min(n - 1, i + 3) - Math.max(0, i - 3))
    const vCurve = kappa > 1e-4 ? Math.sqrt(LAT / kappa) : 99
    const school = features.some((f) => f.kind === 'school' && e.s >= f.s && e.s <= f.s + 150)
    return Math.min(e.limit * 0.44704 * 0.95, vCurve, school ? 8.5 : 99)
  })
  const stopAt = new Map<number, Stop>()
  for (const st of stops) {
    const idx = Math.max(0, Math.min(n - 1, Math.round(st.s)))
    vmax[idx] = 0
    stopAt.set(idx, st)
  }
  vmax[n - 1] = 0
  const v = vmax.slice()
  for (let i = n - 2; i >= 0; i--) {
    const hard = [...stopAt.entries()].some(([idx, st]) => st.hard && idx > i && idx - i < 45)
    v[i] = Math.min(v[i], Math.sqrt(v[i + 1] ** 2 + 2 * (hard ? 7 : DEC) * 1))
  }
  v[0] = 0
  for (let i = 1; i < n; i++) v[i] = Math.min(v[i], Math.sqrt(v[i - 1] ** 2 + 2 * ACC * 1))

  const tArrive = new Array<number>(n)
  const tDepart = new Array<number>(n)
  tArrive[0] = 0
  tDepart[0] = 0
  for (let i = 1; i < n; i++) {
    const avg = Math.max(0.6, (v[i - 1] + v[i]) / 2)
    tArrive[i] = tDepart[i - 1] + 1 / avg
    tDepart[i] = tArrive[i] + (stopAt.get(i)?.dwell ?? 0)
  }

  const xs = ego.map((e) => e.p.x)
  const ys = ego.map((e) => e.p.y)
  return {
    route,
    ego,
    centre,
    junctions,
    roundabouts,
    instructions,
    stops,
    features,
    signs,
    speed: v,
    tArrive,
    tDepart,
    duration: tDepart[n - 1],
    length: ego[n - 1].s,
    bounds: { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) },
  }
}

/** Position along the route at time t (seconds). */
export function stateAt(b: BuiltRoute, t: number) {
  const { tArrive, tDepart, ego, speed } = b
  const n = ego.length
  if (t <= 0) return { i: 0, f: 0, s: 0, p: ego[0].p, dir: ego[0].dir, v: 0 }
  if (t >= b.duration) return { i: n - 1, f: 0, s: ego[n - 1].s, p: ego[n - 1].p, dir: ego[n - 1].dir, v: 0 }
  let lo = 0
  let hi = n - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (tArrive[mid] <= t) lo = mid
    else hi = mid - 1
  }
  const i = lo
  if (t < tDepart[i] || i >= n - 1) return { i, f: 0, s: ego[i].s, p: ego[i].p, dir: ego[i].dir, v: 0 }
  const f = (t - tDepart[i]) / (tArrive[i + 1] - tDepart[i])
  const a = ego[i]
  const c = ego[i + 1]
  return { i, f, s: a.s + (c.s - a.s) * f, p: add(a.p, mul(sub(c.p, a.p), f)), dir: norm(add(mul(a.dir, 1 - f), mul(c.dir, f))), v: speed[i] + (speed[i + 1] - speed[i]) * f }
}

/** Sample index at distance s (clamped). */
export function sampleAt(b: BuiltRoute, s: number) {
  return b.ego[Math.max(0, Math.min(b.ego.length - 1, Math.round(s)))]
}

export const geom = { add, sub, mul, left, norm, len, dot }

export function segmentSummary(segments: Segment[]) {
  return {
    roundabouts: segments.filter((s) => s.t === 'roundabout' && !s.mini).length,
    minis: segments.filter((s) => s.t === 'roundabout' && s.mini).length,
    turns: segments.filter((s) => s.t === 'turn').length,
    tasks: segments.filter((s) => s.t === 'task').length,
  }
}
