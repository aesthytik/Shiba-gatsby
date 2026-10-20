import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../../data/questions'
import { TOPICS } from '../../data/topics'
import { SIGNS } from '../../components/signs/signs'
import { rng } from '../../lib/random'
import { buildMockTest, deckQuestions, MOCK, prepare, topicMastery } from './logic'

describe('question bank', () => {
  it('has unique ids, four distinct options and an explanation for every question', () => {
    const ids = new Set<string>()
    for (const q of QUESTIONS) {
      expect(ids.has(q.id), `duplicate id ${q.id}`).toBe(false)
      ids.add(q.id)
      expect(new Set(q.options).size, `${q.id} has duplicate options`).toBe(4)
      expect(q.explain.length).toBeGreaterThan(20)
      if (q.sign) expect(SIGNS[q.sign], `${q.id} references unknown sign`).toBeDefined()
    }
  })

  it('covers every DVSA topic', () => {
    for (const t of TOPICS) expect(QUESTIONS.some((q) => q.topic === t.id), t.id).toBe(true)
  })

  it('has enough questions for a full mock test', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(MOCK.questions)
  })
})

describe('prepare', () => {
  it('keeps track of the correct answer after shuffling', () => {
    const q = QUESTIONS[0]
    for (let seed = 1; seed < 30; seed++) {
      const p = prepare(q, rng(seed))
      expect(p.options[p.correctIndex]).toBe(q.options[0])
      expect([...p.options].sort()).toEqual([...q.options].sort())
    }
  })
})

describe('buildMockTest', () => {
  it('returns 50 unique questions covering every topic', () => {
    const test = buildMockTest(rng(42))
    expect(test).toHaveLength(MOCK.questions)
    expect(new Set(test.map((q) => q.id)).size).toBe(MOCK.questions)
    for (const t of TOPICS) expect(test.some((q) => q.topic === t.id), t.id).toBe(true)
  })

  it('is reproducible with the same seed', () => {
    expect(buildMockTest(rng(7)).map((q) => q.id)).toEqual(buildMockTest(rng(7)).map((q) => q.id))
  })
})

describe('decks and mastery', () => {
  it('puts unseen and wrong questions first in a topic deck', () => {
    const stats = { 'sm-01': { seen: 3, correct: 3, lastCorrect: true, box: 3, lastSeen: 1 }, 'sm-02': { seen: 1, correct: 0, lastCorrect: false, box: 0, lastSeen: 1 } }
    const deck = deckQuestions('safety-margins', stats, rng(1))
    expect(deck[deck.length - 1].id).toBe('sm-01')
  })

  it('builds a mistakes deck from wrong answers only', () => {
    const stats = { 'al-01': { seen: 1, correct: 0, lastCorrect: false, box: 0, lastSeen: 5 }, 'al-02': { seen: 1, correct: 1, lastCorrect: true, box: 1, lastSeen: 5 } }
    expect(deckQuestions('mistakes', stats).map((q) => q.id)).toEqual(['al-01'])
  })

  it('computes topic mastery from latest answers', () => {
    const stats = Object.fromEntries(QUESTIONS.filter((q) => q.topic === 'motorway').map((q) => [q.id, { seen: 1, correct: 1, lastCorrect: true, box: 1, lastSeen: 0 }]))
    expect(topicMastery('motorway', stats)).toBe(1)
    expect(topicMastery('alertness', stats)).toBe(0)
  })
})
