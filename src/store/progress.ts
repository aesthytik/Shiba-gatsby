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

interface ProgressState {
  questionStats: Record<string, QuestionStat>
  mockResults: MockResult[]
  hazardResults: HazardResult[]
  checklist: Record<string, boolean>
  showMeTellMe: Record<string, 'know' | 'unsure'>
  mockDrives: MockDriveResult[]
  routesDriven: Record<string, number>
  settings: { voice: boolean; testDate?: string }

  recordAnswer: (id: string, correct: boolean) => void
  addMockResult: (r: MockResult) => void
  addHazardResult: (r: HazardResult) => void
  toggleChecklist: (key: string, value?: boolean) => void
  rateShowMeTellMe: (id: string, rating: 'know' | 'unsure') => void
  addMockDrive: (r: MockDriveResult) => void
  markRouteDriven: (routeId: string) => void
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
  settings: { voice: true },
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
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      reset: () => set(initial),
    }),
    { name: 'roadready-progress', version: 1 },
  ),
)
