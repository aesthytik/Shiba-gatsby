import { useEffect, useRef, useState } from 'react'
import { Hand, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { VEHICLE_QUESTIONS, type VehicleQuestion } from '../../data/practical'
import { mph } from '../../sim/motion'

const LETTERS = 'ABCDEFGHJKLMNOPRSTUVWXY'

function randomPlate() {
  const l = () => LETTERS[Math.floor(Math.random() * LETTERS.length)]
  const age = ['24', '74', '25', '75', '26', '76'][Math.floor(Math.random() * 6)]
  return `${l()}${l()}${age} ${l()}${l()}${l()}`
}

export function NumberPlate({ text, rear = true, size = 'md' }: { text: string; rear?: boolean; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex items-stretch overflow-hidden rounded-md border-2 border-black/70 font-extrabold tracking-wider text-black shadow-sm ${rear ? 'bg-[#f7c600]' : 'bg-white'} ${
        size === 'sm' ? 'text-lg' : 'text-3xl md:text-4xl'
      }`}
      style={{ fontFamily: 'var(--font-plate)' }}
    >
      <span className="flex w-6 items-end justify-center bg-[#0b4ea2] pb-1 text-[10px] font-bold text-white md:w-8">UK</span>
      <span className="px-3 py-1.5 md:px-4">{text}</span>
    </span>
  )
}

export function EyesightWidget() {
  const [plate, setPlate] = useState(randomPlate)
  return (
    <div className="rounded-xl bg-surface-2 p-4 text-center">
      <NumberPlate text={plate} />
      <p className="mt-3 text-sm text-muted">On test day you read a plate like this from 20 metres — about five car lengths. Practise by pacing it out in a car park.</p>
      <Button variant="ghost" className="mt-2" onClick={() => setPlate(randomPlate())}>
        <RefreshCw size={15} /> New plate
      </Button>
    </div>
  )
}

export function VehicleQuestionCard({ kind }: { kind: 'tell' | 'show' }) {
  const pool = VEHICLE_QUESTIONS.filter((q) => q.kind === kind)
  const pick = () => pool[Math.floor(Math.random() * pool.length)]
  const [q, setQ] = useState<VehicleQuestion>(pick)
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl bg-surface-2 p-4">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{kind === 'tell' ? "Example 'tell me' question" : "Example 'show me' question"}</p>
      <p className="mt-1.5 font-semibold text-ink">{q.q}</p>
      {open ? <p className="mt-2 text-sm leading-relaxed text-ink">{q.a}</p> : null}
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" onClick={() => setOpen(!open)}>
          {open ? 'Hide answer' : 'Show answer'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setQ(pick())
            setOpen(false)
          }}
        >
          <RefreshCw size={15} /> Another
        </Button>
      </div>
    </div>
  )
}

type ReactionState = { phase: 'idle' } | { phase: 'waiting' } | { phase: 'go'; at: number } | { phase: 'done'; ms: number } | { phase: 'early' }

/** Emergency-stop reaction timer: shows how far you travel before you even start braking. */
export function ReactionWidget() {
  const [s, setS] = useState<ReactionState>({ phase: 'idle' })
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const start = () => {
    setS({ phase: 'waiting' })
    timer.current = window.setTimeout(() => setS({ phase: 'go', at: performance.now() }), 1500 + Math.random() * 2500)
  }
  const press = () => {
    if (s.phase === 'waiting') {
      window.clearTimeout(timer.current)
      setS({ phase: 'early' })
    } else if (s.phase === 'go') setS({ phase: 'done', ms: Math.round(performance.now() - s.at) })
  }

  const active = s.phase === 'waiting' || s.phase === 'go'
  return (
    <div className="rounded-xl bg-surface-2 p-4">
      <button
        type="button"
        onPointerDown={active ? press : undefined}
        onClick={!active ? start : undefined}
        className={`grid h-40 w-full place-items-center rounded-xl text-center font-bold transition select-none ${
          s.phase === 'go' ? 'bg-bad text-white' : s.phase === 'waiting' ? 'bg-ink/80 text-white' : 'bg-surface text-ink'
        }`}
      >
        {s.phase === 'idle' && <span>Tap to start, then tap again the moment the examiner says STOP</span>}
        {s.phase === 'waiting' && <span className="text-white/80">Driving… wait for it</span>}
        {s.phase === 'go' && (
          <span className="flex flex-col items-center gap-1 text-3xl">
            <Hand size={44} /> STOP!
          </span>
        )}
        {s.phase === 'early' && <span>Too soon! Tap to try again.</span>}
        {s.phase === 'done' && (
          <span>
            <span className="block text-4xl">{s.ms} ms</span>
            <span className="mt-1 block text-sm font-medium text-muted">Tap to try again</span>
          </span>
        )}
      </button>
      {s.phase === 'done' && (
        <p className="mt-3 text-sm text-ink">
          At 30 mph you would travel <strong>{((mph(30) * s.ms) / 1000).toFixed(1)} m</strong> before your foot even reaches the brake — and at 60 mph,{' '}
          <strong>{((mph(60) * s.ms) / 1000).toFixed(1)} m</strong>. That is thinking distance.
        </p>
      )}
    </div>
  )
}
