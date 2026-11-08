import type { ReactNode } from 'react';
import type { Molecule } from '../../types';
import { molarMass, formatMolarMass, percentComposition, hillFormula } from '../../game/engine/molecules';
import { getElement } from '../../data/elements';
import { Formula } from './Formula';
import { MOLECULE_CATEGORY_LABELS, MOLECULE_CATEGORY_ICONS } from './labels';

/** Distinct colours for the composition bar (elements in Hill order). */
const COMPOSITION_COLORS = ['#4dabf7', '#f783ac', '#fcc419', '#20c997', '#cc5de8', '#ff922b'];

export function MoleculeDetail({ molecule: m, actions }: { molecule: Molecule; actions?: ReactNode }) {
  const hill = hillFormula(m);
  const mass = molarMass(m.formula);
  const composition = percentComposition(m.formula);
  const isPolymer = m.category === 'polymer';
  return (
    <article className="card space-y-3" aria-labelledby={`mol-${m.id}-title`}>
      <header className="flex items-start gap-4">
        <div className="glass min-w-20 h-20 shrink-0 flex items-center justify-center text-lg font-bold px-3 text-center">
          <Formula value={m.formula} />
        </div>
        <div className="min-w-0">
          <h2 id={`mol-${m.id}-title`} className="text-xl font-bold">{m.name}</h2>
          <p className="text-sm text-muted">{MOLECULE_CATEGORY_ICONS[m.category]} {MOLECULE_CATEGORY_LABELS[m.category]} · {m.subcategory}</p>
        </div>
      </header>
      <p className="text-sm">{m.description}</p>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted">{isPolymer ? 'Repeat unit' : 'Molecular formula'}</dt>
          <dd className="font-semibold"><Formula value={hill} /></dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted">{isPolymer ? 'Mass per repeat unit' : 'Molar mass'}</dt>
          <dd className="font-semibold" data-testid="molar-mass">{formatMolarMass(mass)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted">Bonding</dt>
          <dd className="font-semibold">{m.bondType}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted">Atoms{isPolymer ? ' per unit' : ''}</dt>
          <dd className="font-semibold">{composition.reduce((a, c) => a + c.count, 0)}</dd>
        </div>
      </dl>
      <div>
        <h3 className="text-[11px] uppercase tracking-wide text-muted mb-1">Composition by mass</h3>
        <div className="flex h-3 rounded-full overflow-hidden" aria-hidden>
          {composition.map((c, i) => (
            <span key={c.symbol} style={{ width: `${c.percent}%`, background: COMPOSITION_COLORS[i % COMPOSITION_COLORS.length] }} />
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs">
          {composition.map((c, i) => (
            <li key={c.symbol} className="flex items-center gap-1">
              <span aria-hidden className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COMPOSITION_COLORS[i % COMPOSITION_COLORS.length] }} />
              {getElement(c.symbol)?.name ?? c.symbol} ({c.symbol}×{c.count}): {c.percent.toFixed(1)}%
            </li>
          ))}
        </ul>
      </div>
      {isPolymer && (
        <p className="text-xs text-muted">
          Polymers are long chains: the formula shows one repeat unit, and <em>n</em> can be thousands.
          {m.monomers && <> Made from: {m.monomers.join(' + ')}.</>}
          {m.recyclingCodes && <> Recycling code{m.recyclingCodes.length > 1 ? 's' : ''}: {m.recyclingCodes.map((c) => `♻${c}`).join(', ')}.</>}
        </p>
      )}
      <div>
        <h3 className="text-[11px] uppercase tracking-wide text-muted">Uses</h3>
        <ul className="flex flex-wrap gap-1 mt-1">
          {m.uses.map((u) => <li key={u} className="glass px-2 py-0.5 text-xs">{u}</li>)}
        </ul>
      </div>
      {actions}
    </article>
  );
}
