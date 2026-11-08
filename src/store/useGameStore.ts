import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Progress, MissionProgress, Mission } from '../types';
import {
  migrateProgress,
  recordMission,
  addCurrency,
  collectElement,
  collectMolecule,
  awardBadge,
  unlockWorld,
  applyMissionResult,
  PROGRESS_VERSION,
  type MissionOutcome,
  type MissionResultSummary,
} from '../game/engine/progress';
import { applyDailyCompletion, localDateKey } from '../game/engine/daily';

interface GameStore {
  progress: Progress;
  setProgress: (p: Progress) => void;
  update: (fn: (p: Progress) => Progress) => void;
  recordMission: (mp: MissionProgress) => void;
  /**
   * Apply a finished mission attempt (scores, one-time rewards, world unlock). `isDailyChallenge` must be decided
   * by the caller before the attempt (clearing a mission can unlock a world, which changes the daily pick).
   */
  completeMission: (mission: Mission, outcome: MissionOutcome, worldMissionIds: string[], isDailyChallenge?: boolean) => MissionResultSummary;
  addCurrency: (n: number) => void;
  collectElement: (s: string) => void;
  collectMolecule: (id: string) => void;
  awardBadge: (b: string) => void;
  unlockWorld: (w: Progress['unlockedWorlds'][number]) => void;
  setTheme: (t: Progress['theme']) => void;
  setAgeMode: (m: Progress['ageMode']) => void;
  setSettings: (s: Partial<Progress['settings']>) => void;
  reset: () => void;
  exportJson: () => string;
  /** Returns false (and leaves progress untouched) when the text is not a JSON save object. */
  importJson: (json: string) => boolean;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      progress: migrateProgress(null),
      setProgress: (p) => set({ progress: migrateProgress(p) }),
      update: (fn) => set({ progress: fn(get().progress) }),
      recordMission: (mp) => set({ progress: recordMission(get().progress, mp) }),
      completeMission: (mission, outcome, worldMissionIds, isDailyChallenge = false) => {
        const today = localDateKey(new Date(outcome.now));
        const { progress, summary } = applyMissionResult(get().progress, mission, outcome, worldMissionIds);
        const daily = isDailyChallenge && summary.passed ? applyDailyCompletion(progress, today) : null;
        set({ progress: daily ? daily.progress : progress });
        return { ...summary, daily: daily ? { bonus: daily.bonus, streak: daily.streak } : null };
      },
      addCurrency: (n) => set({ progress: addCurrency(get().progress, n) }),
      collectElement: (s) => set({ progress: collectElement(get().progress, s) }),
      collectMolecule: (id) => set({ progress: collectMolecule(get().progress, id) }),
      awardBadge: (b) => set({ progress: awardBadge(get().progress, b) }),
      unlockWorld: (w) => set({ progress: unlockWorld(get().progress, w) }),
      setTheme: (t) => set({ progress: { ...get().progress, theme: t } }),
      // Kid mode also switches on the friendly tone (one setting for players; kidTone stays in the save format).
      setAgeMode: (m) => set({ progress: { ...get().progress, ageMode: m, settings: { ...get().progress.settings, kidTone: m === 'kid' } } }),
      setSettings: (s) => set({ progress: { ...get().progress, settings: { ...get().progress.settings, ...s } } }),
      reset: () => set({ progress: migrateProgress(null) }),
      exportJson: () => JSON.stringify(get().progress, null, 2),
      importJson: (json) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(json);
        } catch {
          return false;
        }
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false;
        set({ progress: migrateProgress(parsed) });
        return true;
      },
    }),
    {
      name: 'chemistry-companion-progress',
      version: PROGRESS_VERSION,
      // Only the progress object is persisted (actions are recreated on load).
      partialize: (state) => ({ progress: state.progress }),
      // Version bumps: keep the persisted shape; `merge` below does the actual upgrade.
      migrate: (persisted) => persisted as { progress: Progress },
      // Always sanitise on rehydration so malformed or old saves can never crash the app.
      merge: (persisted, current) => ({
        ...current,
        progress: migrateProgress((persisted as { progress?: unknown } | undefined)?.progress),
      }),
    },
  ),
);
