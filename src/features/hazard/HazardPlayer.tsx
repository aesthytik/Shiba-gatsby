import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Eye, Flag, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useProgress } from '../../store/progress'
import { CLIPS, clipById, type Clip } from './clips'
import { ClipScene, type ClipClock } from './ClipScene'
import { BANDS, bandBoundaries, HP_PASS_MARK, scaleTo75, scoreClip, type ClipScore } from './scoring'

type Phase = 'ready' | 'playing' | 'review' | 'replay'

export default function HazardPlayer() {
  const { clipId = '' } = useParams()
  const isMock = clipId === 'mock'
  const sequence = useMemo(() => (isMock ? CLIPS : [clipById(clipId)].filter(Boolean) as Clip[]), [clipId, isMock])
  const [index, setIndex] = useState(0)
  const [mockScores, setMockScores] = useState<ClipScore[]>([])

  if (!sequence.length) {
    return (
      <>
        <PageHeader title="Clip not found" back="/hazard" />
        <ButtonLink to="/hazard">Back to hazard perception</ButtonLink>
      </>
    )
  }

  if (isMock && index >= sequence.length) return <MockSummary scores={mockScores} />

  const clip = sequence[index]
  return (
    <ClipRunner
      key={`${clip.id}-${index}`}
      clip={clip}
      position={isMock ? { index, total: sequence.length } : undefined}
      onNext={
        isMock
          ? (score) => {
              setMockScores((s) => [...s, score])
              setIndex((i) => i + 1)
            }
          : undefined
      }
    />
  )
}

function ClipRunner({ clip, position, onNext }: { clip: Clip; position?: { index: number; total: number }; onNext?: (s: ClipScore) => void }) {
  const navigate = useNavigate()
  const addHazardResult = useProgress((s) => s.addHazardResult)
  const clock = useRef<ClipClock>({ t: 0, playing: false, rate: 1, ended: false }).current
  const [phase, setPhase] = useState<Phase>('ready')
  const [clicks, setClicks] = useState<number[]>([])
  const [score, setScore] = useState<ClipScore | null>(null)
  const [now, setNow] = useState(0)
  const [paused, setPaused] = useState(false)
  const clicksRef = useRef<number[]>([])
  // Dev-only handle so automated screenshots can seek to exact moments.
  if (import.meta.env.DEV) (window as unknown as { __hpClock?: ClipClock }).__hpClock = clock

  const finish = useCallback(() => {
    const s = scoreClip(clip.hazards, clicksRef.current, clip.duration)
    setScore(s)
    addHazardResult({ clipId: clip.id, date: Date.now(), score: s.total, max: s.max, patternFlagged: s.patternFlagged })
    setPhase('review')
  }, [addHazardResult, clip])

  // UI loop: mirror the 3D clock into React state and detect the end of the clip.
  useEffect(() => {
    let raf = 0
    const tick = () => {
      setNow(clock.t)
      if (clock.ended) {
        clock.ended = false
        if (phase === 'playing') finish()
        else if (phase === 'replay') setPaused(true)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clock, finish, phase])

  const start = () => {
    clicksRef.current = []
    setClicks([])
    clock.t = 0
    clock.ended = false
    clock.playing = true
    setPaused(false)
    setPhase('playing')
  }

  const replay = () => {
    clock.t = 0
    clock.ended = false
    clock.playing = true
    setPaused(false)
    setPhase('replay')
  }

  const registerClick = useCallback(() => {
    if (phase !== 'playing') return
    const t = clock.t
    clicksRef.current = [...clicksRef.current, t]
    setClicks(clicksRef.current)
  }, [clock, phase])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && phase === 'playing') {
        e.preventDefault()
        registerClick()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, registerClick])

  useEffect(() => () => void (clock.playing = false), [clock])

  const togglePause = () => {
    clock.playing = paused
    if (paused && clock.t >= clip.duration) clock.t = 0
    setPaused(!paused)
  }

  return (
    <>
      <PageHeader
        title={position ? `Mock test · clip ${position.index + 1} of ${position.total}` : clip.title}
        subtitle={position ? undefined : clip.summary}
        back="/hazard"
      />

      <div className="relative -mx-4 overflow-hidden bg-black md:mx-0 md:rounded-2xl">
        <div className="aspect-[4/3] max-h-[70vh] w-full sm:aspect-video">
          <ClipScene clip={clip} clock={clock} showHazards={phase === 'replay'} />
        </div>

        {phase === 'playing' && (
          <button
            type="button"
            aria-label="Click when you see a developing hazard"
            className="absolute inset-0 cursor-crosshair touch-manipulation"
            onPointerDown={(e) => {
              e.preventDefault()
              registerClick()
            }}
          />
        )}

        {(phase === 'playing' || phase === 'replay') && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-10 items-center gap-1 bg-gradient-to-t from-black/70 to-transparent px-3">
            {(phase === 'playing' ? clicks : score?.hazards.flatMap((h) => (h.clickAt !== undefined ? [h.clickAt] : [])) ?? []).map((_, i) => (
              <Flag key={i} size={18} className="animate-pop fill-red-500 text-red-500" />
            ))}
          </div>
        )}

        {phase === 'replay' && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge tone="bad">
              <Eye size={13} /> Hazards highlighted
            </Badge>
            <button type="button" onClick={togglePause} className="rounded-lg bg-black/60 p-1.5 text-white" aria-label={paused ? 'Play' : 'Pause'}>
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </div>
        )}

        {phase === 'ready' && (
          <div className="absolute inset-0 grid place-items-center bg-black/55 p-4 text-center text-white backdrop-blur-[2px]">
            <div className="max-w-md">
              <p className="text-sm font-semibold tracking-wide text-white/70 uppercase">{clip.title}</p>
              <p className="mt-2 text-base font-semibold sm:text-lg">Click or tap the video (or press Space) as soon as you see a hazard developing.</p>
              <p className="mt-2 text-xs text-white/75 sm:text-sm">
                You score up to 5 points per hazard — the earlier you respond, the more you score. Clicking constantly or in a pattern scores zero.
                {clip.hazards.length > 1 && ' This clip has two hazards.'}
              </p>
              <Button className="mt-4 sm:mt-5" onClick={start}>
                <Play size={16} /> Start clip
              </Button>
            </div>
          </div>
        )}
      </div>

      {(phase === 'playing' || phase === 'replay') && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-brand/60" style={{ width: `${(now / clip.duration) * 100}%` }} />
        </div>
      )}

      {score && (phase === 'review' || phase === 'replay') && (
        <Review
          clip={clip}
          score={score}
          clicks={clicks}
          now={phase === 'replay' ? now : undefined}
          actions={
            <>
              <Button variant="secondary" onClick={replay}>
                <Eye size={16} /> Watch with hazards shown
              </Button>
              {!onNext && (
                <Button variant="secondary" onClick={start}>
                  <RotateCcw size={16} /> Try again
                </Button>
              )}
              {onNext ? (
                <Button onClick={() => onNext(score)}>
                  Next clip <SkipForward size={16} />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const i = CLIPS.findIndex((c) => c.id === clip.id)
                    navigate(i < CLIPS.length - 1 ? `/hazard/${CLIPS[i + 1].id}` : '/hazard')
                  }}
                >
                  Next clip <SkipForward size={16} />
                </Button>
              )}
            </>
          }
        />
      )}
    </>
  )
}

