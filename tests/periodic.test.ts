import { describe, it, expect } from 'vitest';
import { ELEMENTS, getElement, getElementByNumber } from '../src/data/elements';
import {
  tablePosition, neighbor, aufbauConfiguration, electronCount, parseElectronConfig, expandConfig, outerShellElectrons,
  formatMass, matchesQuery, trendFraction, GRID_COLUMNS, GRID_ROWS, LANTHANIDE_ROW, ACTINIDE_ROW,
} from '../src/game/engine/periodic';
import { isElementSymbol } from '../src/game/engine/chemistry';

const el = (s: string) => getElement(s)!;

describe('lookups', () => {
  it('by symbol and number', () => {
    expect(getElement('Og')?.atomicNumber).toBe(118);
    expect(getElementByNumber(26)?.symbol).toBe('Fe');
    expect(getElement('Xx')).toBeUndefined();
  });
  it('chemistry symbol list agrees with the element data', () => {
    for (const e of ELEMENTS) expect(isElementSymbol(e.symbol)).toBe(true);
  });
});

describe('tablePosition', () => {
  it('places main-table elements by period and group', () => {
    expect(tablePosition(el('H'))).toEqual({ row: 1, col: 1 });
    expect(tablePosition(el('He'))).toEqual({ row: 1, col: 18 });
    expect(tablePosition(el('Fe'))).toEqual({ row: 4, col: 8 });
    expect(tablePosition(el('Hf'))).toEqual({ row: 6, col: 4 });
    expect(tablePosition(el('Og'))).toEqual({ row: 7, col: 18 });
  });
  it('places the lanthanides and actinides in the f-block rows', () => {
    expect(tablePosition(el('La'))).toEqual({ row: LANTHANIDE_ROW, col: 3 });
    expect(tablePosition(el('Lu'))).toEqual({ row: LANTHANIDE_ROW, col: 17 });
    expect(tablePosition(el('Ac'))).toEqual({ row: ACTINIDE_ROW, col: 3 });
    expect(tablePosition(el('Lr'))).toEqual({ row: ACTINIDE_ROW, col: 17 });
  });
  it('gives every element a unique cell inside the grid', () => {
    const keys = ELEMENTS.map((e) => {
      const p = tablePosition(e);
      expect(p.col).toBeGreaterThanOrEqual(1);
      expect(p.col).toBeLessThanOrEqual(GRID_COLUMNS);
      expect(p.row).toBeGreaterThanOrEqual(1);
      expect(p.row).toBeLessThanOrEqual(GRID_ROWS);
      return `${p.row}:${p.col}`;
    });
    expect(new Set(keys).size).toBe(118);
  });
});

describe('keyboard neighbours', () => {
  const n = (s: string, d: 'up' | 'down' | 'left' | 'right') => neighbor(ELEMENTS, el(s), d)?.symbol;
  it('moves along rows, skipping gaps', () => {
    expect(n('H', 'right')).toBe('He');
    expect(n('He', 'left')).toBe('H');
    expect(n('Be', 'right')).toBe('B');
    expect(n('Fe', 'right')).toBe('Co');
    expect(n('H', 'left')).toBeUndefined();
  });
  it('moves between rows by column', () => {
    expect(n('He', 'down')).toBe('Ne');
    expect(n('Fe', 'down')).toBe('Ru');
    expect(n('Ru', 'up')).toBe('Fe');
    expect(n('Sc', 'up')).toBe('Mg');
    expect(n('Fr', 'down')).toBe('La');
    expect(n('La', 'down')).toBe('Ac');
    expect(n('Ce', 'up')).toBe('Rf');
    expect(n('Ac', 'down')).toBeUndefined();
  });
});

describe('electron configurations', () => {
  it('aufbau prediction', () => {
    expect(aufbauConfiguration(1)).toBe('1s1');
    expect(aufbauConfiguration(2)).toBe('1s2');
    expect(aufbauConfiguration(3)).toBe('[He] 2s1');
    expect(aufbauConfiguration(26)).toBe('[Ar] 3d6 4s2');
    expect(aufbauConfiguration(24)).toBe('[Ar] 3d4 4s2'); // real Cr is 3d5 4s1
    expect(aufbauConfiguration(82)).toBe('[Xe] 4f14 5d10 6s2 6p2');
    expect(aufbauConfiguration(118)).toBe('[Rn] 5f14 6d10 7s2 7p6');
    expect(() => aufbauConfiguration(0)).toThrow();
    expect(() => aufbauConfiguration(119)).toThrow();
  });
  it('parses and counts', () => {
    expect(parseElectronConfig('[Ar] 3d5 4s1')).toEqual({ core: 'Ar', subshells: [{ n: 3, l: 'd', electrons: 5 }, { n: 4, l: 's', electrons: 1 }] });
    expect(electronCount('[Kr] 4d10')).toBe(46);
    expect(() => parseElectronConfig('[Fe] 4s2')).toThrow();
    expect(() => parseElectronConfig('3x2')).toThrow();
  });
  it('expands cores and counts outer-shell electrons', () => {
    expect(expandConfig('[He] 2s2 2p4').map((s) => `${s.n}${s.l}${s.electrons}`)).toEqual(['1s2', '2s2', '2p4']);
    expect(outerShellElectrons(el('Cl').electronConfig)).toBe(7);
    expect(outerShellElectrons(el('Na').electronConfig)).toBe(1);
    expect(outerShellElectrons(el('Ne').electronConfig)).toBe(8);
  });
});

describe('display helpers', () => {
  it('formats masses, bracketing isotope mass numbers', () => {
    expect(formatMass(el('C'))).toBe('12.011');
    expect(formatMass(el('Tc'))).toBe('[98]');
    expect(formatMass(el('Og'))).toBe('[294]');
    expect(formatMass(el('U'))).toBe('238.03');
  });
  it('searches by symbol, number and name', () => {
    const hits = (q: string) => ELEMENTS.filter((e) => matchesQuery(e, q)).map((e) => e.symbol);
    expect(hits('fe')).toEqual(['Fe', 'Fm']); // symbol Fe + name "Fermium"
    expect(hits('Og')).toEqual(['Og']); // not hydrOGen / nitrOGen
    expect(hits('26')).toEqual(['Fe']);
    expect(hits('iron')).toEqual(['Fe']);
    expect(hits('  ')).toHaveLength(118);
    expect(hits('ox')).toEqual(['O']);
    expect(hits('gen')).toEqual([]);
  });
  it('normalises trend values', () => {
    expect(trendFraction(ELEMENTS, el('F'), 'electronegativity')).toBe(1);
    expect(trendFraction(ELEMENTS, el('He'), 'electronegativity')).toBeNull();
    expect(trendFraction(ELEMENTS, el('H'), 'mass')).toBe(0);
  });
});

import { configCounts, condenseCounts } from '../src/game/engine/periodic';

describe('config counts', () => {
  it('expands and condenses', () => {
    expect(configCounts('[Ne] 3s1')).toEqual({ '1s': 2, '2s': 2, '2p': 6, '3s': 1 });
    expect(condenseCounts(configCounts('[Ar] 3d5 4s1'))).toBe('[Ar] 3d5 4s1');
    expect(condenseCounts(configCounts('[Kr] 4d10'))).toBe('[Kr] 4d10');
    expect(condenseCounts({ '1s': 2, '2s': 1 })).toBe('[He] 2s1');
    expect(condenseCounts({ '1s': 1 })).toBe('1s1');
    expect(condenseCounts({ '1s': 2, '2s': 2, '2p': 6 })).toBe('[He] 2s2 2p6');
    expect(condenseCounts({})).toBe('');
  });
});
