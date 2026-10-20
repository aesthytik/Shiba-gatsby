import { useMemo } from 'react'
import { ROAD_HALF, sampleAt, type BuiltRoute } from './build'

const ARM = 55

/** Schematic map drawn from the route's own geometry, so it works offline. North is up. */
export function RouteMap({
  built,
  carS,
  activeStep,
  onSelectStep,
  className = '',
  compact = false,
}: {
  built: BuiltRoute
  carS?: number
  activeStep?: number
  onSelectStep?: (i: number) => void
  className?: string
  compact?: boolean
}) {
  const { bounds: b } = built
  const pad = compact ? 30 : 60
  const vb = { x: b.minX - pad, y: -b.maxY - pad, w: b.maxX - b.minX + pad * 2, h: b.maxY - b.minY + pad * 2 }
  const scale = Math.max(vb.w, vb.h) / 600
  const path = useMemo(() => built.centre.filter((_, i) => i % 3 === 0).map((p) => `${p.x.toFixed(1)},${(-p.y).toFixed(1)}`).join(' '), [built])
  const ego = useMemo(() => built.ego.filter((_, i) => i % 3 === 0).map((e) => `${e.p.x.toFixed(1)},${(-e.p.y).toFixed(1)}`).join(' '), [built])
  const car = carS !== undefined ? sampleAt(built, carS) : undefined
  const hotspots = built.route.hotspots.map((h) => {
    const inst = built.instructions.find((i) => i.seg === h.seg)
    const s = inst?.s ?? built.ego.find((e) => e.seg === h.seg)?.s ?? 0
    return { ...h, p: sampleAt(built, s + (inst ? 0 : 40)).p }
  })
  // Keep roads legible when a long route is shrunk into a thumbnail.
  const roadW = Math.max(ROAD_HALF * 2, 4 * scale)

  return (
    <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className={`block h-full w-full ${className}`} role="img" aria-label={`Map of ${built.route.name}`}>
      <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="var(--c-surface-2)" />
      <g stroke="#9aa3ad" strokeLinecap="round" fill="none" opacity={0.85}>
        {built.junctions
          .filter((j) => j.kind !== 'roundabout')
          .flatMap((j, ji) =>
            j.arms.map((a, ai) => <line key={`${ji}-${ai}`} x1={j.node.x} y1={-j.node.y} x2={j.node.x + a.x * ARM} y2={-(j.node.y + a.y * ARM)} strokeWidth={roadW} />),
          )}
        {built.roundabouts.flatMap((r, ri) =>
          r.arms.map((a, ai) => <line key={`r${ri}-${ai}`} x1={r.centre.x} y1={-r.centre.y} x2={r.centre.x + a.x * (r.radius + ARM)} y2={-(r.centre.y + a.y * (r.radius + ARM))} strokeWidth={roadW} />),
        )}
        <polyline points={path} strokeWidth={roadW} strokeLinejoin="round" />
        {built.roundabouts.map((r, i) => (
          <circle key={i} cx={r.centre.x} cy={-r.centre.y} r={r.radius} strokeWidth={roadW} />
        ))}
      </g>
      {built.roundabouts.map((r, i) => (
        <circle key={i} cx={r.centre.x} cy={-r.centre.y} r={r.radius - ROAD_HALF - 0.5} fill="#7d9c4f" />
      ))}
      <polyline points={ego} fill="none" stroke="var(--c-brand)" strokeWidth={2.4 * scale} strokeLinejoin="round" strokeLinecap="round" />

      {!compact &&
        built.instructions.map((ins, i) => {
          const p = sampleAt(built, ins.s).p
          const active = i === activeStep
          return (
            <g key={i} transform={`translate(${p.x} ${-p.y})`} onClick={() => onSelectStep?.(i)} className={onSelectStep ? 'cursor-pointer' : undefined}>
              <circle r={(active ? 11 : 8) * scale} fill={active ? 'var(--c-brand)' : 'var(--c-surface)'} stroke="var(--c-brand)" strokeWidth={1.6 * scale} />
              <text y={3.6 * scale} textAnchor="middle" fontSize={10 * scale} fontWeight={700} fill={active ? 'var(--c-brand-ink)' : 'var(--c-brand)'}>
                {i + 1}
              </text>
            </g>
          )
        })}
      {!compact &&
        hotspots.map((h, i) => (
          <g key={i} transform={`translate(${h.p.x + 14 * scale} ${-h.p.y - 14 * scale})`}>
            <title>{h.title}</title>
            <path d={`M0 ${-9 * scale} L${8 * scale} ${6 * scale} H${-8 * scale} Z`} fill="var(--c-accent)" stroke="#000" strokeOpacity={0.4} strokeWidth={0.8 * scale} />
            <text y={4 * scale} textAnchor="middle" fontSize={9 * scale} fontWeight={800} fill="#000">
              !
            </text>
          </g>
        ))}

      <g transform={`translate(${built.ego[0].p.x} ${-built.ego[0].p.y})`}>
        <rect x={-9 * scale} y={-9 * scale} width={18 * scale} height={18 * scale} rx={4 * scale} fill="var(--c-ink)" />
        <text y={4 * scale} textAnchor="middle" fontSize={10 * scale} fontWeight={800} fill="var(--c-surface)">
          TC
        </text>
      </g>
      {car && (
        <g transform={`translate(${car.p.x} ${-car.p.y}) rotate(${(-Math.atan2(car.dir.y, car.dir.x) * 180) / Math.PI})`}>
          <circle r={9 * scale} fill="#ff2d55" opacity={0.25} />
          <path d={`M${7 * scale} 0 L${-5 * scale} ${-5 * scale} L${-2 * scale} 0 L${-5 * scale} ${5 * scale} Z`} fill="#ff2d55" stroke="#fff" strokeWidth={1 * scale} />
        </g>
      )}
    </svg>
  )
}
