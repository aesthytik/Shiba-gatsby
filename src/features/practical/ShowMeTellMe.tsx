import { useMemo, useState } from 'react'
import { Check, HelpCircle, RotateCw } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { VEHICLE_QUESTIONS } from '../../data/practical'
import { useProgress } from '../../store/progress'

type Filter = 'all' | 'tell' | 'show' | 'unsure'

export function ShowMeTellMe() {
  const ratings = useProgress((s) => s.showMeTellMe)
  const rate = useProgress((s) => s.rateShowMeTellMe)
  const [filter, setFilter] = useState<Filter>('all')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const deck = useMemo(
    () => VEHICLE_QUESTIONS.filter((q) => (filter === 'all' ? true : filter === 'unsure' ? ratings[q.id] !== 'know' : q.kind === filter)),
    // Ratings are read when the filter changes, not live, so the deck doesn't shift under you.
    [filter],
  )
  const card = deck[index % Math.max(1, deck.length)]
  const known = VEHICLE_QUESTIONS.filter((q) => ratings[q.id] === 'know').length

  const next = (rating?: 'know' | 'unsure') => {
    if (rating && card) rate(card.id, rating)
    setFlipped(false)
    setIndex((i) => (i + 1) % Math.max(1, deck.length))
  }

  return (
    <>
      <PageHeader
        title="Show me, tell me"
        subtitle="You'll be asked one 'tell me' question before you drive and one 'show me' question while driving. A wrong answer is one driving fault."
        back="/practical"
        actions={<Badge tone="brand">{known} / {VEHICLE_QUESTIONS.length} known</Badge>}
      />

      <div className="mb-5 flex flex-wrap gap-1 rounded-xl bg-surface-2 p-1 text-sm sm:inline-flex">
        {(
          [
            ['all', 'All 21'],
            ['tell', 'Tell me (14)'],
            ['show', 'Show me (7)'],
            ['unsure', 'Still learning'],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFilter(f)
              setIndex(0)
              setFlipped(false)
            }}
            className={`rounded-lg px-3 py-1.5 font-semibold ${filter === f ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {!card ? (
        <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">Nothing left to learn in this set — nice work.</p>
      ) : (
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className={`flex min-h-64 w-full flex-col justify-between rounded-2xl border-2 p-6 text-left transition md:p-8 ${flipped ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-brand/40'}`}
          >
            <div className="flex items-center justify-between">
              <Badge tone={card.kind === 'tell' ? 'warn' : 'brand'}>{card.kind === 'tell' ? 'Tell me' : 'Show me'}</Badge>
              <span className="text-xs font-semibold text-muted">
                {(index % deck.length) + 1} / {deck.length}
              </span>
            </div>
            <p className="my-6 text-lg leading-snug font-semibold text-ink md:text-xl">{flipped ? card.a : card.q}</p>
            <span className="flex items-center gap-1.5 text-sm text-muted">
              <RotateCw size={14} /> {flipped ? 'Tap to see the question' : 'Tap to reveal the answer'}
            </span>
          </button>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => next('unsure')}>
              <HelpCircle size={16} /> Still learning
            </Button>
            <Button onClick={() => next('know')}>
              <Check size={16} /> I know this
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
