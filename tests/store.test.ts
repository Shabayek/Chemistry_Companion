import { describe, it, expect, beforeEach, vi } from 'vitest';

const KEY = 'chemistry-companion-progress';

async function freshStore() {
  vi.resetModules();
  const mod = await import('../src/store/useGameStore');
  await mod.useGameStore.persist.rehydrate();
  return mod.useGameStore;
}

describe('game store persistence', () => {
  beforeEach(() => localStorage.clear());

  it('upgrades a v1 save found in localStorage', async () => {
    localStorage.setItem(KEY, JSON.stringify({
      state: {
        progress: {
          version: 1, playerName: 'Ada', unlockedWorlds: ['beginner'], currency: 40,
          missions: { 'beg-atom-builder': { missionId: 'beg-atom-builder', completed: true, stars: 2, bestScore: 50, attempts: 1, lastPlayed: 1 } },
          collection: { elements: ['H'], molecules: ['H2O'], badges: [], avatarItems: [] },
        },
      },
      version: 1,
    }));
    const store = await freshStore();
    const p = store.getState().progress;
    expect(p.version).toBe(2);
    expect(p.playerName).toBe('Ada');
    expect(p.currency).toBe(40);
    expect(p.collection.molecules).toEqual(['water']);
    expect(p.missions['beg-atom-builder']).toMatchObject({ rewardsClaimed: true, missedQuestionIds: [] });
    // Actions survive rehydration.
    store.getState().addCurrency(5);
    expect(store.getState().progress.currency).toBe(45);
  });

  it('recovers from a corrupted save', async () => {
    localStorage.setItem(KEY, JSON.stringify({ state: { progress: 'garbage' }, version: 1 }));
    const store = await freshStore();
    expect(store.getState().progress.unlockedWorlds).toEqual(['beginner']);
  });

  it('persists only progress, at the current version', async () => {
    const store = await freshStore();
    store.getState().collectElement('He');
    const saved = JSON.parse(localStorage.getItem(KEY)!);
    expect(saved.version).toBe(2);
    expect(Object.keys(saved.state)).toEqual(['progress']);
    expect(saved.state.progress.collection.elements).toEqual(['He']);
  });
});

describe('import / export', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips an export', async () => {
    const store = await freshStore();
    store.getState().collectMolecule('water');
    const json = store.getState().exportJson();
    store.getState().reset();
    expect(store.getState().importJson(json)).toBe(true);
    expect(store.getState().progress.collection.molecules).toEqual(['water']);
  });

  it.each(['not json', '42', '"text"', '[]', 'null'])('rejects %s without touching progress', async (text) => {
    const store = await freshStore();
    store.getState().addCurrency(7);
    expect(store.getState().importJson(text)).toBe(false);
    expect(store.getState().progress.currency).toBe(7);
  });

  it('reset returns fresh defaults', async () => {
    const store = await freshStore();
    store.getState().collectElement('H');
    store.getState().reset();
    expect(store.getState().progress.collection.elements).toEqual([]);
  });
});
