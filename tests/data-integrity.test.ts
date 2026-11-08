/**
 * Content integrity checks. These guard the hand-written data in src/data against typos and
 * broken cross-references as the content grows (118 elements, 60 molecules, 40 missions).
 */
import { describe, it, expect } from 'vitest';
import { ELEMENTS } from '../src/data/elements';
import { MOLECULES, LEGACY_MOLECULE_IDS, getMolecule } from '../src/data/molecules';
import { MISSIONS, missionsByWorld } from '../src/data/missions';
import { parseFormula, isElementSymbol, findCoefficients } from '../src/game/engine/chemistry';
import { worldOrder } from '../src/game/engine/progress';
import { molarMass, moleculeCounts, countsToHill } from '../src/game/engine/molecules';
import { isBalanced } from '../src/game/engine/chemistry';
import { REACTIONS, EXTRA_SPECIES_NAMES } from '../src/data/reactions';
import { reactionInputs, benchReagents, CONDITIONS } from '../src/game/engine/reactions';
import { parseEquationString, termCounts } from '../src/game/engine/chemistry';
import { REDUCTION_POTENTIALS } from '../src/data/electrochem';
import { INTERACTIVE_KINDS } from '../src/types';
import {
  electronCount, parseElectronConfig, aufbauConfiguration, aufbauSubshells, AUFBAU_EXCEPTIONS, AUFBAU_ORDER, NOBLE_GAS_CORES, ELEMENT_CATEGORIES,
} from '../src/game/engine/periodic';

const F_BLOCK = new Set(['lanthanide', 'actinide']);

/** Worlds whose content is finished (10 missions each). */
const COMPLETE_WORLDS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

function duplicates<T>(xs: T[]): T[] {
  return xs.filter((x, i) => xs.indexOf(x) !== i);
}

/** "(C2H4)n" -> "C2H4"; other formulas unchanged. */
function repeatUnit(formula: string): string {
  const m = /^\((.+)\)n$/.exec(formula);
  return m ? m[1]! : formula;
}

