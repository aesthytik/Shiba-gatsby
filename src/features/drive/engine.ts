import { clamp } from '../../lib/random'
import { dirOf, makePath, offRoadDistance, pointAt, project, wrapAngle, type Path } from './geometry'
import type { Ctx, DriveInput, Fault, FaultInfo, LightState, NpcStatus, NpcView, Scenario, Signal, ViewState } from './types'

export const MPH = 0.44704
const WHEELBASE = 2.6
const SUBSTEP = 1 / 60
const GLANCE_MIRROR = 1.0
const GLANCE_LOOK = 0.9

interface NpcRt {
  def: Scenario['npcs'][number]
  path: Path
  active: boolean
  done: boolean
  s: number
  x: number
  z: number
  h: number
  v: number
  braking: boolean
}

export type Status = 'running' | 'complete' | 'failed'

export interface Outcome {
  status: Status
  stars: 0 | 1 | 2 | 3
  faults: Fault[]
  minors: number
  serious: number
  dangerous: number
  time: number
  topMph: number
  headline: string
}

const maxSteer = (v: number) => 0.6 - 0.46 * Math.min(1, v / 16)

/** Pure-pursuit steering angle that follows `path` from route distance `s`. */
export function pursuitSteer(car: { x: number; z: number; h: number; v: number }, path: Path, s: number) {
  const look = clamp(3.5 + 0.8 * car.v, 3.5, 13)
  const target = pointAt(path, Math.min(path.length, s + look))
  const dx = target.x - car.x
  const dz = target.z - car.z
  // Signed angle from the heading to the target: positive = target is to the left.
  const alpha = wrapAngle(Math.atan2(-dx, -dz) - car.h)
  return Math.atan2(2 * WHEELBASE * Math.sin(alpha), Math.max(2, Math.hypot(dx, dz)))
}

function dir(h: number) {
  return dirOf(h)
}

export class DriveEngine {
  readonly sc: Scenario
  readonly path: Path
  readonly assist: boolean
  t = 0
  car = { x: 0, z: 0, h: 0, v: 0 }
  steerAngle = 0
  throttleLevel = 0
  brakeLevel = 0
  parked: boolean
  signal: Signal = null
  signalSince = -Infinity
  private indHeading = 0
  private indTurned = false
  mirrorAt = -Infinity
  lookAt = { left: -Infinity, right: -Infinity }
  private glanceKind: 'mirror' | 'left' | 'right' | null = null
  private glanceUntil = -Infinity
  s = 0
  lane = 0
  status: Status = 'running'
  faults: Fault[] = []
  private faultKeys = new Set<string>()
  private checkDone = new Set<string>()
  lights: Record<string, LightState> = {}
  toastText: { text: string; until: number } | null = null
  topMph = 0
  private moveOffT = -1
  private wasStopped = true
  private movingSince = 0
  private failAt = -1
  private offRoadFor = 0
  private zoneNo = 0
  private zoneT = 0
  private overFor = 0
  private farOver = 0
  private laneDrift = 0
  mem: Ctx['mem'] = {}
  private npcs: NpcRt[]
  readonly ctx: Ctx
  /** Collision events, for the UI to react to. */
  collided = false

  constructor(sc: Scenario, opts: { assist?: boolean } = {}) {
    this.sc = sc
    this.assist = opts.assist ?? false
    this.path = makePath(sc.path)
    this.car = { x: sc.start.x, z: sc.start.z, h: sc.start.h, v: 0 }
    this.parked = sc.start.parked
    this.npcs = sc.npcs.map((def) => ({ def, path: makePath(def.path), active: false, done: false, s: 0, x: def.path[0].x, z: def.path[0].z, h: 0, v: 0, braking: false }))
    this.s = project(this.path, this.car).s
    this.ctx = this.makeCtx()
  }

