import { useState } from 'react';
import { MOLECULES } from '../../../data/molecules';
import { getElement } from '../../../data/elements';
import { termCounts, hendersonHasselbalch, bufferRatioForPh, bufferPhAfterAddition } from '../../../game/engine/chemistry';
import { molarMass, repeatUnit } from '../../../game/engine/molecules';
import { formatAnswer } from '../../../game/engine/answers';
import {
  AUFBAU_ORDER, AUFBAU_EXCEPTIONS, NOBLE_GAS_CORES, SUBSHELL_CAPACITY, aufbauSubshells, configCounts, condenseCounts,
  type SubshellLetter,
} from '../../../game/engine/periodic';
import { seededRandom, shuffle } from '../../../game/engine/random';
import { Formula } from '../../../components/molecules/Formula';
import type { BufferProblem, Molecule, PolymerTask } from '../../../types';
import type { InteractiveProps } from './types';
import { ChoiceTasks, NumericTasks, type ChoiceItem, type NumericItem } from './tasks';

// ---------------------------------------------------------------------------
// Atom counter
// ---------------------------------------------------------------------------

export function AtomCounter({ data, onComplete }: InteractiveProps<'atom-counter'>) {
  const items = data?.items ?? [{ formula: 'H2O' }];
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">A subscript counts the atom just before it (or everything inside brackets). A big number in front multiplies the whole formula.</p>
      <NumericTasks
        label="Atom counting"
        onComplete={(score) => onComplete({ score })}
        items={items.map((it, i) => {
          const counts = termCounts(it.formula);
          const answer = it.element ? counts[it.element] ?? 0 : Object.values(counts).reduce((a, b) => a + b, 0);
          const breakdown = Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ');
          return {
            id: `count-${i}`,
            answer,
            tolerance: { rel: 0, abs: 0.01 },
            unit: 'atoms',
            prompt: it.element
              ? <>How many <strong>{getElement(it.element)?.name ?? it.element}</strong> atoms are in <strong className="text-base"><Formula value={it.formula} /></strong>?</>
              : <>How many atoms are there <strong>in total</strong> in <strong className="text-base"><Formula value={it.formula} /></strong>?</>,
            explanation: `${it.formula} contains ${breakdown}.`,
          };
        })}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Combine choice + numeric task scores into one step result
// ---------------------------------------------------------------------------

function useCombinedScore(parts: { key: string; weight: number }[], onComplete: (r: { score: number }) => void) {
  const [scores, setScores] = useState<Record<string, number>>({});
  return (key: string, score: number) => {
    const next = { ...scores, [key]: score };
    setScores(next);
    const active = parts.filter((p) => p.weight > 0);
    if (active.every((p) => next[p.key] !== undefined)) {
      const total = active.reduce((a, p) => a + p.weight, 0);
      onComplete({ score: active.reduce((a, p) => a + (next[p.key] ?? 0) * p.weight, 0) / total });
    }
  };
}

// ---------------------------------------------------------------------------
// Polymer builder
// ---------------------------------------------------------------------------

const POLYMERS = MOLECULES.filter((m) => m.category === 'polymer');
const POLYMER_TYPES = ['Addition polymer', 'Condensation polymer', 'Natural polymer'];
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const monomerLabel = (m: Molecule) => (m.monomers ?? []).join(' + ');

function polymerChoice(task: Exclude<PolymerTask, { ask: 'chain-mass' }>, i: number): ChoiceItem | null {
  const p = POLYMERS.find((x) => x.id === task.polymer);
  if (!p) return null;
  const rng = seededRandom(100 + i);
  switch (task.ask) {
    case 'monomer': {
      const others = shuffle(Array.from(new Set(POLYMERS.filter((x) => monomerLabel(x) !== monomerLabel(p)).map(monomerLabel))), rng).slice(0, 3);
      return { id: `poly-${i}`, prompt: <>Which monomer(s) make <strong>{p.name}</strong>?</>, choices: shuffle([monomerLabel(p), ...others], rng), answer: monomerLabel(p), explanation: p.description };
    }
    case 'type':
      return { id: `poly-${i}`, prompt: <>What kind of polymer is <strong>{p.name}</strong>?</>, choices: POLYMER_TYPES, answer: capitalise(p.subcategory), explanation: p.subcategory === 'condensation polymer' ? 'Joining its monomers releases a small molecule (water).' : p.subcategory === 'addition polymer' ? 'Monomers with a C=C double bond simply add together.' : 'It is made by living things.' };
    case 'recycling': {
      const code = p.recyclingCodes?.[0];
      return { id: `poly-${i}`, prompt: <>Which recycling code is stamped on <strong>{p.name}</strong>?</>, choices: ['1', '2', '3', '5', '6'].map((c) => `♻ ${c}`), answer: `♻ ${code ?? '?'}`, explanation: `${p.name} is code ${p.recyclingCodes?.join(' or ')}.` };
    }
  }
}

function chainItem(task: Extract<PolymerTask, { ask: 'chain-mass' }>, i: number): NumericItem | null {
  const p = POLYMERS.find((x) => x.id === task.polymer);
  if (!p) return null;
  const unit = molarMass(p.formula);
  const answer = unit * task.n;
  return {
    id: `chain-${i}`,
    unit: 'g/mol',
    answer,
    prompt: <>A chain of <strong>{p.name}</strong> has <strong>{task.n.toLocaleString('en')}</strong> repeat units (<Formula value={p.formula} />, {unit.toFixed(2)} g/mol each). What is its molar mass?</>,
    explanation: `${task.n} × ${unit.toFixed(2)} = ${formatAnswer(answer)} g/mol.`,
  };
}

export function PolymerBuilder({ data, onComplete }: InteractiveProps<'polymer-builder'>) {
  const tasks = data?.tasks ?? [{ ask: 'monomer', polymer: 'polyethylene' }];
  const choices = tasks.map((t, i) => (t.ask === 'chain-mass' ? null : polymerChoice(t, i))).filter((x): x is ChoiceItem => x !== null);
  const numerics = tasks.map((t, i) => (t.ask === 'chain-mass' ? chainItem(t, i) : null)).filter((x): x is NumericItem => x !== null);
  const report = useCombinedScore([{ key: 'c', weight: choices.length }, { key: 'n', weight: numerics.length }], onComplete);
  const [polyId, setPolyId] = useState('polyethylene');
  const [n, setN] = useState(3);
  const poly = POLYMERS.find((p) => p.id === polyId) ?? POLYMERS[0]!;
  const unit = repeatUnit(poly.formula);

  return (
    <div className="space-y-4">
      <section className="glass p-3 space-y-2" aria-label="Chain builder">
        <div className="flex flex-wrap gap-3 items-center text-sm">
          <label className="flex items-center gap-1">Polymer
            <select value={polyId} onChange={(e) => setPolyId(e.target.value)}>{POLYMERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </label>
          <label className="flex items-center gap-2">Repeat units: {n}
            <input type="range" min={1} max={6} value={n} onChange={(e) => setN(Number(e.target.value))} />
          </label>
        </div>
        <p className="text-sm">Monomer{(poly.monomers?.length ?? 0) > 1 ? 's' : ''}: <strong>{monomerLabel(poly)}</strong> → {capitalise(poly.subcategory)}</p>
        <p className="font-mono text-sm overflow-x-auto whitespace-nowrap" data-testid="chain">
          {Array.from({ length: n }, (_, i) => <span key={i}>–[<Formula value={unit} />]</span>)}–
        </p>
        <p className="text-xs text-muted">{n} unit{n === 1 ? '' : 's'} × {molarMass(poly.formula).toFixed(2)} g/mol = {(n * molarMass(poly.formula)).toFixed(2)} g/mol. Real chains have thousands of units.</p>
      </section>
      {choices.length > 0 && <ChoiceTasks label="Polymer questions" items={choices} onComplete={(s) => report('c', s)} />}
      {numerics.length > 0 && <NumericTasks label="Chain mass problems" items={numerics} onComplete={(s) => report('n', s)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Buffer builder (Henderson–Hasselbalch)
// ---------------------------------------------------------------------------

const BUFFER_SYSTEMS = [
  { name: 'Acetic acid / acetate', pKa: 4.76 },
  { name: 'Carbonic acid / hydrogencarbonate (blood)', pKa: 6.35 },
  { name: 'Dihydrogen phosphate / hydrogen phosphate', pKa: 7.21 },
  { name: 'Ammonium / ammonia', pKa: 9.25 },
];

const article = (word: string, capital = false) => (/^[aeiou]/i.test(word) ? (capital ? 'An' : 'an') : (capital ? 'A' : 'a'));

function bufferItem(p: BufferProblem, i: number): NumericItem {
  switch (p.find) {
    case 'pH': {
      const answer = hendersonHasselbalch(p.pKa, p.baseConc, p.acidConc);
      return { id: `buffer-${i}`, answer, tolerance: { rel: 0, abs: 0.02 }, prompt: <>{article(p.acid, true)} {p.acid} buffer (pKa {p.pKa}) has [HA] = {p.acidConc} M and [A⁻] = {p.baseConc} M. What is its pH?</>, explanation: `pH = ${p.pKa} + log(${p.baseConc} ÷ ${p.acidConc}) = ${answer.toFixed(2)}.` };
    }
    case 'ratio': {
      const answer = bufferRatioForPh(p.pKa, p.targetPh);
      return { id: `buffer-${i}`, answer, tolerance: { rel: 0.03 }, prompt: <>For {article(p.acid)} {p.acid} buffer (pKa {p.pKa}), what ratio [A⁻]/[HA] gives pH {p.targetPh}?</>, explanation: `[A⁻]/[HA] = 10^(${p.targetPh} − ${p.pKa}) = ${formatAnswer(answer)}.` };
    }
    case 'pH-after-acid': {
      const answer = bufferPhAfterAddition(p.pKa, p.acidConc, p.baseConc, p.addedAcid);
      return { id: `buffer-${i}`, answer, tolerance: { rel: 0, abs: 0.02 }, prompt: <>1 L of {p.acid} buffer (pKa {p.pKa}, [HA] = {p.acidConc} M, [A⁻] = {p.baseConc} M) gets {p.addedAcid} mol of HCl. New pH?</>, explanation: `The acid turns A⁻ into HA: pH = ${p.pKa} + log(${formatAnswer(p.baseConc - p.addedAcid)} ÷ ${formatAnswer(p.acidConc + p.addedAcid)}) = ${answer.toFixed(2)}. The same acid in pure water would give pH ${(-Math.log10(p.addedAcid)).toFixed(2)}.` };
    }
  }
}

export function BufferLab({ data, onComplete }: InteractiveProps<'buffer'>) {
  const problems = data?.problems ?? [{ find: 'pH', acid: 'acetic acid', pKa: 4.76, acidConc: 0.1, baseConc: 0.1 }];
  const [sys, setSys] = useState(0);
  const [acid, setAcid] = useState(0.5);
  const [base, setBase] = useState(0.5);
  const [added, setAdded] = useState(0);
  const pKa = BUFFER_SYSTEMS[sys]!.pKa;
  const ph = bufferPhAfterAddition(pKa, acid, base, added);
  const waterPh = added > 0 ? -Math.log10(added) : 7;
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">A buffer is a weak acid (HA) mixed with its conjugate base (A⁻). pH = pKa + log([A⁻]/[HA]). Added acid turns A⁻ into HA, so the pH barely moves.</p>
      <NumericTasks label="Buffer problems" items={problems.map(bufferItem)} onComplete={(score) => onComplete({ score })} />
      <details className="glass p-3">
        <summary className="cursor-pointer text-sm font-semibold">🧪 Buffer bench</summary>
        <div className="space-y-2 mt-2 text-sm">
          <label className="flex items-center gap-2">System
            <select value={sys} onChange={(e) => setSys(Number(e.target.value))}>{BUFFER_SYSTEMS.map((b, i) => <option key={b.name} value={i}>{b.name} (pKa {b.pKa})</option>)}</select>
          </label>
          <label className="block">[HA] = {acid.toFixed(2)} M <input type="range" min={0.05} max={1} step={0.05} value={acid} onChange={(e) => setAcid(Number(e.target.value))} className="w-full" /></label>
          <label className="block">[A⁻] = {base.toFixed(2)} M <input type="range" min={0.05} max={1} step={0.05} value={base} onChange={(e) => setBase(Number(e.target.value))} className="w-full" /></label>
          <label className="block">Strong acid added: {added.toFixed(2)} mol <input type="range" min={0} max={0.3} step={0.01} value={added} onChange={(e) => setAdded(Number(e.target.value))} className="w-full" /></label>
          <p data-testid="buffer-ph">Buffer pH: <strong>{Number.isNaN(ph) ? 'capacity exceeded!' : ph.toFixed(2)}</strong> · same acid in pure water: pH {waterPh.toFixed(2)}</p>
        </div>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Electron configuration builder
// ---------------------------------------------------------------------------

/** Orbital boxes for a subshell filled following Hund's rule. */
function OrbitalBoxes({ l, electrons }: { l: SubshellLetter; electrons: number }) {
  const boxes = SUBSHELL_CAPACITY[l] / 2;
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {Array.from({ length: boxes }, (_, b) => {
        const up = electrons > b;
        const down = electrons > boxes + b;
        return <span key={b} className="inline-flex w-5 h-5 border border-[var(--card-border)] items-center justify-center text-[10px] leading-none">{up ? '↑' : ''}{down ? '↓' : ''}</span>;
      })}
    </span>
  );
}

export function ElectronConfigBuilder({ data, onComplete }: InteractiveProps<'electron-config'>) {
  const targets = (data?.targets ?? ['O']).map((s) => getElement(s)).filter((e): e is NonNullable<typeof e> => e !== undefined);
  const [idx, setIdx] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [tries, setTries] = useState(0);
  const [points, setPoints] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const el = targets[idx];
  const done = idx >= targets.length;

  if (done || !el) {
    return <p className="text-green-400 font-semibold" role="status">✅ All configurations built ({points} / {targets.length} points).</p>;
  }

  const z = el.atomicNumber;
  const target = configCounts(el.electronConfig);
  const aufbau = Object.fromEntries(aufbauSubshells(z).map((s) => [`${s.n}${s.l}`, s.electrons]));
  const lastIdx = Math.max(...[...Object.keys(target), ...Object.keys(aufbau)].map((k) => AUFBAU_ORDER.indexOf(k)));
  const shown = AUFBAU_ORDER.slice(0, Math.min(AUFBAU_ORDER.length, lastIdx + 2));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const core = Object.entries(NOBLE_GAS_CORES).filter(([, cz]) => cz < z).sort((a, b) => b[1] - a[1])[0];

  const change = (key: string, delta: number) => {
    const cap = SUBSHELL_CAPACITY[key[1] as SubshellLetter];
    setCounts((c) => ({ ...c, [key]: Math.max(0, Math.min(cap, (c[key] ?? 0) + delta)) }));
    setFeedback(null);
  };
  const fillCore = () => {
    if (!core) return;
    const next: Record<string, number> = { ...counts };
    for (const s of aufbauSubshells(core[1])) next[`${s.n}${s.l}`] = s.electrons;
    setCounts(next);
    setFeedback(null);
  };
  const advance = (earned: number) => {
    const newPoints = points + earned;
    setPoints(newPoints);
    setIdx(idx + 1);
    setCounts({});
    setTries(0);
    if (idx + 1 === targets.length) onComplete({ score: newPoints / targets.length });
  };
  const check = () => {
    const built = Object.fromEntries(Object.entries(counts).filter(([, e]) => e > 0));
    const correct = Object.keys({ ...built, ...target }).every((k) => (built[k] ?? 0) === (target[k] ?? 0));
    const attempt = tries + 1;
    setTries(attempt);
    if (correct) {
      setFeedback({ ok: true, text: `✅ Correct: ${el.name} is ${el.electronConfig}.` });
      advance(attempt === 1 ? 1 : 0.5);
      return;
    }
    const matchesAufbau = Object.keys({ ...built, ...aufbau }).every((k) => (built[k] ?? 0) === (aufbau[k] ?? 0));
    let text: string;
    if (total !== z) text = `❌ You placed ${total} electrons; a neutral ${el.name} atom has ${z}.`;
    else if (matchesAufbau && AUFBAU_EXCEPTIONS.has(el.symbol)) text = `❌ That is the aufbau prediction, but ${el.name} is an exception: a half-filled or completely filled subshell is extra stable, so an electron moves.`;
    else text = '❌ Not the ground state. Fill lower-energy subshells first, following the order shown.';
    setFeedback({ ok: false, text });
  };
  const reveal = () => {
    setFeedback({ ok: true, text: `The answer was ${el.electronConfig}.` });
    advance(0);
  };

  return (
    <div className="space-y-3">
      <p>Target {idx + 1} / {targets.length}: <strong data-testid="config-target">{el.name} ({el.symbol}), Z = {z}</strong></p>
      <p className="text-xs text-muted">Fill order (aufbau): {shown.join(' → ')}. Each orbital box holds 2 electrons with opposite spins; fill boxes singly first (Hund's rule).</p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {shown.map((key) => {
          const l = key[1] as SubshellLetter;
          const n = counts[key] ?? 0;
          return (
            <li key={key} className="glass px-2 py-1 flex items-center gap-2 text-sm">
              <span className="w-8 font-mono font-bold">{key}</span>
              <OrbitalBoxes l={l} electrons={n} />
              <span className="ml-auto tabular-nums" data-testid={`sub-${key}`}>{n}/{SUBSHELL_CAPACITY[l]}</span>
              <button className="btn btn-ghost !py-0 !px-2" aria-label={`Remove electron from ${key}`} onClick={() => change(key, -1)} disabled={n === 0}>−</button>
              <button className="btn btn-ghost !py-0 !px-2" aria-label={`Add electron to ${key}`} onClick={() => change(key, 1)} disabled={n >= SUBSHELL_CAPACITY[l]}>+</button>
            </li>
          );
        })}
      </ul>
      <p className="text-sm" aria-live="polite">Electrons: <strong data-testid="config-total">{total} / {z}</strong>{total > 0 && <> · <span className="font-mono" data-testid="config-built">{condenseCounts(counts)}</span></>}</p>
      <div className="flex flex-wrap gap-2">
        {core && <button className="btn btn-ghost !py-1 !px-3 text-sm" onClick={fillCore}>Fill [{core[0]}] core</button>}
        <button className="btn btn-ghost !py-1 !px-3 text-sm" onClick={() => { setCounts({}); setFeedback(null); }}>Clear</button>
        <button className="btn btn-primary !py-1 !px-3 text-sm" onClick={check} disabled={total === 0}>Check</button>
        {tries > 0 && <button className="btn btn-ghost !py-1 !px-3 text-sm" onClick={reveal}>Show answer (no points)</button>}
      </div>
      {feedback && <p className={`text-sm ${feedback.ok ? 'text-green-400' : 'text-red-400'}`} role="status">{feedback.text}</p>}
    </div>
  );
}
