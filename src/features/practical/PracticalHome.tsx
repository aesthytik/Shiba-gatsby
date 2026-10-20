import { ClipboardList, Footprints, ListChecks, MessageSquareText, ParkingSquare, ShieldAlert } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, LinkCard } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/Progress'
import { SKILLS } from '../../data/practical'
import { useProgress } from '../../store/progress'

export function PracticalHome() {
  const checklist = useProgress((s) => s.checklist)
  const toggle = useProgress((s) => s.toggleChecklist)
  const allSkills = SKILLS.flatMap((g) => g.items)
  const done = allSkills.filter((s) => checklist[`skill:${s}`]).length

  return (
    <>
      <PageHeader title="Practical test" subtitle="About 40 minutes of driving: an eyesight check, vehicle safety questions, general and independent driving, and one reversing manoeuvre." />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LinkCard to="/practical/test-day" icon={<Footprints size={22} />} title="Test day walkthrough">
          Every part of the test in order, with practice for each step.
        </LinkCard>
        <LinkCard to="/practical/show-me-tell-me" icon={<MessageSquareText size={22} />} title="Show me, tell me" tone="warn">
          All 21 vehicle safety questions as flashcards.
        </LinkCard>
        <LinkCard to="/practical/manoeuvres" icon={<ParkingSquare size={22} />} title="Manoeuvres">
          Animated parallel park, bay parking and pulling up on the right.
        </LinkCard>
        <LinkCard to="/practical/faults" icon={<ShieldAlert size={22} />} title="Faults explained" tone="bad">
          How marking works and the top 10 reasons people fail.
        </LinkCard>
        <LinkCard to="/practical/mock-drive" icon={<ClipboardList size={22} />} title="Mock drive marker" tone="ok">
          Mark a mock test like an examiner and track faults over time.
        </LinkCard>
        <LinkCard to="/routes" icon={<ListChecks size={22} />} title="Test routes">
          Preview test-style routes with turn-by-turn directions and a 3D drive-through.
        </LinkCard>
      </div>

      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">Skills checklist</h2>
        <span className="text-sm font-semibold text-muted">
          {done}/{allSkills.length} confident
        </span>
      </div>
      <ProgressBar value={done / allSkills.length} className="mb-4" tone="ok" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SKILLS.map((g) => (
          <Card key={g.group} className="p-4">
            <p className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">{g.group}</p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const key = `skill:${item}`
                return (
                  <li key={item}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1.5 text-sm text-ink hover:bg-surface-2">
                      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--c-brand)]" checked={!!checklist[key]} onChange={() => toggle(key)} />
                      <span>{item}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </Card>
        ))}
      </div>
    </>
  )
}
