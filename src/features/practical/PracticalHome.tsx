import { useState } from 'react'
import { Link } from 'react-router'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/Progress'
import { SectionTabs } from '../../components/layout/SectionTabs'
import { SKILLS, VEHICLE_QUESTIONS } from '../../data/practical'
import { useProgress, type LogEntry } from '../../store/progress'
import { logHours, TARGET_HOURS } from '../progress/stats'

const LEVELS = ['Introduced', 'Under instruction', 'Prompted', 'Seldom prompted', 'Independent']
const LEVEL_TEXT = ['text-bad', 'text-bad', 'text-warn', 'text-warn', 'text-ok']

const BRING = ['Your provisional licence (photocard)', 'Glasses or contact lenses if you need them', "A car that meets the test rules (or your instructor's)", 'Arrive 10 minutes early']

const today = () => new Date().toISOString().slice(0, 10)
const hrs = (n: number) => `${Math.round(n * 10) / 10}`

export function PracticalHome() {
  const logbook = useProgress((s) => s.logbook)
  const addLog = useProgress((s) => s.addLog)
  const removeLog = useProgress((s) => s.removeLog)
  const levels = useProgress((s) => s.skillLevels)
  const setLevel = useProgress((s) => s.setSkillLevel)
  const checklist = useProgress((s) => s.checklist)
  const toggle = useProgress((s) => s.toggleChecklist)
  const rated = useProgress((s) => s.showMeTellMe)
  const settings = useProgress((s) => s.settings)
  const [form, setForm] = useState<{ date: string; who: LogEntry['who']; minutes: string; notes: string } | null>(null)

  const hours = logHours(logbook)
  const skills = SKILLS.flatMap((g) => g.items)
  const levelOf = (item: string) => levels[item] ?? (checklist[`skill:${item}`] ? 4 : 0)
  const started = (item: string) => levels[item] !== undefined || levelOf(item) > 0
  const independent = skills.filter((s) => levelOf(s) === 4).length
  const known = VEHICLE_QUESTIONS.filter((q) => rated[q.id] === 'know').length
  const weakest = [...skills].sort((a, b) => levelOf(a) - levelOf(b)).slice(0, 3)

  const save = () => {
    if (!form) return
    const minutes = Math.round(Number(form.minutes))
    if (!form.date || !(minutes >= 5 && minutes <= 600)) return
    addLog({ id: `${Date.now()}`, date: form.date, who: form.who, minutes, notes: form.notes.trim() })
    setForm(null)
  }

  return (
    <>
      <PageHeader
        title="Practical"
        subtitle="Log your real driving, track skills the way instructors do, and get ready for test day."
        actions={
          <Button onClick={() => setForm({ date: today(), who: 'instructor', minutes: '60', notes: '' })} className="min-h-11 px-4.5">
            <Plus size={16} strokeWidth={2.6} /> Log a drive
          </Button>
        }
      />
      <SectionTabs section="practical" />

      {form && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
          aria-label="Log a drive"
          className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] items-end gap-3 rounded-3xl border border-brand/40 bg-surface p-5"
        >
          <label className="text-sm font-semibold">
            Date
            <input type="date" required max={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 block w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-normal" />
          </label>
          <label className="text-sm font-semibold">
            Who drove with you
            <select value={form.who} onChange={(e) => setForm({ ...form, who: e.target.value as LogEntry['who'] })} className="mt-1 block w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-normal">
              <option value="instructor">Instructor</option>
              <option value="private">Family or friend</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Minutes
            <input type="number" required min={5} max={600} step={5} value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} className="mt-1 block w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-normal" />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            What you practised
            <input type="text" maxLength={140} placeholder="Roundabouts, one bay park…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 block w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-normal" />
          </label>
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <HoursCard label="Lessons with an instructor" value={hours.instructor} target={TARGET_HOURS.instructor} note={`UK average before passing is about ${TARGET_HOURS.instructor} hours`} />
        <HoursCard label="Private practice" value={hours.private} target={TARGET_HOURS.private} note="Practising with family or friends cuts lesson costs" tone="#2f66c8" />
        <div className="rounded-[20px] border border-line bg-surface p-5">
          <p className="text-sm font-semibold text-muted">Skills at independent</p>
          <p className="font-display mt-1.5 text-[34px] leading-none font-extrabold">
            {independent} <span className="font-sans text-[15px] font-semibold text-muted">of {skills.length}</span>
          </p>
          <ProgressBar value={independent / skills.length} tone="ok" className="mt-3 h-2" />
          <p className="mt-2 text-[13px] text-muted">An instructor ticks these off as you stop needing prompts</p>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-5">
          <section aria-labelledby="skills-h" className="rounded-[22px] border border-line bg-surface p-5.5">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="skills-h" className="text-lg font-extrabold">
                Skills
              </h2>
              <span className="text-[13px] text-muted">Click a skill to move it up a level</span>
            </div>
            <p className="mb-3.5 text-[13px] text-muted">{LEVELS.join(' → ')}</p>
            {SKILLS.map((g) => (
              <div key={g.group} className="mt-3 first:mt-0">
                <p className="mb-0.5 text-xs font-bold tracking-wide text-muted uppercase">{g.group}</p>
                <ul>
                  {g.items.map((item) => {
                    const lv = levelOf(item)
                    return (
                      <li key={item} className="border-t border-line first:border-t-0">
                        <button type="button" onClick={() => setLevel(item, (lv + 1) % 5)} className="flex min-h-[52px] w-full items-center gap-3.5 px-1 py-2 text-left hover:bg-bg" aria-label={`${item}: ${LEVELS[lv]}. Click to change.`}>
                          <span className="min-w-0 flex-[1_1_200px] text-[15px] font-semibold">{item}</span>
                          <span className="flex gap-1" aria-hidden="true">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <span key={i} className={`h-2 w-[26px] rounded ${started(item) && i <= lv ? (lv === 4 ? 'bg-brand' : 'bg-[#e0a100]') : 'bg-surface-2'}`} />
                            ))}
                          </span>
                          <span className={`w-[132px] text-right text-[13px] font-semibold ${LEVEL_TEXT[lv]}`}>{started(item) ? LEVELS[lv] : 'Not started'}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </section>

          <section aria-labelledby="log-h" className="rounded-[22px] border border-line bg-surface p-5.5">
            <h2 id="log-h" className="mb-3 text-lg font-extrabold">
              Recent drives
            </h2>
            {logbook.length === 0 ? (
              <p className="text-sm text-muted">Nothing logged yet. After each lesson or practice drive, tap “Log a drive” to keep count of your hours.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs tracking-wide text-muted uppercase">
                    <th scope="col" className="pr-2 pb-2 font-bold">Date</th>
                    <th scope="col" className="px-2 pb-2 font-bold">With</th>
                    <th scope="col" className="px-2 pb-2 font-bold">Time</th>
                    <th scope="col" className="pb-2 pl-2 font-bold">Practised</th>
                    <th scope="col" className="w-8 pb-2"><span className="sr-only">Delete</span></th>
                  </tr>
                </thead>
                <tbody>
                  {logbook.slice(0, 8).map((e) => (
                    <tr key={e.id} className="border-t border-line">
                      <td className="py-3 pr-2 font-semibold whitespace-nowrap">{new Date(e.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                      <td className="px-2 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${e.who === 'instructor' ? 'bg-brand-soft text-brand' : 'bg-[#e7eefb] text-[#1f4e9e]'}`}>{e.who === 'instructor' ? 'Instructor' : 'Family or friend'}</span>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">{e.minutes >= 60 ? `${hrs(e.minutes / 60)} h` : `${e.minutes} min`}</td>
                      <td className="py-3 pl-2 text-ink/80">{e.notes || '–'}</td>
                      <td className="py-3 text-right">
                        <button type="button" onClick={() => removeLog(e.id)} aria-label={`Delete drive on ${e.date}`} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-bad">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          <section aria-labelledby="sup-h" className="rounded-[22px] border border-[#f2dfae] bg-[#fff8e6] p-5 text-[#1c1a12]">
            <p className="text-xs font-bold tracking-[0.08em] text-[#7a4300] uppercase">For your supervising driver</p>
            <h2 id="sup-h" className="mt-1 mb-2 text-lg font-extrabold">
              This week's practice plan
            </h2>
            <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-[#3d4a5c]">
              {weakest.map((s, i) => (
                <li key={s}>
                  {[20, 15, 10][i]} min: {s.charAt(0).toLowerCase() + s.slice(1)}
                </li>
              ))}
            </ol>
            <p className="mt-2.5 text-[13px] text-muted">They must be 21 or over, have held a full licence for 3 years, and the car needs L plates and learner insurance.</p>
          </section>

          <section aria-labelledby="day-h" className="rounded-[22px] bg-brand p-5 text-white">
            <h2 id="day-h" className="text-lg font-extrabold">
              Test day
            </h2>
            <p className="mt-1 mb-3 text-sm text-[#d6efe3]">
              {settings.testDate ? new Date(settings.testDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Add your date on Home'}
              {settings.testCentre ? ` · ${settings.testCentre}` : ''}
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {BRING.map((b) => (
                <li key={b}>
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input type="checkbox" checked={!!checklist[`bring:${b}`]} onChange={() => toggle(`bring:${b}`)} className="mt-0.5 h-[18px] w-[18px] accent-[#13a36f]" />
                    {b}
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-3.5 text-[13px] text-[#d6efe3]">About 40 minutes · around 20 minutes of independent driving · 1 manoeuvre · 2 vehicle safety questions</p>
            <Link to="/practical/test-day" className="mt-3 inline-flex rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-[#08553d]">
              Full walkthrough
            </Link>
          </section>

          <section aria-labelledby="sm-h" className="rounded-[22px] border border-line bg-surface p-5">
            <h2 id="sm-h" className="mb-1.5 text-base font-extrabold">
              Show me, tell me
            </h2>
            <p className="mb-3 text-sm text-ink/80">
              You know {known} of {VEHICLE_QUESTIONS.length} questions. Practise the rest as flashcards.
            </p>
            <ProgressBar value={known / VEHICLE_QUESTIONS.length} tone="ok" className="h-2" />
            <Link to="/practical/show-me-tell-me" className="mt-3.5 flex min-h-11 w-full items-center justify-center rounded-xl bg-navy text-sm font-bold text-white">
              Practise now
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}

function HoursCard({ label, value, target, note, tone = 'var(--c-brand)' }: { label: string; value: number; target: number; note: string; tone?: string }) {
  return (
    <section className="rounded-[20px] border border-line bg-surface p-5">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="font-display mt-1.5 text-[34px] leading-none font-extrabold">
        {hrs(value)} h <span className="font-sans text-[15px] font-semibold text-muted">of about {target}</span>
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / target) * 100)}%`, background: tone }} />
      </div>
      <p className="mt-2 text-[13px] text-muted">{note}</p>
    </section>
  )
}
