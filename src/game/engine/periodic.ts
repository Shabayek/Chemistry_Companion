// Pure periodic-table helpers: layout, electron configurations, search, trends.
import type { Element, ElementCategory } from '../../types';

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const ELEMENT_CATEGORIES: readonly ElementCategory[] = [
  'alkali metal',
  'alkaline earth metal',
  'transition metal',
  'post-transition metal',
  'metalloid',
  'nonmetal',
  'halogen',
  'noble gas',
  'lanthanide',
  'actinide',
];

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** Rows 1–7 are the periods; row 8 is a visual gap; rows 9 and 10 hold the lanthanides and actinides. */
export const LANTHANIDE_ROW = 9;
export const ACTINIDE_ROW = 10;
export const GRID_COLUMNS = 18;
export const GRID_ROWS = 10;

export interface GridPosition {
  row: number;
  col: number;
}

export function tablePosition(el: Pick<Element, 'atomicNumber' | 'group' | 'period' | 'category'>): GridPosition {
  if (el.group !== null) return { row: el.period, col: el.group };
  if (el.category === 'lanthanide') return { row: LANTHANIDE_ROW, col: 3 + (el.atomicNumber - 57) };
  if (el.category === 'actinide') return { row: ACTINIDE_ROW, col: 3 + (el.atomicNumber - 89) };
  throw new Error(`Element ${el.atomicNumber} has no group and is not f-block`);
}

export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Keyboard navigation: the element reached by moving one step in `dir`.
 * Left/right move to the nearest element in the same row (skipping gaps);
 * up/down move to the nearest row that has an element in the same column (or the closest column).
 */
