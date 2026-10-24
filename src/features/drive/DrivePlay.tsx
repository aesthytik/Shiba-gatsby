import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useFrame } from '@react-three/fiber'
import { ArrowBigLeft, ArrowBigRight, ArrowLeft, ArrowRight, ArrowUp, Check, CornerUpLeft, CornerUpRight, Eye, Flag, Footprints, ParkingSquare, Pause, Play, RefreshCw, TriangleAlert, Video } from 'lucide-react'
import { useProgress } from '../../store/progress'
import { DriveCanvas, type CamMode } from './DriveScene'
import { DriveEngine, MPH } from './engine'
import { buildScenario, lessonByN, type Lesson } from './lessons'
import type { DriveInputs } from './useDriveInput'
import { useDriveInputs } from './useDriveInput'
import type { ViewState, Waypoint } from './types'

const ICONS: Record<Waypoint['icon'], typeof ArrowUp> = {
  straight: ArrowUp,
  left: CornerUpLeft,
  right: CornerUpRight,
  roundabout: RefreshCw,
  stop: TriangleAlert,
  finish: Flag,
  crossing: Footprints,
  lights: TriangleAlert,
  pullover: ParkingSquare,
}

export default function DrivePlay() {
  const { n } = useParams()
  const lesson = lessonByN(Number(n))
  const [runKey, setRunKey] = useState(0)
  if (!lesson?.scenario) return <Navigate to="/drive" replace />
  return <Session key={runKey} lesson={lesson} onRestart={() => setRunKey((k) => k + 1)} />
}

interface Hud {
  mph: number
  limit: number
  wp: Waypoint
  dist: number
  checks: ReturnType<DriveEngine['checks']>
  faults: number
  toast?: string
  signal: 'left' | 'right' | null
  mirrorRecent: boolean
  parked: boolean
  seconds: number
  collided: boolean
  moved: boolean
}

function snapshot(e: DriveEngine): Hud {
  const wp = e.nextWaypoint()
  return {
    mph: Math.round(e.car.v / MPH),
    limit: e.limitAt(e.s),
    wp,
    dist: Math.max(0, Math.round(wp.s - e.s)),
    checks: e.checks(),
    faults: e.faults.length,
    toast: e.toastText?.text,
    signal: e.signal,
    mirrorRecent: e.t - e.mirrorAt < 4,
    parked: e.parked,
    seconds: e.t,
    collided: e.collided,
    moved: e.t > 0 && e.s > 1,
  }
}

function Sim({ engine, inputs, view, paused }: { engine: DriveEngine; inputs: DriveInputs; view: { current: ViewState }; paused: { current: boolean } }) {
  useFrame((_, dt) => {
    if (!paused.current && !engine.done) engine.advance(Math.min(dt, 0.05), inputs.read())
    view.current = engine.view()
  })
  return null
}

