// Remediation ("Clinic") missions: build a personalised quiz from questions the player missed.
import type { Mission, Progress, QuizQuestion } from '../../types';

export interface RemediationQuiz {
  quiz: QuizQuestion[];
  /** Question id -> id of the mission the question came from (for "From: …" labels). */
  sources: Record<string, string>;
  /** How many questions were personalised (taken from missed questions). */
  personalised: number;
}

export const REMEDIATION_MAX_QUESTIONS = 8;
export const REMEDIATION_MIN_QUESTIONS = 5;

/** Missed questions (latest attempt) of the missions a remediation mission covers, in target order. */
export function missedQuestionsFor(progress: Progress, targetIds: readonly string[], missions: readonly Mission[]): { question: QuizQuestion; sourceId: string }[] {
  const out: { question: QuizQuestion; sourceId: string }[] = [];
  for (const id of targetIds) {
    const source = missions.find((m) => m.id === id);
    if (!source) continue;
    for (const qid of progress.missions[id]?.missedQuestionIds ?? []) {
      const question = source.quiz.find((q) => q.id === qid);
      if (question) out.push({ question, sourceId: id });
    }
  }
  return out;
}

/**
 * Quiz for a remediation mission: the player's missed questions first (up to `max`), topped up with the
 * mission's own review questions to at least `min`. With nothing missed, the mission's own quiz is used.
 */
export function buildRemediationQuiz(
  progress: Progress,
  mission: Mission,
  missions: readonly Mission[],
  { max = REMEDIATION_MAX_QUESTIONS, min = REMEDIATION_MIN_QUESTIONS }: { max?: number; min?: number } = {},
): RemediationQuiz {
  const missed = missedQuestionsFor(progress, mission.remediates ?? [], missions).slice(0, max);
  const quiz: QuizQuestion[] = missed.map((m) => m.question);
  const sources: Record<string, string> = Object.fromEntries(missed.map((m) => [m.question.id, m.sourceId]));
  // Nothing missed: the full review quiz (capped). Otherwise top up to `min` with review questions.
  const limit = missed.length === 0 ? Math.min(max, mission.quiz.length) : Math.min(max, Math.max(min, missed.length));
  for (const q of mission.quiz) {
    if (quiz.length >= limit) break;
    if (!quiz.some((x) => x.id === q.id)) quiz.push(q);
  }
  return { quiz, sources, personalised: missed.length };
}

/** A remediation mission is recommended when any mission it covers has missed questions or was failed. */
export function isRemediationRecommended(progress: Progress, mission: Mission): boolean {
  if (mission.kind !== 'remediation') return false;
  return (mission.remediates ?? []).some((id) => {
    const mp = progress.missions[id];
    return !!mp && (mp.missedQuestionIds.length > 0 || (mp.attempts > 0 && !mp.completed));
  });
}

/** The remediation mission that covers a given mission, if any. */
export function clinicFor(missionId: string, missions: readonly Mission[]): Mission | undefined {
  return missions.find((m) => m.kind === 'remediation' && (m.remediates ?? []).includes(missionId));
}

export interface MissedEntry {
  question: QuizQuestion;
  mission: Mission;
  clinic: Mission | undefined;
}

/**
 * Every question missed in the latest attempt of any mission, listed once, under the mission it belongs to
 * (Clinic quizzes reuse other missions' questions, so ids are resolved across all missions), in data order.
 */
export function allMissedQuestions(progress: Progress, missions: readonly Mission[]): MissedEntry[] {
  const owner = new Map<string, { question: QuizQuestion; mission: Mission }>();
  for (const mission of missions) for (const question of mission.quiz) owner.set(question.id, { question, mission });
  const missed = new Set<string>();
  for (const mission of missions) for (const qid of progress.missions[mission.id]?.missedQuestionIds ?? []) missed.add(qid);
  const out: MissedEntry[] = [];
  for (const mission of missions) {
    for (const question of mission.quiz) {
      if (!missed.has(question.id) || owner.get(question.id)?.mission !== mission) continue;
      out.push({ question, mission, clinic: mission.kind === 'remediation' ? mission : clinicFor(mission.id, missions) });
    }
  }
  return out;
}
