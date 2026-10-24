import { clamp } from '../../lib/random'
import { DriveEngine, MPH } from './engine'
import type { DemoDo, DriveInput, ViewState } from './types'

/**
 * A scripted driver that follows a scenario's demo plan: speed targets, stops at give-way lines,
 * mirror and shoulder checks, signals. It powers the video helpers and the tests that prove every
 * lesson can be driven cleanly with the keyboard-style controls.
 */
export class DemoDriver {
  private startedAt = -1
  private fired = new Set<number>()
  private released = new Set<number>()
  private queue: DemoDo[] = []
  private pauseUntil = 0

  constructor(private e: DriveEngine) {}

  private speedTarget(s: number) {
    const pts = this.e.sc.demo.speed
    if (s <= pts[0][0]) return pts[0][1]
    for (let i = 0; i < pts.length - 1; i++) {
      const [sa, va] = pts[i]
      const [sb, vb] = pts[i + 1]
      if (s <= sb) return va + ((vb - va) * (s - sa)) / (sb - sa)
    }
    return pts[pts.length - 1][1]
  }

  next(): DriveInput {
    const e = this.e
    const c = e.ctx
    const plan = e.sc.demo
    const input: DriveInput = { throttle: 0, brake: 0, steer: 0 }
    const ready = plan.waitFor ? plan.waitFor(c) : true
    if (this.startedAt < 0 && ready) this.startedAt = e.t
    if (this.startedAt < 0) return input

    // Timed and distance-triggered actions.
    plan.actions.forEach((a, i) => {
      if (this.fired.has(i)) return
      const due = a.delay !== undefined ? e.t >= this.startedAt + a.delay : e.s >= (a.s ?? 0)
      if (due) {
        this.fired.add(i)
        this.queue.push(a.do)
      }
    })

    // Holds (stop lines): brake to a stop, wait for the way to clear, then look and go.
    let target = this.speedTarget(e.s) * MPH
    plan.holds.forEach((h, i) => {
      if (this.released.has(i) || e.s > h.s + 1) return
      if (h.until(c)) {
        this.released.add(i)
        this.queue.push(...(h.then ?? []))
        this.pauseUntil = e.t + 1.4
        return
      }
      const d = h.s - e.s
      target = Math.min(target, d < 0.6 ? 0 : Math.sqrt(2 * 2.4 * (d - 0.6)))
    })

    if (e.t < this.startedAt + (plan.startDelay ?? 0) || e.t < this.pauseUntil) target = 0

    const err = target - e.car.v
    if (target < 0.3) input.brake = e.car.v > 0.02 || e.t >= this.startedAt + (plan.startDelay ?? 0) ? 1 : 0
    else if (err > 0.3) input.throttle = clamp(err * 0.45, 0.2, 1)
    else if (err < -0.6) input.brake = clamp(-err * 0.35, 0.12, 0.9)

    const ev = this.queue.shift()
    if (ev === 'mirror') input.mirror = true
    else if (ev === 'look-left') input.look = 'left'
    else if (ev === 'look-right') input.look = 'right'
    else if (ev === 'left') input.indicate = 'left'
    else if (ev === 'right') input.indicate = 'right'
    else if (ev === 'signal-off') input.indicate = 'off'
    return input
  }
}

/** Run the demo driver to the end and record frames for replay. */
export function recordDemo(engine: DriveEngine, maxSeconds = 180, fps = 20) {
  const bot = new DemoDriver(engine)
  const frames: ViewState[] = []
  const marks: { t: number; s: number }[] = []
  const dt = 1 / fps
  let n = 0
  while (!engine.done && engine.t < maxSeconds) {
    engine.advance(dt, bot.next())
    frames.push(engine.view())
    if (n++ % fps === 0) marks.push({ t: engine.t, s: engine.s })
  }
  return { frames, marks, outcome: engine.outcome() }
}
