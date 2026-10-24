import { Link } from 'react-router'
import { BookOpen, CalendarDays, Check, ClipboardCheck, Eye, Flame, Play, CircleDot } from 'lucide-react'
import type { ReactNode } from 'react'
import { RoadScene } from '../../components/art/RoadScene'
import { Card } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/Progress'
import { useProgress } from '../../store/progress'
import { lessonState } from '../drive/DriveLessons'
import { PLAYABLE } from '../drive/lessons'
import { bestByLesson, readiness, streakDays } from '../progress/stats'
import { lessonForVideo } from '../video/videos'

const DAY = 24 * 60 * 60 * 1000
const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString()

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function HomePage() {
  const stats = useProgress((s) => s.questionStats)
  const mocks = useProgress((s) => s.mockResults)
  const hazards = useProgress((s) => s.hazardResults)
  const runs = useProgress((s) => s.driveRuns)
  const logbook = useProgress((s) => s.logbook)
  const watched = useProgress((s) => s.watched)
  const settings = useProgress((s) => s.settings)
  const updateSettings = useProgress((s) => s.updateSettings)

  const now = Date.now()
  const best = bestByLesson(runs)
  const next = PLAYABLE.find((l) => lessonState(l, best, settings.unlockAll ?? false) === 'open') ?? PLAYABLE[PLAYABLE.length - 1]
  const nextVideo = next.video
  const r = readiness({ stats, mocks, hazards, runs, logbook })
  const answeredToday = Object.values(stats).filter((q) => sameDay(q.lastSeen, now)).length
  const stamps = [
    ...Object.values(stats).map((q) => q.lastSeen),
    ...runs.map((x) => x.date),
    ...Object.values(watched),
    ...hazards.map((h) => h.date),
    ...mocks.map((m) => m.date),
    ...logbook.map((e) => new Date(e.date + 'T12:00:00').getTime()),
  ]
  const streak = streakDays(stamps, now)
  const days = settings.testDate ? Math.ceil((new Date(settings.testDate).getTime() - now) / DAY) : undefined

  const plan = [
    { to: '/theory/practice/all', title: 'Daily 10: practice questions', meta: 'Theory · 5 min', done: answeredToday >= 10, tone: 'bg-brand-soft text-brand', icon: <BookOpen size={18} /> },
    {
      to: nextVideo ? `/watch/${nextVideo}` : '/watch',
      title: `Watch: ${lessonForVideo(nextVideo ?? '')?.title.toLowerCase() ?? 'a video helper'}`,
      meta: 'Video helper · 1 min',
      done: !!nextVideo && !!watched[nextVideo] && sameDay(watched[nextVideo], now),
      tone: 'bg-[#e6eefb] text-[#1f4fa8]',
      icon: <Play size={18} />,
    },
    { to: `/drive/${next.n}`, title: `Drive lesson ${next.n}`, meta: `${next.sub} · 3 min`, done: runs.some((x) => x.n === next.n && sameDay(x.date, now)), tone: 'bg-[#fff3d6] text-[#7a4300]', icon: <CircleDot size={18} /> },
  ]
  const doneCount = plan.filter((p) => p.done).length

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[15px] text-muted">{greeting()}</p>
          <h1 className="font-display mt-1 text-3xl leading-none font-extrabold tracking-[-0.02em] md:text-[40px]">Your plan for today</h1>
        </div>
        {streak > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-[#fff3d6] px-3.5 py-2 text-sm font-bold text-[#7a4300]">
            <Flame size={16} /> {streak}-day streak
          </span>
        )}
      </header>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-6">
          <section aria-label="Continue your lesson" className="relative h-[300px] overflow-hidden rounded-3xl bg-[#bfe4f6]">
            <RoadScene className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-[420px] rounded-2xl bg-navy/90 px-4.5 py-3.5 text-white">
                <p className="text-xs font-bold tracking-[0.08em] text-accent uppercase">Drive · Lesson {next.n} of 22</p>
                <p className="font-display mt-1 text-2xl leading-tight font-extrabold">{next.title}</p>
                <p className="mt-1.5 text-[13px] text-[#d7dee8]">3-minute drive · marked on {next.marked?.slice(0, 3).join(', ').toLowerCase()}</p>
              </div>
              <Link to={`/drive/${next.n}`} className="rounded-2xl bg-[#13a36f] px-6 py-3.5 text-base font-extrabold text-[#04140e] transition hover:brightness-110">
                {best[next.n] ? 'Drive it again' : 'Continue lesson'}
              </Link>
            </div>
          </section>

          <section aria-labelledby="today-h" className="rounded-3xl border border-line bg-surface p-5">
            <div className="mb-3.5 flex items-baseline justify-between">
              <h2 id="today-h" className="text-lg font-extrabold">
                Today · about 9 minutes
              </h2>
              <span className="text-[13px] text-muted">{doneCount} of 3 done</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
              {plan.map((p) => (
                <Link key={p.to} to={p.to} className={`flex items-start gap-3 rounded-2xl border border-line p-3.5 transition hover:border-brand/40 ${p.done ? 'bg-[#f3faf6]' : 'bg-surface'}`}>
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${p.done ? 'border-brand bg-brand text-white' : 'border-[#b7c1cc]'}`} aria-label={p.done ? 'Done' : 'Not done yet'}>
                    {p.done && <Check size={13} strokeWidth={3.5} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`mb-2.5 grid h-9 w-9 place-items-center rounded-[10px] ${p.tone}`}>{p.icon}</span>
                    <span className="block text-[15px] leading-snug font-bold">{p.title}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">{p.meta}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-6">
          <section aria-labelledby="ready-h" className="rounded-3xl border border-line bg-surface p-5">
            <h2 id="ready-h" className="mb-3.5 text-lg font-extrabold">
              Readiness
            </h2>
            <div className="flex items-center gap-4.5">
              <Ring value={r.total} />
              <ul className="flex flex-1 flex-col gap-2.5">
                {r.parts.map((p) => (
                  <li key={p.key}>
                    <div className="flex justify-between text-[13px] font-semibold">
                      <span>{p.label}</span>
                      <span className="text-muted">{p.display}</span>
                    </div>
                    <ProgressBar value={p.value} className="mt-1 h-1.5" />
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 rounded-xl bg-bg px-3 py-2.5 text-[13px] leading-relaxed text-ink/80">
              {r.verdict === 'Ready' ? 'You look test-ready. Keep practising and book a mock test.' : `${r.verdict === 'Getting there' ? 'Getting there.' : 'Not test-ready yet.'}${r.steps[0] ? ` ${r.steps[0]}.` : ''}`}{' '}
              <Link to="/progress" className="font-semibold text-brand">
                See why
              </Link>
            </p>
          </section>

          <section aria-label="Your practical test" className="rounded-3xl bg-brand p-5 text-white">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.08em] text-[#cdebdd] uppercase">
              <CalendarDays size={14} /> Practical test
            </p>
            {days !== undefined && days >= 0 ? (
              <p className="font-display mt-1.5 mb-1 text-[34px] leading-none font-extrabold">
                {days} day{days === 1 ? '' : 's'} to go
              </p>
            ) : (
              <p className="mt-1.5 mb-1 text-lg font-bold">Add your test date for a countdown</p>
            )}
            <div className="mt-3 flex flex-col gap-2">
              <label className="text-[13px] text-[#e3f4ec]">
                Test date
                <input type="date" value={settings.testDate ?? ''} onChange={(e) => updateSettings({ testDate: e.target.value || undefined })} className="mt-1 block w-full rounded-xl border-0 bg-white/95 px-3 py-2 text-sm text-ink" />
              </label>
              <label className="text-[13px] text-[#e3f4ec]">
                Test centre
                <input type="text" value={settings.testCentre ?? ''} placeholder="Your test centre" onChange={(e) => updateSettings({ testCentre: e.target.value || undefined })} className="mt-1 block w-full rounded-xl border-0 bg-white/95 px-3 py-2 text-sm text-ink placeholder:text-muted" />
              </label>
            </div>
            <Link to="/practical/test-day" className="mt-3.5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#08553d]">
              Test-day checklist
            </Link>
          </section>
        </div>
      </div>

      <section aria-labelledby="keep-h" className="mt-8">
        <h2 id="keep-h" className="mb-3 text-lg font-extrabold">
          Keep learning
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <Tile to="/theory/mock" title="Full theory mock" meta="50 questions in 57 minutes" tone="bg-brand-soft text-brand" icon={<BookOpen size={20} />} />
          <Tile to="/hazard" title="Hazard perception" meta="Interactive 3D clips, scored 0–5" tone="bg-bad-soft text-bad" icon={<Eye size={20} />} />
          <Tile to="/watch" title="Watch library" meta="Short animated explainers" tone="bg-[#e6eefb] text-[#1f4fa8]" icon={<Play size={20} />} />
          <Tile to="/practical" title="Logbook" meta="Track your real driving hours" tone="bg-[#fff3d6] text-[#7a4300]" icon={<ClipboardCheck size={20} />} />
        </div>
      </section>

      <h2 className="mt-8 mb-3 text-lg font-extrabold">The tests at a glance</h2>
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
          <li>• From 12 May 2026 only the learner can book or manage their own car test on GOV.UK, not instructors or third-party sites.</li>
          <li>• From 9 June 2026 a booked test can only be moved to one of the three centres nearest to it (or the original centre).</li>
          <li>• The government has consulted on a minimum learning period of three or six months between passing theory and taking the practical test. No decision yet.</li>
        </ul>
        <p className="mt-3 text-xs text-muted">Fees: theory £23; practical £62 on weekdays, £75 evenings, weekends and bank holidays. Always check GOV.UK before booking.</p>
      </Card>
    </>
  )
}

function Tile({ to, title, meta, tone, icon }: { to: string; title: string; meta: string; tone: string; icon: ReactNode }) {
  return (
    <Link to={to} className="block rounded-[20px] border border-line bg-surface p-4.5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-black/5">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>{icon}</span>
      <span className="mt-3 block text-base font-bold">{title}</span>
      <span className="mt-0.5 block text-[13px] text-muted">{meta}</span>
    </Link>
  )
}

function Ring({ value }: { value: number }) {
  const r = 47
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label={`${Math.round(value * 100)} percent ready`}>
        <circle cx="56" cy="56" r={r} fill="none" stroke="var(--c-surface-2)" strokeWidth="12" />
        <circle cx="56" cy="56" r={r} fill="none" stroke="var(--c-brand)" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} transform="rotate(-90 56 56)" style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <span className="font-display absolute inset-0 grid place-items-center text-[30px] font-extrabold">{Math.round(value * 100)}%</span>
    </div>
  )
}
