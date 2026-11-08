import { test, expect } from '@playwright/test';

const table = (page: import('@playwright/test').Page) => page.getByRole('group', { name: 'Periodic table' });

test.describe('periodic table', () => {
  test('shows all 118 elements in the standard layout', async ({ page }) => {
    await page.goto('/periodic-table');
    await expect(table(page).getByRole('button')).toHaveCount(118);
    // Layout sanity: He is in the far-right column on the same row as H; La sits below the main table.
    const h = await table(page).getByRole('button', { name: /^1 H Hydrogen\b/ }).boundingBox();
    const he = await table(page).getByRole('button', { name: /^2 He Helium\b/ }).boundingBox();
    const og = await table(page).getByRole('button', { name: /^118 Og Oganesson\b/ }).boundingBox();
    const la = await table(page).getByRole('button', { name: /^57 La Lanthanum\b/ }).boundingBox();
    expect(Math.abs(h!.y - he!.y)).toBeLessThan(2);
    expect(he!.x).toBeGreaterThan(h!.x + 800);
    expect(Math.abs(og!.x - he!.x)).toBeLessThan(2);
    expect(la!.y).toBeGreaterThan(og!.y);
  });

  test('selecting an element shows its details', async ({ page }) => {
    await page.goto('/periodic-table');
    await table(page).getByRole('button', { name: /^43 Tc Technetium\b/ }).click();
    const card = page.getByRole('article', { name: 'Technetium' });
    await expect(card).toContainText('[98]');
    await expect(card).toContainText('Radioactive');
    await expect(card).toContainText('first element to be made artificially');
  });

  test('search, category filters and colour modes', async ({ page }) => {
    await page.goto('/periodic-table');
    await page.getByRole('searchbox', { name: /Search/ }).fill('79');
    await expect(page.getByTestId('match-count')).toHaveText('1 matching element');
    await page.getByRole('searchbox', { name: /Search/ }).press('Enter');
    await expect(page.getByRole('article', { name: 'Gold' })).toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByRole('button', { name: 'Lanthanide' }).click();
    await expect(page.getByTestId('match-count')).toHaveText('15 matching elements');
    await page.getByRole('button', { name: 'Lanthanide' }).click();
    await expect(page.getByTestId('match-count')).toHaveText('118 elements');

    await page.getByRole('combobox', { name: /Colour by/ }).selectOption('state');
    await expect(page.getByLabel('Legend')).toContainText('liquid');
  });

  test('keyboard navigation', async ({ page }) => {
    await page.goto('/periodic-table');
    await table(page).getByRole('button', { name: /^1 H Hydrogen\b/ }).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await expect(table(page).getByRole('button', { name: /^12 Mg Magnesium\b/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('article', { name: 'Magnesium' })).toBeVisible();
  });

  test('collecting an element persists across reloads and shows in the collection', async ({ page }) => {
    await page.goto('/periodic-table');
    await table(page).getByRole('button', { name: /^10 Ne Neon\b/ }).click();
    await page.getByRole('button', { name: 'Collect Neon' }).click();
    await expect(page.getByTestId('collected-count')).toHaveText('Collected 1 / 118');
    await page.reload();
    await expect(page.getByTestId('collected-count')).toHaveText('Collected 1 / 118');
    await expect(table(page).getByRole('button', { name: '10 Ne Neon, collected' })).toBeVisible();
    await page.goto('/collection');
    await expect(page.getByText('Elements (1 / 118)')).toBeVisible();
    await expect(page.getByText('Ne Neon')).toBeVisible();
  });

  test('the table scrolls horizontally on small screens instead of squashing', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/periodic-table');
    const cell = await table(page).getByRole('button', { name: /^26 Fe Iron\b/ }).boundingBox();
    expect(cell!.width).toBeGreaterThan(35);
    await table(page).getByRole('button', { name: /^118 Og Oganesson\b/ }).click();
    await expect(page.getByRole('article', { name: 'Oganesson' })).toBeVisible();
  });
});
