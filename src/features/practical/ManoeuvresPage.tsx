import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { MANOEUVRES } from '../../data/manoeuvres'
import { ManoeuvrePlayer } from './ManoeuvrePlayer'
import { SectionTabs } from '../../components/layout/SectionTabs'

export function ManoeuvresPage() {
  const [id, setId] = useState(MANOEUVRES[0].id)
  const m = MANOEUVRES.find((x) => x.id === id)!
  return (
    <>
      <PageHeader
        title="Reversing manoeuvres"
        subtitle="You'll be asked to do one of these on your test. Reference points differ between cars — use these as a guide and confirm them with your instructor."
        back="/practical"
      />
      <SectionTabs section="practical" />
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1 text-sm sm:inline-flex">
        {MANOEUVRES.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setId(x.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 font-semibold whitespace-nowrap ${id === x.id ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}
          >
            {x.name}
          </button>
        ))}
      </div>
      <p className="mb-4 max-w-3xl text-[15px] text-muted">{m.summary}</p>
      <ManoeuvrePlayer key={m.id} m={m} />
      <Card className="mt-5">
        <p className="mb-2 flex items-center gap-2 font-semibold text-ink">
          <AlertTriangle size={17} className="text-warn" /> Common faults
        </p>
        <ul className="grid gap-1.5 text-sm text-muted sm:grid-cols-2">
          {m.faults.map((f) => (
            <li key={f}>• {f}</li>
          ))}
        </ul>
      </Card>
    </>
  )
}
