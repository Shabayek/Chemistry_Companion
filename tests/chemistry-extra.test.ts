import { describe, it, expect } from 'vitest';
import {
  molesToMass, molesToParticles, hFromPh, boyle, charles, idealGasPressure, equilibriumK, deltaGkJ, spontaneity,
  rateLaw, arrhenius, gibbsFromPotential, halfLifeFromDecay, remainingAmount, findCoefficients, countAtoms, formulaToString,
} from '../src/game/engine/chemistry';

describe('chemistry helpers', () => {
  it('moles, particles and [H+]', () => {
    expect(molesToMass(2, 18)).toBe(36);
    expect(molesToParticles(1)).toBeCloseTo(6.02214076e23);
    expect(hFromPh(3)).toBeCloseTo(1e-3);
    expect(countAtoms('C6H12O6')).toBe(24);
    expect(formulaToString({ C: 2, H: 6, O: 1 })).toBe('C2H6O');
  });
  it('gas laws (including guards against division by zero)', () => {
    expect(boyle(1, 6, 2)).toBe(3);
    expect(boyle(1, 6, 0)).toBe(0);
    expect(charles(2, 300, 450)).toBeCloseTo(3);
    expect(charles(2, 0, 450)).toBe(0);
    expect(idealGasPressure(1, 22.4, 273, 0.082057)).toBeCloseTo(1.0, 2);
    expect(idealGasPressure(1, 0, 273)).toBe(0);
  });
  it('equilibrium constant', () => {
    // N2 + 3H2 ⇌ 2NH3 with [N2]=1, [H2]=2, [NH3]=4 -> K = 16 / (1 × 8) = 2
    expect(equilibriumK([{ conc: 4, coeff: 2 }], [{ conc: 1, coeff: 1 }, { conc: 2, coeff: 3 }])).toBe(2);
    expect(equilibriumK([{ conc: 1, coeff: 1 }], [{ conc: 0, coeff: 1 }])).toBe(Infinity);
  });
  it('free energy and spontaneity', () => {
    expect(deltaGkJ(-100, 200, 300)).toBeCloseTo(-160);
    expect(deltaGkJ(50, 100, 600)).toBeCloseTo(-10);
    expect(spontaneity(-1)).toBe('spontaneous');
    expect(spontaneity(1)).toBe('non-spontaneous');
    expect(spontaneity(0)).toBe('equilibrium');
    // ΔG = −nFE: Daniell cell, n = 2, E = 1.10 V -> about −212 kJ
    expect(gibbsFromPotential(2, 1.1) / 1000).toBeCloseTo(-212.3, 1);
  });
  it('kinetics', () => {
    expect(rateLaw(0.5, [2, 3], [1, 2])).toBe(9);
    // Ea = 50 kJ/mol: going from 300 K to 310 K roughly doubles k
    expect(arrhenius(1, 300, 310, 50000) / 1).toBeGreaterThan(1.8);
    expect(arrhenius(1, 300, 310, 50000)).toBeLessThan(2.1);
  });
  it('half-lives', () => {
    expect(remainingAmount(100, 5730, 11460)).toBeCloseTo(25);
    expect(remainingAmount(100, 0, 10)).toBe(100);
    expect(halfLifeFromDecay(100, 25, 10)).toBeCloseTo(5);
    expect(halfLifeFromDecay(100, 100, 10)).toBe(Infinity);
  });
  it('auto-balancing', () => {
    expect(findCoefficients(['CH4', 'O2'], ['CO2', 'H2O'])).toEqual({ r: [1, 2], p: [1, 2] });
    expect(findCoefficients(['Al', 'O2'], ['Al2O3'])).toEqual({ r: [4, 3], p: [2] });
    expect(findCoefficients(['H2O'], ['CO2'])).toBeNull();
  });
});
