/**
 * Component-level mission flows (practice steps, quiz, bosses, timers, remediation), runnable in jsdom.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MissionPage from '../src/features/mission/MissionPage';
import { MissionRun } from '../src/features/mission/MissionRun';
import { useGameStore } from '../src/store/useGameStore';
import { getMission } from '../src/data/missions';
import type { Mission, MissionProgress } from '../src/types';

type User = ReturnType<typeof userEvent.setup>;

function renderMission(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/mission/${id}`]}>
      <Routes>
        <Route path="/mission/:id" element={<MissionPage />} />
        <Route path="/world/:difficulty" element={<div>World page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderRun(mission: Mission) {
  return render(
    <MemoryRouter initialEntries={['/m']}>
      <Routes>
        <Route path="/m" element={<MissionRun mission={mission} />} />
        <Route path="/world/:difficulty" element={<div>World page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const click = async (user: User, name: string | RegExp) => user.click(await screen.findByRole('button', { name }));

/** Skip every practice step, reaching the first quiz question. */
async function skipPractice(user: User) {
  await click(user, /Start (Practice|Quiz)/);
  for (;;) {
    const skip = screen.queryByRole('button', { name: /Skip (step|to Quiz)|Go to Quiz/ });
    if (!skip) break;
    await user.click(skip);
  }
}

async function answerQuiz(user: User, mission: Mission, pick: (answer: string, options: string[]) => string) {
  for (const q of mission.quiz) {
    await click(user, pick(q.answer as string, q.options ?? []));
    await click(user, /Next|See results/);
  }
}

const done = (id: string): MissionProgress => ({ missionId: id, completed: true, stars: 3, bestScore: 1, attempts: 1, lastPlayed: 0, missedQuestionIds: [], rewardsClaimed: true });
const progress = () => useGameStore.getState().progress;

beforeEach(() => {
  localStorage.clear();
  useGameStore.getState().reset();
});

