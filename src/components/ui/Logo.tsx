export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="var(--c-brand)" />
        <rect x="14" y="12" width="36" height="40" rx="5" fill="#fff" />
        <path d="M24 20v24h16v-6H31V20z" fill="#d7263d" />
      </svg>
      <span className="text-[17px] leading-none font-bold tracking-tight text-ink">
        RoadReady<span className="ml-1 rounded bg-accent px-1 py-0.5 text-[11px] font-extrabold text-black">UK</span>
      </span>
    </span>
  )
}
