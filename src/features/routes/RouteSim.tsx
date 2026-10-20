import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUp, Camera, CheckCircle2, ClipboardList, Pause, Play, RotateCcw, RotateCw, TriangleAlert, Volume2, VolumeX } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { RoadSign } from '../../components/signs/RoadSign'
import type { SignId } from '../../components/signs/signs'
import { useProgress } from '../../store/progress'
import { formatClock } from '../../lib/random'
import { toMph } from '../../sim/motion'
import { sampleAt, stateAt, type BuiltRoute, type Instruction } from './build'
import { RouteMap } from './RouteMap'
import { RouteScene, type CameraMode, type RouteClock } from './RouteScene'

const MODES: { id: CameraMode; label: string }[] = [
  { id: 'driver', label: 'Driver' },
  { id: 'chase', label: 'Follow' },
  { id: 'top', label: 'Overhead' },
]

function InstructionIcon({ ins, size = 26 }: { ins: Instruction; size?: number }) {
  if (ins.icon === 'left') return <ArrowLeft size={size} />
  if (ins.icon === 'right') return <ArrowRight size={size} />
  if (ins.icon === 'ahead') return <ArrowUp size={size} />
  if (ins.icon === 'task') return <ClipboardList size={size} />
  return (
    <span className="relative">
      <RotateCw size={size} />
      <span className="absolute -right-2 -bottom-1 rounded bg-white px-1 text-[10px] font-extrabold text-black">{ins.exit}</span>
    </span>
  )
}

export { InstructionIcon }

function limitSign(limit: number): SignId {
  return limit === 60 ? 'national-speed-limit' : (`speed-${limit}` as SignId)
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-GB'
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang === 'en-GB')
  if (voice) u.voice = voice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

