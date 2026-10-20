import { useState } from 'react'
import { Minus, Plus, Save, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { DL25 } from '../../data/practical'
import { useProgress, type FaultTally } from '../../store/progress'

const KINDS = [
  { key: 'd', label: 'Driving', cls: 'bg-warn-soft text-warn' },
  { key: 's', label: 'Serious', cls: 'bg-bad-soft text-bad' },
  { key: 'x', label: 'Dangerous', cls: 'bg-bad text-white' },
] as const

export function totals(f: FaultTally) {
  return Object.values(f).reduce((a, v) => ({ d: a.d + v.d, s: a.s + v.s, x: a.x + v.x }), { d: 0, s: 0, x: 0 })
}

export function isPass(f: FaultTally) {
  const t = totals(f)
  return t.d <= 15 && t.s === 0 && t.x === 0
}

export function MockDrive() {
  const [faults, setFaults] = useState<FaultTally>({})
  const addMockDrive = useProgress((s) => s.addMockDrive)
  const history = useProgress((s) => s.mockDrives)
  const [saved, setSaved] = useState(false)
  const t = totals(faults)
  const pass = isPass(faults)

  const bump = (id: string, k: 'd' | 's' | 'x', delta: number) => {
    setSaved(false)
    setFaults((f) => {
      const cur = f[id] ?? { d: 0, s: 0, x: 0 }
      return { ...f, [id]: { ...cur, [k]: Math.max(0, cur[k] + delta) } }
    })
  }

  return (
    <>
      <PageHeader
        title="Mock drive marker"
        subtitle="For instructors and supervising drivers: mark faults during a mock test using the same categories as the examiner's sheet. Keep your eyes on the road — let a passenger do the marking."
        back="/practical"
      />

      <Card className={`sticky top-16 z-10 mb-4 flex flex-wrap items-center gap-4 md:top-2 ${pass ? 'border-ok/50' : 'border-bad/50'}`}>
        {KINDS.map((k) => (
          <div key={k.key} className="text-center">
            <p className="text-2xl font-extrabold text-ink">{t[k.key]}</p>
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{k.label}</p>
          </div>
        ))}
        <Badge tone={pass ? 'ok' : 'bad'}>{pass ? 'Currently a pass' : t.d > 15 ? 'Fail: more than 15 driving faults' : 'Fail: serious or dangerous fault'}</Badge>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={() => setFaults({})} aria-label="Clear">
            <Trash2 size={16} />
          </Button>
          <Button
            disabled={saved}
            onClick={() => {
              addMockDrive({ id: crypto.randomUUID(), date: Date.now(), faults, passed: pass })
              setSaved(true)
            }}
          >
            <Save size={16} /> {saved ? 'Saved' : 'Save drive'}
          </Button>
        </div>
      </Card>

      <Card className="divide-y divide-line p-0">
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 text-[11px] font-semibold tracking-wide text-muted uppercase">
          <span className="min-w-44 flex-1">Category</span>
          <div className="flex gap-2">
            {KINDS.map((k) => (
              <span key={k.key} className="w-[6.5rem] text-center">
                {k.label}
              </span>
            ))}
          </div>
        </div>
        {DL25.map((c) => {
          const v = faults[c.id] ?? { d: 0, s: 0, x: 0 }
          return (
            <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-44 flex-1 text-sm font-medium text-ink">{c.label}</span>
              <div className="flex gap-2">
                {KINDS.map((k) => (
                  <div key={k.key} className={`flex w-[6.5rem] items-center justify-between rounded-lg ${v[k.key] ? k.cls : 'bg-surface-2 text-muted'}`}>
                    <button type="button" className="px-2 py-1.5" onClick={() => bump(c.id, k.key, -1)} aria-label={`Remove ${k.label} fault: ${c.label}`}>
                      <Minus size={13} />
                    </button>
                    <span className="text-sm font-bold tabular-nums">{v[k.key]}</span>
                    <button type="button" className="px-2 py-1.5" onClick={() => bump(c.id, k.key, 1)} aria-label={`Add ${k.label} fault: ${c.label}`}>
                      <Plus size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </Card>

      {history.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-bold text-ink">Previous mock drives</h2>
          <Card className="divide-y divide-line p-0">
            {history.slice(0, 8).map((h) => {
              const ht = totals(h.faults)
              const worst = Object.entries(h.faults).sort((a, b) => b[1].d + b[1].s * 5 - (a[1].d + a[1].s * 5))[0]
              return (
                <div key={h.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <span className="text-muted">{new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  <span className="text-ink">
                    {ht.d}D · {ht.s}S · {ht.x}X
                  </span>
                  {worst && <span className="text-muted">Most faults: {DL25.find((c) => c.id === worst[0])?.label}</span>}
                  <span className="ml-auto">
                    <Badge tone={h.passed ? 'ok' : 'bad'}>{h.passed ? 'Pass' : 'Fail'}</Badge>
                  </span>
                </div>
              )
            })}
          </Card>
        </>
      )}
    </>
  )
}
