export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] border-2 border-accent bg-white" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#d0261d" strokeWidth="3.4" strokeLinecap="square">
          <path d="M8 4v15h9" />
        </svg>
      </span>
      <span className={`font-display text-[19px] leading-none font-extrabold tracking-tight ${onDark ? 'text-white' : 'text-ink'}`}>
        RoadReady<span className="ml-1.5 rounded bg-accent px-1.5 py-0.5 align-[2px] text-[12px] font-extrabold text-black">UK</span>
      </span>
    </span>
  )
}
