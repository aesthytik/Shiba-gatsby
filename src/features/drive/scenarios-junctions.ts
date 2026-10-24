import { arc, hermite, makePath, project, V } from './geometry'
import { allPassed, anyInTheWay, dashes, join, LANE, lineAcross, mirrorBeforeSlowing, road, scatter, signAt, solid, type Conflict } from './build-helpers'
import { approachSpeed, giveWayFault, obsFault, ped, signalFault } from './scenarios'
import type { Ctx, DemoDo, FaultInfo, NpcDef, Scenario } from './types'

const NORTH = 0
const WEST = Math.PI / 2
const EAST = -Math.PI / 2
const SOUTH = Math.PI

interface JunctionCfg {
  lineS: number
  /** Signal wanted as the car crosses the line. */
  want: 'left' | 'right' | null
  looks: ('left' | 'right')[]
  conflicts: Conflict[]
  /** What the learner gave way to, for the fault text. */
  noun: string
  ids: { mirror: string; signal?: string; look: string; give: string }
}

/** Examiner rules shared by T-junctions and roundabouts: approach, observation, giving way, signals. */
function junctionRules(c: Ctx, cfg: JunctionCfg) {
  const s = c.car.s
  const { lineS, want, looks, conflicts, ids } = cfg
  mirrorBeforeSlowing(c, [lineS - 95, lineS - 4], ids.mirror)
  if (ids.signal && want && s > lineS - 70 && s < lineS + 2 && c.signal === want) c.tick(ids.signal)
  if (s > lineS - 40 && s < lineS + 1 && looks.every((l) => c.lookAgo[l] < 9)) c.tick(ids.look)
  if (s >= lineS - 3 && !c.mem.ap) {
    c.mem.ap = true
    if (c.car.mph > 12) c.fault('approach', approachSpeed)
  }
  if (s >= lineS + 0.4 && !c.mem.crossed) {
    c.mem.crossed = true
    const conflict = anyInTheWay(c, conflicts)
    if (conflict) c.fault('give-way', giveWayFault(cfg.noun))
    else c.tick(ids.give)
    for (const l of looks) if (c.lookAgo[l] > 9) c.fault(`obs-${l}`, obsFault(l))
    if (want && c.signal !== want) c.fault('signal-entry', signalFault(want, 'before the junction'))
  }
}

const near = (conflictS: number, speed: number): Pick<Conflict, 'conflictS' | 'before' | 'after'> => ({ conflictS, before: speed * 3.2, after: 8 })

function landscape(sc: Omit<Scenario, 'props'> & { props?: Scenario['props'] }, seed: number): Scenario {
  return { ...sc, props: [...scatter(sc.roads, sc.discs, seed), ...(sc.props ?? [])] }
}

const traffic = (id: string, color: string, path: { x: number; z: number }[], speed: number, lineS: number, lead: number): NpcDef => ({
  id,
  kind: 'car',
  color,
  path,
  speed,
  trigger: (c) => c.car.s > lineS - lead,
})

// ---- 4 & 5. T-junction: turn left / turn right --------------------------------------------------------

