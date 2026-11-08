import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MissionRun } from '../src/features/mission/MissionRun';
import Review from '../src/features/review/Review';
import Home from '../src/features/home/Home';
import { useGameStore } from '../src/store/useGameStore';
import { getMission, MISSIONS } from '../src/data/missions';
import { dailyMissionId } from '../src/game/engine/daily';
import type { Mission, MissionProgress } from '../src/types';

type User = ReturnType<typeof userEvent.setup>;
const progress = () => useGameStore.getState().progress;

function renderRun(mission: Mission) {
  return render(
    <MemoryRouter initialEntries={['/m']}>
      <Routes><Route path="/m" element={<MissionRun mission={mission} />} /><Route path="/world/:d" element={<p>world</p>} /></Routes>
    </MemoryRouter>,
  );
}
const click = async (user: User, name: string | RegExp) => user.click(await screen.findByRole('button', { name }));
async function toQuiz(user: User) {
  await click(user, /Start (Practice|Quiz)/);
  for (;;) {
    const skip = screen.queryByRole('button', { name: /Skip (step|to Quiz)/ });
    if (!skip) break;
    await user.click(skip);
  }
}

beforeEach(() => {
  localStorage.clear();
  useGameStore.getState().reset();
});

describe('kid mode in missions', () => {
  it('offers a hint that removes a wrong answer, friendlier feedback, and counts hints', async () => {
    useGameStore.getState().setAgeMode('kid');
    const user = userEvent.setup();
    renderRun(getMission('beg-atom-builder')!);
    expect(screen.getByTestId('kid-note')).toHaveTextContent('Kid mode: hints in the quiz');
    await toQuiz(user);
    expect(screen.getAllByRole('button', { name: /^(Proton|Neutron|Electron)/ })).toHaveLength(3);
    await click(user, /Hint/);
    expect(screen.queryByRole('button', { name: 'Electron' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hint/ })).not.toBeInTheDocument();
    await click(user, 'Proton');
    expect(screen.getByRole('status')).toHaveTextContent(/Great job|You got it|Brilliant|Super scientist/);
    for (const a of ['In the nucleus', 'Carbon']) { await click(user, /Next/); await click(user, a); }
    await click(user, /Next/);
    expect(await screen.findByText('💡 Hints used: 1')).toBeInTheDocument();
  });

  it('gives bosses an extra life', async () => {
    const done = (id: string): MissionProgress => ({ missionId: id, completed: true, stars: 3, bestScore: 1, attempts: 1, lastPlayed: 0, missedQuestionIds: [], rewardsClaimed: true });
    useGameStore.setState((s) => ({ progress: { ...s.progress, ageMode: 'kid', missions: { 'beg-miniboss': done('beg-miniboss') } } }));
    const user = userEvent.setup();
    renderRun(getMission('beg-boss')!);
    expect(screen.getByRole('list', { name: 'Boss rules' })).toHaveTextContent('4 lives');
    await toQuiz(user);
    expect(screen.getByRole('img', { name: '4 of 4 lives left' })).toBeInTheDocument();
  });

  it('standard mode has no hints', async () => {
    const user = userEvent.setup();
    renderRun(getMission('beg-atom-builder')!);
    expect(screen.queryByTestId('kid-note')).not.toBeInTheDocument();
    await toQuiz(user);
    expect(screen.queryByRole('button', { name: /Hint/ })).not.toBeInTheDocument();
  });
});

describe('daily challenge in missions and on the home page', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 4, 1, 12)); });
  afterEach(() => vi.useRealTimers());

  it("clearing today's mission pays the bonus and starts a streak", async () => {
    const id = dailyMissionId('2026-05-01', progress(), MISSIONS)!;
    const mission = getMission(id)!;
    const user = userEvent.setup();
    renderRun(mission);
    expect(screen.getByTestId('daily-banner')).toHaveTextContent('+30 Atoms');
    await toQuiz(user);
    for (const q of mission.quiz) { await click(user, q.answer as string); await click(user, /Next/); }
    expect(await screen.findByTestId('daily-result')).toHaveTextContent('Daily Challenge complete! +30 Atoms · 🔥 1-day streak');
    expect(progress()).toMatchObject({ dailyChallengeDate: '2026-05-01', streakDays: 1 });
  });

  it('other missions show no daily banner', () => {
    const id = dailyMissionId('2026-05-01', progress(), MISSIONS)!;
    const other = MISSIONS.find((m) => m.world === 'beginner' && m.kind === 'core' && m.id !== id)!;
    renderRun(other);
    expect(screen.queryByTestId('daily-banner')).not.toBeInTheDocument();
  });

  it('home card shows the challenge, then "done" with the streak', () => {
    const id = dailyMissionId('2026-05-01', progress(), MISSIONS)!;
    const { unmount } = render(<MemoryRouter><Home /></MemoryRouter>);
    const card = screen.getByTestId('daily-card');
    expect(card).toHaveTextContent(getMission(id)!.title);
    expect(within(card).getByRole('link', { name: "Play today's challenge" })).toHaveAttribute('href', `/mission/${id}`);
    expect(card).toHaveTextContent('+30 Atoms');
    unmount();
    useGameStore.setState((s) => ({ progress: { ...s.progress, dailyChallengeDate: '2026-05-01', streakDays: 3 } }));
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByTestId('daily-card')).toHaveTextContent('Done for today');
    expect(screen.getByTestId('daily-streak')).toHaveTextContent('🔥 3-day streak');
  });
});

describe('Mistakes Review page', () => {
  it('shows an empty state', () => {
    render(<MemoryRouter><Review /></MemoryRouter>);
    expect(screen.getByText('No mistakes to review.')).toBeInTheDocument();
  });

  it('groups missed questions by world with answers, explanations and clinic links', () => {
    const mp = (id: string, missed: string[]): MissionProgress => ({ missionId: id, completed: false, stars: 0, bestScore: 0, attempts: 1, lastPlayed: 0, missedQuestionIds: missed, rewardsClaimed: false });
    useGameStore.setState((s) => ({ progress: { ...s.progress, missions: { 'beg-atom-builder': mp('beg-atom-builder', ['b2']), 'int-formulas': mp('int-formulas', ['i18']) } } }));
    render(<MemoryRouter><Review /></MemoryRouter>);
    const item = screen.getByTestId('review-b2');
    expect(item).toHaveTextContent('Where are protons and neutrons found?');
    expect(item).toHaveTextContent('Correct answer: In the nucleus');
    expect(within(item).getByRole('link', { name: 'Atom Builder' })).toHaveAttribute('href', '/mission/beg-atom-builder');
    expect(screen.getByRole('link', { name: /Practise in Atom Clinic/ })).toHaveAttribute('href', '/mission/beg-clinic');
    expect(screen.getByRole('heading', { name: /Intermediate/ })).toHaveTextContent('(1)');
  });

  it('the home page counts mistakes', () => {
    const mp: MissionProgress = { missionId: 'beg-atom-builder', completed: false, stars: 0, bestScore: 0, attempts: 1, lastPlayed: 0, missedQuestionIds: ['b1', 'b2'], rewardsClaimed: false };
    useGameStore.setState((s) => ({ progress: { ...s.progress, missions: { 'beg-atom-builder': mp } } }));
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /Review mistakes \(2\)/ })).toHaveAttribute('href', '/review');
  });
});
