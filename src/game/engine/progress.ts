import type { Difficulty, Progress, MissionProgress, Mission, Reward } from '../../types';
import { LEGACY_MOLECULE_IDS } from '../../data/molecules';

/**
 * v1: original format (molecules keyed by formula, no missed-question tracking, rewards re-granted on replay).
 * v2: molecules keyed by stable id, MissionProgress gains `missedQuestionIds` + `rewardsClaimed`.
 */
export const PROGRESS_VERSION = 2;

const WORLDS: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export const DEFAULT_PROGRESS: Progress = {
  version: PROGRESS_VERSION,
  playerName: 'Explorer',
  ageMode: 'standard',
  theme: 'dark',
  locale: 'en',
  unlockedWorlds: ['beginner'],
  missions: {},
  collection: { elements: [], molecules: [], badges: [], avatarItems: [] },
  currency: 0,
  settings: { audio: true, textSize: 'md', reducedMotion: false, kidTone: false },
  streakDays: 0,
};

function structuredCloneProgress(p: Progress): Progress {
  return JSON.parse(JSON.stringify(p)) as Progress;
}

// ---------------------------------------------------------------------------
// Migration / sanitisation
// ---------------------------------------------------------------------------

// Small, dependency-free guards: each returns a valid value or the supplied fallback.
function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}
function uniqueStrings(x: unknown): string[] {
  return Array.isArray(x) ? Array.from(new Set(x.filter((v): v is string => typeof v === 'string'))) : [];
}
function oneOf<T extends string>(x: unknown, allowed: readonly T[], fallback: T): T {
  return typeof x === 'string' && (allowed as readonly string[]).includes(x) ? (x as T) : fallback;
}
function bool(x: unknown, fallback: boolean): boolean {
  return typeof x === 'boolean' ? x : fallback;
}
function nonNegNumber(x: unknown, fallback = 0): number {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : fallback;
}
function nonNegInt(x: unknown, fallback = 0): number {
  return Number.isInteger(x) && (x as number) >= 0 ? (x as number) : fallback;
}
function stars(x: unknown): 0 | 1 | 2 | 3 {
  return x === 1 || x === 2 || x === 3 ? x : 0;
}

/**
 * Convert any persisted/imported value into a valid, current-version Progress.
 * Unknown or malformed fields fall back to defaults; nothing throws.
 */
export function migrateProgress(raw: unknown): Progress {
  if (!isPlainObject(raw)) return structuredCloneProgress(DEFAULT_PROGRESS);
  const version = typeof raw.version === 'number' ? raw.version : 0;
  const d = DEFAULT_PROGRESS;

  const name = typeof raw.playerName === 'string' ? raw.playerName.trim() : '';
  const playerName = name.length > 0 && name.length <= 40 ? name : d.playerName;
  const ageMode = oneOf(raw.ageMode, ['kid', 'standard'] as const, d.ageMode);
  const theme = oneOf(raw.theme, ['light', 'dark', 'high-contrast'] as const, d.theme);
  const currency = nonNegNumber(raw.currency);
  const streakDays = nonNegInt(raw.streakDays);
  const rs = isPlainObject(raw.settings) ? raw.settings : {};
  const settings: Progress['settings'] = {
    audio: bool(rs.audio, d.settings.audio),
    textSize: oneOf(rs.textSize, ['sm', 'md', 'lg'] as const, d.settings.textSize),
    reducedMotion: bool(rs.reducedMotion, d.settings.reducedMotion),
    kidTone: bool(rs.kidTone, d.settings.kidTone),
  };

  const worlds = uniqueStrings(raw.unlockedWorlds).filter((w): w is Difficulty => (WORLDS as string[]).includes(w));
  const unlockedWorlds: Difficulty[] = worlds.includes('beginner') ? worlds : ['beginner', ...worlds];

  const rawCollection = isPlainObject(raw.collection) ? raw.collection : {};
  const collection: Progress['collection'] = {
    elements: uniqueStrings(rawCollection.elements),
    molecules: Array.from(new Set(uniqueStrings(rawCollection.molecules).map((m) => LEGACY_MOLECULE_IDS[m] ?? m))),
    badges: uniqueStrings(rawCollection.badges),
    avatarItems: uniqueStrings(rawCollection.avatarItems),
  };

  const missions: Record<string, MissionProgress> = {};
  if (isPlainObject(raw.missions)) {
    for (const [key, m] of Object.entries(raw.missions)) {
      if (!isPlainObject(m)) continue;
      const completed = bool(m.completed, false);
      missions[key] = {
        missionId: key,
        completed,
        // Stars are only meaningful for cleared missions (v1 forced a minimum of 1 even on failure).
        stars: completed ? stars(m.stars) : 0,
        bestScore: nonNegNumber(m.bestScore),
        attempts: nonNegInt(m.attempts),
        lastPlayed: typeof m.lastPlayed === 'number' && Number.isFinite(m.lastPlayed) ? m.lastPlayed : 0,
        missedQuestionIds: uniqueStrings(m.missedQuestionIds),
        // v1 granted rewards on every finish, so any legacy record has already been paid out.
        rewardsClaimed: typeof m.rewardsClaimed === 'boolean' ? m.rewardsClaimed : version < 2 ? true : completed,
      };
    }
  }

  const result: Progress = {
    version: PROGRESS_VERSION,
    playerName,
    ageMode,
    theme,
    locale: 'en',
    unlockedWorlds,
    missions,
    collection,
    currency,
    settings,
    streakDays,
  };
  if (typeof raw.dailyChallengeDate === 'string') result.dailyChallengeDate = raw.dailyChallengeDate;
  if (typeof raw.dailyChallengeDone === 'boolean') result.dailyChallengeDone = raw.dailyChallengeDone;
  return result;
}

