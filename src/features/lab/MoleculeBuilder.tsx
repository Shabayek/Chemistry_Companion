import { useMemo, useState } from 'react';
import { ELEMENTS, getElement } from '../../data/elements';
import { MOLECULES, getMolecule } from '../../data/molecules';
import { useGameStore } from '../../store/useGameStore';
import { playSound } from '../../lib/sound';
import {
  findMoleculesByCounts, nearMisses, molarMass, formatMolarMass, countsToHill, moleculeElementPalette, moleculeCounts,
} from '../../game/engine/molecules';
import { countsEqual } from '../../game/engine/chemistry';
import { sample } from '../../game/engine/random';
import { Formula } from '../../components/molecules/Formula';
import { MoleculeDetail } from '../../components/molecules/MoleculeDetail';
import { CATEGORY_COLORS, cellStyle } from '../../components/periodic/colors';
import type { Molecule } from '../../types';

const MAX_PER_ELEMENT = 60;
const PALETTE = moleculeElementPalette();

/**
 * Free-form molecule builder: add atoms, and any of the 60 molecules (or a polymer repeat unit) is recognised.
 * Recognised molecules can be collected. An optional challenge target guides the player.
 */
export default function MoleculeBuilder({ initialTarget }: { initialTarget?: string | null }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [extra, setExtra] = useState<string[]>([]);
  const [target, setTarget] = useState<Molecule | null>(() => (initialTarget ? getMolecule(initialTarget) ?? null : null));
  const [showFormula, setShowFormula] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const collected = useGameStore((s) => s.progress.collection.molecules);
  const collect = useGameStore((s) => s.collectMolecule);
  const soundOn = useGameStore((s) => s.progress.settings.audio);

  const symbols = [...PALETTE, ...extra.filter((s) => !PALETTE.includes(s))];
  const built = useMemo(() => Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 0)), [counts]);
  const total = Object.values(built).reduce((a, b) => a + b, 0);
  const matches = findMoleculesByCounts(built);
  const hints = matches.length === 0 ? nearMisses(built, 2).slice(0, 3) : [];
  const targetDone = target !== null && countsEqual(moleculeCounts(target), built);

  const change = (sym: string, delta: number) =>
    setCounts((c) => ({ ...c, [sym]: Math.min(MAX_PER_ELEMENT, Math.max(0, (c[sym] ?? 0) + delta)) }));

  const newChallenge = () => {
    const pool = MOLECULES.filter((m) => !collected.includes(m.id) && m.id !== target?.id);
    const pick = sample(pool.length > 0 ? pool : MOLECULES, 1)[0] ?? null;
    setTarget(pick);
    setShowFormula(false);
    setCounts({});
  };

  const detailMol = detail ? getMolecule(detail) : undefined;

  return (
    <div className="space-y-4">
      <section aria-label="Challenge" className="glass p-3 flex flex-wrap items-center gap-3">
        {target ? (
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm"><span aria-hidden>🎯</span> Challenge: build <strong>{target.name}</strong>{target.category === 'polymer' ? ' (one repeat unit)' : ''}</p>
            <p className="text-xs text-muted">{target.description}</p>
            {showFormula
              ? <p className="text-xs">Formula: <Formula value={target.formula} /></p>
              : <button className="text-xs underline text-[var(--accent)]" onClick={() => setShowFormula(true)}>Show formula hint</button>}
            {targetDone && <p className="text-green-400 font-semibold" role="status">🎉 Challenge complete!</p>}
          </div>
        ) : (
          <p className="flex-1 text-sm text-muted">Add atoms below. Any of the {MOLECULES.length} molecules you build is recognised.</p>
        )}
        <button className="btn btn-ghost !py-1.5 !px-3 text-sm" onClick={newChallenge}>{target ? 'New challenge' : '🎯 Challenge me'}</button>
        {target && <button className="btn btn-ghost !py-1.5 !px-3 text-sm" onClick={() => setTarget(null)}>End challenge</button>}
      </section>

      <section aria-label="Atoms" className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {symbols.map((sym) => {
            const el = getElement(sym)!;
            const n = counts[sym] ?? 0;
            return (
              <div key={sym} className="rounded-lg border p-2 text-center w-[84px]" style={cellStyle(CATEGORY_COLORS[el.category])}>
                <div className="font-bold">{sym}</div>
                <div className="text-[10px] truncate">{el.name}</div>
                <div className="text-lg font-bold" aria-live="polite" data-testid={`count-${sym}`}>{n}</div>
                <div className="flex gap-1 justify-center">
                  <button className="btn btn-ghost !py-0.5 !px-2" aria-label={`Remove ${el.name}`} onClick={() => change(sym, -1)} disabled={n === 0}>−</button>
                  <button className="btn btn-ghost !py-0.5 !px-2" aria-label={`Add ${el.name}`} onClick={() => change(sym, 1)}>+</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs text-muted flex items-center gap-2">
            Add another element
            <select
              value=""
              onChange={(e) => { const v = e.target.value; if (v) { setExtra((x) => (x.includes(v) || PALETTE.includes(v) ? x : [...x, v])); change(v, 1); } }}
              className="text-sm"
            >
              <option value="">Choose…</option>
              {ELEMENTS.filter((e) => !symbols.includes(e.symbol)).map((e) => <option key={e.symbol} value={e.symbol}>{e.name} ({e.symbol})</option>)}
            </select>
          </label>
          <button className="btn btn-ghost !py-1.5 !px-3 text-sm" onClick={() => setCounts({})} disabled={total === 0}>Clear</button>
        </div>
      </section>

      <section aria-label="Result" className="glass p-3 space-y-2" aria-live="polite">
        {total === 0 ? (
          <p className="text-sm text-muted">Your molecule is empty. Press + to add atoms.</p>
        ) : (
          <p className="text-sm">
            Built: <strong className="text-lg" data-testid="built-formula"><Formula value={countsToHill(built)} /></strong>
            <span className="text-muted"> · {total} atom{total === 1 ? '' : 's'} · {formatMolarMass(molarMass(built))}</span>
          </p>
        )}
        {matches.map(({ molecule: m, asRepeatUnit }) => {
          const have = collected.includes(m.id);
          return (
            <div key={m.id} className="flex flex-wrap items-center gap-2">
              <span className="text-green-400 font-semibold">✅ {asRepeatUnit ? `Repeat unit of ${m.name}` : `You built ${m.name}!`}</span>
              <Formula value={m.formula} className="text-sm text-muted" />
              {have
                ? <span className="text-xs text-green-400">In your collection ✓</span>
                : <button className="btn btn-primary !py-1 !px-3 text-sm" onClick={() => { collect(m.id); playSound('collect', soundOn); }}>{asRepeatUnit ? `Polymerise & collect ${m.name}` : `Collect ${m.name}`}</button>}
              <button className="text-xs underline text-[var(--accent)]" onClick={() => setDetail(detail === m.id ? null : m.id)}>{detail === m.id ? 'Hide details' : 'Details'}</button>
            </div>
          );
        })}
        {matches.length > 1 && matches.every((x) => x.asRepeatUnit) && (
          <p className="text-xs text-muted">Same atoms, different molecules: these are isomers. How the units are linked changes the properties.</p>
        )}
        {total > 0 && matches.length === 0 && (
          <div className="text-sm text-muted">
            <p>No molecule in the collection has this formula.</p>
            {hints.map((h) => (
              <p key={h.molecule.id} className="text-xs">
                💡 Close to <strong>{h.molecule.name}</strong>: {Object.entries(h.changes).map(([sym, d]) => `${d > 0 ? 'add' : 'remove'} ${Math.abs(d)} ${sym}`).join(', ')}
              </p>
            ))}
          </div>
        )}
      </section>

      {detailMol && <MoleculeDetail molecule={detailMol} />}
    </div>
  );
}
