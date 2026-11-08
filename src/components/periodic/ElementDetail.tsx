import type { ReactNode } from 'react';
import type { Element } from '../../types';
import { formatMass } from '../../game/engine/periodic';
import { CATEGORY_COLORS, cellStyle, categoryLabel } from './colors';

/** Renders "3d5" style subshells with superscript electron counts. */
export function ElectronConfig({ config }: { config: string }) {
  return (
    <span className="font-mono">
      <span className="sr-only">{config}</span>
      <span aria-hidden="true">
      {config.split(' ').map((tok, i) => {
        const m = /^(\d[spdf])(\d+)$/.exec(tok);
        return (
          <span key={i}>
            {i > 0 && ' '}
            {m ? <>{m[1]}<sup>{m[2]}</sup></> : tok}
          </span>
        );
      })}
      </span>
    </span>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}

export function ElementDetail({ element: el, actions }: { element: Element; actions?: ReactNode }) {
  const color = CATEGORY_COLORS[el.category];
  return (
    <article className="card space-y-3" aria-labelledby={`el-${el.symbol}-title`}>
      <header className="flex items-start gap-4">
        <div className="rounded-xl border-2 w-20 h-20 shrink-0 flex flex-col items-center justify-center" style={cellStyle(color)}>
          <span className="text-xs text-muted">{el.atomicNumber}</span>
          <span className="text-3xl font-bold leading-none">{el.symbol}</span>
          <span className="text-[10px] text-muted">{formatMass(el)}</span>
        </div>
        <div className="min-w-0">
          <h2 id={`el-${el.symbol}-title`} className="text-xl font-bold">{el.name}</h2>
          <p className="text-sm" style={{ color }}>{categoryLabel(el.category)}</p>
          <div className="flex flex-wrap gap-1 mt-1 text-[11px]">
            {el.radioactive && <span className="glass px-2 py-0.5">☢️ Radioactive</span>}
            {el.predicted && <span className="glass px-2 py-0.5">🔮 Properties predicted</span>}
          </div>
        </div>
      </header>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <Fact label="Atomic number">{el.atomicNumber}</Fact>
        <Fact label="Atomic mass">{formatMass(el)}{el.radioactive && Number.isInteger(el.mass) ? ' (mass number)' : ''}</Fact>
        <Fact label="Group / Period">{el.group ?? '—'} / {el.period}</Fact>
        <Fact label="Block">{el.block}-block</Fact>
        <Fact label="State at 25 °C">{el.stateAtRoomTemp}{el.predicted ? ' (predicted)' : ''}</Fact>
        <Fact label="Electronegativity">{el.electronegativity ?? 'n/a'}</Fact>
        <div className="col-span-2 sm:col-span-3">
          <Fact label="Electron configuration"><ElectronConfig config={el.electronConfig} /></Fact>
        </div>
      </dl>
      <p className="text-sm">💡 {el.funFact}</p>
      <div>
        <h3 className="text-[11px] uppercase tracking-wide text-muted">Uses</h3>
        <ul className="flex flex-wrap gap-1 mt-1">
          {el.uses.map((u) => <li key={u} className="glass px-2 py-0.5 text-xs">{u}</li>)}
        </ul>
      </div>
      {actions}
    </article>
  );
}
