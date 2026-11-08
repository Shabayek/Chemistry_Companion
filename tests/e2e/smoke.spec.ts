import { test, expect } from '@playwright/test';
import { skipToQuiz } from './helpers';

test('complete beginner atom builder mission', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('world-beginner').click();
  await page.getByTestId('mission-card-beg-atom-builder').click();
  await skipToQuiz(page);

  // Q1
  await page.locator('.quiz-option:not([disabled])').first().click();
  await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();
  await page.getByRole('button', { name: /Next/i }).click();

  // Q2
  await page.locator('.quiz-option:not([disabled])').first().click();
  await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();
  await page.getByRole('button', { name: /Next/i }).click();

  // Q3
  await page.locator('.quiz-option:not([disabled])').first().click();
  await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();
  await page.getByRole('button', { name: /Next/i }).click();

  await expect(page.getByText(/Mission Complete/i)).toBeVisible({ timeout: 10000 });
});