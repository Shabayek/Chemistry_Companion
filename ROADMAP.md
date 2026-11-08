# Roadmap

Extension of Chemistry Companion to **118 elements**, **60 molecules** (common compounds, organic molecules,
polymers, biomolecules) and **40 missions** (10 per world, including mini-bosses, final bosses and remediation
"Clinic" missions). Work is delivered in phases; each phase ends with tests, type checks, lint and build passing,
and is committed separately.

Status legend: ✅ done · 🚧 in progress · ⏳ planned · 💡 proposed (needs approval)

| Phase | Title | Status | Commit |
|---|---|---|---|
| 0 | Groundwork | ✅ | `ac88734` |
| 1 | All 118 elements + periodic table | ✅ | `bc86e29` |
| 2 | All 60 molecules, Lab, Collection, explorer | ✅ | `537380d` |
| 3 | Mission engine | ✅ | `a40d501` |
| 4 | New interactives + Beginner/Intermediate content | ✅ | `d6c59e1` |
| 5 | Advanced/Expert content + reward distribution | ✅ | `1eae507` |
| 6 | Performance, mobile and accessibility | ✅ | `ee89431` |
| 7 | Documentation and QA hardening | ✅ | `9c35cd1` |
| 8 | Daily Challenge, kid mode, sound, mistakes review | ✅ | `d043e79` |
| 9 | Demo video, photo gallery, feature summary | ✅ | (this phase's commit) |

The approved plan had six content/engine phases (0–5) and one final "Polish and QA" phase. That final phase was
split in two (6 and 7) without changing its scope. Phase 8 was proposed after Phase 7 and approved; Phase 9
(demo media and the feature summary) was requested together with it.

## Decisions (approved)

- Per world: 7 core missions + 1 mini-boss (timed) + 1 final boss (lives, multi-stage) + 1 Clinic.
- Next world unlocks at **80 %** completion of the current world.
- One-time mission rewards are granted on the **first clear** only; replays pay Atoms only for beating the best score.
- The periodic table keeps its free **Collect** button. Molecules are earned (Lab builder, Mix bench, missions).
- Molecule swaps: SiO₂ → Cu(OH)₂, toluene → methylamine, PMMA → starch, lactic acid → palmitic acid.

## Phase details

### Phase 0 — Groundwork ✅
- Fixed five non-existent dependency versions; lockfile regenerated.
- Extended types: element metadata, molecule ids/categories, mission kinds, boss rules, remediation targets.
- Progress v2 with safe migration of old/corrupt saves; persist middleware fixed.
- Replay rules: sticky completion, max stars/best score, attempt counter, first-clear rewards.
- Data-integrity tests (found and fixed three unanswerable quiz questions).

### Phase 1 — All 118 elements ✅
- Full element data (IUPAC weights, configurations with 20 aufbau exceptions, electronegativity, flags, facts, uses).
- 18-column periodic table with f-block rows, colour modes, search, filters, keyboard navigation, detail card.
- Symbol Match draws from element pools; Playwright tests added.

### Phase 2 — All 60 molecules ✅
- 60 molecules with categories, sub-categories, uses; polymers with monomers and recycling codes.
- Molar mass / composition engine; 19 balanced Mix-bench reactions.
- Lab Molecule Builder (recognises all 60, polymers, isomers, hints, challenges), Mix bench, Collection redesign,
  Molecule explorer; `scripts/e2e-sandbox.sh`.

### Phase 3 — Mission engine ✅
- Typed, data-driven interactives; multi-step graded practice; difficulty-weighted scoring.
- Boss lives, mini-boss timer, lock rules, world progress toward the 80 % unlock.
- Remediation engine (personalised Clinic quizzes; fixed questions are cleared).
- Content for the 27 existing missions; 4 multi-stage final bosses.

### Phase 4 — New interactives + Beginner/Intermediate ✅
- New interactives: sorter, atom counter, polymer builder, buffer lab, electron-configuration builder.
- 5 new missions; Beginner and Intermediate complete (10 each). Reduced-motion support fixed.

### Phase 5 — Advanced/Expert + rewards ✅
- 8 new missions; all four worlds complete (40 missions).
- Every element and molecule is the reward of exactly one mission; unique badges; grouped reward display.

### Phase 6 — Performance, mobile and accessibility ✅
- Route-level code splitting: the 680 kB single bundle became a 294 kB main chunk plus per-page chunks
  (no more > 500 kB warning). Unused `zod` removed.
- Responsive top bar: inline links on wide screens, a disclosure menu (Escape / navigation closes it) on phones;
  `aria-current` on the active link; Settings added to the navigation.
- Accessibility: working text-size setting (root font size), skip link, per-page document titles,
  focus moved to the content after navigation, 404 page, visible focus outlines, underlined in-text links.
- axe (WCAG 2.1 AA) scans of all pages and key mission states in the dark, light and high-contrast themes:
  fixed a solid page background (contrast was unmeasurable over the gradient), light-theme accent contrast,
  readable dimmed/locked tiles, periodic-table cell names matching their visible text (WCAG 2.5.3).
- ARCHITECTURE.md rewritten to match the code.

### Phase 7 — Documentation and QA hardening ✅
- README rewritten (features, content counts, scripts, sandbox e2e, CI, how to add content).
- ARCHITECTURE.md and ROADMAP.md updated.
- `npm run check` (both type checks, lint, tests with coverage, build) and a GitHub Actions workflow
  (check job + Playwright job).
- Coverage thresholds enforced (measured 94.6 % statements / 86.1 % branches / 93.3 % functions / 96.5 % lines).
- Route test fixed (it could pass before lazy pages loaded); new tests for Settings, Profile, Home, TopBar and
  untested chemistry helpers.
- Removed dead code (pre-Phase-3 scoring API, unused helpers, a broken unused `oxidationState`) and unused
  Vite template assets; Profile import field labelled; `engines.node` declared.
- Final regression and flakiness run.

### Phase 8 — Daily Challenge, kid mode, sound, mistakes review ✅
Features that existed in the UI or save format but did nothing now work:
- **Daily Challenge**: one core mission per day (deterministic from the date, from unlocked worlds). Clearing it
  pays a bonus (30 Atoms, +10 per streak day, max 100) once per day, even on a replay, and builds a day streak
  (`dailyChallengeDate` / `streakDays`). Home card with status and streak; banner on the mission; result line.
- **Kid mode** (Age mode setting): 50/50-style quiz hints, +1 life for final bosses, +50 % time for mini-bosses,
  friendlier wording; `kidTone` follows the mode.
- **Sound effects** (setting): synthesized Web Audio cues for right/wrong answers, mission results, collecting
  and the daily bonus; silent when switched off.
- **Mistakes Review** page (`/review`): every missed question across all worlds with the right answer,
  explanation, source mission and a link to the world's Clinic; counter on the home page; link on Profile.
- Locked world cards on the home page are no longer dead links.

### Phase 9 — Demo video, photo gallery, feature summary ✅
- `scripts/capture-media.mjs` (+ `capture-video.mjs`): drives the real app in Chromium to capture 13 gallery
  screenshots (WebP + thumbnails) and a ~90 s captioned walkthrough (CDP screencast → WebM/VP9 and MP4/H.264,
  poster, WebVTT captions).
- **Showcase** page (`/showcase`) with the video (captions on, clickable transcript chapters) and a gallery with an
  accessible lightbox; a **See it in action** card on the home page; links and thumbnails in the README.
- [FEATURES.md](./FEATURES.md): summary of the main features of every phase and how to test each one.
- Found while capturing: the mobile **Menu** button also showed on desktop (custom `.btn` CSS beat Tailwind's
  `md:hidden`). Fixed by moving the app's component styles into `@layer components`; regression test added.

### Phase 9 follow-up — flaky unit tests ✅
- Symptom: `npm run check` / `npx vitest run` occasionally failed with two errors, then passed on a re-run.
- Reproduced only under load (tests pinned to one CPU core shared with three busy processes, coverage on):
  `routes > /periodic-table renders` failed in every loaded run; `/collection` passed by 18 ms. These are the two
  pages rendering the 118-cell periodic table; rendering plus a full-page role query exceeded Testing Library's
  1 s `findBy*` limit (idle: ~0.35 s). Randomness, the real date (Daily Challenge), fake-timer leaks and `act`
  warnings were checked and ruled out.
- Fix: async query limit 5 s, per-test limit 20 s, route tests preload the lazy pages (and now also cover
  `/review` and `/showcase`), `npm run test:stress` to reproduce such conditions, testing notes in ARCHITECTURE.md.

