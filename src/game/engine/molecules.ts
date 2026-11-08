// Molecule helpers: molar mass, composition, Hill formulas, and matching built atom counts to molecules.
import type { Molecule } from '../../types';
import { ELEMENTS } from '../../data/elements';
import { MOLECULES } from '../../data/molecules';
import { parseFormula, countsEqual, type AtomCount } from './chemistry';

const MASS: ReadonlyMap<string, number> = new Map(ELEMENTS.map((e) => [e.symbol, e.mass]));

/** "(C2H4)n" -> "C2H4"; any other formula is returned unchanged. */
export function repeatUnit(formula: string): string {
  const m = /^\((.+)\)n$/.exec(formula);
  return m ? m[1]! : formula;
}

export function isPolymerFormula(formula: string): boolean {
  return /^\(.+\)n$/.test(formula);
}

/** Atom counts of a molecule (one repeat unit for polymers). */
export function moleculeCounts(m: Pick<Molecule, 'atoms'>): AtomCount {
  const out: AtomCount = {};
  for (const a of m.atoms) out[a.symbol] = (out[a.symbol] ?? 0) + a.count;
  return out;
}

/**
 * Molar mass in g/mol from standard atomic weights. Accepts a formula (polymers: per repeat unit) or atom counts.
 * Throws on unknown element symbols.
 */
export function molarMass(formulaOrCounts: string | AtomCount): number {
  const counts = typeof formulaOrCounts === 'string' ? parseFormula(repeatUnit(formulaOrCounts)) : formulaOrCounts;
  let total = 0;
  for (const [sym, n] of Object.entries(counts)) {
    const m = MASS.get(sym);
    if (m === undefined) throw new Error(`Unknown element "${sym}"`);
    total += m * n;
  }
  return total;
}

/** Round to a sensible number of decimals for display. */
export function formatMolarMass(g: number): string {
  return `${g.toFixed(2)} g/mol`;
}

export interface CompositionEntry {
  symbol: string;
  count: number;
  mass: number;
  /** Mass percentage, 0–100. */
  percent: number;
}

/** Mass percentage of each element, in Hill order. */
export function percentComposition(formulaOrCounts: string | AtomCount): CompositionEntry[] {
  const counts = typeof formulaOrCounts === 'string' ? parseFormula(repeatUnit(formulaOrCounts)) : formulaOrCounts;
  const total = molarMass(counts);
  return hillOrder(counts).map((symbol) => {
    const count = counts[symbol]!;
    const mass = MASS.get(symbol)! * count;
    return { symbol, count, mass, percent: total > 0 ? (mass / total) * 100 : 0 };
  });
}

/** Hill order: C first, H second (when C is present), then alphabetical; without C, purely alphabetical. */
export function hillOrder(counts: AtomCount): string[] {
  const keys = Object.keys(counts).filter((k) => (counts[k] ?? 0) > 0).sort();
  if (!keys.includes('C')) return keys;
  return ['C', ...(keys.includes('H') ? ['H'] : []), ...keys.filter((k) => k !== 'C' && k !== 'H')];
}

/** Molecular formula in Hill notation, e.g. ethanol -> "C2H6O". Polymers keep the "(...)n" wrapper. */
export function hillFormula(m: Pick<Molecule, 'atoms' | 'formula'>): string {
  const body = countsToHill(moleculeCounts(m));
  return isPolymerFormula(m.formula) ? `(${body})n` : body;
}

export interface MoleculeMatch {
  molecule: Molecule;
  /** True when the counts equal a polymer's repeat unit rather than a whole molecule. */
  asRepeatUnit: boolean;
}

/** Every molecule (or polymer repeat unit) with exactly these atom counts. */
export function findMoleculesByCounts(counts: AtomCount, molecules: readonly Molecule[] = MOLECULES): MoleculeMatch[] {
  const clean: AtomCount = {};
  for (const [k, v] of Object.entries(counts)) if (v > 0) clean[k] = v;
  if (Object.keys(clean).length === 0) return [];
  return molecules
    .filter((m) => countsEqual(moleculeCounts(m), clean))
    .map((m) => ({ molecule: m, asRepeatUnit: m.category === 'polymer' }));
}

/** Find the molecule written with exactly this display formula (e.g. "Cu(OH)2"). */
export function getMoleculeByFormula(formula: string, molecules: readonly Molecule[] = MOLECULES): Molecule | undefined {
  return molecules.find((m) => m.formula === formula);
}

/** Canonical Hill string for arbitrary counts (empty string for no atoms). */
export function countsToHill(counts: AtomCount): string {
  return hillOrder(counts).map((k) => (counts[k] === 1 ? k : `${k}${counts[k]}`)).join('');
}

export interface NearMiss {
  molecule: Molecule;
  /** Total number of atoms to add or remove. */
  distance: number;
  /** Per-element change needed, e.g. { H: +1, O: -1 }. */
  changes: AtomCount;
}

/**
 * Molecules that are within `maxDistance` atom additions/removals of the given counts (exact matches excluded),
 * closest first. Used for "you're close to…" hints in the builder.
 */
export function nearMisses(counts: AtomCount, maxDistance = 2, molecules: readonly Molecule[] = MOLECULES): NearMiss[] {
  const built: AtomCount = {};
  for (const [k, v] of Object.entries(counts)) if (v > 0) built[k] = v;
  if (Object.keys(built).length === 0) return [];
  const out: NearMiss[] = [];
  for (const m of molecules) {
    const target = moleculeCounts(m);
    const changes: AtomCount = {};
    let distance = 0;
    for (const sym of new Set([...Object.keys(target), ...Object.keys(built)])) {
      const d = (target[sym] ?? 0) - (built[sym] ?? 0);
      if (d !== 0) { changes[sym] = d; distance += Math.abs(d); }
    }
    if (distance > 0 && distance <= maxDistance) out.push({ molecule: m, distance, changes });
  }
  return out.sort((a, b) => a.distance - b.distance || a.molecule.name.localeCompare(b.molecule.name));
}

/** Element symbols used anywhere in the molecule list, by atomic number. */
export function moleculeElementPalette(molecules: readonly Molecule[] = MOLECULES): string[] {
  const used = new Set(molecules.flatMap((m) => m.atoms.map((a) => a.symbol)));
  return ELEMENTS.filter((e) => used.has(e.symbol)).map((e) => e.symbol);
}

/**
 * Explorer search: substring of the name or sub-category (case-insensitive), or an exact formula
 * (display or Hill form, case-insensitive: "h2o", "C2H6O").
 */
export function matchesMoleculeQuery(m: Molecule, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  if (m.name.toLowerCase().includes(q) || m.subcategory.toLowerCase().includes(q)) return true;
  const forms = [m.formula, hillFormula(m), repeatUnit(m.formula), repeatUnit(hillFormula(m))].map((f) => f.toLowerCase());
  return forms.includes(q);
}
