import { buildT, buildR } from './registry-internal'
import { moveOff, pullUp, speedLimits } from './scenarios'
import { trafficLights, zebra } from './scenarios-junctions'
import type { Scenario } from './types'

export interface Lesson {
  n: number
  unit: number
  title: string
  /** One-line summary shown on the lesson path. */
  sub: string
  /** Scenario id, when the lesson is playable. */
  scenario?: string
  rule?: string
  hc?: string
  route?: string
  /** What the learner will meet. */
  happens?: string[]
  /** DVSA marking categories this lesson is scored on. */
  marked?: string[]
  /** Video helper id. */
  video?: string
}

export interface Unit {
  n: number
  title: string
}

export const UNITS: Unit[] = [
  { n: 1, title: 'Basics' },
  { n: 2, title: 'Junctions' },
  { n: 3, title: 'Roundabouts' },
  { n: 4, title: 'Crossings and traffic lights' },
  { n: 5, title: 'Sharing the road' },
  { n: 6, title: 'Test skills and mock test' },
]

const wait = ['Mirrors', 'Signals', 'Junctions', 'Positioning']

export const LESSONS: Lesson[] = [
  {
    n: 1,
    unit: 1,
    title: 'Moving off safely',
    sub: 'Mirror, signal, shoulder, go',
    scenario: 'move-off',
    video: 'move-off',
    rule: 'Before you move off, check your mirrors, signal if it helps anyone, then look over your right shoulder for a final check. Move off only when it is safe.',
    hc: 'Highway Code rule 159',
    route: 'Move off from the kerb and drive on at up to 30 mph',
    happens: ['Cars pass close behind you while you wait at the kerb.', 'Let them pass, then check mirror, signal right and look over your shoulder.'],
    marked: ['Mirrors', 'Signals', 'Move off'],
  },
  {
    n: 2,
    unit: 1,
    title: 'Speed limits',
    sub: 'Know the limit, keep to it',
    scenario: 'speed-limits',
    video: 'speed-limits',
    rule: 'The speed limit is the most you may drive, not a target. Look for signs, slow down in good time, and check your speedometer.',
    hc: 'Highway Code rule 124',
    route: 'Drive 30, then 20, then 30 mph again',
    happens: ['A 20 mph zone starts part-way along the road.', 'The guided speed limiter is off for this lesson, so the speed is up to you.'],
    marked: ['Use of speed', 'Mirrors'],
  },
  {
    n: 3,
    unit: 1,
    title: 'Pulling up on the left',
    sub: 'Stop in a bay, then move off again',
    scenario: 'pull-up',
    video: 'pull-up',
    rule: 'Signal left in good time, check your mirror, slow smoothly and stop close to the kerb. Then check all round again before you move off.',
    hc: 'Highway Code rule 103',
    route: 'Pull up in the marked bay, then move off and drive on',
    happens: ['A marked bay is on your left.', 'A car overtakes after you stop. Wait for it before you pull out.'],
    marked: ['Signals', 'Mirrors', 'Control', 'Move off'],
  },
  {
    n: 4,
    unit: 2,
    title: 'Turning left at a junction',
    sub: 'Give way to traffic from the right',
    scenario: 't-left',
    video: 't-left',
    rule: 'At a give-way line, stop if you need to, look right, and only join the main road when there is a safe gap.',
    hc: 'Highway Code rule 170',
    route: 'Turn left at the T-junction',
    happens: ['Cars come from your right in quick succession.', 'Wait for a safe gap, then turn left and settle in your lane.'],
    marked: wait,
  },
  {
    n: 5,
    unit: 2,
    title: 'Turning right at a junction',
    sub: 'Cross one lane, join the other',
    scenario: 't-right',
    video: 't-right',
    rule: 'Turning right, you give way to traffic from both directions. Look right, left, then right again before you go.',
    hc: 'Highway Code rule 170',
    route: 'Turn right at the T-junction',
    happens: ['Cars come from your right and your left.', 'Go only when both lanes are clear for long enough.'],
    marked: wait,
  },
  { n: 6, unit: 2, title: 'Stop signs', sub: 'Stop, observe, move off' },
  { n: 7, unit: 2, title: 'Crossroads', sub: 'Priority and positioning' },
  { n: 8, unit: 2, title: 'Narrow roads and parked cars', sub: 'Who gives way?' },
  {
    n: 9,
    unit: 3,
    title: 'Mini-roundabouts',
    sub: 'Give way to the right',
    scenario: 'rbt-2',
    video: 'rbt-2',
    rule: 'At a mini-roundabout, give way to traffic coming from your right, and go round the painted circle, not over it.',
    hc: 'Highway Code rule 188',
    route: '2nd exit, straight on',
    happens: ['A car is coming from your right and will reach the roundabout at the same time as you.', 'Let it go first, then take your turn.'],
    marked: ['Mirrors', 'Signals', 'Junctions', 'Positioning'],
  },
  {
    n: 10,
    unit: 3,
    title: 'Turning left at a roundabout',
    sub: '1st exit: signal left',
    scenario: 'rbt-1',
    video: 'rbt-1',
    rule: 'To take the first exit, signal left on the approach and keep left as you go round.',
    hc: 'Highway Code rule 186',
    route: '1st exit, turn left',
    happens: ['Traffic is coming from your right.', 'Signal left in good time, give way, then turn left.'],
    marked: ['Mirrors', 'Signals', 'Junctions'],
  },
  {
    n: 11,
    unit: 3,
    title: 'Straight ahead at a roundabout',
    sub: 'No signal in, signal left to leave',
    scenario: 'rbt-2',
    video: 'rbt-2',
    rule: 'Going straight ahead, do not signal on the approach. Signal left after you pass the exit before yours.',
    hc: 'Highway Code rule 186',
    route: '2nd exit, straight on',
    happens: ['Traffic is coming from your right.', 'Look for a gap, go round the circle, and signal left to leave.'],
    marked: ['Mirrors', 'Signals', 'Junctions'],
  },
  {
    n: 12,
    unit: 3,
    title: 'Turning right at a roundabout',
    sub: '3rd exit: right, then left',
    scenario: 'rbt-3',
    video: 'rbt-3',
    rule: 'To go right, signal right on the approach, go clockwise round the circle, and signal left after you pass the exit before yours.',
    hc: 'Highway Code rule 186',
    route: '3rd exit, turn right',
    happens: ['Traffic is coming from your right.', 'Go round the circle clockwise and change your signal to left to leave.'],
    marked: ['Mirrors', 'Signals', 'Junctions', 'Positioning'],
  },
  {
    n: 13,
    unit: 4,
    title: 'Zebra crossings',
    sub: 'Give way to pedestrians',
    scenario: 'zebra',
    video: 'zebra',
    rule: 'Slow down as you approach a zebra crossing. Give way to anyone on it and anyone waiting to cross. Wait until it is clear.',
    hc: 'Highway Code rule 195',
    route: 'Zebra crossing on a 30 mph road',
    happens: ['A pedestrian is waiting at the kerb.', 'They step out as you approach. Stop at the line and let them cross.'],
    marked: ['Pedestrian crossings', 'Mirrors', 'Use of speed'],
  },
  {
    n: 14,
    unit: 4,
    title: 'Traffic lights',
    sub: 'Red, amber, green',
    scenario: 'lights',
    video: 'lights',
    rule: 'Stop at the line on red. Amber means stop unless you are too close to stop safely. Wait for green.',
    hc: 'Highway Code rule 109',
    route: 'Traffic-light crossroads',
    happens: ['The lights change as you approach.', 'Cross traffic goes while you wait on red.'],
    marked: ['Response to traffic signals', 'Mirrors', 'Control'],
  },
  { n: 15, unit: 4, title: 'Pedestrians at junctions', sub: 'Turning across people' },
  { n: 16, unit: 5, title: 'Cyclists', sub: 'Give them space' },
  { n: 17, unit: 5, title: 'Overtaking', sub: 'Only when it is safe' },
  { n: 18, unit: 5, title: 'Buses and horse riders', sub: 'Slow down, give room' },
  { n: 19, unit: 6, title: 'Independent driving', sub: 'Follow the signs' },
  { n: 20, unit: 6, title: 'Emergency stop', sub: 'Stop quickly and safely' },
  { n: 21, unit: 6, title: 'A test-style route', sub: 'Drive a full route in 3D' },
  { n: 22, unit: 6, title: 'Mock driving test', sub: 'Marked like the real thing' },
]

export const lessonByN = (n: number) => LESSONS.find((l) => l.n === n)
export const playable = (l: Lesson) => !!l.scenario
export const PLAYABLE = LESSONS.filter(playable)

const builders: Record<string, () => Scenario> = {
  'move-off': moveOff,
  'speed-limits': speedLimits,
  'pull-up': pullUp,
  'zebra': zebra,
  'lights': trafficLights,
  't-left': () => buildT('left'),
  't-right': () => buildT('right'),
  'rbt-1': () => buildR(1),
  'rbt-2': () => buildR(2),
  'rbt-3': () => buildR(3),
}

export function buildScenario(id: string): Scenario {
  const b = builders[id]
  if (!b) throw new Error(`Unknown scenario ${id}`)
  return b()
}
