import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Flag, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/Progress'
import { TOPICS, type TopicId } from '../../data/topics'
import { formatClock } from '../../lib/random'
import { useProgress, type MockResult } from '../../store/progress'
import { buildMockTest, MOCK, prepare, type PreparedQuestion } from './logic'
import { QuestionCard } from './QuestionCard'

type Phase = 'intro' | 'running' | 'results'

export function MockTest() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [items, setItems] = useState<PreparedQuestion[]>([])
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [result, setResult] = useState<MockResult | null>(null)

  const start = () => {
    const qs = buildMockTest().map((q) => prepare(q))
    setItems(qs)
    setAnswers(qs.map(() => null))
    setPhase('running')
  }

  if (phase === 'intro') {
    return (
      <>
        <PageHeader title="Mock theory test" back="/theory" />
        <Card className="max-w-2xl">
          <ul className="space-y-3 text-[15px] text-ink">
            <li className="flex gap-3">
              <Clock className="mt-0.5 shrink-0 text-brand" size={20} /> {MOCK.questions} questions, {MOCK.minutes} minutes. The test ends automatically when time runs out.
            </li>
            <li className="flex gap-3">
              <Flag className="mt-0.5 shrink-0 text-brand" size={20} /> Flag questions you are unsure about and come back to them before you finish.
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-brand" size={20} /> You need {MOCK.passMark} correct ({Math.round((MOCK.passMark / MOCK.questions) * 100)}%) to pass. Answers are revealed at the end.
            </li>
          </ul>
          <p className="mt-5 rounded-xl bg-warn-soft p-3 text-sm text-ink">
            In the real test, 3 of the 50 questions are based on a short video clip. This mock uses written questions only for now.
          </p>
          <Button className="mt-6 w-full sm:w-auto" onClick={start}>
            Start mock test
          </Button>
        </Card>
      </>
    )
  }

  if (phase === 'results' && result) return <Results items={items} answers={answers} result={result} onRetry={start} />

  return (
    <Running
      items={items}
      answers={answers}
      setAnswers={setAnswers}
      onFinish={(durationSec) => {
        const r = score(items, answers, durationSec)
        const { recordAnswer, addMockResult } = useProgress.getState()
        items.forEach((p, i) => answers[i] !== null && recordAnswer(p.question.id, answers[i] === p.correctIndex))
        addMockResult(r)
        setResult(r)
        setPhase('results')
      }}
    />
  )
}

function score(items: PreparedQuestion[], answers: (number | null)[], durationSec: number): MockResult {
  const byTopic: MockResult['byTopic'] = {}
  let correct = 0
  items.forEach((p, i) => {
    const ok = answers[i] === p.correctIndex
    if (ok) correct++
    const t = (byTopic[p.question.topic] ??= { correct: 0, total: 0 })
    t.total++
    if (ok) t.correct++
  })
  return { id: crypto.randomUUID(), date: Date.now(), score: correct, total: items.length, passed: correct >= MOCK.passMark, durationSec, byTopic }
}

