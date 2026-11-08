#!/usr/bin/env node
/**
 * Regenerates the demo media shown on the Showcase page (/showcase):
 *   public/media/gallery/*.webp (+ thumbnails)   screenshots of key screens
 *   public/media/demo.webm, demo.mp4, demo-poster.webp, demo.vtt   a captioned walkthrough video
 *
 * Requirements: a built-in or sandbox Chromium (PLAYWRIGHT_CHROMIUM_EXECUTABLE or /tmp/chromium, see
 * scripts/e2e-sandbox.sh) and ffmpeg on PATH. The script starts its own Vite dev server.
 *
 *   node scripts/capture-media.mjs            # gallery + video
 *   node scripts/capture-media.mjs gallery    # screenshots only
 *   node scripts/capture-media.mjs video      # video only
 */
import { chromium } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'media');
const PORT = 5199;
const BASE = `http://localhost:${PORT}`;
const KEY = 'chemistry-companion-progress';
const what = process.argv[2] ?? 'all';

// ---------------------------------------------------------------------------
// Seed data: a player part-way through the game
// ---------------------------------------------------------------------------

const done = (id, stars = 3) => ({ missionId: id, completed: true, stars, bestScore: 90, attempts: 1, lastPlayed: 1, missedQuestionIds: [], rewardsClaimed: true });
const SEED = {
  version: 2,
  playerName: 'Marie',
  currency: 1240,
  unlockedWorlds: ['beginner', 'intermediate', 'advanced', 'expert'],
  missions: {
    'beg-atom-builder': done('beg-atom-builder'),
    'beg-symbol-match': done('beg-symbol-match', 2),
    'beg-state-sorter': done('beg-state-sorter'),
    'beg-molecule-maker': done('beg-molecule-maker', 2),
    'beg-counting': done('beg-counting'),
    'beg-elements-around': done('beg-elements-around', 1),
    'beg-physical-chemical': done('beg-physical-chemical'),
    'beg-miniboss': done('beg-miniboss', 2),
    'int-bond-builder': { ...done('int-bond-builder', 1), missedQuestionIds: ['i4'] },
    'int-periodic-explorer': { missionId: 'int-periodic-explorer', completed: false, stars: 0, bestScore: 20, attempts: 1, lastPlayed: 1, missedQuestionIds: ['i2', 'i3'], rewardsClaimed: false },
  },
  collection: {
    elements: ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'Na', 'K', 'Au', 'Ag', 'Pb', 'Sn', 'Hg', 'Br', 'Ne', 'Ar', 'S', 'P', 'Ca', 'Fe', 'Cu', 'Zn', 'I', 'Mg', 'Al', 'F', 'Cl'],
    molecules: ['hydrogen-gas', 'oxygen-gas', 'nitrogen-gas', 'water', 'carbon-dioxide', 'methane', 'ammonia', 'calcium-carbonate', 'iron-iii-oxide', 'magnesium-oxide', 'hydrogen-peroxide', 'glucose', 'polyethylene', 'caffeine'],
    badges: ['particle-patrol', 'atom-master'],
    avatarItems: [],
  },
  settings: { audio: false, textSize: 'md', reducedMotion: false, kidTone: false },
  theme: 'dark',
  streakDays: 3,
  dailyChallengeDate: '2026-05-11', // yesterday relative to the fixed capture date: a live 3-day streak
};

async function newPage(browser, { width = 1280, height = 800, seed = SEED, reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion });
  await context.addInitScript(([key, value]) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem(key, value);
    }
  }, [KEY, JSON.stringify({ state: { progress: seed }, version: 2 })]);
  // Shift the calendar to a fixed day (stable Daily Challenge and streak text). Only Date moves; timers,
  // animation frames and performance.now() are untouched (Playwright's fake clock interferes with the
  // screencast and with framer-motion).
  await context.addInitScript((target) => {
    const offset = target - Date.now();
    const RealDate = Date;
    class ShiftedDate extends RealDate {
      constructor(...args) { if (args.length === 0) super(RealDate.now() + offset); else super(...args); }
      static now() { return RealDate.now() + offset; }
    }
    globalThis.Date = ShiftedDate;
  }, new Date(2026, 4, 12, 10).getTime());
  const page = await context.newPage();
  return page;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

