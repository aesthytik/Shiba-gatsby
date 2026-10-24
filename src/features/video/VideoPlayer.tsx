import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useFrame } from '@react-three/fiber'
import { Captions, Pause, Play, RotateCcw } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { DriveCanvas, type CamMode } from '../drive/DriveScene'
import { buildScenario } from '../drive/lessons'
import type { ViewState } from '../drive/types'
import { useProgress } from '../../store/progress'
import { formatClock } from '../../lib/random'
import { buildReplay, frameAt, lessonForVideo, VIDEOS, videoById, type Replay } from './videos'

interface Clock {
  t: number
  playing: boolean
  rate: number
}

function ReplayDriver({ replay, clock, view }: { replay: Replay; clock: Clock; view: { current: ViewState } }) {
  useFrame((_, dt) => {
    if (clock.playing) {
      clock.t = Math.min(replay.duration, clock.t + Math.min(dt, 0.1) * clock.rate)
      if (clock.t >= replay.duration) clock.playing = false
    }
    view.current = frameAt(replay, clock.t)
  })
  return null
}

const MODES: { id: CamMode; label: string }[] = [
  { id: 'top', label: 'Overhead' },
  { id: 'chase', label: 'Behind' },
  { id: 'driver', label: 'Driver view' },
]

export default function VideoPlayer() {
  const { id } = useParams()
  const def = videoById(id)
  if (!def) return <PageHeader title="Video not found" back="/watch" />
  return <Player key={def.id} id={def.id} />
}

