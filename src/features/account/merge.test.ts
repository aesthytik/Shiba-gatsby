import { describe, expect, it } from 'vitest'
import type { DriveRun } from '../../store/progress'
import { mergeSnapshots, type Snapshot } from './merge'

const empty = (): Snapshot => ({
  questionStats: {},
  mockResults: [],
  hazardResults: [],
  checklist: {},
  showMeTellMe: {},
  mockDrives: [],
  routesDriven: {},
  driveRuns: [],
  logbook: [],
  skillLevels: {},
  watched: {},
  settings: { voice: true, assist: true },
})

const run = (id: string, date: number): DriveRun => ({ id, n: 1, date, stars: 2, status: 'complete', minors: 1, serious: 0, dangerous: 0, seconds: 60, topMph: 20, headline: '', faults: [] })

describe('mergeSnapshots', () => {
  it('keeps everything from both sides, without duplicates, newest first', () => {
    const local = { ...empty(), driveRuns: [run('a', 300), run('b', 100)] }
    const remote = { ...empty(), driveRuns: [run('b', 100), run('c', 200)] }
    expect(mergeSnapshots(local, remote).driveRuns.map((r) => r.id)).toEqual(['a', 'c', 'b'])
  })

  it('keeps the most recently seen stat for each question', () => {
    const stat = (lastSeen: number, box: number) => ({ seen: 1, correct: 1, lastCorrect: true, box, lastSeen })
    const local = { ...empty(), questionStats: { q1: stat(10, 1), q2: stat(50, 3) } }
    const remote = { ...empty(), questionStats: { q1: stat(20, 4), q2: stat(5, 0), q3: stat(7, 2) } }
    const m = mergeSnapshots(local, remote).questionStats
    expect(m.q1.box).toBe(4)
    expect(m.q2.box).toBe(3)
    expect(m.q3.box).toBe(2)
  })

  it('takes the larger skill level and the later watched time, and ORs the checklist', () => {
    const local = { ...empty(), skillLevels: { a: 3, b: 1 }, watched: { v: 5 }, checklist: { x: true, y: false } }
    const remote = { ...empty(), skillLevels: { a: 2, b: 4, c: 1 }, watched: { v: 9 }, checklist: { y: true } }
    const m = mergeSnapshots(local, remote)
    expect(m.skillLevels).toEqual({ a: 3, b: 4, c: 1 })
    expect(m.watched.v).toBe(9)
    expect(m.checklist).toEqual({ x: true, y: true })
  })

  it('local settings win, but remote fills gaps such as the test date', () => {
    const local = { ...empty(), settings: { voice: false, assist: true } }
    const remote = { ...empty(), settings: { voice: true, testDate: '2026-12-04', testCentre: 'Southend' } }
    expect(mergeSnapshots(local, remote).settings).toEqual({ voice: false, assist: true, testDate: '2026-12-04', testCentre: 'Southend' })
  })

  it('treats empty, missing or damaged remote data as nothing to merge', () => {
    const local = { ...empty(), driveRuns: [run('a', 1)], skillLevels: { a: 2 } }
    for (const bad of [null, undefined, 42, 'x', [], {}, { driveRuns: 'nope', skillLevels: [1], settings: 7 }]) {
      const m = mergeSnapshots(local, bad)
      expect(m.driveRuns).toHaveLength(1)
      expect(m.skillLevels).toEqual({ a: 2 })
    }
  })

  it('is stable: merging the result with itself changes nothing', () => {
    const local = { ...empty(), driveRuns: [run('a', 2), run('b', 1)], watched: { v: 3 } }
    const once = mergeSnapshots(local, empty())
    expect(mergeSnapshots(once, once)).toEqual(once)
  })
})
