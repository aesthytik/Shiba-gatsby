import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { FAULT_SCENARIOS, FAULT_TYPES, TOP_FAILS } from '../../data/practical'
import { SectionTabs } from '../../components/layout/SectionTabs'

export function FaultsGuide() {
  return (
    <>
      <PageHeader title="Faults and how you pass" subtitle="Up to 15 driving faults and no serious or dangerous faults is a pass. Here is how examiners mark, and where most people go wrong." back="/practical" />
      <SectionTabs section="practical" />

      <div className="mb-8 grid gap-3 md:grid-cols-3">
        {FAULT_TYPES.map((f) => (
          <Card key={f.id} className={f.tone === 'warn' ? 'border-warn/40' : 'border-bad/40'}>
            <Badge tone={f.tone}>{f.name}</Badge>
            <p className="mt-2 text-sm leading-relaxed text-ink">{f.desc}</p>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold text-ink">How would the examiner mark it?</h2>
      <ScenarioQuiz />

      <h2 className="mt-8 mb-3 text-lg font-bold text-ink">Top 10 reasons for failing</h2>
      <ol className="grid gap-3 md:grid-cols-2">
        {TOP_FAILS.map((f, i) => (
          <li key={f.title}>
            <Card className="flex h-full gap-4 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-bad-soft text-sm font-bold text-bad">{i + 1}</span>
              <div>
                <p className="font-semibold text-ink">{f.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{f.fix}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </>
  )
}

function ScenarioQuiz() {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const s = FAULT_SCENARIOS[i % FAULT_SCENARIOS.length]
  return (
    <Card>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
        Scenario {(i % FAULT_SCENARIOS.length) + 1} of {FAULT_SCENARIOS.length}
      </p>
      <p className="mt-2 text-[17px] leading-snug font-semibold text-ink">{s.s}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {FAULT_TYPES.map((f) => {
          const state = !picked ? 'border-line hover:bg-surface-2' : f.id === s.a ? 'border-ok bg-ok-soft' : f.id === picked ? 'border-bad bg-bad-soft' : 'border-line opacity-50'
          return (
            <button key={f.id} type="button" disabled={!!picked} onClick={() => setPicked(f.id)} className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold text-ink transition ${state}`}>
              {f.name}
            </button>
          )
        })}
      </div>
      {picked && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <p className="max-w-xl text-sm leading-relaxed text-ink">
            <strong className={picked === s.a ? 'text-ok' : 'text-bad'}>{picked === s.a ? 'Right. ' : 'Not quite. '}</strong>
            {s.why}
          </p>
          <button
            type="button"
            className="text-sm font-semibold text-brand"
            onClick={() => {
              setPicked(null)
              setI(i + 1)
            }}
          >
            Next scenario →
          </button>
        </div>
      )}
      <p className="mt-4 text-xs text-muted">Examiners judge each fault in context; these are typical outcomes, not fixed rules.</p>
    </Card>
  )
}
