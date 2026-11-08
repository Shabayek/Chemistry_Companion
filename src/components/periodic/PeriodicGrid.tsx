import { useRef, useState, type KeyboardEvent } from 'react';
import type { Element } from '../../types';
import { ELEMENTS } from '../../data/elements';
import { tablePosition, neighbor, LANTHANIDE_ROW, ACTINIDE_ROW, type Direction } from '../../game/engine/periodic';
import { elementColor, cellStyle, CATEGORY_COLORS, type ColorMode } from './colors';

export interface PeriodicGridProps {
  selected: string | null;
  onSelect: (symbol: string) => void;
  colorMode?: ColorMode;
  /** When provided, elements for which this returns false are dimmed. */
  isHighlighted?: (el: Element) => boolean;
  /** Elements for which this returns true get a "collected" marker. */
  isMarked?: (el: Element) => boolean;
  /** Smaller cells without names (for use inside missions). */
  compact?: boolean;
  label?: string;
  elements?: readonly Element[];
}

const KEY_DIRECTIONS: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

/**
 * Standard 18-column periodic table with separate lanthanide/actinide rows.
 * Keyboard: one cell is in the tab order (roving tabindex); arrow keys move between cells; Enter/Space selects.
 * Each cell's accessible name is its text: "26 Fe Iron" (", collected" when marked).
 */
export function PeriodicGrid({
  selected, onSelect, colorMode = 'category', isHighlighted, isMarked, compact = false, label = 'Periodic table', elements = ELEMENTS,
}: PeriodicGridProps) {
  const [focused, setFocused] = useState<string>(selected ?? elements[0]?.symbol ?? 'H');
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const tabStop = selected ?? focused;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, el: Element) => {
    let target: Element | undefined;
    const dir = KEY_DIRECTIONS[e.key];
    if (dir) target = neighbor(elements, el, dir);
    else if (e.key === 'Home') target = elements.find((x) => tablePosition(x).row === tablePosition(el).row);
    else if (e.key === 'End') target = [...elements].reverse().find((x) => tablePosition(x).row === tablePosition(el).row);
    else return;
    e.preventDefault();
    if (target) {
      setFocused(target.symbol);
      refs.current.get(target.symbol)?.focus();
    }
  };

  const rowStyle = { gridTemplateRows: `repeat(7, auto) ${compact ? '6px' : '12px'} repeat(2, auto)` };

  return (
    <div className="overflow-x-auto pb-2">
      <div
        role="group"
        aria-label={label}
        className={`grid gap-[3px] ${compact ? 'min-w-[620px]' : 'min-w-[820px]'}`}
        style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', ...rowStyle }}
      >
        {elements.map((el) => {
          const pos = tablePosition(el);
          const color = elementColor(el, colorMode, elements);
          const dimmed = isHighlighted ? !isHighlighted(el) : false;
          const marked = isMarked?.(el) ?? false;
          const isSel = selected === el.symbol;
          return (
            <button
              key={el.symbol}
              ref={(node) => { if (node) refs.current.set(el.symbol, node); else refs.current.delete(el.symbol); }}
              type="button"
              data-symbol={el.symbol}
              // Name follows the visible text order ("26 Fe Iron") so it contains what sighted users see (WCAG 2.5.3).
              aria-label={`${el.atomicNumber} ${el.symbol} ${el.name}${marked ? ', collected' : ''}`}
              aria-pressed={isSel}
              tabIndex={el.symbol === tabStop ? 0 : -1}
              onClick={() => { setFocused(el.symbol); onSelect(el.symbol); }}
              onFocus={() => setFocused(el.symbol)}
              onKeyDown={(e) => onKeyDown(e, el)}
              data-dimmed={dimmed || undefined}
              className={`relative rounded-md border text-left leading-none transition focus-ring
                ${compact ? 'p-[3px] min-h-[34px]' : 'p-1 min-h-[52px]'}
                ${isSel ? 'ring-2 ring-[var(--accent)] z-10 scale-[1.08]' : 'hover:scale-105'}
                ${dimmed ? 'border-dashed text-muted' : ''}`}
              // Dimmed cells lose their colour but keep readable text (opacity would break text contrast).
              style={{ gridRow: pos.row, gridColumn: pos.col, ...(dimmed ? { background: 'transparent', borderColor: 'var(--card-border)' } : cellStyle(color)) }}
            >
              {/* The {' '} text nodes are invisible between block spans but keep the visible text "26 Fe Iron". */}
              <span className={`block ${compact ? 'text-[8px]' : 'text-[9px]'} text-muted`}>{el.atomicNumber}</span>{' '}
              <span className={`block font-bold ${compact ? 'text-xs' : 'text-sm'}`}>{el.symbol}</span>{' '}
              {!compact && <span className="block text-[8px] truncate text-muted">{el.name}</span>}
              {marked && <span aria-hidden className="absolute top-0.5 right-0.5 text-[8px] text-green-400">●</span>}
            </button>
          );
        })}
        {/* Placeholders showing where the f-block rows belong in the main table. */}
        <Placeholder row={6} label="57–71" color={CATEGORY_COLORS.lanthanide} compact={compact} />
        <Placeholder row={7} label="89–103" color={CATEGORY_COLORS.actinide} compact={compact} />
        <div aria-hidden style={{ gridRow: LANTHANIDE_ROW, gridColumn: '1 / span 2' }} className="self-center text-right pr-1 text-[9px] text-muted">
          {compact ? 'La–Lu' : 'Lanthanides'}
        </div>
        <div aria-hidden style={{ gridRow: ACTINIDE_ROW, gridColumn: '1 / span 2' }} className="self-center text-right pr-1 text-[9px] text-muted">
          {compact ? 'Ac–Lr' : 'Actinides'}
        </div>
      </div>
    </div>
  );
}

function Placeholder({ row, label, color, compact }: { row: number; label: string; color: string; compact: boolean }) {
  return (
    <div
      aria-hidden
      className={`rounded-md border border-dashed flex items-center justify-center text-[9px] text-muted ${compact ? 'min-h-[34px]' : 'min-h-[52px]'}`}
      style={{ gridRow: row, gridColumn: 3, borderColor: color }}
    >
      {label}
    </div>
  );
}
