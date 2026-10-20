import { Check, X, BookMarked } from 'lucide-react'
import { RoadSign } from '../../components/signs/RoadSign'
import { topicName } from '../../data/topics'
import type { PreparedQuestion } from './logic'

const LETTERS = ['A', 'B', 'C', 'D']

export function QuestionCard({
  prepared,
  selected,
  onSelect,
  reveal,
  index,
  total,
}: {
  prepared: PreparedQuestion
  selected: number | null
  onSelect: (i: number) => void
  /** When true, mark right/wrong answers and show the explanation. */
  reveal: boolean
  index?: number
  total?: number
}) {
  const { question, options, correctIndex } = prepared
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 md:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
        <span>{topicName(question.topic)}</span>
        {index !== undefined && total !== undefined && (
          <span>
            Question {index + 1} of {total}
          </span>
        )}
      </div>

      {question.sign && (
        <div className="mb-5 flex justify-center rounded-xl bg-surface-2 py-5">
          <RoadSign id={question.sign} size={120} title="Road sign for this question" />
        </div>
      )}

      <h2 className="text-lg leading-snug font-semibold text-ink md:text-xl">{question.q}</h2>

      <ul className="mt-5 grid gap-2.5" role="radiogroup" aria-label="Answers">
        {options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = i === correctIndex
          let cls = 'border-line bg-surface hover:border-brand/50 hover:bg-surface-2'
          if (!reveal && isSelected) cls = 'border-brand bg-brand-soft ring-2 ring-brand/30'
          if (reveal && isCorrect) cls = 'border-ok bg-ok-soft'
          if (reveal && isSelected && !isCorrect) cls = 'border-bad bg-bad-soft'
          if (reveal && !isSelected && !isCorrect) cls = 'border-line bg-surface opacity-60'
          return (
            <li key={i}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={reveal}
                onClick={() => onSelect(i)}
                className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-[15px] leading-snug text-ink transition ${cls}`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                    reveal && isCorrect ? 'bg-ok text-white' : reveal && isSelected ? 'bg-bad text-white' : isSelected ? 'bg-brand text-brand-ink' : 'bg-surface-2 text-muted'
                  }`}
                >
                  {reveal && isCorrect ? <Check size={16} strokeWidth={3} /> : reveal && isSelected ? <X size={16} strokeWidth={3} /> : LETTERS[i]}
                </span>
                <span className="pt-0.5">{opt}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {reveal && (
        <div className={`mt-5 rounded-xl p-4 ${selected === correctIndex ? 'bg-ok-soft' : 'bg-bad-soft'}`} aria-live="polite">
          <p className={`mb-1 font-semibold ${selected === correctIndex ? 'text-ok' : 'text-bad'}`}>
            {selected === correctIndex ? 'Correct' : selected === null ? 'Not answered' : 'Not quite'}
          </p>
          <p className="text-[15px] leading-relaxed text-ink">{question.explain}</p>
          {question.ref && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted">
              <BookMarked size={14} /> {question.ref}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
