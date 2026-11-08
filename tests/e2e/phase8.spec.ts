import { test, expect, type Page } from '@playwright/test';
import { getMission, MISSIONS } from '../../src/data/missions';
import { dailyMissionId } from '../../src/game/engine/daily';
import { migrateProgress } from '../../src/game/engine/progress';
import { skipToQuiz } from './helpers';

async function answerAll(page: Page, missionId: string, correct: boolean) {
  for (const q of getMission(missionId)!.quiz) {
    const choice = correct ? (q.answer as string) : q.options!.find((o) => o !== q.answer)!;
    await page.getByRole('button', { name: choice, exact: true }).click();
    await page.getByRole('button', { name: /Next|See results/ }).click();
  }
}

test.describe('phase 8', () => {
  test('daily challenge: play from the home page, earn the bonus and a streak', async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 4, 1, 12));
    const id = dailyMissionId('2026-05-01', migrateProgress(null), MISSIONS)!;
    await page.goto('/');
    const card = page.getByTestId('daily-card');
    await expect(card).toContainText(getMission(id)!.title);
    await card.getByRole('link', { name: "Play today's challenge" }).click();
    await expect(page.getByTestId('daily-banner')).toContainText('+30 Atoms');
    await skipToQuiz(page);
    await answerAll(page, id, true);
    await expect(page.getByTestId('daily-result')).toContainText('+30 Atoms · 🔥 1-day streak');
    await page.goto('/');
    await expect(page.getByTestId('daily-card')).toContainText('Done for today');
    await expect(page.getByTestId('daily-streak')).toHaveText('🔥 1-day streak');
  });

  test('kid mode: a hint removes a wrong answer', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('combobox', { name: /Age mode/ }).selectOption('kid');
    await page.goto('/mission/beg-atom-builder');
    await expect(page.getByTestId('kid-note')).toBeVisible();
    await skipToQuiz(page);
    await page.getByRole('button', { name: /Hint/ }).click();
    await expect(page.locator('.quiz-option')).toHaveCount(2);
    await page.getByRole('button', { name: 'Proton', exact: true }).click();
    await expect(page.getByRole('status').first()).toContainText(/Great job|You got it|Brilliant|Super scientist/);
  });

  test('sound effects follow the setting', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __sounds: string[] }).__sounds = [];
      window.addEventListener('cc:sound', (e) => (window as unknown as { __sounds: string[] }).__sounds.push((e as CustomEvent<string>).detail));
    });
    const sounds = () => page.evaluate(() => (window as unknown as { __sounds: string[] }).__sounds);
    await page.goto('/mission/beg-atom-builder');
    await skipToQuiz(page);
    await page.getByRole('button', { name: 'Proton', exact: true }).click();
    await page.getByRole('button', { name: /Next/ }).click();
    await page.getByRole('button', { name: 'Outside the atom', exact: true }).click();
    expect(await sounds()).toEqual(['correct', 'wrong']);

    await page.goto('/settings');
    await page.getByRole('checkbox', { name: 'Sound effects' }).uncheck();
    await page.goto('/mission/beg-atom-builder');
    await skipToQuiz(page);
    await page.getByRole('button', { name: 'Proton', exact: true }).click();
    expect(await sounds()).toEqual([]);
  });

  test('mistakes review lists missed questions and links to the clinic', async ({ page }) => {
    await page.goto('/review');
    await expect(page.getByText('No mistakes to review.')).toBeVisible();
    await page.goto('/mission/beg-atom-builder');
    await skipToQuiz(page);
    await answerAll(page, 'beg-atom-builder', false);
    await page.goto('/');
    await page.getByRole('link', { name: /Review mistakes \(3\)/ }).click();
    await expect(page).toHaveTitle('Mistakes Review · Chemistry Companion');
    await expect(page.getByTestId('review-b1')).toContainText('Proton');
    await page.getByRole('link', { name: /Practise in Atom Clinic/ }).click();
    await expect(page.getByTestId('remediation-note')).toContainText('picked 3 questions you missed earlier');
  });
});