/** Each shot: file name, setup function. Titles/captions live in src/data/media.ts. */
const SHOTS = [
  ['home', async (p) => { await p.goto(`${BASE}/`); await p.getByTestId('daily-card').waitFor(); }],
  ['world-map', async (p) => { await p.goto(`${BASE}/world/beginner`); await p.getByTestId('world-progress').waitFor(); }],
  ['periodic-table', async (p) => {
    await p.goto(`${BASE}/periodic-table`);
    await p.getByRole('button', { name: /^26 Fe Iron/ }).click();
  }],
  ['periodic-trends', async (p) => {
    await p.goto(`${BASE}/periodic-table`);
    await p.getByRole('combobox', { name: /Colour by/ }).selectOption('electronegativity');
  }],
  ['lab-builder', async (p) => {
    await p.goto(`${BASE}/lab`);
    for (const [el, n] of [['Carbon', 6], ['Hydrogen', 10], ['Oxygen', 5]]) for (let i = 0; i < n; i++) await p.getByRole('button', { name: `Add ${el}`, exact: true }).click();
  }],
  ['mix-bench', async (p) => {
    await p.goto(`${BASE}/lab?tab=mix&mix=CuSO4,NaOH`);
    await p.getByRole('button', { name: 'Mix!' }).click();
  }],
  ['boss-quiz', async (p) => {
    await p.goto(`${BASE}/mission/beg-boss`);
    await p.getByRole('button', { name: /Start Practice/ }).click();
    for (let i = 0; i < 3; i++) { await p.getByRole('button', { name: 'Skip step →' }).click(); await wait(400); }
    await p.getByRole('button', { name: 'Skip to Quiz →' }).click();
    await wait(500);
    await p.getByRole('button', { name: 'Mass', exact: true }).click();
  }],
  ['orbitals', async (p) => {
    await p.goto(`${BASE}/mission/exp-orbitals`);
    await p.getByRole('button', { name: /Start Practice/ }).click();
    await p.getByRole('button', { name: 'Skip step →' }).click();
    await wait(500);
    await p.getByRole('button', { name: 'Fill [Ar] core' }).click();
    for (let i = 0; i < 2; i++) await p.getByRole('button', { name: 'Add electron to 4s' }).click();
    for (let i = 0; i < 4; i++) await p.getByRole('button', { name: 'Add electron to 3d' }).click();
    await p.getByRole('button', { name: 'Check' }).click();
  }],
  ['polymers', async (p) => {
    await p.goto(`${BASE}/mission/adv-polymers`);
    await p.getByRole('button', { name: /Start Practice/ }).click();
    await p.getByRole('slider', { name: /Repeat units/ }).fill('5');
  }],
  ['collection', async (p) => { await p.goto(`${BASE}/collection`); await p.getByTestId('molecules-total').waitFor(); }],
  ['molecules', async (p) => {
    await p.goto(`${BASE}/molecules`);
    await p.getByRole('button', { name: /^Caffeine/ }).click();
    await p.getByRole('article').scrollIntoViewIfNeeded();
  }],
  ['review', async (p) => { await p.goto(`${BASE}/review`); await p.getByRole('heading', { name: 'Mistakes Review' }).waitFor(); }],
];

async function captureGallery(browser) {
  const dir = join(OUT, 'gallery');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const tmp = join(ROOT, 'node_modules', '.tmp', 'gallery');
  mkdirSync(tmp, { recursive: true });
  for (const [name, setup] of SHOTS) {
    const page = await newPage(browser, { reducedMotion: 'reduce' });
    await setup(page);
    await wait(600);
    const png = join(tmp, `${name}.png`);
    await page.screenshot({ path: png });
    await page.context().close();
    ffmpeg(['-i', png, '-quality', '82', join(dir, `${name}.webp`)]);
    ffmpeg(['-i', png, '-vf', 'scale=480:-1', '-quality', '75', join(dir, `${name}-thumb.webp`)]);
    console.log(`  gallery: ${name}`);
  }
  // Mobile shot.
  const page = await newPage(browser, { width: 390, height: 844, reducedMotion: 'reduce' });
  await page.goto(`${BASE}/world/beginner`);
  await page.getByRole('button', { name: /Menu/ }).click();
  await wait(400);
  const png = join(tmp, 'mobile.png');
  await page.screenshot({ path: png });
  await page.context().close();
  ffmpeg(['-i', png, '-quality', '82', join(dir, 'mobile.webp')]);
  ffmpeg(['-i', png, '-vf', 'scale=220:-1', '-quality', '75', join(dir, 'mobile-thumb.webp')]);
  console.log('  gallery: mobile');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
}

function chromiumPath() {
  const candidates = [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, '/tmp/chromium'].filter(Boolean);
  return candidates.find((p) => existsSync(p));
}

async function startServer() {
  const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return server;
    } catch { /* not up yet */ }
    await wait(500);
  }
  server.kill();
  throw new Error('Vite dev server did not start');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const server = await startServer();
const executablePath = chromiumPath();
const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] });
try {
  mkdirSync(OUT, { recursive: true });
  if (what === 'all' || what === 'gallery') await captureGallery(browser);
  if (what === 'all' || what === 'video') {
    const { captureVideo } = await import('./capture-video.mjs');
    await captureVideo({ browser, newPage, BASE, OUT, ROOT, ffmpeg, wait });
  }
} finally {
  await browser.close();
  server.kill();
}
console.log('Done.');
