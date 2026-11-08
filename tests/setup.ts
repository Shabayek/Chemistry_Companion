import '@testing-library/jest-dom/vitest';

// mock matchMedia for reduced motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
// Make framer-motion transitions instant so component tests don't wait on real animations.
import { MotionGlobalConfig } from 'framer-motion';
MotionGlobalConfig.skipAnimations = true;

// Async queries (findBy*, waitFor) wait up to 5 s instead of Testing Library's default 1 s. They still resolve as
// soon as the element appears; the extra time only matters on slow or busy machines, where rendering a page with
// the 118-cell periodic table plus a full role query can exceed 1 s (see scripts/test-stress.sh).
import { configure } from '@testing-library/react';
configure({ asyncUtilTimeout: 5000 });
