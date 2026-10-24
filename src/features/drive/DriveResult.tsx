import { Link, Navigate, useLocation, useParams } from 'react-router'
import { Check, Play, TriangleAlert } from 'lucide-react'
import { RoadScene } from '../../components/art/RoadScene'
import { useProgress, type DriveFaultRecord } from '../../store/progress'
import { Stars } from './DriveLessons'
import { lessonByN, PLAYABLE } from './lessons'

const SEV: Record<DriveFaultRecord['severity'], { label: string; cls: string }> = {
  minor: { label: 'Minor', cls: 'bg-[#fff3d6] text-[#7a4300]' },
  serious: { label: 'Serious', cls: 'bg-bad-soft text-bad' },
  dangerous: { label: 'Dangerous', cls: 'bg-bad text-white' },
}

export function DriveResult() {
  const { n } = useParams()
  const state = useLocation().state as { runId?: string } | null
  const lesson = lessonByN(Number(n))
  const runs = useProgress((s) => s.driveRuns)
  const run = runs.find((r) => r.id === state?.runId) ?? runs.find((r) => r.n === Number(n))
  if (!lesson || !run) return <Navigate to="/drive" replace />
  const next = PLAYABLE.find((l) => l.n > lesson.n)
  const failed = run.status === 'failed'
  const clean = (lesson.marked ?? []).filter((m) => !run.faults.some((f) => f.category.toLowerCase().includes(m.toLowerCase())))
  const mm = Math.floor(run.seconds / 60)
  const ss = String(run.seconds % 60).padStart(2, '0')
  return (
    <div className="relative -mx-4 min-h-[calc(100dvh-7rem)] overflow-hidden bg-[#bfe4f6] md:mx-0 md:rounded-[32px]">
      <RoadScene className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-navy/60" aria-hidden="true" />
      <div className="relative flex flex-wrap items-stretch gap-4 p-4 md:p-8">
        <section aria-labelledby="res-title" className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5 rounded-[26px] bg-navy p-6 text-white shadow-2xl shadow-black/30 md:p-7">
          <p className="text-xs font-bold tracking-[0.1em] text-accent uppercase">
            Lesson {lesson.n} · {lesson.title}
          </p>
          <Stars n={run.stars} size={56} className="gap-2 [&_svg]:fill-transparent [&_svg]:text-[#4a5a70] [&_svg.fill-accent]:fill-accent [&_svg.fill-accent]:text-accent" />
          <h1 id="res-title" className="font-display text-4xl leading-none font-extrabold tracking-[-0.02em] md:text-[40px]">
            {run.headline}
          </h1>
          <p className="text-base leading-relaxed text-[#d7dee8]">
            {failed
              ? 'A serious mistake ended the drive. That is what practice is for. Watch the right way, then have another go.'
              : run.faults.length === 0
                ? 'No faults at all. Try the next lesson, or come back and drive it again for fun.'
                : run.stars === 1
                  ? 'You finished the lesson. Fix the faults below to earn more stars.'
                  : `You finished the lesson. Fix ${run.faults.length === 1 ? 'one minor fault' : 'the minor faults'} to earn all three stars.`}
          </p>
          <dl className="mt-1 grid grid-cols-3 gap-2.5">
            {[
              ['Time', `${mm}:${ss}`],
              ['Top speed', `${run.topMph} mph`],
              ['Faults', run.faults.length ? `${run.faults.length}` : 'None'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-navy-2 px-3 py-2.5">
                <dt className="text-xs text-navy-text">{k}</dt>
                <dd className="mt-0.5 text-lg font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-auto grid grid-cols-[1fr_1.5fr] gap-2.5 pt-3">
            <Link to={`/drive/${lesson.n}`} className="flex min-h-[52px] items-center justify-center rounded-2xl bg-navy-2 text-[15px] font-bold">
              Retry
            </Link>
            <Link to={next && !failed ? `/drive/${next.n}` : '/drive'} className="flex min-h-[52px] items-center justify-center rounded-2xl bg-[#13a36f] text-base font-extrabold text-[#04140e]">
              {next && !failed ? 'Next lesson' : 'All lessons'}
            </Link>
          </div>
        </section>

        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-4">
          <section aria-labelledby="faults-h" className="rounded-[22px] bg-surface p-5 text-ink md:p-6">
            <h2 id="faults-h" className="mb-3 text-lg font-extrabold">
              {run.faults.length === 0 ? 'No faults to fix' : `${run.faults.length} fault${run.faults.length === 1 ? '' : 's'} to fix`}
            </h2>
            <ul className="flex flex-col gap-4">
              {run.faults.map((f) => (
                <li key={f.title} className="flex items-start gap-3.5">
                  <span className={`mt-0.5 rounded-lg px-2.5 py-1 text-xs font-extrabold whitespace-nowrap ${SEV[f.severity].cls}`}>{SEV[f.severity].label}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold">
                      {f.category}: {f.title.charAt(0).toLowerCase() + f.title.slice(1)}
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink/80">{f.advice}</p>
                    <p className="mt-1.5 text-[13px] text-muted">
                      {f.hc ? `${f.hc} · ` : ''}examiners mark this under “{f.category}”
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {run.faults.length > 0 && lesson.video && (
              <Link to={`/watch/${lesson.video}`} className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-brand-soft px-3.5 text-sm font-bold text-brand">
                <Play size={13} fill="currentColor" /> See the right way
              </Link>
            )}
            {run.faults.length === 0 && (
              <p className="flex items-center gap-2 text-[15px] text-ink/80">
                <TriangleAlert size={16} className="text-muted" /> Clean drive. That is how an examiner would like to see it.
              </p>
            )}
          </section>

          {clean.length > 0 && !failed && (
            <section aria-labelledby="well-h" className="rounded-[22px] bg-surface p-5 text-ink md:p-6">
              <h2 id="well-h" className="mb-2.5 text-base font-extrabold">
                What you did well
              </h2>
              <ul className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-x-4 gap-y-2">
                {clean.map((m) => (
                  <li key={m} className="flex items-center gap-2.5 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    No faults in “{m}”
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
