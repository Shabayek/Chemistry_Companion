# Feature summary and how to test it

This is a tour of what was added in each phase, with a short manual check you can do in the browser and
the automated tests that cover it. See [ROADMAP.md](./ROADMAP.md) for the phase history and
[ARCHITECTURE.md](./ARCHITECTURE.md) for how the code is organised.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

| Check everything | Command |
|---|---|
| Type checks, lint, 300+ unit/component tests with coverage, build | `npm run check` |
| End-to-end suite in a real browser (incl. accessibility scans) | `npm run test:e2e` (or `./scripts/e2e-sandbox.sh` where browser downloads are blocked) |
| One area only | `npx vitest run tests/<file>` / `./scripts/e2e-sandbox.sh tests/e2e/<file>` |
| Timing robustness (slow-machine simulation) | `npm run test:stress` |
| Watch the demo | open **/showcase** (or the "See it in action" card on the home page) |

Tip for manual testing: **Profile → Import** accepts a save as JSON, so you can jump to any state, e.g.
`{"unlockedWorlds":["beginner","intermediate","advanced","expert"]}` unlocks every world.

---

## Content

### 118 elements (Phase 1)
- IUPAC atomic weights (mass numbers in brackets for radioactive elements), ground-state electron
  configurations including the 20 aufbau exceptions, Pauling electronegativity, block, state, radioactive and
  "predicted" flags, a fun fact and uses for every element.
- **Try it:** Periodic Table → click **Og**: "[294]", *Radioactive*, *Properties predicted*, "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶".
- **Tests:** `tests/data-integrity.test.ts` (configurations checked against an independent aufbau
  implementation, electron counts, mass inversions, states, radioactivity), `tests/periodic.test.ts`.

### 60 molecules and 19 reactions (Phase 2)
- 20 common compounds, 16 organic molecules, 10 polymers (as repeat units, with monomers and recycling codes)
  and 14 biomolecules; stable ids (starch and cellulose share a formula).
- 19 balanced Mix-bench reactions, some needing heat, a catalyst or yeast.
- **Try it:** Molecules → search "nucleobase" (4 results) → open Caffeine: 194.19 g/mol with composition bars.
- **Tests:** `tests/data-integrity.test.ts` (reference molar masses, formula/atom agreement, reactions balance),
  `tests/molecules.test.ts`.

