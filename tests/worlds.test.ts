import { describe, it, expect } from 'vitest';
import { missionAvailability, worldSummary, MINIBOSS_CORE_REQUIRED } from '../src/game/engine/worlds';
import { migrateProgress } from '../src/game/engine/progress';
import { MISSIONS, missionsByWorld } from '../src/data/missions';
import type { Mission, MissionProgress, Progress } from '../src/types';

const base = { world: 'beginner' as const, zone: 'Z', concept: 'C', intro: [], steps: [], rewards: [], quiz: [] };
const core = (i: number): Mission => ({ ...base, id: `c${i}`, title: `Core ${i}`, kind: 'core' });
const world: Mission[] = [core(1), core(2), core(3), core(4), core(5), core(6),
  { ...base, id: 'mini', title: 'Mini Boss', kind: 'miniboss', bossRules: { timeLimitSec: 60 } },
  { ...base, id: 'boss', title: 'Big Boss', kind: 'boss', bossRules: { lives: 3 } },
  { ...base, id: 'clinic', title: 'Clinic', kind: 'remediation', remediates: ['c1'] }];
const done = (id: string): MissionProgress => ({ missionId: id, completed: true, stars: 3, bestScore: 1, attempts: 1, lastPlayed: 0, missedQuestionIds: [], rewardsClaimed: true });
const withDone = (ids: string[], p: Progress = migrateProgress(null)): Progress => ({ ...p, missions: Object.fromEntries(ids.map((id) => [id, done(id)])) });
const get = (id: string) => world.find((m) => m.id === id)!;

describe('missionAvailability', () => {
  it('core and remediation missions are always open', () => {
    const p = migrateProgress(null);
    expect(missionAvailability(p, get('c1'), world).locked).toBe(false);
    expect(missionAvailability(p, get('clinic'), world).locked).toBe(false);
  });
  it('mini-boss needs core clears', () => {
    const a = missionAvailability(withDone(['c1']), get('mini'), world);
    expect(a).toEqual({ locked: true, reason: 'Clear 2 more core missions to challenge this mini-boss.' });
    expect(missionAvailability(withDone(['c1', 'c2']), get('mini'), world).reason).toMatch(/1 more core mission to/);
    expect(missionAvailability(withDone(['c1', 'c2', 'c3'].slice(0, MINIBOSS_CORE_REQUIRED)), get('mini'), world).locked).toBe(false);
  });
  it('final boss needs the mini-boss', () => {
    expect(missionAvailability(withDone(['c1', 'c2', 'c3', 'c4', 'c5', 'c6']), get('boss'), world)).toEqual({ locked: true, reason: 'Defeat Mini Boss first.' });
    expect(missionAvailability(withDone(['mini']), get('boss'), world).locked).toBe(false);
  });
  it('without a mini-boss the final boss needs five core clears', () => {
    const noMini = world.filter((m) => m.kind !== 'miniboss');
    expect(missionAvailability(withDone(['c1', 'c2', 'c3', 'c4']), get('boss'), noMini).reason).toMatch(/1 more core mission to face the boss/);
    expect(missionAvailability(withDone(['c1', 'c2', 'c3', 'c4', 'c5']), get('boss'), noMini).locked).toBe(false);
  });
  it('everything is locked in a locked world', () => {
    const adv = missionsByWorld('advanced');
    expect(missionAvailability(migrateProgress(null), adv[0]!, adv)).toEqual({ locked: true, reason: 'Unlock the Advanced world first.' });
  });
  it('real data: every world boss starts locked and its core missions open', () => {
    const p = { ...migrateProgress(null), unlockedWorlds: ['beginner', 'intermediate', 'advanced', 'expert'] as Progress['unlockedWorlds'] };
    for (const m of MISSIONS) {
      expect(missionAvailability(p, m, missionsByWorld(m.world)).locked, m.id).toBe(m.kind === 'boss' || m.kind === 'miniboss');
    }
  });
});

describe('worldSummary', () => {
  it('reports completion and the unlock target', () => {
    const s = worldSummary(withDone(['c1', 'c2']), 'beginner', world);
    expect(s).toMatchObject({ completed: 2, total: 9, percent: 22, neededForUnlock: 8, next: 'intermediate', nextUnlocked: false });
    expect(worldSummary(migrateProgress(null), 'expert', world).next).toBeNull();
  });
});
