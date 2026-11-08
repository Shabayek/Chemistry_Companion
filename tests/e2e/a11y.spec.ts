import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedProgress } from './helpers';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const PAGES = ['/', '/world/beginner', '/mission/beg-atom-builder', '/lab', '/periodic-table', '/molecules', '/collection', '/review', '/showcase', '/profile', '/settings'];

async function expectNoViolations(page: Page, where: string) {
  // Let lazy chunks, their CSS (injected on demand by the dev server) and images settle before scanning.
  await page.waitForLoadState('networkidle');
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const report = violations.map((v) => `${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes[0]?.target.join(' ')} — ${v.nodes[0]?.failureSummary?.split('\n')[1]?.trim() ?? ''}`);
  expect(report, `axe violations on ${where}`).toEqual([]);
}

async function seed(page: Page, theme: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedProgress(page, { theme, unlockedWorlds: ['beginner', 'intermediate', 'advanced', 'expert'], collection: { elements: ['H', 'Fe'], molecules: ['water'], badges: ['atom-master'], avatarItems: [] } });
}

test.describe('axe: no WCAG 2.1 AA violations', () => {
  for (const theme of ['dark', 'light', 'high-contrast']) {
    test(`main pages (${theme} theme)`, async ({ page }) => {
      test.setTimeout(180000);
      await seed(page, theme);
      for (const p of PAGES) {
        await page.goto(p);
        await page.locator('main h1, main h2').first().waitFor();
        await expectNoViolations(page, `${p} [${theme}]`);
      }
    });
  }

  test('mission states: practice, answered question, result', async ({ page }) => {
    await seed(page, 'dark');
    await page.goto('/mission/beg-atom-builder');
    await page.getByRole('button', { name: /Start Practice/ }).click();
    await expectNoViolations(page, 'practice');
    await page.getByRole('button', { name: /Skip step/ }).click();
    await page.getByRole('button', { name: /Skip to Quiz/ }).click();
    await page.getByRole('button', { name: 'Neutron' }).click();
    await expectNoViolations(page, 'answered question');
    for (const answer of ['In the nucleus', 'Carbon']) {
      await page.getByRole('button', { name: /Next/ }).click();
      await page.getByRole('button', { name: answer, exact: true }).click();
    }
    await page.getByRole('button', { name: /Next/ }).click();
    await page.getByRole('heading', { name: /Mission/ }).waitFor();
    await expectNoViolations(page, 'result');
  });

  test('mobile menu and lab results', async ({ page }) => {
    await seed(page, 'dark');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/lab');
    await page.getByRole('button', { name: /Menu/ }).click();
    await expectNoViolations(page, 'mobile menu');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Add Hydrogen' }).click();
    await page.getByRole('button', { name: 'Add Hydrogen' }).click();
    await page.getByRole('button', { name: 'Add Oxygen' }).click();
    await expectNoViolations(page, 'lab with a recognised molecule');
  });
});

test.describe('keyboard and screen-reader support', () => {
  test('skip link jumps to the main content', async ({ page }) => {
    await page.goto('/periodic-table');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
    await expect(page.locator('#main')).toBeFocused();
  });

  test('each page has its own title and focus moves to the content after navigating', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Home · Chemistry Companion');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Periodic' }).click();
    await expect(page).toHaveTitle('Periodic Table · Chemistry Companion');
    await expect(page.locator('#main')).toBeFocused();
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Periodic' })).toHaveAttribute('aria-current', 'page');
    await page.goto('/mission/beg-boss');
    await expect(page).toHaveTitle('Boss: Atom Master · Chemistry Companion');
    await page.goto('/world/expert');
    await expect(page).toHaveTitle('Expert World · Chemistry Companion');
    await page.goto('/nowhere');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('desktop shows the inline navigation and no menu button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Menu/ })).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Lab' })).toBeVisible();
  });

  test('mobile menu: toggles, closes on Escape and after navigating', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const menu = page.getByRole('button', { name: /Menu/ });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.click();
    await expect(page.getByRole('button', { name: /Close/ })).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav')).toHaveCount(0);
    await page.getByRole('button', { name: /Menu/ }).click();
    await page.locator('#mobile-nav').getByRole('link', { name: 'Molecules' }).click();
    await expect(page).toHaveURL(/\/molecules$/);
    await expect(page.locator('#mobile-nav')).toHaveCount(0);
    // Nothing overflows the viewport horizontally.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('text size setting scales the whole UI', async ({ page }) => {
    await page.goto('/settings');
    const rootSize = () => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(await rootSize()).toBe(16);
    await page.getByRole('combobox', { name: /Text size/ }).selectOption('lg');
    expect(await rootSize()).toBe(18);
    await page.reload();
    expect(await rootSize()).toBe(18);
    await page.getByRole('combobox', { name: /Text size/ }).selectOption('sm');
    expect(await rootSize()).toBe(15);
  });
});
