import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOLECULES } from '../../../data/molecules';
import { REACTIONS } from '../../../data/reactions';
import { isBalanced, findCoefficients, classifyPh, boyle, charles, idealGasPressure, massToMoles, molesToParticles } from '../../../game/engine/chemistry';
import { molarMass, getMoleculeByFormula } from '../../../game/engine/molecules';
import { speciesName } from '../../../game/engine/reactions';
import { formatAnswer } from '../../../game/engine/answers';
import { seededRandom, shuffle } from '../../../game/engine/random';
import { MixBench } from '../../../components/lab/MixBench';
import { Formula } from '../../../components/molecules/Formula';
import { MoleculeDetail } from '../../../components/molecules/MoleculeDetail';
import { REACTION_CLASSES, type GasProblem, type StoichProblem } from '../../../types';
import type { InteractiveProps } from './types';
import { ChoiceTasks, NumericTasks, type NumericItem } from './tasks';

// ---------------------------------------------------------------------------
// Equation balancer
// ---------------------------------------------------------------------------

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

export function EquationBalancer({ data, onComplete }: InteractiveProps<'equation-balancer'>) {
  const reactants = data?.reactants ?? ['H2', 'O2'];
  const products = data?.products ?? ['H2O'];
  const [rCoeffs, setRCoeffs] = useState<number[]>(reactants.map(() => 1));
  const [pCoeffs, setPCoeffs] = useState<number[]>(products.map(() => 1));
  const [status, setStatus] = useState<'working' | 'solved' | 'revealed'>('working');

  const evaluate = (r: number[], p: number[]) => {
    const balanced = isBalanced(
      { species: reactants.map((f, i) => ({ formula: f, coeff: r[i] ?? 1 })) },
      { species: products.map((f, i) => ({ formula: f, coeff: p[i] ?? 1 })) },
    );
    const lowest = [...r, ...p].reduce((a, b) => gcd(a, b)) === 1;
    return { balanced, lowest };
  };
  const { balanced, lowest } = evaluate(rCoeffs, pCoeffs);

  const setCoeff = (side: 'r' | 'p', i: number, value: number) => {
    if (status !== 'working') return;
    const v = Math.max(1, Math.min(30, Math.round(value) || 1));
    const r = side === 'r' ? rCoeffs.map((c, j) => (j === i ? v : c)) : rCoeffs;
    const p = side === 'p' ? pCoeffs.map((c, j) => (j === i ? v : c)) : pCoeffs;
    setRCoeffs(r);
    setPCoeffs(p);
    const res = evaluate(r, p);
    if (res.balanced && res.lowest) {
      setStatus('solved');
      onComplete({ score: 1 });
    }
  };

  const reveal = () => {
    const res = findCoefficients(reactants, products);
    if (!res) return;
    setRCoeffs(res.r);
    setPCoeffs(res.p);
    setStatus('revealed');
    onComplete({ score: 0.5 });
  };

  const side = (formulas: string[], coeffs: number[], key: 'r' | 'p') => formulas.map((f, i) => (
    <span key={`${key}-${f}`} className="flex items-center gap-1">
      <label className="sr-only" htmlFor={`coef-${key}-${i}`}>Coefficient for {f}</label>
      <input id={`coef-${key}-${i}`} type="number" min={1} max={30} className="w-16" value={coeffs[i]} disabled={status !== 'working'}
        onChange={(e) => setCoeff(key, i, Number(e.target.value))} />
      <Formula value={f} />
      {i < formulas.length - 1 && <span aria-hidden>+</span>}
    </span>
  ));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap text-lg">
        {side(reactants, rCoeffs, 'r')}
        <span aria-hidden>→</span>
        {side(products, pCoeffs, 'p')}
      </div>
      <div role="status" aria-live="polite">
        {status === 'solved' && <motion.p className="text-green-400 font-bold">✅ Balanced!</motion.p>}
        {status === 'revealed' && <p className="text-amber-300">Auto-balanced (half credit). Count each element on both sides to see why it works.</p>}
        {status === 'working' && balanced && !lowest && <p className="text-amber-300">Balanced, but use the smallest whole numbers.</p>}
        {status === 'working' && !balanced && <p className="text-sm text-muted">Not balanced yet: the number of each kind of atom must match on both sides.</p>}
      </div>
      {status === 'working' && <button className="btn btn-ghost !py-1 !px-3 text-sm" onClick={reveal}>Show me (half credit)</button>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lab mix (mission version of the mixing bench)
// ---------------------------------------------------------------------------

export function LabMix({ data, onComplete }: InteractiveProps<'lab-mix'>) {
  const goal = data?.goal ? REACTIONS.find((r) => r.id === data.goal) : undefined;
  const [reached, setReached] = useState(false);
  return (
    <div className="space-y-3">
      {goal && <p className="text-sm">🎯 Goal: make the reaction <strong>{goal.name}</strong> happen ({goal.type}).</p>}
      <MixBench
        {...(data?.initial ? { initial: data.initial } : {})}
        onReaction={(r) => {
          if (reached || !r) return;
          if (!goal || r.id === goal.id) {
            setReached(true);
            onComplete({ score: 1 });
          }
        }}
      />
      {reached && <p className="text-green-400 font-semibold" role="status">✅ {goal ? 'Goal reached!' : 'You made a reaction happen!'}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// pH slider
// ---------------------------------------------------------------------------

const DEFAULT_PH_TASKS = [
  { prompt: 'Make the solution acidic, like lemon juice (pH 2–3).', min: 2, max: 3 },
  { prompt: 'Make it neutral, like pure water (pH 7).', min: 6.95, max: 7.05 },
  { prompt: 'Make it basic, like soap (pH 9–10).', min: 9, max: 10 },
];

function phColor(ph: number): string {
  // Universal-indicator style: red (0) -> green (7) -> purple (14).
  const hue = ph <= 7 ? (ph / 7) * 120 : 120 + ((ph - 7) / 7) * 160;
  return `hsl(${hue.toFixed(0)} 80% 50%)`;
}

export function PhSlider({ data, onComplete }: InteractiveProps<'ph-slider'>) {
  const tasks = data?.tasks ?? DEFAULT_PH_TASKS;
  const [ph, setPh] = useState(7);
  const [idx, setIdx] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [missed, setMissed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const task = tasks[idx];

  const check = () => {
    if (!task) return;
    if (ph >= task.min && ph <= task.max) {
      const score = firstTry + (missed ? 0 : 1);
      setFirstTry(score);
      setMissed(false);
      setFeedback(`✅ pH ${ph.toFixed(1)} is right.`);
      setIdx(idx + 1);
      if (idx + 1 === tasks.length) onComplete({ score: score / tasks.length });
    } else {
      setMissed(true);
      setFeedback(ph < task.min ? '❌ Too acidic: move the slider up.' : '❌ Too basic: move the slider down.');
    }
  };

  return (
    <div className="space-y-3">
      {task
        ? <p><span className="text-xs text-muted">Task {idx + 1} / {tasks.length}:</span> <strong data-testid="ph-task">{task.prompt}</strong></p>
        : <p className="text-green-400 font-semibold" role="status">✅ All pH tasks done ({firstTry} / {tasks.length} on the first try).</p>}
      <label className="block text-sm">
        pH value
        <input type="range" min={0} max={14} step={0.1} value={ph} onChange={(e) => setPh(Number(e.target.value))} className="w-full" />
      </label>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full border" style={{ background: phColor(ph) }} aria-hidden />
        <div>
          <div className="font-bold" data-testid="ph-value">pH {ph.toFixed(1)}</div>
          <div className="text-sm text-muted">{classifyPh(Number(ph.toFixed(1)))} · [H⁺] = {Math.pow(10, -ph).toExponential(2)} mol/L</div>
        </div>
      </div>
      {task && <button className="btn btn-primary" onClick={check}>Check</button>}
      {feedback && <p className="text-sm" role="status">{feedback}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stoichiometry (moles ↔ mass ↔ particles)
// ---------------------------------------------------------------------------

const AVOGADRO = 6.02214076e23;

function compoundLabel(formula: string) {
  const m = getMoleculeByFormula(formula);
  return <>{m ? `${m.name} ` : ''}(<Formula value={formula} />)</>;
}

function stoichItem(p: StoichProblem, i: number): NumericItem {
  const M = molarMass(p.formula);
  const Ms = `${M.toFixed(2)} g/mol`;
  switch (p.find) {
    case 'moles': {
      const answer = p.mass / M;
      return { id: `stoich-${i}`, unit: 'mol', answer, prompt: <>How many moles are in <strong>{p.mass} g</strong> of {compoundLabel(p.formula)}? (M = {Ms})</>, explanation: `n = m ÷ M = ${p.mass} ÷ ${M.toFixed(2)} = ${formatAnswer(answer)} mol.` };
    }
    case 'mass': {
      const answer = p.moles * M;
      return { id: `stoich-${i}`, unit: 'g', answer, prompt: <>What is the mass of <strong>{p.moles} mol</strong> of {compoundLabel(p.formula)}? (M = {Ms})</>, explanation: `m = n × M = ${p.moles} × ${M.toFixed(2)} = ${formatAnswer(answer)} g.` };
    }
    case 'particles': {
      const answer = molesToParticles(p.moles);
      return { id: `stoich-${i}`, unit: 'molecules', answer, prompt: <>How many molecules are in <strong>{p.moles} mol</strong> of {compoundLabel(p.formula)}? (Nₐ = 6.022 × 10²³ /mol)</>, explanation: `N = n × Nₐ = ${p.moles} × 6.022 × 10^23 = ${formatAnswer(answer)}.` };
    }
  }
}

const DEFAULT_STOICH: StoichProblem[] = [{ formula: 'H2O', mass: 36, find: 'moles' }];

export function Stoichiometry({ data, onComplete }: InteractiveProps<'stoichiometry'>) {
  const problems = data?.problems ?? DEFAULT_STOICH;
  const calcMolecules = MOLECULES.filter((m) => m.category !== 'polymer');
  const [calcId, setCalcId] = useState('water');
  const [calcMass, setCalcMass] = useState(18);
  const calc = calcMolecules.find((m) => m.id === calcId) ?? calcMolecules[0]!;
  const M = molarMass(calc.formula);
  return (
    <div className="space-y-4">
      <NumericTasks label="Mole problems" items={problems.map(stoichItem)} onComplete={(score) => onComplete({ score })} />
      <details className="glass p-3">
        <summary className="cursor-pointer text-sm font-semibold">🧮 Mole calculator</summary>
        <div className="flex flex-wrap gap-2 items-center mt-2 text-sm">
          <label className="flex items-center gap-1">Substance
            <select value={calcId} onChange={(e) => setCalcId(e.target.value)}>
              {calcMolecules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1">Mass (g) <input type="number" className="w-24" value={calcMass} onChange={(e) => setCalcMass(Number(e.target.value))} /></label>
          <span>M = {M.toFixed(2)} g/mol → n = {formatAnswer(massToMoles(calcMass, M))} mol → {formatAnswer(molesToParticles(massToMoles(calcMass, M), AVOGADRO))} particles</span>
        </div>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reaction classifier
// ---------------------------------------------------------------------------

export function ReactionClassifier({ data, onComplete }: InteractiveProps<'reaction-classifier'>) {
  const items = data?.items ?? [{ equation: '2H2 + O2 → 2H2O', answer: 'Synthesis' as const }];
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">Synthesis: A + B → AB · Decomposition: AB → A + B · Single replacement: A + BC → AC + B · Double replacement: AB + CD → AD + CB · Combustion: fuel + O₂ → CO₂ + H₂O (or an oxide)</p>
      <ChoiceTasks
        label="Reaction types"
        onComplete={(score) => onComplete({ score })}
        items={items.map((it, i) => ({
          id: `rxn-${i}`,
          prompt: <span className="text-base"><Formula value={it.equation} /></span>,
          choices: REACTION_CLASSES,
          answer: it.answer,
          ...(it.explanation ? { explanation: it.explanation } : {}),
        }))}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gas laws
// ---------------------------------------------------------------------------

const R_ATM = 0.082057; // L·atm/(mol·K)

function gasItem(p: GasProblem, i: number): NumericItem {
  switch (p.law) {
    case 'boyle': {
      const answer = boyle(p.p1, p.v1, p.p2);
      return { id: `gas-${i}`, unit: 'L', answer, prompt: <>Boyle's law (constant T): a gas at <strong>{p.p1} atm</strong> fills <strong>{p.v1} L</strong>. What is its volume at <strong>{p.p2} atm</strong>?</>, explanation: `P₁V₁ = P₂V₂ → V₂ = ${p.p1} × ${p.v1} ÷ ${p.p2} = ${formatAnswer(answer)} L.` };
    }
    case 'charles': {
      const answer = charles(p.v1, p.t1, p.t2);
      return { id: `gas-${i}`, unit: 'L', answer, prompt: <>Charles's law (constant P): <strong>{p.v1} L</strong> of gas at <strong>{p.t1} K</strong> is heated to <strong>{p.t2} K</strong>. New volume?</>, explanation: `V₁/T₁ = V₂/T₂ → V₂ = ${p.v1} × ${p.t2} ÷ ${p.t1} = ${formatAnswer(answer)} L.` };
    }
    case 'ideal': {
      const answer = idealGasPressure(p.n, p.v, p.t, R_ATM);
      return { id: `gas-${i}`, unit: 'atm', answer, prompt: <>Ideal gas: <strong>{p.n} mol</strong> in <strong>{p.v} L</strong> at <strong>{p.t} K</strong>. Pressure? (R = 0.0821 L·atm/(mol·K))</>, explanation: `P = nRT ÷ V = ${p.n} × 0.0821 × ${p.t} ÷ ${p.v} = ${formatAnswer(answer)} atm.` };
    }
  }
}

export function GasLaw({ data, onComplete }: InteractiveProps<'gas-law'>) {
  const problems = data?.problems ?? [{ law: 'boyle' as const, p1: 1, v1: 6, p2: 2 }];
  const [v, setV] = useState(22.4);
  const [t, setT] = useState(273);
  return (
    <div className="space-y-4">
      <NumericTasks label="Gas law problems" items={problems.map(gasItem)} onComplete={(score) => onComplete({ score })} />
      <details className="glass p-3">
        <summary className="cursor-pointer text-sm font-semibold">🎈 Gas sandbox (1 mol of gas)</summary>
        <div className="space-y-2 mt-2 text-sm">
          <label className="block">Volume: {v} L <input type="range" min={1} max={50} step={0.1} value={v} onChange={(e) => setV(Number(e.target.value))} className="w-full" /></label>
          <label className="block">Temperature: {t} K <input type="range" min={100} max={800} step={1} value={t} onChange={(e) => setT(Number(e.target.value))} className="w-full" /></label>
          <p>Pressure = {idealGasPressure(1, v, t, R_ATM).toFixed(3)} atm</p>
        </div>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Organic builder (identify functional groups)
// ---------------------------------------------------------------------------

export function OrganicBuilder({ data, onComplete }: InteractiveProps<'organic-builder'>) {
  const organics = MOLECULES.filter((m) => m.category === 'organic');
  const tasks = data?.tasks ?? [{ prompt: 'Pick the alcohol.', subcategory: 'alcohol' }];
  const [viewId, setViewId] = useState('methane');
  const view = organics.find((m) => m.id === viewId);
  const items = tasks.map((t, i) => {
    const rng = seededRandom(i + 1);
    const correct = shuffle(organics.filter((m) => m.subcategory === t.subcategory), rng)[0];
    const distractors = shuffle(organics.filter((m) => m.subcategory !== t.subcategory), rng).slice(0, 3);
    const choices = shuffle([...(correct ? [correct] : []), ...distractors], rng).map((m) => m.name);
    return {
      id: `org-${i}`,
      prompt: <>{t.prompt} <span className="text-xs text-muted">(Tip: look at the formulas in the viewer below.)</span></>,
      choices,
      answer: correct?.name ?? '',
      explanation: correct ? `${correct.name} (${correct.formula}) is ${/^[aeiou]/i.test(t.subcategory) ? 'an' : 'a'} ${t.subcategory}.` : '',
    };
  });
  return (
    <div className="space-y-4">
      <ChoiceTasks label="Functional groups" items={items} onComplete={(score) => onComplete({ score })} />
      <div className="space-y-2">
        <label className="text-sm flex items-center gap-2">
          Molecule viewer
          <select value={viewId} onChange={(e) => setViewId(e.target.value)}>
            {organics.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.formula})</option>)}
          </select>
        </label>
        {view && <MoleculeDetail molecule={view} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Redox (oxidation states)
// ---------------------------------------------------------------------------

export function Redox({ data, onComplete }: InteractiveProps<'redox'>) {
  const items = data?.items ?? [{ element: 'O', compound: 'H2O', answer: -2 }];
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">Rules: elements on their own are 0 · O is usually −2 · H is usually +1 · group 1 metals +1, group 2 +2 · the states in a neutral compound add up to 0.</p>
      <NumericTasks
        label="Oxidation states"
        onComplete={(score) => onComplete({ score })}
        items={items.map((it, i) => ({
          id: `redox-${i}`,
          answer: it.answer,
          tolerance: { rel: 0, abs: 0.01 },
          prompt: <>Oxidation state of <strong>{it.element}</strong> in <strong><Formula value={it.compound} /></strong>{it.compound === it.element || /^[A-Z][a-z]?\d*$/.test(it.compound) ? ' (the pure element)' : ''}? <span className="text-xs text-muted">e.g. +2, −1, 0</span></>,
          explanation: `In ${speciesName(it.compound) === it.compound ? it.compound : `${speciesName(it.compound)} (${it.compound})`}, ${it.element} is ${it.answer > 0 ? '+' : ''}${it.answer}.`,
        }))}
      />
    </div>
  );
}
