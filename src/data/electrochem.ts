/** Standard reduction potentials at 25 °C (V vs SHE), keyed by metal (or H2). */
export const REDUCTION_POTENTIALS: Record<string, { halfReaction: string; e0: number }> = {
  Li: { halfReaction: 'Li⁺ + e⁻ → Li', e0: -3.04 },
  Mg: { halfReaction: 'Mg²⁺ + 2e⁻ → Mg', e0: -2.37 },
  Al: { halfReaction: 'Al³⁺ + 3e⁻ → Al', e0: -1.66 },
  Zn: { halfReaction: 'Zn²⁺ + 2e⁻ → Zn', e0: -0.76 },
  Fe: { halfReaction: 'Fe²⁺ + 2e⁻ → Fe', e0: -0.44 },
  Ni: { halfReaction: 'Ni²⁺ + 2e⁻ → Ni', e0: -0.25 },
  Pb: { halfReaction: 'Pb²⁺ + 2e⁻ → Pb', e0: -0.13 },
  H2: { halfReaction: '2H⁺ + 2e⁻ → H₂', e0: 0.0 },
  Cu: { halfReaction: 'Cu²⁺ + 2e⁻ → Cu', e0: 0.34 },
  Ag: { halfReaction: 'Ag⁺ + e⁻ → Ag', e0: 0.8 },
  Au: { halfReaction: 'Au³⁺ + 3e⁻ → Au', e0: 1.5 },
};
