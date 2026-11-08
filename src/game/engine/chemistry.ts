// Pure chemistry helper functions. All inputs/outputs are plain data.

export interface AtomCount {
  [symbol: string]: number;
}

const ELEMENT_SYMBOLS = new Set<string>([
  'H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe','Cs','Ba','La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr','Rf','Db','Sg','Bh','Hs','Mt','Ds','Rg','Cn','Nh','Fl','Mc','Lv','Ts','Og',
]);

export function isElementSymbol(s: string): boolean {
  return ELEMENT_SYMBOLS.has(s);
}

/**
 * Parse a chemical formula (with optional parentheses) into atom counts.
 * e.g. parseFormula('Ca(OH)2') -> { Ca:1, O:2, H:2 }
 */
export function parseFormula(formula: string): AtomCount {
  const result: AtomCount = {};
  let i = 0;
  const n = formula.length;

  const readElement = (): string => {
    if (i >= n || !/[A-Z]/.test(formula[i]!)) return '';
    let sym = formula[i]!;
    i++;
    while (i < n && /[a-z]/.test(formula[i]!)) {
      sym += formula[i]!;
      i++;
    }
    return sym;
  };

  const readNumber = (): number => {
    if (i >= n || !/\d/.test(formula[i]!)) return 1;
    let num = '';
    while (i < n && /\d/.test(formula[i]!)) {
      num += formula[i]!;
      i++;
    }
    return num === '' ? 1 : parseInt(num, 10);
  };

  // We need a recursive descent. Use a stack-based approach handling groups.
  // Reset i
  i = 0;
  // We'll process char by char with a simpler recursive parser.
  function parseGroup(target: AtomCount): void {
    while (i < n && formula[i] !== ')') {
      if (formula[i] === '(') {
        i++; // skip '('
        const sub: AtomCount = {};
        parseGroup(sub);
        // expect ')'
        if (i < n && formula[i] === ')') i++;
        const mult = readNumber();
        for (const k of Object.keys(sub)) {
          const prev = target[k] ?? 0;
          const add = (sub[k] ?? 0) * mult;
          target[k] = prev + add;
        }
      } else if (/[A-Z]/.test(formula[i]!)) {
        const sym = readElement();
        const count = readNumber();
        target[sym] = (target[sym] ?? 0) + count;
      } else {
        // skip unexpected
        i++;
      }
    }
  }

  // reset
  // (i already 0)
  const top: AtomCount = {};
  parseGroup(top);
  // merge top into result (result currently empty)
  for (const k of Object.keys(top)) result[k] = top[k] ?? 0;
  return result;
}

export function countAtoms(formula: string): number {
  const counts = parseFormula(formula);
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

export function formulaToString(counts: AtomCount): string {
  // Hill system: C first, H second, then alphabetical
  const keys = Object.keys(counts).sort();
  const ordered: string[] = [];
  if (counts['C']) ordered.push('C');
  if (counts['H']) ordered.push('H');
  for (const k of keys) {
    if (k !== 'C' && k !== 'H') ordered.push(k);
  }
  return ordered
    .filter((k) => counts[k] && counts[k]! > 0)
    .map((k) => (counts[k] === 1 ? k : `${k}${counts[k]}`))
    .join('');
}

export function countsEqual(a: AtomCount, b: AtomCount): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (a[k] !== b[k]) return false;
  }
  // ensure b has no extra
  for (const k of kb) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export interface EquationSide {
  species: { formula: string; coeff: number }[];
}

export function sideCounts(side: EquationSide): AtomCount {
  const total: AtomCount = {};
  for (const s of side.species) {
    const c = parseFormula(s.formula);
    const mult = s.coeff;
    for (const k of Object.keys(c)) {
      total[k] = (total[k] ?? 0) + c[k]! * mult;
    }
  }
  return total;
}

export function isBalanced(reactants: EquationSide, products: EquationSide): boolean {
  return countsEqual(sideCounts(reactants), sideCounts(products));
}