export function tJunction(turn: 'left' | 'right'): Scenario {
  const SPEED = 13
  const minorRoad = road(0, 210, 0, 0, 6.4)
  const lineZ = turn === 'left' ? 9.5 : 10.5
  const pts =
    turn === 'left'
      ? join([V(-1.6, 150), V(-1.6, 7.85)], arc(V(-7.6, 7.85), 6, 90, 0, 9), [V(-170, 1.85)])
      : join([V(-1.6, 150), V(-1.6, 7.15)], arc(V(7.4, 7.15), 9, 270, 360, 9), [V(170, -1.85)])
  const path = makePath(pts)
  const lineS = project(path, V(-1.6, lineZ)).s
  const finishS = path.length - 22
  const lead = 32

  const a = traffic('a', '#2f66c8', [V(75, 1.85), V(-175, 1.85)], SPEED, lineS, lead)
  const b = traffic('b', '#e0a100', [V(110, 1.85), V(-175, 1.85)], SPEED, lineS, lead)
  const l = traffic('c', '#8e44ad', [V(-95, -1.85), V(175, -1.85)], SPEED, lineS, lead)
  const conflicts: Conflict[] =
    turn === 'left'
      ? [
          { id: 'a', ...near(75 + 8, SPEED) },
          { id: 'b', ...near(110 + 8, SPEED) },
        ]
      : [
          { id: 'a', ...near(74, SPEED) },
          { id: 'b', ...near(109, SPEED) },
          { id: 'c', ...near(95 + 5, SPEED) },
        ]
  const looks = turn === 'left' ? (['right'] as const) : (['right', 'left'] as const)
  const want = turn
  const roads = [road(-175, 0, 175, 0), minorRoad]
  const discs = [
    { c: V(-3.2, 3.7), r: 5.5 },
    { c: V(3.2, 3.7), r: 5.5 },
  ]
  return landscape(
    {
      id: turn === 'left' ? 't-left' : 't-right',
      roads,
      discs,
      markings: [
        ...dashes(V(-175, 0), V(175, 0), { from: 0 }).filter((m) => Math.abs(m[0]) > 5 || m[1] !== 0),
        ...dashes(V(0, 210), V(0, 14)),
        ...solid(V(-175, -3.55), V(175, -3.55), 0.12),
        ...solid(V(-175, 3.55), V(-9, 3.55), 0.12),
        ...solid(V(9, 3.55), V(175, 3.55), 0.12),
        ...solid(V(-3.0, 210), V(-3.0, 14), 0.12),
        ...solid(V(3.0, 210), V(3.0, 14), 0.12),
        ...lineAcross(V(0, lineZ), NORTH, { from: 0.2, to: 3.0 }),
      ],
      props: [
        signAt('give-way', V(-1.6, lineZ + 4), NORTH, 3.0),
        signAt('warn-t-junction', V(-1.6, 78), NORTH, 3.0),
      ],
      path: pts,
      start: { x: -1.6, z: 150, h: NORTH, parked: true },
      finishS,
      limits: [{ fromS: 0, mph: 30 }],
      waypoints: [
        { s: lineS, label: turn === 'left' ? 'Give way · turn left' : 'Give way · turn right', icon: turn === 'left' ? 'left' : 'right' },
        { s: finishS, label: 'Finish', icon: 'finish' },
      ],
      checks:
        turn === 'left'
          ? [
              { id: 'mirror', label: 'Mirror, then slow down' },
              { id: 'signal', label: 'Signal left' },
              { id: 'look', label: 'Look right at the line' },
              { id: 'give', label: 'Give way to the traffic from the right' },
              { id: 'go', label: 'Turn left and settle in lane' },
            ]
          : [
              { id: 'mirror', label: 'Mirror, then slow down' },
              { id: 'signal', label: 'Signal right' },
              { id: 'look', label: 'Look right, left, then right again' },
              { id: 'give', label: 'Give way to traffic from both sides' },
              { id: 'go', label: 'Turn right and settle in lane' },
            ],
      npcs: turn === 'left' ? [a, b] : [a, b, l],
      rules(c) {
        junctionRules(c, { lineS, want, looks: [...looks], conflicts, noun: turn === 'left' ? 'traffic from the right' : 'oncoming traffic', ids: { mirror: 'mirror', signal: 'signal', look: 'look', give: 'give' } })
        if (c.car.s > lineS + 25 && !c.hasFault('give-way')) c.tick('go')
        if (c.car.s > lineS + 25 && c.hasFault('give-way')) c.tick('go')
        if (c.car.s > lineS - 2 && c.car.s < lineS + 12 && c.car.mph > 18 && !c.mem.turnFast) {
          c.mem.turnFast = true
          c.fault('turn-speed', { category: 'Junctions – turning', title: 'Took the turn too fast', advice: 'Slow right down before the turn and take it gently, then accelerate once you are straight.', severity: 'minor', hc: 'Rule 170' })
        }
      },
      demo: {
        startDelay: 0.4,
        actions: [
          { s: lineS - 88, do: 'mirror' },
          { s: lineS - 55, do: turn },
        ],
        speed: [
          [0, 26],
          [lineS - 60, 26],
          [lineS - 22, 9],
          [lineS + 6, 8],
          [lineS + 35, 16],
          [999, 22],
        ],
        holds: [
          {
            s: lineS - 0.8,
            until: (c) => allPassed(c, conflicts) && ['a', 'b', 'c'].every((id) => c.npc(id).active || id === 'c' && turn === 'left'),
            then: (turn === 'left' ? ['look-right'] : ['look-right', 'look-left', 'look-right']) as DemoDo[],
          },
        ],
      },
    },
    turn === 'left' ? 44 : 55,
  )
}

