import { hermite, makePath, project, V, type Vec } from './geometry'
import { dashes, join, LANE, mirrorBeforeSlowing, road, scatter, signAt, solid } from './build-helpers'
import type { FaultInfo, NpcDef, Scenario } from './types'

const NORTH = 0

// ---- fault texts --------------------------------------------------------------------------------

const F = {
  moveMirror: {
    category: 'Use of mirrors – move off',
    title: 'No mirror check before moving off',
    advice: 'Check your interior and door mirrors before you move off, to see what is coming up behind you.',
    severity: 'minor',
    hc: 'Rule 159',
  },
  moveBlind: {
    category: 'Move off – safely',
    title: 'You moved off without checking your blind spot',
    advice: 'Look over your right shoulder just before you move, because a car can hide where your mirrors cannot see it.',
    severity: 'serious',
    hc: 'Rule 159',
  },
  moveBlindMinor: {
    category: 'Move off – safely',
    title: 'No blind spot check before moving off',
    advice: 'Make a quick look over your right shoulder before every move off, even when the road looks empty.',
    severity: 'minor',
    hc: 'Rule 159',
  },
  moveSignal: {
    category: 'Signals – necessary',
    title: 'No signal before moving off',
    advice: 'Signal right when other road users would benefit from knowing you are about to pull out.',
    severity: 'minor',
    hc: 'Rule 103',
  },
  signalOn: {
    category: 'Signals – correctly',
    title: 'Left your signal on',
    advice: 'Cancel your indicator once you have moved off, or others will think you are about to turn.',
    severity: 'minor',
    hc: 'Rule 103',
  },
} satisfies Record<string, FaultInfo>

const signalFault = (want: 'left' | 'right', where: string): FaultInfo => ({
  category: 'Signals – necessary',
  title: `No ${want} signal ${where}`,
  advice: `Signal ${want} in good time, so that drivers and pedestrians know your plan before you slow down or turn.`,
  severity: 'minor',
  hc: 'Rule 103',
})

const giveWayFault = (what: string): FaultInfo => ({
  category: 'Junctions – giving way',
  title: `You pulled out in front of ${what}`,
  advice: 'Stop at the line, look right and left, and only go when there is a safe gap. If you are not sure, wait.',
  severity: 'serious',
  hc: 'Rule 170',
})

const obsFault = (side: 'left' | 'right'): FaultInfo => ({
  category: 'Junctions – observation',
  title: `You did not look ${side} before going`,
  advice: `Look ${side} (and then right again) at the line before you pull out, even if the road looked clear a moment ago.`,
  severity: 'minor',
  hc: 'Rule 170',
})

const approachSpeed: FaultInfo = {
  category: 'Junctions – approach speed',
  title: 'Approached too fast',
  advice: 'Slow down well before the line so you can stop if you have to. Be ready to give way.',
  severity: 'minor',
  hc: 'Rule 170',
}

// ---- helpers -----------------------------------------------------------------------------------

const ped = (id: string, color: string, path: Vec[], trigger: NpcDef['trigger']): NpcDef => ({ id, kind: 'person', color, path, speed: 1.1, trigger, visibleBefore: true, lingers: true })

function landscape(sc: Omit<Scenario, 'props'> & { props?: Scenario['props'] }, seed: number): Scenario {
  return { ...sc, props: [...scatter(sc.roads, sc.discs, seed), ...(sc.props ?? [])] }
}

// ---- 1. Moving off safely -------------------------------------------------------------------------