  private makeCtx(): Ctx {
    const e = this
    return {
      get t() {
        return e.t
      },
      dt: SUBSTEP,
      get car() {
        return { x: e.car.x, z: e.car.z, h: e.car.h, v: e.car.v, mph: e.car.v / MPH, s: e.s }
      },
      get lane() {
        return e.lane
      },
      get brake() {
        return e.brakeLevel
      },
      get throttle() {
        return e.throttleLevel
      },
      get stopped() {
        return e.car.v < 0.15
      },
      get signal() {
        return e.signal
      },
      get signalAgo() {
        return e.signal ? e.t - e.signalSince : Infinity
      },
      get mirrorAgo() {
        return e.t - e.mirrorAt
      },
      get lookAgo() {
        return { left: e.t - e.lookAt.left, right: e.t - e.lookAt.right }
      },
      get movingFor() {
        return e.car.v < 0.15 ? 0 : e.t - e.movingSince
      },
      get sinceMoveOff() {
        return e.moveOffT < 0 ? -1 : e.t - e.moveOffT
      },
      npc: (id) => e.npcStatus(id),
      fault: (key, info) => e.addFault(key, info),
      hasFault: (key) => e.faultKeys.has(key),
      tick: (id) => {
        e.checkDone.add(id)
      },
      isDone: (id) => e.checkDone.has(id),
      toast: (text, seconds = 3.5) => {
        e.toastText = { text, until: e.t + seconds }
      },
      setLight: (id, state) => {
        e.lights[id] = state
      },
      mem: this.mem,
      routeS: (p) => project(e.path, p).s,
    }
  }

  private npcStatus(id: string): NpcStatus {
    const n = this.npcs.find((x) => x.def.id === id)
    if (!n) return { active: false, done: true, s: 0, x: 0, z: 0, v: 0 }
    return { active: n.active, done: n.done, s: n.s, x: n.x, z: n.z, v: n.v }
  }

  addFault(key: string, info: FaultInfo) {
    if (this.faultKeys.has(key)) return
    this.faultKeys.add(key)
    this.faults.push({ ...info, key, t: this.t, x: this.car.x, z: this.car.z })
    if (info.severity === 'dangerous' && this.failAt < 0) this.failAt = this.t + 1.4
  }

  get glance() {
    if (this.t > this.glanceUntil) return 0
    if (this.glanceKind === 'left') return 1.25
    if (this.glanceKind === 'right') return -1.25
    return 0
  }

  get mirrorActive() {
    return this.t <= this.glanceUntil && this.glanceKind === 'mirror'
  }

  get done() {
    return this.status !== 'running'
  }

  /** Advance by `dt` seconds in fixed sub-steps. One-off events in `input` apply to the first sub-step only. */
  advance(dt: number, input: DriveInput) {
    let left = dt
    let first = true
    while (left > 1e-9 && !this.done) {
      const h = Math.min(SUBSTEP, left)
      this.step(h, first ? input : { ...input, indicate: undefined, mirror: false, look: undefined })
      first = false
      left -= h
    }
  }

  private step(dt: number, input: DriveInput) {
    this.t += dt
    // Events
    if (input.indicate) this.setIndicator(input.indicate)
    if (input.mirror) {
      this.mirrorAt = this.t
      this.glanceKind = 'mirror'
      this.glanceUntil = this.t + GLANCE_MIRROR
    }
    if (input.look) {
      this.lookAt[input.look] = this.t
      this.glanceKind = input.look
      this.glanceUntil = this.t + GLANCE_LOOK
    }

    // Pedals: the keyboard is digital, so ramp the levels like a foot would.
    const rate = (cur: number, target: number, up: number, down: number) => (target > cur ? Math.min(target, cur + up * dt) : Math.max(target, cur - down * dt))
    let thrTarget = clamp(input.throttle, 0, 1)
    const mph = this.car.v / MPH
    if (this.assist && !this.sc.noLimiter) {
      const lim = this.limitAt(this.s)
      if (mph >= lim - 0.5) thrTarget = Math.min(thrTarget, 0.12)
    }
    this.throttleLevel = rate(this.throttleLevel, thrTarget, 1.6, 5)
    this.brakeLevel = rate(this.brakeLevel, clamp(input.brake, 0, 1), 3.2, 8)

    // Steering
    const lim = maxSteer(this.car.v)
    let target: number
    let steerRate = 1.7
    if (this.assist && Math.abs(input.steer) < 0.05) {
      target = clamp(pursuitSteer(this.car, this.path, this.s), -lim, lim)
      steerRate = 2.6
    } else {
      target = clamp(input.steer, -1, 1) * lim
      if (Math.abs(input.steer) < 0.05) steerRate = 3.2
    }
    const dSteer = target - this.steerAngle
    this.steerAngle += clamp(dSteer, -steerRate * dt, steerRate * dt)
    if (Math.abs(this.steerAngle) > lim) this.steerAngle = Math.sign(this.steerAngle) * lim

    // Speed
    const v = this.car.v
    if (this.parked && this.throttleLevel > 0.05) this.parked = false
    let a = 0
    if (!this.parked) {
      a += this.throttleLevel * 3.4 * Math.max(0, 1 - v / 20)
      if (this.throttleLevel < 0.05 && this.brakeLevel < 0.05 && v < 1.5) a += 0.9
      a -= 0.25 + 0.0016 * v * v
    }
    if (this.brakeLevel > 0) a -= this.brakeLevel * 8
    const off = offRoadDistance(this.car, this.sc.roads, this.sc.discs)
    if (off > 0.5 && v > 0) a -= 2.5
    let nv = Math.max(0, v + a * dt)
    if (this.brakeLevel > 0.15 && nv < 0.12) nv = 0
    if (this.parked) nv = 0
    this.car.v = nv

    // Position (bicycle model)
    const ds = (v + nv) * 0.5 * dt
    this.car.h += (ds / WHEELBASE) * Math.tan(this.steerAngle)
    const d = dir(this.car.h)
    this.car.x += d.x * ds
    this.car.z += d.z * ds
    this.topMph = Math.max(this.topMph, nv / MPH)

    // Indicator self-cancel after a turn, like a real stalk.
    if (this.signal) {
      if (Math.abs(wrapAngle(this.car.h - this.indHeading)) > 0.9) this.indTurned = true
      if (this.indTurned && Math.abs(this.steerAngle) < 0.04) this.setIndicator('off')
    }

    // Route progress
    const p = project(this.path, this.car, Math.max(0, this.s - 6), this.s + 30)
    this.s = Math.max(this.s, p.s)
    this.lane = p.d
    if (this.car.v > 0.3 && this.moveOffT < 0) this.moveOffT = this.t
    const stoppedNow = this.car.v < 0.15
    if (this.wasStopped && !stoppedNow) this.movingSince = this.t
    this.wasStopped = stoppedNow

    this.stepNpcs(dt)
    this.collisions()
    this.standardRules(off, dt)
    this.sc.rules(this.ctx)

    if (this.toastText && this.t > this.toastText.until) this.toastText = null
    if (this.failAt >= 0 && this.t >= this.failAt) this.status = 'failed'
    else if (this.status === 'running' && this.s >= this.sc.finishS) this.status = 'complete'
  }

