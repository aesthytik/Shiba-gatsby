import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { RoadSign } from '../../components/signs/RoadSign'
import { SIGN_CATEGORIES, SIGNS, type SignId } from '../../components/signs/signs'
import { shuffle } from '../../lib/random'

const ALL_SIGNS = Object.keys(SIGNS) as SignId[]

export function SignsPage() {
  const [tab, setTab] = useState<'browse' | 'quiz'>('browse')
  return (
    <>
      <PageHeader
        title="Road signs"
        subtitle="Circles give orders, triangles warn and rectangles inform. Learn the shapes and colours first — they tell you most of what a sign means."
        back="/theory"
      />
      <div className="mb-6 inline-flex gap-1 rounded-xl bg-surface-2 p-1 text-sm">
        {(['browse', 'quiz'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-lg px-4 py-1.5 font-semibold ${tab === t ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}>
            {t === 'browse' ? 'Browse' : 'Quiz me'}
          </button>
        ))}
      </div>
      {tab === 'browse' ? <Browse /> : <Quiz />}
    </>
  )
}

function Browse() {
  return (
    <div className="space-y-8">
      {SIGN_CATEGORIES.map((cat) => {
        const ids = ALL_SIGNS.filter((id) => SIGNS[id].category === cat.id)
        return (
          <section key={cat.id}>
            <h2 className="text-lg font-bold text-ink">{cat.name}</h2>
            <p className="mb-3 text-sm text-muted">{cat.rule}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ids.map((id) => (
                <Card key={id} className="flex items-start gap-4 p-4">
                  <RoadSign id={id} size={64} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{SIGNS[id].name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{SIGNS[id].meaning}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Quiz() {
  const [order, setOrder] = useState(() => shuffle(ALL_SIGNS))
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<SignId | null>(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const current = order[i % order.length]

  const options = useMemo(() => {
    // Prefer distractors of the same category so the quiz tests meaning, not shape.
    const same = shuffle(ALL_SIGNS.filter((s) => s !== current && SIGNS[s].category === SIGNS[current].category))
    const other = shuffle(ALL_SIGNS.filter((s) => s !== current && SIGNS[s].category !== SIGNS[current].category))
    return shuffle([current, ...[...same, ...other].slice(0, 3)])
  }, [current])

  const pick = (s: SignId) => {
    if (picked) return
    setPicked(s)
    setScore((sc) => ({ right: sc.right + (s === current ? 1 : 0), total: sc.total + 1 }))
  }
  const next = () => {
    setPicked(null)
    if (i + 1 >= order.length) {
      setOrder(shuffle(ALL_SIGNS))
      setI(0)
    } else setI(i + 1)
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-3 text-right text-sm font-semibold text-muted">
        Score {score.right}/{score.total}
      </p>
      <Card className="text-center">
        <div className="flex justify-center rounded-xl bg-surface-2 py-8">
          <RoadSign id={current} size={150} title="Which sign is this?" />
        </div>
        <p className="mt-5 font-semibold text-ink">What does this sign mean?</p>
        <div className="mt-4 grid gap-2 text-left">
          {options.map((o) => {
            const state = !picked ? '' : o === current ? 'border-ok bg-ok-soft' : o === picked ? 'border-bad bg-bad-soft' : 'opacity-50'
            return (
              <button
                key={o}
                type="button"
                disabled={!!picked}
                onClick={() => pick(o)}
                className={`flex items-center justify-between gap-2 rounded-xl border-2 border-line px-4 py-3 text-sm font-medium text-ink transition hover:bg-surface-2 ${state}`}
              >
                {SIGNS[o].name}
                {picked && o === current && <Check size={18} className="text-ok" />}
                {picked && o === picked && o !== current && <X size={18} className="text-bad" />}
              </button>
            )
          })}
        </div>
        {picked && (
          <div className="mt-4 text-left">
            <p className="text-sm text-muted">{SIGNS[current].meaning}</p>
            <Button className="mt-4 w-full" onClick={next}>
              Next sign
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