export function moveOff(): Scenario {
  const pts = join([V(-2.75, 8), V(-2.75, -6)], hermite(V(-2.75, -6), V(0, -1), V(-LANE, -30), V(0, -1), 14, 8), [V(-LANE, -170)])
  const path = makePath(pts)
  const passer = (id: string, at: number): NpcDef => ({
    id,
    kind: 'car',
    color: id === 'p2' ? '#2f66c8' : '#c0392b',
    path: [V(-0.4, 95), V(-0.4, -200)],
    speed: 12,
    // Cars keep coming until you have moved off, then stop appearing.
    trigger: (c) => c.t > at && c.sinceMoveOff < 0,
  })
  const finishS = path.length - 10
  return landscape(
    {
      id: 'move-off',
      roads: [road(0, 140, 0, -190)],
      discs: [],
      markings: [...dashes(V(0, 140), V(0, -190)), ...solid(V(-3.55, 140), V(-3.55, -190), 0.12), ...solid(V(3.55, 140), V(3.55, -190), 0.12)],
      props: [signAt('speed-30', V(-LANE, 4), NORTH, 3.2)],
      path: pts,
      start: { x: -2.75, z: 8, h: NORTH, parked: true },
      finishS,
      limits: [{ fromS: 0, mph: 30 }],
      waypoints: [
        { s: 0, label: 'Move off when the road is clear', icon: 'straight' },
        { s: finishS, label: 'Finish', icon: 'finish' },
      ],
      checks: [
        { id: 'mirror', label: 'Check your mirror' },
        { id: 'signal', label: 'Signal right' },
        { id: 'look', label: 'Look over your right shoulder' },
        { id: 'go', label: 'Move off when it is clear' },
        { id: 'drive', label: 'Drive on within the limit' },
      ],
      npcs: [passer('p1', 2), passer('p2', 13), passer('p3', 24), passer('p4', 35), passer('p5', 46)],
      rules(c) {
        if (c.sinceMoveOff < 0) {
          if (c.mirrorAgo < 10) c.tick('mirror')
          if (c.signal === 'right') c.tick('signal')
          if (c.lookAgo.right < 6) c.tick('look')
        }
        if (c.sinceMoveOff >= 0 && !c.mem.moved) {
          c.mem.moved = true
          // A car behind and closing counts as "approaching".
          const approaching = ['p1', 'p2', 'p3', 'p4', 'p5'].some((id) => {
            const n = c.npc(id)
            return n.active && !n.done && n.z > c.car.z && n.z - c.car.z < 45
          })
          c.mem.approaching = approaching
          if (c.mirrorAgo > 6) c.fault('mo-mirror', F.moveMirror)
          if (c.lookAgo.right > 5) c.fault('mo-blind', approaching ? F.moveBlind : F.moveBlindMinor)
          if (approaching && c.signal !== 'right') c.fault('mo-signal', F.moveSignal)
          c.tick('go')
        }
        if (c.signal === 'right' && c.sinceMoveOff > 7) c.fault('signal-left-on', F.signalOn)
        if (c.car.s > 40 && !c.hasFault('speed-1')) c.tick('drive')
      },
      demo: {
        waitFor: (c) => c.npc('p1').s > 108,
        startDelay: 2.2,
        actions: [
          { delay: 0, do: 'mirror' },
          { delay: 0.6, do: 'right' },
          { delay: 1.2, do: 'look-right' },
          { s: 30, do: 'signal-off' },
        ],
        speed: [
          [0, 14],
          [60, 26],
          [400, 26],
        ],
        holds: [],
      },
    },
    11,
  )
}

// ---- 2. Speed limits -----------------------------------------------------------------------------

