import { rng } from '../../lib/random'
import type { MarkingItem } from '../../sim/three/Markings'
import { arc, headingFor, makePath, offRoadDistance, project, V, type Path, type RoadSeg, type Vec } from './geometry'
import type { Ctx, FaultInfo, Prop } from './types'

export const LANE = 1.85
export const ROAD = 7.4
export const MPH = 0.44704

export const road = (ax: number, az: number, bx: number, bz: number, width = ROAD): RoadSeg => ({ a: V(ax, az), b: V(bx, bz), width })

/** Join polylines, dropping duplicated joints. */
export function join(...parts: Vec[][]): Vec[] {
  const out: Vec[] = []
  for (const part of parts)
    for (const p of part) {
      const last = out[out.length - 1]
      if (!last || Math.hypot(last.x - p.x, last.z - p.z) > 0.05) out.push(p)
    }
  return out
}

/** Dashed line along a straight run. */
export function dashes(a: Vec, b: Vec, opts: { w?: number; dash?: number; gap?: number; from?: number; to?: number } = {}): MarkingItem[] {
  const { w = 0.15, dash = 3, gap = 5, from = 0 } = opts
  const len = Math.hypot(b.x - a.x, b.z - a.z)
  const to = opts.to ?? len
  const dx = (b.x - a.x) / len
  const dz = (b.z - a.z) / len
  const rot = headingFor(dx, dz)
  const out: MarkingItem[] = []
  for (let d = from; d + dash <= to + 1e-6; d += dash + gap) out.push([a.x + dx * (d + dash / 2), a.z + dz * (d + dash / 2), w, dash, rot])
  return out
}

export function solid(a: Vec, b: Vec, w = 0.15): MarkingItem[] {
  const len = Math.hypot(b.x - a.x, b.z - a.z)
  return [[(a.x + b.x) / 2, (a.z + b.z) / 2, w, len, headingFor(b.x - a.x, b.z - a.z)]]
}

/** A give-way or stop line across the lane of traffic heading `h`, at `base` on the road centre. */
export function lineAcross(base: Vec, h: number, opts: { dash?: number; gap?: number; from?: number; to?: number; w?: number } = {}): MarkingItem[] {
  const { dash = 0.6, gap = 0.45, from = 0.2, to = 3.5, w = 0.3 } = opts
  // Left of travel for heading h.
  const lx = -Math.cos(h)
  const lz = Math.sin(h)
  const out: MarkingItem[] = []
  for (let k = from; k + dash <= to + 1e-6; k += dash + gap) out.push([base.x + lx * (k + dash / 2), base.z + lz * (k + dash / 2), w, dash, h + Math.PI / 2])
  return out
}

/** Houses, trees and lamp posts beside every road, away from junctions. Deterministic per seed. */
export function scatter(roads: RoadSeg[], discs: { c: Vec; r: number }[], seed: number): Prop[] {
  const rand = rng(seed)
  const props: Prop[] = []
  roads.forEach((rd, ri) => {
    const others = roads.filter((_, i) => i !== ri)
    const len = Math.hypot(rd.b.x - rd.a.x, rd.b.z - rd.a.z)
    const dx = (rd.b.x - rd.a.x) / len
    const dz = (rd.b.z - rd.a.z) / len
    const lx = dz
    const lz = -dx
    const at = (d: number, off: number): Vec => ({ x: rd.a.x + dx * d + lx * off, z: rd.a.z + dz * d + lz * off })
    for (let d = 10; d < len - 6; d += 15 + rand() * 7) {
      for (const side of [1, -1]) {
        const off = side * (rd.width / 2 + 3 + 6.5 + rand() * 3)
        const p = at(d, off)
        if (offRoadDistance(p, others, discs) < 11) continue
        props.push({ kind: 'house', x: p.x, z: p.z, rot: headingFor(-lx * side, -lz * side), seed: Math.floor(rand() * 100), w: 7 + rand() * 3, d: 7 + rand() * 2, h: 5.4 + rand() * 1.4 })
      }
    }
    for (let d = 6; d < len - 4; d += 9 + rand() * 6) {
      for (const side of [1, -1]) {
        if (rand() < 0.45) continue
        const p = at(d, side * (rd.width / 2 + 2.9))
        if (offRoadDistance(p, others, discs) < 6) continue
        props.push({ kind: 'tree', x: p.x, z: p.z, rot: 0, seed: Math.floor(rand() * 100) })
      }
    }
    for (let d = 30, k = 0; d < len - 10; d += 38, k++) {
      const side = k % 2 ? 1 : -1
      const p = at(d, side * (rd.width / 2 + 1.8))
      if (offRoadDistance(p, others, discs) < 5) continue
      props.push({ kind: 'lamp', x: p.x, z: p.z, rot: headingFor(lx * side, lz * side), seed: 0 })
    }
  })
  return props
}

/** A sign for traffic travelling with heading `h`, `off` metres left of the lane centre line. */
export function signAt(id: Extract<Prop, { kind: 'sign' }>['id'], p: Vec, h: number, off = 0): Prop {
  const lx = -Math.cos(h)
  const lz = Math.sin(h)
  return { kind: 'sign', id, x: p.x + lx * off, z: p.z + lz * off, rot: h }
}

/** Metres along `path` of the point nearest `p`. */
export const sAt = (path: Path, p: Vec) => project(path, p).s

export { arc, makePath }

// ---- shared examiner checks -------------------------------------------------------------------

const mirrorSpeed: FaultInfo = {
  category: 'Use of mirrors – change speed',
  title: 'No mirror check before slowing down',
  advice: 'Check your interior mirror before you brake, so you know what is behind you and can slow down smoothly.',
  severity: 'minor',
}

/** Minor fault for braking in the approach without a recent mirror check; also ticks the mirror check. */
export function mirrorBeforeSlowing(c: Ctx, window: [number, number], tickId?: string) {
  const s = c.car.s
  if (s < window[0] || s > window[1]) return
  if (tickId && c.mirrorAgo < 12) c.tick(tickId)
  // Judge the first firm braking in the approach: was there a mirror check just before it?
  if (c.brake > 0.1 && c.car.v > 4 && !c.mem.mirrorEval) {
    c.mem.mirrorEval = true
    if (c.mirrorAgo > 8) c.fault('mirror-speed', mirrorSpeed)
  }
}

export interface Conflict {
  id: string
  /** Distance along that vehicle's own path at which it crosses the learner's route. */
  conflictS: number
  /** Metres either side of the conflict point that count as "in the way". */
  before: number
  after: number
}

export const inTheWay = (c: Ctx, g: Conflict) => {
  const n = c.npc(g.id)
  return n.active && !n.done && n.s > g.conflictS - g.before && n.s < g.conflictS + g.after
}

export const anyInTheWay = (c: Ctx, list: Conflict[]) => list.some((g) => inTheWay(c, g))
export const allPassed = (c: Ctx, list: Conflict[]) => list.every((g) => {
  const n = c.npc(g.id)
  return n.done || n.s > g.conflictS + g.after
})
