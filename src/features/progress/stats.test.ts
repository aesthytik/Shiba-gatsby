import { describe, expect, it } from 'vitest'
import type { DriveRun, LogEntry } from '../../store/progress'
import { DAY, bestByLesson, faultsByCategory, logHours, readiness, streakDays, totalStars, weeklyHours } from './stats'

const run = (n: number, stars: 0 | 1 | 2 | 3, over: Partial<DriveRun> = {}): DriveRun => ({
  id: `${n}-${stars}-${Math.random()}`,
  n,
  date: Date.now(),
  stars,
  status: stars ? 'complete' : 'failed',
  minors: 0,
  serious: 0,
  dangerous: 0,
  seconds: 60,
  topMph: 20,
  headline: '',
  faults: [],
  ...over,
})

describe('progress stats', () => {
  it('keeps the best star count per lesson and counts attempts', () => {
    const best = bestByLesson([run(1, 1), run(1, 3), run(2, 0)])
    expect(best[1]).toEqual({ stars: 3, attempts: 2, passed: true })
    expect(best[2].passed).toBe(false)
    expect(totalStars([run(1, 1), run(1, 3), run(2, 2)])).toBe(5)
  })

  it('adds up logbook hours by who drove', () => {
    const log: LogEntry[] = [
      { id: 'a', date: '2026-10-20', who: 'instructor', minutes: 120, notes: '' },
      { id: 'b', date: '2026-10-19', who: 'private', minutes: 45, notes: '' },
    ]
    expect(logHours(log)).toEqual({ instructor: 2, private: 0.75, total: 2.75 })
  })

  it('buckets hours into the last 8 weeks, oldest first, empty weeks included', () => {
    const now = new Date('2026-10-24T10:00:00').getTime()
    const log: LogEntry[] = [
      { id: 'a', date: '2026-10-22', who: 'instructor', minutes: 120, notes: '' },
      { id: 'b', date: '2026-10-20', who: 'private', minutes: 60, notes: '' },
      { id: 'c', date: '2026-08-01', who: 'instructor', minutes: 90, notes: '' },
    ]
    const w = weeklyHours(log, 8, now)
    expect(w).toHaveLength(8)
    expect(w[7]).toMatchObject({ inst: 2, priv: 1, total: 3 })
    expect(w[6].total).toBe(0)
    expect(w.reduce((a, x) => a + x.total, 0)).toBe(3)
  })

  it('counts a streak that ends today or yesterday', () => {
    const now = new Date('2026-10-24T10:00:00').getTime()
    expect(streakDays([now, now - DAY, now - 2 * DAY], now)).toBe(3)
    expect(streakDays([now - DAY, now - 2 * DAY], now)).toBe(2)
    expect(streakDays([now - 3 * DAY], now)).toBe(0)
  })

  it('ranks fault categories from the last 30 days', () => {
    const f = (category: string) => ({ title: 't', category, severity: 'minor' as const, advice: '' })
    const runs = [run(1, 2, { faults: [f('Mirrors'), f('Signals')] }), run(2, 2, { faults: [f('Mirrors')] }), run(3, 2, { date: Date.now() - 40 * DAY, faults: [f('Old')] })]
    expect(faultsByCategory(runs)).toEqual([
      { category: 'Mirrors', n: 2 },
      { category: 'Signals', n: 1 },
    ])
  })

  it('says "Not ready yet" for a brand-new learner and points at the next lesson', () => {
    const r = readiness({ stats: {}, mocks: [], hazards: [], runs: [], logbook: [] })
    expect(r.verdict).toBe('Not ready yet')
    expect(r.total).toBe(0)
    expect(r.parts.find((p) => p.key === 'drive')?.to).toBe('/drive/1')
    expect(r.steps.length).toBeGreaterThan(0)
  })
})
