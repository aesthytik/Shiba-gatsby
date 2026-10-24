import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Check, Share2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { useProgress } from '../../store/progress'
import { MOCK } from '../theory/logic'
import { HP_PASS_MARK } from '../hazard/scoring'
import { faultsByCategory, logHours, MAX_STARS, readiness, totalStars, weeklyHours } from './stats'

const INST = '#13a36f'
const PRIV = '#2f66c8'
const HAZ = '#7b5bd6'

export function ProgressPage() {
  const stats = useProgress((s) => s.questionStats)
  const mocks = useProgress((s) => s.mockResults)
  const hazards = useProgress((s) => s.hazardResults)
  const runs = useProgress((s) => s.driveRuns)
  const logbook = useProgress((s) => s.logbook)
  const [copied, setCopied] = useState(false)

  const r = useMemo(() => readiness({ stats, mocks, hazards, runs, logbook }), [stats, mocks, hazards, runs, logbook])
  const weeks = useMemo(() => weeklyHours(logbook), [logbook])
  const faults = useMemo(() => faultsByCategory(runs), [runs])
  const hours = logHours(logbook)
  const stars = totalStars(runs)
  const pct = Math.round(r.total * 100)

  const share = async () => {
    const lines = [
      `RoadReady UK progress: ${pct}% test-ready (${r.verdict.toLowerCase()})`,
      `Real driving logged: ${hours.instructor.toFixed(1)} h with an instructor, ${hours.private.toFixed(1)} h private`,
      `Drive lessons: ${stars} of ${MAX_STARS} stars`,
      faults.length ? `Most common faults (30 days): ${faults.slice(0, 3).map((f) => `${f.category} (${f.n})`).join('; ')}` : 'No drive faults recorded yet',
    ]
    const text = lines.join('\n')
    try {
      if (navigator.share) await navigator.share({ title: 'My driving progress', text })
      else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      /* the learner cancelled the share sheet */
    }
  }

  return (
    <>
      <PageHeader
        title="Progress"
        subtitle="An honest read on whether you're ready for your practical test, and what to do next."
        actions={
          <Button variant="secondary" onClick={share} className="min-h-11 px-4.5">
            {copied ? <Check size={16} /> : <Share2 size={16} />} {copied ? 'Copied to clipboard' : 'Share with instructor'}
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-stretch gap-5">
        <section aria-labelledby="ready-h" className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5 rounded-3xl bg-navy p-6 text-white">
          <h2 id="ready-h" className="text-sm font-bold text-navy-text">
            Practical test readiness
          </h2>
          <div className="flex items-center gap-4.5">
            <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`${pct} percent ready`}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1e2d42" strokeWidth="12" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#ffc72c" strokeWidth="12" strokeLinecap="round" strokeDasharray={2 * Math.PI * 50} strokeDashoffset={2 * Math.PI * 50 * (1 - r.total)} transform="rotate(-90 60 60)" />
              <text x="60" y="68" textAnchor="middle" fontFamily="Bricolage Grotesque, Inter, sans-serif" fontSize="30" fontWeight="800" fill="#fff">
                {pct}%
              </text>
            </svg>
            <div>
              <p className="font-display text-[26px] leading-tight font-extrabold">{r.verdict}</p>
              <p className="mt-1.5 text-sm text-[#d7dee8]">{r.verdict === 'Ready' ? 'Consider booking a mock test with your instructor.' : 'Each lesson, drive and mock moves this up.'}</p>
            </div>
          </div>
          {r.steps.length > 0 && (
            <div className="rounded-2xl bg-navy-2 px-3.5 py-3">
              <p className="mb-1.5 text-[13px] font-bold text-accent">To reach “Ready”</p>
              <ol className="list-decimal space-y-1 pl-4.5 text-sm leading-relaxed">
                {r.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          )}
          <p className="text-xs text-navy-text">A guide built from your activity, not a guarantee. Your instructor knows your driving best.</p>
        </section>

        <div className="grid min-w-0 flex-[2_1_520px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {r.parts.map((p) => (
            <section key={p.key} className="flex flex-col gap-2 rounded-[20px] border border-line bg-surface p-4.5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[15px] font-bold">{p.label}</h3>
                <span className="font-display text-2xl font-extrabold">{p.display}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-navy" style={{ width: `${Math.round(p.value * 100)}%` }} />
              </div>
              <p className="text-[13px] leading-relaxed text-ink/80">{p.tip}</p>
              <Link to={p.to} className="mt-auto text-sm font-bold text-brand">
                {p.cta} →
              </Link>
            </section>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-stretch gap-5">
        <HoursChart weeks={weeks} total={weeks.reduce((a, w) => a + w.total, 0)} />
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          <MockChart mocks={mocks.slice(0, 8).reverse()} />
          <HazardChart hazards={hazards.slice(0, 8).reverse()} />
        </div>
      </div>

      <section aria-labelledby="faults-h" className="flex flex-wrap gap-6 rounded-[22px] border border-line bg-surface p-5.5">
        <div className="min-w-0 flex-[2_1_480px]">
          <h2 id="faults-h" className="text-lg font-extrabold">
            Faults by type
          </h2>
          <p className="mt-0.5 mb-4 text-[13px] text-muted">Last 30 days of Drive lessons, named the way the DVSA test report names them</p>
          {faults.length === 0 ? (
            <p className="text-sm text-muted">
              No faults recorded. <Link to="/drive" className="font-semibold text-brand">Drive a lesson</Link> and they will appear here.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {faults.slice(0, 6).map((f) => (
                <li key={f.category} className="flex items-center gap-3.5">
                  <span className="w-[230px] max-w-[45%] shrink-0 text-sm font-semibold">{f.category}</span>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span title={`${f.category}: ${f.n}`} className="h-5 rounded-r bg-[#3d4a5c]" style={{ width: `${Math.max(6, (f.n / faults[0].n) * 88)}%` }} />
                    <span className="text-sm font-bold tabular-nums">{f.n}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {faults[0] && (
          <div className="min-w-0 flex-[1_1_260px] self-start rounded-2xl border border-[#f2dfae] bg-[#fff8e6] p-4.5 text-[#1c1a12]">
            <p className="text-xs font-bold tracking-[0.08em] text-[#7a4300] uppercase">Biggest win</p>
            <h3 className="mt-1 mb-1.5 text-[17px] font-extrabold">{faults[0].category}</h3>
            <p className="text-sm leading-relaxed text-[#3d4a5c]">This is your most common fault. A few minutes of focused practice in Drive will drill it.</p>
            <Link to="/drive" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white">
              Practise in Drive
            </Link>
          </div>
        )}
      </section>
    </>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="tip pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-[10px] bg-navy px-2.5 py-2 text-xs leading-relaxed whitespace-nowrap text-white opacity-0 transition-opacity group-focus-visible:opacity-100 group-hover:opacity-100">{children}</div>
}

function HoursChart({ weeks, total }: { weeks: ReturnType<typeof weeklyHours>; total: number }) {
  const [table, setTable] = useState(false)
  const max = Math.max(6, Math.ceil(Math.max(...weeks.map((w) => w.total)) / 2) * 2)
  const H = 200
  const px = (h: number) => Math.round((h / max) * H)
  return (
    <section aria-labelledby="hours-h" className="min-w-0 flex-[2_1_520px] rounded-[22px] border border-line bg-surface p-5.5">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <h2 id="hours-h" className="text-lg font-extrabold">
            Hours driven each week
          </h2>
          <p className="mt-0.5 text-[13px] text-muted">Last 8 weeks · {Math.round(total * 10) / 10} hours</p>
        </div>
        <div className="flex items-center gap-3.5 text-[13px] text-ink/80">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px]" style={{ background: INST }} />
            Instructor
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px]" style={{ background: PRIV }} />
            Private practice
          </span>
          <button type="button" aria-pressed={table} onClick={() => setTable(!table)} className="min-h-[34px] rounded-lg border border-line px-3 text-[13px] font-semibold hover:bg-surface-2">
            {table ? 'Show chart' : 'Show table'}
          </button>
        </div>
      </div>
      {total === 0 ? (
        <p className="mt-6 text-sm text-muted">Nothing logged yet. Add your lessons and practice drives in the logbook on the Practical page.</p>
      ) : table ? (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-muted uppercase">
              <th scope="col" className="pb-2 font-bold">Week starting</th>
              <th scope="col" className="pb-2 text-right font-bold">Instructor</th>
              <th scope="col" className="pb-2 text-right font-bold">Private</th>
              <th scope="col" className="pb-2 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.start} className="border-t border-line tabular-nums">
                <td className="py-2">{w.label}</td>
                <td className="py-2 text-right">{w.inst} h</td>
                <td className="py-2 text-right">{w.priv} h</td>
                <td className="py-2 text-right font-bold">{w.total} h</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="mt-4 flex gap-2.5">
          <div className="relative w-7 text-xs text-muted" style={{ height: H }} aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="absolute right-0" style={{ top: `calc(${(i / 3) * 100}% - 7px)` }}>
                {Math.round(max - (max / 3) * i)}{i === 0 ? ' h' : ''}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative flex items-end" style={{ height: H }} role="img" aria-label="Stacked columns of weekly driving hours, instructor and private practice, for the last 8 weeks">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`absolute inset-x-0 h-px ${i === 3 ? 'bg-[#cbd3dc]' : 'bg-line'}`} style={{ top: `${(i / 3) * 100}%` }} />
              ))}
              {weeks.map((w) => {
                const inst = px(w.inst)
                const priv = px(w.priv)
                return (
                  <div key={w.start} tabIndex={0} aria-label={`Week of ${w.label}: ${w.total} hours, ${w.inst} with instructor, ${w.priv} private`} className="group relative flex h-full flex-1 items-end justify-center rounded focus-visible:outline-2">
                    <div className="flex w-6 flex-col gap-0.5">
                      {w.priv > 0 && <span className="block rounded-t" style={{ height: priv, background: PRIV }} />}
                      {w.inst > 0 && <span className={`block ${w.priv > 0 ? '' : 'rounded-t'}`} style={{ height: inst, background: INST }} />}
                    </div>
                    <Tip>
                      <strong className="block text-[13px]">
                        w/c {w.label} · {w.total} h
                      </strong>
                      Instructor {w.inst} h<br />
                      Private {w.priv} h
                    </Tip>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex" aria-hidden="true">
              {weeks.map((w) => (
                <span key={w.start} className="flex-1 text-center text-xs text-muted">
                  {w.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function PassLabel({ top, children }: { top: string; children: React.ReactNode }) {
  return (
    <span className="absolute right-0 -translate-y-1/2 text-[11px] font-semibold text-ink/80" style={{ top }}>
      {children}
    </span>
  )
}

function MockChart({ mocks }: { mocks: ReturnType<typeof useProgress.getState>['mockResults'] }) {
  const H = 110
  return (
    <section aria-labelledby="mock-h" className="rounded-[22px] border border-line bg-surface p-5">
      <h2 id="mock-h" className="text-base font-extrabold">
        Theory mock scores
      </h2>
      <p className="mt-0.5 mb-3 text-[13px] text-muted">Out of {MOCK.questions} · pass mark {MOCK.passMark}</p>
      {mocks.length === 0 ? (
        <p className="text-sm text-muted">
          No mock tests yet. <Link to="/theory/mock" className="font-semibold text-brand">Take one</Link> to see your trend.
        </p>
      ) : (
        <div className="relative" style={{ height: H }} role="img" aria-label={`Mock test scores: ${mocks.map((m) => `${m.score}`).join(', ')} out of ${MOCK.questions}`}>
          <div className="absolute inset-y-0 left-0 right-12">
            <span className="absolute inset-x-0 border-t border-[#5a6778]" style={{ top: `${(1 - MOCK.passMark / MOCK.questions) * 100}%` }} />
            <div className="absolute inset-0 flex items-end gap-2">
              {mocks.map((m) => (
                <div key={m.id} tabIndex={0} aria-label={`${m.score} out of ${m.total}`} className="group relative flex h-full flex-1 items-end justify-center">
                  <span className="block w-5 rounded-t" style={{ height: `${(m.score / m.total) * 100}%`, background: m.passed ? '#0b6e4f' : '#b42318' }} />
                  <Tip>
                    {m.score}/{m.total} · {m.passed ? 'pass' : 'fail'}
                  </Tip>
                </div>
              ))}
            </div>
          </div>
          <PassLabel top={`${(1 - MOCK.passMark / MOCK.questions) * 100}%`}>Pass {MOCK.passMark}</PassLabel>
        </div>
      )}
    </section>
  )
}

function HazardChart({ hazards }: { hazards: ReturnType<typeof useProgress.getState>['hazardResults'] }) {
  const H = 110
  const pts = hazards.map((h, i) => ({ v: Math.round((h.score / h.max) * 75), x: hazards.length === 1 ? 50 : (i / (hazards.length - 1)) * 100 }))
  const lo = 0
  const hi = 75
  const y = (v: number) => ((hi - v) / (hi - lo)) * 100
  return (
    <section aria-labelledby="haz-h" className="rounded-[22px] border border-line bg-surface p-5">
      <h2 id="haz-h" className="text-base font-extrabold">
        Hazard practice scores
      </h2>
      <p className="mt-0.5 mb-3 text-[13px] text-muted">Scaled to 75 · pass mark {HP_PASS_MARK}</p>
      {pts.length === 0 ? (
        <p className="text-sm text-muted">
          No clips yet. <Link to="/hazard" className="font-semibold text-brand">Try a hazard clip</Link>.
        </p>
      ) : (
        <div className="relative" style={{ height: H }} role="img" aria-label={`Hazard practice scores: ${pts.map((p) => p.v).join(', ')} out of 75`}>
          <div className="absolute inset-y-0 left-3 right-14">
            <span className="absolute -inset-x-3 border-t border-[#5a6778]" style={{ top: `${y(HP_PASS_MARK)}%` }} />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
              <polyline points={pts.map((p) => `${p.x},${y(p.v)}`).join(' ')} fill="none" stroke={HAZ} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            {pts.map((p, i) => (
              <span key={i} tabIndex={0} aria-label={`${p.v} out of 75`} className="group absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center" style={{ left: `${p.x}%`, top: `${y(p.v)}%` }}>
                <span className="h-2.5 w-2.5 rounded-full ring-2 ring-surface" style={{ background: HAZ }} />
                <Tip>{p.v}/75</Tip>
              </span>
            ))}
          </div>
          <PassLabel top={`${y(HP_PASS_MARK)}%`}>Pass {HP_PASS_MARK}</PassLabel>
        </div>
      )}
    </section>
  )
}
