// Mixing-bench logic: which reaction (if any) happens for the items placed on the bench.
import type { Molecule, Reaction, ReactionCondition } from '../../types';
import { REACTIONS, CONDITION_LABELS, EXTRA_SPECIES_NAMES } from '../../data/reactions';
import { getMoleculeByFormula } from './molecules';

/** A bench item is a species formula (e.g. "HCl", "Zn") or a condition ("heat", "catalyst", "yeast"). */
export type BenchItem = string;

export const CONDITIONS = Object.keys(CONDITION_LABELS) as ReactionCondition[];

export function isCondition(item: BenchItem): item is ReactionCondition {
  return (CONDITIONS as string[]).includes(item);
}

/** The bench items that trigger a reaction: its distinct reactants, plus its condition if any. */
export function reactionInputs(r: Reaction): BenchItem[] {
  const inputs = Array.from(new Set(r.reactants.map((x) => x.formula)));
  if (r.condition) inputs.push(r.condition);
  return inputs.sort();
}

/** The reaction triggered by exactly these bench items (order and blanks ignored). */
export function findReaction(items: readonly (BenchItem | '' | null | undefined)[], reactions: readonly Reaction[] = REACTIONS): Reaction | undefined {
  const key = Array.from(new Set(items.filter((x): x is string => !!x))).sort().join('|');
  if (key === '') return undefined;
  return reactions.find((r) => reactionInputs(r).join('|') === key);
}

/** Every distinct reagent used by the bench reactions, sorted by display name. */
export function benchReagents(reactions: readonly Reaction[] = REACTIONS): string[] {
  const set = new Set(reactions.flatMap((r) => r.reactants.map((x) => x.formula)));
  return [...set].sort((a, b) => speciesName(a).localeCompare(speciesName(b)));
}

export function speciesName(formula: string): string {
  return getMoleculeByFormula(formula)?.name ?? EXTRA_SPECIES_NAMES[formula] ?? formula;
}

export function benchItemLabel(item: BenchItem): string {
  return isCondition(item) ? CONDITION_LABELS[item] : `${speciesName(item)} (${item})`;
}

/** "2H2 + O2 → 2H2O" */
export function formatEquation(r: Reaction): string {
  const side = (xs: Reaction['reactants']) => xs.map((x) => `${x.coeff === 1 ? '' : x.coeff}${x.formula}`).join(' + ');
  return `${side(r.reactants)} → ${side(r.products)}`;
}

/** Products that are collectible molecules. */
export function collectibleProducts(r: Reaction): Molecule[] {
  return r.products.map((p) => getMoleculeByFormula(p.formula)).filter((m): m is Molecule => m !== undefined);
}

/** Reactions that produce the given molecule (useful for hints). */
export function reactionsProducing(moleculeFormula: string, reactions: readonly Reaction[] = REACTIONS): Reaction[] {
  return reactions.filter((r) => r.products.some((p) => p.formula === moleculeFormula));
}
