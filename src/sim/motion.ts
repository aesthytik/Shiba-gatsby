// Pure motion helpers shared by the hazard clips and the route simulator. No three.js here,
// so scripted motion can be unit-tested (e.g. "no actor ever hits the camera car").

export interface Key {
  t: number
  x: number
  z: number
  /** Heading in radians (0 = facing -Z, i.e. "north"; positive turns left/anticlockwise from above). */
  rot?: number
}

export interface Pose {
  x: number
  z: number
  rot: number
  speed: number
}

/** Heading for a direction of travel in the x/z plane, matching three.js rotation.y. */
export function headingOf(dx: number, dz: number) {
  return Math.atan2(-dx, -dz)
}

function lerp(a: number, b: number, f: number) {
  return a + (b - a) * f
}

function findSegment(keys: Key[], t: number) {
  if (t <= keys[0].t) return 0
  for (let i = 0; i < keys.length - 1; i++) if (t < keys[i + 1].t) return i
  return keys.length - 2
}

function positionAt(keys: Key[], t: number) {
  if (keys.length === 1 || t <= keys[0].t) return { x: keys[0].x, z: keys[0].z }
  const last = keys[keys.length - 1]
  if (t >= last.t) return { x: last.x, z: last.z }
  const i = findSegment(keys, t)
  const a = keys[i]
  const b = keys[i + 1]
  const f = (t - a.t) / (b.t - a.t)
  return { x: lerp(a.x, b.x, f), z: lerp(a.z, b.z, f) }
}

/** Interpolated pose. Heading follows the direction of travel, or explicit `rot` when nearly stationary. */
export function poseAt(keys: Key[], t: number): Pose {
  const p = positionAt(keys, t)
  const dt = 0.06
  const a = positionAt(keys, t - dt)
  const b = positionAt(keys, t + dt)
  const dx = b.x - a.x
  const dz = b.z - a.z
  const speed = Math.hypot(dx, dz) / (2 * dt)
  let rot: number
  if (speed > 0.25) rot = headingOf(dx, dz)
  else {
    // Stationary: use the most recent explicit heading, or the heading of the nearest movement.
    const i = findSegment(keys, t)
    const explicit = [...keys.slice(0, i + 2)].reverse().find((k) => k.rot !== undefined && k.t <= t + 1e-6)
    if (explicit?.rot !== undefined) rot = explicit.rot
    else {
      const moving = keys.findIndex((k, j) => j > 0 && (k.x !== keys[j - 1].x || k.z !== keys[j - 1].z))
      rot = moving > 0 ? headingOf(keys[moving].x - keys[moving - 1].x, keys[moving].z - keys[moving - 1].z) : (keys[0].rot ?? 0)
    }
  }
  return { ...p, rot, speed }
}

/** Keys along a straight line with constant acceleration from v0 to v1 (m/s). */
export function lineKeys(from: [number, number], to: [number, number], t0: number, v0: number, v1: number, samples = 8): Key[] {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1])
  const duration = (2 * len) / Math.max(0.01, v0 + v1)
  const a = (v1 - v0) / duration
  const keys: Key[] = []
  for (let i = 0; i <= samples; i++) {
    const tau = (duration * i) / samples
    const s = v0 * tau + 0.5 * a * tau * tau
    const f = len ? s / len : 0
    keys.push({ t: t0 + tau, x: lerp(from[0], to[0], f), z: lerp(from[1], to[1], f) })
  }
  return keys
}

/** Keys along a circular arc (angles in radians, standard maths orientation in the x/-z plane) at constant speed. */
export function arcKeys(cx: number, cz: number, r: number, a0: number, a1: number, t0: number, speed: number, samples = 10): Key[] {
  const len = Math.abs(a1 - a0) * r
  const duration = len / speed
  const keys: Key[] = []
  for (let i = 0; i <= samples; i++) {
    const a = lerp(a0, a1, i / samples)
    keys.push({ t: t0 + (duration * i) / samples, x: cx + r * Math.cos(a), z: cz - r * Math.sin(a) })
  }
  return keys
}

/** Stand still at a point for a while. */
export function holdKey(x: number, z: number, t0: number, t1: number, rot?: number): Key[] {
  return [
    { t: t0, x, z, rot },
    { t: t1, x, z, rot },
  ]
}

/** Concatenate key lists, dropping keys that would go backwards in time. */
export function chain(...parts: Key[][]): Key[] {
  const out: Key[] = []
  for (const part of parts) for (const k of part) if (!out.length || k.t > out[out.length - 1].t + 1e-6) out.push(k)
  return out
}

export function lastKey(keys: Key[]) {
  return keys[keys.length - 1]
}

/**
 * Ego (camera car) speed profile: piecewise-linear speed keyframes [t, v].
 * Returns distance travelled at time t (exact integral of the piecewise-linear speed).
 */
export function egoDistance(profile: [number, number][], t: number) {
  let s = 0
  for (let i = 0; i < profile.length - 1; i++) {
    const [ta, va] = profile[i]
    const [tb, vb] = profile[i + 1]
    if (t <= ta) break
    const te = Math.min(t, tb)
    const ve = va + ((vb - va) * (te - ta)) / (tb - ta)
    s += ((va + ve) / 2) * (te - ta)
    if (t <= tb) return s
  }
  const [tl, vl] = profile[profile.length - 1]
  if (t > tl) s += vl * (t - tl)
  return s
}

export function egoSpeed(profile: [number, number][], t: number) {
  if (t <= profile[0][0]) return profile[0][1]
  for (let i = 0; i < profile.length - 1; i++) {
    const [ta, va] = profile[i]
    const [tb, vb] = profile[i + 1]
    if (t <= tb) return va + ((vb - va) * (t - ta)) / (tb - ta)
  }
  return profile[profile.length - 1][1]
}

export const mph = (v: number) => v * 0.44704
export const toMph = (ms: number) => ms / 0.44704
