import { Link } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { MISSIONS } from '../../data/missions';
import { allMissedQuestions } from '../../game/engine/remediation';
import { worldOrder } from '../../game/engine/progress';
import { worldLabel } from '../../game/engine/worlds';

/** Every question the player missed (latest attempt of each mission), grouped by world, with the right answer. */
export default function Review() {
  const progress = useGameStore((s) => s.progress);
  const entries = allMissedQuestions(progress, MISSIONS);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mistakes Review</h1>
      <p className="text-sm text-muted">
        Questions you got wrong in your latest attempts. Answer them correctly in a mission or its Clinic and they leave this list.
      </p>
      {entries.length === 0 && (
        <div className="card text-center space-y-2" role="status">
          <p className="text-3xl" aria-hidden>🎉</p>
          <p className="font-semibold">No mistakes to review.</p>
          <Link to="/" className="btn btn-primary">Back to the worlds</Link>
        </div>
      )}
      {worldOrder().map((w) => {
        const list = entries.filter((e) => e.mission.world === w);
        if (list.length === 0) return null;
        const clinic = list.find((e) => e.clinic)?.clinic;
        return (
          <section key={w} className="card space-y-3" aria-labelledby={`review-${w}`}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={`review-${w}`} className="font-bold">{worldLabel(w)} <span className="text-sm text-muted">({list.length})</span></h2>
              {clinic && <Link to={`/mission/${clinic.id}`} className="btn btn-primary !py-1 !px-3 text-sm ml-auto">🩺 Practise in {clinic.title}</Link>}
            </div>
            <ul className="space-y-2">
              {list.map(({ question, mission }) => (
                <li key={question.id} className="glass p-3 space-y-1" data-testid={`review-${question.id}`}>
                  <p className="font-semibold">{question.prompt}</p>
                  <p className="text-sm">✅ <span className="sr-only">Correct answer: </span>{Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}</p>
                  {question.explanation && <p className="text-sm text-muted">{question.explanation}</p>}
                  <p className="text-xs">From <Link to={`/mission/${mission.id}`}>{mission.title}</Link></p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