function Player({ id }: { id: string }) {
  const def = videoById(id)!
  const lesson = lessonForVideo(id)
  const replay = useMemo(() => buildReplay(def), [def])
  const scenario = useMemo(() => buildScenario(lesson?.scenario ?? id), [lesson, id])
  const markWatched = useProgress((s) => s.markWatched)
  const watched = useProgress((s) => s.watched)
  const clock = useRef<Clock>({ t: 0, playing: false, rate: 1 })
  const view = useRef<ViewState>(frameAt(replay, 0))
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [mode, setMode] = useState<CamMode>('top')
  const [rate, setRate] = useState(1)
  const [cc, setCc] = useState(true)
  const marked = useRef(false)

  useEffect(() => {
    const iv = window.setInterval(() => {
      setT(clock.current.t)
      setPlaying(clock.current.playing)
      if (!marked.current && clock.current.t > replay.duration * 0.8) {
        marked.current = true
        markWatched(id)
      }
    }, 100)
    return () => window.clearInterval(iv)
  }, [replay, id, markWatched])

  const toggle = () => {
    if (clock.current.t >= replay.duration - 0.05) clock.current.t = 0
    clock.current.playing = !clock.current.playing
    setPlaying(clock.current.playing)
  }
  const seek = (v: number) => {
    clock.current.t = Math.max(0, Math.min(replay.duration, v))
    setT(clock.current.t)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLAnchorElement)) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const chapter = replay.chapterTimes.reduce((acc, ct, i) => (ct <= t + 0.01 ? i : acc), 0)
  const cur = def.chapters[chapter]
  const ended = t >= replay.duration - 0.05
  const others = VIDEOS.filter((v) => v.id !== id).slice(0, 4)

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted">
        <Link to="/watch" className="font-semibold text-brand">
          Watch
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="font-semibold text-ink">{def.title}</span>
      </nav>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_600px] flex-col gap-4">
          <figure className="overflow-hidden rounded-[22px] bg-navy">
            <div className="relative aspect-video overflow-hidden bg-[#bfe4f6]">
              <DriveCanvas scenario={scenario} view={view} mode={mode} mirror={mode !== 'top'}>
                <ReplayDriver replay={replay} clock={clock.current} view={view} />
              </DriveCanvas>
              <div className="absolute top-3.5 left-3.5 rounded-xl bg-navy/85 px-3 py-1.5 text-[13px] font-bold text-white">
                Chapter {chapter + 1} · {cur.title}
              </div>
              {cc && (
                <p className="absolute bottom-4 left-1/2 w-[min(86%,640px)] -translate-x-1/2 rounded-lg bg-black/80 px-4 py-2 text-center text-[15px] leading-snug font-medium text-white md:text-[17px]" aria-live="polite">
                  {cur.caption}
                </p>
              )}
              {!playing && (
                <button type="button" onClick={toggle} aria-label={ended ? 'Replay' : 'Play'} className="absolute inset-0 grid place-items-center bg-navy/20 text-white transition hover:bg-navy/30">
                  <span className="grid h-20 w-20 place-items-center rounded-full bg-white/95 text-navy shadow-xl">
                    {ended ? <RotateCcw size={30} /> : <Play size={32} fill="currentColor" className="ml-1" />}
                  </span>
                </button>
              )}
            </div>
            <figcaption className="flex flex-col gap-2.5 px-4 pt-3 pb-3.5 text-white">
              <div className="relative h-5">
                <div className="absolute top-2 right-0 left-0 h-1.5 rounded-full bg-[#33445c]">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(t / replay.duration) * 100}%` }} />
                  {replay.chapterTimes.slice(1).map((ct, i) => (
                    <span key={i} className="absolute top-[-3px] h-3 w-0.5 bg-navy" style={{ left: `${(ct / replay.duration) * 100}%` }} aria-hidden="true" />
                  ))}
                </div>
                <input
                  type="range"
                  min={0}
                  max={replay.duration}
                  step={0.1}
                  value={t}
                  onChange={(e) => seek(Number(e.target.value))}
                  aria-label="Seek"
                  aria-valuetext={`${formatClock(t)} of ${formatClock(replay.duration)}`}
                  className="absolute inset-0 h-5 w-full cursor-pointer opacity-0"
                />
                <span className="pointer-events-none absolute top-0.5 h-4 w-4 -translate-x-1/2 rounded-full bg-white" style={{ left: `${(t / replay.duration) * 100}%` }} aria-hidden="true" />
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="grid h-[42px] w-[42px] place-items-center rounded-full bg-white text-navy">
                  {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                <button type="button" onClick={() => seek(t - 5)} aria-label="Back 5 seconds" className="grid h-10 w-10 place-items-center rounded-[10px] bg-navy-2">
                  <RotateCcw size={17} />
                </button>
                <span className="text-sm text-[#d7dee8] tabular-nums">
                  {formatClock(t)} / {formatClock(replay.duration)}
                </span>
                <span className="flex-1" />
                <div role="group" aria-label="Camera" className="flex rounded-[10px] bg-navy-2 p-[3px]">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={mode === m.id}
                      onClick={() => setMode(m.id)}
                      className={`min-h-[34px] rounded-lg px-3 text-[13px] font-semibold ${mode === m.id ? 'bg-white text-navy' : 'text-[#d7dee8]'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = rate === 1 ? 0.5 : 1
                    setRate(next)
                    clock.current.rate = next
                  }}
                  aria-label={`Playback speed ${rate}×`}
                  className="min-h-10 rounded-[10px] bg-navy-2 px-3 text-[13px] font-bold"
                >
                  {rate}×
                </button>
                <button type="button" aria-pressed={cc} aria-label="Captions" onClick={() => setCc(!cc)} className={`grid h-10 min-w-10 place-items-center rounded-[10px] px-2 ${cc ? 'bg-white text-navy' : 'bg-navy-2'}`}>
                  <Captions size={19} />
                </button>
              </div>
            </figcaption>
          </figure>

          <div>
            <h1 className="font-display text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em]">{def.title}</h1>
            <p className="mt-2 max-w-[680px] text-[15px] leading-relaxed text-ink/80">{def.blurb}</p>
            <p className="mt-2 text-[13px] text-muted">
              {def.hc} · Animated 3D{watched[id] ? ' · You have watched this' : ''}
            </p>
          </div>

          {lesson && (
            <section aria-labelledby="try-h" className="flex flex-wrap items-center gap-4 rounded-[22px] bg-brand p-5 text-white md:px-6">
              <div className="min-w-0 flex-[1_1_320px]">
                <h2 id="try-h" className="text-xl font-extrabold">
                  Now try it yourself
                </h2>
                <p className="mt-1 text-sm text-[#d6efe3]">
                  Drive this in Lesson {lesson.n}. It takes about 2 minutes.
                </p>
              </div>
              <Link to={`/drive/${lesson.n}`} className="flex min-h-12 items-center rounded-2xl bg-accent px-6 text-[15px] font-extrabold text-navy">
                Drive it
              </Link>
              <Link to="/watch" className="flex min-h-12 items-center rounded-2xl bg-white/15 px-5 text-[15px] font-bold text-white">
                More videos
              </Link>
            </section>
          )}
        </div>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          <section aria-labelledby="ch-h" className="rounded-3xl border border-line bg-surface p-4.5">
            <h2 id="ch-h" className="mb-2.5 text-base font-extrabold">
              Chapters
            </h2>
            <ol className="flex flex-col gap-1.5">
              {def.chapters.map((c, i) => (
                <li key={c.title}>
                  <button
                    type="button"
                    aria-current={i === chapter}
                    onClick={() => {
                      seek(replay.chapterTimes[i])
                      clock.current.playing = true
                      setPlaying(true)
                    }}
                    className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${i === chapter ? 'bg-brand-soft font-bold' : 'hover:bg-surface-2'}`}
                  >
                    <span className={`w-9 text-[13px] font-bold tabular-nums ${i === chapter ? 'text-brand' : 'text-muted'}`}>{formatClock(replay.chapterTimes[i])}</span>
                    <span className="flex-1">{c.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="key-h" className="rounded-3xl border border-[#f2dfae] bg-[#fff8e6] p-4.5 text-[#1c1a12]">
            <h2 id="key-h" className="mb-2 text-base font-extrabold">
              Remember
            </h2>
            <ul className="list-disc space-y-1 pl-4.5 text-sm leading-relaxed text-[#3d4a5c]">
              {def.remember.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="rel-h" className="rounded-3xl border border-line bg-surface p-4.5">
            <h2 id="rel-h" className="mb-2.5 text-base font-extrabold">
              More to watch
            </h2>
            <ul className="flex flex-col gap-2.5">
              {others.map((v) => (
                <li key={v.id}>
                  <Link to={`/watch/${v.id}`} className="flex items-center gap-3 rounded-xl p-1 hover:bg-surface-2">
                    <span className="grid h-[50px] w-[86px] shrink-0 place-items-center rounded-[10px] bg-brand text-white">
                      <Play size={16} fill="currentColor" />
                    </span>
                    <span className="text-sm leading-snug font-semibold">{v.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}