### 40 missions (Phases 3–5)
- Every world: 7 core missions, a **timed mini-boss**, a **multi-stage final boss with lives** and a **Clinic**.
- New topics include physical vs chemical change, polymers, biomolecules, buffers and electron configurations.
- Each element and each molecule is the reward of exactly one mission, so clearing all 40 completes both collections.
- **Try it:** any world map shows 10 missions with ⚔️ mini-boss, 👑 boss and 🩺 Clinic badges.
- **Tests:** `tests/data-integrity.test.ts` (world composition, reward coverage, every quiz answer among its
  options, every step's data valid: equations balance, pH targets reachable, cells galvanic…),
  `tests/progress.test.ts` ("clearing every mission" plays the whole campaign through the reward code).

---

## Playing

### Missions: practice, quiz and results (Phase 3)
- Several practice steps per mission; *practice* steps are graded, *guided* steps are exploration; any step can
  be skipped. 24 kinds of interactive exercises, all data-driven.
- Scoring: questions weighted by difficulty + practice points; stars from accuracy; streak and speed bonuses.
- Replays: completion never lost, best score and stars kept; one-time rewards only on the first clear; Atoms only
  for beating your best.
- The attempt is saved as soon as the result appears.
- **Try it:** Beginner → Atom Builder. Build hydrogen (1 proton, 1 electron) → "Step complete", then finish the
  quiz: the result shows the score breakdown and rewards. Play again: "rewards already claimed".
- **Tests:** `tests/missions.test.ts`, `tests/scoring.test.ts`, `tests/mission-flow.test.tsx`,
  `tests/interactives.test.tsx` (every exercise reports the right score), e2e `engine.spec.ts`, `missions.spec.ts`.

### Bosses, timers and locks (Phases 3–4)
- Final bosses: 3 lives; running out ends the attempt. Mini-bosses: quiz countdown; unanswered = wrong.
- Mini-boss opens after 3 core clears; final boss after the mini-boss. Next world at 80 % of the current one.
- **Try it:** Beginner → Mini-Boss: Particle Patrol (after 3 missions) shows the timer; the boss card explains its lock.
- **Tests:** `tests/worlds.test.ts`, `tests/world-ui.test.tsx`, `tests/mission-flow.test.tsx` (fake-timer
  mini-boss, lives), e2e `phase4.spec.ts` (Playwright clock), `engine.spec.ts` (lives, double-click guard).

### Clinics and Mistakes Review (Phases 3, 8)
- A Clinic builds its quiz from the questions you missed in its world, shows where each came from, and removes
  them from your mistakes once you answer correctly. The world map marks it *Recommended*.
- **Mistakes Review** (`/review`) lists every missed question across all worlds with the answer, explanation and
  a Clinic link; the home page shows the count.
- **Try it:** fail Atom Builder on purpose → Home shows "Review mistakes (3)" → open it → "Practise in Atom Clinic".
- **Tests:** `tests/remediation.test.ts`, `tests/phase8.test.ts`, `tests/phase8-ui.test.tsx`, e2e `phase4.spec.ts`,
  `phase8.spec.ts`.

### Daily Challenge (Phase 8)
- One core mission per day (from your unlocked worlds). Clearing it pays 30 Atoms +10 per streak day (max 100),
  once per day, even on a replay; consecutive days build a streak.
- **Try it:** Home → Daily Challenge → play it → the result shows "Daily Challenge complete! … 1-day streak";
  the home card then says "Done for today".
- **Tests:** `tests/phase8.test.ts` (date keys, deterministic pick, streak rules, bonus cap),
  `tests/phase8-ui.test.tsx`, e2e `phase8.spec.ts` (fixed-time clock).

### Kid mode and sound effects (Phase 8)
- Kid mode (Settings → Age mode): a 💡 hint removes a wrong answer, final bosses get an extra life, mini-bosses
  50 % more time, and messages are friendlier.
- Sound effects (Settings): short synthesized cues for answers, results, collecting and the daily bonus.
- **Try it:** Settings → Age mode: Kid → any quiz shows "💡 Hint: remove a wrong answer".
- **Tests:** `tests/phase8.test.ts` (rules, hints, tone, Web Audio with a mocked context),
  `tests/phase8-ui.test.tsx`, e2e `phase8.spec.ts` (hint and sound events).

---

## Exploring

### Periodic table (Phase 1)
- 18 columns with lanthanide/actinide rows; colour by category, block, state or electronegativity/mass trends;
  search (name start, symbol, number); category filters; arrow-key navigation; free **Collect**.
- **Try it:** search "79" + Enter → Gold; Colour by → Electronegativity; Tab into the table and use the arrows.
- **Tests:** `tests/periodic-ui.test.tsx`, e2e `periodic.spec.ts`.

### Lab, Collection and Molecule explorer (Phase 2)
- **Molecule Builder** recognises all 60 molecules however you count the atoms (C₂H₆O = ethanol), polymer repeat
  units ("Polymerise & collect"), isomers, near-miss hints and challenges.
- **Mix bench**: e.g. CuSO₄ + NaOH → Cu(OH)₂ (collectable); H₂O₂ + catalyst; CaCO₃ + heat.
- **Collection**: 118 / 60 totals, per-category progress, locked slots. **Molecules** page: search, filters,
  "Build it in the Lab" / "Make it" links.
- **Try it:** Lab → add 6 C, 10 H, 5 O → starch and cellulose (isomers).
- **Tests:** `tests/lab-ui.test.tsx`, e2e `lab.spec.ts`.

---

## Quality

### Saves (Phase 0)
- Old saves upgrade automatically; corrupt data is repaired; imports of non-objects are rejected.
- **Tests:** `tests/progress.test.ts`, `tests/store.test.ts`, e2e `save.spec.ts`.

### Accessibility, mobile and performance (Phase 6)
- Axe (WCAG 2.1 AA) scans of every page and key mission states in dark, light and high-contrast themes.
- Skip link, per-page titles, focus moved to the content after navigation, keyboard-operable everything,
  text-size setting, reduced motion (setting or OS preference), phone menu, route-level code splitting.
- **Try it:** press Tab on any page → "Skip to content"; Settings → Text size: Large.
- **Tests:** e2e `a11y.spec.ts`, `settings.spec.ts`; `tests/pages-ui.test.tsx`, `tests/titles.test.ts`.

### Tooling (Phases 1, 7)
- `npm run check` gate, CI workflow, coverage thresholds, `scripts/e2e-sandbox.sh` for sandboxes,
  `npm run test:stress` for timing-sensitive tests.

---

## Demo media (Phase 9)
- **Showcase page** (`/showcase`, linked from the home page): an ~90-second captioned demo video (WebM/MP4,
  WebVTT captions, clickable transcript chapters) and a 13-image gallery with a keyboard-friendly lightbox.
- Files live in `public/media/`; regenerate them with `node scripts/capture-media.mjs` (needs Chromium and ffmpeg).
- **Tests:** `tests/showcase.test.tsx` (files exist, captions valid, lightbox focus handling), e2e `showcase.spec.ts`
  (the video decodes and plays in Chromium, captions load, every image loads).
