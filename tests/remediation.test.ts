import { describe, it, expect } from 'vitest';
import { buildRemediationQuiz, isRemediationRecommended, clinicFor, missedQuestionsFor } from '../src/game/engine/remediation';
import { migrateProgress, applyMissionResult } from '../src/game/engine/progress';
import type { Mission, MissionProgress, QuizQuestion } from '../src/types';

const q = (id: string): QuizQuestion => ({ id, prompt: id, type: 'mcq', answer: 'A', options: ['A', 'B'], explanation: '', difficulty: 1 });
const base = { world: 'beginner' as const, zone: 'Z', title: 'T', concept: 'C', intro: [], steps: [], rewards: [] };
const m1: Mission = { ...base, id: 'm1', title: 'Mission One', kind: 'core', quiz: [q('a1'), q('a2'), q('a3')] };
const m2: Mission = { ...base, id: 'm2', kind: 'core', quiz: [q('b1'), q('b2')] };
const clinic: Mission = { ...base, id: 'clinic', kind: 'remediation', remediates: ['m1', 'm2'], quiz: [q('r1'), q('r2'), q('r3'), q('r4'), q('r5'), q('r6')] };
const all = [m1, m2, clinic];

const mp = (id: string, missed: string[], completed = true, attempts = 1): MissionProgress => ({
  missionId: id, completed, stars: completed ? 2 : 0, bestScore: 10, attempts, lastPlayed: 0, missedQuestionIds: missed, rewardsClaimed: completed,
});

describe('remediation quiz', () => {
  it('uses missed questions first, then tops up with review questions', () => {
    const p = { ...migrateProgress(null), missions: { m1: mp('m1', ['a2']), m2: mp('m2', ['b1', 'b2']) } };
    expect(missedQuestionsFor(p, ['m1', 'm2'], all).map((x) => x.question.id)).toEqual(['a2', 'b1', 'b2']);
    const r = buildRemediationQuiz(p, clinic, all);
    expect(r.quiz.map((x) => x.id)).toEqual(['a2', 'b1', 'b2', 'r1', 'r2']);
    expect(r.sources).toEqual({ a2: 'm1', b1: 'm2', b2: 'm2' });
    expect(r.personalised).toBe(3);
  });

  it('caps the quiz length', () => {
    const many: Mission = { ...m1, quiz: Array.from({ length: 12 }, (_, i) => q(`x${i}`)) };
    const p = { ...migrateProgress(null), missions: { m1: mp('m1', many.quiz.map((x) => x.id)) } };
    expect(buildRemediationQuiz(p, clinic, [many, m2, clinic]).quiz).toHaveLength(8);
  });

  it('falls back to the review quiz when nothing was missed, ignoring unknown ids', () => {
    const p = { ...migrateProgress(null), missions: { m1: mp('m1', ['gone']) } };
    const r = buildRemediationQuiz(p, clinic, all);
    expect(r.personalised).toBe(0);
    expect(r.quiz.map((x) => x.id)).toEqual(['r1', 'r2', 'r3', 'r4', 'r5', 'r6']);
  });
});

describe('recommendations', () => {
  it('recommends a clinic when covered missions have misses or were failed', () => {
    const clean = { ...migrateProgress(null), missions: { m1: mp('m1', []) } };
    expect(isRemediationRecommended(clean, clinic)).toBe(false);
    expect(isRemediationRecommended({ ...clean, missions: { m1: mp('m1', ['a1']) } }, clinic)).toBe(true);
    expect(isRemediationRecommended({ ...clean, missions: { m2: mp('m2', [], false) } }, clinic)).toBe(true);
    expect(isRemediationRecommended({ ...clean, missions: { m1: mp('m1', ['a1']) } }, m1)).toBe(false);
  });
  it('finds the clinic covering a mission', () => {
    expect(clinicFor('m2', all)?.id).toBe('clinic');
    expect(clinicFor('clinic', all)).toBeUndefined();
  });
});

describe('applying a remediation result', () => {
  it('clears fixed questions from the covered missions', () => {
    const p = { ...migrateProgress(null), missions: { m1: mp('m1', ['a1', 'a2']), m2: mp('m2', ['b1']) } };
    const { progress } = applyMissionResult(p, clinic, {
      correct: 2, total: 3, points: 20, stars: 2, missedQuestionIds: ['b1'], correctQuestionIds: ['a1', 'a2'], now: 1,
    }, ['m1', 'm2', 'clinic']);
    expect(progress.missions.m1!.missedQuestionIds).toEqual([]);
    expect(progress.missions.m2!.missedQuestionIds).toEqual(['b1']);
    expect(isRemediationRecommended(progress, clinic)).toBe(true);
  });
});

describe('lives in results', () => {
  it('running out of lives fails even with enough correct answers', () => {
    const boss: Mission = { ...m1, kind: 'boss', bossRules: { lives: 1 } };
    const { summary } = applyMissionResult(migrateProgress(null), boss, {
      correct: 3, total: 3, points: 30, stars: 3, missedQuestionIds: [], endReason: 'out-of-lives', now: 1,
    }, ['m1']);
    expect(summary.passed).toBe(false);
  });
});
