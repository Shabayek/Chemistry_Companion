import { test, expect, type Page } from '@playwright/test';
import { getMission } from '../../src/data/missions';
import { seedProgress } from './helpers';

const ALL = ['beginner', 'intermediate', 'advanced', 'expert'];

async function addElectrons(page: Page, sub: string, n: number) {
  for (let i = 0; i < n; i++) await page.getByRole('button', { name: `Add electron to ${sub}` }).click();
}

test.describe('advanced & expert content', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedProgress(page, { unlockedWorlds: ALL });
  });

  test('world maps have 10 missions each with a mini-boss, boss and clinic', async ({ page }) => {
    for (const w of ['advanced', 'expert']) {
      await page.goto(`/world/${w}`);
      await expect(page.getByTestId('world-progress')).toContainText('0 / 10 missions');
      await expect(page.getByRole('img', { name: 'Mini-boss mission', exact: true })).toHaveCount(1);
      await expect(page.getByRole('img', { name: 'Boss mission', exact: true })).toHaveCount(1);
      await expect(page.getByRole('img', { name: 'Clinic mission', exact: true })).toHaveCount(1);
    }
  });

  test('orbital architect: build O, Na and Fe with the core shortcut', async ({ page }) => {
    await page.goto('/mission/exp-orbitals');
    await page.getByRole('button', { name: /Start Practice/ }).click();
    await expect(page.getByTestId('config-target')).toContainText('Oxygen');
    await page.getByRole('button', { name: 'Fill [He] core' }).click();
    await addElectrons(page, '2s', 2);
    await addElectrons(page, '2p', 4);
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByTestId('config-target')).toContainText('Sodium');
    await page.getByRole('button', { name: 'Fill [Ne] core' }).click();
    await addElectrons(page, '3s', 1);
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByTestId('config-target')).toContainText('Iron');
    await page.getByRole('button', { name: 'Fill [Ar] core' }).click();
    await addElectrons(page, '4s', 2);
    await addElectrons(page, '3d', 6);
    await expect(page.getByTestId('config-built')).toHaveText('[Ar] 3d6 4s2');
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByTestId('step-status')).toHaveText('✓ Step complete (100%)');
  });

  test('buffer builder: all five problems', async ({ page }) => {
    await page.goto('/mission/exp-buffers');
    await page.getByRole('button', { name: /Start Practice/ }).click();
    const answers = ['4.76', '4.46', '2', '11.2', '4.58'];
    for (let i = 0; i < answers.length; i++) {
      const task = page.getByTestId(`task-buffer-${i}`);
      await task.getByRole('textbox').fill(answers[i]!);
      await task.getByRole('button', { name: 'Check' }).click();
      await expect(task.getByRole('status')).toContainText('Correct');
    }
    await expect(page.getByTestId('step-status')).toHaveText('✓ Step complete (100%)');
  });

  test('polymer workshop: clearing it adds seven polymers to the collection', async ({ page }) => {
    await page.goto('/mission/adv-polymers');
    await expect(page.getByTestId('reward-preview')).toContainText('Nylon-6,6');
    await page.getByRole('button', { name: /Start Practice/ }).click();
    const answers: Record<number, string> = { 0: 'Ethene', 1: 'Chloroethene (vinyl chloride)', 2: 'Condensation polymer', 3: 'Addition polymer', 4: 'Natural polymer', 5: '♻ 5', 6: '♻ 6' };
    for (const [i, a] of Object.entries(answers)) await page.getByTestId(`task-poly-${i}`).getByRole('button', { name: a, exact: true }).click();
    const chain = page.getByTestId('task-chain-7');
    await chain.getByRole('textbox').fill('28054');
    await chain.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByTestId('step-status')).toHaveText('✓ Step complete (100%)');
    await page.getByRole('button', { name: 'Next step →' }).click();
    await page.getByRole('button', { name: 'Skip to Quiz →' }).click();
    for (const q of getMission('adv-polymers')!.quiz) {
      await page.getByRole('button', { name: q.answer as string, exact: true }).click();
      await page.getByRole('button', { name: /Next/ }).click();
    }
    await expect(page.getByRole('list', { name: 'Rewards' })).toContainText('Molecules: Polyethylene, Polypropylene');
    await page.goto('/collection');
    await expect(page.getByTestId('category-count-polymer')).toHaveText('7 / 10');
    await expect(page.getByTestId('elements-total')).toHaveText('2 / 118');
  });

  test('biomolecule builder: families and base pairs', async ({ page }) => {
    await page.goto('/mission/adv-biomolecules');
    await page.getByRole('button', { name: /Start Practice/ }).click();
    const step = getMission('adv-biomolecules')!.steps[0]!;
    if (step.interactive !== 'sorter') throw new Error('unexpected');
    for (const it of step.data!.items) await page.getByRole('combobox', { name: it.label }).selectOption(it.category);
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByText('✅ All correct!')).toBeVisible();
  });
});
