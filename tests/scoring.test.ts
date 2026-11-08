import { describe, it, expect } from 'vitest';
import { computeStars, scoreMission } from '../src/game/engine/scoring';
import type { QuizQuestion } from '../src/types';

describe('scoring basics', () => {
  it('stars', () => {
    expect(computeStars(95, 100)).toBe(3);
    expect(computeStars(70, 100)).toBe(2);
    expect(computeStars(45, 100)).toBe(1);
    expect(computeStars(10, 100)).toBe(0);
    expect(computeStars(10, 0)).toBe(0);
  });
});

describe('scoreMission', () => {
  const q = (id: string, difficulty: 1 | 2 | 3): QuizQuestion => ({ id, prompt: id, type: 'mcq', answer: 'A', options: ['A', 'B'], explanation: '', difficulty });
  const quiz = [q('a', 1), q('b', 2), q('c', 3)];

  it('weights questions by difficulty and adds practice points', () => {
    const s = scoreMission({ quiz, answers: { a: 'A', b: 'B', c: 'A' }, practiceScores: [1, 0.5], bestStreak: 1 });
    expect(s).toMatchObject({ quizCorrect: 2, quizTotal: 3, quizPoints: 40, quizMax: 60, practicePoints: 15, practiceMax: 20, streakBonus: 2, speedBonus: 0 });
    expect(s.accuracy).toBeCloseTo(55 / 80);
    expect(s.points).toBe(57);
    expect(s.stars).toBe(2);
  });

  it('bases stars on accuracy only, not bonuses', () => {
    const perfect = scoreMission({ quiz, answers: { a: 'A', b: 'A', c: 'A' }, practiceScores: [1], bestStreak: 3 });
    expect(perfect.stars).toBe(3);
    const weak = scoreMission({ quiz, answers: { a: 'A' }, practiceScores: [0], bestStreak: 10 });
    expect(weak.streakBonus).toBe(20);
    expect(weak.stars).toBe(0);
  });

  it('skipped practice steps score zero; missions without practice still work', () => {
    expect(scoreMission({ quiz, answers: {}, practiceScores: [0, 0], bestStreak: 0 })).toMatchObject({ practiceMax: 20, practicePoints: 0, points: 0 });
    expect(scoreMission({ quiz, answers: { a: 'A', b: 'A', c: 'A' }, practiceScores: [], bestStreak: 0 }).accuracy).toBe(1);
  });

  it('gives a speed bonus for time left on timed missions', () => {
    const s = scoreMission({ quiz, answers: {}, practiceScores: [], bestStreak: 0, timeLimitSec: 100, timeUsedSec: 25 });
    expect(s.speedBonus).toBe(15);
    expect(scoreMission({ quiz, answers: {}, practiceScores: [], bestStreak: 0, timeLimitSec: 100, timeUsedSec: 200 }).speedBonus).toBe(0);
  });
});