// ---- 9–12. Mini-roundabout ----------------------------------------------------------------------------

export function miniRoundabout(exit: 1 | 2 | 3): Scenario {
  const SPEED = 13
  const C = V(0, 0)
  const lineZ = 13.5
  const ringR = 5.5
  let pts
  if (exit === 1) {
    pts = join([V(-LANE, 170), V(-LANE, 12)], hermite(V(-LANE, 12), V(0, -1), V(-11.5, LANE), V(-1, 0), 7.5, 14), [V(-170, LANE)])
  } else if (exit === 2) {
    pts = [V(-LANE, 170), V(-LANE, 40), V(-2.3, 16), V(-2.3, -16), V(-LANE, -40), V(-LANE, -170)]
  } else {
    pts = join(
      [V(-LANE, 170), V(-LANE, 30), V(-2.6, 15)],
      arc(C, ringR, 262, 350, 8),
      hermite(V(-0.95, -5.42), V(0.985, -0.174), V(13, -LANE), V(1, 0), 9, 10),
      [V(170, -LANE)],
    )
  }
  const path = makePath(pts)
  const lineS = project(path, V(-LANE, lineZ)).s
  const finishS = path.length - 22
  const lead = 32
  const a = traffic('a', '#2f66c8', [V(75, LANE), V(-175, LANE)], SPEED, lineS, lead)
  const b = traffic('b', '#e0a100', [V(110, LANE), V(-175, LANE)], SPEED, lineS, lead)
  const conflictX = exit === 1 ? -8 : exit === 2 ? -2.3 : -5
  const conflicts: Conflict[] = [
    { id: 'a', ...near(75 - conflictX, SPEED) },
    { id: 'b', ...near(110 - conflictX, SPEED) },
  ]
  const sExit2 = project(path, V(-2.3, -8)).s
  const sExit3 = project(path, V(-0.95, -5.42)).s
  const want = exit === 1 ? 'left' : exit === 3 ? 'right' : null
  const roads = [road(0, 235, 0, -175), road(-175, 0, 175, 0)]
  const discs = [{ c: C, r: 11.5 }]
  const edge = (a1: [number, number], a2: [number, number]) => solid(V(a1[0], a1[1]), V(a2[0], a2[1]), 0.12)
  const exitName = exit === 1 ? 'Mini-roundabout · 1st exit, left' : exit === 2 ? 'Mini-roundabout · 2nd exit, straight on' : 'Mini-roundabout · 3rd exit, right'
  const ids = { mirror: 'mirror', signal: 'signal', look: 'look', give: 'give' }
  const checks =
    exit === 1
      ? [
          { id: 'mirror', label: 'Mirror, then slow down' },
          { id: 'signal', label: 'Signal left' },
          { id: 'look', label: 'Look right at the line' },
          { id: 'give', label: 'Give way to the blue car' },
        ]
      : exit === 2
        ? [
            { id: 'mirror', label: 'Mirror, then slow down' },
            { id: 'look', label: 'Look right at the line' },
            { id: 'give', label: 'Give way to the blue car' },
            { id: 'exit', label: 'Signal left to leave' },
          ]
        : [
            { id: 'mirror', label: 'Mirror, then slow down' },
            { id: 'signal', label: 'Signal right' },
            { id: 'look', label: 'Look right at the line' },
            { id: 'give', label: 'Give way to the blue car' },
            { id: 'exit', label: 'Signal left after the 2nd exit' },
          ]
  return landscape(
    {
      id: `rbt-${exit}`,
      roads,
      discs,
      island: { c: C, r: 1.5 },
      markings: [
        ...dashes(V(0, 235), V(0, 19)),
        ...dashes(V(0, -19), V(0, -175)),
        ...dashes(V(-175, 0), V(-19, 0)),
        ...dashes(V(19, 0), V(175, 0)),
        ...edge([-3.55, 235], [-3.55, 14]),
        ...edge([3.55, 235], [3.55, 14]),
        ...edge([-3.55, -175], [-3.55, -14]),
        ...edge([3.55, -175], [3.55, -14]),
        ...edge([-175, -3.55], [-14, -3.55]),
        ...edge([-175, 3.55], [-14, 3.55]),
        ...edge([175, -3.55], [14, -3.55]),
        ...edge([175, 3.55], [14, 3.55]),
        ...lineAcross(V(0, lineZ), NORTH),
        ...lineAcross(V(0, -lineZ), SOUTH),
        ...lineAcross(V(-lineZ, 0), EAST),
        ...lineAcross(V(lineZ, 0), WEST),
      ],
      props: [
        signAt('warn-roundabout', V(-LANE, 105), NORTH, 3.2),
        signAt('mini-roundabout', V(-LANE, 52), NORTH, 3.2),
        signAt('give-way', V(-LANE, 19), NORTH, 3.2),
      ],
      path: pts,
      start: { x: -LANE, z: 170, h: NORTH, parked: true },
      finishS,
      limits: [{ fromS: 0, mph: 30 }],
      waypoints: [
        { s: lineS, label: exitName, icon: 'roundabout' },
        { s: finishS, label: 'Finish', icon: 'finish' },
      ],
      checks,
      npcs: [a, b],
      rules(c) {
        const s = c.car.s
        junctionRules(c, { lineS, want, looks: ['right'], conflicts, noun: 'the traffic already on the roundabout', ids: exit === 2 ? { ...ids, signal: undefined as unknown as string } : ids })
        // Leaving signals.
        if (exit === 2 && s >= sExit2 - 2 && !c.mem.exitChecked) {
          c.mem.exitChecked = true
          if (c.signal === 'left') c.tick('exit')
          else c.fault('exit-signal', signalFault('left', 'before leaving the roundabout'))
        }
        if (exit === 3 && s >= sExit3 && !c.mem.exitChecked) {
          c.mem.exitChecked = true
          if (c.signal === 'left') c.tick('exit')
          else c.fault('exit-signal', signalFault('left', 'before leaving the roundabout'))
        }
        // Speed through the junction and the painted circle.
        const dist = Math.hypot(c.car.x, c.car.z)
        if (dist < 11 && c.car.mph > 18 && !c.mem.fastRound) {
          c.mem.fastRound = true
          c.fault('round-speed', { category: 'Use of speed', title: 'Too fast through the roundabout', advice: 'Slow right down on the approach and go round gently. About 10 to 15 mph is plenty at a mini-roundabout.', severity: 'minor', hc: 'Rule 184' })
        }
        if (dist < 1.8 && !c.mem.overCircle) {
          c.mem.overCircle = true
          c.fault('over-circle', { category: 'Junctions – roundabouts', title: 'You drove over the painted circle', advice: 'Go round the painted circle, not over it, unless your vehicle is too big to do so.', severity: 'minor', hc: 'Rule 188' })
        }
      },
      demo: {
        startDelay: 0.4,
        actions: [
          { s: lineS - 90, do: 'mirror' },
          ...(want ? [{ s: lineS - 55, do: want } as const] : []),
          ...(exit === 2 ? [{ s: sExit2 - 14, do: 'left' } as const] : []),
          ...(exit === 3 ? [{ s: sExit3 - 12, do: 'left' } as const] : []),
        ],
        speed: [
          [0, 26],
          [lineS - 60, 26],
          [lineS - 22, 9],
          [lineS + 4, 9],
          [lineS + 30, 11],
          [Math.max(lineS + 31, finishS - 40), 18],
          [999, 22],
        ],
        holds: [
          {
            s: lineS - 0.8,
            until: (c) => allPassed(c, conflicts),
            then: ['look-right'],
          },
        ],
      },
    },
    60 + exit,
  )
}

