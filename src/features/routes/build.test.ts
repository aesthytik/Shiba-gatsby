import { describe, expect, it } from 'vitest'
import { buildRoute, stateAt } from './build'
import { ROUTES } from './data'

describe.each(ROUTES.map((r) => [r.id, r] as const))('route %s', (_, route) => {
  const b = buildRoute(route)

  it('produces a continuous path with 1 m spacing', () => {
    for (let i = 1; i < b.ego.length; i++) {
      const d = Math.hypot(b.ego[i].p.x - b.ego[i - 1].p.x, b.ego[i].p.y - b.ego[i - 1].p.y)
      expect(d, `gap at sample ${i}`).toBeLessThan(1.05)
    }
  })

  it('never turns sharper than a car can (no kinks or reversals in the path)', () => {
    for (let i = 3; i < b.ego.length - 3; i++) {
      const a = b.ego[i - 3].dir
      const c = b.ego[i + 3].dir
      const cos = a.x * c.x + a.y * c.y
      // 6 m of travel should never turn more than ~90° (tightest in-lane radius ≈ 4 m).
      expect(cos, `kink at s=${b.ego[i].s}`).toBeGreaterThan(-0.05)
    }
  })

  it('gives a direction for every turn, roundabout and task, in order', () => {
    const expected = route.segments.filter((s) => s.t !== 'road').length
    expect(b.instructions).toHaveLength(expected)
    for (let i = 1; i < b.instructions.length; i++) expect(b.instructions[i].s).toBeGreaterThanOrEqual(b.instructions[i - 1].s)
  })

  it('stays within the speed limit and stops where it should', () => {
    b.ego.forEach((e, i) => expect(b.speed[i]).toBeLessThanOrEqual(e.limit * 0.44704 + 1e-6))
    for (const st of b.stops) expect(b.speed[Math.round(st.s)], `stop at ${st.s} (${st.reason})`).toBe(0)
  })

  it('stops at lines while still pointing straight, before any turn begins', () => {
    for (const st of b.stops.filter((x) => ['give-way', 'stop', 'lights'].includes(x.reason))) {
      const a = b.ego[Math.max(0, Math.round(st.s) - 3)].dir
      const c = b.ego[Math.round(st.s) + 1].dir
      expect(a.x * c.x + a.y * c.y, `turning at ${st.reason} line, s=${st.s}`).toBeGreaterThan(0.995)
    }
  })

  it('plays back monotonically from start to finish', () => {
    let prev = -1
    for (let t = 0; t <= b.duration; t += 0.5) {
      const s = stateAt(b, t).s
      expect(s).toBeGreaterThanOrEqual(prev - 1e-6)
      prev = s
    }
    expect(stateAt(b, b.duration + 1).s).toBeCloseTo(b.length)
  })

  it('takes a plausible time to drive', () => {
    const avgMph = b.length / b.duration / 0.44704
    expect(avgMph).toBeGreaterThan(8)
    expect(avgMph).toBeLessThan(50)
  })

  it('references existing segments from hotspots', () => {
    for (const h of route.hotspots) expect(route.segments[h.seg], h.title).toBeDefined()
  })
})
