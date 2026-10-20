import { SIGNS, type SignId } from './signs'

export function RoadSign({ id, size = 96, className = '', title }: { id: SignId; size?: number; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={title ?? SIGNS[id].name}
      className={`drop-shadow-sm ${className}`}
      dangerouslySetInnerHTML={{ __html: SIGNS[id].svg }}
    />
  )
}