// ---- 13. Zebra crossing -------------------------------------------------------------------------------

export function zebra(): Scenario {
  const crossZ = -60
  const path0 = [V(-LANE, 60), V(-LANE, -240)]
  const path = makePath(path0)
  const lineZ = crossZ + 3.4
  const lineS = project(path, V(-LANE, lineZ)).s
  const finishS = path.length - 15
  const stripes = Array.from({ length: 8 }, (_, i) => [-3.4 + i * 0.97, crossZ, 0.5, 3.2, 0] as [number, number, number, number, number])
  const walker = ped('ped', '#e67e22', [V(-6.8, crossZ), V(6.8, crossZ)], (c) => c.car.s > lineS - 34)
  const clearX = 4.8
  const pedBlocking = (c: Ctx) => {
    const n = c.npc('ped')
    return n.active && !n.done && n.x < clearX
  }
  return landscape(
    {
      id: 'zebra',
      roads: [road(0, 140, 0, -260)],
      discs: [],
      markings: [
        ...dashes(V(0, 140), V(0, -260)).filter((m) => Math.abs(m[1] - crossZ) > 4),
        ...solid(V(-3.55, 140), V(-3.55, -260), 0.12),
        ...solid(V(3.55, 140), V(3.55, -260), 0.12),
        ...stripes,
        ...lineAcross(V(0, lineZ), NORTH, { from: 0.1, to: 3.5 }),
        ...lineAcross(V(0, crossZ - 3.4), SOUTH, { from: 0.1, to: 3.5 }),
        ...dashes(V(-3.0, crossZ + 22), V(-3.0, crossZ + 4.4), { w: 0.2, dash: 1.2, gap: 1.2 }),
        ...dashes(V(3.0, crossZ + 22), V(3.0, crossZ + 4.4), { w: 0.2, dash: 1.2, gap: 1.2 }),
        ...dashes(V(-3.0, crossZ - 4.4), V(-3.0, crossZ - 14), { w: 0.2, dash: 1.2, gap: 1.2 }),
        ...dashes(V(3.0, crossZ - 4.4), V(3.0, crossZ - 14), { w: 0.2, dash: 1.2, gap: 1.2 }),
      ],
      props: [
        { kind: 'beacon', x: -4.5, z: crossZ + 1.6 },
        { kind: 'beacon', x: 4.5, z: crossZ + 1.6 },
        signAt('speed-30', V(-LANE, 52), NORTH, 3.2),
      ],
      path: path0,
      start: { x: -LANE, z: 60, h: NORTH, parked: true },
      finishS,
      limits: [{ fromS: 0, mph: 30 }],
      waypoints: [
        { s: lineS, label: 'Zebra crossing · give way', icon: 'crossing' },
        { s: finishS, label: 'Finish', icon: 'finish' },
      ],
      checks: [
        { id: 'mirror', label: 'Mirror, then slow down' },
        { id: 'slow', label: 'Slow down for the crossing' },
        { id: 'stop', label: 'Stop at the line for the pedestrian' },
        { id: 'go', label: 'Go when the crossing is clear' },
      ],
      npcs: [walker],
      rules(c) {
        const s = c.car.s
        mirrorBeforeSlowing(c, [lineS - 95, lineS - 4], 'mirror')
        if (s > lineS - 28 && c.car.mph < 12) c.tick('slow')
        if (c.stopped && s > lineS - 9 && s < lineS + 0.3 && c.npc('ped').active) c.tick('stop')
        if (s >= lineS - 1 && !c.mem.crossed) {
          c.mem.crossed = true
          if (pedBlocking(c)) {
            c.fault('ped', { category: 'Pedestrian crossings', title: 'You did not give way to the pedestrian', advice: 'Slow down early, and stop for anyone on the crossing or waiting to cross. Wait until the crossing is completely clear.', severity: 'serious', hc: 'Rule 195' })
          } else {
            c.tick('stop')
            c.tick('go')
          }
        }
        if (s > lineS + 6 && c.hasFault('ped')) c.tick('go')
        if (s > lineS - 8 && s < lineS && c.car.mph > 18 && pedBlocking(c)) {
          c.fault('ped-speed', { category: 'Pedestrian crossings', title: 'Too fast for the crossing', advice: 'Pedestrians are waiting. Slow down in good time so you can stop at the line.', severity: 'minor', hc: 'Rule 195' })
        }
      },
      demo: {
        startDelay: 0.4,
        actions: [{ s: lineS - 90, do: 'mirror' }],
        speed: [
          [0, 26],
          [lineS - 60, 26],
          [lineS - 22, 8],
          [lineS + 8, 10],
          [lineS + 30, 22],
          [999, 24],
        ],
        holds: [{ s: lineS - 0.8, until: (c) => c.npc('ped').active && !pedBlocking(c), then: ['look-left', 'look-right'] }],
      },
    },
    77,
  )
}

