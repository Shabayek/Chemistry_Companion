import { useMemo, useState } from 'react';
import { ELEMENTS, getElement } from '../../data/elements';
import { useGameStore } from '../../store/useGameStore';
import { playSound } from '../../lib/sound';
import { ELEMENT_CATEGORIES, matchesQuery } from '../../game/engine/periodic';
import type { Element, ElementCategory } from '../../types';
import { PeriodicGrid } from '../../components/periodic/PeriodicGrid';
import { ElementDetail } from '../../components/periodic/ElementDetail';
import {
  COLOR_MODES, CATEGORY_COLORS, BLOCK_COLORS, STATE_COLORS, heatColor, categoryLabel, type ColorMode,
} from '../../components/periodic/colors';

export default function PeriodicTable() {
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<ColorMode>('category');
  const [categories, setCategories] = useState<ReadonlySet<ElementCategory>>(new Set());
  const collected = useGameStore((s) => s.progress.collection.elements);
  const collect = useGameStore((s) => s.collectElement);
  const soundOn = useGameStore((s) => s.progress.settings.audio);

  const collectedSet = useMemo(() => new Set(collected), [collected]);
  const isHighlighted = (el: Element) => matchesQuery(el, query) && (categories.size === 0 || categories.has(el.category));
  const filtering = query.trim() !== '' || categories.size > 0;
  const matches = filtering ? ELEMENTS.filter(isHighlighted) : ELEMENTS;
  const el = selected ? getElement(selected) : undefined;
  const collectedCount = ELEMENTS.filter((e) => collectedSet.has(e.symbol)).length;

  const toggleCategory = (c: ElementCategory) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="text-2xl font-bold">Periodic Table</h1>
        <span className="text-sm text-muted" data-testid="collected-count">Collected {collectedCount} / {ELEMENTS.length}</span>
      </div>

      <section className="card space-y-3" aria-label="Table controls">
        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex flex-col text-xs text-muted gap-1">
            Search
            <input
              type="search"
              value={query}
              placeholder="Name, symbol or number"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && matches.length >= 1 && filtering) setSelected(matches[0]!.symbol); }}
              className="text-sm w-64 max-w-full"
            />
          </label>
          <label className="flex flex-col text-xs text-muted gap-1">
            Colour by
            <select value={mode} onChange={(e) => setMode(e.target.value as ColorMode)} className="text-sm">
              {COLOR_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </label>
          {filtering && (
            <button className="btn btn-ghost !py-1.5 !px-3 text-xs" onClick={() => { setQuery(''); setCategories(new Set()); }}>Clear filters</button>
          )}
          <span className="text-xs text-muted ml-auto" aria-live="polite" data-testid="match-count">
            {filtering ? `${matches.length} matching element${matches.length === 1 ? '' : 's'}` : `${ELEMENTS.length} elements`}
          </span>
        </div>
        <fieldset>
          <legend className="text-xs text-muted mb-1">Filter by category</legend>
          <div className="flex flex-wrap gap-1.5">
            {ELEMENT_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={categories.has(c)}
                onClick={() => toggleCategory(c)}
                className={`text-xs px-2 py-1 rounded-full border transition focus-ring ${categories.has(c) ? 'font-bold' : 'opacity-80'}`}
                style={{ borderColor: CATEGORY_COLORS[c], background: categories.has(c) ? `color-mix(in srgb, ${CATEGORY_COLORS[c]} 35%, transparent)` : 'transparent' }}
              >
                {categoryLabel(c)}
              </button>
            ))}
          </div>
        </fieldset>
        <Legend mode={mode} />
      </section>

      <PeriodicGrid
        selected={selected}
        onSelect={setSelected}
        colorMode={mode}
        {...(filtering ? { isHighlighted } : {})}
        isMarked={(e) => collectedSet.has(e.symbol)}
      />

      {el ? (
        <ElementDetail
          element={el}
          actions={collectedSet.has(el.symbol)
            ? <p className="text-green-400">Collected ✓</p>
            : <button className="btn btn-primary" onClick={() => { collect(el.symbol); playSound('collect', soundOn); }}>Collect {el.name}</button>}
        />
      ) : (
        <p className="text-sm text-muted">Select an element to see its details. Tip: use the arrow keys to move around the table.</p>
      )}
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs">
      <span aria-hidden className="inline-block w-3 h-3 rounded-sm border" style={{ background: color, borderColor: color }} />
      {label}
    </span>
  );
}

function Legend({ mode }: { mode: ColorMode }) {
  if (mode === 'category') return null; // the filter chips double as the category legend
  if (mode === 'block') {
    return <div role="group" className="flex flex-wrap gap-3" aria-label="Legend">{Object.entries(BLOCK_COLORS).map(([b, c]) => <Swatch key={b} color={c} label={`${b}-block`} />)}</div>;
  }
  if (mode === 'state') {
    return <div role="group" className="flex flex-wrap gap-3" aria-label="Legend">{Object.entries(STATE_COLORS).map(([s, c]) => <Swatch key={s} color={c} label={s} />)}</div>;
  }
  const values = ELEMENTS.map((e) => (mode === 'electronegativity' ? e.electronegativity : e.mass)).filter((v): v is number => v !== null);
  const gradient = `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1].map(heatColor).join(', ')})`;
  return (
    <div role="group" className="flex items-center gap-2 text-xs" aria-label="Legend">
      <span>{Math.min(...values)}</span>
      <span aria-hidden className="inline-block h-3 w-40 rounded" style={{ background: gradient }} />
      <span>{Math.max(...values)}</span>
      {mode === 'electronegativity' && <span className="text-muted">(Pauling; grey = no value)</span>}
    </div>
  );
}