// Mole calculations
export function massToMoles(mass: number, molarMass: number): number {
  if (molarMass <= 0) return 0;
  return mass / molarMass;
}
export function molesToMass(moles: number, molarMass: number): number {
  return moles * molarMass;
}
export function molesToParticles(moles: number, avogadro = 6.02214076e23): number {
  return moles * avogadro;
}

// pH
export function phFromH(hConc: number): number {
  if (hConc <= 0) return 14;
  return -Math.log10(hConc);
}
export function hFromPh(ph: number): number {
  return Math.pow(10, -ph);
}
export function classifyPh(ph: number): 'acidic' | 'neutral' | 'basic' {
  if (ph < 7) return 'acidic';
  if (ph > 7) return 'basic';
  return 'neutral';
}

// Gas laws (simple)
export function boyle(p1: number, v1: number, p2: number): number {
  // p1 v1 = p2 v2 -> v2
  if (p2 === 0) return 0;
  return (p1 * v1) / p2;
}
export function charles(v1: number, t1: number, t2: number): number {
  // v1/t1 = v2/t2 (Kelvin)
  if (t1 === 0) return 0;
  return (v1 * t2) / t1;
}
export function idealGasPressure(n: number, v: number, t: number, r = 0.08314): number {
  if (v === 0) return 0;
  return (n * r * t) / v;
}

// Equilibrium: Kc from concentrations (products/reactants with stoichiometric exponents)
export function equilibriumK(products: { conc: number; coeff: number }[], reactants: { conc: number; coeff: number }[]): number {
  let num = 1;
  let den = 1;
  for (const p of products) num *= Math.pow(p.conc, p.coeff);
  for (const r of reactants) den *= Math.pow(r.conc, r.coeff);
  if (den === 0) return Infinity;
  return num / den;
}

// Thermodynamics
export function gibbsFreeEnergy(dH: number, dS: number, tKelvin: number): number {
  return dH - tKelvin * dS;
}
/** ΔG in kJ/mol from ΔH in kJ/mol, ΔS in J/(mol·K) and T in K (the units used in most textbooks). */
export function deltaGkJ(dHkJ: number, dSJ: number, tKelvin: number): number {
  return gibbsFreeEnergy(dHkJ * 1000, dSJ, tKelvin) / 1000;
}

export function spontaneity(dG: number): 'spontaneous' | 'non-spontaneous' | 'equilibrium' {
  if (dG < 0) return 'spontaneous';
  if (dG > 0) return 'non-spontaneous';
  return 'equilibrium';
}

// Kinetics: rate = k [A]^m [B]^n
export function rateLaw(k: number, concs: number[], orders: number[]): number {
  let r = k;
  for (let i = 0; i < concs.length; i++) r *= Math.pow(concs[i] ?? 0, orders[i] ?? 0);
  return r;
}
export function arrhenius(k1: number, t1: number, t2: number, ea: number, r = 8.314): number {
  // k2 = k1 * exp(-Ea/R (1/T2 - 1/T1))
  return k1 * Math.exp((-ea / r) * (1 / t2 - 1 / t1));
}

// Electrochemistry
export function cellPotential(eCathode: number, eAnode: number): number {
  return eCathode - eAnode;
}
export function gibbsFromPotential(n: number, eCell: number, f = 96485): number {
  return -n * f * eCell;
}

// Nuclear half-life
export function remainingAmount(n0: number, halfLife: number, t: number): number {
  if (halfLife <= 0) return n0;
  return n0 * Math.pow(0.5, t / halfLife);
}
export function halfLifeFromDecay(n0: number, n: number, t: number): number {
  if (n <= 0 || n0 <= 0 || n >= n0) return Infinity;
  return (t * Math.log(2)) / Math.log(n0 / n);
}

