import type { Mission, MissionStep, QuizQuestion, StepResult } from '../../types';

export type MissionPhase = 'intro' | 'practice' | 'quiz' | 'result';

/** Why the quiz ended: all questions answered, boss lives used up, or the mini-boss timer ran out. */
export type EndReason = 'completed' | 'out-of-lives' | 'time-up';

export interface MissionState {
  mission: Mission;
  phase: MissionPhase;
  stepIndex: number;
  /** Best result reported for each practice step, by step id. */
  stepResults: Record<string, StepResult>;
  quizIndex: number;
  answers: Record<string, string | string[]>;
  /** Current run of consecutive correct answers. */
  streak: number;
  /** Longest run of consecutive correct answers in this attempt. */
  bestStreak: number;
  startedAt: number;
  quizStartedAt: number | null;
  /** Remaining lives for boss rules; null when the mission has no lives rule. */
  livesLeft: number | null;
  endReason: EndReason | null;
  endedAt: number | null;
  /** Options removed by kid-mode hints, by question id. */
  removedOptions: Record<string, string[]>;
}

export function createMissionState(mission: Mission, now: number = Date.now()): MissionState {
  return {
    mission,
    phase: 'intro',
    stepIndex: 0,
    stepResults: {},
    quizIndex: 0,
    answers: {},
    streak: 0,
    bestStreak: 0,
    startedAt: now,
    quizStartedAt: null,
    livesLeft: mission.bossRules?.lives ?? null,
    endReason: null,
    endedAt: null,
    removedOptions: {},
  };
}

// ---------------------------------------------------------------------------
// Kid mode
// ---------------------------------------------------------------------------

/** Kid mode softens boss rules: one extra life and 50 % more time (rounded up to 10 s). */
export function adjustForAgeMode(mission: Mission, ageMode: 'kid' | 'standard'): Mission {
  if (ageMode !== 'kid' || !mission.bossRules) return mission;
  const r = mission.bossRules;
  return {
    ...mission,
    bossRules: {
      ...r,
      ...(r.lives !== undefined ? { lives: r.lives + 1 } : {}),
      ...(r.timeLimitSec !== undefined ? { timeLimitSec: Math.ceil((r.timeLimitSec * 1.5) / 10) * 10 } : {}),
    },
  };
}

/** Whether a 50/50-style hint can be used on a question (unanswered, not hinted yet, ≥ 3 choices). */
export function canUseHint(state: MissionState, qid: string): boolean {
  const q = state.mission.quiz.find((x) => x.id === qid);
  if (!q || state.answers[qid] !== undefined || state.removedOptions[qid]) return false;
  return (q.type === 'mcq' || q.type === 'truefalse') && (q.options?.length ?? 0) >= 3;
}

/** Hint: remove one wrong option (the last one listed, so the result is deterministic). */
export function applyHint(state: MissionState, qid: string): MissionState {
  if (!canUseHint(state, qid)) return state;
  const q = state.mission.quiz.find((x) => x.id === qid)!;
  const wrong = (q.options ?? []).filter((o) => o !== q.answer);
  const remove = wrong[wrong.length - 1]!;
  return { ...state, removedOptions: { ...state.removedOptions, [qid]: [remove] } };
}

export function hintsUsed(state: MissionState): number {
  return Object.keys(state.removedOptions).length;
}

export function advancePhase(state: MissionState, now: number = Date.now()): MissionState {
  switch (state.phase) {
    case 'intro': return state.mission.steps.length > 0 ? { ...state, phase: 'practice', stepIndex: 0 } : startQuiz(state, now);
    case 'practice': return startQuiz(state, now);
    case 'quiz': return finishQuiz(state, 'completed', now);
    case 'result': return state;
  }
}

// ---------------------------------------------------------------------------
// Practice steps
// ---------------------------------------------------------------------------

export function isGraded(step: MissionStep): boolean {
  return step.kind === 'practice';
}

export function gradedSteps(mission: Mission): MissionStep[] {
  return mission.steps.filter(isGraded);
}

/** Record a step result; repeated reports keep the best score. Scores are clamped to 0..1. */
export function completeStep(state: MissionState, stepId: string, result: StepResult): MissionState {
  const score = Math.min(1, Math.max(0, Number.isFinite(result.score) ? result.score : 0));
  const prev = state.stepResults[stepId];
  if (prev && prev.score >= score) return state;
  return { ...state, stepResults: { ...state.stepResults, [stepId]: { score } } };
}

export function isStepComplete(state: MissionState, stepId: string): boolean {
  return state.stepResults[stepId] !== undefined;
}

