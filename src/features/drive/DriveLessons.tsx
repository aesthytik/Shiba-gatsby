import { Link } from 'react-router'
import { Check, Lock, Star } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { ButtonLink } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { RoadScene } from '../../components/art/RoadScene'
import { SectionTabs } from '../../components/layout/SectionTabs'
import { useProgress } from '../../store/progress'
import { bestByLesson, MAX_STARS, totalStars } from '../progress/stats'
import { LESSONS, PLAYABLE, UNITS, playable, type Lesson } from './lessons'

export function lessonState(l: Lesson, best: ReturnType<typeof bestByLesson>, unlockAll: boolean) {
  if (!playable(l)) return 'soon' as const
  if (best[l.n]?.passed) return 'passed' as const
  const idx = PLAYABLE.indexOf(l)
  const prevPassed = idx === 0 || !!best[PLAYABLE[idx - 1].n]?.passed
  return unlockAll || prevPassed ? ('open' as const) : ('locked' as const)
}

export function Stars({ n, size = 16, className = '' }: { n: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} role="img" aria-label={`${n} out of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <Star key={i} size={size} className={i < n ? 'fill-accent text-[#b07a00]' : 'text-line'} strokeWidth={1.8} />
      ))}
    </span>
  )
}

export function DriveLessons() {
  const runs = useProgress((s) => s.driveRuns)
  const unlockAll = useProgress((s) => s.settings.unlockAll ?? false)
  const update = useProgress((s) => s.updateSettings)
  const best = bestByLesson(runs)
  const stars = totalStars(runs)
  const state = (l: Lesson) => lessonState(l, best, unlockAll)
  const next = PLAYABLE.find((l) => state(l) === 'open') ?? PLAYABLE[PLAYABLE.length - 1]
  const unitStatus = UNITS.map((u) => {
    const lessons = LESSONS.filter((l) => l.unit === u.n)
    const play = lessons.filter(playable)
    return { u, lessons, play, done: play.length > 0 && play.every((l) => best[l.n]?.passed), stars: play.reduce((a, l) => a + (best[l.n]?.stars ?? 0), 0) }
  })
  const currentUnit = unitStatus.find((x) => x.play.length && !x.done)?.u.n ?? UNITS[UNITS.length - 1].n

  return (
    <>
      <PageHeader
        title="Drive"
        subtitle="Learn each rule by driving it. Short lessons, marked the way an examiner would."
        actions={
          <span className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold">
            <Star size={18} className="fill-accent text-[#b07a00]" strokeWidth={1.5} /> {stars} of {MAX_STARS} stars
          </span>
        }
      />
      <SectionTabs section="drive" />

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-3.5">
          {unitStatus.map(({ u, lessons, play, done, stars: us }) => {
            if (u.n === currentUnit) {
              const passed = play.filter((l) => best[l.n]?.passed).length
              return (
                <section key={u.n} aria-labelledby={`unit-${u.n}`} className="rounded-3xl border-2 border-brand bg-surface p-5">
                  <div className="mb-3.5 flex items-baseline justify-between gap-3">
                    <h2 id={`unit-${u.n}`} className="font-display text-[22px] font-extrabold">
                      Unit {u.n} · {u.title}
                    </h2>
                    <span className="text-[13px] text-muted">
                      {passed} of {play.length} done
                    </span>
                  </div>
                  <ol className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
                    {lessons.map((l) => (
                      <LessonTile key={l.n} lesson={l} state={state(l)} stars={best[l.n]?.stars ?? 0} />
                    ))}
                  </ol>
                </section>
              )
            }
            const open = done
            return (
              <section key={u.n} className="flex items-center gap-3.5 rounded-3xl border border-line bg-surface px-4.5 py-4">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${open ? 'bg-brand-soft text-brand' : 'bg-surface-2 text-muted'}`}>
                  {open ? <Check size={22} strokeWidth={2.6} /> : <Lock size={19} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-muted">
                    Unit {u.n} · {lessons.length} lessons
                  </p>
                  <p className="text-base font-bold">{u.title}</p>
                </div>
                {open ? (
                  <>
                    <span className="text-sm font-bold text-[#7a4300]">
                      {us} / {play.length * 3} stars
                    </span>
                    <ButtonLink to={`/drive/${play[0].n}`} variant="secondary" className="min-h-10 px-3.5 text-[13px]">
                      Replay
                    </ButtonLink>
                  </>
                ) : (
                  <span className="text-[13px] text-muted">{play.length ? `${play.length} playable` : 'Coming soon'}</span>
                )}
              </section>
            )
          })}
          <p className="px-1 text-[13px] text-muted">
            {PLAYABLE.length} of {LESSONS.length} lessons are playable today; the rest are on the way.{' '}
            <button type="button" className="font-semibold text-brand underline" onClick={() => update({ unlockAll: !unlockAll })}>
              {unlockAll ? 'Lock lessons in order again' : 'Already confident? Unlock every lesson'}
            </button>
          </p>
        </div>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          <section aria-labelledby="next-h" className="overflow-hidden rounded-3xl border border-line bg-surface">
            <div className="relative h-[170px]">
              <RoadScene className="absolute inset-0 h-full w-full" />
            </div>
            <div className="p-4.5 pb-5">
              <p className="text-xs font-bold tracking-[0.08em] text-[#7a4300] uppercase">Up next · Lesson {next.n}</p>
              <h2 id="next-h" className="font-display mt-1 mb-1.5 text-[22px] font-extrabold">
                {next.title}
              </h2>
              <p className="text-sm leading-relaxed text-ink/80">{next.rule}</p>
              <ButtonLink to={`/drive/${next.n}`} className="mt-3.5 w-full bg-[#13a36f] py-3 text-[15px] font-extrabold text-[#04140e]">
                Start lesson
              </ButtonLink>
            </div>
          </section>
          <section aria-labelledby="ctrl-h" className="rounded-3xl border border-line bg-surface p-4.5">
            <h2 id="ctrl-h" className="mb-3 text-base font-extrabold">
              Controls
            </h2>
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3.5 gap-y-2 text-sm">
              {[
                ['W / S', 'Accelerate and brake'],
                ['A / D', 'Steer'],
                ['Q / E', 'Left and right indicators'],
                ['X', 'Check the mirror'],
                ['Z / C', 'Look left and right (blind spots)'],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="rounded-md bg-surface-2 px-2 py-1 text-center text-xs font-bold">{k}</dt>
                  <dd className="text-ink/80">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[13px] text-muted">Game controllers and steering wheels work too. On a phone, on-screen buttons appear. <Link to="/theory" className="font-semibold text-brand">Revise theory</Link> if you want a break.</p>
          </section>
        </div>
      </div>
    </>
  )
}

