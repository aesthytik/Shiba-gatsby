import { recordDemo } from '../drive/bot'
import { DriveEngine } from '../drive/engine'
import { buildScenario, LESSONS } from '../drive/lessons'
import type { ViewState } from '../drive/types'

export type At =
  | 'start'
  | { s: number }
  | { event: 'mirror' | 'signal' | 'look' | 'stop' | 'go'; nth?: number }
  | { light: 'amber' | 'red' | 'redamber' }

export interface Chapter {
  title: string
  caption: string
  at: At
}

export interface VideoDef {
  id: string
  title: string
  blurb: string
  hc: string
  remember: string[]
  chapters: Chapter[]
}

export const VIDEOS: VideoDef[] = [
  {
    id: 'move-off',
    title: 'Moving off safely',
    blurb: 'Pulling away from the kerb needs three checks: mirror, signal and a look over your shoulder. Then go, only when it is clear.',
    hc: 'Highway Code rule 159',
    remember: ['Mirrors first, then signal', 'Look over your right shoulder', 'Wait for traffic to pass', 'Cancel your signal after moving off'],
    chapters: [
      { title: 'Wait for the car to pass', caption: 'A car is coming up behind. Wait at the kerb until it has passed.', at: 'start' },
      { title: 'Check your mirrors', caption: 'Check your interior mirror and door mirror first.', at: { event: 'mirror' } },
      { title: 'Signal right', caption: 'Signal right. Other drivers need to know you are about to pull out.', at: { event: 'signal' } },
      { title: 'Look over your shoulder', caption: 'Look over your right shoulder: the blind spot your mirrors cannot see.', at: { event: 'look' } },
      { title: 'Move off', caption: 'Only when it is clear, move off smoothly and cancel your signal.', at: { event: 'go' } },
    ],
  },
  {
    id: 'speed-limits',
    title: 'Speed limits and the 20 zone',
    blurb: 'The limit is a maximum, not a target. Look for the signs, check your mirror, and slow down before the zone starts.',
    hc: 'Highway Code rule 124',
    remember: ['Look out for speed limit signs', 'Mirror, then slow down', 'Be at the lower speed by the sign', 'Speed up only when the limit rises'],
    chapters: [
      { title: 'A 30 mph road', caption: 'On a road with street lights the limit is usually 30 mph unless signs say otherwise.', at: 'start' },
      { title: 'Mirror, then slow down', caption: 'A 20 mph zone is coming. Check your mirror, then ease off in good time.', at: { event: 'mirror' } },
      { title: 'The 20 mph zone', caption: 'You should be down to 20 mph by the sign. Keep checking your speedometer.', at: { s: 120 } },
      { title: 'Back to 30', caption: 'The limit rises. Now you can speed up again.', at: { s: 232 } },
    ],
  },
  {
    id: 'pull-up',
    title: 'Pulling up on the left',
    blurb: 'Signal left, check your mirror, slow smoothly and stop close to the kerb. Then check all round again before you move off.',
    hc: 'Highway Code rule 103',
    remember: ['Mirror, then signal left', 'Slow smoothly and steer in gently', 'Stop within about 30 cm of the kerb', 'Mirror, signal and look before moving off'],
    chapters: [
      { title: 'Check your mirror', caption: 'Before slowing down, check your mirror.', at: { event: 'mirror' } },
      { title: 'Signal left', caption: 'Signal left in good time so others know your plan.', at: { event: 'signal' } },
      { title: 'Stop in the bay', caption: 'Slow smoothly and stop close to the kerb, inside the marked bay.', at: { event: 'stop' } },
      { title: 'Let the car pass', caption: 'A car overtakes. Wait until it has gone before you pull out.', at: { event: 'look', nth: 1 } },
      { title: 'Move off again', caption: 'Mirror, signal right and look over your shoulder. Then go.', at: { event: 'go', nth: 2 } },
    ],
  },
  {
    id: 't-left',
    title: 'Turning left at a T-junction',
    blurb: 'At a give-way line you stop if you need to, look right, and only join the main road when there is a safe gap.',
    hc: 'Highway Code rule 170',
    remember: ['Mirror, signal left, slow down', 'Stop at the line if needed', 'Look right, then left, then right', 'Go only when there is a safe gap'],
    chapters: [
      { title: 'Mirror, then slow down', caption: 'Check your mirror, then slow down well before the junction.', at: { event: 'mirror' } },
      { title: 'Signal left', caption: 'Signal left in good time.', at: { event: 'signal' } },
      { title: 'Stop at the line', caption: 'Cars are coming from the right. Stop at the give-way line.', at: { event: 'stop' } },
      { title: 'Look right', caption: 'Look right again as the last car goes past.', at: { event: 'look' } },
      { title: 'Turn left', caption: 'There is a safe gap. Turn left and settle into your lane.', at: { event: 'go', nth: 2 } },
    ],
  },
  {
    id: 't-right',
    title: 'Turning right at a T-junction',
    blurb: 'Turning right you cross one lane and join the other, so you give way to traffic from both directions.',
    hc: 'Highway Code rule 170',
    remember: ['Mirror, signal right, slow down', 'Give way to traffic from both sides', 'Look right, left, then right again', 'Turn into the left-hand lane of the new road'],
    chapters: [
      { title: 'Mirror, then slow down', caption: 'Check your mirror and slow down for the junction.', at: { event: 'mirror' } },
      { title: 'Signal right', caption: 'Signal right early so drivers behind you understand.', at: { event: 'signal' } },
      { title: 'Stop at the line', caption: 'Cars are coming from both sides. Stop at the line.', at: { event: 'stop' } },
      { title: 'Look both ways', caption: 'Look right, left, then right again before you go.', at: { event: 'look' } },
      { title: 'Turn right', caption: 'Both lanes are clear. Turn right and settle in lane.', at: { event: 'go', nth: 2 } },
    ],
  },
  {
    id: 'rbt-1',
    title: 'Mini-roundabout: turning left',
    blurb: 'For the first exit, signal left on the approach, give way to traffic from the right, and keep left.',
    hc: 'Highway Code rule 186',
    remember: ['Signal left on the approach', 'Give way to the right', 'Keep left as you go round'],
    chapters: [
      { title: 'Mirror, then slow down', caption: 'Check your mirror as you approach.', at: { event: 'mirror' } },
      { title: 'Signal left', caption: 'Taking the first exit, so signal left in good time.', at: { event: 'signal' } },
      { title: 'Give way to the right', caption: 'Traffic is already on the roundabout from your right. Give way.', at: { event: 'stop' } },
      { title: 'Turn left', caption: 'When it is clear, go left onto the exit.', at: { event: 'go', nth: 2 } },
    ],
  },
  {
    id: 'rbt-2',
    title: 'Mini-roundabouts',
    blurb: 'A mini-roundabout follows the same rules as a big one. Look right as you approach, give way to traffic from the right, and go round the painted circle, not over it.',
    hc: 'Highway Code rule 188',
    remember: ['Mirrors, then slow down', 'Give way to the right', 'Go round the circle, do not cut across it', 'Signal left after the exit before yours'],
    chapters: [
      { title: 'Approach and look right', caption: 'Check your mirror, slow down, and look right as you approach.', at: { event: 'mirror' } },
      { title: 'Give way to the right', caption: 'A car is on the roundabout, coming from your right. It goes first. Wait at the line.', at: { event: 'stop' } },
      { title: 'Go round the circle', caption: 'When it is clear, go round the painted circle, not over it.', at: { event: 'go', nth: 2 } },
      { title: 'Signal and exit', caption: 'Signal left to leave by the second exit.', at: { event: 'signal' } },
    ],
  },
  {
    id: 'rbt-3',
    title: 'Mini-roundabout: turning right',
    blurb: 'For the third exit, signal right on the approach, go clockwise round the circle, and signal left after the exit before yours.',
    hc: 'Highway Code rule 186',
    remember: ['Signal right on the approach', 'Go clockwise round the circle', 'Switch to a left signal after the second exit'],
    chapters: [
      { title: 'Mirror, then slow down', caption: 'Check your mirror as you approach.', at: { event: 'mirror' } },
      { title: 'Signal right', caption: 'Taking the third exit, so signal right.', at: { event: 'signal' } },
      { title: 'Give way to the right', caption: 'Wait at the line for the traffic on the roundabout.', at: { event: 'stop' } },
      { title: 'Go round clockwise', caption: 'Go clockwise round the circle, keeping close to it.', at: { event: 'go', nth: 2 } },
      { title: 'Signal left to leave', caption: 'After the second exit, change to a left signal and leave.', at: { event: 'signal', nth: 2 } },
    ],
  },
  {
    id: 'zebra',
    title: 'Zebra crossings',
    blurb: 'Slow down as you approach. Give way to anyone on the crossing and anyone waiting to cross. Wait until it is completely clear.',
    hc: 'Highway Code rule 195',
    remember: ['Slow down early', 'Stop at the line for people waiting or crossing', 'Wait until the crossing is clear', 'Never overtake near a crossing'],
    chapters: [
      { title: 'Mirror, then slow down', caption: 'A zebra crossing is ahead. Check your mirror and slow down.', at: { event: 'mirror' } },
      { title: 'Stop at the line', caption: 'Someone is crossing. Stop at the line and wait.', at: { event: 'stop' } },
      { title: 'Check it is clear', caption: 'Look both ways. Wait until the pedestrian is safely across.', at: { event: 'look' } },
      { title: 'Move off', caption: 'The crossing is clear. Move off.', at: { event: 'go', nth: 2 } },
    ],
  },
  {
    id: 'lights',
    title: 'Traffic lights',
    blurb: 'Stop at the line on red. Amber means stop unless you are too close to stop safely. Wait for green.',
    hc: 'Highway Code rule 109',
    remember: ['Red: stop at the line', 'Amber: stop unless you are too close', 'Red and amber: still wait', 'Green: go if the way is clear'],
    chapters: [
      { title: 'Mirror, then slow down', caption: 'Approaching traffic lights, check your mirror and ease off.', at: { event: 'mirror' } },
      { title: 'Amber: be ready to stop', caption: 'Amber means stop, unless you are too close to stop safely.', at: { light: 'amber' } },
      { title: 'Red: stop at the line', caption: 'Red. Stop behind the line. Cross traffic is moving.', at: { light: 'red' } },
      { title: 'Red and amber', caption: 'Red and amber together still means wait.', at: { light: 'redamber' } },
      { title: 'Green: go', caption: 'Green. Check it is clear and move off.', at: { event: 'go', nth: 2 } },
    ],
  },
]

