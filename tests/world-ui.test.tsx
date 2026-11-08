import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import World from '../src/features/world/World';
import { useGameStore } from '../src/store/useGameStore';
import { missionsByWorld } from '../src/data/missions';
import type { MissionProgress } from '../src/types';

const done = (id: string): MissionProgress => ({ missionId: id, completed: true, stars: 2, bestScore: 1, attempts: 1, lastPlayed: 0, missedQuestionIds: [], rewardsClaimed: true });
const renderWorld = (w: string) => render(<MemoryRouter initialEntries={[`/world/${w}`]}><Routes><Route path="/world/:difficulty" element={<World />} /></Routes></MemoryRouter>);

beforeEach(() => useGameStore.getState().reset());

describe('World page', () => {
  it('shows progress toward the 80% unlock and locks the boss', () => {
    renderWorld('beginner');
    const total = missionsByWorld('beginner').length;
    expect(screen.getByTestId('world-progress')).toHaveTextContent(`0 / ${total} missions completed (0%)`);
    expect(screen.getByTestId('unlock-status')).toHaveTextContent(`Complete ${Math.ceil(total * 0.8)} of ${total} (80%) to unlock Intermediate`);
    const boss = screen.getByTestId('mission-card-beg-boss');
    expect(boss.tagName).toBe('DIV');
    expect(boss).toHaveAttribute('aria-disabled', 'true');
    expect(within(boss).getByTestId('lock-reason')).toHaveTextContent('Defeat Mini-Boss: Particle Patrol first.');
    expect(within(screen.getByTestId('mission-card-beg-miniboss')).getByTestId('lock-reason')).toHaveTextContent('Clear 3 more core missions to challenge this mini-boss.');
    expect(within(screen.getByTestId('mission-card-beg-miniboss')).getByText('⚔️ Mini-boss')).toBeInTheDocument();
    expect(within(boss).getByText('👑 Final boss')).toBeInTheDocument();
    expect(screen.getByTestId('mission-card-beg-atom-builder').tagName).toBe('A');
  });

  it('opens the boss once the requirement is met and shows stars', () => {
    const ids = ['beg-atom-builder', 'beg-symbol-match', 'beg-state-sorter', 'beg-molecule-maker', 'beg-counting', 'beg-miniboss'];
    useGameStore.setState((s) => ({ progress: { ...s.progress, missions: Object.fromEntries(ids.map((id) => [id, done(id)])) } }));
    renderWorld('beginner');
    expect(screen.getByTestId('mission-card-beg-boss').tagName).toBe('A');
    expect(within(screen.getByTestId('mission-card-beg-atom-builder')).getByLabelText('2 of 3 stars')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'World completion' })).toHaveAttribute('aria-valuenow', String(Math.round((6 / missionsByWorld('beginner').length) * 100)));
  });

  it('marks an unlocked next world and locked worlds', () => {
    useGameStore.setState((s) => ({ progress: { ...s.progress, unlockedWorlds: ['beginner', 'intermediate'] } }));
    renderWorld('beginner');
    expect(screen.getByTestId('unlock-status')).toHaveTextContent('✓ Intermediate unlocked');
  });

  it('a locked world shows every mission as locked', () => {
    renderWorld('expert');
    expect(screen.getByText(/This world is locked/)).toBeInTheDocument();
    for (const m of missionsByWorld('expert')) {
      expect(within(screen.getByTestId(`mission-card-${m.id}`)).getByTestId('lock-reason')).toHaveTextContent('Unlock the Expert world first.');
    }
  });
});
