import { test, expect } from '@playwright/test';
import { getMission } from '../../src/data/missions';
import { seedProgress, completed, skipToQuiz } from './helpers';

test.describe('beginner & intermediate content', () => {
  test('mini-boss: timed quiz ends when the clock runs out', async ({ page }) => {
    // Reduced motion makes page transitions instant, so the fake clock can jump ahead safely.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    await seedProgress(page, { unlockedWorlds: ['beginner'], missions: completed(['beg-atom-builder', 'beg-symbol-match', 'beg-state-sorter']) });
    await page.goto('/world/beginner');
    await page.getByTestId('mission-card-beg-miniboss').click();
    await expect(page.getByRole('list', { name: 'Boss rules' })).toContainText('2:00 to finish the quiz');
    await skipToQuiz(page);
    await expect(page.getByRole('timer')).toBeVisible();
    const first = getMission('beg-miniboss')!.quiz[0]!;
    await page.getByRole('button', { name: first.answer as string, exact: true }).click();
    await page.clock.fastForward('02:05');
    await expect(page.getByText(/Time's up!/)).toBeVisible();
    await expect(page.getByText('You answered 1 / 6 correctly.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mission Not Cleared' })).toBeVisible();
  });

  test('clinic: recommended after misses, personalised, and cleared afterwards', async ({ page }) => {
    const missions = completed(['beg-atom-builder']);
    (missions['beg-atom-builder'] as { missedQuestionIds: string[] }).missedQuestionIds = ['b2'];
    await seedProgress(page, { unlockedWorlds: ['beginner'], missions });
    await page.goto('/world/beginner');
    const card = page.getByTestId('mission-card-beg-clinic');
    await expect(card.getByTestId('recommended')).toBeVisible();
    await card.click();
    await expect(page.getByTestId('remediation-note')).toContainText('picked 1 question you missed earlier');
    await skipToQuiz(page);
    await expect(page.getByText('From Atom Builder')).toBeVisible();
    await page.getByRole('button', { name: 'In the nucleus', exact: true }).click();
    await page.getByRole('button', { name: 'Next →' }).click();
    const review = getMission('beg-clinic')!.quiz.slice(0, 4);
    for (const q of review) {
      await page.getByRole('button', { name: q.answer as string, exact: true }).click();
      await page.getByRole('button', { name: /Next/ }).click();
    }
    await expect(page.getByRole('heading', { name: 'Mission Complete!' })).toBeVisible();
    await expect(page.getByText('Badge: atom-clinic')).toBeVisible();
    await page.getByRole('button', { name: /Finish & Return/ }).click();
    await expect(page.getByTestId('mission-card-beg-clinic').getByTestId('recommended')).toHaveCount(0);
  });

  test('physical or chemical: sorter and a lab goal', async ({ page }) => {
    await page.goto('/mission/beg-physical-chemical');
    await page.getByRole('button', { name: /Start Practice/ }).click();
    const step = getMission('beg-physical-chemical')!.steps[0]!;
    if (step.interactive !== 'sorter') throw new Error('unexpected step');
    for (const it of step.data!.items) await page.getByRole('combobox', { name: it.label }).selectOption(it.category);
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByText('✅ All correct!')).toBeVisible();
    await page.getByRole('button', { name: 'Next step →' }).click();
    await page.getByRole('button', { name: 'Mix!' }).click();
    await expect(page.getByText('✅ Goal reached!')).toBeVisible();
    await expect(page.getByTestId('step-status')).toHaveText('✓ Step complete (100%)');
  });

  test('reading formulas uses the atom counter', async ({ page }) => {
    await seedProgress(page, { unlockedWorlds: ['beginner', 'intermediate'] });
    await page.goto('/mission/int-formulas');
    await page.getByRole('button', { name: /Start Practice/ }).click();
    const answers = ['2', '12', '9', '6', '6', '8'];
    for (let i = 0; i < answers.length; i++) {
      const task = page.getByTestId(`task-count-${i}`);
      await task.getByRole('textbox').fill(answers[i]!);
      await task.getByRole('button', { name: 'Check' }).click();
    }
    await expect(page.getByTestId('task-summary')).toHaveText('Score: 6 / 6');
  });

  test('world maps show 10 missions with a mini-boss, a boss and a clinic', async ({ page }) => {
    await seedProgress(page, { unlockedWorlds: ['beginner', 'intermediate'] });
    for (const w of ['beginner', 'intermediate']) {
      await page.goto(`/world/${w}`);
      await expect(page.getByTestId('world-progress')).toContainText('0 / 10 missions');
      await expect(page.getByRole('img', { name: 'Mini-boss mission' })).toHaveCount(1);
      await expect(page.getByRole('img', { name: 'Boss mission', exact: true })).toHaveCount(1);
      await expect(page.getByRole('img', { name: 'Clinic mission' })).toHaveCount(1);
    }
  });
});
