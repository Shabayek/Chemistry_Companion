import { test, expect, type Page } from '@playwright/test';

async function add(page: Page, element: string, times: number) {
  for (let i = 0; i < times; i++) await page.getByRole('button', { name: `Add ${element}`, exact: true }).click();
}

test.describe('lab', () => {
  test('build, recognise and collect a molecule; it appears in the collection after reload', async ({ page }) => {
    await page.goto('/lab');
    await add(page, 'Carbon', 8);
    await add(page, 'Hydrogen', 10);
    await add(page, 'Nitrogen', 4);
    await add(page, 'Oxygen', 2);
    await expect(page.getByText('✅ You built Caffeine!')).toBeVisible();
    await expect(page.getByText(/194\.19 g\/mol/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Collect Caffeine' }).click();
    await expect(page.getByText('In your collection ✓')).toBeVisible();
    await page.goto('/collection');
    await page.reload();
    await expect(page.getByTestId('molecules-total')).toHaveText('1 / 60');
    await expect(page.getByTestId('category-count-biomolecule')).toHaveText('1 / 14');
    await page.getByRole('button', { name: /^Caffeine/ }).click();
    await expect(page.getByRole('article', { name: 'Caffeine' })).toContainText('alkaloid');
  });

  test('polymer repeat units and isomers', async ({ page }) => {
    await page.goto('/lab');
    await add(page, 'Carbon', 2);
    await add(page, 'Fluorine', 4);
    await page.getByRole('button', { name: /Polymerise & collect PTFE/ }).click();
    await page.getByRole('button', { name: 'Clear' }).click();
    await add(page, 'Carbon', 6);
    await add(page, 'Hydrogen', 10);
    await add(page, 'Oxygen', 5);
    await expect(page.getByText(/these are isomers/)).toBeVisible();
    await page.getByRole('button', { name: 'Polymerise & collect Cellulose' }).click();
    await page.goto('/collection');
    await expect(page.getByTestId('category-count-polymer')).toHaveText('2 / 10');
  });

  test('mix bench reactions make collectible products', async ({ page }) => {
    await page.goto('/lab?tab=mix');
    await page.getByRole('combobox', { name: 'First substance' }).selectOption('CuSO4');
    await page.getByRole('combobox', { name: /Second substance/ }).selectOption('NaOH');
    await page.getByRole('button', { name: 'Mix!' }).click();
    await expect(page.getByTestId('equation')).toContainText('CuSO4 + 2NaOH → Cu(OH)2 + Na2SO4');
    await page.getByRole('button', { name: 'Collect Copper(II) hydroxide' }).click();

    await page.getByRole('combobox', { name: 'First substance' }).selectOption('CaCO3');
    await page.getByRole('combobox', { name: /Second substance/ }).selectOption('heat');
    await page.getByRole('button', { name: 'Mix!' }).click();
    await expect(page.getByRole('status')).toContainText('Thermal decomposition');
    await page.getByRole('button', { name: 'Collect Carbon dioxide' }).click();

    await page.getByRole('combobox', { name: /Second substance/ }).selectOption('H2O');
    await page.getByRole('button', { name: 'Mix!' }).click();
    await expect(page.getByRole('status')).toContainText('No visible reaction');

    await page.goto('/collection');
    await expect(page.getByTestId('molecules-total')).toHaveText('2 / 60');
  });

  test('lab tabs work with the keyboard', async ({ page }) => {
    await page.goto('/lab');
    await page.getByRole('tab', { name: 'Molecule Builder' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Mix Lab' })).toBeFocused();
    await expect(page).toHaveURL(/tab=mix/);
    await expect(page.getByRole('button', { name: 'Mix!' })).toBeVisible();
  });
});

test.describe('molecule explorer', () => {
  test('search, filter, then build the molecule from its card', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Molecules' }).click();
    await expect(page.getByTestId('molecule-match-count')).toHaveText('60 molecules');
    await page.getByRole('button', { name: /Biomolecule/ }).click();
    await expect(page.getByTestId('molecule-match-count')).toHaveText('14 molecules');
    await page.getByRole('searchbox', { name: /Search/ }).fill('nucleobase');
    await expect(page.getByTestId('molecule-match-count')).toHaveText('4 molecules');
    await page.getByRole('button', { name: /^Thymine/ }).click();
    await page.getByRole('link', { name: 'Build it in the Lab' }).click();
    await expect(page).toHaveURL(/\/lab\?tab=builder&target=thymine/);
    await expect(page.getByText(/Challenge: build/)).toContainText('Thymine');
    await add(page, 'Carbon', 5);
    await add(page, 'Hydrogen', 6);
    await add(page, 'Nitrogen', 2);
    await add(page, 'Oxygen', 2);
    await expect(page.getByText('🎉 Challenge complete!')).toBeVisible();
  });

  test('"make it" links pre-fill the mix bench', async ({ page }) => {
    await page.goto('/molecules');
    await page.getByRole('searchbox', { name: /Search/ }).fill('ethanol');
    await page.getByRole('button', { name: /^Ethanol/ }).click();
    await page.getByRole('link', { name: /Make it: Glucose/ }).click();
    await page.getByRole('button', { name: 'Mix!' }).click();
    await expect(page.getByTestId('equation')).toContainText('C6H12O6 → 2C2H5OH + 2CO2');
  });
});