describe('core mission flow', () => {
  it('practice steps are graded, then the quiz; rewards are granted once and saved on the result screen', async () => {
    const user = userEvent.setup();
    renderMission('beg-atom-builder');
    await click(user, /Start Practice/);
    expect(screen.getByRole('heading', { name: /Practice 1 \/ 2/ })).toBeInTheDocument();
    await click(user, 'Add a proton');
    await click(user, 'Add an electron');
    expect(await screen.findByText('✅ Atom built correctly!')).toBeInTheDocument();
    expect(screen.getByTestId('step-status')).toHaveTextContent('Step complete (100%)');
    await click(user, 'Next step →');
    expect(await screen.findByRole('heading', { name: /Practice 2 \/ 2/ })).toBeInTheDocument();
    for (const part of ['a proton', 'a neutron', 'an electron']) {
      await click(user, `Add ${part}`);
      await click(user, `Add ${part}`);
    }
    await click(user, 'Go to Quiz →');
    await answerQuiz(user, getMission('beg-atom-builder')!, (a) => a);

    expect(await screen.findByRole('heading', { name: 'Mission Complete!' })).toBeInTheDocument();
    expect(screen.getByText(/3 \/ 3 correctly/)).toBeInTheDocument();
    expect(screen.getByTestId('practice-summary')).toHaveTextContent('Practice: 1 / 1 step completed · 10 / 10 points'); // step 1 is guided (ungraded)
    expect(screen.getByRole('list', { name: 'Rewards' })).toHaveTextContent('Elements: Hydrogen, Helium, Lithium, Beryllium, Boron');
    expect(screen.getByRole('list', { name: 'Rewards' })).toHaveTextContent('Molecule: Hydrogen gas');
    // Saved as soon as the result appears, before pressing Finish.
    expect(progress().missions['beg-atom-builder']).toMatchObject({ completed: true, attempts: 1, rewardsClaimed: true });
    expect(progress().collection.elements).toEqual(['H', 'He', 'Li', 'Be', 'B']);
    expect(progress().collection.molecules).toEqual(['hydrogen-gas']);

    await click(user, /Finish & Return/);
    expect(await screen.findByText('World page')).toBeInTheDocument();
    expect(progress().missions['beg-atom-builder']!.attempts).toBe(1);
  });

  it('replaying does not re-grant rewards', async () => {
    const user = userEvent.setup();
    renderMission('beg-atom-builder');
    await skipPractice(user);
    await answerQuiz(user, getMission('beg-atom-builder')!, (a) => a);
    await click(user, /Try Again/);
    const atoms = progress().currency;
    await skipPractice(user);
    await answerQuiz(user, getMission('beg-atom-builder')!, (a) => a);
    expect(await screen.findByText(/rewards already claimed/i)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Rewards' })).not.toBeInTheDocument();
    expect(progress().missions['beg-atom-builder']!.attempts).toBe(2);
    expect(progress().currency).toBeLessThanOrEqual(atoms + 20);
  });

  it('failing records missed questions and grants no items', async () => {
    const user = userEvent.setup();
    renderMission('beg-atom-builder');
    await skipPractice(user);
    await answerQuiz(user, getMission('beg-atom-builder')!, (a, opts) => opts.find((o) => o !== a)!);
    expect(await screen.findByRole('heading', { name: /Not Cleared/ })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Rewards' })).not.toBeInTheDocument();
    expect(progress().missions['beg-atom-builder']).toMatchObject({ completed: false, stars: 0, missedQuestionIds: ['b1', 'b2', 'b3'] });
  });

  it('shows correct/incorrect feedback with the explanation', async () => {
    const user = userEvent.setup();
    renderMission('beg-atom-builder');
    await skipPractice(user);
    await click(user, 'Neutron');
    expect(await screen.findByRole('status')).toHaveTextContent(/Not quite/);
    expect(screen.getByRole('button', { name: 'Proton ✓' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Neutron ✗' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles unknown missions', () => {
    renderMission('does-not-exist');
    expect(screen.getByText(/Mission not found/)).toBeInTheDocument();
  });
});

describe('bosses', () => {
  it('the final boss is locked until the mini-boss is defeated', () => {
    renderMission('beg-boss');
    expect(screen.getByRole('heading', { name: 'Boss: Atom Master' })).toBeInTheDocument();
    expect(screen.getByText('This mission is locked.')).toBeInTheDocument();
    expect(screen.getByText('Defeat Mini-Boss: Particle Patrol first.')).toBeInTheDocument();
  });

  it('lists boss rules, runs all stages, and ends the attempt when lives run out', async () => {
    const ids = ['beg-atom-builder', 'beg-symbol-match', 'beg-state-sorter', 'beg-molecule-maker', 'beg-counting', 'beg-miniboss'];
    useGameStore.setState((s) => ({ progress: { ...s.progress, missions: Object.fromEntries(ids.map((id) => [id, done(id)])) } }));
    const user = userEvent.setup();
    renderMission('beg-boss');
    expect(screen.getByRole('list', { name: 'Boss rules' })).toHaveTextContent('3 lives');
    expect(screen.getByText(/4 practice steps · 8 quiz questions/)).toBeInTheDocument();
    await click(user, /Start Practice/);
    expect(screen.getByRole('heading', { name: /Practice 1 \/ 4: Stage 1: Build carbon/ })).toBeInTheDocument();
    for (let i = 0; i < 3; i++) await click(user, 'Skip step →');
    await click(user, 'Skip to Quiz →');
    expect(screen.getByTestId('lives')).toHaveAccessibleName('3 of 3 lives left');

    const boss = getMission('beg-boss')!;
    for (let i = 0; i < 3; i++) {
      const q = boss.quiz[i]!;
      await click(user, q.options!.find((o) => o !== q.answer)!);
      if (i < 2) await click(user, 'Next →');
    }
    expect(screen.getByText('💔 Out of lives!')).toBeInTheDocument();
    await click(user, 'See results');
    expect(await screen.findByText('💔 You ran out of lives.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Not Cleared/ })).toBeInTheDocument();
    expect(progress().missions['beg-boss']).toMatchObject({ completed: false, attempts: 1 });
  });
});

describe('mini-boss timer', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("ends the quiz when time runs out and counts unanswered questions as wrong", async () => {
    const core = ['beg-atom-builder', 'beg-symbol-match', 'beg-state-sorter'];
    useGameStore.setState((s) => ({ progress: { ...s.progress, missions: Object.fromEntries(core.map((id) => [id, done(id)])) } }));
    const base = getMission('beg-atom-builder')!;
    const mini: Mission = { ...base, id: 'test-mini', kind: 'miniboss', title: 'Mini Test', steps: [], bossRules: { timeLimitSec: 20 } };
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderRun(mini);
    expect(screen.getByRole('list', { name: 'Boss rules' })).toHaveTextContent('0:20 to finish the quiz');
    await click(user, /Start Quiz/);
    expect(screen.getByTestId('timer')).toHaveTextContent('0:20');
    await click(user, base.quiz[0]!.answer as string);
    await act(async () => { vi.advanceTimersByTime(21000); });
    expect(await screen.findByText(/Time's up!/)).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 3 correctly/)).toBeInTheDocument();
    expect(progress().missions['test-mini']).toMatchObject({ completed: false, missedQuestionIds: ['b2', 'b3'] });
  });
});

describe('remediation', () => {
  it('builds the quiz from missed questions and clears them when answered correctly', async () => {
    useGameStore.setState((s) => ({
      progress: { ...s.progress, missions: { 'beg-atom-builder': { ...done('beg-atom-builder'), missedQuestionIds: ['b2'] } } },
    }));
    const base = getMission('beg-symbol-match')!;
    const clinic: Mission = { ...base, id: 'test-clinic', kind: 'remediation', title: 'Test Clinic', steps: [], remediates: ['beg-atom-builder'] };
    const user = userEvent.setup();
    renderRun(clinic);
    expect(screen.getByTestId('remediation-note')).toHaveTextContent('picked 1 question you missed earlier');
    await click(user, /Start Quiz/);
    expect(screen.getByText(/From/)).toHaveTextContent('From Atom Builder');
    expect(screen.getByRole('heading', { name: 'Where are protons and neutrons found?' })).toBeInTheDocument();
    await click(user, 'In the nucleus');
    await click(user, 'Next →');
    // Topped up with the clinic's own review questions.
    for (const q of base.quiz) {
      await click(user, q.answer as string);
      await click(user, /Next/);
    }
    expect(await screen.findByRole('heading', { name: 'Mission Complete!' })).toBeInTheDocument();
    expect(progress().missions['beg-atom-builder']!.missedQuestionIds).toEqual([]);
  });
});
