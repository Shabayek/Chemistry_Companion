/**
 * Records the demo walkthrough with Chromium's screencast (CDP), then encodes it with ffmpeg.
 * Captions and a pointer are drawn by overlays injected into the page (not part of the app);
 * the same captions are written to a WebVTT file so the video is accessible.
 * Called from scripts/capture-media.mjs.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export async function captureVideo({ browser, newPage, BASE, OUT, ROOT, ffmpeg, wait }) {
  const tmp = join(ROOT, 'node_modules', '.tmp', 'video');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });

  const page = await newPage(browser, { width: 1280, height: 720 });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = join(tmp, `f${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: metadata.timestamp });
    try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch { /* stopped */ }
  });

  // ---------------------------------------------------------------- overlays
  const cues = [];
  let t0 = null;
  const now = () => Date.now() / 1000;

  async function ensureOverlay() {
    await page.evaluate(() => {
      if (document.getElementById('demo-caption')) return;
      const style = document.createElement('style');
      style.textContent = `
        #demo-caption { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 9999;
          max-width: 80%; padding: 12px 22px; border-radius: 14px; background: rgba(10,12,28,.88); color: #fff;
          font: 600 22px/1.3 system-ui, sans-serif; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,.45);
          border: 1px solid rgba(124,92,255,.7); pointer-events: none; transition: opacity .25s; }
        #demo-caption:empty { opacity: 0; }
        #demo-cursor { position: fixed; left: 640px; top: 400px; width: 22px; height: 22px; margin: -11px 0 0 -11px;
          border-radius: 50%; background: rgba(255,255,255,.9); border: 3px solid #7c5cff; z-index: 10000;
          pointer-events: none; transition: left .3s ease, top .3s ease, transform .12s; box-shadow: 0 2px 10px rgba(0,0,0,.5); }
        #demo-cursor.tap { transform: scale(.7); }
        #demo-card { position: fixed; inset: 0; z-index: 10001; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 18px; background: radial-gradient(900px 600px at 30% 20%, #1a2350, #0b1020);
          color: #e8ecff; font-family: system-ui, sans-serif; text-align: center; }
        #demo-card h1 { font-size: 64px; margin: 0; background: linear-gradient(135deg, #7c5cff, #00d4ff);
          -webkit-background-clip: text; background-clip: text; color: transparent; }
        #demo-card p { font-size: 28px; margin: 0; color: #a9b1d6; }`;
      document.head.appendChild(style);
      const caption = document.createElement('div');
      caption.id = 'demo-caption';
      document.body.appendChild(caption);
      const cursor = document.createElement('div');
      cursor.id = 'demo-cursor';
      document.body.appendChild(cursor);
    });
  }

  async function caption(text) {
    await ensureOverlay();
    const t = now() - t0;
    if (cues.length && cues[cues.length - 1].end === null) cues[cues.length - 1].end = t;
    if (text) cues.push({ start: t, end: null, text });
    await page.evaluate((value) => { document.getElementById('demo-caption').textContent = value; }, text);
  }

  async function card(title, subtitle, ms) {
    await ensureOverlay();
    await page.evaluate(([h, p]) => {
      const el = document.createElement('div');
      el.id = 'demo-card';
      el.innerHTML = `<h1>⚗️ ${h}</h1><p>${p}</p>`;
      document.body.appendChild(el);
    }, [title, subtitle]);
    const t = now() - t0;
    if (cues.length && cues[cues.length - 1].end === null) cues[cues.length - 1].end = t;
    cues.push({ start: t, end: t + ms / 1000, text: `${title}. ${subtitle.replace(/<[^>]+>/g, '')}` });
    await wait(ms);
    await page.evaluate(() => document.getElementById('demo-card')?.remove());
  }

  async function tap(locator, pause = 300) {
    await ensureOverlay();
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 10000 });
    } catch (e) {
      await page.screenshot({ path: join(tmp, 'failure.png') });
      throw e;
    }
    const box = await locator.boundingBox();
    if (box) {
      await page.evaluate(({ x, y }) => {
        const c = document.getElementById('demo-cursor');
        c.style.left = `${x}px`;
        c.style.top = `${y}px`;
      }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      await wait(320);
      await page.evaluate(() => document.getElementById('demo-cursor').classList.add('tap'));
      await wait(90);
      await page.evaluate(() => document.getElementById('demo-cursor').classList.remove('tap'));
    }
    await locator.click();
    await wait(pause);
  }

  /** Click the same control several times quickly (the pointer moves once). */
  async function tapRepeat(locator, times, gap = 110) {
    await tap(locator, gap);
    for (let i = 1; i < times; i++) { await locator.click(); await wait(gap); }
  }

  /** In-app navigation (no page reload, so no loading flash). */
  async function go(path) {
    await page.evaluate((p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')); }, path);
    await wait(500);
  }

  async function smoothScroll(y, ms = 1200) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), y);
    await wait(ms);
  }

  const nav = (name) => page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name });

  // ------------------------------------------------------------------ script
  await page.goto(`${BASE}/`);
  await page.getByTestId('daily-card').waitFor();
  await ensureOverlay();
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 1280, maxHeight: 720, everyNthFrame: 1 });
  t0 = now();

  await card('Chemistry Companion', '118 elements · 60 molecules · 40 missions', 2600);
  await caption('Four worlds, 40 missions, and a new Daily Challenge every day');
  await wait(2300);

  await tap(nav('Periodic'), 400);
  await caption('All 118 elements in the real periodic-table layout');
  await tap(page.getByRole('button', { name: /^26 Fe Iron/ }), 500);
  await smoothScroll(520, 1300);
  await smoothScroll(0, 700);
  await caption('Colour by category, block, state or periodic trends');
  await page.getByRole('combobox', { name: /Colour by/ }).selectOption('electronegativity');
  await wait(1800);

  await tap(nav('Lab'), 300);
  await caption('Lab: build any of the 60 molecules from atoms');
  await tap(page.getByRole('button', { name: 'Add Carbon', exact: true }), 150);
  await tap(page.getByRole('button', { name: 'Add Oxygen', exact: true }), 700);
  await tap(page.getByRole('button', { name: 'Collect Carbon monoxide' }), 900);

  await tap(page.getByRole('tab', { name: 'Mix Lab' }), 300);
  await caption('Mix bench: 19 balanced reactions to discover');
  await page.getByRole('combobox', { name: 'First substance' }).selectOption('CuSO4');
  await page.getByRole('combobox', { name: /Second substance/ }).selectOption('NaOH');
  await tap(page.getByRole('button', { name: 'Mix!' }), 2000);

  await tap(page.getByRole('link', { name: 'Chemistry Companion home' }), 300);
  await tap(page.getByTestId('world-beginner'), 300);
  await caption('Each world: 7 missions, a timed mini-boss, a final boss and a Clinic');
  await smoothScroll(300, 1800);
  await tap(page.getByTestId('mission-card-beg-boss'), 400);
  await caption('Final bosses have several stages and 3 lives');
  await wait(1400);
  await tap(page.getByRole('button', { name: /Start Practice/ }), 500);
  for (let i = 0; i < 3; i++) await tap(page.getByRole('button', { name: 'Skip step →' }), 350);
  await tap(page.getByRole('button', { name: 'Skip to Quiz →' }), 400);
  await caption('Every answer is explained; wrong answers cost a life');
  await tap(page.getByRole('button', { name: 'Mass', exact: true }), 1400);
  await tap(page.getByRole('button', { name: /Next/ }), 300);
  await tap(page.getByRole('button', { name: 'A molecule/compound', exact: true }), 1300);

  await go('/mission/exp-orbitals');
  await caption('Expert: build electron configurations, including the exceptions');
  await tap(page.getByRole('button', { name: /Start Practice/ }), 400);
  await tap(page.getByRole('button', { name: 'Skip step →' }), 400);
  await tap(page.getByRole('button', { name: 'Fill [Ar] core' }), 200);
  await tapRepeat(page.getByRole('button', { name: 'Add electron to 4s' }), 2);
  await tapRepeat(page.getByRole('button', { name: 'Add electron to 3d' }), 4);
  await tap(page.getByRole('button', { name: 'Check' }), 1800);
  await tap(page.getByRole('button', { name: 'Remove electron from 4s' }), 150);
  await tap(page.getByRole('button', { name: 'Add electron to 3d' }), 200);
  await tap(page.getByRole('button', { name: 'Check' }), 1500);

  await go('/');
  await caption("Today's Daily Challenge: a bonus that grows with your streak");
  await wait(900);
  await tap(page.getByRole('link', { name: "Play today's challenge" }), 900);
  await tap(page.getByRole('button', { name: /Start Practice/ }), 300);
  for (;;) {
    const skip = page.getByRole('button', { name: /Skip step|Skip to Quiz/ });
    if (!(await skip.count())) break;
    await tap(skip, 350);
  }
  await caption('Clear a mission for stars, Atoms, elements and molecules');
  for (const answer of ['Salt + water', 'Oxidation']) {
    await tap(page.getByRole('button', { name: answer, exact: true }), 500);
    await tap(page.getByRole('button', { name: /Next/ }), 400);
  }
  await wait(2300);

  await tap(page.getByRole('button', { name: /Finish & Return/ }), 300);
  await tap(nav('Collection'), 300);
  await caption('Collect all 118 elements and 60 molecules');
  await smoothScroll(700, 1500);
  await smoothScroll(1500, 1500);

  await go('/review');
  await caption('Mistakes Review and Clinics turn errors into practice');
  await wait(2200);
  await caption('');
  await card('Chemistry Companion', 'Play, experiment and master chemistry', 2600);

  await cdp.send('Page.stopScreencast');
  const end = now() - t0;
  if (cues.length && cues[cues.length - 1].end === null) cues[cues.length - 1].end = end;
  await page.context().close();

  // ---------------------------------------------------------------- encode
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const next = frames[i + 1]?.t ?? frames[i].t + 0.5;
    lines.push(`file '${frames[i].file}'`, `duration ${Math.max(0.001, next - frames[i].t).toFixed(3)}`);
  }
  lines.push(`file '${frames[frames.length - 1].file}'`);
  const list = join(tmp, 'frames.txt');
  writeFileSync(list, lines.join('\n'));
  const vf = 'fps=25,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p';
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-vf', vf, '-c:v', 'libvpx-vp9', '-crf', '40', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '5', join(OUT, 'demo.webm')]);
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-vf', vf, '-c:v', 'libx264', '-crf', '30', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(OUT, 'demo.mp4')]);
  ffmpeg(['-ss', '1.5', '-i', join(OUT, 'demo.mp4'), '-frames:v', '1', '-quality', '80', join(OUT, 'demo-poster.webp')]);

  const fmt = (s) => {
    const ms = Math.round(s * 1000);
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    return `${h}:${m}:${sec}.${String(ms % 1000).padStart(3, '0')}`;
  };
  const vtt = ['WEBVTT', '', ...cues.filter((c) => c.text).flatMap((c, i) => [String(i + 1), `${fmt(c.start)} --> ${fmt(c.end)}`, c.text, ''])];
  writeFileSync(join(OUT, 'demo.vtt'), vtt.join('\n'));
  console.log(`  video: ${frames.length} frames, ${end.toFixed(1)} s, ${cues.length} captions`);
}
