import { test, expect } from '@playwright/test';

const KEY = 'chemistry-companion-progress';

test.describe('saves', () => {
  test('an old (v1) save is upgraded on load', async ({ page }) => {
    await page.addInitScript(([key]) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem(key!, JSON.stringify({
        state: {
          progress: {
            version: 1, playerName: 'Rosalind', unlockedWorlds: ['beginner', 'intermediate'], currency: 123,
            missions: { 'beg-atom-builder': { missionId: 'beg-atom-builder', completed: true, stars: 2, bestScore: 40, attempts: 1, lastPlayed: 1 } },
            collection: { elements: ['H'], molecules: ['H2O', 'NaCl'], badges: ['atom-master'], avatarItems: [] },
          },
        },
        version: 1,
      }));
    }, [KEY]);
    await page.goto('/collection');
    await expect(page.getByTestId('molecules-total')).toHaveText('2 / 60');
    await expect(page.getByRole('button', { name: /^Water/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Sodium chloride/ })).toBeVisible();
    await expect(page.getByTitle('Atoms currency')).toContainText('123');
    await page.goto('/profile');
    await expect(page.getByText('Name: Rosalind')).toBeVisible();
    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), KEY);
    expect(saved.version).toBe(2);
    expect(saved.state.progress.collection.molecules).toEqual(['water', 'sodium-chloride']);
  });

  test('import rejects invalid text and accepts an exported save', async ({ page }) => {
    await page.goto('/profile');
    const box = page.getByPlaceholder('Paste save JSON here');
    await box.fill('definitely not json');
    await page.getByRole('button', { name: 'Import' }).click();
    await expect(page.getByText('Invalid JSON')).toBeVisible();
    await box.fill('[1,2,3]');
    await page.getByRole('button', { name: 'Import' }).click();
    await expect(page.getByText('Invalid JSON')).toBeVisible();

    await box.fill(JSON.stringify({ version: 2, playerName: 'Dmitri', currency: 77, collection: { elements: ['Fe'], molecules: [] } }));
    await page.getByRole('button', { name: 'Import' }).click();
    await expect(page.getByText('Imported!')).toBeVisible();
    await expect(page.getByText('Name: Dmitri')).toBeVisible();
    await expect(page.getByTitle('Atoms currency')).toContainText('77');
  });
});
