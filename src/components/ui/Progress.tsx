export function ProgressBar({ value, tone = 'brand', className = '' }: { value: number; tone?: 'brand' | 'ok' | 'bad' | 'warn'; className?: string }) {
  const color = { brand: 'bg-brand', ok: 'bg-ok', bad: 'bg-bad', warn: 'bg-warn' }[tone]
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-surface-2 ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${color} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function ProgressRing({ value, size = 76, label }: { value: number; size?: number; label?: string }) {
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value))
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--c-brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <span className="absolute text-center">
        <span className="block text-lg leading-none font-bold text-ink">{Math.round(pct * 100)}%</span>
        {label && <span className="mt-0.5 block text-[10px] font-medium tracking-wide text-muted uppercase">{label}</span>}
      </span>
    </div>
  )
}