function LessonTile({ lesson: l, state, stars }: { lesson: Lesson; state: 'soon' | 'passed' | 'open' | 'locked'; stars: number }) {
  const body = (
    <>
      {state === 'open' && <span className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-navy bg-accent font-display text-xl font-extrabold">{l.n}</span>}
      {state === 'passed' && <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft font-display text-xl font-extrabold text-brand">{l.n}</span>}
      {(state === 'locked' || state === 'soon') && (
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted" aria-label={state === 'soon' ? 'Coming soon' : 'Locked'}>
          <Lock size={20} />
        </span>
      )}
      <div>
        <p className="text-xs text-muted">Lesson {l.n}</p>
        <p className="mt-0.5 text-[15px] leading-snug font-bold">{l.title}</p>
        <p className="mt-0.5 text-[13px] text-muted">{l.sub}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        {state === 'passed' && <Stars n={stars} />}
        {state === 'soon' && <Badge>Coming soon</Badge>}
        {state === 'open' && <span className="w-full rounded-xl bg-brand px-3.5 py-2.5 text-center text-sm font-bold text-brand-ink">Start</span>}
        {state === 'passed' && <span className="text-[13px] font-semibold text-brand">Replay</span>}
      </div>
    </>
  )
  const cls = `flex min-h-[178px] flex-col gap-2.5 rounded-[18px] border p-3.5 ${
    state === 'open' ? 'border-navy bg-[#fff8e6]' : state === 'passed' ? 'border-line bg-surface hover:border-brand/50' : 'border-line bg-[#f7f9fa] opacity-90'
  }`
  return <li>{state === 'open' || state === 'passed' ? <Link to={`/drive/${l.n}`} className={`${cls} h-full transition hover:-translate-y-0.5`}>{body}</Link> : <div className={`${cls} h-full`}>{body}</div>}</li>
}
