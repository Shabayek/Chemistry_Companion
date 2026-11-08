import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import Lab from '../src/features/lab/Lab';
import MoleculeBuilder from '../src/features/lab/MoleculeBuilder';
import Collection from '../src/features/collection/Collection';
import MoleculeExplorer from '../src/features/molecules/MoleculeExplorer';
import InteractivePanel from '../src/features/mission/InteractivePanel';
import { MixBench } from '../src/components/lab/MixBench';
import { Formula } from '../src/components/molecules/Formula';
import { useGameStore } from '../src/store/useGameStore';
import { getMission } from '../src/data/missions';

type User = ReturnType<typeof userEvent.setup>;

async function add(user: User, name: string, times = 1) {
  for (let i = 0; i < times; i++) await user.click(screen.getByRole('button', { name: `Add ${name}` }));
}

const collection = () => useGameStore.getState().progress.collection;

beforeEach(() => useGameStore.getState().reset());

describe('Formula', () => {
  it('subscripts counts but not coefficients, and keeps plain text for screen readers', () => {
    const { container } = render(<Formula value="2H2 + O2 → 2H2O" />);
    expect(screen.getByText('2H2 + O2 → 2H2O')).toHaveClass('sr-only');
    expect(Array.from(container.querySelectorAll('sub')).map((s) => s.textContent)).toEqual(['2', '2', '2']);
  });
  it('handles parentheses, multi-digit counts and polymers', () => {
    const { container } = render(<><Formula value="Ca(OH)2" /><Formula value="C12H22O11" /><Formula value="(C2H4)n" /><Formula value="2C8H18 + 25O2" /></>);
    expect(Array.from(container.querySelectorAll('sub')).map((s) => s.textContent)).toEqual(['2', '12', '22', '11', '2', '4', 'n', '8', '18', '2']);
  });
});

describe('Molecule Builder', () => {
  it('recognises water and collects it', async () => {
    const user = userEvent.setup();
    render(<MoleculeBuilder />);
    await add(user, 'Oxygen');
    await add(user, 'Hydrogen');
    expect(screen.getByText(/No molecule in the collection/)).toBeInTheDocument();
    expect(screen.getAllByText(/Close to/).map((e) => e.textContent).join(' ')).toMatch(/Water: add 1 H/);
    await add(user, 'Hydrogen');
    expect(screen.getByTestId('built-formula')).toHaveTextContent('H2O');
    expect(screen.getByText('✅ You built Water!')).toBeInTheDocument();
    expect(screen.getByText(/18\.02 g\/mol/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Collect Water' }));
    expect(collection().molecules).toEqual(['water']);
    expect(screen.getByText('In your collection ✓')).toBeInTheDocument();
  });

  it('recognises a molecule however you count it (ethanol = C2H6O)', async () => {
    const user = userEvent.setup();
    render(<MoleculeBuilder />);
    await add(user, 'Carbon', 2);
    await add(user, 'Hydrogen', 6);
    await add(user, 'Oxygen');
    expect(screen.getByText('✅ You built Ethanol!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Oxygen' }));
    expect(screen.getByText('✅ You built Ethane!')).toBeInTheDocument();
  });

  it('offers both ethene and polyethylene for C2H4', async () => {
    const user = userEvent.setup();
    render(<MoleculeBuilder />);
    await add(user, 'Carbon', 2);
    await add(user, 'Hydrogen', 4);
    await user.click(screen.getByRole('button', { name: 'Polymerise & collect Polyethylene' }));
    await user.click(screen.getByRole('button', { name: 'Collect Ethene' }));
    expect(collection().molecules).toEqual(['polyethylene', 'ethene']);
  });

  it('explains isomers for starch and cellulose', async () => {
    const user = userEvent.setup();
    render(<MoleculeBuilder />);
    await add(user, 'Carbon', 6);
    await add(user, 'Hydrogen', 10);
    await add(user, 'Oxygen', 5);
    expect(screen.getByText('✅ Repeat unit of Starch')).toBeInTheDocument();
    expect(screen.getByText('✅ Repeat unit of Cellulose')).toBeInTheDocument();
    expect(screen.getByText(/these are isomers/)).toBeInTheDocument();
  });

  it('can add elements outside the palette', async () => {
    const user = userEvent.setup();
    render(<MoleculeBuilder />);
    await user.selectOptions(screen.getByRole('combobox', { name: /Add another element/ }), 'Zn');
    expect(screen.getByTestId('count-Zn')).toHaveTextContent('1');
    expect(screen.getByText(/No molecule in the collection has this formula/)).toBeInTheDocument();
  });

  it('runs a challenge from an initial target, with a formula hint', async () => {
    const user = userEvent.setup();
    render(<MoleculeBuilder initialTarget="ammonia" />);
    expect(screen.getByText(/Challenge: build/)).toHaveTextContent('Ammonia');
    await user.click(screen.getByRole('button', { name: 'Show formula hint' }));
    expect(screen.getByText(/Formula:/)).toHaveTextContent('NH3');
    await add(user, 'Nitrogen');
    await add(user, 'Hydrogen', 3);
    expect(screen.getByText('🎉 Challenge complete!')).toBeInTheDocument();
  });

  it('picks a new challenge the player has not collected', async () => {
    const user = userEvent.setup();
    render(<MoleculeBuilder />);
    await user.click(screen.getByRole('button', { name: /Challenge me/ }));
    expect(screen.getByText(/Challenge: build/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'End challenge' }));
    expect(screen.queryByText(/Challenge: build/)).not.toBeInTheDocument();
  });
});

