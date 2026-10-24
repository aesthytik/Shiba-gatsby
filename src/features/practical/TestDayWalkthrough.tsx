import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, Check, Clock, Lightbulb } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { CAR_CHECKLIST, FAULT_TYPES, WALKTHROUGH, type WalkthroughStep } from '../../data/practical'
import { useProgress } from '../../store/progress'
import { EyesightWidget, ReactionWidget, VehicleQuestionCard } from './widgets'
import { SectionTabs } from '../../components/layout/SectionTabs'

export function TestDayWalkthrough() {
  const [i, setI] = useState(0)
  const step = WALKTHROUGH[i]
  return (
    <>
      <PageHeader title="Test day, step by step" subtitle="Walk through the practical test in the order it happens, with practice for each part." back="/practical" />
      <SectionTabs section="practical" />

      <ol className="mb-6 flex gap-1.5 overflow-x-auto pb-2" aria-label="Steps">
        {WALKTHROUGH.map((s, k) => (
          <li key={s.id} className="shrink-0">
            <button
              type="button"
              onClick={() => setI(k)}
              aria-current={k === i ? 'step' : undefined}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                k === i ? 'border-brand bg-brand text-brand-ink' : k < i ? 'border-brand/30 bg-brand-soft text-brand' : 'border-line bg-surface text-muted'
              }`}
            >
              {k < i ? <Check size={13} /> : <span>{k + 1}</span>}
              {s.title}
            </button>
          </li>
        ))}
      </ol>

      <Card key={step.id} className="md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-ink md:text-2xl">
            {i + 1}. {step.title}
          </h2>
          <span className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
            <Clock size={13} /> {step.time}
          </span>
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">What happens</h3>
            <ul className="space-y-2.5">
              {step.what.map((w) => (
                <li key={w} className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> {w}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl bg-warn-soft p-4">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-warn">
                <Lightbulb size={15} /> Tips
              </p>
              {step.tips.map((t) => (
                <p key={t} className="text-sm leading-relaxed text-ink">
                  {t}
                </p>
              ))}
            </div>
          </div>
          <div>
            <StepWidget step={step} />
          </div>
        </div>
      </Card>

      <div className="mt-4 flex justify-between">
        <Button variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>
          <ArrowLeft size={16} /> Previous
        </Button>
        {i < WALKTHROUGH.length - 1 ? (
          <Button onClick={() => setI(i + 1)}>
            Next: {WALKTHROUGH[i + 1].title} <ArrowRight size={16} />
          </Button>
        ) : (
          <ButtonLink to="/practical/mock-drive">Try a mock drive</ButtonLink>
        )}
      </div>
    </>
  )
}

function StepWidget({ step }: { step: WalkthroughStep }) {
  const checklist = useProgress((s) => s.checklist)
  const toggle = useProgress((s) => s.toggleChecklist)
  switch (step.widget) {
    case 'checklist':
      return (
        <div className="rounded-xl bg-surface-2 p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Your checklist</p>
          <ul className="space-y-1">
            {CAR_CHECKLIST.map((c) => {
              const key = `testday:${c.id}`
              return (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 text-sm text-ink hover:bg-surface">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--c-brand)]" checked={!!checklist[key]} onChange={() => toggle(key)} />
                    <span className={checklist[key] ? 'text-muted line-through' : ''}>{c.label}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )
    case 'eyesight':
      return <EyesightWidget />
    case 'tell':
      return <VehicleQuestionCard kind="tell" />
    case 'show':
      return <VehicleQuestionCard kind="show" />
    case 'reaction':
      return <ReactionWidget />
    case 'manoeuvre':
      return (
        <div className="rounded-xl bg-surface-2 p-4">
          <p className="text-sm text-ink">Watch each manoeuvre animated step by step, with reference points and common faults.</p>
          <ButtonLink to="/practical/manoeuvres" className="mt-3">
            Open manoeuvres
          </ButtonLink>
        </div>
      )
    case 'result':
      return (
        <div className="space-y-2">
          {FAULT_TYPES.map((f) => (
            <div key={f.id} className={`rounded-xl p-3 ${f.tone === 'warn' ? 'bg-warn-soft' : 'bg-bad-soft'}`}>
              <p className={`text-sm font-semibold ${f.tone === 'warn' ? 'text-warn' : 'text-bad'}`}>{f.name}</p>
              <p className="mt-0.5 text-sm text-ink">{f.desc}</p>
            </div>
          ))}
          <Link to="/practical/faults" className="inline-block text-sm font-semibold text-brand">
            See the top 10 reasons people fail →
          </Link>
        </div>
      )
    default:
      return (
        <div className="grid h-full min-h-40 place-items-center rounded-xl bg-surface-2 p-6 text-center">
          <p className="text-sm text-muted">Stay calm — the examiner wants to see you drive safely, the way you would on your own.</p>
        </div>
      )
  }
}