// ---------------------------------------------------------------------------
// World helpers
// ---------------------------------------------------------------------------

export function unlockWorld(progress: Progress, world: Difficulty): Progress {
  if (progress.unlockedWorlds.includes(world)) return progress;
  return { ...progress, unlockedWorlds: [...progress.unlockedWorlds, world] };
}

export function worldOrder(): Difficulty[] {
  return [...WORLDS];
}

export function nextWorld(w: Difficulty): Difficulty | null {
  const order = worldOrder();
  const idx = order.indexOf(w);
  if (idx < 0 || idx === order.length - 1) return null;
  return order[idx + 1]!;
}

export function computeWorldCompletion(progress: Progress, missionIds: string[]): number {
  if (missionIds.length === 0) return 0;
  const done = missionIds.filter((id) => progress.missions[id]?.completed).length;
  return Math.round((done / missionIds.length) * 100);
}

/** Threshold for unlocking the next world (percentage of the world's missions completed). */
export const UNLOCK_THRESHOLD_PERCENT = 80;

export function shouldUnlockNext(progress: Progress, _world: Difficulty, missionIds: string[]): boolean {
  return computeWorldCompletion(progress, missionIds) >= UNLOCK_THRESHOLD_PERCENT;
}

// ---------------------------------------------------------------------------
// Collection / currency primitives
// ---------------------------------------------------------------------------

export function recordMission(progress: Progress, mp: MissionProgress): Progress {
  return {
    ...progress,
    missions: { ...progress.missions, [mp.missionId]: mp },
  };
}

export function addCurrency(progress: Progress, amount: number): Progress {
  return { ...progress, currency: Math.max(0, progress.currency + amount) };
}

export function collectElement(progress: Progress, symbol: string): Progress {
  if (progress.collection.elements.includes(symbol)) return progress;
  return { ...progress, collection: { ...progress.collection, elements: [...progress.collection.elements, symbol] } };
}

export function collectMolecule(progress: Progress, id: string): Progress {
  const key = LEGACY_MOLECULE_IDS[id] ?? id;
  if (progress.collection.molecules.includes(key)) return progress;
  return { ...progress, collection: { ...progress.collection, molecules: [...progress.collection.molecules, key] } };
}

export function awardBadge(progress: Progress, badge: string): Progress {
  if (progress.collection.badges.includes(badge)) return progress;
  return { ...progress, collection: { ...progress.collection, badges: [...progress.collection.badges, badge] } };
}

export function collectAvatarItem(progress: Progress, item: string): Progress {
  if (progress.collection.avatarItems.includes(item)) return progress;
  return { ...progress, collection: { ...progress.collection, avatarItems: [...progress.collection.avatarItems, item] } };
}

// ---------------------------------------------------------------------------
// Mission results
// ---------------------------------------------------------------------------

export const DEFAULT_PASS_THRESHOLD = 0.6;

export interface MissionOutcome {
  correct: number;
  total: number;
  /** Performance points for this attempt (from the scoring engine). */
  points: number;
  /** Stars from the scoring engine for this attempt. */
  stars: 0 | 1 | 2 | 3;
  missedQuestionIds: string[];
  /** Questions answered correctly this attempt (remediation uses these to clear missed questions). */
  correctQuestionIds?: string[];
  /** How the quiz ended. Running out of boss lives fails the attempt regardless of score. */
  endReason?: 'completed' | 'out-of-lives' | 'time-up';
  now: number;
}

