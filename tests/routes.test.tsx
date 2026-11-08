/** jsdom counterpart of tests/e2e/nav.spec.ts: every route renders without crashing. */
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import App from '../src/App';
import { useGameStore } from '../src/store/useGameStore';

/** Each page's own <h1> (not text that also appears in the top bar). */
const routes: [string, RegExp][] = [
  ['/', /^Chemistry Companion$/],
  ['/world/beginner', /^beginner World$/i],
  ['/mission/beg-boss', /^Boss: Atom Master$/],
  ['/lab', /Free Play Lab$/],
  ['/periodic-table', /^Periodic Table$/],
  ['/molecules', /^Molecules$/],
  ['/collection', /^Collection$/],
  ['/profile', /^Profile$/],
  ['/settings', /^Settings$/],
  ['/review', /^Mistakes Review$/],
  ['/showcase', /^See it in action$/],
  ['/no-such-page', /^Page not found$/],
];

describe('routes', () => {
  // Pages are lazy-loaded chunks. Load them all once up front (same module paths as App's lazy imports, so
  // React.lazy resolves from the module cache) so each test measures rendering, not first-time module loading.
  beforeAll(async () => {
    await Promise.all([
      import('../src/features/home/Home'), import('../src/features/world/World'), import('../src/features/mission/MissionPage'),
      import('../src/features/lab/Lab'), import('../src/features/periodic/PeriodicTable'), import('../src/features/molecules/MoleculeExplorer'),
      import('../src/features/collection/Collection'), import('../src/features/profile/Profile'), import('../src/features/settings/Settings'),
      import('../src/features/review/Review'), import('../src/features/showcase/Showcase'),
    ]);
    // The Showcase page fetches its captions file.
    vi.stubGlobal('fetch', vi.fn(async () => new Response('WEBVTT\n')));
  });
  afterAll(() => vi.unstubAllGlobals());
  beforeEach(() => useGameStore.getState().reset());

  it.each(routes)('%s renders', async (path, heading) => {
    window.history.pushState({}, '', path);
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    cleanup();
  });

  it('shows the boss crown and legacy molecule names in the collection', async () => {
    useGameStore.setState((s) => ({ progress: { ...s.progress, collection: { ...s.progress.collection, molecules: ['water'] } } }));
    window.history.pushState({}, '', '/collection');
    render(<App />);
    expect(await screen.findByRole('button', { name: /^Water\s*H2O/ })).toBeInTheDocument();
    expect(screen.getByTestId('molecules-total')).toHaveTextContent('1 / 60');
    cleanup();
    window.history.pushState({}, '', '/world/beginner');
    render(<App />);
    expect(await screen.findByLabelText('Boss mission')).toBeInTheDocument();
  });
});
