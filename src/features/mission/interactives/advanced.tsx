import { useState } from 'react';
import { deltaGkJ as deltaG, spontaneity, rateLaw, cellPotential, remainingAmount } from '../../../game/engine/chemistry';
import { formatAnswer } from '../../../game/engine/answers';
import { REDUCTION_POTENTIALS } from '../../../data/electrochem';
import type { EquilibriumData, EquilibriumShift } from '../../../types';
import type { InteractiveProps } from './types';
import { ChoiceTasks, NumericTasks } from './tasks';

const fmtV = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)} V`;

// ---------------------------------------------------------------------------
// Equilibrium (Le Chatelier)
// ---------------------------------------------------------------------------

const SHIFTS: EquilibriumShift[] = ['Toward products', 'Toward reactants', 'No shift'];

const DEFAULT_EQUILIBRIUM: EquilibriumData = {
  reaction: 'N2 + 3H2 ⇌ 2NH3 (exothermic)',
  scenarios: [{ change: 'Add more N₂', answer: 'Toward products', explanation: 'Adding a reactant pushes the system to use it up.' }],
};

export function Equilibrium({ data, onComplete }: InteractiveProps<'equilibrium'>) {
  const d = data ?? DEFAULT_EQUILIBRIUM;
  return (
    <div className="space-y-3">
      <p className="glass p-3 text-sm">Reaction at equilibrium: <strong>{d.reaction}</strong></p>
      <p className="text-xs text-muted">Le Chatelier's principle: a system at equilibrium shifts to oppose any change made to it.</p>
      <ChoiceTasks
        label="Equilibrium shifts"
        onComplete={(score) => onComplete({ score })}
        items={d.scenarios.map((s, i) => ({ id: `eq-${i}`, prompt: <>{s.change}. Which way does the equilibrium shift?</>, choices: SHIFTS, answer: s.answer, explanation: s.explanation }))}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thermodynamics (ΔG = ΔH − TΔS)
// ---------------------------------------------------------------------------

export function Thermo({ data, onComplete }: InteractiveProps<'thermo'>) {
  const problems = data?.problems ?? [{ dH: -100, dS: 200, T: 300 }];
  const [dh, setDh] = useState(-100);
  const [ds, setDs] = useState(200);
  const [t, setT] = useState(300);
  const g = deltaG(dh, ds, t);
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">ΔG = ΔH − TΔS. Convert ΔS from J/(mol·K) to kJ/(mol·K) by dividing by 1000. ΔG &lt; 0 means spontaneous.</p>
      <NumericTasks
        label="Gibbs free energy problems"
        onComplete={(score) => onComplete({ score })}
        items={problems.map((p, i) => {
          const answer = deltaG(p.dH, p.dS, p.T);
          return {
            id: `thermo-${i}`,
            unit: 'kJ/mol',
            answer,
            tolerance: { rel: 0.02, abs: 0.5 },
            prompt: <>{p.label ? <strong>{p.label}: </strong> : null}ΔH = {p.dH} kJ/mol, ΔS = {p.dS} J/(mol·K), T = {p.T} K. What is ΔG?</>,
            explanation: `ΔG = ${p.dH} − ${p.T} × (${p.dS} ÷ 1000) = ${formatAnswer(answer)} kJ/mol → ${spontaneity(Math.abs(answer) < 1e-9 ? 0 : answer)}.`,
          };
        })}
      />
      <details className="glass p-3">
        <summary className="cursor-pointer text-sm font-semibold">🌡️ ΔG calculator</summary>
        <div className="flex flex-wrap gap-3 mt-2 text-sm">
          <label>ΔH (kJ/mol) <input type="number" className="w-24" value={dh} onChange={(e) => setDh(Number(e.target.value))} /></label>
          <label>ΔS (J/(mol·K)) <input type="number" className="w-24" value={ds} onChange={(e) => setDs(Number(e.target.value))} /></label>
          <label>T (K) <input type="number" className="w-24" value={t} onChange={(e) => setT(Number(e.target.value))} /></label>
        </div>
        <p className="text-sm mt-2">ΔG = {g.toFixed(2)} kJ/mol → {spontaneity(g)}</p>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kinetics (rate laws)
// ---------------------------------------------------------------------------

export function Kinetics({ data, onComplete }: InteractiveProps<'kinetics'>) {
  const problems = data?.problems ?? [{ order: 1, factor: 2 }];
  const [k, setK] = useState(0.1);
  const [a, setA] = useState(1);
  const [order, setOrder] = useState(1);
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">For rate = k[A]ⁿ, multiplying [A] by a factor f multiplies the rate by fⁿ.</p>
      <NumericTasks
        label="Rate law problems"
        onComplete={(score) => onComplete({ score })}
        items={problems.map((p, i) => {
          const answer = Math.pow(p.factor, p.order);
          const ord = ['zero', 'first', 'second', 'third'][p.order] ?? `${p.order}th`;
          return {
            id: `kin-${i}`,
            unit: '× the rate',
            answer,
            prompt: <>The reaction is <strong>{ord} order</strong> in A. If [A] is multiplied by <strong>{p.factor}</strong>, the rate is multiplied by…</>,
            explanation: `${p.factor}^${p.order} = ${formatAnswer(answer)}.`,
          };
        })}
      />
      <details className="glass p-3">
        <summary className="cursor-pointer text-sm font-semibold">⏱️ Rate sandbox</summary>
        <div className="flex flex-wrap gap-3 mt-2 text-sm">
          <label>k <input type="number" step={0.01} className="w-20" value={k} onChange={(e) => setK(Number(e.target.value))} /></label>
          <label>[A] (mol/L) <input type="number" step={0.1} className="w-20" value={a} onChange={(e) => setA(Number(e.target.value))} /></label>
          <label>order n
            <select value={order} onChange={(e) => setOrder(Number(e.target.value))}>{[0, 1, 2].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </label>
        </div>
        <p className="text-sm mt-2">Rate = {formatAnswer(rateLaw(k, [a], [order]))} mol/(L·s)</p>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Galvanic cells
// ---------------------------------------------------------------------------

const METALS = Object.keys(REDUCTION_POTENTIALS);

export function CellBuilder({ data, onComplete }: InteractiveProps<'cell-builder'>) {
  const problems = data?.problems ?? [{ cathode: 'Cu', anode: 'Zn' }];
  const [cathode, setCathode] = useState('Cu');
  const [anode, setAnode] = useState('Zn');
  const e = (m: string) => REDUCTION_POTENTIALS[m]?.e0 ?? 0;
  const ecell = cellPotential(e(cathode), e(anode));
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">E°cell = E°cathode − E°anode. Reduction happens at the cathode, oxidation at the anode. A positive E°cell means the cell works on its own (galvanic).</p>
      <NumericTasks
        label="Cell potential problems"
        onComplete={(score) => onComplete({ score })}
        items={problems.map((p, i) => {
          const answer = cellPotential(e(p.cathode), e(p.anode));
          return {
            id: `cell-${i}`,
            unit: 'V',
            answer,
            tolerance: { rel: 0, abs: 0.015 },
            prompt: <>Cathode {REDUCTION_POTENTIALS[p.cathode]?.halfReaction} (E° = {fmtV(e(p.cathode))}); anode {REDUCTION_POTENTIALS[p.anode]?.halfReaction} (E° = {fmtV(e(p.anode))}). What is E°cell?</>,
            explanation: `${fmtV(e(p.cathode))} − (${fmtV(e(p.anode))}) = ${fmtV(answer)}.`,
          };
        })}
      />
      <details className="glass p-3">
        <summary className="cursor-pointer text-sm font-semibold">🔋 Build a cell</summary>
        <div className="flex flex-wrap gap-3 mt-2 text-sm">
          <label>Cathode <select value={cathode} onChange={(ev) => setCathode(ev.target.value)}>{METALS.map((m) => <option key={m} value={m}>{m} ({fmtV(e(m))})</option>)}</select></label>
          <label>Anode <select value={anode} onChange={(ev) => setAnode(ev.target.value)}>{METALS.map((m) => <option key={m} value={m}>{m} ({fmtV(e(m))})</option>)}</select></label>
        </div>
        <p className="text-sm mt-2">E°cell = {fmtV(ecell)} → {ecell > 0 ? 'galvanic (spontaneous)' : ecell < 0 ? 'needs electricity (electrolytic)' : 'no voltage'}</p>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Radioactive decay
// ---------------------------------------------------------------------------

export function Decay({ data, onComplete }: InteractiveProps<'decay'>) {
  const problems = data?.problems ?? [{ n0: 100, halfLife: 5730, t: 5730, unit: 'years', quantity: 'g' }];
  const [n0, setN0] = useState(100);
  const [hl, setHl] = useState(5730);
  const [t, setT] = useState(5730);
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">N = N₀ × (½)^(t ÷ t½). After each half-life, half of what is left decays.</p>
      <NumericTasks
        label="Half-life problems"
        onComplete={(score) => onComplete({ score })}
        items={problems.map((p, i) => {
          const answer = remainingAmount(p.n0, p.halfLife, p.t);
          const q = p.quantity ?? 'g';
          return {
            id: `decay-${i}`,
            unit: q,
            answer,
            prompt: <>Start with <strong>{p.n0} {q}</strong>. The half-life is <strong>{p.halfLife} {p.unit}</strong>. How much is left after <strong>{p.t} {p.unit}</strong>?</>,
            explanation: `${p.n0} × (½)^(${p.t} ÷ ${p.halfLife}) = ${formatAnswer(answer)} ${q}.`,
          };
        })}
      />
      <details className="glass p-3">
        <summary className="cursor-pointer text-sm font-semibold">☢️ Decay calculator</summary>
        <div className="flex flex-wrap gap-3 mt-2 text-sm">
          <label>N₀ <input type="number" className="w-24" value={n0} onChange={(e) => setN0(Number(e.target.value))} /></label>
          <label>Half-life <input type="number" className="w-24" value={hl} onChange={(e) => setHl(Number(e.target.value))} /></label>
          <label>Time <input type="number" className="w-24" value={t} onChange={(e) => setT(Number(e.target.value))} /></label>
        </div>
        <p className="text-sm mt-2">Remaining = {formatAnswer(remainingAmount(n0, hl, t))}</p>
      </details>
    </div>
  );
}
