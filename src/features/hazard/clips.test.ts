import { describe, expect, it } from 'vitest'
import { egoDistance, poseAt } from '../../sim/motion'
import { CLIPS, type ActorKind, type Clip } from './clips'
import { pieceAt } from '../../sim/piecewise'

const SIZE: Record<ActorKind | 'ego', [number, number]> = {
  ego: [1.8, 4.3],
  car: [1.8, 4.3],
  van: [2.0, 5.2],
  bus: [2.5, 11.5],
  pedestrian: [0.5, 0.5],
  child: [0.4, 0.4],
  cyclist: [0.6, 1.8],
  ball: [0.25, 0.25],
  horse: [0.8, 2.4],
  tractor: [2.2, 4.0],
}

function halfExtents(kind: keyof typeof SIZE, rot: number) {
  const [w, l] = SIZE[kind]
  const c = Math.abs(Math.cos(rot))
  const s = Math.abs(Math.sin(rot))
  return { hx: (c * w + s * l) / 2, hz: (s * w + c * l) / 2 }
}

function egoAt(clip: Clip, t: number) {
  return { x: pieceAt(clip.egoX, t), z: -egoDistance(clip.ego, t) }
}

describe.each(CLIPS.map((c) => [c.id, c] as const))('clip %s', (_, clip) => {
  it('has hazard windows inside the clip and in time order', () => {
    for (const h of clip.hazards) {
      expect(h.start).toBeGreaterThanOrEqual(0)
      expect(h.end).toBeGreaterThan(h.start + 1)
      expect(h.end).toBeLessThanOrEqual(clip.duration)
    }
  })

  it('links every hazard to at least one actor', () => {
    for (const h of clip.hazards) expect(clip.actors.some((a) => a.hazard === h.id), h.id).toBe(true)
  })

  it('never lets a moving actor collide with the camera car', () => {
    const ego = halfExtents('ego', 0)
    for (let t = 0; t <= clip.duration; t += 0.05) {
      const e = egoAt(clip, t)
      for (const a of clip.actors) {
        if (a.visible && (t < a.visible[0] || t > a.visible[1])) continue
        const p = poseAt(a.keys, t)
        const o = halfExtents(a.kind, p.rot)
        const overlapX = Math.abs(p.x - e.x) < ego.hx + o.hx + 0.3
        const overlapZ = Math.abs(p.z - e.z) < ego.hz + o.hz + 0.5
        expect(overlapX && overlapZ, `${a.id} hits camera car at t=${t.toFixed(2)} (actor ${p.x.toFixed(1)},${p.z.toFixed(1)} ego ${e.x.toFixed(1)},${e.z.toFixed(1)})`).toBe(false)
      }
    }
  })

  it('keeps moving vehicles clear of parked vehicles', () => {
    const movers = clip.actors.filter((a) => ['car', 'van', 'bus', 'tractor', 'cyclist', 'horse'].includes(a.kind))
    for (let t = 0; t <= clip.duration; t += 0.1) {
      for (const a of movers) {
        const p = poseAt(a.keys, t)
        const me = halfExtents(a.kind, p.rot)
        for (const pv of clip.scene.parked ?? []) {
          const kind = pv.kind ?? 'car'
          const o = halfExtents(kind, 0)
          const x = (pv.side === 'left' ? -1 : 1) * (clip.scene.roadHalf - o.hx - 0.15)
          const hit = Math.abs(x - p.x) < me.hx + o.hx && Math.abs(pv.z - p.z) < me.hz + o.hz
          expect(hit, `${a.id} drives through parked ${kind} at z=${pv.z} (t=${t.toFixed(1)})`).toBe(false)
        }
      }
    }
  })

  it('keeps the camera car clear of parked vehicles', () => {
    const ego = halfExtents('ego', 0)
    for (let t = 0; t <= clip.duration; t += 0.1) {
      const e = egoAt(clip, t)
      for (const pv of clip.scene.parked ?? []) {
        const kind = pv.kind ?? 'car'
        const o = halfExtents(kind, 0)
        const x = (pv.side === 'left' ? -1 : 1) * (clip.scene.roadHalf - o.hx - 0.15)
        const hit = Math.abs(x - e.x) < ego.hx + o.hx + 0.1 && Math.abs(pv.z - e.z) < ego.hz + o.hz
        expect(hit, `parked ${kind} at z=${pv.z} hit at t=${t.toFixed(1)}`).toBe(false)
      }
    }
  })
})
