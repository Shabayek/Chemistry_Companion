import { describe, it, expect } from 'vitest';
import {
  migrateProgress, computeWorldCompletion, unlockWorld, applyMissionResult, collectMolecule,
  PROGRESS_VERSION, DEFAULT_PROGRESS, type MissionOutcome,
} from '../src/game/engine/progress';
import type { Mission, MissionProgress } from '../src/types';
import { MISSIONS, missionsByWorld } from '../src/data/missions';

const mp = (id: string, completed = true): MissionProgress => ({
  missionId: id, completed, stars: 3, bestScore: 10, attempts: 1, lastPlayed: 0, missedQuestionIds: [], rewardsClaimed: completed,
});

describe('progress basics', () => {
  it('migrates null to defaults', () => {
    const p = migrateProgress(null);
    expect(p.unlockedWorlds).toEqual(['beginner']);
    expect(p.version).toBe(PROGRESS_VERSION);
  });
  it('world completion', () => {
    const p = { ...migrateProgress(null), missions: { m1: mp('m1') } };
    expect(computeWorldCompletion(p, ['m1', 'm2'])).toBe(50);
  });
  it('unlock world', () => {
    expect(unlockWorld(migrateProgress(null), 'intermediate').unlockedWorlds).toContain('intermediate');
  });
  it('defaults are not shared between migrations (no accidental mutation)', () => {
    const a = migrateProgress(null);
    a.collection.elements.push('H');
    expect(migrateProgress(null).collection.elements).toEqual([]);
    expect(DEFAULT_PROGRESS.collection.elements).toEqual([]);
  });
  it('collectMolecule normalises legacy formula keys', () => {
    const p = collectMolecule(collectMolecule(migrateProgress(null), 'H2O'), 'water');
    expect(p.collection.molecules).toEqual(['water']);
  });
});

describe('migrateProgress v1 -> v2', () => {
  const v1Save = {
    version: 1,
    playerName: 'Marie',
    ageMode: 'kid',
    theme: 'light',
    locale: 'en',
    unlockedWorlds: ['beginner', 'intermediate'],
    missions: {
      'beg-atom-builder': { missionId: 'beg-atom-builder', completed: true, stars: 3, bestScore: 80, attempts: 1, lastPlayed: 123 },
      'beg-boss': { missionId: 'beg-boss', completed: false, stars: 1, bestScore: 20, attempts: 1, lastPlayed: 456 },
    },
    collection: { elements: ['H', 'H'], molecules: ['H2O', 'NaCl', 'CH4'], badges: ['atom-master'], avatarItems: [] },
    currency: 250,
    settings: { audio: false, textSize: 'lg', reducedMotion: true, kidTone: true },
    streakDays: 2,
  };

  it('keeps player data', () => {
    const p = migrateProgress(v1Save);
    expect(p.version).toBe(2);
    expect(p.playerName).toBe('Marie');
    expect(p.ageMode).toBe('kid');
    expect(p.theme).toBe('light');
    expect(p.currency).toBe(250);
    expect(p.settings).toEqual({ audio: false, textSize: 'lg', reducedMotion: true, kidTone: true });
    expect(p.unlockedWorlds).toEqual(['beginner', 'intermediate']);
    expect(p.collection.badges).toEqual(['atom-master']);
  });

  it('converts molecule formulas to stable ids and de-duplicates', () => {
    const p = migrateProgress(v1Save);
    expect(p.collection.molecules).toEqual(['water', 'sodium-chloride', 'methane']);
    expect(p.collection.elements).toEqual(['H']);
  });

  it('adds remediation/reward fields; legacy records count as already rewarded', () => {
    const p = migrateProgress(v1Save);
    expect(p.missions['beg-atom-builder']).toMatchObject({ completed: true, stars: 3, missedQuestionIds: [], rewardsClaimed: true });
    // v1 forced 1 star on failed attempts; stars only count for cleared missions now.
    expect(p.missions['beg-boss']).toMatchObject({ completed: false, stars: 0, rewardsClaimed: true, attempts: 1 });
  });

  it('is idempotent', () => {
    const once = migrateProgress(v1Save);
    expect(migrateProgress(JSON.parse(JSON.stringify(once)))).toEqual(once);
  });
});

