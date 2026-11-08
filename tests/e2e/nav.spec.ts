import { test, expect } from '@playwright/test';

test('navigate all main routes', async ({ page }) => {
  const routes = ['/', '/world/beginner', '/lab', '/periodic-table', '/molecules', '/collection', '/profile', '/settings'];
  for (const r of routes) {
    await page.goto(r);
    await expect(page.locator('main')).toBeVisible();
  }
});