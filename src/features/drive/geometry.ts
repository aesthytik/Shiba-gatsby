// 2D helpers for the drive simulator. World coordinates match three.js: x east, z south (so -z is
// "north" on screen). A heading of 0 faces -z and positive headings turn left, as in sim/motion.ts.

export interface Vec {
  x: number
  z: number
}

export interface Path {
  pts: Vec[]
  /** Cumulative distance along the path at each point. */
  cum: number[]
  length: number
}

export const V = (x: number, z: number): Vec => ({ x, z })

export function makePath(points: Vec[]): Path {
  const pts = points.filter((p, i) => i === 0 || Math.hypot(p.x - points[i - 1].x, p.z - points[i - 1].z) > 1e-6)
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
  return { pts, cum, length: cum[cum.length - 1] }
}

export const headingFor = (dx: number, dz: number) => Math.atan2(-dx, -dz)
export const dirOf = (h: number): Vec => ({ x: -Math.sin(h), z: -Math.cos(h) })
export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

function segmentIndex(p: Path, s: number) {
  if (s <= 0) return 0
  if (s >= p.length) return p.pts.length - 2
  let lo = 0
  let hi = p.cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (p.cum[mid] <= s) lo = mid
    else hi = mid
  }
  return lo
}

/** Point, heading and tangent at distance s along the path (clamped to its ends). */
export function pointAt(p: Path, s: number) {
  const i = segmentIndex(p, s)
  const a = p.pts[i]
  const b = p.pts[i + 1] ?? a
  const segLen = p.cum[i + 1] - p.cum[i] || 1
  const f = Math.max(0, Math.min(1, (s - p.cum[i]) / segLen)) * (p.pts[i + 1] ? 1 : 0)
  const dx = b.x - a.x
  const dz = b.z - a.z
  return { x: a.x + dx * f, z: a.z + dz * f, h: headingFor(dx, dz), s: Math.max(0, Math.min(p.length, s)) }
}

/** Nearest point on the path within [from, to] (distances along the path). `d` is signed: positive = left of travel. */
export function project(p: Path, q: Vec, from = 0, to = Infinity) {
  let best = { s: from, d: Infinity, x: 0, z: 0 }
  let bestAbs = Infinity
  for (let i = 0; i < p.pts.length - 1; i++) {
    if (p.cum[i + 1] < from || p.cum[i] > to) continue
    const a = p.pts[i]
    const b = p.pts[i + 1]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len2 = dx * dx + dz * dz
    const f = len2 ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.z - a.z) * dz) / len2)) : 0
    const px = a.x + dx * f
    const pz = a.z + dz * f
    const dist = Math.hypot(q.x - px, q.z - pz)
    if (dist < bestAbs) {
      bestAbs = dist
      // Left of travel: dir = (dx, dz); the left normal in this x/z frame is (dz, -dx) because z points south.
      const side = Math.sign((q.x - px) * dz - (q.z - pz) * dx)
      best = { s: p.cum[i] + f * Math.sqrt(len2), d: dist * (side || 1), x: px, z: pz }
    }
  }
  return best
}

export function distToSegment(q: Vec, a: Vec, b: Vec) {
  const dx = b.x - a.x
  const dz = b.z - a.z
  const len2 = dx * dx + dz * dz
  const f = len2 ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.z - a.z) * dz) / len2)) : 0
  return Math.hypot(q.x - (a.x + dx * f), q.z - (a.z + dz * f))
}

const rad = (deg: number) => (deg * Math.PI) / 180

/** Compass bearing in degrees: 0 = north (-z), 90 = east (+x), increasing clockwise as seen from above. */
export function onCircle(c: Vec, r: number, bearingDeg: number): Vec {
  const b = rad(bearingDeg)
  return { x: c.x + r * Math.sin(b), z: c.z - r * Math.cos(b) }
}

/** Points around a circle between two bearings (clockwise if b1 > b0), roughly `stepDeg` apart. */
export function arc(c: Vec, r: number, b0: number, b1: number, stepDeg = 8): Vec[] {
  const n = Math.max(2, Math.ceil(Math.abs(b1 - b0) / stepDeg))
  return Array.from({ length: n + 1 }, (_, i) => onCircle(c, r, b0 + ((b1 - b0) * i) / n))
}

/** Cubic Hermite curve between two points with tangent directions (unit vectors) and a tension length. */
export function hermite(p0: Vec, d0: Vec, p1: Vec, d1: Vec, tension: number, n = 14): Vec[] {
  const out: Vec[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1
    const h10 = t ** 3 - 2 * t ** 2 + t
    const h01 = -2 * t ** 3 + 3 * t ** 2
    const h11 = t ** 3 - t ** 2
    out.push({
      x: h00 * p0.x + h10 * d0.x * tension + h01 * p1.x + h11 * d1.x * tension,
      z: h00 * p0.z + h10 * d0.z * tension + h01 * p1.z + h11 * d1.z * tension,
    })
  }
  return out
}

/** Tangent of a clockwise circle at a bearing, as a unit vector. */
export function clockwiseTangent(bearingDeg: number): Vec {
  const b = rad(bearingDeg)
  return { x: Math.cos(b), z: Math.sin(b) }
}

export interface RoadSeg {
  a: Vec
  b: Vec
  width: number
}

/** Distance from the edge of the nearest road (negative when on tarmac). */
export function offRoadDistance(q: Vec, roads: RoadSeg[], discs: { c: Vec; r: number }[]) {
  let best = Infinity
  for (const r of roads) best = Math.min(best, distToSegment(q, r.a, r.b) - r.width / 2)
  for (const d of discs) best = Math.min(best, Math.hypot(q.x - d.c.x, q.z - d.c.z) - d.r)
  return best
}
