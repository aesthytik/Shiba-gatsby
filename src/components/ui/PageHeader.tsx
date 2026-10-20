import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

export function PageHeader({ title, subtitle, back, actions }: { title: string; subtitle?: ReactNode; back?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6">
      {back && (
        <Link to={back} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft size={16} /> Back
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </div>
  )
}
