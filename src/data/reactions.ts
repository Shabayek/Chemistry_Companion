import type { Reaction, ReactionCondition } from '../types';

const s = (formula: string, coeff = 1) => ({ formula, coeff });

/**
 * Reactions available on the mixing bench. Each is triggered by putting its reactants (or its single
 * reactant plus a condition) on the bench. Equations are balanced (checked by tests).
 */
export const REACTIONS: Reaction[] = [
  { id: 'hcl-naoh', name: 'Acid + alkali', type: 'neutralisation', reactants: [s('HCl'), s('NaOH')], products: [s('NaCl'), s('H2O')], observation: 'The mixture warms slightly and becomes neutral: salt and water form.' },
  { id: 'hno3-naoh', name: 'Nitric acid + alkali', type: 'neutralisation', reactants: [s('HNO3'), s('NaOH')], products: [s('NaNO3'), s('H2O')], observation: 'The solution warms and becomes neutral.' },
  { id: 'nh3-hcl', name: 'Ammonia + hydrogen chloride', type: 'neutralisation', reactants: [s('NH3'), s('HCl')], products: [s('NH4Cl')], observation: 'A thick white smoke of ammonium chloride appears where the gases meet.' },
  { id: 'bicarb-hcl', name: 'Baking soda + acid', type: 'gas evolution', reactants: [s('NaHCO3'), s('HCl')], products: [s('NaCl'), s('H2O'), s('CO2')], observation: 'Vigorous fizzing as carbon dioxide bubbles out.' },
  { id: 'chalk-hcl', name: 'Carbonate + acid', type: 'gas evolution', reactants: [s('CaCO3'), s('HCl', 2)], products: [s('CaCl2'), s('H2O'), s('CO2')], observation: 'The chalk fizzes and dissolves.' },
  { id: 'zinc-hcl', name: 'Metal + acid', type: 'displacement', reactants: [s('Zn'), s('HCl', 2)], products: [s('ZnCl2'), s('H2')], observation: 'Bubbles of hydrogen gas stream off the zinc.' },
  { id: 'sodium-water', name: 'Sodium + water', type: 'displacement', reactants: [s('Na', 2), s('H2O', 2)], products: [s('NaOH', 2), s('H2')], observation: 'The sodium melts into a ball and whizzes across the water, fizzing.' },
  { id: 'copper-hydroxide', name: 'Making a precipitate', type: 'precipitation', reactants: [s('CuSO4'), s('NaOH', 2)], products: [s('Cu(OH)2'), s('Na2SO4')], observation: 'A pale-blue solid (a precipitate) forms in the solution.' },
  { id: 'limewater', name: 'Limewater test', type: 'precipitation', reactants: [s('Ca(OH)2'), s('CO2')], products: [s('CaCO3'), s('H2O')], observation: 'The clear limewater turns milky: the test for carbon dioxide.' },
  { id: 'peroxide-catalyst', name: 'Catalytic decomposition', type: 'decomposition', condition: 'catalyst', reactants: [s('H2O2', 2)], products: [s('H2O', 2), s('O2')], observation: 'Rapid fizzing; a glowing splint relights in the oxygen.', note: 'Manganese(IV) oxide speeds the reaction up without being used up.' },
  { id: 'limestone-heat', name: 'Thermal decomposition', type: 'decomposition', condition: 'heat', reactants: [s('CaCO3')], products: [s('CaO'), s('CO2')], observation: 'Strong heating turns limestone into quicklime, releasing carbon dioxide.' },
  { id: 'fermentation', name: 'Fermentation', type: 'fermentation', condition: 'yeast', reactants: [s('C6H12O6')], products: [s('C2H5OH', 2), s('CO2', 2)], observation: 'Over a few days the yeast froths as sugar becomes ethanol and carbon dioxide.', note: 'Yeast enzymes work best around 30 °C without oxygen.' },
  { id: 'hydrogen-oxygen', name: 'Burning hydrogen', type: 'combustion', reactants: [s('H2', 2), s('O2')], products: [s('H2O', 2)], observation: 'A squeaky pop! The only product is water.' },
  { id: 'methane-oxygen', name: 'Burning methane', type: 'combustion', reactants: [s('CH4'), s('O2', 2)], products: [s('CO2'), s('H2O', 2)], observation: 'A clean blue flame, like a gas cooker.' },
  { id: 'ethanol-oxygen', name: 'Burning ethanol', type: 'combustion', reactants: [s('C2H5OH'), s('O2', 3)], products: [s('CO2', 2), s('H2O', 3)], observation: 'A pale-blue, almost invisible flame.' },
  { id: 'octane-oxygen', name: 'Burning petrol', type: 'combustion', reactants: [s('C8H18', 2), s('O2', 25)], products: [s('CO2', 16), s('H2O', 18)], observation: 'A hot yellow flame releasing lots of energy, as in a car engine.' },
  { id: 'magnesium-oxygen', name: 'Burning magnesium', type: 'synthesis', reactants: [s('Mg', 2), s('O2')], products: [s('MgO', 2)], observation: 'A blinding white flame leaves a white powder. Don\'t look directly at it!' },
  { id: 'iron-oxygen', name: 'Rusting', type: 'synthesis', reactants: [s('Fe', 4), s('O2', 3)], products: [s('Fe2O3', 2)], observation: 'Slowly, orange-brown rust forms on the iron.', note: 'Rusting also needs water; salt speeds it up.' },
  { id: 'haber', name: 'Haber process', type: 'synthesis', reactants: [s('N2'), s('H2', 3)], products: [s('NH3', 2)], observation: 'Ammonia gas forms, with its sharp smell.', note: 'Industrially: iron catalyst, about 200 atm and 450 °C, and the reaction is reversible.' },
];

export const CONDITION_LABELS: Record<ReactionCondition, string> = {
  heat: 'Heat 🔥',
  catalyst: 'Catalyst (MnO₂)',
  yeast: 'Yeast 🍞',
};

/** Names for bench species that are not collectible molecules (elements and extra products). */
export const EXTRA_SPECIES_NAMES: Record<string, string> = {
  Na: 'Sodium',
  Mg: 'Magnesium',
  Fe: 'Iron',
  Zn: 'Zinc',
  NaNO3: 'Sodium nitrate',
  NH4Cl: 'Ammonium chloride',
  CaCl2: 'Calcium chloride',
  ZnCl2: 'Zinc chloride',
  Na2SO4: 'Sodium sulfate',
  CaO: 'Calcium oxide (quicklime)',
};
