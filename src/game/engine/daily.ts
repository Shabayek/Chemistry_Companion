// Daily Challenge: one core mission per calendar day, with a bonus and a day streak.
import type { Mission, Progress } from '../../types';

export const DAILY_BONUS_BASE = 30;
export const DAILY_BONUS_PER_STREAK_DAY = 10;
export const DAILY_BONUS_MAX = 100;

/** Local calendar date as "YYYY-MM-DD". */
export function localDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** The calendar day before a "YYYY-MM-DD" key. */
export function previousDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return localDateKey(new Date(y, m - 1, d - 1));
}

/** FNV-1a hash: stable across browsers and sessions. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Today's challenge: a core mission from an unlocked world, chosen deterministically from the date. */
export function dailyMissionId(dateKey: string, progress: Progress, missions: readonly Mission[]): string | null {
  const candidates = missions.filter((m) => m.kind === 'core' && progress.unlockedWorlds.includes(m.world));
  if (candidates.length === 0) return null;
  return candidates[hash(`daily:${dateKey}`) % candidates.length]!.id;
}

/** Bonus Atoms for completing the daily challenge on the given streak day (1 = first day). */
export function dailyBonus(streak: number): number {
  return Math.min(DAILY_BONUS_MAX, DAILY_BONUS_BASE + DAILY_BONUS_PER_STREAK_DAY * Math.max(0, streak - 1));
}

/** The streak as it stands today: it survives until the end of the day after the last completion. */
export function currentStreak(progress: Progress, today: string): number {
  const last = progress.dailyChallengeDate;
  if (!last) return 0;
  return last === today || last === previousDateKey(today) ? progress.streakDays : 0;
}

export interface DailyStatus {
  missionId: string | null;
  done: boolean;
  streak: number;
  /** Bonus that completing today's challenge would pay (or paid). */
  bonus: number;
}

export function dailyStatus(progress: Progress, today: string, missions: readonly Mission[]): DailyStatus {
  const done = progress.dailyChallengeDate === today;
  const streak = currentStreak(progress, today);
  return { missionId: dailyMissionId(today, progress, missions), done, streak, bonus: dailyBonus(done ? streak : streak + 1) };
}

/**
 * Record a cleared daily challenge. Pays the bonus once per day and extends the streak when yesterday's
 * challenge was also completed (otherwise the streak restarts at 1).
 */
export function applyDailyCompletion(progress: Progress, today: string): { progress: Progress; bonus: number; streak: number } | null {
  if (progress.dailyChallengeDate === today) return null;
  const streak = progress.dailyChallengeDate === previousDateKey(today) ? progress.streakDays + 1 : 1;
  const bonus = dailyBonus(streak);
  return {
    progress: { ...progress, currency: progress.currency + bonus, dailyChallengeDate: today, dailyChallengeDone: true, streakDays: streak },
    bonus,
    streak,
  };
}
