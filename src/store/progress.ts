import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TopicId } from '../data/topics'

export interface QuestionStat {
  seen: number
  correct: number
  lastCorrect: boolean
  /** Leitner box 0–4: wrong answers drop to 0, right answers move up one. */
  box: number
  lastSeen: number
}

export interface MockResult {
  id: string
  date: number
  score: number
  total: number
  passed: boolean
  durationSec: number
  byTopic: Partial<Record<TopicId, { correct: number; total: number }>>
}

export interface HazardResult {
  clipId: string
  date: number
  score: number
  max: number
  patternFlagged: boolean
}

export type FaultTally = Record<string, { d: number; s: number; x: number }>

export interface MockDriveResult {
  id: string
  date: number
  faults: FaultTally
  passed: boolean
  notes?: string
}

export interface DriveFaultRecord {
  title: string
  category: string
  severity: 'minor' | 'serious' | 'dangerous'
  advice: string
  hc?: string
}

/** One attempt at a drive lesson. */
export interface DriveRun {
  id: string
  n: number
  date: number
  stars: 0 | 1 | 2 | 3
  status: 'complete' | 'failed'
  minors: number
  serious: number
  dangerous: number
  seconds: number
  topMph: number
  headline: string
  faults: DriveFaultRecord[]
}

/** A real drive in the learner's logbook. */
export interface LogEntry {
  id: string
  /** YYYY-MM-DD */
  date: string
  who: 'instructor' | 'private'
  minutes: number
  notes: string
}

interface ProgressState {
  questionStats: Record<string, QuestionStat>
  mockResults: MockResult[]
  hazardResults: HazardResult[]
  checklist: Record<string, boolean>
  showMeTellMe: Record<string, 'know' | 'unsure'>
  mockDrives: MockDriveResult[]
  routesDriven: Record<string, number>
  driveRuns: DriveRun[]
  logbook: LogEntry[]
  /** Skill name → 0 (introduced) … 4 (independent). */
  skillLevels: Record<string, number>
  /** Video id → when it was last watched. */
  watched: Record<string, number>
  settings: { voice: boolean; testDate?: string; testCentre?: string; assist?: boolean; cameraView?: 'chase' | 'driver'; unlockAll?: boolean }

  recordAnswer: (id: string, correct: boolean) => void
  addMockResult: (r: MockResult) => void
  addHazardResult: (r: HazardResult) => void
  toggleChecklist: (key: string, value?: boolean) => void
  rateShowMeTellMe: (id: string, rating: 'know' | 'unsure') => void
  addMockDrive: (r: MockDriveResult) => void
  markRouteDriven: (routeId: string) => void
  addDriveRun: (r: DriveRun) => void
  addLog: (e: LogEntry) => void
  removeLog: (id: string) => void
  setSkillLevel: (skill: string, level: number) => void
  markWatched: (id: string) => void
  updateSettings: (s: Partial<ProgressState['settings']>) => void
  reset: () => void
}

const initial = {
  questionStats: {},
  mockResults: [],
  hazardResults: [],
  checklist: {},
  showMeTellMe: {},
  mockDrives: [],
  routesDriven: {},
  driveRuns: [],
  logbook: [],
  skillLevels: {},
  watched: {},
  settings: { voice: true, assist: true },
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...initial,
      recordAnswer: (id, correct) =>
        set((s) => {
          const prev = s.questionStats[id] ?? { seen: 0, correct: 0, lastCorrect: false, box: 0, lastSeen: 0 }
          return {
            questionStats: {
              ...s.questionStats,
              [id]: {
                seen: prev.seen + 1,
                correct: prev.correct + (correct ? 1 : 0),
                lastCorrect: correct,
                box: correct ? Math.min(4, prev.box + 1) : 0,
                lastSeen: Date.now(),
              },
            },
          }
        }),
      addMockResult: (r) => set((s) => ({ mockResults: [r, ...s.mockResults].slice(0, 50) })),
      addHazardResult: (r) => set((s) => ({ hazardResults: [r, ...s.hazardResults].slice(0, 200) })),
      toggleChecklist: (key, value) => set((s) => ({ checklist: { ...s.checklist, [key]: value ?? !s.checklist[key] } })),
      rateShowMeTellMe: (id, rating) => set((s) => ({ showMeTellMe: { ...s.showMeTellMe, [id]: rating } })),
      addMockDrive: (r) => set((s) => ({ mockDrives: [r, ...s.mockDrives].slice(0, 50) })),
      markRouteDriven: (routeId) => set((s) => ({ routesDriven: { ...s.routesDriven, [routeId]: (s.routesDriven[routeId] ?? 0) + 1 } })),
      addDriveRun: (r) => set((s) => ({ driveRuns: [r, ...s.driveRuns].slice(0, 300) })),
      addLog: (e) => set((s) => ({ logbook: [e, ...s.logbook].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 500) })),
      removeLog: (id) => set((s) => ({ logbook: s.logbook.filter((e) => e.id !== id) })),
      setSkillLevel: (skill, level) => set((s) => ({ skillLevels: { ...s.skillLevels, [skill]: Math.max(0, Math.min(4, level)) } })),
      markWatched: (id) => set((s) => ({ watched: { ...s.watched, [id]: Date.now() } })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      reset: () => set(initial),
    }),
    { name: 'roadready-progress', version: 1 },
  ),
)