export function speedLimits(): Scenario {
  const pts = [V(-LANE, 30), V(-LANE, -340)]
  const z = (s: number) => 30 - s
  const finishS = 350
  return landscape(
    {
      id: 'speed-limits',
      roads: [road(0, 120, 0, -360)],
      discs: [],
      markings: [...dashes(V(0, 120), V(0, -360)), ...solid(V(-3.55, 120), V(-3.55, -360), 0.12), ...solid(V(3.55, 120), V(3.55, -360), 0.12)],
      props: [
        signAt('speed-30', V(-LANE, z(2)), NORTH, 3.2),
        signAt('speed-20', V(-LANE, z(120)), NORTH, 3.2),
        signAt('speed-20', V(-LANE, z(120)), NORTH, -3.2),
        signAt('speed-30', V(-LANE, z(230)), NORTH, 3.2),
      ],
      path: pts,
      start: { x: -LANE, z: 30, h: NORTH, parked: true },
      finishS,
      noLimiter: true,
      limits: [
        { fromS: 0, mph: 30 },
        { fromS: 120, mph: 20 },
        { fromS: 230, mph: 30 },
      ],
      waypoints: [
        { s: 120, label: '20 mph zone starts', icon: 'straight' },
        { s: 230, label: 'Back to 30 mph', icon: 'straight' },
        { s: finishS, label: 'Finish', icon: 'finish' },
      ],
      checks: [
        { id: 'thirty', label: 'Keep to 30 mph or less' },
        { id: 'mirror', label: 'Mirror, then slow for the 20 zone' },
        { id: 'twenty', label: 'Keep to 20 mph in the zone' },
        { id: 'back', label: 'Speed up only when the limit rises' },
      ],
      npcs: [],
      rules(c) {
        const s = c.car.s
        if (s > 90 && s < 120 && c.mirrorAgo < 12) c.tick('mirror')
        if (s > 90 && s < 125 && c.brake > 0.25 && c.car.v > 5 && c.mirrorAgo > 8) c.fault('mirror-speed', {
          category: 'Use of mirrors – change speed',
          title: 'No mirror check before slowing down',
          advice: 'Check your interior mirror before you brake, so you know what is behind you.',
          severity: 'minor',
        })
        if (s > 100 && !c.hasFault('speed-1') && !c.hasFault('speed-serious-1')) c.tick('thirty')
        if (s > 220 && !c.hasFault('speed-2') && !c.hasFault('speed-serious-2')) c.tick('twenty')
        if (s > 300 && !c.hasFault('speed-3') && !c.hasFault('speed-serious-3')) c.tick('back')
      },
      demo: {
        startDelay: 0.5,
        actions: [{ s: 85, do: 'mirror' }],
        speed: [
          [0, 28],
          [95, 28],
          [115, 18.5],
          [225, 18.5],
          [235, 28],
          [400, 28],
        ],
        holds: [],
      },
    },
    22,
  )
}

// ---- 3. Pull up on the left, then move off ---------------------------------------------------------