describe('Mix bench', () => {
  it('makes a collectible precipitate: CuSO4 + NaOH', async () => {
    const user = userEvent.setup();
    render(<MixBench allowCollect />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'First substance' }), 'CuSO4');
    await user.selectOptions(screen.getByRole('combobox', { name: /Second substance/ }), 'NaOH');
    await user.click(screen.getByRole('button', { name: 'Mix!' }));
    expect(screen.getByTestId('equation')).toHaveTextContent('CuSO4 + 2NaOH → Cu(OH)2 + Na2SO4');
    expect(screen.getByRole('status')).toHaveTextContent(/pale-blue solid/);
    await user.click(screen.getByRole('button', { name: 'Collect Copper(II) hydroxide' }));
    expect(collection().molecules).toEqual(['copper-ii-hydroxide']);
  });

  it('uses conditions such as a catalyst', async () => {
    const user = userEvent.setup();
    render(<MixBench allowCollect />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'First substance' }), 'H2O2');
    await user.selectOptions(screen.getByRole('combobox', { name: /Second substance/ }), 'catalyst');
    await user.click(screen.getByRole('button', { name: 'Mix!' }));
    expect(screen.getByTestId('equation')).toHaveTextContent('2H2O2 → 2H2O + O2');
    expect(screen.getByRole('status')).toHaveTextContent(/Manganese\(IV\) oxide/);
  });

  it('reports when nothing happens', async () => {
    const user = userEvent.setup();
    render(<MixBench />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'First substance' }), 'H2O');
    await user.selectOptions(screen.getByRole('combobox', { name: /Second substance/ }), '');
    await user.click(screen.getByRole('button', { name: 'Mix!' }));
    expect(screen.getByRole('status')).toHaveTextContent('No visible reaction between Water and nothing');
  });

  it('in missions it shows products but no collect buttons', async () => {
    const user = userEvent.setup();
    render(<InteractivePanel step={getMission('int-lab-mix')!.steps[0]!} />);
    await user.click(screen.getByRole('button', { name: 'Mix!' }));
    expect(screen.getByTestId('equation')).toHaveTextContent('HCl + NaOH → NaCl + H2O');
    expect(screen.queryByRole('button', { name: /^Collect/ })).not.toBeInTheDocument();
  });
});

