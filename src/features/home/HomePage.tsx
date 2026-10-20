import { BookOpen, CalendarDays, Car, Map, TriangleAlert } from 'lucide-react'
import { Card, LinkCard } from '../../components/ui/Card'
import { ProgressRing } from '../../components/ui/Progress'
import { useProgress } from '../../store/progress'
import { SKILLS } from '../../data/practical'
import { theoryReadiness, mistakesCount } from '../theory/logic'

const DAY = 24 * 60 * 60 * 1000

export function HomePage() {
  const stats = useProgress((s) => s.questionStats)
  const mocks = useProgress((s) => s.mockResults)
  const hazards = useProgress((s) => s.hazardResults)
  const checklist = useProgress((s) => s.checklist)
  const testDate = useProgress((s) => s.settings.testDate)
  const updateSettings = useProgress((s) => s.updateSettings)

  const theory = theoryReadiness(stats, mocks[0] ? mocks[0].score / mocks[0].total : undefined)
  const recentHazards = hazards.slice(0, 10)
  const hazardPct = recentHazards.length ? recentHazards.reduce((a, r) => a + r.score / r.max, 0) / recentHazards.length : 0
  const skills = SKILLS.flatMap((g) => g.items)
  const practical = skills.filter((s) => checklist[`skill:${s}`]).length / skills.length
  const daysLeft = testDate ? Math.ceil((new Date(testDate).getTime() - Date.now()) / DAY) : undefined
  const mistakes = mistakesCount(stats)

  return (
    <>
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-brand p-6 text-brand-ink md:p-8">
        <svg className="pointer-events-none absolute -right-10 -bottom-10 h-56 w-56 opacity-15" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 9 L93 86 H7 Z" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
        </svg>
        <p className="text-sm font-semibold tracking-wide uppercase opacity-80">Learning to drive in the UK</p>
        <h1 className="mt-1 max-w-xl text-2xl leading-tight font-extrabold md:text-4xl">Get test-ready for your theory and practical tests</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed opacity-90">
          Practice questions written from the Highway Code, 3D hazard perception clips scored like the real thing, a step-by-step test day guide and test-style routes to
          drive in 3D.
        </p>
      </section>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <h2 className="mb-4 font-semibold text-ink">Your progress</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center gap-2">
              <ProgressRing value={theory} label="theory" />
              <span className="text-xs text-muted">{mistakes ? `${mistakes} to review` : 'Questions & mocks'}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ProgressRing value={hazardPct} label="hazards" />
              <span className="text-xs text-muted">{recentHazards.length ? `Last ${recentHazards.length} clips` : 'No clips yet'}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ProgressRing value={practical} label="skills" />
              <span className="text-xs text-muted">Skills checklist</span>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-ink">
            <CalendarDays size={18} className="text-brand" /> Test date
          </h2>
          {daysLeft !== undefined && daysLeft >= 0 ? (
            <p className="text-3xl font-extrabold text-ink">
              {daysLeft} <span className="text-base font-semibold text-muted">day{daysLeft === 1 ? '' : 's'} to go</span>
            </p>
          ) : (
            <p className="text-sm text-muted">Add your test date for a countdown.</p>
          )}
          <input
            type="date"
            value={testDate ?? ''}
            onChange={(e) => updateSettings({ testDate: e.target.value || undefined })}
            className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
            aria-label="Test date"
          />
        </Card>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <LinkCard to="/theory" icon={<BookOpen size={22} />} title="Theory test">
          Practise by topic, review mistakes, learn road signs and take timed 50-question mocks.
        </LinkCard>
        <LinkCard to="/hazard" icon={<TriangleAlert size={22} />} title="Hazard perception" tone="warn">
          Interactive 3D clips in different weather, scored on the DVSA 5-point scale.
        </LinkCard>
        <LinkCard to="/practical" icon={<Car size={22} />} title="Practical test" tone="ok">
          Test day walkthrough, show me / tell me, animated manoeuvres and a mock test marker.
        </LinkCard>
        <LinkCard to="/routes" icon={<Map size={22} />} title="Test routes">
          Turn-by-turn route previews with hotspots and a 3D drive-through.
        </LinkCard>
      </div>

      <h2 className="mb-3 text-lg font-bold text-ink">The tests at a glance</h2>
      <div className="mb-8 grid gap-3 md:grid-cols-3">
        {[
          { t: 'Theory: multiple choice', l: ['50 questions in 57 minutes', 'Pass mark 43 / 50', '3 questions are based on a video clip'] },
          { t: 'Theory: hazard perception', l: ['14 clips, 15 developing hazards', 'Up to 5 points per hazard', 'Pass mark 44 / 75'] },
          { t: 'Practical test', l: ['About 40 minutes', 'Up to 15 driving faults', 'No serious or dangerous faults'] },
        ].map((c) => (
          <Card key={c.t} className="p-4">
            <p className="font-semibold text-ink">{c.t}</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {c.l.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="border-brand/30">
        <h2 className="font-semibold text-ink">What's changed in 2026</h2>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
          <li>• From 31 March 2026 you can change a car test booking only twice before you have to cancel and rebook.</li>
          <li>• From 12 May 2026 only the learner can book or manage their own car test on GOV.UK — not instructors or third-party sites.</li>
          <li>• From 9 June 2026 a booked test can only be moved to one of the three centres nearest to it (or the original centre).</li>
          <li>• The government has consulted on a minimum learning period of three or six months between passing theory and taking the practical test. No decision yet.</li>
        </ul>
        <p className="mt-3 text-xs text-muted">Fees: theory £23; practical £62 on weekdays, £75 evenings, weekends and bank holidays. Always check GOV.UK before booking.</p>
      </Card>
    </>
  )
}
