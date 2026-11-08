/**
 * Typed data for each interactive practice widget. A mission step's `data` is checked against the
 * type for its `interactive` kind at compile time (see `MissionStep` in ./index.ts).
 * Every field is optional where the widget has a sensible default.
 */

export interface AtomBuilderData {
  target: { p: number; n: number; e: number };
  /** Symbol of the element being built (for display). */
  element?: string;
}

export interface SymbolMatchData {
  /** 'common' (default), 'all' 118 elements, or an explicit list of symbols. */
  pool?: 'common' | 'all' | string[];
  rounds?: number;
}

/** Drag-free sorter: put each item into one of the categories. */
export interface SorterData {
  categories: string[];
  items: { label: string; category: string }[];
}

export interface MoleculeMakerData {
  /** Formula to build, e.g. "H2O". */
  target: string;
}

export interface PeriodicExplorerData {
  /** Find-the-element clues. Without clues the step is free exploration. */
  clues?: { clue: string; answer: string }[];
}

export type BondType = 'ionic' | 'covalent' | 'metallic';

export interface BondBuilderData {
  pairs: { a: string; b: string; answer: BondType; explanation?: string }[];
}

export interface EquationBalancerData {
  reactants: string[];
  products: string[];
}

export interface LabMixData {
  /** Reaction id the player must trigger to complete the step. Without a goal, any reaction completes it. */
  goal?: string;
  /** Pre-filled bench slots. */
  initial?: [string, string];
}

export interface PhSliderData {
  /** Sequential targets: set the slider inside [min, max] and press Check. */
  tasks: { prompt: string; min: number; max: number }[];
}

export type StoichProblem =
  | { formula: string; mass: number; find: 'moles' }
  | { formula: string; moles: number; find: 'mass' }
  | { formula: string; moles: number; find: 'particles' };

export interface StoichiometryData {
  problems: StoichProblem[];
}

export const REACTION_CLASSES = ['Synthesis', 'Decomposition', 'Single replacement', 'Double replacement', 'Combustion'] as const;
export type ReactionClass = (typeof REACTION_CLASSES)[number];

export interface ReactionClassifierData {
  items: { equation: string; answer: ReactionClass; explanation?: string }[];
}

export type GasProblem =
  | { law: 'boyle'; p1: number; v1: number; p2: number }
  | { law: 'charles'; v1: number; t1: number; t2: number }
  | { law: 'ideal'; n: number; v: number; t: number };

export interface GasLawData {
  problems: GasProblem[];
}

export interface OrganicBuilderData {
  /** Pick a molecule whose sub-category matches (e.g. 'alcohol'). */
  tasks: { prompt: string; subcategory: string }[];
}

export interface RedoxData {
  items: { element: string; compound: string; answer: number }[];
}

export type EquilibriumShift = 'Toward products' | 'Toward reactants' | 'No shift';

export interface EquilibriumData {
  reaction: string;
  scenarios: { change: string; answer: EquilibriumShift; explanation: string }[];
}

export interface ThermoData {
  /** ΔH in kJ/mol, ΔS in J/(mol·K), T in K. The player computes ΔG in kJ/mol. */
  problems: { dH: number; dS: number; T: number; label?: string }[];
}

export interface KineticsData {
  /** "Rate ∝ [A]^order. If [A] is multiplied by factor, the rate is multiplied by…" */
  problems: { order: number; factor: number }[];
}

export interface CellBuilderData {
  /** Metals from the standard reduction potential table (see data/electrochem.ts). */
  problems: { cathode: string; anode: string }[];
}

export interface DecayData {
  problems: { n0: number; halfLife: number; t: number; unit: string; quantity?: string }[];
}

export interface AtomCounterData {
  /** Count atoms of `element` (or all atoms when omitted) in a written term such as "3H2O" or "Al2(SO4)3". */
  items: { formula: string; element?: string }[];
}

export type PolymerTask =
  | { ask: 'monomer' | 'type' | 'recycling'; polymer: string }
  | { ask: 'chain-mass'; polymer: string; n: number };

export interface PolymerBuilderData {
  /** Polymer ids refer to molecules with category 'polymer'. */
  tasks: PolymerTask[];
}

export type BufferProblem =
  | { find: 'pH'; acid: string; pKa: number; acidConc: number; baseConc: number }
  | { find: 'ratio'; acid: string; pKa: number; targetPh: number }
  | { find: 'pH-after-acid'; acid: string; pKa: number; acidConc: number; baseConc: number; addedAcid: number };

export interface BufferData {
  problems: BufferProblem[];
}

export interface ElectronConfigData {
  /** Element symbols whose ground-state configuration the player builds. */
  targets: string[];
}

export interface InteractiveDataMap {
  'atom-builder': AtomBuilderData;
  'symbol-match': SymbolMatchData;
  'state-sorter': SorterData;
  'molecule-maker': MoleculeMakerData;
  'periodic-explorer': PeriodicExplorerData;
  'bond-builder': BondBuilderData;
  'equation-balancer': EquationBalancerData;
  'lab-mix': LabMixData;
  'ph-slider': PhSliderData;
  stoichiometry: StoichiometryData;
  'reaction-classifier': ReactionClassifierData;
  'gas-law': GasLawData;
  'organic-builder': OrganicBuilderData;
  redox: RedoxData;
  equilibrium: EquilibriumData;
  thermo: ThermoData;
  kinetics: KineticsData;
  'cell-builder': CellBuilderData;
  decay: DecayData;
  sorter: SorterData;
  'atom-counter': AtomCounterData;
  'polymer-builder': PolymerBuilderData;
  buffer: BufferData;
  'electron-config': ElectronConfigData;
}

/** Reported by an interactive when its task is finished. `score` is 0..1. */
export interface StepResult {
  score: number;
}
