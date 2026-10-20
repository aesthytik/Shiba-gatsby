import { QUESTIONS, questionsForTopic } from '../../data/questions'
import { TOPICS, type Question, type TopicId } from '../../data/topics'
import { shuffle } from '../../lib/random'
import type { QuestionStat } from '../../store/progress'

export const MOCK = { questions: 50, minutes: 57, passMark: 43 } as const

export interface PreparedQuestion {
  question: Question
  options: string[]
  correctIndex: number
}

/** Shuffle a question's options for display and remember where the correct one landed. */
export function prepare(question: Question, random: () => number = Math.random): PreparedQuestion {
  const order = shuffle([0, 1, 2, 3], random)
  return { question, options: order.map((i) => question.options[i]), correctIndex: order.indexOf(0) }
}

/**
 * Build a mock test: questions are spread across topics in proportion to the bank,
 * so every topic is represented, then the whole set is shuffled.
 */
export function buildMockTest(random: () => number = Math.random, count: number = MOCK.questions, bank: Question[] = QUESTIONS): Question[] {
  if (bank.length <= count) return shuffle(bank, random)
  const byTopic = new Map<TopicId, Question[]>()
  for (const q of bank) byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), q])

  const picked: Question[] = []
  const leftovers: Question[] = []
  for (const [, qs] of byTopic) {
    const share = Math.max(1, Math.floor((qs.length / bank.length) * count))
    const shuffled = shuffle(qs, random)
    picked.push(...shuffled.slice(0, share))
    leftovers.push(...shuffled.slice(share))
  }
  const topUp = shuffle(leftovers, random).slice(0, Math.max(0, count - picked.length))
  return shuffle([...picked, ...topUp], random).slice(0, count)
}

export type DeckId = TopicId | 'all' | 'mistakes'

export function deckQuestions(deck: DeckId, stats: Record<string, QuestionStat>, random: () => number = Math.random): Question[] {
  if (deck === 'all') return shuffle(QUESTIONS, random).slice(0, 20)
  if (deck === 'mistakes') {
    // Weakest first: lowest Leitner box, then least recently seen.
    return QUESTIONS.filter((q) => stats[q.id] && !stats[q.id].lastCorrect).sort(
      (a, b) => stats[a.id].box - stats[b.id].box || stats[a.id].lastSeen - stats[b.id].lastSeen,
    )
  }
  // Unseen and weak questions come first so a topic session is always useful.
  const qs = questionsForTopic(deck)
  const weight = (q: Question) => {
    const s = stats[q.id]
    if (!s) return 0
    return s.lastCorrect ? 2 + s.box : 1
  }
  return shuffle(qs, random).sort((a, b) => weight(a) - weight(b))
}

export function mistakesCount(stats: Record<string, QuestionStat>) {
  return QUESTIONS.filter((q) => stats[q.id] && !stats[q.id].lastCorrect).length
}

/** Share of a topic's questions whose most recent answer was correct. */
export function topicMastery(topic: TopicId, stats: Record<string, QuestionStat>) {
  const qs = questionsForTopic(topic)
  if (!qs.length) return 0
  return qs.filter((q) => stats[q.id]?.lastCorrect).length / qs.length
}

/** Overall theory readiness: mastery across all topics, nudged by recent mock test scores. */
export function theoryReadiness(stats: Record<string, QuestionStat>, recentMockPct?: number) {
  const mastery = TOPICS.reduce((sum, t) => sum + topicMastery(t.id, stats), 0) / TOPICS.length
  return recentMockPct === undefined ? mastery : mastery * 0.6 + recentMockPct * 0.4
}
