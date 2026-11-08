import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  localDateKey, previousDateKey, dailyMissionId, dailyBonus, currentStreak, dailyStatus, applyDailyCompletion, DAILY_BONUS_MAX,
} from '../src/game/engine/daily';
import { adjustForAgeMode, createMissionState, startQuiz, canUseHint, applyHint, hintsUsed, recordAnswer } from '../src/game/engine/missions';
import { allMissedQuestions } from '../src/game/engine/remediation';
import { migrateProgress } from '../src/game/engine/progress';
import { toneMessage } from '../src/lib/tone';
import { playSound, resetSoundForTests } from '../src/lib/sound';
import { MISSIONS, getMission } from '../src/data/missions';
import { useGameStore } from '../src/store/useGameStore';
import type { MissionProgress, Progress } from '../src/types';

const base = () => migrateProgress(null);

describe('daily challenge', () => {
  it('date keys', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(previousDateKey('2026-03-01')).toBe('2026-02-28');
    expect(previousDateKey('2024-03-01')).toBe('2024-02-29');
    expect(previousDateKey('2026-01-01')).toBe('2025-12-31');
  });

  it('picks a deterministic core mission from unlocked worlds only', () => {
    const p = base();
    const a = dailyMissionId('2026-05-01', p, MISSIONS);
    expect(a).toBe(dailyMissionId('2026-05-01', p, MISSIONS));
    const picks = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      const id = dailyMissionId(`2026-02-${String(d).padStart(2, '0')}`, p, MISSIONS)!;
      const m = getMission(id)!;
      expect(m.kind).toBe('core');
      expect(m.world).toBe('beginner');
      picks.add(id);
    }
    expect(picks.size).toBeGreaterThan(3); // rotates
    const all: Progress = { ...p, unlockedWorlds: ['beginner', 'intermediate', 'advanced', 'expert'] };
    const worlds = new Set(Array.from({ length: 60 }, (_, i) => getMission(dailyMissionId(`2026-07-${i}`, all, MISSIONS)!)!.world));
    expect(worlds.size).toBe(4);
    expect(dailyMissionId('2026-01-01', p, [])).toBeNull();
  });

  it('bonus grows with the streak and is capped', () => {
    expect(dailyBonus(1)).toBe(30);
    expect(dailyBonus(2)).toBe(40);
    expect(dailyBonus(50)).toBe(DAILY_BONUS_MAX);
  });

  it('streak: continues on consecutive days, restarts after a gap, pays once per day', () => {
    let p = base();
    const day1 = applyDailyCompletion(p, '2026-05-01')!;
    expect(day1).toMatchObject({ bonus: 30, streak: 1 });
    p = day1.progress;
    expect(p).toMatchObject({ currency: 30, streakDays: 1, dailyChallengeDate: '2026-05-01', dailyChallengeDone: true });
    expect(applyDailyCompletion(p, '2026-05-01')).toBeNull();
    const day2 = applyDailyCompletion(p, '2026-05-02')!;
    expect(day2).toMatchObject({ bonus: 40, streak: 2 });
    expect(currentStreak(day2.progress, '2026-05-03')).toBe(2);
    expect(currentStreak(day2.progress, '2026-05-04')).toBe(0);
    expect(applyDailyCompletion(day2.progress, '2026-05-05')).toMatchObject({ bonus: 30, streak: 1 });
  });

  it('status for the home page', () => {
    const p = base();
    expect(dailyStatus(p, '2026-05-01', MISSIONS)).toMatchObject({ done: false, streak: 0, bonus: 30 });
    const done = applyDailyCompletion(p, '2026-05-01')!.progress;
    expect(dailyStatus(done, '2026-05-01', MISSIONS)).toMatchObject({ done: true, streak: 1, bonus: 30 });
    expect(dailyStatus(done, '2026-05-02', MISSIONS)).toMatchObject({ done: false, streak: 1, bonus: 40 });
  });

  it('the store pays the daily bonus only for a passed daily mission', () => {
    useGameStore.getState().reset();
    const m = getMission('beg-atom-builder')!;
    const outcome = { correct: 3, total: 3, points: 10, stars: 3 as const, missedQuestionIds: [], now: new Date(2026, 4, 1, 12).getTime() };
    const ids = ['beg-atom-builder'];
    expect(useGameStore.getState().completeMission(m, { ...outcome, correct: 0 }, ids, true).daily).toBeNull();
    const summary = useGameStore.getState().completeMission(m, outcome, ids, true);
    expect(summary.daily).toEqual({ bonus: 30, streak: 1 });
    expect(useGameStore.getState().progress.dailyChallengeDate).toBe('2026-05-01');
    expect(useGameStore.getState().completeMission(m, outcome, ids, true).daily).toBeNull();
    expect(useGameStore.getState().completeMission(m, outcome, ids, false).daily).toBeNull();
  });
});

