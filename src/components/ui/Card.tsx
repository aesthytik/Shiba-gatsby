import type { ComponentProps, ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'

export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  // Default padding unless the caller sets its own (class order can't be relied on to override it).
  const pad = /(^|\s)p-\d/.test(className) ? '' : 'p-5'
  return <div className={`rounded-3xl border border-line bg-surface ${pad} ${className}`} {...props} />
}

/** A card that navigates somewhere: icon, title, blurb and an optional footer slot. */
export function LinkCard({
  to,
  icon,
  title,
  children,
  footer,
  tone = 'brand',
}: {
  to: string
  icon: ReactNode
  title: string
  children?: ReactNode
  footer?: ReactNode
  tone?: 'brand' | 'warn' | 'bad' | 'ok'
}) {
  const toneClass = { brand: 'bg-brand-soft text-brand', warn: 'bg-warn-soft text-warn', bad: 'bg-bad-soft text-bad', ok: 'bg-ok-soft text-ok' }[tone]
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="flex items-start gap-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneClass}`}>{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1 font-semibold text-ink">
            {title}
            <ChevronRight size={16} className="text-muted transition group-hover:translate-x-0.5" />
          </h3>
          {children && <p className="mt-1 text-sm leading-relaxed text-muted">{children}</p>}
        </div>
      </div>
      {footer && <div className="mt-4">{footer}</div>}
    </Link>
  )
}