describe('Lab page', () => {
  function LocationProbe() {
    const loc = useLocation();
    return <span data-testid="location">{loc.pathname}{loc.search}</span>;
  }
  const renderLab = (url: string) => render(
    <MemoryRouter initialEntries={[url]}><Routes><Route path="/lab" element={<><Lab /><LocationProbe /></>} /></Routes></MemoryRouter>,
  );

  it('has accessible tabs that sync with the URL', async () => {
    const user = userEvent.setup();
    renderLab('/lab');
    expect(screen.getByRole('tab', { name: 'Molecule Builder' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'Mix Lab' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/lab?tab=mix');
    expect(screen.getByRole('button', { name: 'Mix!' })).toBeInTheDocument();
    screen.getByRole('tab', { name: 'Mix Lab' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'pH Bench' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'pH Bench' })).toHaveAttribute('aria-selected', 'true');
  });

  it('opens a build challenge or a pre-filled bench from the URL', async () => {
    const user = userEvent.setup();
    const { unmount } = renderLab('/lab?tab=builder&target=caffeine');
    expect(screen.getByText(/Challenge: build/)).toHaveTextContent('Caffeine');
    unmount();
    renderLab('/lab?tab=mix&mix=C6H12O6,yeast');
    await user.click(screen.getByRole('button', { name: 'Mix!' }));
    expect(screen.getByTestId('equation')).toHaveTextContent('C6H12O6 → 2C2H5OH + 2CO2');
  });
});

describe('Collection page', () => {
  const renderCollection = () => render(<MemoryRouter><Collection /></MemoryRouter>);

  it('shows totals, per-category progress and locked slots', () => {
    useGameStore.getState().collectMolecule('water');
    useGameStore.getState().collectMolecule('glucose');
    useGameStore.getState().collectElement('O');
    renderCollection();
    expect(screen.getByTestId('elements-total')).toHaveTextContent('1 / 118');
    expect(screen.getByTestId('molecules-total')).toHaveTextContent('2 / 60');
    expect(screen.getByTestId('category-count-common')).toHaveTextContent('1 / 20');
    expect(screen.getByTestId('category-count-organic')).toHaveTextContent('0 / 16');
    expect(screen.getByTestId('category-count-polymer')).toHaveTextContent('0 / 10');
    expect(screen.getByTestId('category-count-biomolecule')).toHaveTextContent('1 / 14');
    expect(within(screen.getByTestId('category-polymer')).getAllByLabelText(/^Locked/)).toHaveLength(10);
    expect(screen.getByRole('progressbar', { name: 'Molecules collected' })).toHaveAttribute('aria-valuenow', '2');
  });

  it('opens details for collected molecules and elements', async () => {
    const user = userEvent.setup();
    useGameStore.getState().collectMolecule('glucose');
    useGameStore.getState().collectElement('O');
    renderCollection();
    await user.click(screen.getByRole('button', { name: /^Glucose/ }));
    expect(screen.getByRole('article', { name: 'Glucose' })).toHaveTextContent('180.16 g/mol');
    await user.click(within(screen.getByRole('group', { name: 'Collected elements' })).getByRole('button', { name: /^8 O Oxygen\b/ }));
    expect(screen.getByRole('article', { name: 'Oxygen' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('group', { name: 'Collected elements' })).getByRole('button', { name: /^79 Au Gold\b/ }));
    expect(screen.getByText(/Gold is not in your collection yet/)).toBeInTheDocument();
  });
});

describe('Molecule explorer', () => {
  const renderExplorer = () => render(<MemoryRouter><MoleculeExplorer /></MemoryRouter>);

  it('lists all 60 and filters by search and category', async () => {
    const user = userEvent.setup();
    renderExplorer();
    expect(within(screen.getByRole('list', { name: 'Molecule list' })).getAllByRole('button')).toHaveLength(60);
    await user.click(screen.getByRole('button', { name: /Polymer/ }));
    expect(screen.getByTestId('molecule-match-count')).toHaveTextContent('10 molecules');
    await user.type(screen.getByRole('searchbox', { name: /Search/ }), 'ethylene');
    expect(screen.getByTestId('molecule-match-count')).toHaveTextContent('3 molecules'); // polyethylene, PTFE (polytetrafluoroethylene), PET
  });

  it('shows details with links to build or make the molecule', async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.type(screen.getByRole('searchbox', { name: /Search/ }), 'Cu(OH)2');
    await user.click(screen.getByRole('button', { name: /^Copper\(II\) hydroxide/ }));
    const detail = screen.getByRole('article', { name: 'Copper(II) hydroxide' });
    expect(within(detail).getByRole('link', { name: 'Build it in the Lab' })).toHaveAttribute('href', '/lab?tab=builder&target=copper-ii-hydroxide');
    expect(within(detail).getByRole('link', { name: /Make it:/ })).toHaveAttribute('href', '/lab?tab=mix&mix=CuSO4%2CNaOH');
  });
});