describe('kid mode', () => {
  it('adds a life and 50% more time to boss rules only', () => {
    const boss = getMission('beg-boss')!;
    const mini = getMission('beg-miniboss')!;
    expect(adjustForAgeMode(boss, 'kid').bossRules).toMatchObject({ lives: 4, passThreshold: 0.7 });
    expect(adjustForAgeMode(mini, 'kid').bossRules?.timeLimitSec).toBe(180);
    expect(adjustForAgeMode(mini, 'standard')).toBe(mini);
    const core = getMission('beg-atom-builder')!;
    expect(adjustForAgeMode(core, 'kid')).toBe(core);
  });

  it('a hint removes one wrong option, once, before answering, on questions with 3+ options', () => {
    const m = getMission('beg-atom-builder')!;
    let s = startQuiz(createMissionState(m, 0), 1);
    expect(canUseHint(s, 'b1')).toBe(true);
    s = applyHint(s, 'b1');
    expect(s.removedOptions).toEqual({ b1: ['Electron'] });
    expect(canUseHint(s, 'b1')).toBe(false);
    expect(applyHint(s, 'b1')).toBe(s);
    expect(hintsUsed(s)).toBe(1);
    s = recordAnswer(s, 'b2', 'In the nucleus');
    expect(canUseHint(s, 'b2')).toBe(false);
    const tf = getMission('beg-physical-chemical')!; // b22 is true/false (2 options)
    expect(canUseHint(startQuiz(createMissionState(tf, 0), 1), 'b22')).toBe(false);
  });

  it('friendly wording in kid mode, neutral otherwise', () => {
    expect(toneMessage('correct', false)).toBe('Correct!');
    expect(toneMessage('correct', true, 0)).not.toBe(toneMessage('correct', true, 1));
    expect(toneMessage('wrong', true, 7)).toMatch(/try|Almost|guess/i);
  });
});

describe('sound effects', () => {
  beforeEach(() => resetSoundForTests());

  it('does nothing when disabled or when Web Audio is missing', () => {
    const events: string[] = [];
    const onSound = (e: Event) => events.push((e as CustomEvent<string>).detail);
    window.addEventListener('cc:sound', onSound);
    expect(playSound('correct', false)).toBe(false);
    expect(events).toEqual([]);
    expect(playSound('correct', true)).toBe(false); // jsdom has no AudioContext
    expect(events).toEqual(['correct']);
    window.removeEventListener('cc:sound', onSound);
  });

  it('schedules oscillators through Web Audio', () => {
    const started: number[] = [];
    class FakeCtx {
      state = 'running'; currentTime = 0; destination = {};
      createOscillator() { return { type: '', frequency: { value: 0 }, connect: (g: unknown) => g, start: (t: number) => started.push(t), stop: vi.fn() }; }
      createGain() { return { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() }; }
      resume = vi.fn();
    }
    vi.stubGlobal('AudioContext', FakeCtx);
    expect(playSound('complete', true)).toBe(true);
    expect(started).toHaveLength(4);
    vi.unstubAllGlobals();
  });
});

describe('mistakes review data', () => {
  const mp = (id: string, missed: string[]): MissionProgress => ({ missionId: id, completed: false, stars: 0, bestScore: 0, attempts: 1, lastPlayed: 0, missedQuestionIds: missed, rewardsClaimed: false });
  it('lists each missed question once, under its own mission, with the clinic', () => {
    const p: Progress = { ...base(), missions: {
      'beg-atom-builder': mp('beg-atom-builder', ['b1', 'b3']),
      'beg-clinic': mp('beg-clinic', ['b1', 'bc2']), // clinic quizzes reuse other missions' questions
      'int-formulas': mp('int-formulas', ['i18']),
    } };
    const list = allMissedQuestions(p, MISSIONS).map((e) => `${e.mission.id}:${e.question.id}:${e.clinic?.id}`);
    expect(list).toEqual(['beg-atom-builder:b1:beg-clinic', 'beg-atom-builder:b3:beg-clinic', 'beg-clinic:bc2:beg-clinic', 'int-formulas:i18:int-clinic']);
  });
});