export function RouteSim({ built, onExit }: { built: BuiltRoute; onExit: () => void }) {
  const clock = useRef<RouteClock>({ t: 0, playing: true, rate: 1 }).current
  const [mode, setMode] = useState<CameraMode>('driver')
  const [now, setNow] = useState(0)
  const [rate, setRate] = useState(1)
  const [playing, setPlaying] = useState(true)
  const voice = useProgress((s) => s.settings.voice)
  const updateSettings = useProgress((s) => s.updateSettings)
  const markRouteDriven = useProgress((s) => s.markRouteDriven)
  const spoken = useRef(new Set<number>())
  const finished = useRef(false)

  if (import.meta.env.DEV) (window as unknown as { __routeClock?: RouteClock }).__routeClock = clock

  useEffect(() => {
    let raf = 0
    const tick = () => {
      setNow(clock.t)
      setPlaying(clock.playing)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clock.playing = false
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [clock])

  const st = stateAt(built, now)
  const nextIdx = built.instructions.findIndex((i) => (i.until ?? i.s) > st.s - (i.icon === 'task' ? 0 : 8))
  const next = nextIdx >= 0 ? built.instructions[nextIdx] : undefined
  const dist = next ? Math.max(0, next.s - st.s) : 0
  const limit = sampleAt(built, st.s).limit
  const done = now >= built.duration

  // Spoken directions: announce each instruction once, earlier on faster roads.
  useEffect(() => {
    if (!next || !voice || !clock.playing) return
    const lead = limit >= 40 ? 160 : 110
    if (dist < lead && !spoken.current.has(nextIdx)) {
      spoken.current.add(nextIdx)
      speak(next.icon === 'task' ? next.text : `In ${Math.max(50, Math.round(dist / 50) * 50)} metres, ${next.text.charAt(0).toLowerCase()}${next.text.slice(1)}`)
    }
  }, [clock, dist, limit, next, nextIdx, voice])

  useEffect(() => {
    if (done && !finished.current) {
      finished.current = true
      markRouteDriven(built.route.id)
    }
  }, [built.route.id, done, markRouteDriven])

  const hotspot = built.route.hotspots
    .map((h) => ({ h, s: built.instructions.find((i) => i.seg === h.seg)?.s ?? built.ego.find((e) => e.seg === h.seg)?.s ?? 0 }))
    .find(({ s }) => s - st.s < 90 && s - st.s > -25)

  const restart = () => {
    clock.t = 0
    clock.playing = true
    finished.current = false
    spoken.current.clear()
  }

  return (
    <div>
      <div className="relative -mx-4 overflow-hidden bg-black md:mx-0 md:rounded-2xl">
        <div className="aspect-[4/3] max-h-[74vh] w-full sm:aspect-video">
          <RouteScene built={built} clock={clock} mode={mode} />
        </div>

        {next && !done && (
          <div className="absolute top-3 left-3 flex max-w-[78%] items-center gap-3 rounded-xl bg-[#0b3d2c]/90 p-3 text-white shadow-lg backdrop-blur sm:max-w-md">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white/15">
              <InstructionIcon ins={next} />
            </span>
            <span className="min-w-0">
              <span className="block text-xl leading-none font-extrabold">{next.icon === 'task' ? 'Examiner' : dist < 15 ? 'Now' : `${Math.round(dist / 10) * 10} m`}</span>
              <span className="mt-1 block text-sm leading-snug text-white/85">{next.text}</span>
            </span>
          </div>
        )}

        {hotspot && !done && (
          <div className="absolute top-3 right-3 hidden max-w-xs rounded-xl bg-accent/95 p-3 text-black shadow-lg md:block">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <TriangleAlert size={15} /> {hotspot.h.title}
            </p>
            <p className="mt-1 text-xs leading-snug">{hotspot.h.note}</p>
          </div>
        )}

        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-black/60 p-2 pr-3 text-white backdrop-blur">
          <RoadSign id={limitSign(limit)} size={40} />
          <span>
            <span className="block text-2xl leading-none font-extrabold tabular-nums">{Math.round(toMph(st.v))}</span>
            <span className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">mph</span>
          </span>
        </div>

        <div className="absolute right-3 bottom-3 hidden h-36 w-36 overflow-hidden rounded-xl border-2 border-white/70 bg-surface-2 shadow-lg sm:block">
          <RouteMap built={built} carS={st.s} compact />
        </div>

        {done && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 p-4 text-center text-white">
            <div>
              <CheckCircle2 size={44} className="animate-pop mx-auto text-emerald-400" />
              <p className="mt-2 text-xl font-bold">Route complete</p>
              <p className="mt-1 text-sm text-white/80">
                {(built.length / 1609).toFixed(1)} miles · {built.instructions.length} directions
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button onClick={restart}>
                  <RotateCcw size={16} /> Drive again
                </Button>
                <Button variant="secondary" onClick={onExit}>
                  Back to route
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button className="px-3" onClick={() => (done ? restart() : (clock.playing = !clock.playing))} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        <Button variant="secondary" className="px-3" onClick={restart} aria-label="Restart">
          <RotateCcw size={16} />
        </Button>
        <input
          type="range"
          min={0}
          max={built.duration}
          step={0.5}
          value={now}
          onChange={(e) => {
            clock.t = Number(e.target.value)
            spoken.current.clear()
          }}
          className="min-w-32 flex-1 accent-[var(--c-brand)]"
          aria-label="Position along the route"
        />
        <span className="w-24 text-right font-mono text-xs text-muted">
          {formatClock(now)} / {formatClock(built.duration)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1 text-sm">
          {[1, 2, 4].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                clock.rate = r
                setRate(r)
              }}
              className={`rounded-lg px-2.5 py-1 font-semibold ${rate === r ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}
            >
              {r}×
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1 text-sm">
          {MODES.map((m) => (
            <button key={m.id} type="button" onClick={() => setMode(m.id)} className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold ${mode === m.id ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}>
              {m.id === 'driver' && <Camera size={14} />} {m.label}
            </button>
          ))}
        </div>
        <Button variant="ghost" onClick={() => updateSettings({ voice: !voice })} aria-pressed={voice}>
          {voice ? <Volume2 size={16} /> : <VolumeX size={16} />} {voice ? 'Voice on' : 'Voice off'}
        </Button>
        <Button variant="ghost" className="ml-auto" onClick={onExit}>
          Exit drive
        </Button>
      </div>
    </div>
  )
}