// ---- 14. Traffic lights ------------------------------------------------------------------------------

export function trafficLights(): Scenario {
  const stopZ = -54
  const path0 = [V(-LANE, 60), V(-LANE, -240)]
  const path = makePath(path0)
  const lineS = project(path, V(-LANE, stopZ)).s
  const finishS = path.length - 20
  const roads = [road(0, 140, 0, -260), road(-135, -62, 135, -62)]
  const crossCar: NpcDef = {
    id: 'x1',
    kind: 'car',
    color: '#8e44ad',
    path: [V(-40, -63.85), V(140, -63.85)],
    speed: 11,
    trigger: (c) => c.mem.phase === 'red' && c.t - Number(c.mem.redT) > 0.8,
  }
  const redFault: FaultInfo = {
    category: 'Response to traffic signals',
    title: 'You went through a red light',
    advice: 'A red light means stop at the line, every time. Cross traffic is already moving. Wait for green.',
    severity: 'serious',
    hc: 'Rule 109',
  }
  return landscape(
    {
      id: 'lights',
      roads,
      discs: [],
      markings: [
        ...dashes(V(0, 140), V(0, stopZ + 2)),
        ...dashes(V(0, -72), V(0, -260)),
        ...dashes(V(-135, -62), V(-9, -62)),
        ...dashes(V(9, -62), V(135, -62)),
        ...solid(V(-3.55, 140), V(-3.55, stopZ + 2), 0.12),
        ...solid(V(3.55, 140), V(3.55, stopZ + 2), 0.12),
        ...solid(V(-3.55, -70), V(-3.55, -260), 0.12),
        ...solid(V(3.55, -70), V(3.55, -260), 0.12),
        [-1.85, stopZ, 3.6, 0.35, 0],
      ],
      props: [
        { kind: 'light', id: 'L1', x: -4.6, z: stopZ - 1.5, rot: 0 },
        { kind: 'light', id: 'L1', x: 4.6, z: -72, rot: 0 },
        signAt('warn-traffic-signals', V(-LANE, 4), NORTH, 3.2),
      ],
      path: path0,
      start: { x: -LANE, z: 60, h: NORTH, parked: true },
      finishS,
      limits: [{ fromS: 0, mph: 30 }],
      waypoints: [
        { s: lineS, label: 'Traffic lights', icon: 'lights' },
        { s: finishS, label: 'Finish', icon: 'finish' },
      ],
      checks: [
        { id: 'mirror', label: 'Mirror, then slow down' },
        { id: 'change', label: 'Watch the lights change' },
        { id: 'stop', label: 'Stop at the line on red' },
        { id: 'go', label: 'Move off on green' },
      ],
      npcs: [crossCar],
      rules(c) {
        const s = c.car.s
        if (!c.mem.phase) {
          c.mem.phase = 'green'
          c.setLight('L1', 'green')
        }
        mirrorBeforeSlowing(c, [lineS - 95, lineS - 4], 'mirror')
        // The light changes as you approach, so you have to decide.
        if (c.mem.phase === 'green' && !c.mem.cycled && s >= lineS - 42) {
          c.mem.cycled = true
          c.mem.phase = 'amber'
          c.mem.amberT = c.t
          c.mem.couldStop = c.car.v * c.car.v / (2 * 4.5) < lineS - s - 0.5
          c.setLight('L1', 'amber')
        }
        if (c.mem.phase === 'amber' && c.t - Number(c.mem.amberT) > 3) {
          c.mem.phase = 'red'
          c.mem.redT = c.t
          c.setLight('L1', 'red')
        }
        if (c.mem.phase === 'red') {
          const waited = c.t - Number(c.mem.redT)
          if (waited > 7 && (c.stopped || waited > 13)) {
            c.mem.phase = 'redamber'
            c.mem.raT = c.t
            c.setLight('L1', 'redamber')
          }
        }
        if (c.mem.phase === 'redamber' && c.t - Number(c.mem.raT) > 1.6) {
          c.mem.phase = 'green'
          c.mem.greenT = c.t
          c.mem.cleared = true
          c.setLight('L1', 'green')
        }
        if (c.mem.phase !== 'green' && (c.brake > 0.1 || c.car.mph < 12)) c.tick('change')
        if (c.mem.phase === 'red' && c.stopped && s > lineS - 9 && s < lineS + 0.2) c.tick('stop')
        if (s >= lineS + 0.2 && !c.mem.crossed) {
          c.mem.crossed = true
          if (c.mem.phase === 'red' || c.mem.phase === 'redamber') c.fault('red', redFault)
          else if (c.mem.phase === 'amber' && c.mem.couldStop)
            c.fault('amber', {
              category: 'Response to traffic signals',
              title: 'You drove through amber when you could have stopped',
              advice: 'Amber means stop, unless you are so close to the line that stopping might cause an accident.',
              severity: 'minor',
              hc: 'Rule 109',
            })
          if (c.mem.phase === 'green' && c.mem.cleared) c.tick('go')
        }
        if (s > lineS + 8 && !c.hasFault('red')) c.tick('go')
        if (s > lineS + 8 && c.hasFault('red')) c.tick('go')
      },
      demo: {
        startDelay: 0.4,
        actions: [{ s: lineS - 90, do: 'mirror' }],
        speed: [
          [0, 26],
          [lineS - 60, 26],
          [lineS - 30, 16],
          [lineS + 8, 12],
          [lineS + 30, 22],
          [999, 24],
        ],
        holds: [{ s: lineS - 0.8, until: (c) => c.mem.phase === 'green' && c.mem.cleared === true, then: ['look-left', 'look-right'] }],
      },
    },
    88,
  )
}
