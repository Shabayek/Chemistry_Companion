import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { MISSIONS, missionsByWorld, getMission } from '../../data/missions';
import { getMolecule } from '../../data/molecules';
import { getElement } from '../../data/elements';
import {
  createMissionState, advancePhase, completeStep, nextStep, recordAnswer, nextQuiz, expireTime, timeRemainingMs,
  timeLimitMs, isAnswerCorrect, missedQuestionIds, correctQuestionIds, gradedSteps, isGraded, isStepComplete, isLastStep,
  adjustForAgeMode, canUseHint, applyHint, hintsUsed, type MissionState,
} from '../../game/engine/missions';
import { scoreMission, type MissionScore } from '../../game/engine/scoring';
import { passThreshold, type MissionOutcome, type MissionResultSummary } from '../../game/engine/progress';
import { buildRemediationQuiz, clinicFor, type RemediationQuiz } from '../../game/engine/remediation';
import { missionAvailability } from '../../game/engine/worlds';
import { Button } from '../../components/Button';
import InteractivePanel from './InteractivePanel';
import { KIND_LABELS } from './labels';
import { titleFor } from '../../lib/titles';
import { toneMessage } from '../../lib/tone';
import { playSound } from '../../lib/sound';
import { dailyBonus, dailyMissionId, currentStreak, localDateKey } from '../../game/engine/daily';
import type { Mission, QuizQuestion, Reward } from '../../types';

/** Group non-currency rewards for display, e.g. "Elements: Hydrogen, Helium" / "Badge: atom-master". */
function groupRewards(rewards: Reward[]): { label: string; names: string[] }[] {
  const name = (r: Reward) => (r.type === 'element' ? getElement(r.id)?.name : r.type === 'molecule' ? getMolecule(r.id)?.name : undefined) ?? r.id;
  const groups: { type: Reward['type']; one: string; many: string }[] = [
    { type: 'element', one: 'Element', many: 'Elements' },
    { type: 'molecule', one: 'Molecule', many: 'Molecules' },
    { type: 'badge', one: 'Badge', many: 'Badges' },
    { type: 'avatar', one: 'Avatar item', many: 'Avatar items' },
  ];
  return groups
    .map((g) => {
      const names = rewards.filter((r) => r.type === g.type).map(name);
      return { label: names.length === 1 ? g.one : g.many, names };
    })
    .filter((g) => g.names.length > 0);
}

function formatClock(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Mission entry point: shows a lock screen when requirements are not met, otherwise runs attempts. */
export function MissionRun({ mission }: { mission: Mission }) {
  const progress = useGameStore((s) => s.progress);
  const [attempt, setAttempt] = useState(0);
  const [started, setStarted] = useState(false);
  const availability = missionAvailability(progress, mission, missionsByWorld(mission.world));

  // Once an attempt has started, finishing it (which may change availability) must not swap in the lock screen.
  if (availability.locked && !started) {
    return (
      <div className="space-y-4">
        <MissionHeader mission={mission} />
        <div className="card text-center space-y-3" role="status">
          <p className="text-3xl" aria-hidden>🔒</p>
          <p className="font-semibold">This mission is locked.</p>
          <p className="text-muted">{availability.reason}</p>
          <Link to={`/world/${mission.world}`} className="btn btn-primary">Back to the world map</Link>
        </div>
      </div>
    );
  }
  return <MissionAttempt key={attempt} mission={mission} onStart={() => setStarted(true)} onRetry={() => setAttempt((a) => a + 1)} />;
}

function MissionHeader({ mission }: { mission: Mission }) {
  useEffect(() => {
    document.title = titleFor(`/mission/${mission.id}`, mission.title);
  }, [mission.id, mission.title]);
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Link to={`/world/${mission.world}`} className="btn btn-ghost !py-1.5 !px-3">← Back</Link>
      <h1 className="text-xl font-bold">{mission.title}</h1>
      {mission.kind !== 'core' && <span className="glass px-2 py-0.5 text-xs">{KIND_LABELS[mission.kind]}</span>}
      <span className="text-xs text-muted ml-auto capitalize">{mission.world}</span>
    </div>
  );
}

interface Finished {
  score: MissionScore;
  outcome: MissionOutcome;
  summary: MissionResultSummary;
}

