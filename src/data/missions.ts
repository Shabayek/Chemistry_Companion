import type { Mission, QuizQuestion, ContentBlock, Difficulty } from '../types';

const cb = (text: string): ContentBlock[] => [{ type: 'text', value: text }];

function q(id: string, prompt: string, type: QuizQuestion['type'], answer: string | string[], options?: string[], explanation = '', difficulty: 1 | 2 | 3 = 1): QuizQuestion {
  const base: QuizQuestion = { id, prompt, type, answer, explanation, difficulty };
  if (options !== undefined) base.options = options;
  return base;
}

export const MISSIONS: Mission[] = [
  // ---------- BEGINNER ----------
  {
    id: 'beg-atom-builder', world: 'beginner', kind: 'core', zone: 'Atom Valley', title: 'Atom Builder', concept: 'Atoms are made of protons, neutrons, and electrons.',
    intro: cb('An atom is the smallest piece of an element. It has a nucleus with protons (+) and neutrons (0), and electrons (-) orbiting around.'),
    steps: [
      { id: 's1', kind: 'guided', title: 'Meet the atom', prompt: 'Drag particles to build a hydrogen atom: 1 proton, 0 neutrons, 1 electron.', interactive: 'atom-builder', data: { target: { p: 1, n: 0, e: 1 }, element: 'H' } },
      { id: 's2', kind: 'practice', title: 'Try helium', prompt: 'Build helium: 2 protons, 2 neutrons, 2 electrons.', interactive: 'atom-builder', data: { target: { p: 2, n: 2, e: 2 }, element: 'He' } },
    ],
    quiz: [
      q('b1', 'What particle has a positive charge?', 'mcq', 'Proton', ['Proton', 'Neutron', 'Electron'], 'Protons are positively charged.', 1),
      q('b2', 'Where are protons and neutrons found?', 'mcq', 'In the nucleus', ['In the nucleus', 'Orbiting', 'Outside the atom'], 'The nucleus is the center.', 1),
      q('b3', 'An atom with 6 protons is which element?', 'mcq', 'Carbon', ['Carbon', 'Oxygen', 'Nitrogen'], 'Atomic number = protons.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 10 },
      { type: 'element', id: 'H' },
      { type: 'element', id: 'He' },
      { type: 'element', id: 'Li' },
      { type: 'element', id: 'Be' },
      { type: 'element', id: 'B' },
      { type: 'molecule', id: 'hydrogen-gas' },
    ],
  },
  {
    id: 'beg-symbol-match', world: 'beginner', kind: 'core', zone: 'Atom Valley', title: 'Symbol Match', concept: 'Each element has a unique symbol.',
    intro: cb('Elements have one- or two-letter symbols. The first letter is always capital.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Match symbols', prompt: 'Type the symbol for each element. Remember: the first letter is always a capital.', interactive: 'symbol-match', data: { pool: 'common', rounds: 8 } }],
    quiz: [
      q('b4', 'Symbol for Oxygen?', 'mcq', 'O', ['O', 'Ox', 'Og'], 'Oxygen is O.', 1),
      q('b5', 'Symbol for Gold?', 'mcq', 'Au', ['Au', 'Ag', 'Go'], 'Gold is Au.', 1),
      q('b6', 'Element with symbol Fe?', 'mcq', 'Iron', ['Iron', 'Lead', 'Copper'], 'Fe is iron.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 10 },
      { type: 'element', id: 'Na' },
      { type: 'element', id: 'K' },
      { type: 'element', id: 'Au' },
      { type: 'element', id: 'Ag' },
      { type: 'element', id: 'Pb' },
      { type: 'element', id: 'Sn' },
      { type: 'molecule', id: 'oxygen-gas' },
    ],
  },
  {
    id: 'beg-state-sorter', world: 'beginner', kind: 'core', zone: 'Matter Meadows', title: 'State Sorter', concept: 'Matter exists as solid, liquid, gas.',
    intro: cb('Solids hold shape, liquids flow, gases spread out. Temperature changes states.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Sort substances', prompt: 'Choose solid, liquid or gas for each substance at room temperature (about 20 °C).', interactive: 'state-sorter', data: { categories: ['Solid', 'Liquid', 'Gas'], items: [
      { label: 'Ice cube', category: 'Solid' }, { label: 'Orange juice', category: 'Liquid' }, { label: 'Steam from a kettle', category: 'Gas' },
      { label: 'Iron nail', category: 'Solid' }, { label: 'Oxygen', category: 'Gas' }, { label: 'Mercury (the metal)', category: 'Liquid' },
      { label: 'Table salt', category: 'Solid' }, { label: 'Helium in a balloon', category: 'Gas' },
    ] } }],
    quiz: [
      q('b7', 'Water at room temp is a...', 'mcq', 'Liquid', ['Solid', 'Liquid', 'Gas'], 'Water is liquid at 25°C.', 1),
      q('b8', 'Ice is a...', 'mcq', 'Solid', ['Solid', 'Liquid', 'Gas'], 'Ice is frozen water.', 1),
      q('b9', 'Steam is a...', 'mcq', 'Gas', ['Solid', 'Liquid', 'Gas'], 'Steam is water vapor.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 10 },
      { type: 'element', id: 'Hg' },
      { type: 'element', id: 'Br' },
      { type: 'element', id: 'Ne' },
      { type: 'element', id: 'Ar' },
      { type: 'molecule', id: 'nitrogen-gas' },
    ],
  },
  {
    id: 'beg-molecule-maker', world: 'beginner', kind: 'core', zone: 'Matter Meadows', title: 'Molecule Maker', concept: 'Atoms combine to form molecules.',
    intro: cb('Molecules are groups of atoms bonded together. Water is H2O: 2 hydrogen + 1 oxygen.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Build water', prompt: 'Add atoms until you have exactly H2O: 2 hydrogen and 1 oxygen.', interactive: 'molecule-maker', data: { target: 'H2O' } },
      { id: 's2', kind: 'practice', title: 'Build carbon dioxide', prompt: 'Now build CO2: 1 carbon and 2 oxygen.', interactive: 'molecule-maker', data: { target: 'CO2' } },
    ],
    quiz: [
      q('b10', 'How many atoms in H2O?', 'mcq', '3', ['2', '3', '4'], '2 H + 1 O = 3.', 1),
      q('b11', 'CO2 has how many oxygen atoms?', 'mcq', '2', ['1', '2', '3'], 'CO2 = 1 C + 2 O.', 1),
      q('b12', 'Which is a molecule?', 'mcq', 'H2O', ['H', 'O', 'H2O'], 'H2O is a molecule.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 15 },
      { type: 'element', id: 'C' },
      { type: 'element', id: 'O' },
      { type: 'element', id: 'N' },
      { type: 'molecule', id: 'water' },
      { type: 'molecule', id: 'carbon-dioxide' },
    ],
  },
  {
    id: 'beg-counting', world: 'beginner', kind: 'core', zone: 'Matter Meadows', title: 'Counting Atoms', concept: 'Read subscripts to count atoms.',
    intro: cb('Subscripts tell how many of each atom. In CO2, C=1, O=2.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Count the atoms', prompt: 'Use the subscripts: a small number counts the atom just before it.', interactive: 'atom-counter', data: { items: [
      { formula: 'H2O' }, { formula: 'CO2', element: 'O' }, { formula: 'CH4', element: 'H' },
      { formula: 'NH3' }, { formula: 'H2SO4', element: 'O' }, { formula: 'C6H12O6' },
    ] } }],
    quiz: [
      q('b13', 'Atoms in CO2?', 'mcq', '3', ['2', '3', '4'], '1+2=3.', 1),
      q('b14', 'Oxygen atoms in H2SO4?', 'mcq', '4', ['2', '4', '6'], 'H2SO4 has 4 O.', 2),
      q('b15', 'Hydrogen atoms in CH4?', 'mcq', '4', ['1', '4', '5'], 'CH4 has 4 H.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 10 },
      { type: 'element', id: 'S' },
      { type: 'element', id: 'P' },
      { type: 'molecule', id: 'methane' },
      { type: 'molecule', id: 'ammonia' },
    ],
  },
  {
    id: 'beg-elements-around', world: 'beginner', kind: 'core', zone: 'Atom Valley', title: 'Elements Around Us', concept: 'Common elements in daily life.',
    intro: cb('Oxygen in air, carbon in food, iron in blood, calcium in bones.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Element hunt', prompt: 'Read each clue and tap the matching element in the table.', interactive: 'periodic-explorer', data: { clues: [
      { clue: 'It makes your bones and teeth strong.', answer: 'Ca' },
      { clue: 'It carries oxygen in your blood (in hemoglobin).', answer: 'Fe' },
      { clue: 'It makes up about 78% of the air.', answer: 'N' },
      { clue: 'Pencil "lead" is really a form of this element.', answer: 'C' },
      { clue: 'It makes party balloons float.', answer: 'He' },
    ] } }],
    quiz: [
      q('b16', 'Which element is in bones?', 'mcq', 'Calcium', ['Iron', 'Calcium', 'Gold'], 'Calcium strengthens bones.', 1),
      q('b17', 'Which element makes up most of air?', 'mcq', 'Nitrogen', ['Oxygen', 'Nitrogen', 'Carbon'], 'Air is ~78% nitrogen.', 1),
      q('b18', 'Which element is in hemoglobin?', 'mcq', 'Iron', ['Iron', 'Gold', 'Silver'], 'Iron carries oxygen.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 10 },
      { type: 'badge', id: 'beginner-explorer' },
      { type: 'element', id: 'Ca' },
      { type: 'element', id: 'Fe' },
      { type: 'element', id: 'Cu' },
      { type: 'element', id: 'Zn' },
      { type: 'element', id: 'I' },
      { type: 'molecule', id: 'calcium-carbonate' },
      { type: 'molecule', id: 'iron-iii-oxide' },
    ],
  },
  {
    id: 'beg-boss', world: 'beginner', kind: 'boss', zone: 'Atom Valley', title: 'Boss: Atom Master', concept: 'Review beginner concepts.',
    bossRules: { lives: 3, passThreshold: 0.7 },
    intro: cb('Show what you learned about atoms, symbols, states, and molecules!'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Stage 1: Build carbon', prompt: 'Build a carbon-12 atom: 6 protons, 6 neutrons, 6 electrons.', interactive: 'atom-builder', data: { target: { p: 6, n: 6, e: 6 }, element: 'C' } },
      { id: 's2', kind: 'practice', title: 'Stage 2: Symbol sprint', prompt: 'Type the symbol for each element.', interactive: 'symbol-match', data: { pool: 'common', rounds: 5 } },
      { id: 's3', kind: 'practice', title: 'Stage 3: States', prompt: 'Sort each substance by its state at room temperature.', interactive: 'state-sorter', data: { categories: ['Solid', 'Liquid', 'Gas'], items: [
        { label: 'Gold ring', category: 'Solid' }, { label: 'Neon in a sign', category: 'Gas' }, { label: 'Sea water', category: 'Liquid' }, { label: 'Bromine', category: 'Liquid' },
      ] } },
      { id: 's4', kind: 'practice', title: 'Stage 4: Build CO2', prompt: 'Finish by building carbon dioxide.', interactive: 'molecule-maker', data: { target: 'CO2' } },
    ],
    quiz: [
      q('bb1', 'Protons define the...', 'mcq', 'Element', ['Element', 'Mass', 'State'], 'Atomic number defines element.', 1),
      q('bb2', 'NaCl is...', 'mcq', 'A molecule/compound', ['An element', 'A molecule/compound', 'A mixture'], 'NaCl is a compound.', 1),
      q('bb3', 'Symbol for water?', 'mcq', 'H2O', ['H2O', 'HO2', 'H2O2'], 'Water is H2O.', 1),
      q('bb4', 'Most abundant gas in air?', 'mcq', 'Nitrogen', ['Oxygen', 'Nitrogen', 'CO2'], 'Nitrogen ~78%.', 1),
      q('bb5', 'How many electrons does a neutral oxygen atom (8 protons) have?', 'mcq', '8', ['6', '8', '16'], 'A neutral atom has as many electrons as protons.', 1),
      q('bb6', 'Which is a gas at room temperature?', 'mcq', 'Neon', ['Iron', 'Neon', 'Mercury'], 'Noble gases such as neon are gases.', 1),
      q('bb7', 'What does the 2 in H2O tell you?', 'mcq', 'There are 2 hydrogen atoms', ['There are 2 water molecules', 'There are 2 hydrogen atoms', 'There are 2 oxygen atoms'], 'A subscript counts the atom just before it.', 1),
      q('bb8', 'The symbol Na stands for...', 'mcq', 'Sodium', ['Nitrogen', 'Sodium', 'Neon'], 'Na comes from natrium, the Latin name for sodium.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 30 },
      { type: 'badge', id: 'atom-master' },
      { type: 'element', id: 'Si' },
      { type: 'element', id: 'Ti' },
      { type: 'element', id: 'Ni' },
      { type: 'molecule', id: 'glucose' },
    ],
  },

  {
    id: 'beg-physical-chemical', world: 'beginner', kind: 'core', zone: 'Matter Meadows', title: 'Physical or Chemical?', concept: 'Physical changes change the form; chemical changes make new substances.',
    intro: cb('In a physical change (melting, dissolving, cutting) no new substance forms, and it is often easy to reverse. In a chemical change (burning, rusting, cooking) atoms rearrange into new substances. Signs include a gas, light, heat, a colour change or a solid forming.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Sort the changes', prompt: 'Is each one a physical change or a chemical change?', interactive: 'sorter', data: { categories: ['Physical change', 'Chemical change'], items: [
        { label: 'Melting ice', category: 'Physical change' }, { label: 'Burning paper', category: 'Chemical change' },
        { label: 'Dissolving sugar in tea', category: 'Physical change' }, { label: 'Iron rusting', category: 'Chemical change' },
        { label: 'Boiling water', category: 'Physical change' }, { label: 'Baking a cake', category: 'Chemical change' },
        { label: 'Cutting paper', category: 'Physical change' }, { label: 'Frying an egg', category: 'Chemical change' },
        { label: 'Fireworks exploding', category: 'Chemical change' }, { label: 'Breaking a glass', category: 'Physical change' },
      ] } },
      { id: 's2', kind: 'practice', title: 'Make a new substance', prompt: 'Burn magnesium in oxygen and watch a new white substance form.', interactive: 'lab-mix', data: { goal: 'magnesium-oxygen', initial: ['Mg', 'O2'] } },
    ],
    quiz: [
      q('b19', 'Which is a chemical change?', 'mcq', 'Wood burning', ['Ice melting', 'Wood burning', 'Salt dissolving'], 'Burning makes new substances such as carbon dioxide, water and ash.', 1),
      q('b20', 'Melting chocolate is a...', 'mcq', 'Physical change', ['Physical change', 'Chemical change'], 'It is still chocolate and can set again.', 1),
      q('b21', 'Which is a sign of a chemical change?', 'mcq', 'A gas is given off', ['The shape changes', 'A gas is given off', 'It gets smaller'], 'Fizzing, light, heat, a colour change or a new solid all suggest a new substance.', 1),
      q('b22', 'True or false: dissolving salt in water makes a new substance.', 'truefalse', 'False', ['True', 'False'], 'Evaporate the water and the salt is still there.', 2),
      q('b23', 'When magnesium burns it becomes...', 'mcq', 'Magnesium oxide', ['Magnesium gas', 'Magnesium oxide', 'Liquid magnesium'], 'Magnesium reacts with oxygen: 2Mg + O2 → 2MgO.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 15 },
      { type: 'element', id: 'Mg' },
      { type: 'element', id: 'Al' },
      { type: 'molecule', id: 'magnesium-oxide' },
    ],
  },
  {
    id: 'beg-miniboss', world: 'beginner', kind: 'miniboss', zone: 'Atom Valley', title: 'Mini-Boss: Particle Patrol', concept: 'A timed check on atoms, symbols and states of matter.',
    bossRules: { timeLimitSec: 120, passThreshold: 0.7 },
    intro: cb('The Particle Patrol wants proof that you know your atoms! Warm up with three quick tasks, then beat the clock in the quiz.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Build oxygen', prompt: 'Build an oxygen-16 atom: 8 protons, 8 neutrons, 8 electrons.', interactive: 'atom-builder', data: { target: { p: 8, n: 8, e: 8 }, element: 'O' } },
      { id: 's2', kind: 'practice', title: 'Symbol sprint', prompt: 'Type each symbol.', interactive: 'symbol-match', data: { pool: 'common', rounds: 5 } },
      { id: 's3', kind: 'practice', title: 'States check', prompt: 'Sort by state at room temperature.', interactive: 'state-sorter', data: { categories: ['Solid', 'Liquid', 'Gas'], items: [
        { label: 'Candle wax', category: 'Solid' }, { label: 'Vinegar', category: 'Liquid' }, { label: 'Carbon dioxide', category: 'Gas' }, { label: 'Copper wire', category: 'Solid' },
      ] } },
    ],
    quiz: [
      q('bm1', 'An atom has 11 protons. Which element is it?', 'mcq', 'Sodium', ['Neon', 'Sodium', 'Magnesium'], 'Element number 11 is sodium.', 1),
      q('bm2', 'A neutral atom with 17 protons has how many electrons?', 'mcq', '17', ['7', '17', '35'], 'Neutral atoms have equal numbers of protons and electrons.', 1),
      q('bm3', 'What is the symbol for potassium?', 'mcq', 'K', ['P', 'K', 'Po'], 'K comes from kalium, the Latin name.', 2),
      q('bm4', 'Which particle has no charge?', 'mcq', 'Neutron', ['Proton', 'Neutron', 'Electron'], 'Neutrons are neutral.', 1),
      q('bm5', 'Which state has a fixed volume but no fixed shape?', 'mcq', 'Liquid', ['Solid', 'Liquid', 'Gas'], 'Liquids flow to fit their container but keep their volume.', 2),
      q('bm6', 'How many atoms are in one molecule of NH3?', 'mcq', '4', ['3', '4', '5'], '1 nitrogen + 3 hydrogen = 4 atoms.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 25 },
      { type: 'badge', id: 'particle-patrol' },
      { type: 'element', id: 'F' },
      { type: 'element', id: 'Cl' },
      { type: 'molecule', id: 'hydrogen-peroxide' },
    ],
  },
  {
    id: 'beg-clinic', world: 'beginner', kind: 'remediation', zone: 'Matter Meadows', title: 'Atom Clinic', concept: 'Revisit the beginner questions you found tricky.',
    remediates: ['beg-atom-builder', 'beg-symbol-match', 'beg-state-sorter', 'beg-molecule-maker', 'beg-counting', 'beg-elements-around', 'beg-physical-chemical', 'beg-miniboss', 'beg-boss'],
    intro: cb('Mistakes are how scientists learn. The Atom Clinic brings back the questions you missed, with their explanations, so you can fix them.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Warm-up count', prompt: 'A quick warm-up: count the atoms.', interactive: 'atom-counter', data: { items: [{ formula: 'H2O' }, { formula: 'CO2', element: 'O' }, { formula: 'CH4' }] } },
    ],
    quiz: [
      q('bc1', 'Protons are found...', 'mcq', 'In the nucleus', ['In the nucleus', 'In the electron cloud', 'Outside the atom'], 'Protons and neutrons make up the nucleus.', 1),
      q('bc2', 'Electrons have what charge?', 'mcq', 'Negative', ['Positive', 'Negative', 'No charge'], 'Electrons are negative; protons are positive.', 1),
      q('bc3', 'Which symbol is written correctly?', 'mcq', 'Ca', ['CA', 'ca', 'Ca'], 'Only the first letter of a symbol is a capital.', 1),
      q('bc4', 'Steam is water in which state?', 'mcq', 'Gas', ['Solid', 'Liquid', 'Gas'], 'Steam is water vapour.', 1),
      q('bc5', 'How many hydrogen atoms are in CH4?', 'mcq', '4', ['1', '4', '5'], 'The 4 counts the hydrogen atoms.', 1),
      q('bc6', 'Cooking an egg is a...', 'mcq', 'Chemical change', ['Physical change', 'Chemical change'], 'The proteins change permanently into new substances.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 15 },
      { type: 'badge', id: 'atom-clinic' },
      { type: 'element', id: 'Kr' },
      { type: 'element', id: 'Xe' },
      { type: 'element', id: 'Rn' },
      { type: 'molecule', id: 'sodium-bicarbonate' },
    ],
  },

  // ---------- INTERMEDIATE ----------
  {
    id: 'int-periodic-explorer', world: 'intermediate', kind: 'core', zone: 'Periodic Plaza', title: 'Periodic Explorer', concept: 'Navigate the periodic table.',
    intro: cb('The periodic table organizes elements by atomic number; rows are periods, columns are groups.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Find elements', prompt: 'Use groups (columns) and periods (rows) to find each element.', interactive: 'periodic-explorer', data: { clues: [
      { clue: 'Group 1, period 3', answer: 'Na' },
      { clue: 'The noble gas in period 2', answer: 'Ne' },
      { clue: 'The halogen in period 3', answer: 'Cl' },
      { clue: 'Period 4, group 8: the metal in your blood', answer: 'Fe' },
      { clue: 'The metalloid in group 14, period 3', answer: 'Si' },
    ] } }],
    quiz: [
      q('i1', 'Rows in periodic table are called...', 'mcq', 'Periods', ['Periods', 'Groups', 'Families'], 'Rows = periods.', 1),
      q('i2', 'Columns are called...', 'mcq', 'Groups', ['Periods', 'Groups', 'Levels'], 'Columns = groups.', 1),
      q('i3', 'Metals are mostly on the...', 'mcq', 'Left side', ['Left side', 'Right side', 'Top only'], 'Metals left, nonmetals right.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 15 },
      { type: 'element', id: 'Rb' },
      { type: 'element', id: 'Cs' },
      { type: 'element', id: 'Fr' },
      { type: 'element', id: 'Sr' },
      { type: 'element', id: 'Ba' },
      { type: 'element', id: 'Ra' },
      { type: 'molecule', id: 'copper-sulfate' },
    ],
  },
  {
    id: 'int-bond-builder', world: 'intermediate', kind: 'core', zone: 'Bond Bridge', title: 'Bond Builder', concept: 'Ionic vs covalent bonds.',
    intro: cb('Ionic bonds transfer electrons (metal+nonmetal). Covalent bonds share electrons (nonmetal+nonmetal).'),
    steps: [{ id: 's1', kind: 'practice', title: 'Predict bonds', prompt: 'Decide which kind of bond forms between each pair of atoms.', interactive: 'bond-builder', data: { pairs: [
      { a: 'Na', b: 'Cl', answer: 'ionic', explanation: 'Sodium (a metal) gives an electron to chlorine (a nonmetal).' },
      { a: 'C', b: 'O', answer: 'covalent', explanation: 'Two nonmetals share electrons.' },
      { a: 'Mg', b: 'O', answer: 'ionic', explanation: 'Magnesium gives two electrons to oxygen.' },
      { a: 'H', b: 'H', answer: 'covalent', explanation: 'Identical nonmetal atoms share a pair of electrons.' },
      { a: 'Cu', b: 'Cu', answer: 'metallic', explanation: 'Metal atoms share a sea of free electrons.' },
      { a: 'N', b: 'H', answer: 'covalent', explanation: 'Ammonia\'s N–H bonds are shared pairs.' },
      { a: 'K', b: 'F', answer: 'ionic', explanation: 'Potassium gives its outer electron to fluorine.' },
      { a: 'Al', b: 'Al', answer: 'metallic', explanation: 'Aluminium is a metal.' },
    ] } }],
    quiz: [
      q('i4', 'NaCl bond type?', 'mcq', 'Ionic', ['Ionic', 'Covalent', 'Metallic'], 'Na metal + Cl nonmetal.', 1),
      q('i5', 'H2O bond type?', 'mcq', 'Covalent', ['Ionic', 'Covalent', 'Metallic'], 'Nonmetals share.', 1),
      q('i6', 'Ionic bonds involve...', 'mcq', 'Electron transfer', ['Electron transfer', 'Electron sharing', 'Proton sharing'], 'Transfer of electrons.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 15 },
      { type: 'element', id: 'Cr' },
      { type: 'element', id: 'Mn' },
      { type: 'element', id: 'Co' },
      { type: 'molecule', id: 'sodium-chloride' },
      { type: 'molecule', id: 'hydrogen-chloride' },
    ],
  },
  {
    id: 'int-equation-balancer', world: 'intermediate', kind: 'core', zone: 'Reaction Reef', title: 'Equation Balancer', concept: 'Balance chemical equations.',
    intro: cb('Balance atoms on both sides by adjusting coefficients.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Balance water', prompt: 'Change the coefficients so each element has the same number of atoms on both sides.', interactive: 'equation-balancer', data: { reactants: ['H2', 'O2'], products: ['H2O'] } },
      { id: 's2', kind: 'practice', title: 'Balance ammonia', prompt: 'The Haber process: balance nitrogen and hydrogen.', interactive: 'equation-balancer', data: { reactants: ['N2', 'H2'], products: ['NH3'] } },
      { id: 's3', kind: 'practice', title: 'Balance methane burning', prompt: 'Balance carbon first, then hydrogen, then oxygen.', interactive: 'equation-balancer', data: { reactants: ['CH4', 'O2'], products: ['CO2', 'H2O'] } },
    ],
    quiz: [
      q('i7', 'Balanced? H2 + O2 -> H2O', 'mcq', 'No', ['Yes', 'No'], 'Need 2 H2O.', 1),
      q('i8', 'Coefficient for O2 in 2H2+O2->2H2O?', 'mcq', '1', ['1', '2', '3'], 'One O2.', 2),
      q('i9', 'Balancing ensures conservation of...', 'mcq', 'Mass', ['Energy', 'Mass', 'Charge'], 'Mass conserved.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 20 },
      { type: 'element', id: 'Sc' },
      { type: 'element', id: 'V' },
      { type: 'molecule', id: 'ethane' },
      { type: 'molecule', id: 'propane' },
    ],
  },
  {
    id: 'int-lab-mix', world: 'intermediate', kind: 'core', zone: 'Reaction Reef', title: 'Lab Mix', concept: 'Mix substances and observe reactions.',
    intro: cb('When substances mix, they may react to form new substances.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Neutralise', prompt: 'Mix an acid with an alkali (a base) and watch what forms.', interactive: 'lab-mix', data: { goal: 'hcl-naoh' } },
      { id: 's2', kind: 'practice', title: 'Make rust', prompt: 'Find the combination that makes iron rust.', interactive: 'lab-mix', data: { goal: 'iron-oxygen', initial: ['Fe', ''] } },
    ],
    quiz: [
      q('i10', 'Acid + base produces...', 'mcq', 'Salt + water', ['Salt + water', 'Gas only', 'Nothing'], 'Neutralization.', 1),
      q('i11', 'Rusting is a...', 'mcq', 'Oxidation', ['Oxidation', 'Reduction', 'Decomposition'], 'Iron oxidizes.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 15 },
      { type: 'element', id: 'Ga' },
      { type: 'element', id: 'Ge' },
      { type: 'element', id: 'As' },
      { type: 'molecule', id: 'sodium-hydroxide' },
      { type: 'molecule', id: 'copper-ii-hydroxide' },
    ],
  },
  {
    id: 'int-ph-slider', world: 'intermediate', kind: 'core', zone: 'Solution Springs', title: 'pH Slider', concept: 'Acids and bases on the pH scale.',
    intro: cb('pH < 7 acidic, =7 neutral, >7 basic. Lower pH = more acidic.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Match the pH', prompt: 'Move the slider to the right pH for each substance, then press Check.', interactive: 'ph-slider', data: { tasks: [
      { prompt: 'Stomach acid (pH 1–2)', min: 1, max: 2 },
      { prompt: 'Pure water (pH 7)', min: 6.95, max: 7.05 },
      { prompt: 'Baking soda solution (pH 8–9)', min: 8, max: 9 },
      { prompt: 'Drain cleaner (pH 13–14)', min: 13, max: 14 },
    ] } }],
    quiz: [
      q('i12', 'Lemon juice pH ~?', 'mcq', '2', ['2', '7', '12'], 'Lemon is acidic.', 1),
      q('i13', 'Soap pH ~?', 'mcq', '9-10', ['2', '7', '9-10'], 'Soap is basic.', 1),
      q('i14', 'pH 7 is...', 'mcq', 'Neutral', ['Acidic', 'Neutral', 'Basic'], '7 is neutral.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 15 },
      { type: 'element', id: 'Se' },
      { type: 'element', id: 'Te' },
      { type: 'molecule', id: 'sulfuric-acid' },
      { type: 'molecule', id: 'calcium-hydroxide' },
    ],
  },
  {
    id: 'int-solutions', world: 'intermediate', kind: 'core', zone: 'Solution Springs', title: 'Solutions & Solubility', concept: 'Solutes dissolve in solvents.',
    intro: cb('A solution is solute + solvent. Solubility depends on temperature.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Solute or solvent?', prompt: 'Label each one as the solute (what dissolves), the solvent (what does the dissolving) or the solution (the mixture).', interactive: 'state-sorter', data: { categories: ['Solute', 'Solvent', 'Solution'], items: [
      { label: 'Salt (in salt water)', category: 'Solute' }, { label: 'Water (in salt water)', category: 'Solvent' }, { label: 'Salt water', category: 'Solution' },
      { label: 'Sugar (in sweet tea)', category: 'Solute' }, { label: 'Sweet tea', category: 'Solution' }, { label: 'Carbon dioxide (in fizzy water)', category: 'Solute' },
    ] } }],
    quiz: [
      q('i15', 'In salt water, salt is the...', 'mcq', 'Solute', ['Solute', 'Solvent', 'Solution'], 'Salt dissolves.', 1),
      q('i16', 'Water is the...', 'mcq', 'Solvent', ['Solute', 'Solvent', 'Product'], 'Water dissolves.', 1),
      q('i17', 'Increasing temp usually...', 'mcq', 'Increases solubility of solids', ['Decreases', 'Increases solubility of solids', 'No change'], 'More heat, more dissolve.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 10 },
      { type: 'element', id: 'In' },
      { type: 'element', id: 'Sb' },
      { type: 'element', id: 'Bi' },
      { type: 'molecule', id: 'sucrose' },
    ],
  },
  {
    id: 'int-formulas', world: 'intermediate', kind: 'core', zone: 'Bond Bridge', title: 'Reading Formulas', concept: 'Subscripts and parentheses.',
    intro: cb('Parentheses group atoms; subscript outside multiplies all inside. Ca(OH)2 has 2 O and 2 H.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Brackets and coefficients', prompt: 'A subscript after brackets multiplies everything inside; a number in front multiplies the whole formula.', interactive: 'atom-counter', data: { items: [
      { formula: 'Ca(OH)2', element: 'H' }, { formula: 'Al2(SO4)3', element: 'O' }, { formula: '3H2O' },
      { formula: 'Mg(NO3)2', element: 'O' }, { formula: '2NH3', element: 'H' }, { formula: '(NH4)2SO4', element: 'H' },
    ] } }],
    quiz: [
      q('i18', 'Atoms in Ca(OH)2?', 'mcq', '5', ['3', '4', '5'], 'Ca+2O+2H=5.', 2),
      q('i19', 'Oxygen in Al2(SO4)3?', 'mcq', '12', ['4', '8', '12'], '3*4=12.', 3),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 15 },
      { type: 'element', id: 'Tl' },
      { type: 'element', id: 'Po' },
      { type: 'element', id: 'At' },
      { type: 'molecule', id: 'nitric-acid' },
    ],
  },
  {
    id: 'int-boss', world: 'intermediate', kind: 'boss', zone: 'Reaction Reef', title: 'Boss: Bond Master', concept: 'Review intermediate concepts.',
    bossRules: { lives: 3, passThreshold: 0.7 },
    intro: cb('Combine periodic table, bonds, equations, and pH knowledge!'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Stage 1: Bonds', prompt: 'Predict each bond type.', interactive: 'bond-builder', data: { pairs: [
        { a: 'Ca', b: 'Cl', answer: 'ionic' }, { a: 'O', b: 'O', answer: 'covalent' }, { a: 'Fe', b: 'Fe', answer: 'metallic' }, { a: 'C', b: 'H', answer: 'covalent' },
      ] } },
      { id: 's2', kind: 'practice', title: 'Stage 2: Balance salt', prompt: 'Balance the formation of table salt.', interactive: 'equation-balancer', data: { reactants: ['Na', 'Cl2'], products: ['NaCl'] } },
      { id: 's3', kind: 'practice', title: 'Stage 3: pH', prompt: 'Set the right pH.', interactive: 'ph-slider', data: { tasks: [
        { prompt: 'Vinegar (pH 2–3)', min: 2, max: 3 }, { prompt: 'Soap (pH 9–10)', min: 9, max: 10 },
      ] } },
      { id: 's4', kind: 'practice', title: 'Stage 4: Fizz', prompt: 'Make baking soda fizz.', interactive: 'lab-mix', data: { goal: 'bicarb-hcl' } },
    ],
    quiz: [
      q('ib1', 'Bond in MgO?', 'mcq', 'Ionic', ['Ionic', 'Covalent', 'Metallic'], 'Metal+nonmetal.', 1),
      q('ib2', 'Balance: N2+H2->NH3', 'mcq', 'N2+3H2->2NH3', ['N2+H2->NH3', 'N2+3H2->2NH3', 'N2+2H2->2NH3'], 'Standard Haber.', 2),
      q('ib3', 'pH of base?', 'mcq', '>7', ['<7', '=7', '>7'], 'Basic pH >7.', 1),
      q('ib4', 'Groups are...', 'mcq', 'Columns', ['Rows', 'Columns', 'Diagonals'], 'Columns.', 1),
      q('ib5', 'Which pair forms a covalent bond?', 'mcq', 'C and O', ['Na and Cl', 'C and O', 'Mg and O'], 'Two nonmetals share electrons.', 1),
      q('ib6', 'Baking soda + acid gives off which gas?', 'mcq', 'Carbon dioxide', ['Oxygen', 'Hydrogen', 'Carbon dioxide'], 'Carbonates and hydrogencarbonates fizz with acids, releasing CO2.', 2),
      q('ib7', 'A solution with pH 3 is...', 'mcq', 'Acidic', ['Acidic', 'Neutral', 'Basic'], 'Below 7 is acidic.', 1),
      q('ib8', 'Which element is in group 18?', 'mcq', 'Argon', ['Argon', 'Sodium', 'Iron'], 'Group 18 holds the noble gases.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 40 },
      { type: 'badge', id: 'bond-master' },
      { type: 'element', id: 'Mo' },
      { type: 'element', id: 'Tc' },
      { type: 'element', id: 'Ru' },
      { type: 'molecule', id: 'caffeine' },
    ],
  },

  {
    id: 'int-miniboss', world: 'intermediate', kind: 'miniboss', zone: 'Bond Bridge', title: 'Mini-Boss: Formula Forge', concept: 'A timed test of formulas, bonds and balancing.',
    bossRules: { timeLimitSec: 150, passThreshold: 0.7 },
    intro: cb('The Formula Forge runs hot! Count atoms in tricky formulas, balance an equation and build a compound, then race the clock.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Tricky formulas', prompt: 'Count carefully: brackets and coefficients multiply.', interactive: 'atom-counter', data: { items: [
        { formula: 'Ca(OH)2' }, { formula: '2Al2O3', element: 'O' }, { formula: 'Fe2(SO4)3', element: 'S' },
      ] } },
      { id: 's2', kind: 'practice', title: 'Balance aluminium oxide', prompt: 'Balance the equation for aluminium reacting with oxygen.', interactive: 'equation-balancer', data: { reactants: ['Al', 'O2'], products: ['Al2O3'] } },
      { id: 's3', kind: 'practice', title: 'Forge slaked lime', prompt: 'Build calcium hydroxide, Ca(OH)2.', interactive: 'molecule-maker', data: { target: 'Ca(OH)2' } },
    ],
    quiz: [
      q('im1', 'How many oxygen atoms are in Ca(NO3)2?', 'mcq', '6', ['3', '5', '6'], 'The 2 multiplies everything in the brackets: 2 × 3 = 6.', 2),
      q('im2', 'Which coefficients balance _H2 + _Cl2 → _HCl?', 'mcq', '1, 1, 2', ['1, 1, 1', '1, 1, 2', '2, 1, 2'], 'H2 + Cl2 → 2HCl.', 1),
      q('im3', 'The bond in potassium chloride (KCl) is...', 'mcq', 'Ionic', ['Ionic', 'Covalent', 'Metallic'], 'A metal gives an electron to a nonmetal.', 1),
      q('im4', 'Which is a base?', 'mcq', 'Sodium hydroxide', ['Hydrochloric acid', 'Sodium hydroxide', 'Vinegar'], 'NaOH is a strong base (an alkali).', 1),
      q('im5', 'In 3CO2, how many atoms are there in total?', 'mcq', '9', ['3', '6', '9'], '3 × (1 C + 2 O) = 9.', 2),
      q('im6', 'Which group contains the noble gases?', 'mcq', 'Group 18', ['Group 1', 'Group 17', 'Group 18'], 'The noble gases fill the last column.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 30 },
      { type: 'badge', id: 'formula-forge' },
      { type: 'element', id: 'Y' },
      { type: 'element', id: 'Zr' },
      { type: 'element', id: 'Nb' },
      { type: 'molecule', id: 'butane' },
    ],
  },
  {
    id: 'int-clinic', world: 'intermediate', kind: 'remediation', zone: 'Reaction Reef', title: 'Bond & Balance Clinic', concept: 'Revisit the intermediate questions you found tricky.',
    remediates: ['int-periodic-explorer', 'int-bond-builder', 'int-equation-balancer', 'int-lab-mix', 'int-ph-slider', 'int-solutions', 'int-formulas', 'int-miniboss', 'int-boss'],
    intro: cb('The Bond & Balance Clinic brings back the intermediate questions you missed, with explanations, so nothing stays shaky.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Bond warm-up', prompt: 'Predict each bond type.', interactive: 'bond-builder', data: { pairs: [
        { a: 'Li', b: 'F', answer: 'ionic' }, { a: 'Cl', b: 'Cl', answer: 'covalent' }, { a: 'Zn', b: 'Zn', answer: 'metallic' },
      ] } },
    ],
    quiz: [
      q('ic1', 'Ionic bonds usually form between...', 'mcq', 'A metal and a nonmetal', ['Two nonmetals', 'A metal and a nonmetal', 'Two metals'], 'The metal gives electrons to the nonmetal.', 1),
      q('ic2', 'Covalent bonds involve...', 'mcq', 'Sharing electrons', ['Transferring electrons', 'Sharing electrons', 'A sea of electrons'], 'Nonmetal atoms share pairs of electrons.', 1),
      q('ic3', 'A balanced equation has the same number of ... on each side.', 'mcq', 'Atoms of each element', ['Molecules', 'Atoms of each element', 'Coefficients'], 'Atoms are rearranged, never created or destroyed.', 2),
      q('ic4', 'A pH of 12 is...', 'mcq', 'Basic', ['Acidic', 'Neutral', 'Basic'], 'Above 7 is basic (alkaline).', 1),
      q('ic5', 'Elements in the same group have the same number of...', 'mcq', 'Outer-shell electrons', ['Protons', 'Neutrons', 'Outer-shell electrons'], 'That is why they react in similar ways.', 2),
      q('ic6', 'Acid + metal carbonate gives a salt + water + ...', 'mcq', 'Carbon dioxide', ['Oxygen', 'Hydrogen', 'Carbon dioxide'], 'The carbonate releases CO2, which fizzes.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 20 },
      { type: 'badge', id: 'balance-clinic' },
      { type: 'element', id: 'Rh' },
      { type: 'element', id: 'Pd' },
      { type: 'element', id: 'Cd' },
      { type: 'molecule', id: 'chloroform' },
    ],
  },

  // ---------- ADVANCED ----------
  {
    id: 'adv-stoich', world: 'advanced', kind: 'core', zone: 'Stoichiometry Station', title: 'Stoichiometry Lab', concept: 'Mole ratios and limiting reactants.',
    intro: cb('Use balanced equations to convert between masses of reactants and products.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Mole problems', prompt: 'Use n = m ÷ M and m = n × M. Answers within 2% count.', interactive: 'stoichiometry', data: { problems: [
      { formula: 'H2O', mass: 36, find: 'moles' },
      { formula: 'CO2', moles: 2, find: 'mass' },
      { formula: 'NaCl', mass: 11.69, find: 'moles' },
      { formula: 'C6H12O6', moles: 0.5, find: 'mass' },
      { formula: 'H2O', moles: 1, find: 'particles' },
    ] } }],
    quiz: [
      q('a1', 'Moles in 18g water? (M=18)', 'mcq', '1 mol', ['0.5 mol', '1 mol', '2 mol'], '18/18=1.', 1),
      q('a2', 'Limiting reactant is...', 'mcq', 'Used up first', ['Most abundant', 'Used up first', 'Heaviest'], 'Limits product.', 2),
      q('a3', '2H2+O2->2H2O: 4g H2 makes how many g water? (M H2=2, H2O=18)', 'mcq', '36g', ['18g', '36g', '72g'], '2 mol H2 -> 2 mol water =36g.', 3),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 20 },
      { type: 'element', id: 'Hf' },
      { type: 'element', id: 'Ta' },
      { type: 'element', id: 'W' },
      { type: 'molecule', id: 'octane' },
    ],
  },
  {
    id: 'adv-reaction-classifier', world: 'advanced', kind: 'core', zone: 'Reaction Reef', title: 'Reaction Classifier', concept: 'Types of reactions.',
    intro: cb('Synthesis, decomposition, single/double replacement, combustion.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Classify', prompt: 'Identify the type of each reaction.', interactive: 'reaction-classifier', data: { items: [
      { equation: '2H2 + O2 → 2H2O', answer: 'Synthesis' },
      { equation: '2H2O2 → 2H2O + O2', answer: 'Decomposition' },
      { equation: 'Zn + 2HCl → ZnCl2 + H2', answer: 'Single replacement', explanation: 'Zinc takes the place of hydrogen.' },
      { equation: 'CuSO4 + 2NaOH → Cu(OH)2 + Na2SO4', answer: 'Double replacement', explanation: 'The two compounds swap partners.' },
      { equation: 'CH4 + 2O2 → CO2 + 2H2O', answer: 'Combustion' },
      { equation: 'CaCO3 → CaO + CO2', answer: 'Decomposition' },
    ] } }],
    quiz: [
      q('a4', '2H2+O2->2H2O is...', 'mcq', 'Synthesis', ['Synthesis', 'Decomposition', 'Combustion'], 'Combining.', 1),
      q('a5', '2H2O->2H2+O2 is...', 'mcq', 'Decomposition', ['Synthesis', 'Decomposition', 'Combustion'], 'Splitting.', 1),
      q('a6', 'CH4+2O2->CO2+2H2O is...', 'mcq', 'Combustion', ['Synthesis', 'Decomposition', 'Combustion'], 'Burning.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 15 },
      { type: 'element', id: 'Re' },
      { type: 'element', id: 'Os' },
      { type: 'molecule', id: 'carbon-monoxide' },
    ],
  },
  {
    id: 'adv-gas-law', world: 'advanced', kind: 'core', zone: 'Gas Lab', title: 'Gas Law Sandbox', concept: 'Boyle and Charles laws.',
    intro: cb('At constant T, P inversely proportional to V (Boyle). At constant P, V proportional to T (Charles).'),
    steps: [{ id: 's1', kind: 'practice', title: 'Gas law problems', prompt: 'Use Boyle\'s law, Charles\'s law and PV = nRT. Temperatures are in kelvin.', interactive: 'gas-law', data: { problems: [
      { law: 'boyle', p1: 1, v1: 6, p2: 2 },
      { law: 'charles', v1: 2, t1: 300, t2: 450 },
      { law: 'ideal', n: 1, v: 22.4, t: 273 },
      { law: 'boyle', p1: 2, v1: 5, p2: 0.5 },
    ] } }],
    quiz: [
      q('a7', 'Boyle: if volume halves, pressure...', 'mcq', 'Doubles', ['Halves', 'Doubles', 'Unchanged'], 'Inverse.', 1),
      q('a8', 'Charles: heat gas at constant P, volume...', 'mcq', 'Increases', ['Decreases', 'Increases', 'Unchanged'], 'Direct with T.', 1),
      q('a9', 'Gas law temperatures must be in...', 'mcq', 'Kelvin', ['Celsius', 'Kelvin', 'Fahrenheit'], 'Absolute scale.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 15 },
      { type: 'element', id: 'Ir' },
      { type: 'element', id: 'Pt' },
      { type: 'molecule', id: 'ethyne' },
    ],
  },
  {
    id: 'adv-organic', world: 'advanced', kind: 'core', zone: 'Carbon Corner', title: 'Organic Builder', concept: 'Hydrocarbons and functional groups.',
    intro: cb('Organic chemistry studies carbon compounds. Methane CH4, ethanol C2H5OH.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Functional groups', prompt: 'Pick the molecule that belongs to each family.', interactive: 'organic-builder', data: { tasks: [
      { prompt: 'Pick an alkane (only single C–C bonds).', subcategory: 'alkane' },
      { prompt: 'Pick the alcohol (an –OH group).', subcategory: 'alcohol' },
      { prompt: 'Pick the carboxylic acid (a –COOH group).', subcategory: 'carboxylic acid' },
      { prompt: 'Pick the ester (a –COO– link).', subcategory: 'ester' },
      { prompt: 'Pick the alkene (a C=C double bond).', subcategory: 'alkene' },
    ] } }],
    quiz: [
      q('a10', 'Methane formula?', 'mcq', 'CH4', ['CH4', 'C2H6', 'C2H5OH'], 'Methane is CH4.', 1),
      q('a11', 'Ethanol contains which functional group?', 'mcq', 'Hydroxyl (-OH)', ['Carboxyl', 'Hydroxyl (-OH)', 'Amino'], 'Alcohol has -OH.', 2),
      q('a12', 'Hydrocarbons contain...', 'mcq', 'C and H', ['C and O', 'C and H', 'N and H'], 'Carbon + hydrogen.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 15 },
      { type: 'element', id: 'La' },
      { type: 'element', id: 'Ce' },
      { type: 'molecule', id: 'ethene' },
      { type: 'molecule', id: 'benzene' },
      { type: 'molecule', id: 'methanol' },
      { type: 'molecule', id: 'acetic-acid' },
    ],
  },
  {
    id: 'adv-redox', world: 'advanced', kind: 'core', zone: 'Electron Exchange', title: 'Redox Detective', concept: 'Oxidation states and electron transfer.',
    intro: cb('Oxidation is loss of electrons; reduction is gain. Track oxidation numbers.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Assign oxidation states', prompt: 'Type each oxidation state with its sign, e.g. +3 or -2.', interactive: 'redox', data: { items: [
      { element: 'O', compound: 'H2O', answer: -2 }, { element: 'H', compound: 'H2O', answer: 1 },
      { element: 'Na', compound: 'NaCl', answer: 1 }, { element: 'Cl', compound: 'NaCl', answer: -1 },
      { element: 'Fe', compound: 'Fe2O3', answer: 3 }, { element: 'S', compound: 'H2SO4', answer: 6 },
      { element: 'C', compound: 'CO2', answer: 4 }, { element: 'Mg', compound: 'Mg', answer: 0 },
    ] } }],
    quiz: [
      q('a13', 'In H2O, oxidation state of O?', 'mcq', '-2', ['-2', '-1', '0', '+2'], 'Oxygen usually -2.', 1),
      q('a14', 'Oxidation means...', 'mcq', 'Loss of electrons', ['Loss of electrons', 'Gain of electrons', 'No change'], 'OIL RIG: Oxidation Is Loss.', 1),
      q('a15', 'In 2Na+Cl2->2NaCl, Na is...', 'mcq', 'Oxidized', ['Oxidized', 'Reduced', 'Unchanged'], 'Na loses electron.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 20 },
      { type: 'element', id: 'Pr' },
      { type: 'element', id: 'Nd' },
      { type: 'element', id: 'Pm' },
      { type: 'molecule', id: 'acetone' },
    ],
  },
  {
    id: 'adv-boss', world: 'advanced', kind: 'boss', zone: 'Stoichiometry Station', title: 'Boss: Reaction Master', concept: 'Review advanced concepts.',
    bossRules: { lives: 3, passThreshold: 0.7 },
    intro: cb('Combine stoichiometry, reactions, gas laws, organic, and redox!'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Stage 1: Moles', prompt: 'Solve the mole problems.', interactive: 'stoichiometry', data: { problems: [
        { formula: 'O2', mass: 64, find: 'moles' }, { formula: 'NH3', moles: 3, find: 'mass' },
      ] } },
      { id: 's2', kind: 'practice', title: 'Stage 2: Reaction types', prompt: 'Classify each reaction.', interactive: 'reaction-classifier', data: { items: [
        { equation: '2Mg + O2 → 2MgO', answer: 'Synthesis' }, { equation: 'C2H5OH + 3O2 → 2CO2 + 3H2O', answer: 'Combustion' }, { equation: '2Na + 2H2O → 2NaOH + H2', answer: 'Single replacement' },
      ] } },
      { id: 's3', kind: 'practice', title: 'Stage 3: Gases', prompt: 'Solve the gas problems.', interactive: 'gas-law', data: { problems: [
        { law: 'charles', v1: 3, t1: 250, t2: 500 }, { law: 'ideal', n: 2, v: 10, t: 300 },
      ] } },
      { id: 's4', kind: 'practice', title: 'Stage 4: Redox', prompt: 'Assign oxidation states.', interactive: 'redox', data: { items: [
        { element: 'N', compound: 'NH3', answer: -3 }, { element: 'Cu', compound: 'CuSO4', answer: 2 }, { element: 'O', compound: 'O2', answer: 0 },
      ] } },
    ],
    quiz: [
      q('ab1', 'Moles in 32g O2? (M=32)', 'mcq', '1 mol', ['0.5 mol', '1 mol', '2 mol'], '32/32=1.', 1),
      q('ab2', 'Combustion requires...', 'mcq', 'Oxygen', ['Nitrogen', 'Oxygen', 'Hydrogen'], 'Burning needs O2.', 1),
      q('ab3', 'If T increases at constant V, P...', 'mcq', 'Increases', ['Decreases', 'Increases', 'Unchanged'], 'Gay-Lussac.', 2),
      q('ab4', 'Oxidation state of H in H2O?', 'mcq', '+1', ['-1', '0', '+1'], 'H is +1 with O.', 1),
      q('ab5', 'Mass of 2 mol of water? (M = 18 g/mol)', 'mcq', '36 g', ['9 g', '18 g', '36 g'], 'm = n × M = 2 × 18 g.', 1),
      q('ab6', 'Zn + 2HCl → ZnCl2 + H2 is a...', 'mcq', 'Single replacement', ['Synthesis', 'Single replacement', 'Double replacement'], 'Zinc takes the place of hydrogen.', 2),
      q('ab7', 'Halving the volume of a gas at constant temperature makes its pressure...', 'mcq', 'Double', ['Halve', 'Double', 'Stay the same'], "Boyle's law: P1V1 = P2V2.", 2),
      q('ab8', 'Oxidation state of S in H2SO4?', 'mcq', '+6', ['+4', '+6', '-2'], '2(+1) + S + 4(−2) = 0, so S = +6.', 3),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 50 },
      { type: 'badge', id: 'reaction-master' },
      { type: 'element', id: 'Sm' },
      { type: 'element', id: 'Eu' },
      { type: 'element', id: 'Gd' },
      { type: 'molecule', id: 'ethyl-acetate' },
      { type: 'molecule', id: 'methylamine' },
    ],
  },

  {
    id: 'adv-polymers', world: 'advanced', kind: 'core', zone: 'Carbon Corner', title: 'Polymer Workshop', concept: 'Polymers are long chains built from small monomers.',
    intro: cb('Addition polymers form when monomers with a C=C double bond join into a chain (ethene → polyethylene). Condensation polymers join two different monomers and release a small molecule such as water (PET, nylon). Living things make natural polymers too: starch, cellulose and rubber.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Monomers and polymers', prompt: 'Use the chain builder, then answer the questions.', interactive: 'polymer-builder', data: { tasks: [
        { ask: 'monomer', polymer: 'polyethylene' }, { ask: 'monomer', polymer: 'pvc' }, { ask: 'type', polymer: 'pet' },
        { ask: 'type', polymer: 'polystyrene' }, { ask: 'type', polymer: 'cellulose' }, { ask: 'recycling', polymer: 'polypropylene' },
        { ask: 'recycling', polymer: 'polystyrene' }, { ask: 'chain-mass', polymer: 'polyethylene', n: 1000 },
      ] } },
      { id: 's2', kind: 'practice', title: 'Sort the polymers', prompt: 'Addition, condensation or natural?', interactive: 'sorter', data: { categories: ['Addition polymer', 'Condensation polymer', 'Natural polymer'], items: [
        { label: 'PTFE', category: 'Addition polymer' }, { label: 'Nylon-6,6', category: 'Condensation polymer' }, { label: 'Starch', category: 'Natural polymer' },
        { label: 'Polypropylene', category: 'Addition polymer' }, { label: 'PET', category: 'Condensation polymer' }, { label: 'Natural rubber', category: 'Natural polymer' },
      ] } },
    ],
    quiz: [
      q('ap1', 'Polyethylene is made from which monomer?', 'mcq', 'Ethene', ['Methane', 'Ethene', 'Ethanol'], "Ethene's C=C double bond opens up so the molecules can join.", 1),
      q('ap2', 'A condensation polymerisation also produces...', 'mcq', 'A small molecule such as water', ['Oxygen gas', 'A small molecule such as water', 'Nothing else'], 'Each new link releases a small molecule, usually water.', 2),
      q('ap3', 'Which polymer makes non-stick coatings?', 'mcq', 'PTFE', ['PVC', 'PTFE', 'PET'], 'Strong C–F bonds make PTFE slippery and unreactive.', 1),
      q('ap4', 'Starch and cellulose are both made from...', 'mcq', 'Glucose', ['Glucose', 'Ethene', 'Amino acids'], 'They differ only in how the glucose units are linked.', 2),
      q('ap5', 'Drink bottles marked ♻ 1 are made of...', 'mcq', 'PET', ['PET', 'Polystyrene', 'PVC'], 'Code 1 is PET (polyethylene terephthalate).', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 20 },
      { type: 'element', id: 'Tb' },
      { type: 'element', id: 'Dy' },
      { type: 'molecule', id: 'polyethylene' },
      { type: 'molecule', id: 'polypropylene' },
      { type: 'molecule', id: 'pvc' },
      { type: 'molecule', id: 'polystyrene' },
      { type: 'molecule', id: 'ptfe' },
      { type: 'molecule', id: 'pet' },
      { type: 'molecule', id: 'nylon-6-6' },
    ],
  },
  {
    id: 'adv-biomolecules', world: 'advanced', kind: 'core', zone: 'Life Lab', title: 'Biomolecule Builder', concept: 'Carbohydrates, proteins, lipids and nucleic acids are built from a few kinds of small molecules.',
    intro: cb('Life runs on four families of molecules: carbohydrates (sugars such as glucose), proteins (chains of amino acids), lipids (fats, fatty acids and steroids) and nucleic acids (DNA and RNA, built from bases such as adenine). ATP carries energy around the cell.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Families of life', prompt: 'Put each biomolecule in its family.', interactive: 'sorter', data: { categories: ['Carbohydrate', 'Amino acid', 'Lipid', 'Nucleotide or base'], items: [
        { label: 'Glucose', category: 'Carbohydrate' }, { label: 'Sucrose', category: 'Carbohydrate' }, { label: 'Glycine', category: 'Amino acid' }, { label: 'Alanine', category: 'Amino acid' },
        { label: 'Cholesterol', category: 'Lipid' }, { label: 'Palmitic acid', category: 'Lipid' }, { label: 'Adenine', category: 'Nucleotide or base' }, { label: 'ATP', category: 'Nucleotide or base' },
      ] } },
      { id: 's2', kind: 'practice', title: 'Build an amino acid', prompt: 'Build glycine, the simplest amino acid: C2H5NO2.', interactive: 'molecule-maker', data: { target: 'C2H5NO2' } },
      { id: 's3', kind: 'practice', title: 'Base pairs', prompt: 'In DNA, each base always pairs with the same partner. Match them.', interactive: 'sorter', data: { categories: ['Pairs with thymine', 'Pairs with cytosine', 'Pairs with adenine', 'Pairs with guanine'], items: [
        { label: 'Adenine', category: 'Pairs with thymine' }, { label: 'Guanine', category: 'Pairs with cytosine' },
        { label: 'Thymine', category: 'Pairs with adenine' }, { label: 'Cytosine', category: 'Pairs with guanine' },
      ] } },
    ],
    quiz: [
      q('al1', 'Which molecule is the energy currency of cells?', 'mcq', 'ATP', ['Glucose', 'ATP', 'Cholesterol'], 'Removing a phosphate from ATP releases energy.', 1),
      q('al2', 'Proteins are chains of...', 'mcq', 'Amino acids', ['Sugars', 'Amino acids', 'Fatty acids'], 'Amino acids link by peptide bonds.', 1),
      q('al3', 'In DNA, adenine pairs with...', 'mcq', 'Thymine', ['Guanine', 'Cytosine', 'Thymine'], 'A pairs with T; G pairs with C.', 1),
      q('al4', 'Which element is in every amino acid but not in glucose?', 'mcq', 'Nitrogen', ['Carbon', 'Oxygen', 'Nitrogen'], 'Amino acids have an amino (–NH2) group.', 2),
      q('al5', 'Sucrose (table sugar) is glucose joined to...', 'mcq', 'Fructose', ['Fructose', 'Glycine', 'Urea'], 'Sucrose is a disaccharide of glucose and fructose.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 20 },
      { type: 'element', id: 'Ho' },
      { type: 'element', id: 'Er' },
      { type: 'molecule', id: 'glycine' },
      { type: 'molecule', id: 'alanine' },
      { type: 'molecule', id: 'adenine' },
      { type: 'molecule', id: 'guanine' },
      { type: 'molecule', id: 'cytosine' },
      { type: 'molecule', id: 'thymine' },
    ],
  },
  {
    id: 'adv-miniboss', world: 'advanced', kind: 'miniboss', zone: 'Stoichiometry Station', title: 'Mini-Boss: Mole Marathon', concept: 'A timed run through moles, gases and oxidation states.',
    bossRules: { timeLimitSec: 180, passThreshold: 0.7 },
    intro: cb('The Mole Marathon is a race: warm up with moles, gases and oxidation states, then beat the clock.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Moles', prompt: 'Mass ↔ moles.', interactive: 'stoichiometry', data: { problems: [{ formula: 'CH4', mass: 32, find: 'moles' }, { formula: 'NaOH', moles: 0.25, find: 'mass' }] } },
      { id: 's2', kind: 'practice', title: 'Gas squeeze', prompt: "Boyle's law.", interactive: 'gas-law', data: { problems: [{ law: 'boyle', p1: 3, v1: 4, p2: 6 }] } },
      { id: 's3', kind: 'practice', title: 'Oxidation states', prompt: 'Assign oxidation states.', interactive: 'redox', data: { items: [{ element: 'Fe', compound: 'FeCl3', answer: 3 }, { element: 'N', compound: 'HNO3', answer: 5 }] } },
    ],
    quiz: [
      q('am1', 'How many moles are in 88 g of CO2 (M = 44 g/mol)?', 'mcq', '2 mol', ['0.5 mol', '2 mol', '44 mol'], 'n = 88 ÷ 44 = 2.', 1),
      q('am2', 'At constant pressure, heating a gas from 300 K to 600 K makes its volume...', 'mcq', 'Double', ['Halve', 'Double', 'Stay the same'], "Charles's law: V is proportional to T in kelvin.", 2),
      q('am3', 'CH4 + 2O2 → CO2 + 2H2O is a...', 'mcq', 'Combustion', ['Synthesis', 'Decomposition', 'Combustion'], 'A fuel burning in oxygen.', 1),
      q('am4', 'Oxidation state of N in NH3?', 'mcq', '-3', ['-3', '+3', '0'], 'H is +1, so N + 3(+1) = 0.', 2),
      q('am5', 'How many molecules are in 2 mol of water?', 'mcq', '1.2 × 10²⁴', ['6.0 × 10²³', '1.2 × 10²⁴', '2'], '2 × 6.02 × 10²³ ≈ 1.2 × 10²⁴.', 2),
      q('am6', 'Which group makes a molecule an alcohol?', 'mcq', '–OH', ['–COOH', '–OH', '–NH2'], 'Alcohols have a hydroxyl group.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 35 },
      { type: 'badge', id: 'mole-marathon' },
      { type: 'element', id: 'Tm' },
      { type: 'element', id: 'Yb' },
      { type: 'molecule', id: 'ethanol' },
    ],
  },
  {
    id: 'adv-clinic', world: 'advanced', kind: 'remediation', zone: 'Electron Exchange', title: 'Reaction Clinic', concept: 'Revisit the advanced questions you found tricky.',
    remediates: ['adv-stoich', 'adv-reaction-classifier', 'adv-gas-law', 'adv-organic', 'adv-redox', 'adv-polymers', 'adv-biomolecules', 'adv-miniboss', 'adv-boss'],
    intro: cb('The Reaction Clinic brings back the advanced questions you missed, with their worked explanations.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Reaction warm-up', prompt: 'Classify these reactions.', interactive: 'reaction-classifier', data: { items: [
        { equation: 'N2 + 3H2 → 2NH3', answer: 'Synthesis' }, { equation: 'AgNO3 + NaCl → AgCl + NaNO3', answer: 'Double replacement' },
      ] } },
    ],
    quiz: [
      q('ac1', 'In n = m ÷ M, what is M?', 'mcq', 'Molar mass', ['Mass', 'Molar mass', 'Moles'], 'M is the mass of one mole, in g/mol.', 1),
      q('ac2', 'Zn + CuSO4 → ZnSO4 + Cu is a...', 'mcq', 'Single replacement', ['Synthesis', 'Single replacement', 'Double replacement'], 'Zinc takes the place of copper.', 2),
      q('ac3', "Boyle's law says that at constant temperature...", 'mcq', 'Pressure × volume is constant', ['Pressure ÷ volume is constant', 'Pressure × volume is constant', 'Volume ÷ temperature is constant'], 'Squeeze a gas into half the volume and its pressure doubles.', 2),
      q('ac4', 'Oxidation is...', 'mcq', 'Loss of electrons', ['Gain of electrons', 'Loss of electrons', 'Gain of protons'], 'OIL RIG: oxidation is loss, reduction is gain.', 1),
      q('ac5', 'Which of these is a hydrocarbon?', 'mcq', 'Propane', ['Ethanol', 'Propane', 'Acetic acid'], 'Hydrocarbons contain only carbon and hydrogen.', 1),
      q('ac6', 'PVC, polystyrene and polyethylene are all...', 'mcq', 'Addition polymers', ['Condensation polymers', 'Addition polymers', 'Natural polymers'], 'Their monomers each have a C=C double bond.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 20 },
      { type: 'badge', id: 'reaction-clinic' },
      { type: 'element', id: 'Lu' },
      { type: 'molecule', id: 'formaldehyde' },
    ],
  },

  // ---------- EXPERT ----------
  {
    id: 'exp-equilibrium', world: 'expert', kind: 'core', zone: 'Equilibrium Bay', title: 'Equilibrium Slider', concept: 'Le Chatelier and K.',
    intro: cb('At equilibrium, forward and reverse rates equal. K = [products]/[reactants].'),
    steps: [{ id: 's1', kind: 'practice', title: 'Shift the equilibrium', prompt: 'Predict how each change moves the Haber-process equilibrium.', interactive: 'equilibrium', data: { reaction: 'N2 + 3H2 ⇌ 2NH3 (ΔH < 0, exothermic)', scenarios: [
      { change: 'Add more N₂', answer: 'Toward products', explanation: 'Adding a reactant shifts the system to use it up.' },
      { change: 'Remove NH₃ as it forms', answer: 'Toward products', explanation: 'Removing a product pulls the reaction forward.' },
      { change: 'Increase the pressure', answer: 'Toward products', explanation: 'The product side has fewer gas molecules (2 vs 4).' },
      { change: 'Raise the temperature', answer: 'Toward reactants', explanation: 'The forward reaction is exothermic, so heating favours the reverse reaction.' },
      { change: 'Add an iron catalyst', answer: 'No shift', explanation: 'A catalyst speeds up both directions equally: equilibrium is reached faster but does not move.' },
    ] } }],
    quiz: [
      q('e1', 'K > 1 means...', 'mcq', 'Products favored', ['Reactants favored', 'Products favored', 'Equal'], 'More products.', 1),
      q('e2', 'Add reactant, equilibrium shifts...', 'mcq', 'Toward products', ['Toward reactants', 'Toward products', 'No change'], 'Le Chatelier.', 2),
      q('e3', 'Increase pressure favors side with...', 'mcq', 'Fewer gas moles', ['More gas moles', 'Fewer gas moles', 'No change'], 'Less volume.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 25 },
      { type: 'element', id: 'Ac' },
      { type: 'element', id: 'Th' },
      { type: 'molecule', id: 'urea' },
    ],
  },
  {
    id: 'exp-thermo', world: 'expert', kind: 'core', zone: 'Energy Lab', title: 'Energy Landscape', concept: 'ΔG = ΔH - TΔS.',
    intro: cb('Gibbs free energy determines spontaneity. ΔG<0 spontaneous.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Compute ΔG', prompt: 'Calculate ΔG = ΔH − TΔS in kJ/mol (remember to convert ΔS to kJ).', interactive: 'thermo', data: { problems: [
      { dH: -100, dS: 200, T: 300 },
      { dH: 50, dS: 100, T: 300 },
      { dH: 50, dS: 100, T: 600, label: 'Same reaction, hotter' },
      { dH: -20, dS: -100, T: 298 },
    ] } }],
    quiz: [
      q('e4', 'ΔG = ΔH - TΔS. If ΔH=-100kJ, ΔS=0.2kJ/K, T=300K, ΔG?', 'mcq', '-160 kJ', ['-40 kJ', '-160 kJ', '160 kJ'], '-100-60=-160.', 2),
      q('e5', 'Spontaneous when ΔG...', 'mcq', '< 0', ['> 0', '= 0', '< 0'], 'Negative ΔG.', 1),
      q('e6', 'Endothermic reaction has ΔH...', 'mcq', '>0', ['<0', '>0', '=0'], 'Absorbs heat.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 25 },
      { type: 'element', id: 'Pa' },
      { type: 'element', id: 'U' },
      { type: 'molecule', id: 'atp' },
    ],
  },
  {
    id: 'exp-kinetics', world: 'expert', kind: 'core', zone: 'Rate Lab', title: 'Rate Lab', concept: 'Rate laws and activation energy.',
    intro: cb('Rate = k[A]^m[B]^n. Temperature increases rate via Arrhenius.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Rate laws', prompt: 'Work out how the rate changes when the concentration changes.', interactive: 'kinetics', data: { problems: [
      { order: 1, factor: 2 }, { order: 2, factor: 2 }, { order: 0, factor: 3 }, { order: 1, factor: 3 }, { order: 2, factor: 0.5 },
    ] } }],
    quiz: [
      q('e7', 'Catalyst...', 'mcq', 'Lowers activation energy', ['Raises activation energy', 'Lowers activation energy', 'Changes ΔG'], 'Catalysts speed up.', 1),
      q('e8', 'If [A] doubles and order=1, rate...', 'mcq', 'Doubles', ['Halves', 'Doubles', 'Quadruples'], 'First order.', 2),
      q('e9', 'Higher temperature generally...', 'mcq', 'Increases rate', ['Decreases rate', 'Increases rate', 'No effect'], 'More collisions.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 25 },
      { type: 'element', id: 'Np' },
      { type: 'element', id: 'Pu' },
      { type: 'molecule', id: 'starch' },
    ],
  },
  {
    id: 'exp-cell-builder', world: 'expert', kind: 'core', zone: 'Electro Bay', title: 'Cell Builder', concept: 'Galvanic cells and E°cell.',
    intro: cb('E°cell = E°cathode - E°anode. ΔG = -nFE°cell.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Cell potentials', prompt: 'Use E°cell = E°cathode − E°anode.', interactive: 'cell-builder', data: { problems: [
      { cathode: 'Cu', anode: 'Zn' }, { cathode: 'Ag', anode: 'Cu' }, { cathode: 'Cu', anode: 'Mg' }, { cathode: 'Ag', anode: 'Zn' },
    ] } }],
    quiz: [
      q('e10', 'E°cell positive means...', 'mcq', 'Spontaneous', ['Spontaneous', 'Non-spontaneous', 'Equilibrium'], 'Galvanic.', 1),
      q('e11', 'Oxidation occurs at...', 'mcq', 'Anode', ['Anode', 'Cathode', 'Salt bridge'], 'Anode oxidation.', 1),
      q('e12', 'E°cell = E°cathode - ...', 'mcq', 'E°anode', ['E°reactant', 'E°anode', 'E°product'], 'Standard formula.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 25 },
      { type: 'element', id: 'Am' },
      { type: 'element', id: 'Cm' },
      { type: 'molecule', id: 'natural-rubber' },
    ],
  },
  {
    id: 'exp-decay', world: 'expert', kind: 'core', zone: 'Nuclear Nook', title: 'Decay Timer', concept: 'Half-life calculations.',
    intro: cb('N = N0 (1/2)^(t/t_half). Calculate remaining amount.'),
    steps: [{ id: 's1', kind: 'practice', title: 'Half-life problems', prompt: 'Use N = N₀ × (½)^(t ÷ t½). Answers within 2% count.', interactive: 'decay', data: { problems: [
      { n0: 100, halfLife: 5730, t: 11460, unit: 'years', quantity: 'g' },
      { n0: 80, halfLife: 8, t: 24, unit: 'days', quantity: 'mg' },
      { n0: 1000, halfLife: 2, t: 5, unit: 'hours', quantity: 'atoms' },
      { n0: 64, halfLife: 10, t: 60, unit: 'minutes', quantity: 'g' },
    ] } }],
    quiz: [
      q('e13', 'After 1 half-life, remaining?', 'mcq', '50%', ['25%', '50%', '75%'], 'Half.', 1),
      q('e14', 'After 3 half-lives?', 'mcq', '12.5%', ['25%', '12.5%', '6.25%'], '1/8.', 2),
      q('e15', 'Half-life of C-14?', 'mcq', '~5730 years', ['~100 years', '~5730 years', '~1 million years'], 'Carbon-14.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 25 },
      { type: 'element', id: 'Bk' },
      { type: 'element', id: 'Cf' },
      { type: 'element', id: 'Es' },
      { type: 'element', id: 'Fm' },
    ],
  },
  {
    id: 'exp-boss', world: 'expert', kind: 'boss', zone: 'Equilibrium Bay', title: 'Boss: Chemistry Grandmaster', concept: 'Review expert concepts.',
    bossRules: { lives: 3, passThreshold: 0.7 },
    intro: cb('Master equilibrium, thermo, kinetics, electrochem, and nuclear!'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Stage 1: Equilibrium', prompt: 'Predict the shifts for the contact process.', interactive: 'equilibrium', data: { reaction: '2SO2 + O2 ⇌ 2SO3 (ΔH < 0, exothermic)', scenarios: [
        { change: 'Add more O₂', answer: 'Toward products', explanation: 'More reactant is used up by the forward reaction.' },
        { change: 'Lower the temperature', answer: 'Toward products', explanation: 'Cooling favours the exothermic direction.' },
        { change: 'Decrease the pressure', answer: 'Toward reactants', explanation: 'The reactant side has more gas molecules (3 vs 2).' },
      ] } },
      { id: 's2', kind: 'practice', title: 'Stage 2: Free energy', prompt: 'Calculate ΔG in kJ/mol.', interactive: 'thermo', data: { problems: [{ dH: 40, dS: 200, T: 300 }, { dH: -90, dS: -250, T: 500 }] } },
      { id: 's3', kind: 'practice', title: 'Stage 3: Rates', prompt: 'How does the rate change?', interactive: 'kinetics', data: { problems: [{ order: 2, factor: 3 }, { order: 1, factor: 0.5 }] } },
      { id: 's4', kind: 'practice', title: 'Stage 4: Cells', prompt: 'Calculate E°cell.', interactive: 'cell-builder', data: { problems: [{ cathode: 'Au', anode: 'Ni' }, { cathode: 'H2', anode: 'Fe' }] } },
      { id: 's5', kind: 'practice', title: 'Stage 5: Decay', prompt: 'Half-life problems.', interactive: 'decay', data: { problems: [{ n0: 200, halfLife: 3, t: 9, unit: 'days', quantity: 'g' }, { n0: 50, halfLife: 30, t: 15, unit: 'years', quantity: 'g' }] } },
    ],
    quiz: [
      q('eb1', 'Le Chatelier: remove product, shift...', 'mcq', 'Toward products', ['Toward reactants', 'Toward products', 'No change'], 'Replace product.', 2),
      q('eb2', 'ΔG=0 at...', 'mcq', 'Equilibrium', ['Start', 'Equilibrium', 'End'], 'Equilibrium.', 1),
      q('eb3', 'Catalyst changes...', 'mcq', 'Rate only', ['ΔG', 'Equilibrium constant', 'Rate only'], 'Not thermo.', 2),
      q('eb4', 'Anode is where...', 'mcq', 'Oxidation', ['Reduction', 'Oxidation', 'Neutralization'], 'Anode.', 1),
      q('eb5', 'Half-life independent of...', 'mcq', 'Initial amount', ['Temperature', 'Initial amount', 'Isotope'], 'For first-order.', 2),
      q('eb6', 'ΔH = +40 kJ/mol and ΔS = +200 J/(mol·K). At 300 K the reaction is...', 'mcq', 'Spontaneous', ['Spontaneous', 'Non-spontaneous', 'At equilibrium'], 'ΔG = 40 − 300 × 0.200 = −20 kJ/mol.', 3),
      q('eb7', 'For a second-order reaction, tripling [A] multiplies the rate by...', 'mcq', '9', ['3', '6', '9'], '3² = 9.', 2),
      q('eb8', 'E°cell for a Cu²⁺/Cu (+0.34 V) cathode with a Zn²⁺/Zn (−0.76 V) anode?', 'mcq', '+1.10 V', ['+0.42 V', '+1.10 V', '−1.10 V'], '0.34 − (−0.76) = +1.10 V.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 80 },
      { type: 'badge', id: 'grandmaster' },
      { type: 'element', id: 'Cn' },
      { type: 'element', id: 'Nh' },
      { type: 'element', id: 'Fl' },
      { type: 'element', id: 'Mc' },
      { type: 'molecule', id: 'cholesterol' },
    ],
  },
  {
    id: 'exp-buffers', world: 'expert', kind: 'core', zone: 'Equilibrium Bay', title: 'Buffer Builder', concept: 'A weak acid and its conjugate base resist changes in pH.',
    intro: cb('Buffers keep pH steady. In your blood, carbonic acid and hydrogencarbonate hold the pH near 7.4. The Henderson–Hasselbalch equation links pH to the buffer recipe: pH = pKa + log([A⁻]/[HA]).'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Buffer calculations', prompt: 'Use pH = pKa + log([A⁻]/[HA]). pH answers within 0.02 count.', interactive: 'buffer', data: { problems: [
        { find: 'pH', acid: 'acetic acid', pKa: 4.76, acidConc: 0.1, baseConc: 0.1 },
        { find: 'pH', acid: 'acetic acid', pKa: 4.76, acidConc: 0.2, baseConc: 0.1 },
        { find: 'ratio', acid: 'ammonium', pKa: 9.25, targetPh: 9.55 },
        { find: 'ratio', acid: 'carbonic acid', pKa: 6.35, targetPh: 7.4 },
        { find: 'pH-after-acid', acid: 'acetic acid', pKa: 4.76, acidConc: 0.5, baseConc: 0.5, addedAcid: 0.1 },
      ] } },
      { id: 's2', kind: 'practice', title: 'Set the pH', prompt: 'Set the pH each buffer would hold.', interactive: 'ph-slider', data: { tasks: [
        { prompt: 'Human blood (pH 7.35–7.45)', min: 7.35, max: 7.45 },
        { prompt: 'An acetate buffer with equal acid and base (pH 4.7–4.8)', min: 4.7, max: 4.8 },
      ] } },
    ],
    quiz: [
      q('eu1', 'A buffer is made from...', 'mcq', 'A weak acid and its conjugate base', ['A strong acid and a strong base', 'A weak acid and its conjugate base', 'Pure water and salt'], 'The conjugate pair soaks up added acid or base.', 1),
      q('eu2', 'When [A⁻] = [HA], the pH equals...', 'mcq', 'The pKa', ['7', 'The pKa', '0'], 'log(1) = 0, so pH = pKa.', 2),
      q('eu3', 'Adding a little HCl to a buffer...', 'mcq', 'Barely changes the pH', ['Makes it pH 1', 'Barely changes the pH', 'Makes it basic'], 'A⁻ turns the added H⁺ into HA.', 1),
      q('eu4', "To raise a buffer's pH by 1, the ratio [A⁻]/[HA] must be multiplied by...", 'mcq', '10', ['2', '10', '100'], 'pH depends on log of the ratio; log(10) = 1.', 2),
      q('eu5', 'Which buffer keeps human blood near pH 7.4?', 'mcq', 'Carbonic acid / hydrogencarbonate', ['Acetic acid / acetate', 'Carbonic acid / hydrogencarbonate', 'Ammonium / ammonia'], 'CO2 from respiration feeds this buffer.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 25 },
      { type: 'element', id: 'Md' },
      { type: 'element', id: 'No' },
      { type: 'element', id: 'Lr' },
      { type: 'molecule', id: 'vitamin-c' },
    ],
  },
  {
    id: 'exp-orbitals', world: 'expert', kind: 'core', zone: 'Quantum Quarter', title: 'Orbital Architect', concept: 'Electrons fill orbitals in order of energy: the aufbau principle, Pauli and Hund.',
    intro: cb('Electrons fill subshells from the lowest energy up: 1s, 2s, 2p, 3s, 3p, 4s, 3d… Each orbital holds two electrons with opposite spins (Pauli), and electrons spread out singly before pairing (Hund). A few elements, such as chromium and copper, break the pattern because half-filled and full d subshells are extra stable.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Build configurations', prompt: 'Place electrons in order of energy. Use the noble-gas core shortcut to save time.', interactive: 'electron-config', data: { targets: ['O', 'Na', 'Fe'] } },
      { id: 's2', kind: 'practice', title: 'The exceptions', prompt: 'Chromium and copper break the aufbau pattern. Can you build their real configurations?', interactive: 'electron-config', data: { targets: ['Cr', 'Cu'] } },
      { id: 's3', kind: 'practice', title: 'Blocks of the table', prompt: 'Which block is each element in?', interactive: 'sorter', data: { categories: ['s-block', 'p-block', 'd-block', 'f-block'], items: [
        { label: 'Sodium', category: 's-block' }, { label: 'Iron', category: 'd-block' }, { label: 'Bromine', category: 'p-block' },
        { label: 'Neodymium', category: 'f-block' }, { label: 'Calcium', category: 's-block' }, { label: 'Lead', category: 'p-block' },
      ] } },
    ],
    quiz: [
      q('eo1', 'Which subshell fills right after 4s?', 'mcq', '3d', ['4p', '3d', '4d'], '3d is slightly higher in energy than 4s.', 1),
      q('eo2', 'How many electrons can one orbital hold?', 'mcq', '2', ['1', '2', '8'], 'Pauli exclusion principle: two electrons with opposite spins.', 1),
      q('eo3', 'The ground-state configuration of chromium is...', 'mcq', '[Ar] 3d5 4s1', ['[Ar] 3d4 4s2', '[Ar] 3d5 4s1', '[Ar] 3d6'], 'A half-filled 3d subshell is extra stable.', 2),
      q('eo4', 'How many unpaired electrons does a nitrogen atom (1s2 2s2 2p3) have?', 'mcq', '3', ['1', '2', '3'], "Hund's rule: the three 2p electrons occupy separate orbitals.", 3),
      q('eo5', 'Elements in the f-block are the...', 'mcq', 'Lanthanides and actinides', ['Noble gases', 'Transition metals', 'Lanthanides and actinides'], 'Their last electrons enter 4f or 5f subshells.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 25 },
      { type: 'element', id: 'Rf' },
      { type: 'element', id: 'Db' },
      { type: 'element', id: 'Sg' },
      { type: 'element', id: 'Bh' },
      { type: 'element', id: 'Hs' },
      { type: 'molecule', id: 'palmitic-acid' },
    ],
  },
  {
    id: 'exp-miniboss', world: 'expert', kind: 'miniboss', zone: 'Energy Lab', title: 'Mini-Boss: Energy Gauntlet', concept: 'A timed challenge on free energy, rates and equilibrium.',
    bossRules: { timeLimitSec: 180, passThreshold: 0.7 },
    intro: cb('Run the Energy Gauntlet: Gibbs free energy, rate laws and Le Chatelier, against the clock.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Free energy', prompt: 'Calculate ΔG in kJ/mol.', interactive: 'thermo', data: { problems: [{ dH: -50, dS: -100, T: 400 }] } },
      { id: 's2', kind: 'practice', title: 'Rates', prompt: 'How does the rate change?', interactive: 'kinetics', data: { problems: [{ order: 2, factor: 4 }] } },
      { id: 's3', kind: 'practice', title: 'Shifts', prompt: 'Predict the shifts.', interactive: 'equilibrium', data: { reaction: '2NO2 ⇌ N2O4 (ΔH < 0, exothermic)', scenarios: [
        { change: 'Increase the pressure', answer: 'Toward products', explanation: 'The product side has fewer gas molecules (1 vs 2).' },
        { change: 'Heat the mixture', answer: 'Toward reactants', explanation: 'Heating favours the endothermic (reverse) direction.' },
      ] } },
    ],
    quiz: [
      q('eg1', 'ΔH = −50 kJ/mol and ΔS = +100 J/(mol·K). The reaction is spontaneous...', 'mcq', 'At all temperatures', ['Only at high T', 'Only at low T', 'At all temperatures'], 'Both terms make ΔG negative.', 3),
      q('eg2', 'Activation energy is...', 'mcq', 'The minimum energy needed for a reaction', ['The energy released by a reaction', 'The minimum energy needed for a reaction', 'The energy of the products'], 'Colliding particles need at least this energy to react.', 1),
      q('eg3', 'A catalyst speeds up a reaction by...', 'mcq', 'Providing a lower-energy pathway', ['Raising the temperature', 'Providing a lower-energy pathway', 'Increasing ΔH'], 'It lowers the activation energy without being used up.', 2),
      q('eg4', 'If K is very small, at equilibrium there are mostly...', 'mcq', 'Reactants', ['Reactants', 'Products', 'Equal amounts'], 'K = [products]/[reactants] is small when products are scarce.', 2),
      q('eg5', 'An endothermic reaction...', 'mcq', 'Absorbs heat', ['Releases heat', 'Absorbs heat', 'Has ΔH = 0'], 'Endothermic reactions have ΔH > 0.', 1),
      q('eg6', 'For rate = k[A]², the reaction is ___ order in A.', 'mcq', 'Second', ['First', 'Second', 'Zero'], 'The exponent is the order.', 1),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 40 },
      { type: 'badge', id: 'energy-gauntlet' },
      { type: 'element', id: 'Mt' },
      { type: 'element', id: 'Ds' },
      { type: 'element', id: 'Rg' },
      { type: 'molecule', id: 'cellulose' },
    ],
  },
  {
    id: 'exp-clinic', world: 'expert', kind: 'remediation', zone: 'Equilibrium Bay', title: 'Equilibrium Clinic', concept: 'Revisit the expert questions you found tricky.',
    remediates: ['exp-equilibrium', 'exp-thermo', 'exp-kinetics', 'exp-cell-builder', 'exp-decay', 'exp-buffers', 'exp-orbitals', 'exp-miniboss', 'exp-boss'],
    intro: cb('The Equilibrium Clinic brings back the expert questions you missed, with their explanations.'),
    steps: [
      { id: 's1', kind: 'practice', title: 'Half-life warm-up', prompt: 'A quick decay problem.', interactive: 'decay', data: { problems: [{ n0: 40, halfLife: 5, t: 10, unit: 'days', quantity: 'g' }] } },
    ],
    quiz: [
      q('ec1', 'Le Chatelier: adding more product shifts the equilibrium...', 'mcq', 'Toward reactants', ['Toward products', 'Toward reactants', 'Nowhere'], 'The system uses up some of the added product.', 1),
      q('ec2', 'ΔG < 0 means the reaction is...', 'mcq', 'Spontaneous', ['Spontaneous', 'Non-spontaneous', 'At equilibrium'], 'Negative free energy change.', 1),
      q('ec3', 'In a galvanic cell, oxidation happens at the...', 'mcq', 'Anode', ['Anode', 'Cathode', 'Salt bridge'], 'An Ox, Red Cat.', 1),
      q('ec4', 'After two half-lives, what fraction of a sample remains?', 'mcq', '1/4', ['1/2', '1/4', '1/8'], '½ × ½ = ¼.', 1),
      q('ec5', 'A buffer resists changes in...', 'mcq', 'pH', ['Temperature', 'pH', 'Pressure'], 'That is what buffers are for.', 1),
      q('ec6', 'Which is the ground-state configuration of copper?', 'mcq', '[Ar] 3d10 4s1', ['[Ar] 3d9 4s2', '[Ar] 3d10 4s1', '[Ar] 3d10 4s2'], 'A full 3d subshell is extra stable.', 2),
    ],
    rewards: [
      { type: 'currency', id: 'atoms', amount: 25 },
      { type: 'badge', id: 'equilibrium-clinic' },
      { type: 'element', id: 'Lv' },
      { type: 'element', id: 'Ts' },
      { type: 'element', id: 'Og' },
    ],
  },
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function missionsByWorld(world: Difficulty): Mission[] {
  return MISSIONS.filter((m) => m.world === world);
}