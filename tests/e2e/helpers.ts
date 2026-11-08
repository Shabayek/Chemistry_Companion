import { expect, type Page } from '@playwright/test';

export const STORAGE_KEY = 'chemistry-companion-progress';

/** Click through the intro and skip every practice step, arriving at the first quiz question. */
export async function skipToQuiz(page: Page) {
  await page.getByRole('button', { name: /Start (Practice|Quiz)/ }).click();
  const firstOption = page.locator('.quiz-option').first();
  const skip = page.getByRole('button', { name: /Skip step|Skip to Quiz|Go to Quiz|Next step/ }).first();
  // Each click advances at most one step (the app ignores clicks on cards that are animating out).
  await expect(async () => {
    if (await firstOption.isVisible()) return;
    await skip.click({ timeout: 1000 });
    await expect(firstOption).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 20000 });
}

/** Seed saved progress before the app loads (first navigation only). */
export async function seedProgress(page: Page, progress: Record<string, unknown>) {
  await page.addInitScript(([key, value]) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem(key!, value!);
  }, [STORAGE_KEY, JSON.stringify({ state: { progress: { version: 2, ...progress } }, version: 2 })]);
}

export function completed(ids: string[]) {
  return Object.fromEntries(ids.map((id) => [id, { missionId: id, completed: true, stars: 2, bestScore: 40, attempts: 1, lastPlayed: 1, missedQuestionIds: [], rewardsClaimed: true }]));
}
