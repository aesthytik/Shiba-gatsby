import { useEffect, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { BookOpen, Car, Home, Info, Map, TriangleAlert } from 'lucide-react'
import { Logo } from '../ui/Logo'

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/theory', label: 'Theory', icon: BookOpen },
  { to: '/hazard', label: 'Hazards', icon: TriangleAlert },
  { to: '/practical', label: 'Practical', icon: Car },
  { to: '/routes', label: 'Routes', icon: Map },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])

  return (
    <div className="min-h-dvh md:flex">
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-line md:bg-surface md:px-4 md:py-6 lg:w-64">
        <NavLink to="/" className="mb-8 px-2">
          <Logo />
        </NavLink>
        <nav className="flex flex-col gap-1" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-surface-2 hover:text-ink'
                }`
              }
            >
              <Icon size={19} strokeWidth={2.2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <NavLink to="/about" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-ink">
            <Info size={19} /> About &amp; sources
          </NavLink>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
          <NavLink to="/">
            <Logo />
          </NavLink>
          <NavLink to="/about" aria-label="About and sources" className="rounded-lg p-2 text-muted">
            <Info size={20} />
          </NavLink>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-12">{children}</main>

        <nav
          aria-label="Main"
          className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 backdrop-blur md:hidden"
        >
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-brand' : 'text-muted'}`
              }
            >
              <Icon size={21} strokeWidth={2.2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
