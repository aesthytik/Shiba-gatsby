import { Link } from 'react-router'
import { ClipboardCheck, RotateCcw, Shuffle, Signpost, Timer } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { LinkCard, Card } from '../../components/ui/Card'
import { ProgressBar, ProgressRing } from '../../components/ui/Progress'
import { Badge } from '../../components/ui/Badge'
import { TOPICS } from '../../data/topics'
import { QUESTIONS, TOPIC_COUNTS } from '../../data/questions'
import { useProgress } from '../../store/progress'
import { MOCK, mistakesCount, theoryReadiness, topicMastery } from './logic'

export function TheoryHome() {
  const stats = useProgress((s) => s.questionStats)
  const mocks = useProgress((s) => s.mockResults)
  const mistakes = mistakesCount(stats)
  const lastMock = mocks[0]
  const readiness = theoryReadiness(stats, lastMock ? lastMock.score / lastMock.total : undefined)
  const answered = Object.keys(stats).length

  return (
    <>
      <PageHeader
        title="Theory test"
        subtitle={`${MOCK.questions} multiple-choice questions in ${MOCK.minutes} minutes — you need ${MOCK.passMark} to pass. Then hazard perception: 14 clips, pass mark 44 out of 75. You must pass both parts in the same sitting.`}
      />

      <Card className="mb-6 flex flex-wrap items-center gap-6">
        <ProgressRing value={readiness} size={92} label="ready" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">Your theory readiness</p>
          <p className="mt-1 text-sm text-muted">
            {answered} of {QUESTIONS.length} practice questions answered.{' '}
            {lastMock ? `Last mock: ${lastMock.score}/${lastMock.total} (${lastMock.passed ? 'pass' : 'fail'}).` : 'Take a mock test to calibrate your score.'}
          </p>
        </div>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <LinkCard to="/theory/mock" icon={<Timer size={22} />} title="Mock theory test">
          Exam conditions: {MOCK.questions} questions, {MOCK.minutes}-minute timer, flag and review before you submit.
        </LinkCard>
        <LinkCard to="/theory/practice/all" icon={<Shuffle size={22} />} title="Quick 20">
          Twenty random questions from every topic with instant feedback.
        </LinkCard>
        <LinkCard
          to="/theory/practice/mistakes"
          icon={<RotateCcw size={22} />}
          title="Review mistakes"
          tone={mistakes ? 'bad' : 'ok'}
          footer={mistakes ? <Badge tone="bad">{mistakes} to review</Badge> : <Badge tone="ok">All clear</Badge>}
        >
          Questions you got wrong come back until you get them right.
        </LinkCard>
        <LinkCard to="/theory/signs" icon={<Signpost size={22} />} title="Road signs" tone="warn">
          Browse signs and markings by type, then test yourself.
        </LinkCard>
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
        <ClipboardCheck size={20} className="text-brand" /> Practise by topic
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((t) => {
          const m = topicMastery(t.id, stats)
          return (
            <Link key={t.id} to={`/theory/practice/${t.id}`} className="rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/40 hover:shadow-md hover:shadow-black/5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{t.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{t.blurb}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-muted">{TOPIC_COUNTS[t.id]} Qs</span>
              </div>
              <ProgressBar value={m} tone={m >= 0.86 ? 'ok' : 'brand'} className="mt-3" />
              <p className="mt-1.5 text-xs text-muted">{Math.round(m * 100)}% mastered</p>
            </Link>
          )
        })}
      </div>

      {mocks.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-bold text-ink">Mock test history</h2>
          <Card className="divide-y divide-line p-0">
            {mocks.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted">{new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="font-semibold text-ink">
                  {m.score}/{m.total}
                </span>
                <Badge tone={m.passed ? 'ok' : 'bad'}>{m.passed ? 'Pass' : 'Fail'}</Badge>
              </div>
            ))}
          </Card>
        </>
      )}
    </>
  )
}
