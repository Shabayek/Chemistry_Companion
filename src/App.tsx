import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig, useReducedMotion } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import { TopBar } from './components/TopBar';
import { RouteEffects } from './components/RouteEffects';
import { TEXT_SIZE_SCALE } from './lib/display';

// Each route is its own chunk; shared data (elements, molecules, missions) is split out by the bundler.
const Home = lazy(() => import('./features/home/Home'));
const World = lazy(() => import('./features/world/World'));
const MissionPage = lazy(() => import('./features/mission/MissionPage'));
const Lab = lazy(() => import('./features/lab/Lab'));
const PeriodicTable = lazy(() => import('./features/periodic/PeriodicTable'));
const MoleculeExplorer = lazy(() => import('./features/molecules/MoleculeExplorer'));
const Collection = lazy(() => import('./features/collection/Collection'));
const Profile = lazy(() => import('./features/profile/Profile'));
const Settings = lazy(() => import('./features/settings/Settings'));
const Review = lazy(() => import('./features/review/Review'));
const Showcase = lazy(() => import('./features/showcase/Showcase'));

function PageLoading() {
  return <p className="text-muted p-4" role="status">Loading…</p>;
}

export default function App() {
  const theme = useGameStore((s) => s.progress.theme);
  const reducedMotion = useGameStore((s) => s.progress.settings.reducedMotion);
  const textSize = useGameStore((s) => s.progress.settings.textSize);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.style.fontSize = TEXT_SIZE_SCALE[textSize] ?? '100%';
  }, [textSize]);
  // Reduced motion: the in-app setting or the operating-system preference turns transitions off entirely.
  const systemReducedMotion = useReducedMotion() ?? false;
  const reduce = reducedMotion || systemReducedMotion;
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduce);
  }, [reduce]);
  return (
    <MotionConfig reducedMotion={reduce ? 'always' : 'never'} {...(reduce ? { transition: { duration: 0 } } : {})}>
      <BrowserRouter>
        <RouteEffects />
        <a href="#main" className="skip-link">Skip to content</a>
        <div className="min-h-full">
          <TopBar />
          <main id="main" tabIndex={-1} className="px-3 pb-8 max-w-6xl mx-auto outline-none">
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/world/:difficulty" element={<World />} />
                <Route path="/mission/:id" element={<MissionPage />} />
                <Route path="/lab" element={<Lab />} />
                <Route path="/periodic-table" element={<PeriodicTable />} />
                <Route path="/molecules" element={<MoleculeExplorer />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/review" element={<Review />} />
                <Route path="/showcase" element={<Showcase />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </BrowserRouter>
    </MotionConfig>
  );
}

function NotFound() {
  return (
    <div className="card text-center space-y-3">
      <h1 className="text-xl font-bold">Page not found</h1>
      <a href="/" className="btn btn-primary">Go home</a>
    </div>
  );
}
