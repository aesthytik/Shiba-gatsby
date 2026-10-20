export function Spinner({ label }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-24 text-muted">
      <span className="h-8 w-8 animate-spin rounded-full border-3 border-line border-t-brand" />
      {label && <span className="text-sm">{label}…</span>}
    </div>
  )
}
