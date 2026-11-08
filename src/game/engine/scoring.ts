import type { QuizQuestion } from '../../types';
import { isAnswerCorrect } from './missions';

export function computeStars(score: number, maxScore: number): 0 | 1 | 2 | 3 {
  if (maxScore <= 0) return 0;
  const ratio = score / maxScore;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.65) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
}

export interface MissionScoreInput {
  quiz: QuizQuestion[];
  answers: Record<string, string | string[]>;
  /** Scores (0..1) of the graded practice steps, one entry per graded step (missing/skipped = 0). */
  practiceScores: number[];
  bestStreak: number;
  /** Timed missions: limit and time used, in seconds. */
  timeLimitSec?: number;
  timeUsedSec?: number;
}

export interface MissionScore {
  quizCorrect: number;
  quizTotal: number;
  quizPoints: number;
  quizMax: number;
  practicePoints: number;
  practiceMax: number;
  /** (quiz + practice points) / (quiz + practice max), 0..1. Stars are based on this. */
  accuracy: number;
  streakBonus: number;
  speedBonus: number;
  /** Total points (earned points + bonuses); used for Atoms and best score. */
  points: number;
  stars: 0 | 1 | 2 | 3;
}

export const POINTS_PER_DIFFICULTY = 10;
export const POINTS_PER_PRACTICE_STEP = 10;

/**
 * Mission score:
 * - each correct question earns 10 × its difficulty (1–3);
 * - each graded practice step earns up to 10 (× its 0..1 score);
 * - bonuses (not counted for stars): 2 per answer in the best streak (max 20), and for timed missions
 *   up to 20 for time left.
 */
export function scoreMission(input: MissionScoreInput): MissionScore {
  let quizPoints = 0;
  let quizMax = 0;
  let quizCorrect = 0;
  for (const q of input.quiz) {
    const value = POINTS_PER_DIFFICULTY * q.difficulty;
    quizMax += value;
    if (isAnswerCorrect(q, input.answers[q.id])) {
      quizPoints += value;
      quizCorrect++;
    }
  }
  const practiceMax = input.practiceScores.length * POINTS_PER_PRACTICE_STEP;
  const practicePoints = Math.round(input.practiceScores.reduce((a, s) => a + Math.min(1, Math.max(0, s)), 0) * POINTS_PER_PRACTICE_STEP);
  const earned = quizPoints + practicePoints;
  const max = quizMax + practiceMax;
  const accuracy = max > 0 ? earned / max : 0;
  const streakBonus = Math.min(input.bestStreak, 10) * 2;
  let speedBonus = 0;
  if (input.timeLimitSec && input.timeLimitSec > 0 && input.timeUsedSec !== undefined) {
    const remaining = Math.max(0, input.timeLimitSec - input.timeUsedSec);
    speedBonus = Math.round((remaining / input.timeLimitSec) * 20);
  }
  return {
    quizCorrect,
    quizTotal: input.quiz.length,
    quizPoints,
    quizMax,
    practicePoints,
    practiceMax,
    accuracy,
    streakBonus,
    speedBonus,
    points: earned + streakBonus + speedBonus,
    stars: computeStars(earned, max),
  };
}
