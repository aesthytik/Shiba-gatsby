import { useMemo } from 'react'
import { makePath, pointAt } from './geometry'
import type { Scenario } from './types'

/** Top-down map of the part of the lesson that matters: roads, your route and other traffic. */
export function ScenarioMap({ scenario, radius = 34, label }: { scenario: Scenario; radius?: number; label?: string }) {
  const { path, focus, learner, others } = useMemo(() => {
    const p = makePath(scenario.path)
    const wp = scenario.waypoints[0]
    const f = pointAt(p, Math.max(0, wp.s - (scenario.id === 'move-off' ? -8 : 2)))
    const learnerPts: string[] = []
    for (let s = Math.max(0, wp.s - radius * 1.4); s <= Math.min(p.length, wp.s + radius * 1.5); s += 1.5) {
      const q = pointAt(p, s)
      learnerPts.push(`${q.x.toFixed(1)},${q.z.toFixed(1)}`)
    }
    const end = pointAt(p, Math.min(p.length, wp.s + radius * 1.5))
    const tail = pointAt(p, Math.min(p.length, wp.s + radius * 1.5 - 4))
    const arrow = { x: end.x, z: end.z, h: Math.atan2(end.x - tail.x, end.z - tail.z) }
    const o = scenario.npcs.map((n) => ({ id: n.id, kind: n.kind, color: n.color, pts: n.path.map((v) => `${v.x.toFixed(1)},${v.z.toFixed(1)}`).join(' ') }))
    return { path: learnerPts.join(' '), focus: f, learner: arrow, others: o }
  }, [scenario, radius])
  const w = radius * 2
  const h = radius * 1.55
  const arrow = learner
  return (
    <svg
      viewBox={`${focus.x - w / 2} ${focus.z - h / 2} ${w} ${h}`}
      className="h-full w-full"
      role="img"
      aria-label={label ?? 'Map of your route: the yellow line is the way you drive, blue dashed lines show other traffic'}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect x={focus.x - w} y={focus.z - h} width={w * 2} height={h * 2} fill="#8cc56a" />
      {scenario.roads.map((r, i) => (
        <line key={i} x1={r.a.x} y1={r.a.z} x2={r.b.x} y2={r.b.z} stroke="#5b6068" strokeWidth={r.width} />
      ))}
      {scenario.discs.map((d, i) => (
        <circle key={i} cx={d.c.x} cy={d.c.z} r={d.r} fill="#5b6068" />
      ))}
      {scenario.island && <circle cx={scenario.island.c.x} cy={scenario.island.c.z} r={scenario.island.r} fill="#f4f4f4" />}
      {scenario.roads.map((r, i) => (
        <line key={`c${i}`} x1={r.a.x} y1={r.a.z} x2={r.b.x} y2={r.b.z} stroke="#f4f4f4" strokeWidth="0.25" strokeDasharray="3 5" opacity="0.8" />
      ))}
      {others
        .filter((o) => o.kind === 'car')
        .map((o) => (
          <polyline key={o.id} points={o.pts} fill="none" stroke="#fff" strokeWidth="0.9" strokeDasharray="2.2 1.8" strokeLinecap="round" opacity="0.95" />
        ))}
      <polyline points={path} fill="none" stroke="#ffc72c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${arrow.x} ${arrow.z}) rotate(${(-arrow.h * 180) / Math.PI + 180})`}>
        <path d="M-2.2 -1 L0 -4 L2.2 -1 Z" fill="#ffc72c" stroke="#ffc72c" strokeWidth="0.6" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
