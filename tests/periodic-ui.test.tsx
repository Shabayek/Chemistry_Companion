import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PeriodicTable from '../src/features/periodic/PeriodicTable';
import InteractivePanel from '../src/features/mission/InteractivePanel';
import { useGameStore } from '../src/store/useGameStore';
import { getMission } from '../src/data/missions';
import { ELEMENTS, COMMON_ELEMENT_SYMBOLS } from '../src/data/elements';

const cell = (name: RegExp | string) => screen.getByRole('button', { name });
const table = () => screen.getByRole('group', { name: 'Periodic table' });

function renderTable() {
  return render(<MemoryRouter><PeriodicTable /></MemoryRouter>);
}

describe('PeriodicTable page', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('renders all 118 elements', () => {
    renderTable();
    expect(within(table()).getAllByRole('button')).toHaveLength(118);
    expect(screen.getByTestId('collected-count')).toHaveTextContent('Collected 0 / 118');
  });

  it('shows details for a selected element, including predicted/radioactive flags', async () => {
    const user = userEvent.setup();
    renderTable();
    await user.click(cell(/^118 Og Oganesson\b/));
    const detail = screen.getByRole('article', { name: 'Oganesson' });
    expect(detail).toHaveTextContent('[294]');
    expect(detail).toHaveTextContent('Radioactive');
    expect(detail).toHaveTextContent('Properties predicted');
    expect(detail).toHaveTextContent('solid (predicted)');
    expect(within(detail).getByText('[Rn] 5f14 6d10 7s2 7p6')).toHaveClass('sr-only');
  });

  it('collects an element with the free Collect button', async () => {
    const user = userEvent.setup();
    renderTable();
    await user.click(cell(/^26 Fe Iron\b/));
    await user.click(screen.getByRole('button', { name: 'Collect Iron' }));
    expect(screen.getByText('Collected ✓')).toBeInTheDocument();
    expect(useGameStore.getState().progress.collection.elements).toEqual(['Fe']);
    expect(screen.getByTestId('collected-count')).toHaveTextContent('Collected 1 / 118');
    expect(cell(/^26 Fe Iron, collected/)).toBeInTheDocument();
  });

  it('search dims non-matching elements and Enter selects the first match', async () => {
    const user = userEvent.setup();
    renderTable();
    const search = screen.getByRole('searchbox', { name: /Search/ });
    await user.type(search, 'neod');
    expect(screen.getByTestId('match-count')).toHaveTextContent('1 matching element');
    expect(cell(/^60 Nd Neodymium\b/)).not.toHaveAttribute('data-dimmed');
    expect(cell(/^10 Ne Neon\b/)).toHaveAttribute('data-dimmed', 'true');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('article', { name: 'Neodymium' })).toBeInTheDocument();
  });

  it('filters by category chips and clears filters', async () => {
    const user = userEvent.setup();
    renderTable();
    await user.click(screen.getByRole('button', { name: 'Noble gas' }));
    expect(screen.getByTestId('match-count')).toHaveTextContent('7 matching elements');
    await user.click(screen.getByRole('button', { name: 'Halogen' }));
    expect(screen.getByTestId('match-count')).toHaveTextContent('13 matching elements');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByTestId('match-count')).toHaveTextContent('118 elements');
  });

  it('supports arrow-key navigation with a single tab stop', async () => {
    const user = userEvent.setup();
    renderTable();
    const cells = within(table()).getAllByRole('button');
    expect(cells.filter((c) => c.tabIndex === 0)).toHaveLength(1);
    cell(/^1 H Hydrogen\b/).focus();
    await user.keyboard('{ArrowRight}');
    expect(cell(/^2 He Helium\b/)).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(cell(/^18 Ar Argon\b/)).toHaveFocus();
    await user.keyboard('{ArrowLeft}{Enter}');
    expect(screen.getByRole('article', { name: 'Chlorine' })).toBeInTheDocument();
  });

  it('switches colour modes and shows a legend', async () => {
    const user = userEvent.setup();
    renderTable();
    await user.selectOptions(screen.getByRole('combobox', { name: /Colour by/ }), 'electronegativity');
    expect(screen.getByLabelText('Legend')).toHaveTextContent('0.79');
    expect(screen.getByLabelText('Legend')).toHaveTextContent('3.98');
    await user.selectOptions(screen.getByRole('combobox', { name: /Colour by/ }), 'block');
    expect(screen.getByLabelText('Legend')).toHaveTextContent('f-block');
  });
});

describe('mission interactives', () => {
  it('periodic explorer reuses the full table', async () => {
    const user = userEvent.setup();
    render(<InteractivePanel step={{ id: 'x', kind: 'guided', title: 't', prompt: 'p', interactive: 'periodic-explorer' }} />);
    const grid = screen.getByRole('group', { name: 'Periodic table explorer' });
    expect(within(grid).getAllByRole('button')).toHaveLength(118);
    await user.click(within(grid).getByRole('button', { name: /^79 Au Gold\b/ }));
    expect(screen.getByRole('article', { name: 'Gold' })).toHaveTextContent('[Xe] 4f14 5d10 6s1');
  });

  const symbolOf = (name: string) => ELEMENTS.find((e) => e.name === name)!.symbol;

  it('symbol match draws from the common pool and scores answers', async () => {
    const user = userEvent.setup();
    render(<InteractivePanel step={getMission('beg-symbol-match')!.steps[0]!} />);
    const seen: string[] = [];
    for (let round = 0; round < 8; round++) {
      const name = screen.getByTestId('symbol-match-name').textContent!;
      seen.push(symbolOf(name));
      const answer = round === 0 ? 'Zz' : symbolOf(name);
      await user.type(screen.getByRole('textbox', { name: 'Symbol' }), answer);
      await user.click(screen.getByRole('button', { name: 'Check' }));
      expect(screen.getByRole('status')).toHaveTextContent(round === 0 ? /Not quite/ : /Correct/);
      await user.click(screen.getByRole('button', { name: /Next element/ }));
    }
    expect(screen.getByRole('status')).toHaveTextContent('You matched 7 / 8 symbols.');
    expect(new Set(seen).size).toBe(8);
    for (const s of seen) expect(COMMON_ELEMENT_SYMBOLS).toContain(s);
  });

  it('symbol match gives a capitalisation hint without penalty', async () => {
    const user = userEvent.setup();
    render(<InteractivePanel step={{ id: 's1', kind: 'practice', title: 't', prompt: 'p', interactive: 'symbol-match', data: { pool: ['Na'], rounds: 1 } }} />);
    await user.type(screen.getByRole('textbox', { name: 'Symbol' }), 'NA');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('status')).toHaveTextContent(/capital letters/);
    await user.clear(screen.getByRole('textbox', { name: 'Symbol' }));
    await user.type(screen.getByRole('textbox', { name: 'Symbol' }), 'Na{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent(/Correct/);
    await user.click(screen.getByRole('button', { name: /Next element/ }));
    expect(screen.getByRole('status')).toHaveTextContent('You matched 1 / 1 symbols.');
  });

  it("symbol match supports the 'all' pool", () => {
    render(<InteractivePanel step={{ id: 's1', kind: 'practice', title: 't', prompt: 'p', interactive: 'symbol-match', data: { pool: 'all', rounds: 118 } }} />);
    expect(screen.getByText(/Round 1 \/ 118/)).toBeInTheDocument();
  });
});
