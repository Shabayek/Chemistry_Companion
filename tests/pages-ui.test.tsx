import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import Settings from '../src/features/settings/Settings';
import Profile from '../src/features/profile/Profile';
import Home from '../src/features/home/Home';
import { TopBar } from '../src/components/TopBar';
import { useGameStore } from '../src/store/useGameStore';

const progress = () => useGameStore.getState().progress;
const wrap = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  localStorage.clear();
  useGameStore.getState().reset();
});

describe('Settings page', () => {
  it('updates theme, age mode, audio, motion and text size', async () => {
    const user = userEvent.setup();
    wrap(<Settings />);
    await user.selectOptions(screen.getByRole('combobox', { name: /Theme/ }), 'high-contrast');
    await user.selectOptions(screen.getByRole('combobox', { name: /Age mode/ }), 'kid');
    await user.click(screen.getByRole('checkbox', { name: 'Sound effects' }));
    await user.click(screen.getByRole('checkbox', { name: 'Reduced motion' }));
    await user.selectOptions(screen.getByRole('combobox', { name: /Text size/ }), 'lg');
    expect(progress()).toMatchObject({ theme: 'high-contrast', ageMode: 'kid' });
    expect(progress().settings.kidTone).toBe(true);
    expect(progress().settings).toMatchObject({ audio: false, reducedMotion: true, textSize: 'lg' });
  });
});

describe('Profile page', () => {
  it('shows the player summary', () => {
    useGameStore.getState().addCurrency(42);
    wrap(<Profile />);
    expect(screen.getByText('42 Atoms', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Unlocked worlds:/).parentElement).toHaveTextContent('beginner');
  });

  it('imports a save, rejects bad input, and resets after confirmation', async () => {
    const user = userEvent.setup();
    wrap(<Profile />);
    const box = screen.getByRole('textbox', { name: /Import a save/ });
    await user.type(box, 'nope');
    await user.click(screen.getByRole('button', { name: 'Import' }));
    expect(screen.getByRole('status')).toHaveTextContent('Invalid JSON');
    await user.clear(box);
    await user.click(box);
    await user.paste(JSON.stringify({ playerName: 'Dmitri', currency: 77 }));
    await user.click(screen.getByRole('button', { name: 'Import' }));
    expect(screen.getByRole('status')).toHaveTextContent('Imported!');
    expect(progress()).toMatchObject({ playerName: 'Dmitri', currency: 77 });

    const confirm = vi.spyOn(window, 'confirm');
    confirm.mockReturnValueOnce(false);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(progress().currency).toBe(77);
    confirm.mockReturnValueOnce(true);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(progress().currency).toBe(0);
    confirm.mockRestore();
  });

  it('exports a JSON download', async () => {
    const user = userEvent.setup();
    const createUrl = vi.fn(() => 'blob:save');
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    wrap(<Profile />);
    await user.click(screen.getByRole('button', { name: 'Export JSON' }));
    expect(createUrl).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:save');
    click.mockRestore();
  });
});

describe('Home page', () => {
  it('locks worlds until they are unlocked and shows completion', () => {
    useGameStore.getState().unlockWorld('intermediate');
    wrap(<Home />);
    expect(screen.getByTestId('world-advanced').tagName).toBe('DIV');
    expect(screen.getByTestId('world-advanced')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('world-intermediate')).toHaveAttribute('href', '/world/intermediate');
  });
});

describe('TopBar', () => {
  function Harness() {
    return (
      <MemoryRouter initialEntries={['/']}>
        <TopBar />
        <Routes>
          <Route path="/" element={<Link to="/lab">go to lab</Link>} />
          <Route path="/lab" element={<p>Lab page</p>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('toggles the mobile menu, closes it on Escape and after navigating', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const toggle = screen.getByRole('button', { name: /Menu/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: /Close/ })).toHaveAttribute('aria-expanded', 'true');
    const mobile = document.getElementById('mobile-nav')!;
    expect(within(mobile).getAllByRole('link')).toHaveLength(6);
    await user.keyboard('{Escape}');
    expect(document.getElementById('mobile-nav')).toBeNull();
    await user.click(screen.getByRole('button', { name: /Menu/ }));
    await user.click(within(document.getElementById('mobile-nav')!).getByRole('link', { name: 'Lab' }));
    expect(screen.getByText('Lab page')).toBeInTheDocument();
    expect(document.getElementById('mobile-nav')).toBeNull();
    expect(screen.getAllByRole('link', { name: 'Lab' })[0]).toHaveAttribute('aria-current', 'page');
  });

  it('shows the Atoms balance', () => {
    useGameStore.getState().addCurrency(12);
    render(<Harness />);
    expect(screen.getByTitle('Atoms currency')).toHaveTextContent('Atoms:12');
  });
});