  private setIndicator(kind: 'left' | 'right' | 'off') {
    const next: Signal = kind === 'off' ? null : this.signal === kind ? null : kind
    if (next !== this.signal) {
      this.signal = next
      this.signalSince = next ? this.t : -Infinity
      this.indHeading = this.car.h
      this.indTurned = false
    }
  }

  limitAt(s: number) {
    let mph = this.sc.limits[0]?.mph ?? 30
    for (const z of this.sc.limits) if (s >= z.fromS) mph = z.mph
    return mph
  }

  private stepNpcs(dt: number) {
    for (const n of this.npcs) {
      if (!n.active && !n.done && n.def.trigger(this.ctx)) n.active = true
      if (!n.active || n.done) {
        n.v = 0
        continue
      }
      n.s += n.def.speed * dt
      n.v = n.def.speed
      if (n.s >= n.path.length) {
        n.s = n.path.length
        n.done = true
        n.v = 0
      }
      const p = pointAt(n.path, n.s)
      n.x = p.x
      n.z = p.z
      n.h = p.h
    }
  }

  private bodies(x: number, z: number, h: number, kind: 'car' | 'person' | 'cyclist') {
    if (kind === 'person') return [{ x, z, r: 0.45 }]
    const d = dir(h)
    const off = kind === 'car' ? 1.1 : 0.7
    const r = kind === 'car' ? 1.0 : 0.5
    return [
      { x: x + d.x * off, z: z + d.z * off, r },
      { x: x - d.x * off, z: z - d.z * off, r },
    ]
  }

  private collisions() {
    if (this.collided) return
    const mine = this.bodies(this.car.x, this.car.z, this.car.h, 'car')
    for (const n of this.npcs) {
      if (!n.active || n.done) continue
      for (const b of this.bodies(n.x, n.z, n.h, n.def.kind)) {
        for (const m of mine) {
          if (Math.hypot(b.x - m.x, b.z - m.z) < b.r + m.r) {
            this.collided = true
            this.car.v = 0
            n.active = false
            n.done = true
            this.addFault('collision', {
              category: 'Awareness and planning',
              title: n.def.kind === 'person' ? 'You hit a pedestrian' : 'You collided with another road user',
              advice: 'Slow down and stop in good time whenever someone else has priority. If in doubt, wait.',
              severity: 'dangerous',
            })
            return
          }
        }
      }
    }
  }

