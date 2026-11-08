import { useState, type ReactNode } from 'react';
import { isNumericAnswerCorrect, formatAnswer, type Tolerance } from '../../../game/engine/answers';

export interface ChoiceItem {
  id: string;
  prompt: ReactNode;
  choices: readonly string[];
  answer: string;
  explanation?: ReactNode;
}

/**
 * A list of multiple-choice items. One attempt per item; when every item is answered the score
 * (fraction correct) is reported via onComplete.
 */
export function ChoiceTasks({ items, onComplete, label = 'Tasks' }: { items: ChoiceItem[]; onComplete: (score: number) => void; label?: string }) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const correct = items.filter((i) => picked[i.id] === i.answer).length;
  const done = items.every((i) => picked[i.id] !== undefined);

  const pick = (item: ChoiceItem, choice: string) => {
    if (picked[item.id] !== undefined) return;
    const next = { ...picked, [item.id]: choice };
    setPicked(next);
    if (items.every((i) => next[i.id] !== undefined)) {
      onComplete(items.filter((i) => next[i.id] === i.answer).length / items.length);
    }
  };

  return (
    <div className="space-y-3" role="group" aria-label={label}>
      <ol className="space-y-3">
        {items.map((item, idx) => {
          const choice = picked[item.id];
          return (
            <li key={item.id} className="glass p-3 space-y-2" data-testid={`task-${item.id}`}>
              <div className="text-sm"><span className="text-muted">{idx + 1}.</span> {item.prompt}</div>
              <div className="flex flex-wrap gap-2">
                {item.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`btn !py-1 !px-3 text-sm ${choice === c ? (c === item.answer ? 'btn-success' : 'btn-primary') : 'btn-ghost'}`}
                    disabled={choice !== undefined}
                    aria-pressed={choice === c}
                    onClick={() => pick(item, c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {choice !== undefined && (
                <p className="text-sm" role="status">
                  {choice === item.answer ? <span className="text-green-400">✅ Correct.</span> : <span className="text-red-400">❌ The answer is {item.answer}.</span>}
                  {item.explanation && <span className="text-muted"> {item.explanation}</span>}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {done && <p className="font-semibold" data-testid="task-summary">Score: {correct} / {items.length}</p>}
    </div>
  );
}

export interface NumericItem {
  id: string;
  prompt: ReactNode;
  answer: number;
  tolerance?: Tolerance;
  unit?: string;
  /** Worked solution shown after answering. */
  explanation?: ReactNode;
}

/** A list of numeric problems. One attempt per problem; reports the fraction correct when all are answered. */
export function NumericTasks({ items, onComplete, label = 'Problems' }: { items: NumericItem[]; onComplete: (score: number) => void; label?: string }) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const correct = Object.values(results).filter(Boolean).length;
  const done = items.every((i) => results[i.id] !== undefined);

  const check = (item: NumericItem) => {
    const value = inputs[item.id] ?? '';
    if (results[item.id] !== undefined || value.trim() === '') return;
    const next = { ...results, [item.id]: isNumericAnswerCorrect(value, item.answer, item.tolerance) };
    setResults(next);
    if (items.every((i) => next[i.id] !== undefined)) {
      onComplete(items.filter((i) => next[i.id]).length / items.length);
    }
  };

  return (
    <div className="space-y-3" role="group" aria-label={label}>
      <ol className="space-y-3">
        {items.map((item, idx) => {
          const result = results[item.id];
          const inputId = `num-${item.id}`;
          return (
            <li key={item.id} className="glass p-3 space-y-2" data-testid={`task-${item.id}`}>
              <label htmlFor={inputId} className="block text-sm"><span className="text-muted">{idx + 1}.</span> {item.prompt}</label>
              <form className="flex flex-wrap gap-2 items-center" onSubmit={(e) => { e.preventDefault(); check(item); }}>
                <input
                  id={inputId}
                  inputMode="decimal"
                  autoComplete="off"
                  className="w-36"
                  value={inputs[item.id] ?? ''}
                  disabled={result !== undefined}
                  onChange={(e) => setInputs((x) => ({ ...x, [item.id]: e.target.value }))}
                />
                {item.unit && <span className="text-sm text-muted">{item.unit}</span>}
                <button type="submit" className="btn btn-primary !py-1 !px-3 text-sm" disabled={result !== undefined}>Check</button>
              </form>
              {result !== undefined && (
                <p className="text-sm" role="status">
                  {result ? <span className="text-green-400">✅ Correct.</span> : <span className="text-red-400">❌ The answer is {formatAnswer(item.answer)}{item.unit ? ` ${item.unit}` : ''}.</span>}
                  {item.explanation && <span className="text-muted"> {item.explanation}</span>}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {done && <p className="font-semibold" data-testid="task-summary">Score: {correct} / {items.length}</p>}
    </div>
  );
}
