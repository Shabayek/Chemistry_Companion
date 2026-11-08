import { useState } from 'react';
import { motion } from 'framer-motion';
import { ELEMENTS, COMMON_ELEMENT_SYMBOLS, getElement, getElementByNumber } from '../../../data/elements';
import { parseFormula } from '../../../game/engine/chemistry';
import { findMoleculesByCounts } from '../../../game/engine/molecules';
import { sample } from '../../../game/engine/random';
import { PeriodicGrid } from '../../../components/periodic/PeriodicGrid';
import { ElementDetail } from '../../../components/periodic/ElementDetail';
import { Formula } from '../../../components/molecules/Formula';
import type { BondBuilderData, Element, SorterData } from '../../../types';
import type { InteractiveProps } from './types';
import { ChoiceTasks } from './tasks';

// ---------------------------------------------------------------------------
// Atom builder
// ---------------------------------------------------------------------------

export function AtomBuilder({ data, onComplete }: InteractiveProps<'atom-builder'>) {
  const t = data?.target ?? { p: 1, n: 0, e: 1 };
  const [counts, setCounts] = useState({ p: 0, n: 0, e: 0 });
  const [done, setDone] = useState(false);
  const identity = counts.p > 0 ? getElementByNumber(counts.p) : undefined;
  const charge = counts.p - counts.e;

  const change = (key: 'p' | 'n' | 'e', delta: number) => {
    const next = { ...counts, [key]: Math.max(0, Math.min(30, counts[key] + delta)) };
    setCounts(next);
    if (!done && next.p === t.p && next.n === t.n && next.e === t.e) {
      setDone(true);
      onComplete({ score: 1 });
    }
  };

  const rows = [
    { key: 'p' as const, label: 'Protons', one: 'a proton', color: 'var(--danger)' },
    { key: 'n' as const, label: 'Neutrons', one: 'a neutron', color: 'var(--muted)' },
    { key: 'e' as const, label: 'Electrons', one: 'an electron', color: 'var(--accent)' },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm">Target: <strong>{t.p}</strong> protons, <strong>{t.n}</strong> neutrons, <strong>{t.e}</strong> electrons{data?.element ? ` (${getElement(data.element)?.name ?? data.element})` : ''}.</p>
      <div className="grid grid-cols-3 gap-3">
        {rows.map((x) => (
          <div key={x.key} className="glass p-3 text-center">
            <div className="text-sm font-semibold">{x.label}</div>
            <div className="text-2xl font-bold my-2" style={{ color: x.color }} data-testid={`atom-${x.key}`}>{counts[x.key]}</div>
            <div className="flex gap-2 justify-center">
              <button className="btn btn-ghost !py-1 !px-3" aria-label={`Remove ${x.one}`} onClick={() => change(x.key, -1)}>-</button>
              <button className="btn btn-ghost !py-1 !px-3" aria-label={`Add ${x.one}`} onClick={() => change(x.key, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted" aria-live="polite">
        {identity ? <>This is <strong>{identity.name}</strong> · mass number {counts.p + counts.n} · charge {charge === 0 ? '0 (neutral)' : charge > 0 ? `+${charge}` : charge}</> : 'Add protons: the number of protons decides the element.'}
      </p>
      {done && <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-green-400 font-bold" role="status">✅ Atom built correctly!</motion.div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Symbol match
// ---------------------------------------------------------------------------

function resolvePool(pool: 'common' | 'all' | string[] | undefined): Element[] {
  if (pool === 'all') return [...ELEMENTS];
  const symbols = Array.isArray(pool) ? pool : COMMON_ELEMENT_SYMBOLS;
  return symbols.map((s) => getElement(s)).filter((e): e is Element => e !== undefined);
}

/** Name → symbol drill over a pool of elements (default: common elements; 'all' uses all 118). */
export function SymbolMatch({ data, onComplete }: InteractiveProps<'symbol-match'>) {
  const rounds = data?.rounds ?? 10;
  const [deck, setDeck] = useState(() => sample(resolvePool(data?.pool), rounds));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'correct' | 'wrong' | 'case'; text: string } | null>(null);
  const done = idx >= deck.length;
  const el = deck[Math.min(idx, deck.length - 1)];
  const answered = feedback?.kind === 'correct' || feedback?.kind === 'wrong';

  const next = () => { setIdx((i) => i + 1); setInput(''); setFeedback(null); };
  const check = () => {
    if (!el || answered) return;
    const guess = input.trim();
    let newScore = score;
    if (guess === el.symbol) {
      newScore = score + 1;
      setScore(newScore);
      setFeedback({ kind: 'correct', text: `✅ Correct! ${el.name} is ${el.symbol}.` });
    } else if (guess.toLowerCase() === el.symbol.toLowerCase()) {
      setFeedback({ kind: 'case', text: 'Almost! Check the capital letters: only the first letter is uppercase.' });
      return;
    } else {
      setFeedback({ kind: 'wrong', text: `❌ Not quite. The symbol for ${el.name} is ${el.symbol}.` });
    }
    if (idx === deck.length - 1) onComplete({ score: newScore / deck.length });
  };

  if (done || !el) {
    return (
      <div className="space-y-2" role="status">
        <p className="font-bold">You matched {score} / {deck.length} symbols.</p>
        <button className="btn btn-ghost" onClick={() => { setDeck(sample(resolvePool(data?.pool), rounds)); setIdx(0); setScore(0); setFeedback(null); }}>Play again</button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">Round {idx + 1} / {deck.length} · Score {score}</p>
      <p>Element: <strong data-testid="symbol-match-name">{el.name}</strong> <span className="text-xs text-muted">(atomic number {el.atomicNumber})</span></p>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (answered) next(); else check(); }}>
        <label className="sr-only" htmlFor="symbol-input">Symbol</label>
        <input id="symbol-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Symbol" maxLength={3} autoComplete="off" disabled={answered} className="w-28" />
        {answered
          ? <button type="submit" className="btn btn-primary">Next element →</button>
          : <button type="submit" className="btn btn-primary">Check</button>}
      </form>
      {feedback && <p role="status">{feedback.text}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sorter (states of matter and any other categorisation)
// ---------------------------------------------------------------------------

const DEFAULT_SORTER: SorterData = {
  categories: ['Solid', 'Liquid', 'Gas'],
  items: [
    { label: 'Ice', category: 'Solid' },
    { label: 'Water', category: 'Liquid' },
    { label: 'Steam', category: 'Gas' },
    { label: 'Iron nail', category: 'Solid' },
  ],
};

export function Sorter({ data, onComplete }: InteractiveProps<'state-sorter'> | InteractiveProps<'sorter'>) {
  const d = data ?? DEFAULT_SORTER;
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const correct = d.items.filter((it) => choices[it.label] === it.category).length;
  const allChosen = d.items.every((it) => choices[it.label]);

  const check = () => {
    setChecked(true);
    onComplete({ score: correct / d.items.length });
  };

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {d.items.map((it) => {
          const id = `sort-${it.label.replace(/\W+/g, '-')}`;
          const mark = checked ? (choices[it.label] === it.category ? '✅' : `❌ ${it.category}`) : '';
          return (
            <li key={it.label} className="flex flex-wrap items-center gap-2">
              <label htmlFor={id} className="w-48 text-sm">{it.label}</label>
              <select id={id} value={choices[it.label] ?? ''} disabled={checked} onChange={(e) => setChoices((c) => ({ ...c, [it.label]: e.target.value }))}>
                <option value="">--</option>
                {d.categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {mark && <span role="img" className="text-sm" aria-label={mark.startsWith('✅') ? 'correct' : `incorrect, ${it.category}`}>{mark}</span>}
            </li>
          );
        })}
      </ul>
      {!checked && <button className="btn btn-primary" onClick={check} disabled={!allChosen}>Check</button>}
      {checked && (
        <div className="flex items-center gap-3" role="status">
          <span className={correct === d.items.length ? 'text-green-400 font-semibold' : 'font-semibold'}>{correct === d.items.length ? '✅ All correct!' : `${correct} / ${d.items.length} correct.`}</span>
          {correct < d.items.length && <button className="btn btn-ghost !py-1 !px-3 text-sm" onClick={() => { setChecked(false); setChoices({}); }}>Try again</button>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Molecule maker
// ---------------------------------------------------------------------------

export function MoleculeMaker({ data, onComplete }: InteractiveProps<'molecule-maker'>) {
  const target = data?.target ?? 'H2O';
  const targetCounts = parseFormula(target);
  // Offer the needed elements plus a few distractors.
  const palette = Array.from(new Set([...Object.keys(targetCounts), 'H', 'C', 'N', 'O'])).slice(0, Math.max(4, Object.keys(targetCounts).length + 1));
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const built = Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 0));
  const match = findMoleculesByCounts(built)[0]?.molecule;

  const change = (s: string, delta: number) => {
    const next = { ...counts, [s]: Math.max(0, Math.min(20, (counts[s] ?? 0) + delta)) };
    setCounts(next);
    const ok = Object.keys({ ...targetCounts, ...next }).every((k) => (next[k] ?? 0) === (targetCounts[k] ?? 0));
    if (ok && !done) {
      setDone(true);
      onComplete({ score: 1 });
    }
  };

  return (
    <div className="space-y-3">
      <p>Build <strong><Formula value={target} /></strong></p>
      <div className="flex gap-3 flex-wrap">
        {palette.map((s) => (
          <div key={s} className="glass p-3 text-center">
            <div className="font-bold">{s}</div>
            <div className="text-xl" data-testid={`mm-count-${s}`}>{counts[s] ?? 0}</div>
            <div className="flex gap-1 justify-center mt-1">
              <button className="btn btn-ghost !py-1 !px-2" aria-label={`Remove ${s}`} onClick={() => change(s, -1)}>-</button>
              <button className="btn btn-ghost !py-1 !px-2" aria-label={`Add ${s}`} onClick={() => change(s, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>
      {match && !done && <p className="text-sm text-muted">That's {match.name}, but not the target.</p>}
      {done && <motion.div className="text-green-400 font-bold" role="status">✅ Molecule complete{match ? `: ${match.name}` : ''}!</motion.div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Periodic explorer
// ---------------------------------------------------------------------------

const EXPLORE_TARGET = 3;

export function PeriodicExplorer({ data, onComplete }: InteractiveProps<'periodic-explorer'>) {
  const clues = data?.clues ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [explored, setExplored] = useState<string[]>([]);
  const [clueIdx, setClueIdx] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [missedThisClue, setMissedThisClue] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const el = selected ? getElement(selected) : undefined;
  const clue = clues[clueIdx];
  const finished = clues.length > 0 && clueIdx >= clues.length;

  const onSelect = (symbol: string) => {
    setSelected(symbol);
    if (clues.length === 0) {
      const next = explored.includes(symbol) ? explored : [...explored, symbol];
      setExplored(next);
      if (next.length === EXPLORE_TARGET) onComplete({ score: 1 });
      return;
    }
    if (!clue) return;
    const name = getElement(symbol)?.name ?? symbol;
    if (symbol === clue.answer) {
      const score = firstTry + (missedThisClue ? 0 : 1);
      setFirstTry(score);
      setMissedThisClue(false);
      setFeedback(`✅ Yes, ${name}!`);
      setClueIdx((i) => i + 1);
      if (clueIdx + 1 === clues.length) onComplete({ score: score / clues.length });
    } else {
      setMissedThisClue(true);
      setFeedback(`❌ That's ${name}. Try again.`);
    }
  };

  return (
    <div className="space-y-3">
      {clues.length > 0 && (
        <div className="glass p-3" aria-live="polite">
          {finished
            ? <p className="font-semibold text-green-400" role="status">✅ All {clues.length} elements found ({firstTry} on the first try).</p>
            : <p><span className="text-xs text-muted">Clue {clueIdx + 1} / {clues.length}:</span> <strong data-testid="clue">{clue?.clue}</strong></p>}
          {feedback && !finished && <p className="text-sm" role="status">{feedback}</p>}
        </div>
      )}
      {clues.length === 0 && (
        <p className="text-sm text-muted" role="status">
          {explored.length >= EXPLORE_TARGET ? `✅ Explored ${explored.length} elements.` : `Explore ${EXPLORE_TARGET - explored.length} more element${EXPLORE_TARGET - explored.length === 1 ? '' : 's'}.`}
        </p>
      )}
      <PeriodicGrid selected={selected} onSelect={onSelect} compact label="Periodic table explorer" />
      {el ? <ElementDetail element={el} /> : <p className="text-sm text-muted">Tap an element (or use the arrow keys) to learn about it.</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bond builder
// ---------------------------------------------------------------------------

const DEFAULT_PAIRS: BondBuilderData['pairs'] = [
  { a: 'Na', b: 'Cl', answer: 'ionic' },
  { a: 'H', b: 'O', answer: 'covalent' },
  { a: 'Cu', b: 'Cu', answer: 'metallic' },
];

/** Metal / nonmetal / metalloid, as used when predicting bond types. */
function kindOf(symbol: string): string {
  const el = getElement(symbol);
  if (!el) return symbol;
  if (el.category === 'metalloid') return 'metalloid';
  return el.category === 'nonmetal' || el.category === 'halogen' || el.category === 'noble gas' ? 'nonmetal' : 'metal';
}

export function BondBuilder({ data, onComplete }: InteractiveProps<'bond-builder'>) {
  const pairs = data?.pairs ?? DEFAULT_PAIRS;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Ionic = a metal gives electrons to a nonmetal · Covalent = nonmetals share electrons · Metallic = metal atoms share a "sea" of electrons.</p>
      <ChoiceTasks
        label="Bond types"
        onComplete={(score) => onComplete({ score })}
        items={pairs.map((p, i) => ({
          id: `bond-${i}`,
          prompt: <>What bond forms between <strong>{getElement(p.a)?.name ?? p.a}</strong> ({kindOf(p.a)}) and <strong>{getElement(p.b)?.name ?? p.b}</strong> ({kindOf(p.b)})?</>,
          choices: ['ionic', 'covalent', 'metallic'],
          answer: p.answer,
          ...(p.explanation ? { explanation: p.explanation } : {}),
        }))}
      />
    </div>
  );
}
