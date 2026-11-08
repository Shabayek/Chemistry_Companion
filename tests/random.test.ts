import { describe, it, expect } from 'vitest';
import { seededRandom, shuffle, sample } from '../src/game/engine/random';

describe('random helpers', () => {
  it('seeded generator is deterministic and in [0, 1)', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    const xs = Array.from({ length: 100 }, () => a());
    expect(xs).toEqual(Array.from({ length: 100 }, () => b()));
    for (const x of xs) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); }
  });
  it('shuffle is a permutation and does not mutate input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input, seededRandom(1));
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(out).not.toEqual(input);
  });
  it('sample returns distinct items, capped at the pool size', () => {
    expect(new Set(sample([1, 2, 3, 4, 5], 3, seededRandom(7))).size).toBe(3);
    expect(sample([1, 2], 5)).toHaveLength(2);
    expect(sample([1, 2], -1)).toEqual([]);
  });
});
