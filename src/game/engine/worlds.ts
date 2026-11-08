// Per-world rules: which missions are available, and progress toward unlocking the next world.
import type { Difficulty, Mission, Progress } from '../../types';
import { computeWorldCompletion, nextWorld, UNLOCK_THRESHOLD_PERCENT } from './progress';

/** Core missions a player must clear before the world's mini-boss opens. */
export const MINIBOSS_CORE_REQUIRED = 3;
/** Core missions required for the final boss in a world that has no mini-boss. */
export const BOSS_CORE_REQUIRED_WITHOUT_MINIBOSS = 5;

export interface Availability {
  locked: boolean;
  /** Human-readable requirement when locked. */
  reason: string | null;
}

const OPEN: Availability = { locked: false, reason: null };

function plural(n: number, word: string): string {
  return `${n} more ${word}${n === 1 ? '' : 's'}`;
}

export function worldLabel(w: Difficulty): string {
  return w.charAt(0).toUpperCase() + w.slice(1);
}

/**
 * Lock rules:
 * - the world itself must be unlocked;
 * - core and remediation missions are always open;
 * - a mini-boss opens after MINIBOSS_CORE_REQUIRED core clears;
 * - the final boss opens after every mini-boss in the world is cleared
 *   (or after BOSS_CORE_REQUIRED_WITHOUT_MINIBOSS core clears if the world has none).
 */
export function missionAvailability(progress: Progress, mission: Mission, worldMissions: readonly Mission[]): Availability {
  if (!progress.unlockedWorlds.includes(mission.world)) {
    return { locked: true, reason: `Unlock the ${worldLabel(mission.world)} world first.` };
  }
  const done = (m: Mission) => progress.missions[m.id]?.completed === true;
  const coreDone = worldMissions.filter((m) => m.kind === 'core' && done(m)).length;
  switch (mission.kind) {
    case 'core':
    case 'remediation':
      return OPEN;
    case 'miniboss': {
      const need = MINIBOSS_CORE_REQUIRED - coreDone;
      return need > 0 ? { locked: true, reason: `Clear ${plural(need, 'core mission')} to challenge this mini-boss.` } : OPEN;
    }
    case 'boss': {
      const minis = worldMissions.filter((m) => m.kind === 'miniboss');
      if (minis.length > 0) {
        const pending = minis.filter((m) => !done(m));
        return pending.length > 0 ? { locked: true, reason: `Defeat ${pending.map((m) => m.title).join(' and ')} first.` } : OPEN;
      }
      const need = BOSS_CORE_REQUIRED_WITHOUT_MINIBOSS - coreDone;
      return need > 0 ? { locked: true, reason: `Clear ${plural(need, 'core mission')} to face the boss.` } : OPEN;
    }
  }
}

export interface WorldSummary {
  completed: number;
  total: number;
  percent: number;
  /** Missions needed in total to reach the unlock threshold. */
  neededForUnlock: number;
  next: Difficulty | null;
  nextUnlocked: boolean;
}

export function worldSummary(progress: Progress, world: Difficulty, worldMissions: readonly Mission[]): WorldSummary {
  const ids = worldMissions.map((m) => m.id);
  const completed = ids.filter((id) => progress.missions[id]?.completed).length;
  const next = nextWorld(world);
  return {
    completed,
    total: ids.length,
    percent: computeWorldCompletion(progress, ids),
    neededForUnlock: Math.ceil((ids.length * UNLOCK_THRESHOLD_PERCENT) / 100),
    next,
    nextUnlocked: next !== null && progress.unlockedWorlds.includes(next),
  };
}
