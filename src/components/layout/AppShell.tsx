import { useEffect, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { BarChart3, BookOpen, CircleDot, ClipboardCheck, Home, Info, UserRound } from 'lucide-react'
import { Logo } from '../ui/Logo'
import { useProgress } from '../../store/progress'
import { cloudEnabled } from '../../lib/supabase'
import { useAuth } from '../../features/account/auth'

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/theory', label: 'Theory', icon: BookOpen, also: ['/hazard', '/watch'] },
  { to: '/drive', label: 'Drive', icon: CircleDot, also: ['/routes'] },
  { to: '/practical', label: 'Practical', icon: ClipboardCheck },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
]

const DAY = 24 * 60 * 60 * 1000

function useActive() {
  const { pathname } = useLocation()
  return (item: (typeof NAV)[number]) => (item.end ? pathname === item.to : [item.to, ...(item.also ?? [])].some((p) => pathname === p || pathname.startsWith(p + '/')))
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const isActive = useActive()
  const testDate = useProgress((s) => s.settings.testDate)
  const user = useAuth((s) => s.user)
  const sync = useAuth((s) => s.sync)
  useEffect(() => window.scrollTo(0, 0), [pathname])
  const days = testDate ? Math.ceil((new Date(testDate).getTime() - Date.now()) / DAY) : undefined

  return (
    <div className="min-h-dvh md:flex">
      <aside className="hidden bg-navy px-4 py-6 text-white md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:gap-7 lg:w-64">
        <NavLink to="/" className="px-2">
          <Logo onDark />
        </NavLink>
        <nav className="flex flex-col gap-1" aria-label="Main">
          {NAV.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors ${
                  active ? 'bg-navy-2 text-white' : 'text-navy-text hover:bg-navy-2/60 hover:text-white'
                }`}
              >
                <Icon size={20} strokeWidth={2} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <NavLink to="/practical" className="rounded-2xl bg-navy-2 p-3.5 transition hover:brightness-110">
            <p className="text-xs text-navy-text">Practical test</p>
            {days !== undefined && days >= 0 ? (
              <>
                <p className="mt-0.5 text-base font-bold">
                  {days} day{days === 1 ? '' : 's'} to go
                </p>
                <p className="mt-0.5 text-xs text-navy-text">
                  {new Date(testDate!).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </>
            ) : (
              <p className="mt-0.5 text-sm font-semibold">Add your test date</p>
            )}
          </NavLink>
          {cloudEnabled && (
            <NavLink to={user ? '/account' : '/login'} className="flex items-center gap-3 rounded-xl border border-navy-2 px-3 py-2.5 text-sm text-white hover:bg-navy-2/60">
              {user ? (
                <>
                  <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent font-display text-sm font-extrabold text-black">
                    {(user.email ?? '?')[0].toUpperCase()}
                    <span className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-navy ${sync === 'error' ? 'bg-bad' : sync === 'syncing' ? 'bg-accent' : 'bg-[#13a36f]'}`} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{user.email}</span>
                    <span className="block text-xs text-navy-text">{sync === 'error' ? 'Not saving' : sync === 'syncing' ? 'Saving…' : 'Progress saved'}</span>
                  </span>
                </>
              ) : (
                <>
                  <UserRound size={19} className="text-navy-text" />
                  <span>
                    <span className="block text-[13px] font-semibold">Sign in</span>
                    <span className="block text-xs text-navy-text">Save your progress</span>
                  </span>
                </>
              )}
            </NavLink>
          )}
          <NavLink to="/about" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-navy-text hover:bg-navy-2/60 hover:text-white">
            <Info size={18} /> About &amp; sources
          </NavLink>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 md:hidden">
          <NavLink to="/">
            <Logo onDark />
          </NavLink>
          <div className="flex items-center gap-1">
            {cloudEnabled && (
              <NavLink to={user ? '/account' : '/login'} aria-label={user ? 'Account' : 'Sign in to save progress'} className="rounded-lg p-2 text-navy-text">
                <UserRound size={20} />
              </NavLink>
            )}
            <NavLink to="/about" aria-label="About and sources" className="rounded-lg p-2 text-navy-text">
              <Info size={20} />
            </NavLink>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 pt-5 pb-28 md:px-10 md:pt-8 md:pb-14">{children}</main>

        <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 backdrop-blur md:hidden">
          {NAV.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active ? 'text-brand' : 'text-muted'}`}
              >
                <Icon size={21} strokeWidth={2} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