  private standardRules(off: number, dt: number) {
    // Kerb and verge
    if (off > 0.4) {
      this.addFault('kerb', {
        category: 'Control – steering',
        title: 'You hit or mounted the kerb',
        advice: 'Look well ahead to where you want to go, not at the kerb, and start turning earlier.',
        severity: 'minor',
      })
    }
    this.offRoadFor = off > 5 ? this.offRoadFor + dt : 0
    if (this.offRoadFor > 2.5) {
      this.addFault('off-road', {
        category: 'Control – steering',
        title: 'You left the road',
        advice: 'Stay on the carriageway, in your lane.',
        severity: 'dangerous',
      })
    }

    // Speed limit
    const lim = this.limitAt(this.s)
    const over = this.car.v / MPH - lim
    const zone = this.sc.limits.filter((z) => this.s >= z.fromS).length
    if (zone !== this.zoneNo) {
      this.zoneNo = zone
      this.zoneT = this.t
    }
    // A few seconds' grace after the limit drops, to brake in.
    const grace = this.t - this.zoneT < 3.5
    this.overFor = over > 3 && !grace ? this.overFor + dt : 0
    this.farOver = over > 8 && !grace ? this.farOver + dt : 0
    if (this.overFor > 2.5) {
      this.addFault(`speed-${zone}`, {
        category: 'Use of speed',
        title: `Over the ${lim} mph limit`,
        advice: `Keep to ${lim} mph or less. The limit is a maximum, not a target. Ease off when the speed limit signs change.`,
        severity: 'minor',
        hc: 'Rule 124',
      })
    }
    if (this.farOver > 1.5) {
      this.addFault(`speed-serious-${zone}`, {
        category: 'Use of speed',
        title: `Well over the ${lim} mph limit`,
        advice: `You were more than 8 mph over. Look for speed limit signs and check your speedometer often.`,
        severity: 'serious',
        hc: 'Rule 124',
      })
    }

    // Lane position
    if (!this.mem.freeLane) {
      this.laneDrift = Math.abs(this.lane) > 3.1 && this.car.v > 1 ? this.laneDrift + dt : 0
      if (this.laneDrift > 1.5) {
        this.addFault('lane', {
          category: 'Positioning – normal driving',
          title: 'You drifted out of position',
          advice: 'Keep to the left, about a car-width from the kerb, and use your lane markings.',
          severity: 'minor',
          hc: 'Rule 160',
        })
      }
    }
  }

  checks() {
    const done = this.sc.checks.map((c) => this.checkDone.has(c.id))
    const now = done.indexOf(false)
    return this.sc.checks.map((c, i) => ({ ...c, state: done[i] ? ('done' as const) : i === now ? ('now' as const) : ('later' as const) }))
  }

  nextWaypoint() {
    return this.sc.waypoints.find((w) => w.s > this.s - 2) ?? this.sc.waypoints[this.sc.waypoints.length - 1]
  }

  view(): ViewState {
    return {
      t: this.t,
      s: this.s,
      car: { x: this.car.x, z: this.car.z, h: this.car.h, v: this.car.v, steer: this.steerAngle, signal: this.signal, braking: this.brakeLevel > 0.12 || this.car.v < 0.1 },
      npcs: this.npcs.map(
        (n): NpcView => ({ id: n.def.id, kind: n.def.kind, color: n.def.color, x: n.x, z: n.z, h: n.h, v: n.v, visible: ((n.active || !!n.def.visibleBefore) && !n.done) || (n.done && !!n.def.lingers), braking: false }),
      ),
      lights: { ...this.lights },
      glance: this.glance,
      mirror: this.mirrorActive,
    }
  }

  outcome(): Outcome {
    const minors = this.faults.filter((f) => f.severity === 'minor').length
    const serious = this.faults.filter((f) => f.severity === 'serious').length
    const dangerous = this.faults.filter((f) => f.severity === 'dangerous').length
    let stars: Outcome['stars'] = 0
    let headline = 'Not this time'
    if (this.status === 'complete' && !dangerous) {
      if (serious) {
        stars = 1
        headline = 'You got there, with a serious fault'
      } else if (minors >= 3) {
        stars = 1
        headline = 'Passed, but a few things to tidy up'
      } else if (minors) {
        stars = 2
        headline = 'Nicely done!'
      } else {
        stars = 3
        headline = 'Textbook drive!'
      }
    } else if (dangerous) headline = 'That would have ended a real test'
    return { status: this.status, stars, faults: this.faults, minors, serious, dangerous, time: this.t, topMph: this.topMph, headline }
  }
}
