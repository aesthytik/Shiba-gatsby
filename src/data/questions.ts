import { QUESTIONS_A } from './questions-a'
import { QUESTIONS_B } from './questions-b'
import { TOPICS, type Question, type TopicId } from './topics'

export const QUESTIONS: Question[] = [...QUESTIONS_A, ...QUESTIONS_B]

export const QUESTIONS_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]))

export function questionsForTopic(topic: TopicId) {
  return QUESTIONS.filter((q) => q.topic === topic)
}

export const TOPIC_COUNTS = Object.fromEntries(TOPICS.map((t) => [t.id, questionsForTopic(t.id).length])) as Record<TopicId, number>
