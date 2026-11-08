import { useState, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MixBench } from '../../components/lab/MixBench';
import MoleculeBuilder from './MoleculeBuilder';

const TABS = [
  { id: 'builder', label: 'Molecule Builder' },
  { id: 'mix', label: 'Mix Lab' },
  { id: 'ph', label: 'pH Bench' },
] as const;
type TabId = (typeof TABS)[number]['id'];

/**
 * Free-play lab. URL parameters: `?tab=builder|mix|ph` selects a tab; `?target=<molecule id>` starts a build challenge;
 * `?mix=A,B` pre-fills the mixing bench.
 */
export default function Lab() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : 'builder';
  const target = params.get('target');
  const mixParam = params.get('mix')?.split(',').filter(Boolean);
  const mixInitial = mixParam && mixParam.length >= 1 ? ([mixParam[0]!, mixParam[1] ?? ''] as [string, string]) : undefined;

  const select = (id: TabId) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const idx = TABS.findIndex((t) => t.id === tab);
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = TABS[(idx + delta + TABS.length) % TABS.length]!;
    select(next.id);
    document.getElementById(`lab-tab-${next.id}`)?.focus();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">🧪 Free Play Lab</h1>
      <div role="tablist" aria-label="Lab benches" className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`lab-tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`lab-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => select(t.id)}
            onKeyDown={onKeyDown}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="card" role="tabpanel" id={`lab-panel-${tab}`} aria-labelledby={`lab-tab-${tab}`}>
        {tab === 'builder' && <MoleculeBuilder key={target ?? 'free'} initialTarget={target} />}
        {tab === 'mix' && <MixBench key={params.get('mix') ?? 'free'} allowCollect {...(mixInitial ? { initial: mixInitial } : {})} />}
        {tab === 'ph' && <PhInline />}
      </div>
    </div>
  );
}

function PhInline() {
  const [ph, setPh] = useState(7);
  return (
    <div>
      <label className="block text-sm">
        pH
        <input type="range" min={0} max={14} step={0.1} value={ph} onChange={(e) => setPh(Number(e.target.value))} className="w-full" />
      </label>
      <p>pH {ph.toFixed(1)} · {ph < 7 ? 'acidic' : ph > 7 ? 'basic' : 'neutral'}</p>
    </div>
  );
}
