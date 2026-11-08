import type { Molecule } from '../../types';

export const MOLECULE_CATEGORIES: readonly Molecule['category'][] = ['common', 'organic', 'polymer', 'biomolecule'];

export const MOLECULE_CATEGORY_LABELS: Record<Molecule['category'], string> = {
  common: 'Common compound',
  organic: 'Organic molecule',
  polymer: 'Polymer',
  biomolecule: 'Biomolecule',
};

export const MOLECULE_CATEGORY_ICONS: Record<Molecule['category'], string> = {
  common: '🧂',
  organic: '🛢️',
  polymer: '🧵',
  biomolecule: '🧬',
};
