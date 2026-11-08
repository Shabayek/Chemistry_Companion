import { test, expect } from '@playwright/test';
import { GALLERY } from '../../src/data/media';

test.describe('showcase', () => {
  test('home links open the demo video and the gallery', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '▶ Watch the demo video' }).click();
    await expect(page).toHaveURL(/\/showcase#demo$/);
    await expect(page).toHaveTitle('See it in action · Chemistry Companion');
    await expect(page.getByTestId('demo-video')).toBeInViewport();
    await page.goto('/');
    await page.getByRole('link', { name: /Photo gallery/ }).click();
    await expect(page).toHaveURL(/\/showcase#gallery$/);
    await expect(page.getByRole('heading', { name: /Photo gallery/ })).toBeInViewport();
  });

  test('the demo video loads, has captions, and plays', async ({ page }) => {
    await page.goto('/showcase#demo');
    const video = page.getByTestId('demo-video');
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState), { timeout: 15000 }).toBeGreaterThanOrEqual(1);
    const info = await video.evaluate((v: HTMLVideoElement) => ({ duration: v.duration, width: v.videoWidth, height: v.videoHeight, src: v.currentSrc }));
    expect(info.duration).toBeGreaterThan(60);
    expect(info.duration).toBeLessThan(150);
    expect([info.width, info.height]).toEqual([1280, 720]);
    expect(info.src).toMatch(/demo\.(webm|mp4)$/);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.textTracks[0]?.cues?.length ?? 0), { timeout: 10000 }).toBeGreaterThan(8);
    await video.evaluate((v: HTMLVideoElement) => { v.muted = true; return v.play(); });
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 10000 }).toBeGreaterThan(0.5);
    // Chapters seek the video.
    await page.getByText('Transcript and chapters').click();
    await page.getByRole('list', { name: 'Chapters' }).getByRole('button').nth(3).click();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(10);
  });

  test('every gallery image loads and the lightbox works with the keyboard', async ({ page }) => {
    await page.goto('/showcase#gallery');
    const imgs = page.getByRole('region', { name: /Photo gallery/ }).getByRole('img');
    await expect(imgs).toHaveCount(GALLERY.length);
    for (let i = 0; i < GALLERY.length; i++) {
      await imgs.nth(i).scrollIntoViewIfNeeded();
      await expect.poll(() => imgs.nth(i).evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    const thumbs = page.getByRole('region', { name: /Photo gallery/ }).getByRole('button');
    await thumbs.nth(2).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(`3 / ${GALLERY.length}`);
    await expect.poll(() => dialog.getByRole('img').evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(1000);
    await page.keyboard.press('ArrowRight');
    await expect(dialog).toContainText(GALLERY[3]!.title);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(thumbs.nth(3)).toBeFocused();
  });
});
