import { PLAYABLE } from '../drive/lessons'
import { mistakesCount, theoryReadiness } from '../theory/logic'
import type { DriveRun, HazardResult, LogEntry, MockResult, QuestionStat } from '../../store/progress'

export const DAY = 24 * 60 * 60 * 1000

/** Typical UK learner totals: about 45 hours of lessons plus about 22 hours of private practice (DVSA). */
export const TARGET_HOURS = { instructor: 45, private: 22 }

export const MAX_STARS = PLAYABLE.length * 3

export function bestByLesson(runs: DriveRun[]) {
  const best: Record<number, { stars: number; attempts: number; passed: boolean }> = {}
  for (const r of runs) {
    const cur = best[r.n] ?? { stars: 0, attempts: 0, passed: false }
    best[r.n] = { stars: Math.max(cur.stars, r.stars), attempts: cur.attempts + 1, passed: cur.passed || r.status === 'complete' }
  }
  return best
}

export function totalStars(runs: DriveRun[]) {
  return Object.values(bestByLesson(runs)).reduce((a, b) => a + b.stars, 0)
}

export function logHours(logbook: LogEntry[]) {
  const mins = (who: LogEntry['who']) => logbook.filter((e) => e.who === who).reduce((a, e) => a + e.minutes, 0)
  const instructor = mins('instructor') / 60
  const priv = mins('private') / 60
  return { instructor, private: priv, total: instructor + priv }
}

const toDay = (iso: string) => new Date(iso + 'T12:00:00').getTime()

/** Monday of the week containing `t`, at midday local time. */
function weekStart(t: number) {
  const d = new Date(t)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  d.setHours(12, 0, 0, 0)
  return d.getTime()
}

export function weeklyHours(logbook: LogEntry[], weeks = 8, now = Date.now()) {
  const thisWeek = weekStart(now)
  return Array.from({ length: weeks }, (_, i) => {
    const start = thisWeek - (weeks - 1 - i) * 7 * DAY
    const inWeek = logbook.filter((e) => weekStart(toDay(e.date)) === start)
    const inst = inWeek.filter((e) => e.who === 'instructor').reduce((a, e) => a + e.minutes, 0) / 60
    const priv = inWeek.filter((e) => e.who === 'private').reduce((a, e) => a + e.minutes, 0) / 60
    return {
      start,
      label: new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      inst: Math.round(inst * 10) / 10,
      priv: Math.round(priv * 10) / 10,
      total: Math.round((inst + priv) * 10) / 10,
    }
  })
}

/** Days in a row, ending today or yesterday, on which the learner did something. */
export function streakDays(stamps: number[], now = Date.now()) {
  const dayKey = (t: number) => new Date(t).toDateString()
  const days = new Set(stamps.map(dayKey))
  let n = 0
  let t = now
  if (!days.has(dayKey(t))) t -= DAY
  while (days.has(dayKey(t))) {
    n++
    t -= DAY
  }
  return n
}

export function faultsByCategory(runs: DriveRun[], days = 30, now = Date.now()) {
  const tally = new Map<string, number>()
  for (const r of runs) {
    if (now - r.date > days * DAY) continue
    for (const f of r.faults) tally.set(f.category, (tally.get(f.category) ?? 0) + 1)
  }
  return [...tally.entries()].map(([category, n]) => ({ category, n })).sort((a, b) => b.n - a.n)
}

export interface Readiness {
  total: number
  parts: { key: 'rules' | 'hazard' | 'drive' | 'practice'; label: string; value: number; display: string; tip: string; cta: string; to: string }[]
  verdict: 'Not ready yet' | 'Getting there' | 'Ready'
  steps: string[]
}

export function readiness(input: {
  stats: Record<string, QuestionStat>
  mocks: MockResult[]
  hazards: HazardResult[]
  runs: DriveRun[]
  logbook: LogEntry[]
}): Readiness {
  const { stats, mocks, hazards, runs, logbook } = input
  const rules = theoryReadiness(stats, mocks[0] ? mocks[0].score / mocks[0].total : undefined)
  const recent = hazards.slice(0, 10)
  const hazard = recent.length ? recent.reduce((a, r) => a + r.score / r.max, 0) / recent.length : 0
  const lessonsPassed = Object.values(bestByLesson(runs)).filter((b) => b.passed).length
  const drive = Math.min(1, totalStars(runs) / MAX_STARS) * 0.6 + Math.min(1, lessonsPassed / PLAYABLE.length) * 0.4
  const hours = logHours(logbook)
  const practice = Math.min(1, hours.total / (TARGET_HOURS.instructor + TARGET_HOURS.private))
  const total = rules * 0.25 + hazard * 0.15 + drive * 0.35 + practice * 0.25
  const pct = (v: number) => `${Math.round(v * 100)}%`
  const nextLesson = PLAYABLE.find((l) => !bestByLesson(runs)[l.n]?.passed) ?? PLAYABLE[PLAYABLE.length - 1]
  const mistakes = mistakesCount(stats)
  const parts: Readiness['parts'] = [
    {
      key: 'rules',
      label: 'Rules knowledge',
      value: rules,
      display: pct(rules),
      tip: rules >= 0.8 ? 'Strong. Keep the Daily 10 going so the Highway Code stays fresh.' : mistakes ? `${mistakes} questions to review. Mistakes come back until you get them right.` : 'Answer practice questions by topic to build this up.',
      cta: 'Practise questions',
      to: '/theory',
    },
    {
      key: 'hazard',
      label: 'Hazard awareness',
      value: hazard,
      display: recent.length ? pct(hazard) : '–',
      tip: recent.length ? 'Spot developing hazards early: the earlier you click, the more you score.' : 'No clips yet. Try a few hazard perception clips.',
      cta: 'Hazard clips',
      to: '/hazard',
    },
    {
      key: 'drive',
      label: 'Drive lessons',
      value: drive,
      display: pct(drive),
      tip: `${lessonsPassed} of ${PLAYABLE.length} lessons passed. Next up: ${nextLesson.title}.`,
      cta: `Lesson ${nextLesson.n}`,
      to: `/drive/${nextLesson.n}`,
    },
    {
      key: 'practice',
      label: 'Real practice',
      value: practice,
      display: `${Math.round(hours.total)} h`,
      tip: `Of about ${TARGET_HOURS.instructor + TARGET_HOURS.private} hours most UK learners need. Private practice is the cheap part.`,
      cta: 'Open logbook',
      to: '/practical',
    },
  ]
  const steps: string[] = []
  const topFault = faultsByCategory(runs)[0]
  if (drive < 0.8) steps.push(`Finish the next lesson in Drive: ${nextLesson.title}`)
  if (topFault) steps.push(`Cut down on “${topFault.category}” faults`)
  if (practice < 0.8) steps.push(`Log about ${Math.max(1, Math.round((TARGET_HOURS.instructor + TARGET_HOURS.private) * 0.8 - hours.total))} more hours of real driving`)
  if (rules < 0.8) steps.push('Review your theory mistakes')
  if (hazard < 0.6) steps.push('Practise hazard perception clips')
  return { total, parts, verdict: total >= 0.8 ? 'Ready' : total >= 0.55 ? 'Getting there' : 'Not ready yet', steps: steps.slice(0, 3) }
}
