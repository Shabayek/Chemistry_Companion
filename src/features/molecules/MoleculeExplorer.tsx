import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MOLECULES, getMolecule } from '../../data/molecules';
import { useGameStore } from '../../store/useGameStore';
import { matchesMoleculeQuery, molarMass, formatMolarMass } from '../../game/engine/molecules';
import { reactionsProducing, reactionInputs, benchItemLabel } from '../../game/engine/reactions';
import { MoleculeDetail } from '../../components/molecules/MoleculeDetail';
import { Formula } from '../../components/molecules/Formula';
import { MOLECULE_CATEGORIES, MOLECULE_CATEGORY_ICONS, MOLECULE_CATEGORY_LABELS } from '../../components/molecules/labels';
import type { Molecule } from '../../types';

/** Browse all 60 molecules (collected or not) and jump to the Lab to make them. */
export default function MoleculeExplorer() {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<ReadonlySet<Molecule['category']>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const collectedIds = useGameStore((s) => s.progress.collection.molecules);
  const collected = useMemo(() => new Set(collectedIds), [collectedIds]);

  const visible = MOLECULES.filter((m) => matchesMoleculeQuery(m, query) && (categories.size === 0 || categories.has(m.category)));
  const mol = selected ? getMolecule(selected) : undefined;
  const recipes = mol ? reactionsProducing(mol.formula) : [];

  const toggle = (c: Molecule['category']) => setCategories((prev) => {
    const next = new Set(prev);
    if (next.has(c)) next.delete(c); else next.add(c);
    return next;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="text-2xl font-bold">Molecules</h1>
        <span className="text-sm text-muted">Collected {MOLECULES.filter((m) => collected.has(m.id)).length} / {MOLECULES.length}</span>
      </div>

      <section className="card space-y-3" aria-label="Molecule filters">
        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex flex-col text-xs text-muted gap-1">
            Search
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, type or formula (e.g. H2O)" className="text-sm w-72 max-w-full" />
          </label>
          <span className="text-xs text-muted ml-auto" aria-live="polite" data-testid="molecule-match-count">{visible.length} molecule{visible.length === 1 ? '' : 's'}</span>
        </div>
        <fieldset>
          <legend className="text-xs text-muted mb-1">Filter by category</legend>
          <div className="flex flex-wrap gap-1.5">
            {MOLECULE_CATEGORIES.map((c) => (
              <button key={c} type="button" aria-pressed={categories.has(c)} onClick={() => toggle(c)}
                className={`text-xs px-2 py-1 rounded-full border border-[var(--card-border)] focus-ring ${categories.has(c) ? 'bg-[var(--primary)] text-white font-bold' : ''}`}>
                {MOLECULE_CATEGORY_ICONS[c]} {MOLECULE_CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" aria-label="Molecule list">
        {visible.map((m) => (
          <li key={m.id}>
            <button
              onClick={() => setSelected(selected === m.id ? null : m.id)}
              aria-pressed={selected === m.id}
              className={`glass w-full p-3 text-left hover:scale-[1.02] transition focus-ring ${selected === m.id ? 'ring-2 ring-[var(--accent)]' : ''}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold truncate">{m.name}</span>
                {collected.has(m.id) && <span role="img" className="text-green-400 text-xs" aria-label="collected">✓</span>}
              </span>
              <Formula value={m.formula} className="block text-sm" />
              <span className="block text-[11px] text-muted">{MOLECULE_CATEGORY_ICONS[m.category]} {m.subcategory} · {formatMolarMass(molarMass(m.formula))}</span>
            </button>
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p className="text-sm text-muted">No molecules match. Try a name like "acid" or a formula like "CO2".</p>}

      {mol && (
        <MoleculeDetail
          molecule={mol}
          actions={
            <div className="flex flex-wrap gap-2 items-center">
              {collected.has(mol.id) ? <span className="text-green-400 text-sm">In your collection ✓</span> : <span className="text-sm text-muted">Not collected yet.</span>}
              <Link className="btn btn-primary !py-1.5 !px-3 text-sm" to={`/lab?tab=builder&target=${mol.id}`}>Build it in the Lab</Link>
              {recipes.map((r) => (
                <Link key={r.id} className="btn btn-ghost !py-1.5 !px-3 text-sm" to={`/lab?tab=mix&mix=${encodeURIComponent(reactionInputs(r).join(','))}`}>
                  Make it: {reactionInputs(r).map(benchItemLabel).join(' + ')}
                </Link>
              ))}
            </div>
          }
        />
      )}
    </div>
  );
}