export function pullUp(): Scenario {
  const bayZ0 = -112
  const bayZ1 = -128
  const pts = join(
    [V(-LANE, 40), V(-LANE, -78)],
    hermite(V(-LANE, -78), V(0, -1), V(-2.55, -108), V(0, -1), 16, 10),
    [V(-2.55, -132)],
    hermite(V(-2.55, -132), V(0, -1), V(-LANE, -160), V(0, -1), 16, 8),
    [V(-LANE, -260)],
  )
  const path = makePath(pts)
  const bayS0 = project(path, V(-2.55, bayZ0)).s
  const bayS1 = project(path, V(-2.55, bayZ1)).s
  const finishS = path.length - 10
  const kerbX = -3.7
  // Cars overtake the stopped learner from well behind the bay: the first a few seconds after the stop,
  // later ones only if the learner is still waiting.
  const behind = (id: string): NpcDef => ({
    id,
    kind: 'car',
    color: id === 'q2' ? '#2f66c8' : '#e0a100',
    path: [V(-0.4, bayZ1 + 95), V(-0.4, -300)],
    speed: 12,
    trigger: (c) => c.mem.stoppedInBay === true && c.mem.moved !== true && c.t - Number(c.mem.stopT ?? 0) > (id === 'q1' ? 2 : id === 'q2' ? 14 : 26),
  })
  return landscape(
    {
      id: 'pull-up',
      roads: [road(0, 120, 0, -280)],
      discs: [],
      markings: [
        ...dashes(V(0, 120), V(0, -280)),
        ...solid(V(-3.55, 120), V(-3.55, -280), 0.12),
        ...solid(V(3.55, 120), V(3.55, -280), 0.12),
        // The bay: a dashed box against the kerb.
        ...dashes(V(-3.3, bayZ0), V(-3.3, bayZ1), { w: 0.14, dash: 1.6, gap: 0.8 }),
        ...dashes(V(-1.4, bayZ0), V(-1.4, bayZ1), { w: 0.14, dash: 1.6, gap: 0.8 }),
        ...solid(V(-3.3, bayZ0), V(-1.4, bayZ0), 0.14),
        ...solid(V(-3.3, bayZ1), V(-1.4, bayZ1), 0.14),
      ],
      props: [signAt('speed-30', V(-LANE, 34), NORTH, 3.2), signAt('parking', V(-LANE, bayZ0 + 24), NORTH, 3.2)],
      path: pts,
      start: { x: -LANE, z: 40, h: NORTH, parked: true },
      finishS,
      limits: [{ fromS: 0, mph: 30 }],
      waypoints: [
        { s: bayS0, label: 'Pull up in the marked bay', icon: 'pullover' },
        { s: finishS, label: 'Finish', icon: 'finish' },
      ],
      checks: [
        { id: 'signal', label: 'Signal left' },
        { id: 'mirror', label: 'Mirror before slowing' },
        { id: 'stop', label: 'Stop in the bay, close to the kerb' },
        { id: 'moveoff', label: 'Mirror, signal and look, then move off' },
      ],
      npcs: [behind('q1'), behind('q2'), behind('q3')],
      rules(c) {
        const s = c.car.s
        // Signal and mirror before pulling in.
        if (s > bayS0 - 70 && s < bayS0 + 2) {
          if (c.signal === 'left') {
            c.tick('signal')
            c.mem.sawLeft = true
          }
          mirrorBeforeSlowing(c, [bayS0 - 80, bayS0 - 2], 'mirror')
        }
        if (s >= bayS0 - 12 && !c.mem.sigChecked) {
          c.mem.sigChecked = true
          if (!c.mem.sawLeft) c.fault('no-left', signalFault('left', 'before pulling up'))
        }
        // The stop.
        if (c.stopped && s > bayS0 - 30 && !c.mem.stoppedInBay && !c.mem.moved) {
          const inBay = s >= bayS0 - 1 && s <= bayS1 + 1
          const gap = c.car.x - 0.9 - kerbX
          if (!inBay) {
            c.fault('bay', {
              category: 'Control – stopping',
              title: s < bayS0 ? 'You stopped short of the bay' : 'You stopped past the bay',
              advice: 'Pick your spot early, slow smoothly and stop with your whole car inside the marked bay.',
              severity: 'minor',
            })
          }
          if (gap > 0.65) {
            c.fault('kerb-gap', {
              category: 'Control – steering',
              title: 'You stopped too far from the kerb',
              advice: 'Steer in gently and aim to stop within about 30 cm (a foot) of the kerb, parallel to it.',
              severity: 'minor',
            })
          }
          c.mem.stoppedInBay = true
          c.mem.stopT = c.t
          if (inBay && gap <= 0.65) c.tick('stop')
          c.toast('Good stop. Now prepare to move off again.', 3)
        }
        if (s > bayS1 + 8 && !c.mem.stoppedInBay && !c.hasFault('bay-missed')) {
          c.fault('bay-missed', {
            category: 'Control – stopping',
            title: 'You drove past the bay without stopping',
            advice: 'The lesson is to pull up. Signal left, slow smoothly and stop with your car inside the bay.',
            severity: 'serious',
          })
        }
        // Moving off again.
        if (c.mem.stoppedInBay && !c.mem.moved && c.car.v > 0.4) {
          c.mem.moved = true
          const approaching = ['q1', 'q2', 'q3'].some((id) => {
            const n = c.npc(id)
            return n.active && !n.done && n.z > c.car.z && n.z - c.car.z < 45
          })
          if (c.mirrorAgo > 7) c.fault('mo-mirror', F.moveMirror)
          if (c.lookAgo.right > 5) c.fault('mo-blind', approaching ? F.moveBlind : F.moveBlindMinor)
          if (c.signal !== 'right' && approaching) c.fault('mo-signal', F.moveSignal)
          c.tick('moveoff')
        }
        if (c.signal === 'right' && c.sinceMoveOff > 0 && c.mem.moved && c.car.s > bayS1 + 25) c.fault('signal-left-on', F.signalOn)
        if (c.signal === 'left' && c.mem.stoppedInBay && c.mem.moved) c.fault('signal-left-on', F.signalOn)
      },
      demo: {
        speed: [
          [0, 24],
          [bayS0 - 70, 24],
          [bayS0 - 20, 8],
          [bayS0 + 4, 5],
          [bayS1 + 6, 22],
          [400, 24],
        ],
        holds: [
          {
            s: bayS0 + 6,
            // Wait for the car behind to overtake, then go.
            until: (c) => c.npc('q1').s > 100,
            then: ['mirror', 'right', 'look-right'],
          },
        ],
        actions: [
          { s: bayS0 - 78, do: 'mirror' },
          { s: bayS0 - 62, do: 'left' },
          { s: bayS1 + 14, do: 'signal-off' },
        ],
      },
    },
    33,
  )
}

export { F, signalFault, giveWayFault, obsFault, approachSpeed, ped }
