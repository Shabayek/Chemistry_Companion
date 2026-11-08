import { describe, it, expect } from 'vitest';
import { getMolecule } from '../src/data/molecules';
import {
  molarMass, percentComposition, hillFormula, hillOrder, countsToHill, findMoleculesByCounts, getMoleculeByFormula,
  repeatUnit, isPolymerFormula, formatMolarMass,
} from '../src/game/engine/molecules';
import {
  findReaction, formatEquation, collectibleProducts, benchReagents, speciesName, benchItemLabel, reactionsProducing, isCondition,
} from '../src/game/engine/reactions';

const mol = (id: string) => getMolecule(id)!;

describe('molar mass and composition', () => {
  it('computes molar masses from formulas, counts and polymer repeat units', () => {
    expect(molarMass('H2O')).toBeCloseTo(18.015, 3);
    expect(molarMass('Ca(OH)2')).toBeCloseTo(74.092, 3);
    expect(molarMass({ C: 6, H: 12, O: 6 })).toBeCloseTo(180.156, 3);
    expect(molarMass('(C2H4)n')).toBeCloseTo(28.054, 3);
    expect(() => molarMass('Xy2')).toThrow(/Unknown element/);
    expect(formatMolarMass(18.0153)).toBe('18.02 g/mol');
  });
  it('gives mass percentages that sum to 100', () => {
    const water = percentComposition('H2O');
    expect(water.map((x) => x.symbol)).toEqual(['H', 'O']);
    expect(water[0]!.percent).toBeCloseTo(11.19, 2);
    const glucose = percentComposition(mol('glucose').formula);
    expect(glucose.map((x) => x.symbol)).toEqual(['C', 'H', 'O']);
    expect(glucose.reduce((a, x) => a + x.percent, 0)).toBeCloseTo(100, 6);
  });
});

describe('formulas', () => {
  it('Hill order and formulas', () => {
    expect(hillOrder({ O: 1, H: 6, C: 2 })).toEqual(['C', 'H', 'O']);
    expect(hillOrder({ Na: 1, Cl: 1 })).toEqual(['Cl', 'Na']);
    expect(hillFormula(mol('ethanol'))).toBe('C2H6O');
    expect(hillFormula(mol('acetic-acid'))).toBe('C2H4O2');
    expect(hillFormula(mol('pvc'))).toBe('(C2H3Cl)n');
    expect(countsToHill({})).toBe('');
  });
  it('polymer helpers', () => {
    expect(repeatUnit('(C2F4)n')).toBe('C2F4');
    expect(repeatUnit('H2O')).toBe('H2O');
    expect(isPolymerFormula('(C5H8)n')).toBe(true);
    expect(isPolymerFormula('Ca(OH)2')).toBe(false);
  });
  it('looks molecules up by display formula', () => {
    expect(getMoleculeByFormula('Cu(OH)2')?.id).toBe('copper-ii-hydroxide');
    expect(getMoleculeByFormula('C2H6O')).toBeUndefined(); // ethanol is written C2H5OH
  });
});

describe('matching built atoms to molecules', () => {
  const ids = (counts: Record<string, number>) => findMoleculesByCounts(counts).map((m) => `${m.molecule.id}${m.asRepeatUnit ? '*' : ''}`);
  it('recognises molecules regardless of how the formula is written', () => {
    expect(ids({ H: 2, O: 1 })).toEqual(['water']);
    expect(ids({ C: 2, H: 6, O: 1 })).toEqual(['ethanol']);
    expect(ids({ Cu: 1, O: 2, H: 2 })).toEqual(['copper-ii-hydroxide']);
    expect(ids({ C: 10, H: 16, N: 5, O: 13, P: 3 })).toEqual(['atp']);
  });
  it('reports polymer repeat units and isomers', () => {
    expect(ids({ C: 2, H: 4 })).toEqual(['ethene', 'polyethylene*']);
    expect(ids({ C: 6, H: 10, O: 5 })).toEqual(['starch*', 'cellulose*']);
  });
  it('ignores zero counts and returns nothing for empty or unknown builds', () => {
    expect(ids({ H: 2, O: 1, C: 0 })).toEqual(['water']);
    expect(ids({})).toEqual([]);
    expect(ids({ H: 3, O: 1 })).toEqual([]);
  });
});

