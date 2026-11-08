import { describe, it, expect } from 'vitest';
import {
  parseFormula, countAtoms, formulaToString, countsEqual,
  isBalanced, massToMoles, phFromH, classifyPh, gibbsFreeEnergy,
  cellPotential, remainingAmount, findCoefficients,
} from '../src/game/engine/chemistry';

describe('chemistry engine', () => {
  it('parses simple formula', () => {
    expect(parseFormula('H2O')).toEqual({ H: 2, O: 1 });
  });
  it('parses parentheses', () => {
    expect(parseFormula('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 });
  });
  it('counts atoms', () => {
    expect(countAtoms('H2SO4')).toBe(7);
  });
  it('formulaToString hill', () => {
    expect(formulaToString({ C: 1, H: 4 })).toBe('CH4');
  });
  it('countsEqual', () => {
    expect(countsEqual({ H: 2, O: 1 }, { O: 1, H: 2 })).toBe(true);
  });
  it('balanced equation', () => {
    const react = { species: [{ formula: 'H2', coeff: 2 }, { formula: 'O2', coeff: 1 }] };
    const prod = { species: [{ formula: 'H2O', coeff: 2 }] };
    expect(isBalanced(react, prod)).toBe(true);
  });
  it('unbalanced', () => {
    const react = { species: [{ formula: 'H2', coeff: 1 }, { formula: 'O2', coeff: 1 }] };
    const prod = { species: [{ formula: 'H2O', coeff: 1 }] };
    expect(isBalanced(react, prod)).toBe(false);
  });
  it('massToMoles', () => {
    expect(massToMoles(18, 18)).toBe(1);
  });
  it('ph', () => {
    expect(phFromH(1e-7)).toBeCloseTo(7, 5);
    expect(classifyPh(2)).toBe('acidic');
    expect(classifyPh(9)).toBe('basic');
  });
  it('gibbs', () => {
    expect(gibbsFreeEnergy(-100000, 200, 300)).toBe(-160000);
  });
  it('cell potential', () => {
    expect(cellPotential(0.34, -0.76)).toBeCloseTo(1.1, 5);
  });
  it('half-life remaining', () => {
    expect(remainingAmount(100, 1, 1)).toBe(50);
  });
  it('findCoefficients', () => {
    const r = findCoefficients(['H2', 'O2'], ['H2O']);
    expect(r).not.toBeNull();
    expect(r!.r).toEqual([2, 1]);
    expect(r!.p).toEqual([2]);
  });
});
import { parseEquationString } from '../src/game/engine/chemistry';

describe('parseEquationString', () => {
  it('parses coefficients and arrows', () => {
    expect(parseEquationString('2H2 + O2 → 2H2O')).toEqual({
      reactants: { species: [{ formula: 'H2', coeff: 2 }, { formula: 'O2', coeff: 1 }] },
      products: { species: [{ formula: 'H2O', coeff: 2 }] },
    });
    expect(parseEquationString('N2 + 3H2 ⇌ 2NH3')?.products.species[0]).toEqual({ formula: 'NH3', coeff: 2 });
    expect(parseEquationString('CaCO3 -> CaO + CO2')?.products.species).toHaveLength(2);
    expect(parseEquationString('no arrow here')).toBeNull();
  });
});

import { termCounts, hendersonHasselbalch, bufferRatioForPh, bufferPhAfterAddition } from '../src/game/engine/chemistry';

describe('termCounts', () => {
  it('applies coefficients and brackets', () => {
    expect(termCounts('3H2O')).toEqual({ H: 6, O: 3 });
    expect(termCounts('Al2(SO4)3')).toEqual({ Al: 2, S: 3, O: 12 });
    expect(termCounts('2NH3')).toEqual({ N: 2, H: 6 });
    expect(termCounts('(NH4)2SO4')).toEqual({ N: 2, H: 8, S: 1, O: 4 });
  });
});

describe('buffers', () => {
  it('Henderson–Hasselbalch', () => {
    expect(hendersonHasselbalch(4.76, 0.1, 0.1)).toBeCloseTo(4.76, 6);
    expect(hendersonHasselbalch(4.76, 1, 0.1)).toBeCloseTo(5.76, 6);
    expect(hendersonHasselbalch(4.76, 0, 0.1)).toBeNaN();
    expect(bufferRatioForPh(4.76, 5.76)).toBeCloseTo(10, 6);
  });
  it('resists added acid', () => {
    expect(bufferPhAfterAddition(4.76, 0.5, 0.5, 0.01)).toBeCloseTo(4.7426, 3);
    expect(bufferPhAfterAddition(4.76, 0.5, 0.5, 0.6)).toBeNaN();
  });
});
