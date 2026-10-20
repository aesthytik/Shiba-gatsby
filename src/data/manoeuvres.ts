// Top-down manoeuvre animations. Units are metres; x runs right, y runs down the screen.
// Heading is in degrees, 0 = facing right, positive = clockwise on screen.

export interface Pose2D {
  x: number
  y: number
  h: number
}

export interface ManoeuvreStep {
  /** Index of the pose this step ends at. */
  to: number
  title: string
  detail: string
  reverse?: boolean
}

export interface StaticCar {
  x: number
  y: number
  h: number
  color: string
}

export interface Manoeuvre {
  id: string
  name: string
  summary: string
  view: { x: number; y: number; w: number; h: number }
  scenery: 'kerb' | 'bays' | 'two-way'
  parked: StaticCar[]
  poses: Pose2D[]
  steps: ManoeuvreStep[]
  faults: string[]
}

export const MANOEUVRES: Manoeuvre[] = [
  {
    id: 'parallel',
    name: 'Parallel park',
    summary: 'Reverse into a space behind a parked car, finishing close and parallel to the kerb within about two car lengths.',
    view: { x: -12, y: -2, w: 22, h: 9 },
    scenery: 'kerb',
    parked: [{ x: 2.1, y: 1.15, h: 0, color: '#5b7fa6' }],
    poses: [
      { x: 6.5, y: 3.9, h: 0 },
      { x: 2.4, y: 3.9, h: 0 },
      { x: 0.2, y: 3.9, h: 0 },
      { x: -1.9, y: 3.15, h: 28 },
      { x: -3.6, y: 1.85, h: 32 },
      { x: -5.1, y: 1.2, h: 0 },
      { x: -4.4, y: 1.2, h: 0 },
    ],
    steps: [
      { to: 1, title: 'Pull up alongside', detail: 'Mirrors and signal left if needed. Stop parallel to the parked car, about a door\'s width (around 1 metre) away, with your car level with or just ahead of it.' },
      { to: 2, title: 'Reverse straight back', reverse: true, detail: 'Select reverse, then check all round including blind spots. Reverse slowly until the back of your car is level with the back of the parked car.' },
      { to: 3, title: 'Steer left', reverse: true, detail: 'Look all round again, then steer briskly to the left so the back of your car swings in towards the kerb. Keep the speed very slow with clutch control.' },
      { to: 4, title: 'Straighten up', reverse: true, detail: 'When your car is at about 45 degrees to the kerb, straighten the wheels and keep reversing slowly, watching the kerb in your left mirror.' },
      { to: 5, title: 'Steer right to bring the front in', reverse: true, detail: 'As the front clears the parked car, steer to the right to swing the front in. Stop when you are parallel and close to the kerb.' },
      { to: 6, title: 'Straighten and finish', detail: 'Straighten the wheels, move forward slightly if needed to leave space, then secure the car.' },
    ],
    faults: ['Not looking all round before and during the reverse', 'Hitting or mounting the kerb', 'Finishing too far from the kerb or at an angle', 'Not reacting to other road users or pedestrians'],
  },
  {
    id: 'bay-reverse',
    name: 'Reverse into a bay',
    summary: 'Drive past the bay, then reverse in, finishing within the lines. You drive forwards out of the bay afterwards.',
    view: { x: -10, y: -6, w: 20, h: 13 },
    scenery: 'bays',
    parked: [
      { x: -2.6, y: -2.5, h: 90, color: '#7a8b99' },
      { x: 5.2, y: -2.5, h: -90, color: '#b0413e' },
    ],
    poses: [
      { x: -8, y: 3.4, h: 0 },
      { x: -3, y: 3.4, h: 0 },
      { x: 2.6, y: 3.4, h: 0 },
      { x: 1.2, y: 2.0, h: 45 },
      { x: 0.1, y: 0.2, h: 85 },
      { x: 0, y: -2.4, h: 90 },
    ],
    steps: [
      { to: 1, title: 'Drive along the aisle', detail: 'Look for a free bay and drive slowly, checking for pedestrians and other cars.' },
      { to: 2, title: 'Stop past the bay', detail: 'Stop when the line on the far side of your target bay is roughly level with your shoulder or door mirror (reference points vary by car).' },
      { to: 3, title: 'Reverse with full left lock', reverse: true, detail: 'Select reverse, look all round, then reverse very slowly, steering fully to the left so the car swings in towards the bay.' },
      { to: 4, title: 'Check both mirrors', reverse: true, detail: 'Watch the bay lines in both door mirrors. When the car is nearly straight with the lines, start to straighten the wheels.' },
      { to: 5, title: 'Reverse in straight', reverse: true, detail: 'Reverse straight back until you are fully inside the bay, then stop and secure the car.' },
    ],
    faults: ['Not looking around during the manoeuvre', 'Finishing over the bay lines', 'Not giving way to pedestrians or vehicles in the car park'],
  },
  {
    id: 'bay-forward',
    name: 'Drive into a bay',
    summary: 'Drive forwards into a bay, then reverse out safely when asked.',
    view: { x: -12, y: -6, w: 22, h: 13 },
    scenery: 'bays',
    parked: [
      { x: -2.6, y: -2.5, h: -90, color: '#7a8b99' },
      { x: 2.6, y: -2.5, h: 90, color: '#b0413e' },
    ],
    poses: [
      { x: -10, y: 4.2, h: 0 },
      { x: -5.4, y: 4.2, h: 0 },
      { x: -1.9, y: 2.6, h: -45 },
      { x: -0.15, y: 0.2, h: -84 },
      { x: 0, y: -2.4, h: -90 },
      { x: 0, y: 1.2, h: -90 },
      { x: -1.6, y: 3.6, h: -25 },
      { x: 4.5, y: 4.0, h: 0 },
    ],
    steps: [
      { to: 1, title: 'Approach on the opposite side', detail: 'Keep to the far side of the aisle so you have room to swing in. Check mirrors and signal if needed.' },
      { to: 2, title: 'Turn in', detail: 'When the bay is a little ahead, steer firmly towards it, keeping the speed slow.' },
      { to: 3, title: 'Straighten in the bay', detail: 'Straighten the wheels as the car lines up with the bay markings.' },
      { to: 4, title: 'Stop inside the lines', detail: 'Stop with the car fully inside the bay. Secure the car.' },
      { to: 5, title: 'Reverse out', reverse: true, detail: 'When asked to drive off, select reverse and look all round — your view is limited by the cars either side. Reverse slowly out of the bay.' },
      { to: 6, title: 'Swing the back round', reverse: true, detail: 'Once the front is clear of the neighbouring cars, steer so the back of the car swings round, still looking all round.' },
      { to: 7, title: 'Drive away', detail: 'Stop, select first gear, check again and drive away slowly.' },
    ],
    faults: ['Clipping the bay line or neighbouring cars', 'Poor observation when reversing out', 'Swinging out too wide or too early'],
  },
  {
    id: 'right-reverse',
    name: 'Pull up on the right',
    summary: 'Pull up on the right-hand side of the road, reverse about two car lengths, then rejoin the traffic.',
    view: { x: -14, y: -2, w: 28, h: 11 },
    scenery: 'two-way',
    parked: [],
    poses: [
      { x: -13, y: 1.8, h: 0 },
      { x: -8, y: 1.8, h: 0 },
      { x: -3, y: 4.0, h: 25 },
      { x: 2, y: 6.0, h: 0 },
      { x: 3, y: 6.0, h: 0 },
      { x: -5.5, y: 6.0, h: 0 },
      { x: -1, y: 5.2, h: -20 },
      { x: 5, y: 2.2, h: -15 },
      { x: 11, y: 1.8, h: 0 },
    ],
    steps: [
      { to: 1, title: 'Check and signal', detail: 'Mirrors and a right signal when the examiner asks you to pull up on the right. Make sure the road is clear of oncoming traffic.' },
      { to: 3, title: 'Cross over and pull up', detail: 'Move across when safe and stop close and parallel to the right-hand kerb.' },
      { to: 4, title: 'Secure the car', detail: 'Handbrake on and neutral. The examiner then asks you to reverse about two car lengths.' },
      { to: 5, title: 'Reverse two car lengths', reverse: true, detail: 'Look all round, especially behind and over your left shoulder for traffic. Reverse slowly, staying close to the kerb.' },
      { to: 8, title: 'Rejoin the traffic', detail: 'Look all round, signal if needed, and move off back to the left side of the road when it is safe.' },
    ],
    faults: ['Not checking for oncoming traffic before crossing', 'Reversing too far from the kerb', 'Moving off without proper all-round observation'],
  },
]

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
}

/** Smooth pose at progress u ∈ [0, poses.length - 1] (integer values land exactly on keyframes). */
export function poseAtProgress(poses: Pose2D[], u: number): Pose2D {
  const n = poses.length
  const clamped = Math.max(0, Math.min(n - 1, u))
  const i = Math.min(n - 2, Math.floor(clamped))
  const f = clamped - i
  const P = (k: number) => poses[Math.max(0, Math.min(n - 1, k))]
  const [a, b, c, d] = [P(i - 1), P(i), P(i + 1), P(i + 2)]
  return { x: catmull(a.x, b.x, c.x, d.x, f), y: catmull(a.y, b.y, c.y, d.y, f), h: b.h + (c.h - b.h) * (f * f * (3 - 2 * f)) }
}