export function neighbor<T extends Pick<Element, 'atomicNumber' | 'group' | 'period' | 'category'>>(
  elements: readonly T[],
  from: T,
  dir: Direction,
): T | undefined {
  const p = tablePosition(from);
  const withPos = elements.map((e) => ({ e, pos: tablePosition(e) }));
  if (dir === 'left' || dir === 'right') {
    const sameRow = withPos.filter((x) => x.pos.row === p.row && (dir === 'left' ? x.pos.col < p.col : x.pos.col > p.col));
    sameRow.sort((a, b) => Math.abs(a.pos.col - p.col) - Math.abs(b.pos.col - p.col));
    return sameRow[0]?.e;
  }
  const step = dir === 'up' ? -1 : 1;
  for (let row = p.row + step; row >= 1 && row <= GRID_ROWS; row += step) {
    const inRow = withPos.filter((x) => x.pos.row === row);
    if (inRow.length === 0) continue;
    inRow.sort((a, b) => Math.abs(a.pos.col - p.col) - Math.abs(b.pos.col - p.col));
    return inRow[0]!.e;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Electron configurations
// ---------------------------------------------------------------------------

export type SubshellLetter = 's' | 'p' | 'd' | 'f';

export interface Subshell {
  n: number;
  l: SubshellLetter;
  electrons: number;
}

export const SUBSHELL_CAPACITY: Record<SubshellLetter, number> = { s: 2, p: 6, d: 10, f: 14 };

/** Madelung (n + l, then n) filling order. */
export const AUFBAU_ORDER: readonly string[] = [
  '1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p',
];

export const NOBLE_GAS_CORES: Readonly<Record<string, number>> = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };

/** Elements whose ground-state configuration differs from the simple aufbau filling order. */
export const AUFBAU_EXCEPTIONS: ReadonlySet<string> = new Set([
  'Cr', 'Cu', 'Nb', 'Mo', 'Ru', 'Rh', 'Pd', 'Ag', 'La', 'Ce', 'Gd', 'Pt', 'Au', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Cm', 'Lr',
]);

const L_ORDER: SubshellLetter[] = ['s', 'p', 'd', 'f'];

export interface ParsedConfig {
  core: string | null;
  subshells: Subshell[];
}

/** Parse "[Ar] 3d5 4s1" or "1s2 2s1". Throws on malformed input. */
export function parseElectronConfig(config: string): ParsedConfig {
  const tokens = config.trim().split(/\s+/).filter(Boolean);
  let core: string | null = null;
  if (tokens[0]?.startsWith('[')) {
    const m = /^\[([A-Z][a-z]?)\]$/.exec(tokens.shift()!);
    if (!m || NOBLE_GAS_CORES[m[1]!] === undefined) throw new Error(`Bad core in "${config}"`);
    core = m[1]!;
  }
  const subshells = tokens.map((t) => {
    const m = /^([1-7])([spdf])(\d{1,2})$/.exec(t);
    if (!m) throw new Error(`Bad subshell "${t}" in "${config}"`);
    return { n: Number(m[1]), l: m[2] as SubshellLetter, electrons: Number(m[3]) };
  });
  return { core, subshells };
}

export function electronCount(config: string): number {
  const { core, subshells } = parseElectronConfig(config);
  return (core ? NOBLE_GAS_CORES[core]! : 0) + subshells.reduce((a, s) => a + s.electrons, 0);
}

function formatSubshells(subs: Subshell[]): string {
  return [...subs]
    .sort((a, b) => a.n - b.n || L_ORDER.indexOf(a.l) - L_ORDER.indexOf(b.l))
    .map((s) => `${s.n}${s.l}${s.electrons}`)
    .join(' ');
}

/** Full (uncondensed) aufbau filling for Z electrons, in filling order. */
export function aufbauSubshells(z: number): Subshell[] {
  const out: Subshell[] = [];
  let left = z;
  for (const key of AUFBAU_ORDER) {
    if (left <= 0) break;
    const l = key[1] as SubshellLetter;
    const electrons = Math.min(SUBSHELL_CAPACITY[l], left);
    out.push({ n: Number(key[0]), l, electrons });
    left -= electrons;
  }
  return out;
}

/** Condensed aufbau-predicted configuration, e.g. 26 -> "[Ar] 3d6 4s2". */
export function aufbauConfiguration(z: number): string {
  if (z < 1 || z > 118 || !Number.isInteger(z)) throw new Error(`Unsupported atomic number ${z}`);
  const subs = aufbauSubshells(z);
  const cores = Object.entries(NOBLE_GAS_CORES).filter(([, cz]) => cz < z).sort((a, b) => b[1] - a[1]);
  const core = cores[0];
  if (!core) return formatSubshells(subs);
  let acc = 0;
  let i = 0;
  while (acc < core[1]) acc += subs[i++]!.electrons;
  return `[${core[0]}] ${formatSubshells(subs.slice(i))}`;
}

/** Expand a condensed configuration into all subshells (core included), ordered by n then l. */
export function expandConfig(config: string): Subshell[] {
  const { core, subshells } = parseElectronConfig(config);
  const coreSubs = core ? aufbauSubshells(NOBLE_GAS_CORES[core]!) : [];
  const merged = [...coreSubs, ...subshells];
  return merged.sort((a, b) => a.n - b.n || L_ORDER.indexOf(a.l) - L_ORDER.indexOf(b.l));
}

/** Electrons in the outermost shell (highest n). */
export function outerShellElectrons(config: string): number {
  const subs = expandConfig(config);
  const maxN = Math.max(...subs.map((s) => s.n));
  return subs.filter((s) => s.n === maxN).reduce((a, s) => a + s.electrons, 0);
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** Standard atomic weight, or the longest-lived isotope's mass number in brackets (e.g. "[98]"). */
export function formatMass(el: Pick<Element, 'mass' | 'radioactive'>): string {
  if (el.radioactive && Number.isInteger(el.mass)) return `[${el.mass}]`;
  return String(el.mass);
}

/** Search by symbol (exact, case-insensitive), atomic number, or the start of the name (case-insensitive). */
export function matchesQuery(el: Pick<Element, 'symbol' | 'name' | 'atomicNumber'>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  if (/^\d+$/.test(q)) return el.atomicNumber === Number(q);
  return el.symbol.toLowerCase() === q || el.name.toLowerCase().startsWith(q);
}

// ---------------------------------------------------------------------------
// Trends
// ---------------------------------------------------------------------------

export type TrendKey = 'electronegativity' | 'mass';

export function trendValue(el: Element, key: TrendKey): number | null {
  return key === 'electronegativity' ? el.electronegativity : el.mass;
}

/** Position of a value within [min, max] as 0..1, or null if unknown. */
export function trendFraction(elements: readonly Element[], el: Element, key: TrendKey): number | null {
  const v = trendValue(el, key);
  if (v === null) return null;
  const vals = elements.map((e) => trendValue(e, key)).filter((x): x is number => x !== null);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return max === min ? 0 : (v - min) / (max - min);
}

/** Key for a subshell, e.g. "3d". */
export function subshellKey(s: Pick<Subshell, 'n' | 'l'>): string {
  return `${s.n}${s.l}`;
}

/** Electron counts per subshell key for a condensed or full configuration. */
export function configCounts(config: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of expandConfig(config)) out[subshellKey(s)] = (out[subshellKey(s)] ?? 0) + s.electrons;
  return out;
}

/**
 * Write per-subshell counts in condensed notation: the largest noble-gas core whose subshells are all full
 * is replaced by "[Xx]"; the rest is listed by n then l. Empty subshells are omitted.
 */
export function condenseCounts(counts: Record<string, number>): string {
  const filled = Object.entries(counts).filter(([, e]) => e > 0).map(([k, e]) => ({ n: Number(k[0]), l: k[1] as SubshellLetter, electrons: e }));
  const cores = Object.entries(NOBLE_GAS_CORES).sort((a, b) => b[1] - a[1]);
  for (const [symbol, z] of cores) {
    const core = aufbauSubshells(z);
    const hasCore = core.every((c) => (counts[subshellKey(c)] ?? 0) === c.electrons);
    const rest = filled.filter((s) => !core.some((c) => subshellKey(c) === subshellKey(s)));
    if (hasCore && rest.length > 0) return `[${symbol}] ${formatSubshells(rest)}`;
  }
  return formatSubshells(filled);
}
