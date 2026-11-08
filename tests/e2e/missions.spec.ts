import { test, expect, type Page } from '@playwright/test';
import { getMission } from '../../src/data/missions';
import { ELEMENTS } from '../../src/data/elements';
import { skipToQuiz } from './helpers';

async function answerAll(page: Page, missionId: string, correct: boolean) {
  const mission = getMission(missionId)!;
  await skipToQuiz(page);
  for (const q of mission.quiz) {
    const choice = correct ? (q.answer as string) : q.options!.find((o) => o !== q.answer)!;
    await page.getByRole('button', { name: choice, exact: true }).click();
    await page.getByRole('button', { name: /Next/i }).click();
  }
}

test.describe('mission rewards and replays', () => {
  test('first clear grants rewards once; progress survives a reload', async ({ page }) => {
    await page.goto('/mission/beg-atom-builder');
    await answerAll(page, 'beg-atom-builder', true);
    await expect(page.getByRole('heading', { name: 'Mission Complete!' })).toBeVisible();
    await expect(page.getByText('Elements: Hydrogen, Helium, Lithium, Beryllium, Boron')).toBeVisible();
    await expect(page.getByText('Molecule: Hydrogen gas')).toBeVisible();
    await page.getByRole('button', { name: /Finish & Return/i }).click();
    await expect(page).toHaveURL(/\/world\/beginner$/);
    const card = page.getByRole('link', { name: /Atom Builder/ });
    await expect(card).toContainText('Completed');

    await page.reload();
    await expect(page.getByRole('link', { name: /Atom Builder/ })).toContainText('Completed');
    const atomsAfterFirst = Number((await page.getByTitle('Atoms currency').textContent())!.replace(/\D/g, ''));
    expect(atomsAfterFirst).toBeGreaterThan(10);

    // Replay: rewards are not granted again.
    await page.goto('/mission/beg-atom-builder');
    await answerAll(page, 'beg-atom-builder', true);
    await expect(page.getByText(/rewards already claimed/i)).toBeVisible();
    await expect(page.getByText(/Elements?:/)).toHaveCount(0);
    await page.getByRole('button', { name: /Finish & Return/i }).click();
    await page.goto('/collection');
    await expect(page.getByText('Elements (5 / 118)')).toBeVisible();
  });

  test('a failed attempt does not clear the mission or grant items', async ({ page }) => {
    await page.goto('/mission/beg-atom-builder');
    await answerAll(page, 'beg-atom-builder', false);
    await expect(page.getByRole('heading', { name: 'Mission Not Cleared' })).toBeVisible();
    await expect(page.getByText(/Elements?:/)).toHaveCount(0);
    await page.getByRole('button', { name: /Try Again/i }).click();
    await expect(page.getByRole('button', { name: /Start Practice/i })).toBeVisible();
    await page.goto('/world/beginner');
    await expect(page.getByRole('link', { name: /Atom Builder/ })).not.toContainText('Completed');
  });

  test('symbol match practice uses the element data', async ({ page }) => {
    await page.goto('/mission/beg-symbol-match');
    await page.getByRole('button', { name: /Start Practice/i }).click();
    for (let round = 1; round <= 8; round++) {
      await expect(page.getByText(`Round ${round} / 8`)).toBeVisible();
      const name = (await page.getByTestId('symbol-match-name').textContent())!;
      const symbol = ELEMENTS.find((e) => e.name === name)!.symbol;
      await page.getByRole('textbox', { name: 'Symbol' }).fill(symbol);
      await page.getByRole('button', { name: 'Check' }).click();
      await expect(page.getByRole('status')).toContainText('Correct');
      await page.getByRole('button', { name: /Next element/ }).click();
    }
    await expect(page.getByText('You matched 8 / 8 symbols.')).toBeVisible();
  });
});
