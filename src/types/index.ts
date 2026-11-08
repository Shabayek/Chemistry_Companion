import type { InteractiveDataMap } from './interactives';

export type * from './interactives';
export { REACTION_CLASSES } from './interactives';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type Theme = 'light' | 'dark' | 'high-contrast';
export type AgeMode = 'kid' | 'standard';
export type Locale = 'en';

export type ElementCategory =
  | 'alkali metal'
  | 'alkaline earth metal'
  | 'transition metal'
  | 'post-transition metal'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble gas'
  | 'lanthanide'
  | 'actinide';

export type ElementBlock = 's' | 'p' | 'd' | 'f';

export interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  /** IUPAC group 1–18. `null` for the lanthanides and actinides (shown in the separate f-block rows). */
  group: number | null;
  period: number;
  category: ElementCategory;
  /** Standard atomic weight; for elements without stable isotopes, mass number of the longest-lived isotope. */
  mass: number;
  stateAtRoomTemp: 'solid' | 'liquid' | 'gas';
  funFact: string;
  color: string;
  block: ElementBlock;
  /** Condensed ground-state configuration, e.g. "[Ar] 3d5 4s1" (predicted for superheavy elements). */
  electronConfig: string;
  /** Pauling electronegativity; `null` when not established. */
  electronegativity: number | null;
  /** No stable isotopes. */
  radioactive: boolean;
  /** Bulk properties (e.g. state at room temperature) are predicted rather than observed. */
  predicted: boolean;
  uses: string[];
}

export type MoleculeCategory = 'common' | 'organic' | 'polymer' | 'biomolecule';

export interface Molecule {
  /** Stable identifier (slug). Formulas are not unique (isomers), so ids are used for saves and rewards. */
  id: string;
  /** Display formula as usually written (may be condensed, e.g. "CH3COOH"). Polymers: repeat unit as "(C2H4)n". */
  formula: string;
  name: string;
  category: MoleculeCategory;
  /** Sub-classification, e.g. 'acid', 'alkane', 'addition polymer', 'nucleobase'. */
  subcategory: string;
  /** Atom counts of the molecule (or of one repeat unit for polymers). Must agree with `formula`. */
  atoms: { symbol: string; count: number }[];
  bondType: 'ionic' | 'covalent' | 'metallic' | 'mixed';
  description: string;
  uses: string[];
  /** Polymers: the monomer(s) the polymer is made from. */
  monomers?: string[];
  /** Polymers: resin identification (recycling) codes. */
  recyclingCodes?: number[];
}

export interface ContentBlock {
  type: 'text' | 'image' | 'animation' | 'equation';
  value: string;
  caption?: string;
}

/** Every interactive practice widget. InteractivePanel must render each one (checked at compile time). */
export const INTERACTIVE_KINDS = [
  'atom-builder', 'symbol-match', 'state-sorter', 'molecule-maker', 'periodic-explorer', 'bond-builder',
  'equation-balancer', 'lab-mix', 'ph-slider', 'stoichiometry', 'reaction-classifier', 'gas-law',
  'organic-builder', 'redox', 'equilibrium', 'thermo', 'kinetics', 'cell-builder', 'decay',
  'sorter', 'atom-counter', 'polymer-builder', 'buffer', 'electron-config',
] as const;

export type InteractiveKind = (typeof INTERACTIVE_KINDS)[number];

interface MissionStepBase {
  id: string;
  /** 'guided' steps are exploration (not graded); 'practice' steps are graded and count toward the score. */
  kind: 'guided' | 'practice';
  title: string;
  prompt: string;
}

/** A practice step. `data` is typed by the `interactive` kind. */
export type MissionStep = {
  [K in InteractiveKind]: MissionStepBase & { interactive: K; data?: InteractiveDataMap[K] };
}[InteractiveKind];


// Compile-time guarantee that INTERACTIVE_KINDS and InteractiveDataMap list the same kinds.
type _KindsMatchData = [InteractiveKind] extends [keyof InteractiveDataMap]
  ? [keyof InteractiveDataMap] extends [InteractiveKind] ? true : never
  : never;
export const INTERACTIVE_KINDS_MATCH_DATA: _KindsMatchData = true;

export interface QuizQuestion {
  id: string;
  prompt: string;
  type: 'mcq' | 'truefalse' | 'fillblank' | 'dragmatch';
  options?: string[];
  answer: string | string[];
  explanation: string;
  difficulty: 1 | 2 | 3;
}

export interface Reward {
  type: 'currency' | 'badge' | 'element' | 'molecule' | 'avatar';
  id: string;
  amount?: number;
}

export type MissionKind = 'core' | 'miniboss' | 'boss' | 'remediation';

/** Extra rules applied to boss variants (enforced by the mission engine in Phase 3). */
export interface BossRules {
  /** Overall time limit for the quiz, in seconds. */
  timeLimitSec?: number;
  /** Number of wrong answers allowed before the attempt fails. */
  lives?: number;
  /** Fraction of correct answers required to clear (default 0.6). */
  passThreshold?: number;
}

export interface Mission {
  id: string;
  world: Difficulty;
  zone: string;
  title: string;
  concept: string;
  kind: MissionKind;
  intro: ContentBlock[];
  steps: MissionStep[];
  quiz: QuizQuestion[];
  rewards: Reward[];
  bossRules?: BossRules;
  /** For remediation missions: the missions whose missed questions this mission revisits. */
  remediates?: string[];
}

export interface MissionProgress {
  missionId: string;
  completed: boolean;
  stars: 0 | 1 | 2 | 3;
  bestScore: number;
  attempts: number;
  lastPlayed: number;
  /** Question ids answered incorrectly in the most recent attempt (feeds remediation). */
  missedQuestionIds: string[];
  /** One-time mission rewards (items + fixed currency) have been granted. */
  rewardsClaimed: boolean;
}

export interface Settings {
  audio: boolean;
  textSize: 'sm' | 'md' | 'lg';
  reducedMotion: boolean;
  kidTone: boolean;
}

export interface Progress {
  version: number;
  playerName: string;
  ageMode: AgeMode;
  theme: Theme;
  locale: Locale;
  unlockedWorlds: Difficulty[];
  missions: Record<string, MissionProgress>;
  collection: { elements: string[]; molecules: string[]; badges: string[]; avatarItems: string[] };
  currency: number;
  settings: Settings;
  dailyChallengeDate?: string;
  dailyChallengeDone?: boolean;
  streakDays: number;
}

export type ReactionType =
  | 'neutralisation'
  | 'precipitation'
  | 'gas evolution'
  | 'combustion'
  | 'synthesis'
  | 'decomposition'
  | 'displacement'
  | 'fermentation';

/** Something other than a chemical that can be put on the mixing bench. */
export type ReactionCondition = 'heat' | 'catalyst' | 'yeast';

export interface ReactionSpecies {
  formula: string;
  coeff: number;
}

export interface Reaction {
  id: string;
  name: string;
  type: ReactionType;
  /** Balanced equation. Formulas match `Molecule.formula` when the species is a collectible molecule. */
  reactants: ReactionSpecies[];
  products: ReactionSpecies[];
  /** Needed in place of a second reagent (e.g. decomposition needs heat). */
  condition?: ReactionCondition;
  /** What you would see. */
  observation: string;
  /** Real-world conditions worth knowing (shown as a note). */
  note?: string;
}
