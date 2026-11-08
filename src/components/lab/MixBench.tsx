import { useState } from 'react';
import { REACTIONS } from '../../data/reactions';
import { useGameStore } from '../../store/useGameStore';
import { playSound } from '../../lib/sound';
import {
  benchReagents, benchItemLabel, findReaction, formatEquation, collectibleProducts, speciesName, isCondition, CONDITIONS,
} from '../../game/engine/reactions';
import { Formula } from '../molecules/Formula';
import type { Reaction } from '../../types';

const REAGENTS = benchReagents();

function describe(item: string): string {
  if (!item) return 'nothing';
  return isCondition(item) ? benchItemLabel(item) : speciesName(item);
}

/**
 * Two-slot mixing bench. The second slot can also hold a condition (heat, catalyst, yeast).
 * `allowCollect` shows collect buttons for products that are collectible molecules.
 */
export function MixBench({ allowCollect = false, initial, onReaction }: {
  allowCollect?: boolean;
  initial?: [string, string];
  /** Called after each Mix with the reaction that happened (undefined when nothing happened). */
  onReaction?: (reaction: Reaction | undefined) => void;
}) {
  const [a, setA] = useState(initial?.[0] ?? 'HCl');
  const [b, setB] = useState(initial?.[1] ?? 'NaOH');
  const [result, setResult] = useState<{ reaction: Reaction | undefined; a: string; b: string } | null>(null);
  const collected = useGameStore((s) => s.progress.collection.molecules);
  const collect = useGameStore((s) => s.collectMolecule);
  const soundOn = useGameStore((s) => s.progress.settings.audio);

  const mix = () => {
    const reaction = findReaction([a, b]);
    setResult({ reaction, a, b });
    onReaction?.(reaction);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-xs text-muted gap-1">
          First substance
          <select value={a} onChange={(e) => { setA(e.target.value); setResult(null); }} className="text-sm">
            {REAGENTS.map((r) => <option key={r} value={r}>{benchItemLabel(r)}</option>)}
          </select>
        </label>
        <span className="pb-2 font-bold" aria-hidden>+</span>
        <label className="flex flex-col text-xs text-muted gap-1">
          Second substance or condition
          <select value={b} onChange={(e) => { setB(e.target.value); setResult(null); }} className="text-sm">
            <option value="">— nothing —</option>
            <optgroup label="Conditions">
              {CONDITIONS.map((c) => <option key={c} value={c}>{benchItemLabel(c)}</option>)}
            </optgroup>
            <optgroup label="Substances">
              {REAGENTS.map((r) => <option key={r} value={r}>{benchItemLabel(r)}</option>)}
            </optgroup>
          </select>
        </label>
        <button className="btn btn-primary" onClick={mix}>Mix!</button>
      </div>

      {result && (
        <div className="glass p-3 space-y-2" role="status" aria-live="polite">
          {result.reaction ? (
            <>
              <p className="font-bold">⚗️ {result.reaction.name} <span className="text-xs font-normal text-muted">({result.reaction.type})</span></p>
              <p className="text-lg" data-testid="equation"><Formula value={formatEquation(result.reaction)} /></p>
              <p className="text-sm">👀 {result.reaction.observation}</p>
              {result.reaction.note && <p className="text-xs text-muted">ℹ️ {result.reaction.note}</p>}
              <ul className="flex flex-wrap gap-2">
                {result.reaction.products.map((p) => {
                  const mol = collectibleProducts({ ...result.reaction!, products: [p] })[0];
                  const have = mol ? collected.includes(mol.id) : false;
                  return (
                    <li key={p.formula} className="glass px-2 py-1 text-sm flex items-center gap-2">
                      <span>{speciesName(p.formula)} (<Formula value={p.formula} />)</span>
                      {mol && allowCollect && (have
                        ? <span className="text-xs text-green-400">✓</span>
                        : <button className="btn btn-primary !py-0.5 !px-2 text-xs" onClick={() => { collect(mol.id); playSound('collect', soundOn); }}>Collect {mol.name}</button>)}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-sm">No visible reaction between {describe(result.a)} and {describe(result.b)}. Try another combination!</p>
          )}
        </div>
      )}
      <p className="text-xs text-muted">{REACTIONS.length} reactions can be discovered on this bench.</p>
    </div>
  );
}