function MissionAttempt({ mission: base, onRetry, onStart }: { mission: Mission; onRetry: () => void; onStart: () => void }) {
  const navigate = useNavigate();
  const completeMission = useGameStore((s) => s.completeMission);
  // Remediation missions get a personalised quiz, fixed for the duration of this attempt.
  const [remediation] = useState<RemediationQuiz | null>(() =>
    base.kind === 'remediation' ? buildRemediationQuiz(useGameStore.getState().progress, base, MISSIONS) : null);
  const ageMode = useGameStore((s) => s.progress.ageMode);
  const soundOn = useGameStore((s) => s.progress.settings.audio);
  const kid = ageMode === 'kid';
  // Fixed for the attempt: the (possibly personalised) quiz, kid-mode boss rules, and whether this is today's challenge.
  const [mission] = useState<Mission>(() => adjustForAgeMode(remediation ? { ...base, quiz: remediation.quiz } : base, useGameStore.getState().progress.ageMode));
  const [daily] = useState<{ bonus: number } | null>(() => {
    const p = useGameStore.getState().progress;
    const today = localDateKey(new Date());
    if (dailyMissionId(today, p, MISSIONS) !== base.id || p.dailyChallengeDate === today) return null;
    return { bonus: dailyBonus(currentStreak(p, today) + 1) };
  });
  const [state, setState] = useState<MissionState>(() => createMissionState(mission));
  const [finished, setFinished] = useState<Finished | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  const worldIds = missionsByWorld(mission.world).map((m) => m.id);
  const graded = gradedSteps(mission);

  /** Apply a state transition; entering the result phase scores and saves the attempt exactly once. */
  const apply = (next: MissionState) => {
    const prev = stateRef.current;
    stateRef.current = next;
    setState(next);
    if (next.phase === 'result' && prev.phase !== 'result') {
      const limit = mission.bossRules?.timeLimitSec;
      const used = next.quizStartedAt !== null && next.endedAt !== null ? (next.endedAt - next.quizStartedAt) / 1000 : undefined;
      const score = scoreMission({
        quiz: mission.quiz,
        answers: next.answers,
        practiceScores: graded.map((s) => next.stepResults[s.id]?.score ?? 0),
        bestStreak: next.bestStreak,
        ...(limit ? { timeLimitSec: limit } : {}),
        ...(used !== undefined ? { timeUsedSec: used } : {}),
      });
      const outcome: MissionOutcome = {
        correct: score.quizCorrect,
        total: score.quizTotal,
        points: score.points,
        stars: score.stars,
        missedQuestionIds: missedQuestionIds(next),
        correctQuestionIds: correctQuestionIds(next),
        endReason: next.endReason ?? 'completed',
        now: next.endedAt ?? Date.now(),
      };
      const summary = completeMission(base, outcome, worldIds, daily !== null);
      setFinished({ score, outcome, summary });
      playSound(summary.passed ? 'complete' : 'fail', soundOn);
      if (summary.daily) playSound('bonus', soundOn);
    }
  };

  // Mini-boss timer: tick while the quiz runs; end the quiz when time is up.
  const limitMs = timeLimitMs(state);
  useEffect(() => {
    if (state.phase !== 'quiz' || limitMs === null) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const expired = expireTime(stateRef.current, t);
      if (expired !== stateRef.current) apply(expired);
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, limitMs]);

  const step = mission.steps[state.stepIndex];
  const q: QuizQuestion | undefined = mission.quiz[state.quizIndex];
  const answered = q ? state.answers[q.id] !== undefined : false;
  const remaining = timeRemainingMs(state, now);
  const lives = mission.bossRules?.lives;
  const source = q && remediation ? getMission(remediation.sources[q.id] ?? '') : undefined;

  // Transitions are tied to the step/question they were rendered for, so a double click (or a click on a card that
  // is still animating out) can never skip an extra step or question.
  const start = () => {
    if (stateRef.current.phase !== 'intro') return;
    const t = Date.now();
    onStart();
    setNow(t);
    apply(advancePhase(stateRef.current, t));
  };
  const goNextStep = (stepIndex: number) => {
    const cur = stateRef.current;
    if (cur.phase !== 'practice' || cur.stepIndex !== stepIndex) return;
    const t = Date.now();
    setNow(t);
    apply(nextStep(cur, t));
  };
  const goNextQuestion = (quizIndex: number) => {
    const cur = stateRef.current;
    if (cur.phase !== 'quiz' || cur.quizIndex !== quizIndex) return;
    apply(nextQuiz(cur, Date.now()));
  };
  const answer = (a: string | string[]) => {
    if (!q) return;
    const next = recordAnswer(stateRef.current, q.id, a);
    if (next !== stateRef.current) playSound(isAnswerCorrect(q, a) ? 'correct' : 'wrong', soundOn);
    apply(next);
  };
  const hint = () => { if (q) apply(applyHint(stateRef.current, q.id)); };

  return (
    <div className="space-y-4">
      <MissionHeader mission={mission} />

      <AnimatePresence mode="wait">
        {state.phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card space-y-3">
            <h2 className="font-bold">Concept</h2>
            {mission.intro.map((b, i) => <p key={i} className="text-muted">{b.value}</p>)}
            <p className="text-sm">{mission.concept}</p>
            {remediation && (
              <p className="glass p-3 text-sm" data-testid="remediation-note">
                {remediation.personalised > 0
                  ? `🩺 This clinic picked ${remediation.personalised} question${remediation.personalised === 1 ? '' : 's'} you missed earlier, plus review questions.`
                  : '🩺 Nothing to fix right now: this is a refresher on the whole world.'}
              </p>
            )}
            {daily && (
              <p className="glass p-3 text-sm" data-testid="daily-banner">📅 This is today's Daily Challenge: clear it for a bonus of <strong>+{daily.bonus} Atoms</strong>.</p>
            )}
            {kid && (
              <p className="glass p-3 text-sm" data-testid="kid-note">🧒 Kid mode: hints in the quiz{mission.bossRules?.lives ? ', an extra life' : ''}{mission.bossRules?.timeLimitSec ? ', 50% more time' : ''}.</p>
            )}
            {mission.bossRules && <BossRules mission={mission} />}
            <p className="text-xs text-muted">{mission.steps.length} practice step{mission.steps.length === 1 ? '' : 's'} · {mission.quiz.length} quiz question{mission.quiz.length === 1 ? '' : 's'}</p>
            {groupRewards(mission.rewards).length > 0 && (
              <p className="text-xs text-muted" data-testid="reward-preview">
                🎁 First clear: {groupRewards(mission.rewards).map((g) => `${g.label.toLowerCase()} ${g.names.join(', ')}`).join(' · ')}
              </p>
            )}
            <Button onClick={start}>{mission.steps.length > 0 ? 'Start Practice →' : 'Start Quiz →'}</Button>
          </motion.div>
        )}

        {state.phase === 'practice' && step && (
          <motion.div key={`practice-${step.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold">{mission.steps.length > 1 ? `Practice ${state.stepIndex + 1} / ${mission.steps.length}` : 'Practice'}: {step.title}</h2>
              {!isGraded(step) && <span className="text-xs glass px-2 py-0.5">explore</span>}
              <StepDots mission={mission} state={state} />
            </div>
            <p className="text-sm text-muted">{step.prompt}</p>
            <InteractivePanel key={step.id} step={step} onComplete={(r) => apply(completeStep(stateRef.current, step.id, r))} />
            <div className="flex gap-2 items-center flex-wrap">
              {isStepComplete(state, step.id)
                ? <span className="text-sm text-green-400" data-testid="step-status">✓ Step complete ({Math.round((state.stepResults[step.id]?.score ?? 0) * 100)}%)</span>
                : <span className="text-sm text-muted" data-testid="step-status">{isGraded(step) ? 'Finish the task to earn practice points.' : 'Explore, then continue.'}</span>}
              <Button onClick={() => goNextStep(state.stepIndex)} variant={isStepComplete(state, step.id) ? 'primary' : 'ghost'} className="ml-auto">
                {isLastStep(state) ? (isStepComplete(state, step.id) ? 'Go to Quiz →' : 'Skip to Quiz →') : (isStepComplete(state, step.id) ? 'Next step →' : 'Skip step →')}
              </Button>
            </div>
          </motion.div>
        )}

        {state.phase === 'quiz' && q && (
          <motion.div key={`quiz-${state.quizIndex}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="card space-y-3">
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted">
              <span>Question {state.quizIndex + 1} / {mission.quiz.length}</span>
              {lives !== undefined && state.livesLeft !== null && (
                <span role="img" aria-label={`${state.livesLeft} of ${lives} lives left`} data-testid="lives" className="text-base">
                  {'❤️'.repeat(state.livesLeft)}{'🤍'.repeat(lives - state.livesLeft)}
                </span>
              )}
              {remaining !== null && limitMs !== null && (
                <span className="flex items-center gap-2 ml-auto" data-testid="timer">
                  <span aria-hidden>⏱</span>
                  <span role="timer" aria-label={`${Math.ceil(remaining / 1000)} seconds left`} className={remaining < 15000 ? 'text-red-400 font-bold' : ''}>{formatClock(remaining)}</span>
                  <span aria-hidden className="inline-block w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <span className="block h-full bg-[var(--accent)]" style={{ width: `${(remaining / limitMs) * 100}%` }} />
                  </span>
                </span>
              )}
            </div>
            {source && <p className="text-xs glass px-2 py-1 inline-block">From <strong>{source.title}</strong>: {source.concept}</p>}
            <h2 className="font-bold">{q.prompt}</h2>
            {q.type === 'mcq' || q.type === 'truefalse' ? (
              <div className="grid gap-2">
                {(q.options ?? []).filter((opt) => !(state.removedOptions[q.id] ?? []).includes(opt)).map((opt) => {
                  const chosen = state.answers[q.id] === opt;
                  const look = !answered ? 'btn-ghost' : opt === q.answer ? 'btn-success' : chosen ? 'btn-ghost !border-red-400 text-red-300' : 'btn-ghost opacity-60';
                  return (
                    <button key={opt} className={`btn ${look} quiz-option`} onClick={() => answer(opt)} disabled={answered} aria-pressed={chosen}>
                      {opt}{answered && opt === q.answer ? ' ✓' : answered && chosen ? ' ✗' : ''}
                    </button>
                  );
                })}
              </div>
            ) : (
              <FillBlank onSubmit={answer} disabled={answered} />
            )}
            {kid && canUseHint(state, q.id) && (
              <button type="button" className="btn btn-ghost !py-1 !px-3 text-sm" onClick={hint}>💡 Hint: remove a wrong answer</button>
            )}
            {state.removedOptions[q.id] && !answered && <p className="text-xs text-muted" role="status">💡 One wrong answer removed.</p>}
            {answered && (
              <div className="text-sm mt-2 space-y-2" role="status">
                {isAnswerCorrect(q, state.answers[q.id])
                  ? <span className="text-green-400">{toneMessage('correct', kid, state.quizIndex)} {q.explanation}</span>
                  : <span className="text-red-400">{toneMessage('wrong', kid, state.quizIndex)} {q.explanation}</span>}
                {state.endReason === 'out-of-lives' && <p className="font-bold text-red-400">💔 Out of lives!</p>}
                <div><Button onClick={() => goNextQuestion(state.quizIndex)}>{state.endReason === 'out-of-lives' ? 'See results' : 'Next →'}</Button></div>
              </div>
            )}
          </motion.div>
        )}

        {state.phase === 'result' && finished && (
          <ResultCard key="result" mission={mission} finished={finished} state={state} kid={kid}
            onFinish={() => navigate('/world/' + mission.world)} onRetry={onRetry} />
        )}
      </AnimatePresence>
    </div>
  );
}

