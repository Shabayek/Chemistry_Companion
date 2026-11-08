import type { Element, ElementBlock, ElementCategory } from '../../types';
import { trendFraction, type TrendKey } from '../../game/engine/periodic';

export type ColorMode = 'category' | 'block' | 'state' | TrendKey;

export const COLOR_MODES: { value: ColorMode; label: string }[] = [
  { value: 'category', label: 'Category' },
  { value: 'block', label: 'Block (s, p, d, f)' },
  { value: 'state', label: 'State at room temperature' },
  { value: 'electronegativity', label: 'Electronegativity trend' },
  { value: 'mass', label: 'Atomic mass trend' },
];

export const CATEGORY_COLORS: Record<ElementCategory, string> = {
  'alkali metal': '#ff6b6b',
  'alkaline earth metal': '#ffa94d',
  'transition metal': '#fcc419',
  'post-transition metal': '#94d82d',
  metalloid: '#20c997',
  nonmetal: '#4dabf7',
  halogen: '#748ffc',
  'noble gas': '#cc5de8',
  lanthanide: '#f783ac',
  actinide: '#66d9e8',
};

export const BLOCK_COLORS: Record<ElementBlock, string> = { s: '#ff6b6b', p: '#4dabf7', d: '#fcc419', f: '#94d82d' };

export const STATE_COLORS: Record<Element['stateAtRoomTemp'], string> = { solid: '#adb5bd', liquid: '#4dabf7', gas: '#ffd43b' };

const UNKNOWN = '#6c757d';

/** Cool-to-warm scale for trends (0 = low, 1 = high). */
export function heatColor(fraction: number): string {
  const f = Math.min(1, Math.max(0, fraction));
  const hue = 220 - 220 * f; // blue -> red
  return `hsl(${hue.toFixed(0)} 80% 55%)`;
}

export function elementColor(el: Element, mode: ColorMode, all: readonly Element[]): string {
  switch (mode) {
    case 'category': return CATEGORY_COLORS[el.category];
    case 'block': return BLOCK_COLORS[el.block];
    case 'state': return STATE_COLORS[el.stateAtRoomTemp];
    case 'electronegativity':
    case 'mass': {
      const f = trendFraction(all, el, mode);
      return f === null ? UNKNOWN : heatColor(f);
    }
  }
}

/** Tinted background + solid border for a cell of the given colour. */
export function cellStyle(color: string): { background: string; borderColor: string } {
  return { background: `color-mix(in srgb, ${color} 26%, transparent)`, borderColor: color };
}

export function categoryLabel(c: ElementCategory): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}