// Balancing helper: given reactant/product formulas, find small integer coefficients (brute force) for simple equations
export function findCoefficients(reactants: string[], products: string[], maxCoeff = 6): { r: number[]; p: number[] } | null {
  const rCount = reactants.length;
  const pCount = products.length;
  // brute force
  const rRanges = Array.from({ length: rCount }, () => Array.from({ length: maxCoeff }, (_, i) => i + 1));
  const pRanges = Array.from({ length: pCount }, () => Array.from({ length: maxCoeff }, (_, i) => i + 1));

  function recR(idx: number, current: number[]): void {
    if (idx === rCount) {
      // try products
      recP(0, [], current);
      return;
    }
    for (const c of rRanges[idx]!) {
      current.push(c);
      recR(idx + 1, current);
      current.pop();
    }
  }

  function recP(idx: number, current: number[], rCoeffs: number[]): void {
    if (idx === pCount) {
      // check balance
      const reactSide = { species: reactants.map((f, i) => ({ formula: f, coeff: rCoeffs[i]! })) };
      const prodSide = { species: products.map((f, i) => ({ formula: f, coeff: current[i]! })) };
      if (isBalanced(reactSide, prodSide)) {
        // found
        result = { r: [...rCoeffs], p: [...current] };
        throw new Error('FOUND');
      }
      return;
    }
    for (const c of pRanges[idx]!) {
      current.push(c);
      recP(idx + 1, current, rCoeffs);
      current.pop();
    }
  }

  let result: { r: number[]; p: number[] } | null = null;
  try {
    recR(0, []);
  } catch (e) {
    if ((e as Error).message !== 'FOUND') throw e;
  }
  return result;
}
/**
 * Parse a written equation such as "2H2 + O2 → 2H2O" (arrows: →, ->, ⇌, =) into sides with coefficients.
 * Returns null when the text has no arrow.
 */
export function parseEquationString(equation: string): { reactants: EquationSide; products: EquationSide } | null {
  const parts = equation.split(/\s*(?:→|->|⇌|=)\s*/);
  if (parts.length !== 2) return null;
  const side = (text: string): EquationSide => ({
    species: text.split(/\s+\+\s+/).map((term) => {
      const m = /^(\d+)?\s*(.+)$/.exec(term.trim());
      return { formula: m?.[2] ?? term.trim(), coeff: m?.[1] ? Number(m[1]) : 1 };
    }),
  });
  return { reactants: side(parts[0]!), products: side(parts[1]!) };
}

/**
 * Atom counts for a written term with an optional leading coefficient, e.g. "3H2O" -> { H: 6, O: 3 },
 * "Al2(SO4)3" -> { Al: 2, S: 3, O: 12 }.
 */
export function termCounts(term: string): AtomCount {
  const m = /^\s*(\d+)?\s*(.+?)\s*$/.exec(term);
  const coeff = m?.[1] ? Number(m[1]) : 1;
  const counts = parseFormula(m?.[2] ?? term);
  const out: AtomCount = {};
  for (const [k, v] of Object.entries(counts)) out[k] = v * coeff;
  return out;
}

/** Henderson–Hasselbalch: pH = pKa + log10([A⁻] / [HA]). */
export function hendersonHasselbalch(pKa: number, baseConc: number, acidConc: number): number {
  if (baseConc <= 0 || acidConc <= 0) return NaN;
  return pKa + Math.log10(baseConc / acidConc);
}

/** [A⁻]/[HA] ratio needed for a target pH. */
export function bufferRatioForPh(pKa: number, pH: number): number {
  return Math.pow(10, pH - pKa);
}

/**
 * pH of a 1 L buffer ([HA] = acid, [A⁻] = base, mol/L) after adding `strongAcid` mol of H⁺ (negative = OH⁻).
 * Returns NaN when the buffer capacity is exceeded.
 */
export function bufferPhAfterAddition(pKa: number, acid: number, base: number, strongAcid: number): number {
  return hendersonHasselbalch(pKa, base - strongAcid, acid + strongAcid);
}