function BossRules({ mission }: { mission: Mission }) {
  const r = mission.bossRules!;
  return (
    <ul className="glass p-3 text-sm space-y-1" aria-label="Boss rules">
      {r.lives !== undefined && <li>❤️ {r.lives} lives: each wrong quiz answer costs one. Lose them all and the attempt ends.</li>}
      {r.timeLimitSec !== undefined && <li>⏱ {formatClock(r.timeLimitSec * 1000)} to finish the quiz. Unanswered questions count as wrong.</li>}
      <li>🎯 Answer at least {Math.round(passThreshold(mission) * 100)}% of the quiz correctly to win.</li>
    </ul>
  );
}

function StepDots({ mission, state }: { mission: Mission; state: MissionState }) {
  if (mission.steps.length < 2) return null;
  return (
    <span className="flex gap-1 ml-auto" aria-hidden>
      {mission.steps.map((s, i) => (
        <span key={s.id} className={`w-2 h-2 rounded-full ${state.stepResults[s.id] ? 'bg-green-400' : i === state.stepIndex ? 'bg-[var(--accent)]' : 'bg-white/20'}`} />
      ))}
    </span>
  );
}

function ResultCard({ mission, finished, state, kid, onFinish, onRetry }: { mission: Mission; finished: Finished; state: MissionState; kid: boolean; onFinish: () => void; onRetry: () => void }) {
  const { score, summary } = finished;
  const graded = gradedSteps(mission);
  const stepsDone = graded.filter((s) => state.stepResults[s.id]).length;
  const clinic = mission.kind !== 'remediation' ? clinicFor(mission.id, MISSIONS) : undefined;
  const needsHelp = !summary.passed || finished.outcome.missedQuestionIds.length > 0;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card text-center space-y-3">
      <h2 className="text-2xl font-bold text-gradient">{summary.passed ? 'Mission Complete!' : 'Mission Not Cleared'}</h2>
      {kid && <p className="text-lg">{toneMessage(summary.passed ? 'passed' : 'failed', true, score.quizCorrect)}</p>}
      {state.endReason === 'out-of-lives' && <p className="text-red-400">💔 You ran out of lives.</p>}
      {state.endReason === 'time-up' && <p className="text-amber-300">⏱ Time's up! Unanswered questions count as wrong.</p>}
      <p>You answered {score.quizCorrect} / {score.quizTotal} correctly.</p>
      {graded.length > 0 && <p className="text-sm text-muted" data-testid="practice-summary">Practice: {stepsDone} / {graded.length} step{graded.length === 1 ? '' : 's'} completed · {score.practicePoints} / {score.practiceMax} points</p>}
      {summary.passed && (
        <div role="img" className="text-amber-300 text-xl" aria-label={`${summary.attemptStars} stars`}>{'★'.repeat(summary.attemptStars)}{'☆'.repeat(3 - summary.attemptStars)}</div>
      )}
      {!summary.passed && state.endReason !== 'out-of-lives' && <p className="text-muted">Answer at least {Math.ceil(score.quizTotal * passThreshold(mission))} correctly to clear this mission.</p>}
      <dl className="text-xs text-muted flex flex-wrap justify-center gap-x-4" aria-label="Score breakdown">
        <div><dt className="inline">Quiz </dt><dd className="inline">{score.quizPoints}/{score.quizMax}</dd></div>
        {score.practiceMax > 0 && <div><dt className="inline">Practice </dt><dd className="inline">{score.practicePoints}/{score.practiceMax}</dd></div>}
        {score.streakBonus > 0 && <div><dt className="inline">Streak bonus </dt><dd className="inline">+{score.streakBonus}</dd></div>}
        {score.speedBonus > 0 && <div><dt className="inline">Speed bonus </dt><dd className="inline">+{score.speedBonus}</dd></div>}
      </dl>
      {summary.daily && <p className="text-amber-300 font-semibold" data-testid="daily-result">📅 Daily Challenge complete! +{summary.daily.bonus} Atoms · 🔥 {summary.daily.streak}-day streak</p>}
      {hintsUsed(state) > 0 && <p className="text-xs text-muted">💡 Hints used: {hintsUsed(state)}</p>}
      <p data-testid="atoms-earned">+{summary.totalAtoms} Atoms{summary.newBest && summary.totalAtoms > 0 ? ' (new best!)' : ''}</p>
      {summary.items.length > 0 && (
        <ul className="text-sm space-y-1" aria-label="Rewards">
          {groupRewards(summary.items).map((g) => <li key={g.label}>🎁 {g.label}: {g.names.join(', ')}</li>)}
        </ul>
      )}
      {summary.rewardsAlreadyClaimed && <p className="text-xs text-muted">Mission rewards already claimed. Beat your best score to earn more Atoms.</p>}
      {summary.unlockedWorld && <p className="text-green-400 font-semibold">🔓 {summary.unlockedWorld} world unlocked!</p>}
      {clinic && needsHelp && (
        <p className="text-sm" data-testid="clinic-recommendation">🩺 Recommended: review these questions in <Link to={`/mission/${clinic.id}`}>{clinic.title}</Link>.</p>
      )}
      <div className="flex gap-2 justify-center">
        <Button onClick={onFinish}>Finish & Return</Button>
        <Button variant="ghost" onClick={onRetry}>Try Again</Button>
      </div>
    </motion.div>
  );
}

function FillBlank({ onSubmit, disabled }: { onSubmit: (a: string) => void; disabled: boolean }) {
  const [val, setVal] = useState('');
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (val.trim()) onSubmit(val); }}>
      <label className="sr-only" htmlFor="fill-blank">Your answer</label>
      <input id="fill-blank" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Type answer" disabled={disabled} />
      <Button type="submit" disabled={disabled}>Submit</Button>
    </form>
  );
}
