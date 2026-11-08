import { test, expect } from '@playwright/test';

test('the reduced-motion setting toggles the reduce-motion class', async ({ page }) => {
  await page.goto('/settings');
  const html = page.locator('html');
  await expect(html).not.toHaveClass(/reduce-motion/);
  await page.getByRole('checkbox', { name: 'Reduced motion' }).check();
  await expect(html).toHaveClass(/reduce-motion/);
  await page.reload();
  await expect(html).toHaveClass(/reduce-motion/);
  await page.getByRole('checkbox', { name: 'Reduced motion' }).uncheck();
  await expect(html).not.toHaveClass(/reduce-motion/);
});

test('the operating-system reduced-motion preference is honoured', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/reduce-motion/);
});
