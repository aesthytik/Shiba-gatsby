import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { ArrowRight, PartyPopper, RotateCcw } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/Progress'
import { TOPICS, topicName, type TopicId } from '../../data/topics'
import { useProgress } from '../../store/progress'
import { deckQuestions, prepare, type DeckId } from './logic'
import { QuestionCard } from './QuestionCard'

function deckTitle(deck: DeckId) {
  if (deck === 'all') return 'Quick 20'
  if (deck === 'mistakes') return 'Review mistakes'
  return topicName(deck)
}

export function PracticeSession() {
  const { deck = 'all' } = useParams()
  const validDeck = (['all', 'mistakes', ...TOPICS.map((t) => t.id)] as string[]).includes(deck) ? (deck as DeckId) : 'all'
  const [round, setRound] = useState(0)
  return <Session key={`${validDeck}-${round}`} deck={validDeck} onRestart={() => setRound((r) => r + 1)} />
}

function Session({ deck, onRestart }: { deck: DeckId; onRestart: () => void }) {
  const recordAnswer = useProgress((s) => s.recordAnswer)
  // Snapshot the deck once per session so answering doesn't reshuffle it.
  const [items] = useState(() => deckQuestions(deck, useProgress.getState().questionStats).map((q) => prepare(q)))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [results, setResults] = useState<boolean[]>([])

  const current = items[index]
  const done = index >= items.length
  const correctCount = useMemo(() => results.filter(Boolean).length, [results])

  const choose = useCallback(
    (i: number) => {
      if (selected !== null || !current) return
      setSelected(i)
      const ok = i === current.correctIndex
      recordAnswer(current.question.id, ok)
      setResults((r) => [...r, ok])
    },
    [current, recordAnswer, selected],
  )

  const next = useCallback(() => {
    setSelected(null)
    setIndex((i) => i + 1)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = '1234'.indexOf(e.key) + 1 || 'abcd'.indexOf(e.key.toLowerCase()) + 1
      if (n && selected === null) choose(n - 1)
      else if (e.key === 'Enter' && selected !== null) next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choose, next, selected])

  if (!items.length) {
    return (
      <>
        <PageHeader title={deckTitle(deck)} back="/theory" />
        <Card className="text-center">
          <PartyPopper className="mx-auto mb-3 text-ok" size={36} />
          <p className="font-semibold text-ink">Nothing to review</p>
          <p className="mt-1 text-sm text-muted">You have no wrong answers waiting. Try a topic or a mock test.</p>
          <ButtonLink to="/theory" className="mt-4">
            Back to theory
          </ButtonLink>
        </Card>
      </>
    )
  }

  if (done) {
    const pct = correctCount / items.length
    const missed = items.filter((_, i) => !results[i])
    return (
      <>
        <PageHeader title={deckTitle(deck)} back="/theory" />
        <Card className="text-center">
          <p className="text-sm font-semibold tracking-wide text-muted uppercase">Session complete</p>
          <p className="mt-2 text-5xl font-extrabold text-ink">
            {correctCount}
            <span className="text-2xl text-muted">/{items.length}</span>
          </p>
          <p className={`mt-2 font-semibold ${pct >= 0.86 ? 'text-ok' : 'text-warn'}`}>
            {pct >= 0.86 ? 'At or above the 86% pass standard — great work.' : 'Below the 86% pass standard — review the ones you missed.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button onClick={onRestart}>
              <RotateCcw size={16} /> Go again
            </Button>
            {missed.length > 0 && (
              <ButtonLink to="/theory/practice/mistakes" variant="secondary">
                Review mistakes
              </ButtonLink>
            )}
            <ButtonLink to="/theory" variant="ghost">
              Done
            </ButtonLink>
          </div>
        </Card>
        {missed.length > 0 && (
          <div className="mt-6 grid gap-3">
            <h2 className="text-lg font-bold text-ink">Questions to revisit</h2>
            {missed.map((p) => (
              <Card key={p.question.id} className="text-sm">
                <p className="font-semibold text-ink">{p.question.q}</p>
                <p className="mt-1 text-ok">✓ {p.question.options[0]}</p>
                <p className="mt-1 text-muted">{p.question.explain}</p>
              </Card>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <PageHeader title={deckTitle(deck)} back="/theory" subtitle={deck !== 'all' && deck !== 'mistakes' ? TOPICS.find((t) => t.id === (deck as TopicId))?.blurb : undefined} />
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={index / items.length} className="flex-1" />
        <span className="text-xs font-semibold text-muted">
          {correctCount} correct
        </span>
      </div>
      <QuestionCard prepared={current} selected={selected} onSelect={choose} reveal={selected !== null} index={index} total={items.length} />
      <div className="mt-4 flex justify-end">
        <Button onClick={next} disabled={selected === null}>
          {index + 1 === items.length ? 'Finish' : 'Next question'} <ArrowRight size={16} />
        </Button>
      </div>
      <p className="mt-3 hidden text-right text-xs text-muted md:block">Tip: press 1–4 to answer, Enter for next.</p>
    </>
  )
}
