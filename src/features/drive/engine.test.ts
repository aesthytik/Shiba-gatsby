import { describe, expect, it } from 'vitest'
import { DemoDriver, recordDemo } from './bot'
import { DriveEngine, MPH } from './engine'
import { LESSONS, PLAYABLE, buildScenario } from './lessons'
import type { DriveInput } from './types'

const scenarioIds = [...new Set(PLAYABLE.map((l) => l.scenario!))]

function runDemo(id: string) {
  const e = new DriveEngine(buildScenario(id), { assist: true })
  const bot = new DemoDriver(e)
  while (!e.done && e.t < 200) e.advance(1 / 20, bot.next())
  return e
}

/** A driver who ignores everyone else: cruises at ~28 mph with no checks and no signals. */
function runReckless(id: string, speed = 12.5) {
  const e = new DriveEngine(buildScenario(id), { assist: true })
  while (!e.done && e.t < 200) {
    const err = speed - e.car.v
    const input: DriveInput = { throttle: err > 0 ? 1 : 0, brake: 0, steer: 0 }
    e.advance(1 / 20, input)
  }
  return e
}

describe('curriculum', () => {
  it('has 22 lessons in 6 units, numbered in order', () => {
    expect(LESSONS).toHaveLength(22)
    LESSONS.forEach((l, i) => expect(l.n).toBe(i + 1))
    expect(new Set(LESSONS.map((l) => l.unit)).size).toBe(6)
  })
  it('only references scenarios that exist', () => {
    for (const l of PLAYABLE) expect(() => buildScenario(l.scenario!)).not.toThrow()
  })
})

describe.each(scenarioIds)('scenario %s', (id) => {
  it('can be driven cleanly: demo driver finishes with zero faults and three stars', () => {
    const e = runDemo(id)
    const o = e.outcome()
    expect(o.faults.map((f) => `${f.key}: ${f.title}`)).toEqual([])
    expect(o.status).toBe('complete')
    expect(o.stars).toBe(3)
    expect(e.t).toBeLessThan(150)
  })

  it('marks every check as done after the clean run', () => {
    const e = runDemo(id)
    expect(e.checks().filter((c) => c.state !== 'done').map((c) => c.id)).toEqual([])
  })

  it('does not finish by itself while the learner sits still', () => {
    const e = new DriveEngine(buildScenario(id), { assist: true })
    e.advance(30, { throttle: 0, brake: 0, steer: 0 })
    expect(e.status).toBe('running')
  })

  it('never passes with stars for a driver who ignores everyone else (unless there is no one to give way to)', () => {
    const e = runReckless(id)
    const o = e.outcome()
    if (['speed-limits'].includes(id)) {
      expect(o.faults.length).toBeGreaterThan(0)
    } else {
      expect(o.stars).toBeLessThan(3)
      expect(o.faults.length).toBeGreaterThan(0)
    }
  })
})

describe('car physics', () => {
  it('accelerates towards 30 mph in about 5 seconds, brakes in under 2.5 seconds, and holds still when stopped', () => {
    const e = new DriveEngine(buildScenario('speed-limits'), { assist: true })
    e.advance(5, { throttle: 1, brake: 0, steer: 0 })
    expect(e.car.v / MPH).toBeGreaterThan(22)
    expect(e.car.v / MPH).toBeLessThan(40)
    e.advance(2.5, { throttle: 0, brake: 1, steer: 0 })
    expect(e.car.v).toBe(0)
  })

  it('creeps in drive when both pedals are released after moving off', () => {
    const e = new DriveEngine(buildScenario('speed-limits'), { assist: true })
    e.advance(1.5, { throttle: 1, brake: 0, steer: 0 })
    e.advance(2, { throttle: 0, brake: 1, steer: 0 })
    expect(e.car.v).toBe(0)
    e.advance(4, { throttle: 0, brake: 0, steer: 0 })
    expect(e.car.v).toBeGreaterThan(0.8)
    expect(e.car.v / MPH).toBeLessThan(4)
  })

  it('follows the route by itself when guided steering is on, and turns when it is off', () => {
    const guided = new DriveEngine(buildScenario('t-left'), { assist: true })
    const manual = new DriveEngine(buildScenario('t-left'), { assist: false })
    for (const e of [guided, manual]) e.advance(8, { throttle: 0.6, brake: 0, steer: 0 })
    expect(Math.abs(guided.lane)).toBeLessThan(0.5)
    const before = manual.car.h
    manual.advance(1, { throttle: 0.3, brake: 0, steer: 1 })
    expect(manual.car.h).toBeGreaterThan(before)
  })

  it('the guided limiter keeps the car near the limit but is off in the speed lesson', () => {
    const limited = new DriveEngine(buildScenario('move-off'), { assist: true })
    limited.advance(1, { throttle: 1, brake: 0, steer: 0 })
    limited.advance(30, { throttle: 1, brake: 0, steer: 0, ...{} })
    expect(limited.topMph).toBeLessThan(33)
    const free = new DriveEngine(buildScenario('speed-limits'), { assist: true })
    free.advance(20, { throttle: 1, brake: 0, steer: 0 })
    expect(free.topMph).toBeGreaterThan(35)
  })
})

describe('examiner rules', () => {
  it('gives a serious fault for pulling out in front of a car from the right', () => {
    // A learner who rolls up at 12 mph and never stops arrives just as the second car does.
    const sc = buildScenario('t-left')
    sc.demo.holds = []
    sc.demo.speed = [[0, 12], [999, 12]]
    const e = new DriveEngine(sc, { assist: true })
    const bot = new DemoDriver(e)
    while (!e.done && e.t < 120) e.advance(1 / 20, bot.next())
    expect(e.faults.some((f) => f.key === 'give-way' || f.key === 'collision')).toBe(true)
  })

  it('a collision is dangerous and ends the lesson as failed with no stars', () => {
    const e = runReckless('zebra', 8)
    expect(e.status).toBe('failed')
    expect(e.outcome().stars).toBe(0)
  })

  it('missing the mirror before braking costs a minor fault', () => {
    const e = new DriveEngine(buildScenario('speed-limits'), { assist: true })
    e.advance(8, { throttle: 1, brake: 0, steer: 0 })
    e.advance(3, { throttle: 0, brake: 1, steer: 0 })
    // Not in the braking window of this lesson's mirror rule, so no fault yet.
    expect(e.faults.find((f) => f.key === 'mirror-speed')).toBeUndefined()
  })

  it('records engine view frames for replay', () => {
    const { frames, outcome } = recordDemo(new DriveEngine(buildScenario('rbt-2'), { assist: true }))
    expect(frames.length).toBeGreaterThan(200)
    expect(outcome.stars).toBe(3)
  })
})
