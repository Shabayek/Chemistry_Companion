import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ELEMENTS, getElement } from '../../data/elements';
import { MOLECULES, getMolecule } from '../../data/molecules';
import { useGameStore } from '../../store/useGameStore';
import { PeriodicGrid } from '../../components/periodic/PeriodicGrid';
import { ElementDetail } from '../../components/periodic/ElementDetail';
import { MoleculeDetail } from '../../components/molecules/MoleculeDetail';
import { Formula } from '../../components/molecules/Formula';
import { MOLECULE_CATEGORIES, MOLECULE_CATEGORY_ICONS } from '../../components/molecules/labels';
import type { Molecule } from '../../types';

const CATEGORY_TITLES: Record<Molecule['category'], string> = {
  common: 'Common compounds',
  organic: 'Organic molecules',
  polymer: 'Polymers',
  biomolecule: 'Biomolecules',
};

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-2 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

export default function Collection() {
  const progress = useGameStore((s) => s.progress);
  const [element, setElement] = useState<string | null>(null);
  const [molecule, setMolecule] = useState<string | null>(null);

  const elementSet = useMemo(() => new Set(progress.collection.elements), [progress.collection.elements]);
  const moleculeSet = useMemo(() => new Set(progress.collection.molecules.map((id) => getMolecule(id)?.id ?? id)), [progress.collection.molecules]);
  const elementCount = ELEMENTS.filter((e) => elementSet.has(e.symbol)).length;
  const moleculeCount = MOLECULES.filter((m) => moleculeSet.has(m.id)).length;
  const selectedEl = element ? getElement(element) : undefined;
  const selectedMol = molecule ? getMolecule(molecule) : undefined;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Collection</h1>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="Summary">
        <div className="card !p-4 space-y-2">
          <p className="text-sm text-muted">Elements</p>
          <p className="text-2xl font-bold" data-testid="elements-total">{elementCount} / {ELEMENTS.length}</p>
          <ProgressBar value={elementCount} max={ELEMENTS.length} label="Elements collected" />
        </div>
        <div className="card !p-4 space-y-2">
          <p className="text-sm text-muted">Molecules</p>
          <p className="text-2xl font-bold" data-testid="molecules-total">{moleculeCount} / {MOLECULES.length}</p>
          <ProgressBar value={moleculeCount} max={MOLECULES.length} label="Molecules collected" />
        </div>
        <div className="card !p-4 space-y-2">
          <p className="text-sm text-muted">Badges</p>
          <p className="text-2xl font-bold">{progress.collection.badges.length}</p>
        </div>
      </section>

      <section className="card space-y-3" aria-labelledby="elements-heading">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="elements-heading" className="font-bold">Elements ({elementCount} / {ELEMENTS.length})</h2>
          <Link to="/periodic-table" className="text-xs ml-auto">Find more in the Periodic Table →</Link>
        </div>
        <PeriodicGrid
          compact
          label="Collected elements"
          selected={element}
          onSelect={(s) => setElement(s === element ? null : s)}
          isHighlighted={(e) => elementSet.has(e.symbol)}
          isMarked={(e) => elementSet.has(e.symbol)}
        />
        {elementCount > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Collected element list">
            {ELEMENTS.filter((e) => elementSet.has(e.symbol)).map((el) => (
              <li key={el.symbol} className="glass px-3 py-1 text-sm" style={{ color: el.color }}>{el.symbol} {el.name}</li>
            ))}
          </ul>
        )}
        {elementCount === 0 && <p className="text-sm text-muted">None yet. Collect elements in the Periodic Table or earn them in missions.</p>}
        {selectedEl && (elementSet.has(selectedEl.symbol)
          ? <ElementDetail element={selectedEl} />
          : <p className="text-sm text-muted">🔒 {selectedEl.name} is not in your collection yet. <Link to="/periodic-table">Visit the Periodic Table</Link> to collect it.</p>)}
      </section>

      <section className="card space-y-4" aria-labelledby="molecules-heading">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="molecules-heading" className="font-bold">Molecules ({moleculeCount} / {MOLECULES.length})</h2>
          <Link to="/molecules" className="text-xs ml-auto">Explore all molecules →</Link>
          <Link to="/lab" className="text-xs">Build them in the Lab →</Link>
        </div>
        {MOLECULE_CATEGORIES.map((cat) => {
          const list = MOLECULES.filter((m) => m.category === cat);
          const have = list.filter((m) => moleculeSet.has(m.id)).length;
          return (
            <div key={cat} className="space-y-2" data-testid={`category-${cat}`}>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{MOLECULE_CATEGORY_ICONS[cat]} {CATEGORY_TITLES[cat]}</h3>
                <span className="text-xs text-muted" data-testid={`category-count-${cat}`}>{have} / {list.length}</span>
              </div>
              <ProgressBar value={have} max={list.length} label={`${CATEGORY_TITLES[cat]} collected`} />
              <ul className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {list.map((m) => (
                  <li key={m.id}>
                    {moleculeSet.has(m.id) ? (
                      <button
                        className={`glass w-full p-2 text-left text-sm hover:scale-[1.02] transition focus-ring ${molecule === m.id ? 'ring-2 ring-[var(--accent)]' : ''}`}
                        aria-pressed={molecule === m.id}
                        onClick={() => setMolecule(molecule === m.id ? null : m.id)}
                      >
                        <span className="block font-semibold truncate">{m.name}</span>
                        <Formula value={m.formula} className="text-xs text-muted" />
                      </button>
                    ) : (
                      <div role="img" className="w-full p-2 text-sm rounded-[var(--radius)] border border-dashed border-[var(--card-border)] text-muted" aria-label={`Locked ${m.subcategory}`}>
                        <span className="block font-semibold" aria-hidden>🔒 ???</span>
                        <span className="block text-xs text-muted truncate">{m.subcategory}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {selectedMol && <MoleculeDetail molecule={selectedMol} />}
      </section>

      <section className="card" aria-labelledby="badges-heading">
        <h2 id="badges-heading" className="font-bold mb-2">Badges ({progress.collection.badges.length})</h2>
        <div className="flex flex-wrap gap-2">
          {progress.collection.badges.map((b) => <span key={b} className="glass px-3 py-1 text-sm">🏅 {b}</span>)}
          {progress.collection.badges.length === 0 && <span className="text-muted">None yet.</span>}
        </div>
      </section>
    </div>
  );
}