export const videoById = (id: string | undefined) => VIDEOS.find((v) => v.id === id)

/** The drive lesson that practises a video's topic. */
export const lessonForVideo = (id: string) => LESSONS.find((l) => l.video === id)

export interface Replay {
  frames: ViewState[]
  fps: number
  duration: number
  /** Start time in seconds of each chapter. */
  chapterTimes: number[]
}

const cache = new Map<string, Replay>()

function risingEdges(frames: ViewState[], on: (f: ViewState, i: number) => boolean) {
  const out: number[] = []
  let prev = false
  frames.forEach((f, i) => {
    const now = on(f, i)
    if (now && !prev) out.push(f.t)
    prev = now
  })
  return out
}

/** Record the demo driver once per video and work out when each chapter begins. */
export function buildReplay(def: VideoDef): Replay {
  const hit = cache.get(def.id)
  if (hit) return hit
  const lesson = lessonForVideo(def.id)
  const engine = new DriveEngine(buildScenario(lesson?.scenario ?? def.id), { assist: true })
  const fps = 20
  const { frames: all } = recordDemo(engine, 180, fps)
  const frames = all
  let moving = false
  const departures: number[] = []
  let still = true
  frames.forEach((f) => {
    if (f.car.v < 0.1) still = true
    else if (still && f.car.v > 0.4) {
      departures.push(f.t)
      still = false
    }
  })
  const events = {
    mirror: risingEdges(frames, (f) => f.mirror),
    // Every time an indicator is switched on or changed over (left to right, say).
    signal: frames.flatMap((f, i) => (f.car.signal !== null && f.car.signal !== frames[i - 1]?.car.signal ? [f.t] : [])),
    look: risingEdges(frames, (f) => !f.mirror && Math.abs(f.glance) > 0.2),
    stop: risingEdges(frames, (f) => {
      if (f.car.v > 1) moving = true
      return moving && f.car.v < 0.1
    }),
    // Each departure from rest; the first is the start of the lesson.
    go: departures,
  }
  const lightAt = (state: string) => frames.find((f) => f.lights.L1 === state)?.t
  const times = def.chapters.map((c) => {
    const at = c.at
    if (at === 'start') return 0
    if ('s' in at) return frames.find((f) => f.s >= at.s)?.t ?? 0
    if ('light' in at) return lightAt(at.light) ?? 0
    const list = events[at.event]
    return list[(at.nth ?? 1) - 1] ?? 0
  })
  // Chapters run in order; any that detection placed early are nudged forward.
  for (let i = 1; i < times.length; i++) if (times[i] < times[i - 1]) times[i] = times[i - 1]
  // Trim the long drive-up before the first chapter and the drive-away after the last.
  const from = Math.max(0, times[0] - 2.5)
  const to = Math.min(all[all.length - 1].t, times[times.length - 1] + 9)
  const clip = all.filter((f) => f.t >= from - 1e-6 && f.t <= to + 1e-6)
  const origin = clip[0].t
  const chapterTimes = times.map((t, i) => (i === 0 ? 0 : t - origin))
  const duration = clip[clip.length - 1].t - origin
  const replay = { frames: clip, fps, duration, chapterTimes }
  cache.set(def.id, replay)
  return replay
}

/** Interpolated view at time t. */
export function frameAt(r: Replay, t: number): ViewState {
  const x = Math.max(0, Math.min(r.frames.length - 1, t * r.fps))
  const i = Math.floor(x)
  const a = r.frames[i]
  const b = r.frames[Math.min(r.frames.length - 1, i + 1)]
  const f = x - i
  const lerp = (p: number, q: number) => p + (q - p) * f
  const ang = (p: number, q: number) => p + Math.atan2(Math.sin(q - p), Math.cos(q - p)) * f
  return {
    ...a,
    t: lerp(a.t, b.t),
    s: lerp(a.s, b.s),
    car: { ...a.car, x: lerp(a.car.x, b.car.x), z: lerp(a.car.z, b.car.z), h: ang(a.car.h, b.car.h), v: lerp(a.car.v, b.car.v), steer: lerp(a.car.steer, b.car.steer) },
    npcs: a.npcs.map((n, k) => {
      const m = b.npcs[k]
      return n.visible && m.visible ? { ...n, x: lerp(n.x, m.x), z: lerp(n.z, m.z), h: ang(n.h, m.h), v: lerp(n.v, m.v) } : n
    }),
    glance: lerp(a.glance, b.glance),
  }
}
