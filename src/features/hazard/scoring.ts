// Hazard perception scoring modelled on the DVSA scheme: each developing hazard has a scoring
// window split into five equal bands worth 5→1 points. Only the first click inside a window
// counts. Clicking continuously or in a rhythm scores zero for the whole clip.

export interface HazardWindow {
  id: string
  start: number
  end: number
}

export interface HazardScore {
  id: string
  points: number
  /** Time of the click that scored, if any. */
  clickAt?: number
}

export interface ClipScore {
  hazards: HazardScore[]
  total: number
  max: number
  patternFlagged: boolean
  patternReason?: string
}

export const BANDS = 5

export function bandBoundaries(w: HazardWindow) {
  const step = (w.end - w.start) / BANDS
  return Array.from({ length: BANDS + 1 }, (_, i) => w.start + i * step)
}

export function pointsForClick(w: HazardWindow, t: number) {
  if (t < w.start || t > w.end) return 0
  const step = (w.end - w.start) / BANDS
  return BANDS - Math.min(BANDS - 1, Math.floor((t - w.start) / step))
}

/**
 * Detect clicking that a real test would treat as cheating.
 * DVSA doesn't publish its exact rules, so these thresholds are deliberately conservative:
 *  - 5 or more clicks inside any 2-second span (continuous clicking)
 *  - 6 or more clicks at near-constant intervals (rhythmic clicking)
 *  - an overall rate above one click every 1.5 seconds
 */
export function detectPattern(clicks: number[], duration: number): string | undefined {
  const c = [...clicks].sort((a, b) => a - b)
  for (let i = 0; i + 4 < c.length; i++) if (c[i + 4] - c[i] <= 2) return 'Too many clicks in a short time'
  if (c.length >= 6) {
    const gaps = c.slice(1).map((t, i) => t - c[i])
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
    const sd = Math.sqrt(gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length)
    if (mean > 0 && sd / mean < 0.15) return 'Clicking in a regular rhythm'
  }
  if (duration > 0 && c.length > duration / 1.5) return 'Clicking throughout the clip'
  return undefined
}

export function scoreClip(windows: HazardWindow[], clicks: number[], duration: number): ClipScore {
  const max = windows.length * BANDS
  const patternReason = detectPattern(clicks, duration)
  const sorted = [...clicks].sort((a, b) => a - b)
  const hazards = windows.map((w) => {
    const first = sorted.find((t) => t >= w.start && t <= w.end)
    return { id: w.id, points: first === undefined || patternReason ? 0 : pointsForClick(w, first), clickAt: first }
  })
  return { hazards, total: hazards.reduce((a, h) => a + h.points, 0), max, patternFlagged: !!patternReason, patternReason }
}

/** The real test has 15 scoreable hazards; scale a practice total to the 75-point scale. */
export function scaleTo75(total: number, max: number) {
  return max ? Math.round((total / max) * 75) : 0
}

export const HP_PASS_MARK = 44
