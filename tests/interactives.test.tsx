/** Every interactive reports completion with the right score. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InteractivePanel from '../src/features/mission/InteractivePanel';
import { MOLECULES } from '../src/data/molecules';
import { useGameStore } from '../src/store/useGameStore';
import type { MissionStep, StepResult } from '../src/types';

type User = ReturnType<typeof userEvent.setup>;

function setup(step: MissionStep) {
  const onComplete = vi.fn<(r: StepResult) => void>();
  const user = userEvent.setup();
  render(<InteractivePanel step={step} onComplete={onComplete} />);
  return { user, onComplete, last: () => onComplete.mock.calls.at(-1)?.[0] };
}

const step = <S extends MissionStep>(s: Omit<S, 'id' | 'kind' | 'title' | 'prompt'>): MissionStep =>
  ({ id: 's', kind: 'practice', title: 't', prompt: 'p', ...s }) as MissionStep;

async function answerNumeric(user: User, index: number, value: string) {
  const task = screen.getByTestId(new RegExp(`task-.*-${index}$`));
  await user.type(within(task).getByRole('textbox'), value);
  await user.click(within(task).getByRole('button', { name: 'Check' }));
}

beforeEach(() => useGameStore.getState().reset());

describe('building widgets', () => {
  it('atom builder: completes on the exact target and names the element', async () => {
    const { user, onComplete } = setup(step({ interactive: 'atom-builder', data: { target: { p: 2, n: 2, e: 2 }, element: 'He' } }));
    for (let i = 0; i < 2; i++) {
      await user.click(screen.getByRole('button', { name: 'Add a proton' }));
      await user.click(screen.getByRole('button', { name: 'Add a neutron' }));
    }
    expect(screen.getByText(/This is/)).toHaveTextContent('Helium · mass number 4 · charge +2');
    await user.click(screen.getByRole('button', { name: 'Add an electron' }));
    expect(onComplete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Add an electron' }));
    expect(onComplete).toHaveBeenCalledWith({ score: 1 });
    expect(screen.getByText(/charge 0 \(neutral\)/)).toBeInTheDocument();
  });

  it('molecule maker: offers distractors and completes on the target', async () => {
    const { user, onComplete } = setup(step({ interactive: 'molecule-maker', data: { target: 'NH3' } }));
    expect(screen.getByTestId('mm-count-O')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add N' }));
    await user.click(screen.getByRole('button', { name: 'Add H' }));
    await user.click(screen.getByRole('button', { name: 'Add H' }));
    expect(onComplete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Add H' }));
    expect(onComplete).toHaveBeenCalledWith({ score: 1 });
    expect(screen.getByRole('status')).toHaveTextContent('Molecule complete: Ammonia!');
  });

  it('equation balancer: full credit when solved in lowest terms, half when revealed', async () => {
    const { onComplete } = setup(step({ interactive: 'equation-balancer', data: { reactants: ['H2', 'O2'], products: ['H2O'] } }));
    const coef = (f: string) => screen.getByRole('spinbutton', { name: `Coefficient for ${f}` });
    fireEvent.change(coef('H2'), { target: { value: '4' } });
    fireEvent.change(coef('O2'), { target: { value: '2' } });
    fireEvent.change(coef('H2O'), { target: { value: '4' } });
    expect(screen.getByText(/use the smallest whole numbers/)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.change(coef('H2'), { target: { value: '2' } });
    fireEvent.change(coef('O2'), { target: { value: '1' } });
    fireEvent.change(coef('H2O'), { target: { value: '2' } });
    expect(onComplete).toHaveBeenCalledWith({ score: 1 });
    expect(screen.getByText('✅ Balanced!')).toBeInTheDocument();
  });

  it('equation balancer: "Show me" gives half credit', async () => {
    const { user, onComplete } = setup(step({ interactive: 'equation-balancer', data: { reactants: ['N2', 'H2'], products: ['NH3'] } }));
    await user.click(screen.getByRole('button', { name: /Show me/ }));
    expect(onComplete).toHaveBeenCalledWith({ score: 0.5 });
    expect(screen.getByRole('spinbutton', { name: 'Coefficient for H2' })).toHaveValue(3);
  });
});

describe('choice and sorting widgets', () => {
  it('sorter: scores the fraction correct and allows a retry', async () => {
    const { user, last } = setup(step({ interactive: 'state-sorter', data: { categories: ['Solid', 'Gas'], items: [{ label: 'Ice', category: 'Solid' }, { label: 'Steam', category: 'Gas' }] } }));
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Ice' }), 'Solid');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Steam' }), 'Solid');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(last()).toEqual({ score: 0.5 });
    expect(screen.getByLabelText('incorrect, Gas')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Ice' }), 'Solid');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Steam' }), 'Gas');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(last()).toEqual({ score: 1 });
  });

  it('bond builder: one attempt per pair', async () => {
    const { user, last } = setup(step({ interactive: 'bond-builder', data: { pairs: [{ a: 'Na', b: 'Cl', answer: 'ionic' }, { a: 'Cu', b: 'Cu', answer: 'metallic' }] } }));
    expect(screen.getByTestId('task-bond-0')).toHaveTextContent('Sodium (metal) and Chlorine (nonmetal)');
    await user.click(within(screen.getByTestId('task-bond-0')).getByRole('button', { name: 'ionic' }));
    await user.click(within(screen.getByTestId('task-bond-1')).getByRole('button', { name: 'covalent' }));
    expect(within(screen.getByTestId('task-bond-1')).getByRole('button', { name: 'metallic' })).toBeDisabled();
    expect(last()).toEqual({ score: 0.5 });
    expect(screen.getByTestId('task-summary')).toHaveTextContent('Score: 1 / 2');
  });

  it('reaction classifier', async () => {
    const { user, last } = setup(step({ interactive: 'reaction-classifier', data: { items: [{ equation: 'CaCO3 → CaO + CO2', answer: 'Decomposition' }] } }));
    await user.click(screen.getByRole('button', { name: 'Decomposition' }));
    expect(last()).toEqual({ score: 1 });
  });

  it('organic builder: the right family member is always among the choices', async () => {
    const { user, last } = setup(step({ interactive: 'organic-builder', data: { tasks: [{ prompt: 'Pick the ester.', subcategory: 'ester' }, { prompt: 'Pick an alkane.', subcategory: 'alkane' }] } }));
    for (const [i, sub] of [[0, 'ester'], [1, 'alkane']] as const) {
      const task = screen.getByTestId(`task-org-${i}`);
      const names = within(task).getAllByRole('button').map((b) => b.textContent!);
      const correct = names.filter((n) => MOLECULES.find((m) => m.name === n)?.subcategory === sub);
      expect(correct).toHaveLength(1);
      expect(names).toHaveLength(4);
      await user.click(within(task).getByRole('button', { name: correct[0]! }));
    }
    expect(last()).toEqual({ score: 1 });
  });

  it('equilibrium: Le Chatelier choices', async () => {
    const { user, last } = setup(step({ interactive: 'equilibrium', data: { reaction: 'A ⇌ B', scenarios: [{ change: 'Add A', answer: 'Toward products', explanation: 'x' }, { change: 'Add a catalyst', answer: 'No shift', explanation: 'y' }] } }));
    await user.click(within(screen.getByTestId('task-eq-0')).getByRole('button', { name: 'Toward products' }));
    await user.click(within(screen.getByTestId('task-eq-1')).getByRole('button', { name: 'Toward reactants' }));
    expect(last()).toEqual({ score: 0.5 });
  });
});

describe('exploration widgets', () => {
  it('periodic explorer clues: first-try score', async () => {
    const { user, last } = setup(step({ interactive: 'periodic-explorer', data: { clues: [{ clue: 'Bones', answer: 'Ca' }, { clue: 'Balloons', answer: 'He' }] } }));
    const grid = screen.getByRole('group', { name: 'Periodic table explorer' });
    expect(screen.getByTestId('clue')).toHaveTextContent('Bones');
    await user.click(within(grid).getByRole('button', { name: /^26 Fe Iron\b/ }));
    expect(screen.getByText("❌ That's Iron. Try again.")).toBeInTheDocument();
    await user.click(within(grid).getByRole('button', { name: /^20 Ca Calcium\b/ }));
    expect(screen.getByTestId('clue')).toHaveTextContent('Balloons');
    await user.click(within(grid).getByRole('button', { name: /^2 He Helium\b/ }));
    expect(last()).toEqual({ score: 0.5 });
    expect(screen.getByText(/All 2 elements found \(1 on the first try\)/)).toBeInTheDocument();
  });

  it('periodic explorer without clues completes after exploring three elements', async () => {
    const { user, onComplete } = setup(step({ interactive: 'periodic-explorer' }));
    const grid = screen.getByRole('group', { name: 'Periodic table explorer' });
    await user.click(within(grid).getByRole('button', { name: /^26 Fe Iron\b/ }));
    await user.click(within(grid).getByRole('button', { name: /^26 Fe Iron\b/ }));
    await user.click(within(grid).getByRole('button', { name: /^79 Au Gold\b/ }));
    expect(onComplete).not.toHaveBeenCalled();
    await user.click(within(grid).getByRole('button', { name: /^10 Ne Neon\b/ }));
    expect(onComplete).toHaveBeenCalledWith({ score: 1 });
  });

  it('lab mix: completes only on the goal reaction', async () => {
    const { user, onComplete } = setup(step({ interactive: 'lab-mix', data: { goal: 'copper-hydroxide' } }));
    expect(screen.getByText(/Goal: make the reaction/)).toHaveTextContent('Making a precipitate');
    await user.click(screen.getByRole('button', { name: 'Mix!' })); // default HCl + NaOH
    expect(onComplete).not.toHaveBeenCalled();
    await user.selectOptions(screen.getByRole('combobox', { name: 'First substance' }), 'CuSO4');
    await user.click(screen.getByRole('button', { name: 'Mix!' }));
    expect(onComplete).toHaveBeenCalledWith({ score: 1 });
    expect(screen.getByText('✅ Goal reached!')).toBeInTheDocument();
  });

  it('pH slider: sequential targets with first-try scoring', async () => {
    const { user, last } = setup(step({ interactive: 'ph-slider', data: { tasks: [{ prompt: 'Acid', min: 1, max: 2 }, { prompt: 'Neutral', min: 6.95, max: 7.05 }] } }));
    const slider = screen.getByRole('slider', { name: 'pH value' });
    fireEvent.change(slider, { target: { value: '5' } });
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText(/Too basic/)).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: '1.5' } });
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByTestId('ph-task')).toHaveTextContent('Neutral');
    fireEvent.change(slider, { target: { value: '7' } });
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(last()).toEqual({ score: 0.5 });
  });

  it('symbol match reports the fraction matched', async () => {
    const { user, last } = setup(step({ interactive: 'symbol-match', data: { pool: ['Na', 'K'], rounds: 2 } }));
    for (let i = 0; i < 2; i++) {
      const name = screen.getByTestId('symbol-match-name').textContent!;
      const answer = i === 0 ? 'Zz' : name === 'Sodium' ? 'Na' : 'K';
      await user.type(screen.getByRole('textbox', { name: 'Symbol' }), answer);
      await user.click(screen.getByRole('button', { name: 'Check' }));
      await user.click(screen.getByRole('button', { name: /Next element/ }));
    }
    expect(last()).toEqual({ score: 0.5 });
  });
});

describe('numeric widgets', () => {
  it('stoichiometry: mass ↔ moles ↔ particles with tolerance', async () => {
    const { user, last } = setup(step({ interactive: 'stoichiometry', data: { problems: [
      { formula: 'H2O', mass: 36, find: 'moles' }, { formula: 'CO2', moles: 2, find: 'mass' }, { formula: 'H2O', moles: 1, find: 'particles' },
    ] } }));
    expect(screen.getByTestId('task-stoich-0')).toHaveTextContent('Water (H2O');
    await answerNumeric(user, 0, '2');
    await answerNumeric(user, 1, '88');
    await answerNumeric(user, 2, '6.02 x 10^23');
    expect(last()).toEqual({ score: 1 });
  });

  it('stoichiometry: wrong answers show the worked solution', async () => {
    const { user, last } = setup(step({ interactive: 'stoichiometry', data: { problems: [{ formula: 'NaCl', mass: 11.69, find: 'moles' }] } }));
    await answerNumeric(user, 0, '2');
    expect(screen.getByRole('status')).toHaveTextContent('The answer is 0.2 mol. n = m ÷ M = 11.69 ÷ 58.44 = 0.2 mol.');
    expect(last()).toEqual({ score: 0 });
  });

  it('gas laws', async () => {
    const { user, last } = setup(step({ interactive: 'gas-law', data: { problems: [{ law: 'boyle', p1: 1, v1: 6, p2: 2 }, { law: 'charles', v1: 2, t1: 300, t2: 450 }, { law: 'ideal', n: 1, v: 22.4, t: 273 }] } }));
    await answerNumeric(user, 0, '3');
    await answerNumeric(user, 1, '3 L');
    await answerNumeric(user, 2, '1.0');
    expect(last()).toEqual({ score: 1 });
  });

  it('redox: signed integers must be exact', async () => {
    const { user, last } = setup(step({ interactive: 'redox', data: { items: [{ element: 'S', compound: 'H2SO4', answer: 6 }, { element: 'Cl', compound: 'NaCl', answer: -1 }] } }));
    await answerNumeric(user, 0, '+6');
    await answerNumeric(user, 1, '1');
    expect(last()).toEqual({ score: 0.5 });
  });

  it('thermodynamics: ΔG in kJ/mol with the verdict', async () => {
    const t = setup(step({ interactive: 'thermo', data: { problems: [{ dH: -100, dS: 200, T: 300 }] } }));
    await answerNumeric(t.user, 0, '-160');
    expect(t.last()).toEqual({ score: 1 });
    expect(screen.getByRole('status')).toHaveTextContent('spontaneous');
  });

  it('kinetics', async () => {
    const { user, last } = setup(step({ interactive: 'kinetics', data: { problems: [{ order: 2, factor: 2 }, { order: 0, factor: 3 }] } }));
    await answerNumeric(user, 0, '4');
    await answerNumeric(user, 1, '1');
    expect(last()).toEqual({ score: 1 });
  });

  it('cell builder', async () => {
    const { user, last } = setup(step({ interactive: 'cell-builder', data: { problems: [{ cathode: 'Cu', anode: 'Zn' }, { cathode: 'Ag', anode: 'Cu' }] } }));
    await answerNumeric(user, 0, '1.10');
    await answerNumeric(user, 1, '1.14');
    expect(last()).toEqual({ score: 0.5 });
  });

  it('decay', async () => {
    const { user, last } = setup(step({ interactive: 'decay', data: { problems: [{ n0: 100, halfLife: 5730, t: 11460, unit: 'years', quantity: 'g' }] } }));
    await answerNumeric(user, 0, '25');
    expect(last()).toEqual({ score: 1 });
  });
});

describe('phase 4 widgets', () => {
  it('general sorter', async () => {
    const { user, last } = setup(step({ interactive: 'sorter', data: { categories: ['Physical change', 'Chemical change'], items: [{ label: 'Melting ice', category: 'Physical change' }, { label: 'Burning paper', category: 'Chemical change' }] } }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Melting ice' }), 'Physical change');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Burning paper' }), 'Chemical change');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(last()).toEqual({ score: 1 });
  });

  it('atom counter: subscripts, brackets and coefficients', async () => {
    const { user, last } = setup(step({ interactive: 'atom-counter', data: { items: [{ formula: 'Al2(SO4)3', element: 'O' }, { formula: '3H2O' }, { formula: '(NH4)2SO4', element: 'H' }] } }));
    expect(screen.getByTestId('task-count-0')).toHaveTextContent('How many Oxygen atoms are in Al2(SO4)3');
    await answerNumeric(user, 0, '12');
    await answerNumeric(user, 1, '9');
    await answerNumeric(user, 2, '4');
    expect(screen.getByTestId('task-count-2')).toHaveTextContent('contains N: 2, H: 8, S: 1, O: 4');
    expect(last()?.score).toBeCloseTo(2 / 3);
  });

  it('polymer builder: choices and chain mass combine into one score', async () => {
    const { user, last, onComplete } = setup(step({ interactive: 'polymer-builder', data: { tasks: [
      { ask: 'monomer', polymer: 'pvc' }, { ask: 'type', polymer: 'nylon-6-6' }, { ask: 'recycling', polymer: 'pet' }, { ask: 'chain-mass', polymer: 'polyethylene', n: 1000 },
    ] } }));
    await user.click(within(screen.getByTestId('task-poly-0')).getByRole('button', { name: 'Chloroethene (vinyl chloride)' }));
    await user.click(within(screen.getByTestId('task-poly-1')).getByRole('button', { name: 'Condensation polymer' }));
    await user.click(within(screen.getByTestId('task-poly-2')).getByRole('button', { name: '♻ 3' }));
    expect(onComplete).not.toHaveBeenCalled();
    const chain = screen.getByTestId('task-chain-3');
    await user.type(within(chain).getByRole('textbox'), '28054');
    await user.click(within(chain).getByRole('button', { name: 'Check' }));
    expect(last()?.score).toBeCloseTo(0.75); // 2/3 choices right (weight 3) + 1/1 numeric (weight 1)
  });

  it('polymer builder chain visual', async () => {
    const { user } = setup(step({ interactive: 'polymer-builder', data: { tasks: [{ ask: 'type', polymer: 'starch' }] } }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Polymer' }), 'ptfe');
    fireEvent.change(screen.getByRole('slider', { name: /Repeat units/ }), { target: { value: '4' } });
    expect(screen.getByTestId('chain').textContent).toBe('–[C2F4C2F4]–[C2F4C2F4]–[C2F4C2F4]–[C2F4C2F4]–');
    expect(screen.getByText(/4 units × 100\.01 g\/mol = 400\.06 g\/mol/)).toBeInTheDocument();
  });

  it('buffer: Henderson–Hasselbalch, ratios, and added acid', async () => {
    const { user, last } = setup(step({ interactive: 'buffer', data: { problems: [
      { find: 'pH', acid: 'acetic acid', pKa: 4.76, acidConc: 0.1, baseConc: 0.2 },
      { find: 'ratio', acid: 'ammonium', pKa: 9.25, targetPh: 10.25 },
      { find: 'pH-after-acid', acid: 'acetic acid', pKa: 4.76, acidConc: 0.5, baseConc: 0.5, addedAcid: 0.05 },
    ] } }));
    await answerNumeric(user, 0, '5.06');
    await answerNumeric(user, 1, '10');
    await answerNumeric(user, 2, '4.67');
    expect(last()).toEqual({ score: 1 });
    expect(screen.getByTestId('task-buffer-2')).toHaveTextContent('in pure water would give pH 1.30');
  });

  it('electron configuration: core shortcut, exceptions and scoring', async () => {
    const { user, last } = setup(step({ interactive: 'electron-config', data: { targets: ['Na', 'Cr'] } }));
    expect(screen.getByTestId('config-target')).toHaveTextContent('Sodium (Na), Z = 11');
    await user.click(screen.getByRole('button', { name: 'Fill [Ne] core' }));
    expect(screen.getByTestId('config-total')).toHaveTextContent('10 / 11');
    await user.click(screen.getByRole('button', { name: 'Add electron to 3s' }));
    expect(screen.getByTestId('config-built')).toHaveTextContent('[Ne] 3s1');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByTestId('config-target')).toHaveTextContent('Chromium (Cr), Z = 24');

    await user.click(screen.getByRole('button', { name: 'Fill [Ar] core' }));
    for (let i = 0; i < 2; i++) await user.click(screen.getByRole('button', { name: 'Add electron to 4s' }));
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Add electron to 3d' }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('status')).toHaveTextContent('is an exception');
    await user.click(screen.getByRole('button', { name: 'Remove electron from 4s' }));
    await user.click(screen.getByRole('button', { name: 'Add electron to 3d' }));
    expect(screen.getByTestId('config-built')).toHaveTextContent('[Ar] 3d5 4s1');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(last()).toEqual({ score: 0.75 }); // Na first try (1) + Cr second try (0.5)
    expect(screen.getByRole('status')).toHaveTextContent('All configurations built (1.5 / 2 points)');
  });

  it('electron configuration: wrong totals and revealing the answer', async () => {
    const { user, last } = setup(step({ interactive: 'electron-config', data: { targets: ['O'] } }));
    await user.click(screen.getByRole('button', { name: 'Add electron to 1s' }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('status')).toHaveTextContent('You placed 1 electrons; a neutral Oxygen atom has 8.');
    await user.click(screen.getByRole('button', { name: /Show answer/ }));
    expect(last()).toEqual({ score: 0 });
  });
});