function Running({
  items,
  answers,
  setAnswers,
  onFinish,
}: {
  items: PreparedQuestion[]
  answers: (number | null)[]
  setAnswers: (a: (number | null)[]) => void
  onFinish: (durationSec: number) => void
}) {
  const [index, setIndex] = useState(0)
  const [flags, setFlags] = useState<Set<number>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const startedAt = useRef(Date.now())
  const [now, setNow] = useState(Date.now())
  const remaining = MOCK.minutes * 60 - (now - startedAt.current) / 1000
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (remaining <= 0) finishRef.current(MOCK.minutes * 60)
  }, [remaining])

  const answeredCount = answers.filter((a) => a !== null).length
  const unanswered = items.length - answeredCount

  const toggleFlag = () =>
    setFlags((f) => {
      const n = new Set(f)
      if (n.has(index)) n.delete(index)
      else n.add(index)
      return n
    })

  return (
    <>
      <div className="sticky top-14 z-20 -mx-4 mb-4 flex items-center gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur md:top-0 md:-mx-8 md:px-8">
        <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-sm font-bold ${remaining < 300 ? 'bg-bad-soft text-bad' : 'bg-surface-2 text-ink'}`}>
          <Clock size={15} /> {formatClock(remaining)}
        </span>
        <ProgressBar value={answeredCount / items.length} className="flex-1" />
        <span className="text-xs font-semibold text-muted">
          {answeredCount}/{items.length}
        </span>
        <Button variant="secondary" className="py-1.5" onClick={() => setConfirming(true)}>
          Finish
        </Button>
      </div>

      {confirming && (
        <Card className="mb-4 border-warn bg-warn-soft">
          <p className="font-semibold text-ink">Finish the test now?</p>
          <p className="mt-1 text-sm text-muted">
            {unanswered ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. ` : ''}
            {flags.size ? `${flags.size} flagged for review. ` : ''}You cannot change answers after finishing.
          </p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => onFinish(Math.round((Date.now() - startedAt.current) / 1000))}>Yes, finish</Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Keep going
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        <div>
          <QuestionCard
            prepared={items[index]}
            selected={answers[index]}
            onSelect={(i) => setAnswers(answers.map((a, j) => (j === index ? i : a)))}
            reveal={false}
            index={index}
            total={items.length}
          />
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              <ArrowLeft size={16} /> Previous
            </Button>
            <Button variant={flags.has(index) ? 'danger' : 'ghost'} onClick={toggleFlag}>
              <Flag size={16} /> {flags.has(index) ? 'Flagged' : 'Flag'}
            </Button>
            {index < items.length - 1 ? (
              <Button onClick={() => setIndex(index + 1)}>
                Next <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={() => setConfirming(true)}>Review &amp; finish</Button>
            )}
          </div>
        </div>

        <Card className="h-fit p-4">
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Questions</p>
          <div className="grid grid-cols-10 gap-1.5 lg:grid-cols-5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Question ${i + 1}${answers[i] !== null ? ', answered' : ''}${flags.has(i) ? ', flagged' : ''}`}
                className={`relative aspect-square rounded-md text-[11px] font-bold transition ${
                  i === index ? 'ring-2 ring-brand' : ''
                } ${answers[i] !== null ? 'bg-brand text-brand-ink' : 'bg-surface-2 text-muted hover:bg-line'}`}
              >
                {i + 1}
                {flags.has(i) && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-bad" />}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

function Results({ items, answers, result, onRetry }: { items: PreparedQuestion[]; answers: (number | null)[]; result: MockResult; onRetry: () => void }) {
  const [filter, setFilter] = useState<'wrong' | 'all'>('wrong')
  const shown = useMemo(() => items.map((p, i) => ({ p, i })).filter(({ p, i }) => filter === 'all' || answers[i] !== p.correctIndex), [answers, filter, items])

  return (
    <>
      <PageHeader title="Mock test results" back="/theory" />
      <Card className={`mb-6 text-center ${result.passed ? 'border-ok' : 'border-bad'}`}>
        {result.passed ? <CheckCircle2 className="animate-pop mx-auto text-ok" size={48} /> : <XCircle className="animate-pop mx-auto text-bad" size={48} />}
        <p className="mt-3 text-5xl font-extrabold text-ink">
          {result.score}
          <span className="text-2xl text-muted">/{result.total}</span>
        </p>
        <p className={`mt-1 text-lg font-bold ${result.passed ? 'text-ok' : 'text-bad'}`}>{result.passed ? 'Pass' : 'Not this time'}</p>
        <p className="mt-1 text-sm text-muted">
          Pass mark {MOCK.passMark}. Time taken {formatClock(result.durationSec)}.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button onClick={onRetry}>New mock test</Button>
          <ButtonLink to="/theory" variant="secondary">
            Back to theory
          </ButtonLink>
        </div>
      </Card>

      <h2 className="mb-3 text-lg font-bold text-ink">By topic</h2>
      <Card className="mb-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {TOPICS.filter((t) => result.byTopic[t.id as TopicId]).map((t) => {
          const r = result.byTopic[t.id as TopicId]!
          return (
            <div key={t.id}>
              <div className="flex justify-between text-sm">
                <span className="text-ink">{t.name}</span>
                <span className="font-semibold text-muted">
                  {r.correct}/{r.total}
                </span>
              </div>
              <ProgressBar value={r.correct / r.total} tone={r.correct === r.total ? 'ok' : r.correct / r.total < 0.6 ? 'bad' : 'brand'} className="mt-1" />
            </div>
          )
        })}
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Review answers</h2>
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1 text-sm">
          {(['wrong', 'all'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1 font-medium ${filter === f ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}>
              {f === 'wrong' ? 'Incorrect' : 'All'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4">
        {shown.length === 0 && <Badge tone="ok">No incorrect answers — perfect score!</Badge>}
        {shown.map(({ p, i }) => (
          <QuestionCard key={p.question.id} prepared={p} selected={answers[i]} onSelect={() => {}} reveal index={i} total={items.length} />
        ))}
      </div>
    </>
  )
}
