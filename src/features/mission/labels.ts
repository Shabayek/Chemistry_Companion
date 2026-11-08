import type { Mission } from '../../types';

export const KIND_LABELS: Record<Mission['kind'], string> = {
  core: 'Mission',
  miniboss: '⚔️ Mini-boss',
  boss: '👑 Final boss',
  remediation: '🩺 Clinic',
};