describe('elements data', () => {
  it('has unique symbols and atomic numbers', () => {
    expect(duplicates(ELEMENTS.map((e) => e.symbol))).toEqual([]);
    expect(duplicates(ELEMENTS.map((e) => e.atomicNumber))).toEqual([]);
  });

  it('uses real element symbols', () => {
    for (const e of ELEMENTS) expect(isElementSymbol(e.symbol), e.symbol).toBe(true);
  });

  it('is sorted by atomic number', () => {
    const nums = ELEMENTS.map((e) => e.atomicNumber);
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
  });

  it('has valid periods, groups and masses', () => {
    for (const e of ELEMENTS) {
      expect(e.period, e.symbol).toBeGreaterThanOrEqual(1);
      expect(e.period, e.symbol).toBeLessThanOrEqual(7);
      expect(e.mass, e.symbol).toBeGreaterThan(0);
      if (e.group === null) {
        expect(F_BLOCK.has(e.category), `${e.symbol} has no group but is not f-block`).toBe(true);
      } else {
        expect(e.group, e.symbol).toBeGreaterThanOrEqual(1);
        expect(e.group, e.symbol).toBeLessThanOrEqual(18);
      }
    }
  });

  it('has hex display colours', () => {
    for (const e of ELEMENTS) expect(e.color, e.symbol).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe('all 118 elements', () => {
  const bySymbol = (s: string) => ELEMENTS.find((e) => e.symbol === s)!;
  const symbols = (pred: (e: (typeof ELEMENTS)[number]) => boolean) => ELEMENTS.filter(pred).map((e) => e.symbol);

  it('covers atomic numbers 1–118 with unique names', () => {
    expect(ELEMENTS.map((e) => e.atomicNumber)).toEqual(Array.from({ length: 118 }, (_, i) => i + 1));
    expect(duplicates(ELEMENTS.map((e) => e.name))).toEqual([]);
  });

  it('every known symbol is present', () => {
    const all = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og';
    expect(ELEMENTS.map((e) => e.symbol).join(' ')).toBe(all);
  });

  it('electron configurations contain exactly Z electrons and valid subshells', () => {
    for (const e of ELEMENTS) {
      expect(electronCount(e.electronConfig), e.symbol).toBe(e.atomicNumber);
      for (const s of parseElectronConfig(e.electronConfig).subshells) {
        expect(AUFBAU_ORDER, `${e.symbol}: ${s.n}${s.l}`).toContain(`${s.n}${s.l}`);
        expect(s.electrons, e.symbol).toBeLessThanOrEqual({ s: 2, p: 6, d: 10, f: 14 }[s.l]);
      }
    }
  });

  it('uses the preceding noble gas as the core, matching the period', () => {
    const coreForPeriod: Record<number, string | null> = { 1: null, 2: 'He', 3: 'Ne', 4: 'Ar', 5: 'Kr', 6: 'Xe', 7: 'Rn' };
    for (const e of ELEMENTS) {
      const { core } = parseElectronConfig(e.electronConfig);
      expect(core, e.symbol).toBe(coreForPeriod[e.period]);
      if (core) expect(NOBLE_GAS_CORES[core]!, e.symbol).toBeLessThan(e.atomicNumber);
    }
  });

  it('follows the aufbau order except for the known exceptions', () => {
    for (const e of ELEMENTS) {
      if (AUFBAU_EXCEPTIONS.has(e.symbol)) {
        expect(e.electronConfig, `${e.symbol} listed as exception`).not.toBe(aufbauConfiguration(e.atomicNumber));
      } else {
        expect(e.electronConfig, e.symbol).toBe(aufbauConfiguration(e.atomicNumber));
      }
    }
    expect(bySymbol('Cr').electronConfig).toBe('[Ar] 3d5 4s1');
    expect(bySymbol('Cu').electronConfig).toBe('[Ar] 3d10 4s1');
    expect(bySymbol('Pd').electronConfig).toBe('[Kr] 4d10');
  });

  it('groups agree with categories', () => {
    for (const e of ELEMENTS) {
      const g = e.group;
      switch (e.category) {
        case 'alkali metal': expect(g, e.symbol).toBe(1); break;
        case 'alkaline earth metal': expect(g, e.symbol).toBe(2); break;
        case 'halogen': expect(g, e.symbol).toBe(17); break;
        case 'noble gas': expect(g, e.symbol).toBe(18); break;
        case 'lanthanide': case 'actinide': expect(g, e.symbol).toBeNull(); break;
        case 'transition metal': expect(g! >= 3 && g! <= 12, e.symbol).toBe(true); break;
        case 'metalloid': case 'post-transition metal': expect(g! >= 13 && g! <= 16, e.symbol).toBe(true); break;
        case 'nonmetal': expect([1, 14, 15, 16], e.symbol).toContain(g); break;
      }
      expect(ELEMENT_CATEGORIES, e.symbol).toContain(e.category);
    }
    expect(symbols((e) => e.category === 'lanthanide')).toHaveLength(15);
    expect(symbols((e) => e.category === 'actinide')).toHaveLength(15);
    expect(symbols((e) => e.category === 'noble gas')).toEqual(['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og']);
    expect(symbols((e) => e.category === 'halogen')).toEqual(['F', 'Cl', 'Br', 'I', 'At', 'Ts']);
  });

  it('blocks agree with groups and with the last-filled subshell', () => {
    for (const e of ELEMENTS) {
      const g = e.group;
      const expected = g === null ? 'f' : e.symbol === 'He' || g <= 2 ? 's' : g >= 13 ? 'p' : 'd';
      expect(e.block, e.symbol).toBe(expected);
      // Lu and Lr sit in the f-block rows by convention although their last electron enters a d/p subshell.
      if (!AUFBAU_EXCEPTIONS.has(e.symbol) && e.symbol !== 'Lu') {
        const filled = aufbauSubshells(e.atomicNumber);
        expect(filled[filled.length - 1]!.l, e.symbol).toBe(e.block);
      }
    }
  });

  it('masses are plausible and increase with Z except for the well-known inversions', () => {
    for (const e of ELEMENTS) {
      const ratio = e.mass / e.atomicNumber;
      expect(ratio, e.symbol).toBeGreaterThanOrEqual(1);
      expect(ratio, e.symbol).toBeLessThan(2.7);
    }
    const inversions: string[] = [];
    for (let i = 0; i < ELEMENTS.length - 1; i++) {
      if (ELEMENTS[i]!.mass > ELEMENTS[i + 1]!.mass) inversions.push(`${ELEMENTS[i]!.symbol}>${ELEMENTS[i + 1]!.symbol}`);
    }
    expect(inversions).toEqual(['Ar>K', 'Co>Ni', 'Te>I', 'Th>Pa', 'U>Np', 'Pu>Am', 'Bh>Hs']);
    expect(bySymbol('C').mass).toBe(12.011);
    expect(bySymbol('Fe').mass).toBe(55.845);
  });

  it('flags radioactive elements: Tc, Pm and everything from Po (84) up', () => {
    expect(symbols((e) => e.radioactive)).toEqual(['Tc', 'Pm', ...ELEMENTS.filter((e) => e.atomicNumber >= 84).map((e) => e.symbol)]);
    // Elements without stable isotopes report an integer mass number, except Th, Pa and U (standard weights).
    for (const e of ELEMENTS.filter((x) => x.radioactive)) {
      expect(Number.isInteger(e.mass), e.symbol).toBe(!['Th', 'Pa', 'U'].includes(e.symbol));
    }
  });

  it('has the right states at room temperature', () => {
    expect(symbols((e) => e.stateAtRoomTemp === 'gas')).toEqual(['H', 'He', 'N', 'O', 'F', 'Ne', 'Cl', 'Ar', 'Kr', 'Xe', 'Rn']);
    expect(symbols((e) => e.stateAtRoomTemp === 'liquid')).toEqual(['Br', 'Hg', 'Cn']);
    expect(bySymbol('Cn').predicted).toBe(true);
  });

  it('marks predicted properties for At, Fr and Z >= 100', () => {
    expect(symbols((e) => e.predicted)).toEqual(['At', 'Fr', ...ELEMENTS.filter((e) => e.atomicNumber >= 100).map((e) => e.symbol)]);
  });

  it('has Pauling electronegativities in range, fluorine highest', () => {
    for (const e of ELEMENTS) {
      if (e.electronegativity === null) continue;
      expect(e.electronegativity, e.symbol).toBeGreaterThanOrEqual(0.7);
      expect(e.electronegativity, e.symbol).toBeLessThanOrEqual(3.98);
    }
    const max = Math.max(...ELEMENTS.map((e) => e.electronegativity ?? 0));
    expect(ELEMENTS.find((e) => e.electronegativity === max)!.symbol).toBe('F');
    expect(symbols((e) => e.electronegativity === null)).toEqual(['He', 'Ne', 'Ar', ...ELEMENTS.filter((e) => e.atomicNumber >= 104).map((e) => e.symbol)]);
  });

  it('every element has a fun fact and at least one use', () => {
    for (const e of ELEMENTS) {
      expect(e.funFact.length, e.symbol).toBeGreaterThan(10);
      expect(e.uses.length, e.symbol).toBeGreaterThan(0);
    }
  });
});

describe('molecules data', () => {
  it('has unique slug ids', () => {
    expect(duplicates(MOLECULES.map((m) => m.id))).toEqual([]);
    for (const m of MOLECULES) expect(m.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('atom lists match the formula (repeat unit for polymers)', () => {
    for (const m of MOLECULES) {
      const fromList: Record<string, number> = {};
      for (const a of m.atoms) fromList[a.symbol] = (fromList[a.symbol] ?? 0) + a.count;
      expect(fromList, m.id).toEqual(parseFormula(repeatUnit(m.formula)));
    }
  });

  it('only uses elements present in the element data', () => {
    const symbols = new Set(ELEMENTS.map((e) => e.symbol));
    for (const m of MOLECULES) {
      for (const a of m.atoms) {
        expect(symbols.has(a.symbol), `${m.id} uses ${a.symbol}`).toBe(true);
        expect(a.count, m.id).toBeGreaterThan(0);
      }
    }
  });

  it('writes polymers as a repeat unit "(...)n" and nothing else that way', () => {
    for (const m of MOLECULES) {
      const isRepeat = /^\(.+\)n$/.test(m.formula);
      expect(isRepeat, m.id).toBe(m.category === 'polymer');
    }
  });

  it('legacy save keys map to the molecule with that formula', () => {
    for (const [formula, id] of Object.entries(LEGACY_MOLECULE_IDS)) {
      const m = getMolecule(id);
      expect(m, id).toBeDefined();
      expect(m!.formula).toBe(formula);
      expect(getMolecule(formula)?.id).toBe(id);
    }
  });
});

describe('the 60 molecules', () => {
  const ids = (cat: string) => MOLECULES.filter((m) => m.category === cat).map((m) => m.id);

  it('matches the approved list: 20 common, 16 organic, 10 polymers, 14 biomolecules', () => {
    expect(MOLECULES).toHaveLength(60);
    expect(ids('common')).toEqual([
      'water', 'carbon-dioxide', 'oxygen-gas', 'nitrogen-gas', 'hydrogen-gas', 'sodium-chloride', 'ammonia', 'hydrogen-chloride',
      'sulfuric-acid', 'calcium-carbonate', 'magnesium-oxide', 'iron-iii-oxide', 'copper-sulfate', 'sodium-hydroxide',
      'sodium-bicarbonate', 'hydrogen-peroxide', 'nitric-acid', 'calcium-hydroxide', 'carbon-monoxide', 'copper-ii-hydroxide',
    ]);
    expect(ids('organic')).toEqual([
      'methane', 'ethane', 'propane', 'butane', 'octane', 'ethene', 'ethyne', 'benzene', 'methanol', 'ethanol', 'acetic-acid',
      'acetone', 'formaldehyde', 'ethyl-acetate', 'chloroform', 'methylamine',
    ]);
    expect(ids('polymer')).toEqual([
      'polyethylene', 'polypropylene', 'pvc', 'polystyrene', 'ptfe', 'pet', 'nylon-6-6', 'natural-rubber', 'starch', 'cellulose',
    ]);
    expect(ids('biomolecule')).toEqual([
      'glucose', 'sucrose', 'glycine', 'alanine', 'adenine', 'guanine', 'cytosine', 'thymine', 'atp', 'cholesterol',
      'palmitic-acid', 'urea', 'vitamin-c', 'caffeine',
    ]);
  });

  it('keeps every original (v1) molecule id', () => {
    for (const id of Object.values(LEGACY_MOLECULE_IDS)) expect(MOLECULES.some((m) => m.id === id), id).toBe(true);
  });

  it('has unique display formulas and no two non-polymers with the same atom counts', () => {
    expect(duplicates(MOLECULES.map((m) => m.formula)).filter((f) => f !== '(C6H10O5)n')).toEqual([]);
    const nonPolymers = MOLECULES.filter((m) => m.category !== 'polymer').map((m) => countsToHill(moleculeCounts(m)));
    expect(duplicates(nonPolymers)).toEqual([]);
  });

  it('only shares atom counts where it teaches something (starch/cellulose; ethene = polyethylene repeat unit)', () => {
    const groups = new Map<string, string[]>();
    for (const m of MOLECULES) {
      const k = countsToHill(moleculeCounts(m));
      groups.set(k, [...(groups.get(k) ?? []), m.id]);
    }
    const shared = [...groups.values()].filter((g) => g.length > 1);
    expect(shared).toEqual([['ethene', 'polyethylene'], ['starch', 'cellulose']]);
  });

  it('has molar masses matching reference values (g/mol)', () => {
    const reference: Record<string, number> = {
      water: 18.015, 'carbon-dioxide': 44.009, 'sodium-chloride': 58.44, 'sulfuric-acid': 98.07, 'calcium-carbonate': 100.09,
      'iron-iii-oxide': 159.69, 'copper-ii-hydroxide': 97.56, 'calcium-hydroxide': 74.09, 'sodium-bicarbonate': 84.01,
      methane: 16.04, octane: 114.23, benzene: 78.11, ethanol: 46.07, 'acetic-acid': 60.05, 'ethyl-acetate': 88.11,
      chloroform: 119.37, methylamine: 31.06, glucose: 180.16, sucrose: 342.30, glycine: 75.07, alanine: 89.09,
      adenine: 135.13, guanine: 151.13, cytosine: 111.10, thymine: 126.11, atp: 507.18, cholesterol: 386.65,
      'palmitic-acid': 256.42, urea: 60.06, 'vitamin-c': 176.12, caffeine: 194.19,
      polyethylene: 28.05, pvc: 62.50, ptfe: 100.02, pet: 192.17, 'nylon-6-6': 226.32, starch: 162.14,
    };
    for (const [id, expected] of Object.entries(reference)) {
      const m = MOLECULES.find((x) => x.id === id)!;
      expect(Math.abs(molarMass(m.formula) - expected), `${id}: ${molarMass(m.formula).toFixed(3)} vs ${expected}`).toBeLessThan(0.05);
    }
  });

  it('has descriptions, uses and sub-categories; polymers list monomers', () => {
    for (const m of MOLECULES) {
      expect(m.description.length, m.id).toBeGreaterThan(10);
      expect(m.uses.length, m.id).toBeGreaterThan(0);
      expect(m.subcategory.length, m.id).toBeGreaterThan(0);
      if (m.category === 'polymer') {
        expect(m.monomers?.length ?? 0, m.id).toBeGreaterThan(0);
        expect(m.subcategory, m.id).toMatch(/polymer$/);
      } else {
        expect(m.monomers, m.id).toBeUndefined();
      }
      for (const code of m.recyclingCodes ?? []) expect(code >= 1 && code <= 7, m.id).toBe(true);
    }
    // Recycling codes 1-6 are all covered by the polymer list.
    expect(MOLECULES.flatMap((m) => m.recyclingCodes ?? []).sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('bench reactions', () => {
  const moleculeFormulas = new Set(MOLECULES.map((m) => m.formula));
  const elementSymbols = new Set(ELEMENTS.map((e) => e.symbol));

  it('has unique ids and unique bench inputs (at most two bench slots)', () => {
    expect(duplicates(REACTIONS.map((r) => r.id))).toEqual([]);
    expect(duplicates(REACTIONS.map((r) => reactionInputs(r).join('|')))).toEqual([]);
    for (const r of REACTIONS) expect(reactionInputs(r).length, r.id).toBeLessThanOrEqual(2);
  });

  it('every equation is balanced', () => {
    for (const r of REACTIONS) expect(isBalanced({ species: r.reactants }, { species: r.products }), r.id).toBe(true);
  });

  it('every species is a known molecule or a named extra made of real elements', () => {
    const used = new Set<string>();
    for (const r of REACTIONS) {
      for (const sp of [...r.reactants, ...r.products]) {
        used.add(sp.formula);
        const known = moleculeFormulas.has(sp.formula) || EXTRA_SPECIES_NAMES[sp.formula] !== undefined;
        expect(known, `${r.id}: ${sp.formula}`).toBe(true);
        for (const sym of Object.keys(parseFormula(sp.formula))) expect(elementSymbols.has(sym), `${r.id}: ${sym}`).toBe(true);
        expect(sp.coeff, r.id).toBeGreaterThan(0);
      }
    }
    for (const extra of Object.keys(EXTRA_SPECIES_NAMES)) expect(used.has(extra), `unused extra ${extra}`).toBe(true);
  });

  it('makes copper(II) hydroxide collectible from the lab', () => {
    expect(REACTIONS.some((r) => r.products.some((p) => p.formula === 'Cu(OH)2'))).toBe(true);
  });
});

describe('missions data', () => {
  const elementSymbols = new Set(ELEMENTS.map((e) => e.symbol));
  const moleculeIds = new Set(MOLECULES.map((m) => m.id));
  const missionIds = new Set(MISSIONS.map((m) => m.id));

  it('has unique mission ids', () => {
    expect(duplicates(MISSIONS.map((m) => m.id))).toEqual([]);
  });

  it('has globally unique question ids (remediation tracks missed questions by id)', () => {
    expect(duplicates(MISSIONS.flatMap((m) => m.quiz.map((q) => q.id)))).toEqual([]);
  });

  it('every mission has steps, a quiz, and known interactives', () => {
    for (const m of MISSIONS) {
      expect(m.steps.length, m.id).toBeGreaterThan(0);
      expect(m.quiz.length, m.id).toBeGreaterThan(0);
      expect(duplicates(m.steps.map((s) => s.id)), m.id).toEqual([]);
      for (const s of m.steps) {
        if (s.interactive) expect((INTERACTIVE_KINDS as readonly string[]).includes(s.interactive), `${m.id}/${s.id}`).toBe(true);
      }
    }
  });

  it('choice questions include their answer among unique options', () => {
    for (const m of MISSIONS) {
      for (const q of m.quiz) {
        if (q.type !== 'mcq' && q.type !== 'truefalse') continue;
        expect(q.options, `${m.id}/${q.id}`).toBeDefined();
        expect(duplicates(q.options!), `${m.id}/${q.id}`).toEqual([]);
        expect(typeof q.answer, `${m.id}/${q.id}`).toBe('string');
        expect(q.options, `${m.id}/${q.id}: answer "${String(q.answer)}" missing`).toContain(q.answer);
      }
    }
  });

  it('rewards reference existing content', () => {
    for (const m of MISSIONS) {
      for (const r of m.rewards) {
        if (r.type === 'element') expect(elementSymbols.has(r.id), `${m.id} element ${r.id}`).toBe(true);
        if (r.type === 'molecule') expect(moleculeIds.has(r.id), `${m.id} molecule ${r.id}`).toBe(true);
        if (r.type === 'currency') expect(r.amount ?? 0, m.id).toBeGreaterThan(0);
      }
    }
  });

  it('has exactly one final boss per world', () => {
    for (const w of worldOrder()) {
      expect(missionsByWorld(w).filter((m) => m.kind === 'boss').length, w).toBe(1);
    }
  });

  it('remediation missions target missions in the same world', () => {
    for (const m of MISSIONS) {
      if (m.kind !== 'remediation') {
        expect(m.remediates, m.id).toBeUndefined();
        continue;
      }
      expect(m.remediates?.length ?? 0, m.id).toBeGreaterThan(0);
      for (const target of m.remediates ?? []) {
        expect(missionIds.has(target), `${m.id} -> ${target}`).toBe(true);
        expect(MISSIONS.find((x) => x.id === target)!.world, `${m.id} -> ${target}`).toBe(m.world);
      }
    }
  });

  it('molecule-maker targets and equation-balancer equations are valid', () => {
    for (const m of MISSIONS) {
      for (const s of m.steps) {
        if (s.interactive === 'molecule-maker' && s.data) {
          for (const sym of Object.keys(parseFormula(s.data.target))) expect(isElementSymbol(sym), `${m.id}: ${sym}`).toBe(true);
        }
        if (s.interactive === 'equation-balancer' && s.data) {
          expect(findCoefficients(s.data.reactants, s.data.products), `${m.id}/${s.id} cannot be balanced`).not.toBeNull();
        }
      }
    }
  });

  it('every practice step supplies its own data (symbol-match may use the default pool)', () => {
    for (const m of MISSIONS) {
      for (const st of m.steps) {
        if (st.interactive === 'symbol-match') continue;
        expect(st.data, `${m.id}/${st.id} (${st.interactive}) has no data`).toBeDefined();
      }
    }
  });

  it('step data is meaningful for its interactive', () => {
    const symbols = new Set(ELEMENTS.map((e) => e.symbol));
    const reactionIds = new Set(REACTIONS.map((r) => r.id));
    const reagents = new Set<string>([...benchReagents(), ...CONDITIONS, '']);
    const organicSubcats = new Set(MOLECULES.filter((x) => x.category === 'organic').map((x) => x.subcategory));
    for (const m of MISSIONS) {
      for (const st of m.steps) {
        const where = `${m.id}/${st.id}`;
        switch (st.interactive) {
          case 'atom-builder': {
            const d = st.data!;
            expect(d.target.p, where).toBeGreaterThan(0);
            if (d.element) expect(ELEMENTS.find((e) => e.symbol === d.element)?.atomicNumber, where).toBe(d.target.p);
            break;
          }
          case 'symbol-match': {
            const pool = st.data?.pool;
            if (Array.isArray(pool)) for (const sym of pool) expect(symbols.has(sym), where).toBe(true);
            break;
          }
          case 'state-sorter': {
            const d = st.data!;
            expect(duplicates(d.items.map((i) => i.label)), where).toEqual([]);
            for (const it of d.items) expect(d.categories, `${where}: ${it.label}`).toContain(it.category);
            break;
          }
          case 'periodic-explorer':
            for (const c of st.data?.clues ?? []) expect(symbols.has(c.answer), `${where}: ${c.answer}`).toBe(true);
            break;
          case 'bond-builder':
            for (const p of st.data!.pairs) expect(symbols.has(p.a) && symbols.has(p.b), where).toBe(true);
            break;
          case 'lab-mix': {
            const d = st.data!;
            if (d.goal) expect(reactionIds.has(d.goal), `${where}: ${d.goal}`).toBe(true);
            for (const slot of d.initial ?? []) expect(reagents.has(slot), `${where}: ${slot}`).toBe(true);
            break;
          }
          case 'ph-slider':
            for (const t of st.data!.tasks) {
              expect(t.min <= t.max && t.min >= 0 && t.max <= 14, where).toBe(true);
              // The slider moves in 0.1 steps: some step value must land inside the range.
              expect(Math.floor(t.max * 10 + 1e-9) >= Math.ceil(t.min * 10 - 1e-9), `${where}: ${t.prompt}`).toBe(true);
            }
            break;
          case 'stoichiometry':
            for (const p of st.data!.problems) expect(molarMass(p.formula), where).toBeGreaterThan(0);
            break;
          case 'reaction-classifier':
            for (const it of st.data!.items) {
              const eq = parseEquationString(it.equation);
              expect(eq, `${where}: ${it.equation}`).not.toBeNull();
              expect(isBalanced(eq!.reactants, eq!.products), `${where}: ${it.equation} is not balanced`).toBe(true);
            }
            break;
          case 'organic-builder':
            for (const t of st.data!.tasks) expect(organicSubcats.has(t.subcategory), `${where}: ${t.subcategory}`).toBe(true);
            break;
          case 'redox':
            for (const it of st.data!.items) expect(Object.keys(parseFormula(it.compound)), where).toContain(it.element);
            break;
          case 'equilibrium':
            expect(st.data!.scenarios.length, where).toBeGreaterThan(0);
            break;
          case 'cell-builder':
            for (const p of st.data!.problems) {
              const c = REDUCTION_POTENTIALS[p.cathode];
              const a = REDUCTION_POTENTIALS[p.anode];
              expect(c && a, `${where}: ${p.cathode}/${p.anode}`).toBeTruthy();
              expect(c!.e0 - a!.e0, `${where}: galvanic cells need a positive E°cell`).toBeGreaterThan(0);
            }
            break;
          case 'decay':
            for (const p of st.data!.problems) expect(p.halfLife > 0 && p.n0 > 0 && p.t >= 0, where).toBe(true);
            break;
          case 'sorter': {
            const d = st.data!;
            expect(duplicates(d.items.map((i) => i.label)), where).toEqual([]);
            for (const it of d.items) expect(d.categories, `${where}: ${it.label}`).toContain(it.category);
            for (const c of d.categories) expect(d.items.some((i) => i.category === c), `${where}: empty category ${c}`).toBe(true);
            break;
          }
          case 'atom-counter':
            for (const it of st.data!.items) {
              const counts = termCounts(it.formula);
              for (const sym of Object.keys(counts)) expect(symbols.has(sym), `${where}: ${it.formula}`).toBe(true);
              if (it.element) expect(counts[it.element], `${where}: ${it.element} not in ${it.formula}`).toBeGreaterThan(0);
            }
            break;
          case 'polymer-builder':
            for (const t of st.data!.tasks) {
              const poly = MOLECULES.find((x) => x.id === t.polymer);
              expect(poly?.category, `${where}: ${t.polymer}`).toBe('polymer');
              if (t.ask === 'recycling') expect(poly?.recyclingCodes?.length, `${where}: ${t.polymer} needs exactly one code`).toBe(1);
              if (t.ask === 'chain-mass') expect(t.n, where).toBeGreaterThan(0);
            }
            break;
          case 'buffer':
            for (const b of st.data!.problems) {
              expect(b.pKa > 0 && b.pKa < 14, where).toBe(true);
              if (b.find === 'pH-after-acid') expect(b.addedAcid < b.baseConc, `${where}: buffer capacity exceeded`).toBe(true);
            }
            break;
          case 'electron-config':
            for (const sym of st.data!.targets) expect(symbols.has(sym), `${where}: ${sym}`).toBe(true);
            break;
          default:
            break;
        }
      }
    }
  });

  it('bosses are multi-stage with lives; mini-bosses are timed', () => {
    for (const m of MISSIONS) {
      if (m.kind === 'boss') {
        expect(m.steps.length, m.id).toBeGreaterThanOrEqual(3);
        expect(m.quiz.length, m.id).toBeGreaterThanOrEqual(8);
        expect(m.bossRules?.lives, m.id).toBeGreaterThan(0);
      }
      if (m.kind === 'miniboss') expect(m.bossRules?.timeLimitSec, m.id).toBeGreaterThan(0);
      if (m.kind === 'core') expect(m.bossRules, m.id).toBeUndefined();
      const t = m.bossRules?.passThreshold;
      if (t !== undefined) expect(t > 0 && t <= 1, m.id).toBe(true);
    }
  });

  it('complete worlds have 10 missions: 7 core, 1 mini-boss, 1 final boss, 1 clinic', () => {
    for (const w of COMPLETE_WORLDS) {
      const ms = missionsByWorld(w);
      const count = (k: string) => ms.filter((m) => m.kind === k).length;
      expect(ms.length, w).toBe(10);
      expect([count('core'), count('miniboss'), count('boss'), count('remediation')], w).toEqual([7, 1, 1, 1]);
    }
  });

  it('each clinic covers every other mission in its world', () => {
    for (const clinic of MISSIONS.filter((m) => m.kind === 'remediation')) {
      const others = missionsByWorld(clinic.world).filter((m) => m.kind !== 'remediation').map((m) => m.id).sort();
      expect([...(clinic.remediates ?? [])].sort(), clinic.id).toEqual(others);
      expect(clinic.quiz.length, `${clinic.id} needs a review quiz for top-ups`).toBeGreaterThanOrEqual(5);
    }
  });

  it('has 40 missions in total', () => {
    expect(MISSIONS).toHaveLength(40);
  });

  it('every element and every molecule is the reward of exactly one mission', () => {
    const elementRewards = MISSIONS.flatMap((m) => m.rewards.filter((r) => r.type === 'element').map((r) => r.id));
    const moleculeRewards = MISSIONS.flatMap((m) => m.rewards.filter((r) => r.type === 'molecule').map((r) => r.id));
    expect(duplicates(elementRewards)).toEqual([]);
    expect(duplicates(moleculeRewards)).toEqual([]);
    expect([...elementRewards].sort()).toEqual(ELEMENTS.map((e) => e.symbol).sort());
    expect([...moleculeRewards].sort()).toEqual(MOLECULES.map((m) => m.id).sort());
  });

  it('bosses, mini-bosses and clinics award badges; every mission pays Atoms', () => {
    for (const m of MISSIONS) {
      expect(m.rewards.some((r) => r.type === 'currency'), m.id).toBe(true);
      if (m.kind !== 'core') expect(m.rewards.some((r) => r.type === 'badge'), m.id).toBe(true);
    }
    const badges = MISSIONS.flatMap((m) => m.rewards.filter((r) => r.type === 'badge').map((r) => r.id));
    expect(duplicates(badges)).toEqual([]);
  });
});
