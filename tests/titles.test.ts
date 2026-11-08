import { describe, it, expect } from 'vitest';
import { titleFor, APP_NAME } from '../src/lib/titles';

describe('titleFor', () => {
  it.each([
    ['/', 'Home · Chemistry Companion'],
    ['/periodic-table', 'Periodic Table · Chemistry Companion'],
    ['/molecules/', 'Molecules · Chemistry Companion'],
    ['/world/advanced', 'Advanced World · Chemistry Companion'],
    ['/mission/anything', 'Mission · Chemistry Companion'],
    ['/nope', APP_NAME],
  ])('%s', (path, title) => expect(titleFor(path)).toBe(title));
  it('uses an explicit page title', () => {
    expect(titleFor('/mission/beg-boss', 'Boss: Atom Master')).toBe('Boss: Atom Master · Chemistry Companion');
  });
});