/** Move to the next practice step, or start the quiz after the last one. */
export function nextStep(state: MissionState, now: number = Date.now()): MissionState {
  if (state.stepIndex + 1 < state.mission.steps.length) return { ...state, stepIndex: state.stepIndex + 1 };
  return startQuiz(state, now);
}

export function isLastStep(state: MissionState): boolean {
  return state.stepIndex >= state.mission.steps.length - 1;
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export function startQuiz(state: MissionState, now: number = Date.now()): MissionState {
  if (state.mission.quiz.length === 0) return finishQuiz({ ...state, quizStartedAt: now }, 'completed', now);
  return { ...state, phase: 'quiz', quizStartedAt: state.quizStartedAt ?? now };
}

export function finishQuiz(state: MissionState, reason: EndReason, now: number = Date.now()): MissionState {
  return { ...state, phase: 'result', endReason: state.endReason ?? reason, endedAt: state.endedAt ?? now };
}

function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Single source of truth for answer checking (used by both the UI feedback and the final score).
 * Fill-in-the-blank answers are compared case- and whitespace-insensitively; choices must match exactly.
 */
export function isAnswerCorrect(q: QuizQuestion, answer: string | string[] | undefined): boolean {
  if (answer === undefined) return false;
  if (Array.isArray(q.answer)) {
    return Array.isArray(answer) && q.answer.length === answer.length && q.answer.every((x, i) => x === answer[i]);
  }
  if (Array.isArray(answer)) return false;
  if (q.type === 'fillblank') return normalizeText(answer) === normalizeText(q.answer);
  return answer === q.answer;
}

/**
 * Record an answer. The first answer is final (re-answering is ignored). Updates streaks and, for missions
 * with a lives rule, removes a life on a wrong answer; running out of lives ends the attempt
 * (`endReason = 'out-of-lives'`; the UI shows feedback, then `nextQuiz` moves to the result).
 */
export function recordAnswer(state: MissionState, qid: string, answer: string | string[]): MissionState {
  if (state.answers[qid] !== undefined || state.phase !== 'quiz' || state.endReason !== null) return state;
  const q = state.mission.quiz.find((x) => x.id === qid);
  const correct = q ? isAnswerCorrect(q, answer) : false;
  const streak = correct ? state.streak + 1 : 0;
  const livesLeft = state.livesLeft === null || correct ? state.livesLeft : Math.max(0, state.livesLeft - 1);
  return {
    ...state,
    answers: { ...state.answers, [qid]: answer },
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    livesLeft,
    endReason: livesLeft === 0 ? 'out-of-lives' : null,
  };
}

/** Advance to the next question, or to the result after the last question / when out of lives. */
export function nextQuiz(state: MissionState, now: number = Date.now()): MissionState {
  if (state.endReason !== null) return finishQuiz(state, state.endReason, now);
  if (state.quizIndex + 1 >= state.mission.quiz.length) return finishQuiz({ ...state, quizIndex: state.quizIndex + 1 }, 'completed', now);
  return { ...state, quizIndex: state.quizIndex + 1 };
}

export function timeLimitMs(state: MissionState): number | null {
  const sec = state.mission.bossRules?.timeLimitSec;
  return sec && sec > 0 ? sec * 1000 : null;
}

/** Milliseconds left on the quiz timer, or null when untimed / not started. */
export function timeRemainingMs(state: MissionState, now: number): number | null {
  const limit = timeLimitMs(state);
  if (limit === null || state.quizStartedAt === null) return null;
  const end = state.endedAt ?? now;
  return Math.max(0, limit - (end - state.quizStartedAt));
}

/** End the quiz because the timer ran out (no-op if it already ended or there is time left). */
export function expireTime(state: MissionState, now: number): MissionState {
  if (state.phase !== 'quiz') return state;
  const left = timeRemainingMs(state, now);
  if (left === null || left > 0) return state;
  return finishQuiz(state, 'time-up', now);
}

export function scoreQuiz(state: MissionState): number {
  return state.mission.quiz.filter((q) => isAnswerCorrect(q, state.answers[q.id])).length;
}

/** Ids of questions that were answered incorrectly or not answered. */
export function missedQuestionIds(state: MissionState): string[] {
  return state.mission.quiz.filter((q) => !isAnswerCorrect(q, state.answers[q.id])).map((q) => q.id);
}

export function correctQuestionIds(state: MissionState): string[] {
  return state.mission.quiz.filter((q) => isAnswerCorrect(q, state.answers[q.id])).map((q) => q.id);
}