const BAND_COLOURS = ['#15803d', '#65a30d', '#ca8a04', '#ea580c', '#dc2626']

function Review({ clip, score, clicks, now, actions }: { clip: Clip; score: ClipScore; clicks: number[]; now?: number; actions: React.ReactNode }) {
  const pct = (t: number) => `${(t / clip.duration) * 100}%`
  return (
    <Card className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wide text-muted uppercase">Your score</p>
          <p className="text-3xl font-extrabold text-ink">
            {score.total}
            <span className="text-lg text-muted">/{score.max}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      {score.patternFlagged && (
        <p className="mt-4 rounded-xl bg-bad-soft p-3 text-sm text-ink">
          <strong className="text-bad">Scored zero: {score.patternReason?.toLowerCase()}.</strong> In the real test, clicking continuously or in a pattern scores zero for the clip. Click
          once or twice when you see a hazard start to develop.
        </p>
      )}

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Timeline</p>
        <div className="relative h-12 rounded-lg bg-surface-2">
          {clip.hazards.map((h) => {
            const b = bandBoundaries(h)
            return b.slice(0, BANDS).map((t0, i) => (
              <div
                key={`${h.id}-${i}`}
                className="absolute top-0 h-full opacity-85"
                style={{ left: pct(t0), width: pct(b[i + 1] - t0), background: BAND_COLOURS[i] }}
                title={`${BANDS - i} points`}
              />
            ))
          })}
          {clicks.map((t, i) => (
            <Flag key={i} size={16} className="absolute -top-1 -translate-x-0.5 fill-ink text-ink" style={{ left: pct(t) }} />
          ))}
          {now !== undefined && <div className="absolute top-0 h-full w-0.5 bg-ink" style={{ left: pct(now) }} />}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted">
          <span>0s</span>
          <span>{clip.duration}s</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
          {BAND_COLOURS.map((c, i) => (
            <span key={c} className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} /> {BANDS - i} pts
            </span>
          ))}
          <span className="flex items-center gap-1">
            <Flag size={11} className="fill-ink" /> your clicks
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {clip.hazards.map((h) => {
          const r = score.hazards.find((x) => x.id === h.id)!
          return (
            <div key={h.id} className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink">{h.label}</p>
                <Badge tone={r.points >= 4 ? 'ok' : r.points >= 1 ? 'warn' : 'bad'}>{r.points} / 5</Badge>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{h.explain}</p>
              <p className="mt-2 text-xs text-muted">
                {r.clickAt !== undefined ? `You responded at ${r.clickAt.toFixed(1)}s. ` : 'You did not respond inside the scoring window. '}
                Scoring window {h.start.toFixed(1)}s – {h.end.toFixed(1)}s.
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function MockSummary({ scores }: { scores: ClipScore[] }) {
  const total = scores.reduce((a, s) => a + s.total, 0)
  const max = scores.reduce((a, s) => a + s.max, 0)
  const scaled = scaleTo75(total, max)
  const passed = scaled >= HP_PASS_MARK
  return (
    <>
      <PageHeader title="Hazard perception mock: results" back="/hazard" />
      <Card className={`text-center ${passed ? 'border-ok' : 'border-bad'}`}>
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">Scaled to the real test</p>
        <p className="mt-2 text-5xl font-extrabold text-ink">
          {scaled}
          <span className="text-2xl text-muted">/75</span>
        </p>
        <p className={`mt-1 text-lg font-bold ${passed ? 'text-ok' : 'text-bad'}`}>{passed ? 'Pass' : 'Below the pass mark'}</p>
        <p className="mt-1 text-sm text-muted">
          Raw score {total}/{max} across {scores.length} clips. The pass mark is {HP_PASS_MARK}/75.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <ButtonLink to="/hazard">Back to clips</ButtonLink>
        </div>
      </Card>
    </>
  )
}
