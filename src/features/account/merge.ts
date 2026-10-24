import type { useProgress } from '../../store/progress'

type State = ReturnType<typeof useProgress.getState>

/** The parts of the progress store that are saved to the cloud (everything except the actions). */
export const SYNC_KEYS = [
  'questionStats',
  'mockResults',
  'hazardResults',
  'checklist',
  'showMeTellMe',
  'mockDrives',
  'routesDriven',
  'driveRuns',
  'logbook',
  'skillLevels',
  'watched',
  'settings',
] as const

export type Snapshot = { [K in (typeof SYNC_KEYS)[number]]: State[K] }

export function snapshotOf(state: State): Snapshot {
  return Object.fromEntries(SYNC_KEYS.map((k) => [k, state[k]])) as Snapshot
}

const asObj = <T>(v: unknown): Record<string, T> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, T>) : {})
const asArr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

function unionBy<T>(a: T[], b: T[], key: (x: T) => string, order: (x: T, y: T) => number, cap: number) {
  const seen = new Map<string, T>()
  for (const x of [...b, ...a]) seen.set(key(x), x)
  return [...seen.values()].sort(order).slice(0, cap)
}

const maxByKey = (a: Record<string, number>, b: Record<string, number>) => {
  const out: Record<string, number> = { ...b }
  for (const [k, v] of Object.entries(a)) out[k] = Math.max(out[k] ?? v, v)
  return out
}

/**
 * Combine what is on this device with what is in the cloud so nothing is lost when someone signs in:
 * results are unioned, per-question stats keep the most recently seen, counters keep the larger value.
 * Unknown or damaged remote data is ignored rather than trusted.
 */
export function mergeSnapshots(local: Snapshot, remoteRaw: unknown): Snapshot {
  const remote = asObj<unknown>(remoteRaw)
  const byDateDesc = <T extends { date: number }>(x: T, y: T) => y.date - x.date
  const qs: Snapshot['questionStats'] = { ...asObj<Snapshot['questionStats'][string]>(remote.questionStats) }
  for (const [id, s] of Object.entries(local.questionStats)) if (!qs[id] || s.lastSeen >= qs[id].lastSeen) qs[id] = s

  const logRemote = asArr<Snapshot['logbook'][number]>(remote.logbook)
  return {
    questionStats: qs,
    mockResults: unionBy(local.mockResults, asArr(remote.mockResults), (x) => x.id, byDateDesc, 50),
    hazardResults: unionBy(local.hazardResults, asArr(remote.hazardResults), (x) => `${x.clipId}-${x.date}`, byDateDesc, 200),
    mockDrives: unionBy(local.mockDrives, asArr(remote.mockDrives), (x) => x.id, byDateDesc, 50),
    driveRuns: unionBy(local.driveRuns, asArr(remote.driveRuns), (x) => x.id, byDateDesc, 300),
    logbook: unionBy(local.logbook, logRemote, (x) => x.id, (x, y) => y.date.localeCompare(x.date), 500),
    checklist: { ...asObj<boolean>(remote.checklist), ...Object.fromEntries(Object.entries(local.checklist).filter(([, v]) => v)) },
    showMeTellMe: { ...asObj<'know' | 'unsure'>(remote.showMeTellMe), ...local.showMeTellMe },
    routesDriven: maxByKey(local.routesDriven, asObj<number>(remote.routesDriven)),
    skillLevels: maxByKey(local.skillLevels, asObj<number>(remote.skillLevels)),
    watched: maxByKey(local.watched, asObj<number>(remote.watched)),
    settings: { ...asObj<unknown>(remote.settings), ...Object.fromEntries(Object.entries(local.settings).filter(([, v]) => v !== undefined)) } as Snapshot['settings'],
  }
}