describe('migrateProgress robustness', () => {
  it.each([undefined, 42, 'text', [], true])('returns defaults for %s', (raw) => {
    expect(migrateProgress(raw)).toEqual(migrateProgress(null));
  });

  it('repairs malformed fields instead of crashing', () => {
    const p = migrateProgress({
      playerName: 123,
      theme: 'neon',
      currency: -50,
      unlockedWorlds: ['expert', 'atlantis', 7],
      collection: { elements: 'H', molecules: [1, 'O2'] },
      settings: { textSize: 'huge', audio: 'yes' },
      missions: { good: { completed: true, stars: 2, bestScore: 5, attempts: 1, lastPlayed: 1 }, bad: 'oops', worse: { stars: 9 } },
    });
    expect(p.playerName).toBe('Explorer');
    expect(p.theme).toBe('dark');
    expect(p.currency).toBe(0);
    expect(p.unlockedWorlds).toEqual(['beginner', 'expert']);
    expect(p.collection.elements).toEqual([]);
    expect(p.collection.molecules).toEqual(['oxygen-gas']);
    expect(p.settings).toEqual(DEFAULT_PROGRESS.settings);
    expect(Object.keys(p.missions).sort()).toEqual(['good', 'worse']);
    expect(p.missions.worse).toMatchObject({ completed: false, stars: 0, attempts: 0 });
  });
});