describe('bench reactions', () => {
  it('finds reactions in any order, with conditions, ignoring blanks', () => {
    expect(findReaction(['NaOH', 'HCl'])?.id).toBe('hcl-naoh');
    expect(findReaction(['HCl', 'NaOH'])?.id).toBe('hcl-naoh');
    expect(findReaction(['H2O2', 'catalyst'])?.id).toBe('peroxide-catalyst');
    expect(findReaction(['heat', 'CaCO3'])?.id).toBe('limestone-heat');
    expect(findReaction(['CaCO3', ''])).toBeUndefined();
    expect(findReaction(['H2O', 'NaCl'])).toBeUndefined();
    expect(findReaction([])).toBeUndefined();
  });
  it('formats equations and lists collectible products', () => {
    const r = findReaction(['CuSO4', 'NaOH'])!;
    expect(formatEquation(r)).toBe('CuSO4 + 2NaOH → Cu(OH)2 + Na2SO4');
    expect(collectibleProducts(r).map((m) => m.id)).toEqual(['copper-ii-hydroxide']);
    expect(collectibleProducts(findReaction(['C6H12O6', 'yeast'])!).map((m) => m.id)).toEqual(['ethanol', 'carbon-dioxide']);
  });
  it('names bench items', () => {
    expect(benchReagents()).toContain('Zn');
    expect(benchReagents()).not.toContain('heat');
    expect(speciesName('Zn')).toBe('Zinc');
    expect(speciesName('NaOH')).toBe('Sodium hydroxide');
    expect(benchItemLabel('heat')).toMatch(/Heat/);
    expect(benchItemLabel('HCl')).toBe('Hydrogen chloride (HCl)');
    expect(isCondition('yeast')).toBe(true);
    expect(isCondition('H2O')).toBe(false);
    expect(reactionsProducing('H2O').length).toBeGreaterThan(3);
  });
});

describe('builder helpers', () => {
  it('suggests near misses, closest first', async () => {
    const { nearMisses } = await import('../src/game/engine/molecules');
    const near = nearMisses({ H: 2 });
    expect(near[0]!.molecule.id).toBe('water');
    expect(near[0]!.changes).toEqual({ O: 1 });
    expect(nearMisses({ H: 2, O: 1 }).map((n) => n.molecule.id)).toContain('hydrogen-peroxide');
    expect(nearMisses({ H: 2, O: 1 }).map((n) => n.molecule.id)).not.toContain('water');
    expect(nearMisses({})).toEqual([]);
  });
  it('palette lists every element used by the molecules', async () => {
    const { moleculeElementPalette } = await import('../src/game/engine/molecules');
    expect(moleculeElementPalette()).toEqual(['H', 'C', 'N', 'O', 'F', 'Na', 'Mg', 'P', 'S', 'Cl', 'Ca', 'Fe', 'Cu']);
  });
});

describe('molecule search', () => {
  it('matches names, sub-categories and exact formulas', async () => {
    const { matchesMoleculeQuery } = await import('../src/game/engine/molecules');
    const { MOLECULES } = await import('../src/data/molecules');
    const hits = (q: string) => MOLECULES.filter((m) => matchesMoleculeQuery(m, q)).map((m) => m.id);
    expect(hits('h2o')).toEqual(['water']);
    expect(hits('C2H6O')).toEqual(['ethanol']);
    expect(hits('C2H4')).toEqual(['ethene', 'polyethylene']);
    expect(hits('alkane')).toEqual(['methane', 'ethane', 'propane', 'butane', 'octane', 'chloroform']); // chloroform is a haloalkane
    expect(hits('nucleobase')).toHaveLength(4);
    expect(hits('CO')).toContain('carbon-monoxide'); // exact formula (plus names containing "co")
    expect(hits('')).toHaveLength(60);
  });
});
