import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Play } from 'lucide-react'
import { RoadScene } from '../../components/art/RoadScene'
import { PageHeader } from '../../components/ui/PageHeader'
import { ButtonLink } from '../../components/ui/Button'
import { useProgress } from '../../store/progress'
import { ScenarioMap } from './ScenarioMap'
import { buildScenario, LESSONS, lessonByN, UNITS } from './lessons'

export function DriveBriefing() {
  const { n } = useParams()
  const lesson = lessonByN(Number(n))
  const navigate = useNavigate()
  const assist = useProgress((s) => s.settings.assist ?? true)
  const update = useProgress((s) => s.updateSettings)
  const scenario = useMemo(() => (lesson?.scenario ? buildScenario(lesson.scenario) : undefined), [lesson])

  useEffect(() => {
    if (!lesson?.scenario) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLAnchorElement)) navigate(`/drive/${lesson.n}/play`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lesson, navigate])

  if (!lesson) return <PageHeader title="Lesson not found" back="/drive" />
  if (!lesson.scenario || !scenario) {
    return (
      <>
        <PageHeader title={lesson.title} subtitle={`Lesson ${lesson.n} is on the way. For now, lessons with a Start button are playable.`} back="/drive" />
        <ButtonLink to="/drive">Back to lessons</ButtonLink>
      </>
    )
  }
  const unit = UNITS.find((u) => u.n === lesson.unit)!
  const keys = [
    ['W / S', 'Accelerate / brake'],
    ['A / D', 'Steer'],
    ['Q / E', 'Indicators'],
    ['X', 'Check mirror'],
    ['Z / C', 'Look left / right'],
    ['Esc', 'Pause'],
  ]
  return (
    <div className="relative -mx-4 min-h-[calc(100dvh-7rem)] overflow-hidden bg-[#bfe4f6] md:mx-0 md:rounded-[32px]">
      <RoadScene className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-navy/45" aria-hidden="true" />
      <div className="relative flex min-h-[inherit] flex-col p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-white">
          <Link to="/drive" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy/75 px-4 text-sm font-bold hover:bg-navy">
            <ArrowLeft size={16} /> All lessons
          </Link>
          <button type="button" onClick={() => update({ assist: !assist })} aria-pressed={assist} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-navy/75 px-4 text-[13px] font-bold hover:bg-navy">
            <span className={`h-2.5 w-2.5 rounded-full ${assist ? 'bg-[#13a36f]' : 'bg-[#6b7a90]'}`} aria-hidden="true" />
            Automatic · {assist ? 'Guided steering and speed limiter' : 'Manual steering'}
            <span className="text-navy-text">(tap to change)</span>
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <section aria-labelledby="brief-title" className="flex w-full max-w-[860px] flex-wrap gap-7 rounded-[26px] bg-navy p-6 text-white shadow-2xl shadow-black/40 md:p-8">
            <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3.5">
              <p className="text-xs font-bold tracking-[0.1em] text-accent uppercase">
                Lesson {lesson.n} of {LESSONS.length} · {unit.title}
              </p>
              <h1 id="brief-title" className="font-display text-4xl leading-none font-extrabold tracking-[-0.02em] md:text-[40px]">
                {lesson.title}
              </h1>
              <div className="rounded-2xl bg-[#fff6dc] px-3.5 py-3 text-ink">
                <p className="text-[11px] font-extrabold tracking-[0.1em] text-[#7a4300] uppercase">The rule</p>
                <p className="mt-0.5 text-[15px] leading-relaxed">
                  {lesson.rule} <span className="text-[#4a5666]">{lesson.hc}</span>
                </p>
              </div>
              <p className="flex items-center gap-3 text-[17px] font-bold">
                <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-brand text-sm">↑</span>
                Your route: {lesson.route}
              </p>
              <div>
                <p className="mb-1 text-[13px] font-bold text-navy-text">What will happen</p>
                <ul className="list-disc space-y-0.5 pl-5 text-[15px] leading-relaxed text-[#d7dee8]">
                  {lesson.happens?.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
                <span className="mr-0.5 font-semibold text-navy-text">Marked on</span>
                {lesson.marked?.map((m) => (
                  <span key={m} className="rounded-full bg-navy-2 px-3 py-1 font-semibold">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                <ScenarioMap scenario={scenario} />
              </div>
              <div className="rounded-2xl bg-navy-2 px-3.5 py-3">
                <p className="mb-2 text-[13px] font-bold text-navy-text">Keyboard</p>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
                  {keys.map(([k, v]) => (
                    <li key={k} className="flex items-center gap-2">
                      <kbd className="rounded-md border border-[#3a4a60] bg-navy px-1.5 py-0.5 text-xs font-bold whitespace-nowrap">{k}</kbd>
                      <span className="text-[#d7dee8]">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex basis-full flex-wrap justify-end gap-2.5 border-t border-[#2a3a50] pt-4">
              <Link to="/drive" className="flex min-h-[50px] items-center justify-center rounded-2xl bg-navy-2 px-6 text-[15px] font-bold">
                Back
              </Link>
              {lesson.video && (
                <Link to={`/watch/${lesson.video}`} className="flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-white px-6 text-[15px] font-bold text-ink">
                  <Play size={14} fill="currentColor" /> Watch how
                </Link>
              )}
              <Link to={`/drive/${lesson.n}/play`} className="flex min-h-[50px] items-center justify-center gap-2.5 rounded-2xl bg-[#13a36f] px-8 text-base font-extrabold text-[#04140e]">
                Drive <kbd className="rounded bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">Enter</kbd>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
