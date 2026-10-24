import { NavLink } from 'react-router'

export type Section = 'theory' | 'drive' | 'practical'

const TABS: Record<Section, { to: string; label: string; end?: boolean }[]> = {
  theory: [
    { to: '/theory', label: 'Practice', end: true },
    { to: '/theory/mock', label: 'Mock test' },
    { to: '/theory/signs', label: 'Road signs' },
    { to: '/hazard', label: 'Hazard perception' },
    { to: '/watch', label: 'Watch' },
  ],
  drive: [
    { to: '/drive', label: 'Lessons', end: true },
    { to: '/routes', label: 'Free drive' },
    { to: '/practical/mock-drive', label: 'Mock driving test' },
    { to: '/practical/manoeuvres', label: 'Manoeuvres' },
  ],
  practical: [
    { to: '/practical', label: 'Logbook', end: true },
    { to: '/practical/test-day', label: 'Test day' },
    { to: '/practical/show-me-tell-me', label: 'Show me, tell me' },
    { to: '/practical/manoeuvres', label: 'Manoeuvres' },
    { to: '/practical/faults', label: 'Faults explained' },
    { to: '/routes', label: 'Test routes' },
  ],
}

/** Segmented tab strip under the page title, as in the desktop designs. */
export function SectionTabs({ section }: { section: Section }) {
  return (
    <nav aria-label={`${section} sections`} className="mb-6 flex w-fit max-w-full flex-wrap gap-1.5 rounded-2xl bg-surface-2 p-1.5">
      {TABS[section].map((t) => (
        <NavLink
          key={t.to + t.label}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold transition ${
              isActive ? 'bg-surface text-ink shadow-sm shadow-black/10' : 'text-muted hover:text-ink'
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
