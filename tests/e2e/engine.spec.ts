import { test, expect } from '@playwright/test';
import { getMission } from '../../src/data/missions';
import { seedProgress, completed, skipToQuiz } from './helpers';

const ALL_WORLDS = ['beginner', 'intermediate', 'advanced', 'expert'];

test.describe('mission engine', () => {
  test('graded practice: solving every problem earns full practice points', async ({ page }) => {
    await seedProgress(page, { unlockedWorlds: ALL_WORLDS });
    await page.goto('/mission/adv-stoich');
    await page.getByRole('button', { name: /Start Practice/ }).click();
    const answers = ['2', '88.02', '0.2', '90.08', '6.022e23'];
    for (let i = 0; i < answers.length; i++) {
      const task = page.getByTestId(`task-stoich-${i}`);
      await task.getByRole('textbox').fill(answers[i]!);
      await task.getByRole('button', { name: 'Check' }).click();
      await expect(task.getByRole('status')).toContainText('Correct');
    }
    await expect(page.getByTestId('step-status')).toHaveText('✓ Step complete (100%)');
    await page.getByRole('button', { name: 'Go to Quiz →' }).click();
    for (const q of getMission('adv-stoich')!.quiz) {
      await page.getByRole('button', { name: q.answer as string, exact: true }).click();
      await page.getByRole('button', { name: /Next/ }).click();
    }
    await expect(page.getByTestId('practice-summary')).toHaveText('Practice: 1 / 1 step completed · 10 / 10 points');
    await expect(page.getByLabel('3 stars')).toBeVisible();
  });

  test('equation balancer accepts typed coefficients', async ({ page }) => {
    await seedProgress(page, { unlockedWorlds: ['beginner', 'intermediate'] });
    await page.goto('/mission/int-equation-balancer');
    await page.getByRole('button', { name: /Start Practice/ }).click();
    await page.getByRole('spinbutton', { name: 'Coefficient for H2', exact: true }).fill('2');
    await page.getByRole('spinbutton', { name: 'Coefficient for H2O' }).fill('2');
    await expect(page.getByText('✅ Balanced!')).toBeVisible();
    await page.getByRole('button', { name: 'Next step →' }).click();
    await expect(page.getByRole('heading', { name: /Practice 2 \/ 3: Balance ammonia/ })).toBeVisible();
  });

  test('the final boss is locked on the world map until the mini-boss is defeated', async ({ page }) => {
    await page.goto('/world/beginner');
    const card = page.getByTestId('mission-card-beg-boss');
    await expect(card).toContainText('Defeat Mini-Boss: Particle Patrol first.');
    await expect(card).toHaveAttribute('aria-disabled', 'true');
    await page.goto('/mission/beg-boss');
    await expect(page.getByText('This mission is locked.')).toBeVisible();
  });

  test('boss lives: three wrong answers end the attempt', async ({ page }) => {
    await seedProgress(page, { unlockedWorlds: ['beginner'], missions: completed(['beg-atom-builder', 'beg-symbol-match', 'beg-state-sorter', 'beg-molecule-maker', 'beg-counting', 'beg-miniboss']) });
    await page.goto('/world/beginner');
    await page.getByTestId('mission-card-beg-boss').click();
    await expect(page.getByRole('list', { name: 'Boss rules' })).toContainText('3 lives');
    await skipToQuiz(page);
    const boss = getMission('beg-boss')!;
    for (let i = 0; i < 3; i++) {
      const q = boss.quiz[i]!;
      await expect(page.getByRole('img', { name: `${3 - i} of 3 lives left` })).toBeVisible();
      await page.getByRole('button', { name: q.options!.find((o) => o !== q.answer)!, exact: true }).click();
      if (i < 2) await page.getByRole('button', { name: 'Next →' }).click();
    }
    await expect(page.getByText('💔 Out of lives!')).toBeVisible();
    await page.getByRole('button', { name: 'See results' }).click();
    await expect(page.getByText('💔 You ran out of lives.')).toBeVisible();
    await page.reload();
    await page.goto('/world/beginner');
    await expect(page.getByTestId('mission-card-beg-boss')).not.toContainText('Completed');
  });

  test('winning the final boss awards its badge and, at 8/10 cleared, unlocks the next world', async ({ page }) => {
    await seedProgress(page, { unlockedWorlds: ['beginner'], missions: completed(['beg-atom-builder', 'beg-symbol-match', 'beg-state-sorter', 'beg-molecule-maker', 'beg-counting', 'beg-miniboss', 'beg-physical-chemical']) });
    await page.goto('/mission/beg-boss');
    await skipToQuiz(page);
    for (const q of getMission('beg-boss')!.quiz) {
      await page.getByRole('button', { name: q.answer as string, exact: true }).click();
      await page.getByRole('button', { name: /Next/ }).click();
    }
    await expect(page.getByRole('heading', { name: 'Mission Complete!' })).toBeVisible();
    await expect(page.getByText('Badge: atom-master')).toBeVisible();
    await expect(page.getByText(/Intermediate world unlocked/i)).toBeVisible();
  });

  test('quiz feedback marks the right answer and the wrong pick', async ({ page }) => {
    await page.goto('/mission/beg-atom-builder');
    await skipToQuiz(page);
    await page.getByRole('button', { name: 'Electron', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Proton ✓' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Electron ✗' })).toBeVisible();
  });

  test('double-clicking Skip advances exactly one step', async ({ page }) => {
    await seedProgress(page, { unlockedWorlds: ['beginner'], missions: completed(['beg-atom-builder', 'beg-symbol-match', 'beg-state-sorter', 'beg-molecule-maker', 'beg-counting', 'beg-miniboss']) });
    await page.goto('/mission/beg-boss');
    await page.getByRole('button', { name: /Start Practice/ }).click();
    await expect(page.getByRole('heading', { name: /Practice 1 \/ 4/ })).toBeVisible();
    await page.getByRole('button', { name: 'Skip step →' }).dblclick();
    await expect(page.getByRole('heading', { name: /Practice 2 \/ 4/ })).toBeVisible();
    await page.waitForTimeout(600);
    await expect(page.getByRole('heading', { name: /Practice 2 \/ 4/ })).toBeVisible();
  });
});