describe('applyMissionResult', () => {
  const mission: Mission = {
    id: 'm1', world: 'beginner', zone: 'Z', title: 'T', concept: 'C', kind: 'core', intro: [],
    steps: [{ id: 's1', kind: 'practice', title: 't', prompt: 'p', interactive: 'molecule-maker', data: { target: 'H2O' } }],
    quiz: [],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 10 },
      { type: 'element', id: 'H' },
      { type: 'molecule', id: 'water' },
      { type: 'badge', id: 'first' },
    ],
  };
  const world = ['m1', 'm2', 'm3', 'm4', 'm5'];
  const outcome = (correct: number, points: number, stars: 0 | 1 | 2 | 3 = 3): MissionOutcome => ({
    correct, total: 5, points, stars, missedQuestionIds: correct < 5 ? ['q5'] : [], now: 1000,
  });

  it('grants one-time rewards on the first clear', () => {
    const { progress, summary } = applyMissionResult(migrateProgress(null), mission, outcome(5, 100), world);
    expect(summary).toMatchObject({ passed: true, firstClear: true, performanceAtoms: 100, rewardAtoms: 10, totalAtoms: 110, attemptStars: 3 });
    expect(summary.items.map((r) => r.id)).toEqual(['H', 'water', 'first']);
    expect(progress.currency).toBe(110);
    expect(progress.collection).toMatchObject({ elements: ['H'], molecules: ['water'], badges: ['first'] });
    expect(progress.missions.m1).toMatchObject({ completed: true, stars: 3, bestScore: 100, attempts: 1, rewardsClaimed: true });
  });

  it('does not re-grant rewards or pay for replays that do not beat the best', () => {
    const first = applyMissionResult(migrateProgress(null), mission, outcome(5, 100), world).progress;
    const { progress, summary } = applyMissionResult(first, mission, outcome(5, 90), world);
    expect(summary).toMatchObject({ firstClear: false, rewardsAlreadyClaimed: true, totalAtoms: 0, newBest: false });
    expect(summary.items).toEqual([]);
    expect(progress.currency).toBe(110);
    expect(progress.missions.m1!.attempts).toBe(2);
    expect(progress.missions.m1!.bestScore).toBe(100);
  });

  it('pays only the improvement when a replay beats the best score', () => {
    const first = applyMissionResult(migrateProgress(null), mission, outcome(4, 60, 2), world).progress;
    const { progress, summary } = applyMissionResult(first, mission, outcome(5, 100), world);
    expect(summary.performanceAtoms).toBe(40);
    expect(summary.newBest).toBe(true);
    expect(progress.missions.m1).toMatchObject({ stars: 3, bestScore: 100 });
  });

  it('never downgrades completion or stars after a bad replay', () => {
    const first = applyMissionResult(migrateProgress(null), mission, outcome(5, 100), world).progress;
    const { progress, summary } = applyMissionResult(first, mission, outcome(1, 10, 0), world);
    expect(summary.passed).toBe(false);
    expect(progress.missions.m1).toMatchObject({ completed: true, stars: 3, bestScore: 100, missedQuestionIds: ['q5'] });
  });

  it('a failed first attempt grants no items; the later clear does', () => {
    const failed = applyMissionResult(migrateProgress(null), mission, outcome(2, 30, 0), world);
    expect(failed.summary).toMatchObject({ passed: false, firstClear: false, attemptStars: 0, rewardAtoms: 0 });
    expect(failed.progress.collection.elements).toEqual([]);
    expect(failed.progress.missions.m1).toMatchObject({ completed: false, stars: 0, rewardsClaimed: false });
    const cleared = applyMissionResult(failed.progress, mission, outcome(5, 100), world);
    expect(cleared.summary.firstClear).toBe(true);
    expect(cleared.progress.collection.elements).toEqual(['H']);
  });

  it('gives at least one star to any clear', () => {
    expect(applyMissionResult(migrateProgress(null), mission, outcome(3, 5, 0), world).summary.attemptStars).toBe(1);
  });

  it('respects a custom boss pass threshold', () => {
    const boss: Mission = { ...mission, kind: 'boss', bossRules: { passThreshold: 0.8 } };
    expect(applyMissionResult(migrateProgress(null), boss, outcome(3, 50), world).summary.passed).toBe(false);
    expect(applyMissionResult(migrateProgress(null), boss, outcome(4, 50), world).summary.passed).toBe(true);
  });

  it('unlocks the next world at 80% completion', () => {
    let p = migrateProgress(null);
    p = { ...p, missions: { m2: mp('m2'), m3: mp('m3'), m4: mp('m4') } };
    const { progress, summary } = applyMissionResult(p, mission, outcome(5, 100), world);
    expect(summary.unlockedWorld).toBe('intermediate');
    expect(progress.unlockedWorlds).toEqual(['beginner', 'intermediate']);
    // Already unlocked: not reported again.
    expect(applyMissionResult(progress, mission, outcome(5, 100), world).summary.unlockedWorld).toBeNull();
  });
});

describe('clearing every mission', () => {
  it('collects all 118 elements, all 60 molecules and every badge, unlocking each world on the way', () => {
    let p = migrateProgress(null);
    const unlockedAfter: string[][] = [];
    for (const m of MISSIONS) {
      const ids = missionsByWorld(m.world).map((x) => x.id);
      p = applyMissionResult(p, m, { correct: m.quiz.length, total: m.quiz.length, points: 50, stars: 3, missedQuestionIds: [], now: 1 }, ids).progress;
      unlockedAfter.push([...p.unlockedWorlds]);
    }
    expect(p.collection.elements).toHaveLength(118);
    expect(p.collection.molecules).toHaveLength(60);
    expect(p.collection.badges).toHaveLength(MISSIONS.flatMap((m) => m.rewards.filter((r) => r.type === 'badge')).length);
    expect(p.unlockedWorlds).toEqual(['beginner', 'intermediate', 'advanced', 'expert']);
    expect(unlockedAfter.at(-1)).toEqual(['beginner', 'intermediate', 'advanced', 'expert']);
  });
});