function Session({ lesson, onRestart }: { lesson: Lesson; onRestart: () => void }) {
  const navigate = useNavigate()
  const settings = useProgress((s) => s.settings)
  const updateSettings = useProgress((s) => s.updateSettings)
  const addRun = useProgress((s) => s.addDriveRun)
  const inputs = useDriveInputs()
  const scenario = useMemo(() => buildScenario(lesson.scenario!), [lesson])
  const engine = useMemo(() => new DriveEngine(scenario, { assist: settings.assist ?? true }), [scenario]) // eslint-disable-line react-hooks/exhaustive-deps
  const view = useRef<ViewState>(engine.view())
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)
  const [cam, setCam] = useState<CamMode>(settings.cameraView ?? 'chase')
  const [hud, setHud] = useState<Hud>(() => snapshot(engine))
  const [fault, setFault] = useState<{ text: string; until: number } | null>(null)
  const seenFaults = useRef(0)
  const finished = useRef(false)
  const assist = settings.assist ?? true
  const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

  const setPause = (v: boolean) => {
    pausedRef.current = v
    setPaused(v)
  }
  useEffect(() => {
    inputs.onPause = () => setPause(!pausedRef.current)
    inputs.onCamera = () =>
      setCam((c) => {
        const next = c === 'chase' ? 'driver' : 'chase'
        updateSettings({ cameraView: next })
        return next
      })
    return () => {
      inputs.onPause = undefined
      inputs.onCamera = undefined
    }
  }, [inputs, updateSettings])

  useEffect(() => {
    const id = window.setInterval(() => {
      setHud(snapshot(engine))
      if (engine.faults.length > seenFaults.current) {
        const f = engine.faults[engine.faults.length - 1]
        seenFaults.current = engine.faults.length
        setFault({ text: `${f.severity === 'minor' ? 'Minor fault' : f.severity === 'serious' ? 'Serious fault' : 'Dangerous'}: ${f.title}`, until: Date.now() + 4200 })
      }
      if (engine.done && !finished.current) {
        finished.current = true
        const o = engine.outcome()
        const runId = `${Date.now()}`
        addRun({
          id: runId,
          n: lesson.n,
          date: Date.now(),
          stars: o.stars,
          status: o.status === 'complete' ? 'complete' : 'failed',
          minors: o.minors,
          serious: o.serious,
          dangerous: o.dangerous,
          seconds: Math.round(o.time),
          topMph: Math.round(o.topMph),
          headline: o.headline,
          faults: o.faults.map((f) => ({ title: f.title, category: f.category, severity: f.severity, advice: f.advice, hc: f.hc })),
        })
        window.setTimeout(() => navigate(`/drive/${lesson.n}/result`, { replace: true, state: { runId } }), engine.collided ? 1500 : 900)
      }
    }, 110)
    return () => window.clearInterval(id)
  }, [engine, lesson.n, navigate, addRun])

  const showFault = assist && fault && fault.until > Date.now() ? fault.text : null
  const Icon = ICONS[hud.wp.icon]
  const mm = Math.floor(hud.seconds / 60)
  const ss = String(Math.floor(hud.seconds % 60)).padStart(2, '0')

  return (
    <div className="fixed inset-0 overflow-hidden bg-sky-200 font-sans text-white select-none">
      <DriveCanvas scenario={scenario} view={view} mode={cam} mirror>
        <Sim engine={engine} inputs={inputs} view={view} paused={pausedRef} />
      </DriveCanvas>

      {/* Instruction and checks */}
      <div className="pointer-events-none absolute top-5 left-5 flex w-[min(300px,42vw)] flex-col gap-2.5">
        <div className="flex items-center gap-3 rounded-2xl bg-[#073d2b]/95 p-2.5 pr-4">
          <span className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-xl bg-white/15">
            <Icon size={28} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-[26px] leading-none font-extrabold">{hud.dist} m</p>
            <p className="mt-1 text-[13px] leading-tight text-[#d5eee3]">{hud.wp.label}</p>
          </div>
        </div>
        <section aria-label="Checks for this lesson" className="hidden rounded-2xl bg-navy/80 px-3.5 py-3 sm:block">
          <h2 className="mb-2 text-[11px] font-bold tracking-[0.08em] text-navy-text uppercase">Checks for this lesson</h2>
          <ul className="flex flex-col gap-1.5">
            {hud.checks.map((c) => (
              <li key={c.id} className="flex items-center gap-2.5 text-[13px]">
                <span
                  className={`grid h-[20px] w-[20px] shrink-0 place-items-center rounded-full border-2 ${
                    c.state === 'done' ? 'border-[#13a36f] bg-[#13a36f] text-[#04140e]' : c.state === 'now' ? 'border-accent' : 'border-[#4a5a70]'
                  }`}
                >
                  {c.state === 'done' && <Check size={11} strokeWidth={4} />}
                </span>
                <span className={`flex-1 ${c.state === 'done' ? 'text-navy-text' : 'text-white'}`}>{c.label}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Mirror frame (the image itself is drawn by the 3D canvas) */}
      <div className="pointer-events-none absolute top-[18px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <div className="h-[70px] w-[280px] rounded-2xl border-4 border-[#1b1e22] shadow-lg shadow-black/30" role="img" aria-label="Rear-view mirror" />
        {hud.mirrorRecent && (
          <span className="flex items-center gap-1.5 rounded-full bg-navy/80 px-3 py-1 text-xs font-bold text-[#9be7c4]">
            <Check size={12} strokeWidth={3.5} /> Mirror checked
          </span>
        )}
        {(showFault || hud.toast) && (
          <div role="status" className="mt-2 flex max-w-[420px] items-center gap-2.5 rounded-xl bg-accent px-4 py-2.5 text-[15px] font-bold text-navy shadow-xl shadow-black/30">
            <TriangleAlert size={20} className="shrink-0" />
            {showFault ?? hud.toast}
          </div>
        )}
      </div>

      {/* Top right */}
      <div className="absolute top-5 right-5 flex items-center gap-2.5">
        <span className="rounded-full bg-navy/80 px-3.5 py-2 text-[13px] font-bold tabular-nums">
          Lesson {lesson.n} · {mm}:{ss}
        </span>
        <button
          type="button"
          aria-label={cam === 'chase' ? 'Switch to driver view (V)' : 'Switch to chase view (V)'}
          onClick={() => inputs.onCamera?.()}
          className="grid h-12 w-12 place-items-center rounded-2xl bg-navy/80 hover:bg-navy"
        >
          <Video size={19} />
        </button>
        <button type="button" aria-label="Pause (Esc)" onClick={() => setPause(true)} className="grid h-12 w-12 place-items-center rounded-2xl bg-navy/80 hover:bg-navy">
          <Pause size={18} fill="currentColor" />
        </button>
      </div>

      {/* Keyboard legend */}
      {!coarse && (
        <section aria-label="Keyboard controls" className="pointer-events-none absolute bottom-5 left-5 hidden grid-cols-[auto_auto] items-center gap-x-3 gap-y-1.5 rounded-2xl bg-navy/80 px-3.5 py-3 text-[13px] lg:grid">
          {[
            ['W / S', 'Accelerate / brake'],
            ['A / D', 'Steer'],
            ['Q / E', 'Indicators'],
            ['X', 'Mirror'],
            ['Z / C', 'Look left / right'],
            ['V', 'Change camera'],
          ].map(([k, v]) => (
            <KeyRow key={k} k={k} v={v} />
          ))}
        </section>
      )}

      {/* Speedometer */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-[20px] bg-navy/85 px-5 py-3">
        <ArrowBigLeft size={28} className={hud.signal === 'left' ? 'animate-pulse text-[#ffa200]' : 'text-[#4a5a70]'} fill="currentColor" aria-label={hud.signal === 'left' ? 'Left indicator on' : 'Left indicator off'} />
        <SpeedSign limit={hud.limit} />
        <div className="min-w-16 text-center">
          <p className="font-display text-[40px] leading-none font-extrabold tabular-nums">{hud.mph}</p>
          <p className="mt-0.5 text-[11px] font-bold tracking-[0.1em] text-navy-text">MPH</p>
        </div>
        <div className="flex gap-1 border-l border-[#3a4a60] pl-4 text-[15px] font-extrabold">
          {(['P', 'R', 'N', 'D'] as const).map((g) => {
            const on = g === (hud.parked ? 'P' : 'D')
            return (
              <span key={g} className={on ? 'rounded-md bg-navy-2 px-1.5 text-white' : 'text-[#4a5a70]'}>
                {g}
              </span>
            )
          })}
        </div>
        <ArrowBigRight size={28} className={hud.signal === 'right' ? 'animate-pulse text-[#ffa200]' : 'text-[#4a5a70]'} fill="currentColor" aria-label={hud.signal === 'right' ? 'Right indicator on' : 'Right indicator off'} />
      </div>

      {/* Assist and faults */}
      <div className="pointer-events-none absolute right-5 bottom-5 hidden flex-col items-end gap-2.5 md:flex">
        {assist && (
          <span className="flex items-center gap-1.5 rounded-full bg-[#0b6e4f]/95 px-3.5 py-2 text-[13px] font-bold">
            <Check size={14} strokeWidth={3} /> Guided steering on
          </span>
        )}
        <span className="rounded-xl bg-navy/80 px-3 py-2 text-[13px] font-semibold text-[#d7dee8]">
          Faults so far: <strong className="text-white">{hud.faults}</strong>
        </span>
      </div>

      {hud.parked && !hud.moved && !paused && (
        <div className="pointer-events-none absolute inset-x-0 bottom-32 flex justify-center">
          <p className="rounded-2xl bg-navy/90 px-5 py-3 text-center text-[15px] font-semibold shadow-xl">
            {lesson.n === 1 || lesson.n === 3 ? 'Read the road, then ' : 'Press '}
            <Key>W</Key> to start driving. Use <Key>X</Key> for your mirror, <Key>Q</Key>/<Key>E</Key> to signal.
          </p>
        </div>
      )}

      {hud.collided && <div className="pointer-events-none absolute inset-0 bg-red-600/35" aria-hidden="true" />}

      {coarse && <TouchControls inputs={inputs} />}

      {paused && (
        <div className="absolute inset-0 grid place-items-center bg-navy/70 p-4 backdrop-blur-sm">
          <div role="dialog" aria-label="Paused" className="w-full max-w-sm rounded-3xl bg-navy p-6 text-white shadow-2xl">
            <h2 className="font-display text-3xl font-extrabold">Paused</h2>
            <p className="mt-1 text-sm text-navy-text">Lesson {lesson.n} · {lesson.title}</p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button type="button" onClick={() => setPause(false)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#13a36f] font-extrabold text-[#04140e]">
                <Play size={16} fill="currentColor" /> Resume
              </button>
              <button type="button" onClick={onRestart} className="min-h-12 rounded-xl bg-navy-2 font-bold">
                Restart lesson
              </button>
              <button type="button" onClick={() => navigate(`/drive/${lesson.n}`)} className="min-h-12 rounded-xl bg-navy-2 font-bold">
                Back to briefing
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-navy-text">Esc also pauses and resumes.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function Key({ children }: { children: ReactNode }) {
  return <kbd className="mx-0.5 rounded-md border border-[#3a4a60] bg-navy-2 px-1.5 py-0.5 text-xs font-bold">{children}</kbd>
}

function KeyRow({ k, v }: { k: string; v: string }) {
  return (
    <>
      <kbd className="rounded-md border border-[#3a4a60] bg-navy-2 px-1.5 py-0.5 text-center text-xs font-bold whitespace-nowrap">{k}</kbd>
      <span className="text-[#d7dee8]">{v}</span>
    </>
  )
}

function SpeedSign({ limit }: { limit: number }) {
  return (
    <svg width="54" height="54" viewBox="0 0 40 40" role="img" aria-label={`Speed limit ${limit}`}>
      <circle cx="20" cy="20" r="18" fill="#fff" stroke="#d0261d" strokeWidth="4" />
      <text x="20" y="25.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="15" fill="#141414">
        {limit}
      </text>
    </svg>
  )
}

/** On-screen controls for phones and tablets. A keyboard or controller is still the best way to drive. */
function TouchControls({ inputs }: { inputs: DriveInputs }) {
  const hold = (key: 'throttle' | 'brake' | 'steer', value: number) => ({
    onPointerDown: (e: RPointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      inputs.touch[key] = value
    },
    onPointerUp: () => (inputs.touch[key] = 0),
    onPointerCancel: () => (inputs.touch[key] = 0),
  })
  const base = 'grid place-items-center rounded-2xl bg-navy/80 font-extrabold text-white touch-none active:bg-navy-2'
  return (
    <>
      <div className="absolute bottom-24 left-4 flex gap-2">
        <button type="button" aria-label="Steer left" className={`${base} h-[72px] w-[72px] rounded-full`} {...hold('steer', 1)}>
          <ArrowLeft size={28} />
        </button>
        <button type="button" aria-label="Steer right" className={`${base} h-[72px] w-[72px] rounded-full`} {...hold('steer', -1)}>
          <ArrowRight size={28} />
        </button>
      </div>
      <div className="absolute right-4 bottom-24 flex items-end gap-2">
        <button type="button" className={`${base} h-[60px] w-[92px] bg-[#b42318]/90 text-sm`} {...hold('brake', 1)}>
          Brake
        </button>
        <button type="button" className={`${base} h-[92px] w-16 bg-[#13a36f]/90 text-sm text-[#04140e]`} {...hold('throttle', 1)}>
          Go
        </button>
      </div>
      <div className="absolute inset-x-2 bottom-2 flex justify-center gap-1.5">
        {[
          { label: '◀ Signal', fn: () => inputs.push({ indicate: 'left' }) },
          { label: 'Look L', fn: () => inputs.push({ look: 'left' }) },
          { label: 'Mirror', fn: () => inputs.push({ mirror: true }), icon: true },
          { label: 'Look R', fn: () => inputs.push({ look: 'right' }) },
          { label: 'Signal ▶', fn: () => inputs.push({ indicate: 'right' }) },
        ].map((b) => (
          <button key={b.label} type="button" onClick={b.fn} className={`${base} min-h-11 px-3 text-xs`}>
            {b.icon ? <Eye size={16} className="mr-1 inline" /> : null}
            {b.label}
          </button>
        ))}
      </div>
    </>
  )
}