export interface MissionResultSummary {
  passed: boolean;
  /** This attempt cleared the mission for the first time, so one-time rewards were granted. */
  firstClear: boolean;
  /** Rewards were already claimed on an earlier clear. */
  rewardsAlreadyClaimed: boolean;
  newBest: boolean;
  /** Stars recorded for this attempt (0 when not passed). */
  attemptStars: 0 | 1 | 2 | 3;
  /** Atoms from beating the previous best score (first attempt: the full score). */
  performanceAtoms: number;
  /** Fixed currency from mission rewards (first clear only). */
  rewardAtoms: number;
  totalAtoms: number;
  /** Non-currency rewards granted by this attempt. */
  items: Reward[];
  unlockedWorld: Difficulty | null;
  /** Set when this attempt completed today's Daily Challenge (bonus already included in progress). */
  daily?: { bonus: number; streak: number } | null;
}

export function passThreshold(mission: Mission): number {
  return mission.bossRules?.passThreshold ?? DEFAULT_PASS_THRESHOLD;
}

export function isPassing(mission: Mission, correct: number, total: number): boolean {
  if (total <= 0) return false;
  return correct >= Math.ceil(total * passThreshold(mission));
}

/**
 * Apply one finished attempt to the player's progress.
 *
 * Replay rules:
 * - `completed` is sticky, `stars` and `bestScore` keep the maximum, `attempts` increments.
 * - One-time rewards (items + fixed currency) are granted only on the first clear.
 * - Performance atoms are paid only for improving on the previous best score, so replays can't be farmed.
 * - The next world unlocks when the world's completion reaches the threshold.
 * - Running out of boss lives fails the attempt.
 * - Remediation clears the questions it fixed from the covered missions' missed lists.
 */
export function applyMissionResult(
  progress: Progress,
  mission: Mission,
  outcome: MissionOutcome,
  worldMissionIds: string[],
): { progress: Progress; summary: MissionResultSummary } {
  const prev = progress.missions[mission.id];
  const passed = outcome.endReason !== 'out-of-lives' && isPassing(mission, outcome.correct, outcome.total);
  const attemptStars: 0 | 1 | 2 | 3 = passed ? (Math.max(1, outcome.stars) as 1 | 2 | 3) : 0;
  const prevBest = prev?.bestScore ?? 0;
  const alreadyClaimed = prev?.rewardsClaimed ?? false;
  const firstClear = passed && !alreadyClaimed;

  const mp: MissionProgress = {
    missionId: mission.id,
    completed: (prev?.completed ?? false) || passed,
    stars: Math.max(prev?.stars ?? 0, attemptStars) as 0 | 1 | 2 | 3,
    bestScore: Math.max(prevBest, outcome.points),
    attempts: (prev?.attempts ?? 0) + 1,
    lastPlayed: outcome.now,
    missedQuestionIds: [...outcome.missedQuestionIds],
    rewardsClaimed: alreadyClaimed || passed,
  };

  let next = recordMission(progress, mp);

  // Remediation: questions answered correctly here are no longer "missed" in the missions they came from.
  if (mission.kind === 'remediation' && outcome.correctQuestionIds?.length) {
    const fixed = new Set(outcome.correctQuestionIds);
    for (const target of mission.remediates ?? []) {
      const tp = next.missions[target];
      if (!tp || !tp.missedQuestionIds.some((q) => fixed.has(q))) continue;
      next = recordMission(next, { ...tp, missedQuestionIds: tp.missedQuestionIds.filter((q) => !fixed.has(q)) });
    }
  }

  const performanceAtoms = Math.max(0, Math.round(outcome.points - prevBest));
  let rewardAtoms = 0;
  const items: Reward[] = [];
  if (firstClear) {
    for (const r of mission.rewards) {
      switch (r.type) {
        case 'currency':
          rewardAtoms += r.amount ?? 0;
          break;
        case 'element':
          next = collectElement(next, r.id);
          items.push(r);
          break;
        case 'molecule':
          next = collectMolecule(next, r.id);
          items.push(r);
          break;
        case 'badge':
          next = awardBadge(next, r.id);
          items.push(r);
          break;
        case 'avatar':
          next = collectAvatarItem(next, r.id);
          items.push(r);
          break;
      }
    }
  }
  const totalAtoms = performanceAtoms + rewardAtoms;
  next = addCurrency(next, totalAtoms);

  let unlockedWorld: Difficulty | null = null;
  const nw = nextWorld(mission.world);
  if (nw && !next.unlockedWorlds.includes(nw) && shouldUnlockNext(next, mission.world, worldMissionIds)) {
    next = unlockWorld(next, nw);
    unlockedWorld = nw;
  }

  return {
    progress: next,
    summary: {
      passed,
      firstClear,
      rewardsAlreadyClaimed: passed && alreadyClaimed,
      newBest: outcome.points > prevBest,
      attemptStars,
      performanceAtoms,
      rewardAtoms,
      totalAtoms,
      items,
      unlockedWorld,
    },
  };
}
