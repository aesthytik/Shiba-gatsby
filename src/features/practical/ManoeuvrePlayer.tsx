import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { poseAtProgress, type Manoeuvre, type StaticCar } from '../../data/manoeuvres'

const RATE = 0.65 // keyframes per second

function CarShape({ x, y, h, color, learner, reversing }: StaticCar & { learner?: boolean; reversing?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${h})`}>
      <rect x={-2.1} y={-0.9} width={4.2} height={1.8} rx={0.45} fill={color} stroke="rgba(0,0,0,.35)" strokeWidth={0.05} />
      <rect x={0.35} y={-0.75} width={0.85} height={1.5} rx={0.2} fill="#1c2530" opacity={0.85} />
      <rect x={-1.55} y={-0.72} width={0.6} height={1.44} rx={0.18} fill="#1c2530" opacity={0.75} />
      <rect x={1.95} y={-0.75} width={0.12} height={0.35} fill="#fff6c8" />
      <rect x={1.95} y={0.4} width={0.12} height={0.35} fill="#fff6c8" />
      <rect x={-2.08} y={-0.75} width={0.12} height={0.35} fill={reversing ? '#ffffff' : '#e3262e'} />
      <rect x={-2.08} y={0.4} width={0.12} height={0.35} fill={reversing ? '#ffffff' : '#e3262e'} />
      {learner && (
        <g transform="translate(-0.2 0)">
          <rect x={-0.3} y={-0.3} width={0.6} height={0.6} rx={0.06} fill="#fff" />
          <path d="M-0.12 -0.2 V0.18 H0.15" stroke="#d4111e" strokeWidth={0.1} fill="none" />
        </g>
      )}
    </g>
  )
}

function Scenery({ m }: { m: Manoeuvre }) {
  const { x, y, w, h } = m.view
  if (m.scenery === 'kerb')
    return (
      <>
        <rect x={x} y={y} width={w} height={-y} fill="var(--c-surface-2)" />
        <rect x={x} y={0} width={w} height={h + y} fill="#4b4f55" />
        <rect x={x} y={-0.12} width={w} height={0.24} fill="#9aa0a6" />
      </>
    )
  if (m.scenery === 'bays')
    return (
      <>
        <rect x={x} y={y} width={w} height={h} fill="#4b4f55" />
        <rect x={x} y={y} width={w} height={-5 - y} fill="var(--c-surface-2)" />
        {Array.from({ length: 9 }, (_, i) => -9.1 + i * 2.6).map((bx) => (
          <rect key={bx} x={bx - 0.05} y={-5} width={0.1} height={5} fill="#f2f2f2" />
        ))}
        <rect x={-1.3} y={-5} width={2.6} height={5} fill="var(--c-accent)" opacity={0.18} />
      </>
    )
  return (
    <>
      <rect x={x} y={y} width={w} height={-y} fill="var(--c-surface-2)" />
      <rect x={x} y={0} width={w} height={7} fill="#4b4f55" />
      <rect x={x} y={7} width={w} height={h + y - 7} fill="var(--c-surface-2)" />
      {Array.from({ length: 12 }, (_, i) => x + i * 3).map((dx) => (
        <rect key={dx} x={dx} y={3.44} width={1.6} height={0.12} fill="#f2f2f2" />
      ))}
    </>
  )
}

export function ManoeuvrePlayer({ m }: { m: Manoeuvre }) {
  const last = m.poses.length - 1
  const [u, setU] = useState(0)
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)

  useEffect(() => {
    if (!playing) return
    let prev = performance.now()
    const tick = (now: number) => {
      const dt = (now - prev) / 1000
      prev = now
      setU((v) => {
        const nv = Math.min(last, v + dt * RATE)
        if (nv >= last) setPlaying(false)
        return nv
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [last, playing])

  const stepIndex = Math.max(0, m.steps.findIndex((s) => u < s.to - 1e-6 || s.to === last))
  const step = m.steps[stepIndex]
  const pose = poseAtProgress(m.poses, u)
  const trail = useMemo(() => Array.from({ length: last * 12 + 1 }, (_, i) => poseAtProgress(m.poses, i / 12)), [last, m.poses])

  const goToStep = (i: number) => {
    setPlaying(false)
    const clamped = Math.max(0, Math.min(m.steps.length - 1, i))
    setU(clamped === 0 ? 0 : m.steps[clamped - 1].to)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <svg viewBox={`${m.view.x} ${m.view.y} ${m.view.w} ${m.view.h}`} className="block w-full" role="img" aria-label={`${m.name} animation`}>
          <Scenery m={m} />
          {m.parked.map((c, i) => (
            <CarShape key={i} {...c} />
          ))}
          <polyline points={trail.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--c-accent)" strokeWidth={0.08} strokeDasharray="0.3 0.25" opacity={0.8} />
          <CarShape x={pose.x} y={pose.y} h={pose.h} color="#f5f5f5" learner reversing={!!step?.reverse && playing} />
        </svg>
        <div className="flex items-center gap-2 border-t border-line p-3">
          <Button variant="secondary" className="px-3" onClick={() => goToStep(stepIndex - 1)} aria-label="Previous step">
            <ChevronLeft size={16} />
          </Button>
          <Button
            className="px-4"
            onClick={() => {
              if (u >= last) setU(0)
              setPlaying(!playing)
            }}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause' : u >= last ? 'Replay' : 'Play'}
          </Button>
          <Button variant="secondary" className="px-3" onClick={() => goToStep(stepIndex + 1)} aria-label="Next step">
            <ChevronRight size={16} />
          </Button>
          <Button variant="ghost" className="ml-auto px-3" onClick={() => goToStep(0)} aria-label="Restart">
            <RotateCcw size={16} />
          </Button>
        </div>
      </div>

      <ol className="space-y-2">
        {m.steps.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => goToStep(i)}
              className={`w-full rounded-xl border p-3 text-left transition ${i === stepIndex ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:bg-surface-2'}`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${i === stepIndex ? 'bg-brand text-brand-ink' : 'bg-surface-2 text-muted'}`}>{i + 1}</span>
                {s.title}
                {s.reverse && <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted">REVERSE</span>}
              </p>
              {i === stepIndex && <p className="mt-1.5 pl-8 text-sm leading-relaxed text-muted">{s.detail}</p>}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
