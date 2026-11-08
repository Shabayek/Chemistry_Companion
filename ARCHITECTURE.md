# Architecture

Chemistry Companion is a single-page React 19 + TypeScript app built with Vite. Game logic is plain,
framework-free TypeScript with unit tests; React components render it; Zustand persists player progress in
`localStorage`. See [ROADMAP.md](./ROADMAP.md) for how the current content was built, phase by phase.

```
src/
  types/            Shared models (Element, Molecule, Mission, Progress, …) and typed interactive data
  data/             Content: 118 elements, 60 molecules, 40 missions, 19 bench reactions, E° table
  game/engine/      Pure logic (no React): chemistry, periodic table, molecules, reactions, missions,
                    scoring, progress, remediation, worlds, answers, random
  store/            Zustand store (progress + actions), persisted and migrated
  components/       Reusable UI: TopBar, RouteEffects, Button, periodic/, molecules/, lab/
  features/         Route-level pages: home, world, mission (+ interactives/), lab, periodic,
                    molecules, collection, review, showcase, profile, settings
  lib/              Small UI helpers: page titles, display constants, kid/standard wording (tone.ts),
                    Web Audio sound effects (sound.ts), class-name merge
tests/              Vitest + Testing Library (jsdom) unit/component tests
tests/e2e/          Playwright end-to-end tests (incl. axe accessibility checks)
scripts/            e2e-sandbox.sh: run Playwright with a sandbox-provided Chromium;
                    capture-media.mjs / capture-video.mjs: regenerate the showcase media
public/media/       Demo video (WebM, MP4, poster, WebVTT captions) and gallery screenshots
```

## Layers and dependencies

```
features/* ──► components/* ──► game/engine/* ──► data/* ──► types/*
    │                ▲                ▲
    └──► store/ ─────┴────────────────┘
```

- **types** has no dependencies. `types/interactives.ts` defines the data shape of every interactive
  (`InteractiveDataMap`). `MissionStep` is a discriminated union over `INTERACTIVE_KINDS`, so a mission step's
  `data` is type-checked against its `interactive`, and a compile-time check keeps the kind list and the data
  map in sync.
- **data** is typed content only (plus tiny lookup helpers such as `getElement`, `getMolecule`, `getMission`).
- **game/engine** is pure and deterministic: functions take data/progress and return new values. Randomness
  goes through `random.ts` (seedable), time through explicit `now` arguments.
- **store** wraps the engine's progress functions as actions.
- **components / features** render; they do not contain game rules.

## Content model

| Data | File | Notes |
|---|---|---|
| 118 elements | `data/elements.ts` | IUPAC weights (mass number in brackets for radioactive elements), ground-state configurations incl. 20 aufbau exceptions, Pauling electronegativity, block, radioactive/predicted flags, fun fact, uses. `COMMON_ELEMENT_SYMBOLS` is the beginner pool. |
| 60 molecules | `data/molecules.ts` | 20 common, 16 organic, 10 polymers, 14 biomolecules. Stable slug `id` (formulas are not unique: starch/cellulose). Polymers store one repeat unit, `(C2H4)n`, plus monomers and recycling codes. `LEGACY_MOLECULE_IDS` maps v1 save keys (formulas) to ids. |
| 19 reactions | `data/reactions.ts` | Balanced equations for the Mix bench; a reaction is triggered by its reactants, or one reactant plus a condition (heat, catalyst, yeast). |
| 40 missions | `data/missions.ts` | 4 worlds × (7 core + 1 mini-boss + 1 final boss + 1 Clinic). Each mission: intro, practice steps (typed interactive data), quiz, rewards. Every element and every molecule is the reward of exactly one mission. |
| E° table | `data/electrochem.ts` | Standard reduction potentials for the cell builder. |
| Showcase media | `data/media.ts` | Gallery titles, captions and alt text, and the demo video files in `public/media/` (checked to exist by `tests/showcase.test.tsx`). |

Content integrity is enforced by `tests/data-integrity.test.ts`: element data is cross-checked against an
independent aufbau implementation, molecule formulas against atom lists and reference molar masses, reactions
are balanced, every quiz answer is among its options, every step's data is meaningful (e.g. displayed
equations balance, pH targets are reachable, galvanic cells have positive E°), world composition, Clinic
coverage and reward coverage.

## Engine modules

| Module | Responsibility |
|---|---|
| `chemistry.ts` | Formula parsing (brackets, coefficients), equation balance/auto-balance, parsing written equations, moles, pH, gas laws, ΔG, rate laws, cells, half-life, buffers (Henderson–Hasselbalch). |
| `periodic.ts` | Table layout and keyboard neighbours, aufbau order, configuration parsing/expansion/condensing, search, trend scales. |
| `molecules.ts` | Molar mass, % composition, Hill formulas, matching built atom counts to molecules (incl. polymer repeat units), near-miss hints, search. |
| `reactions.ts` | Mix-bench matching, equation formatting, collectible products. |
| `answers.ts` | Parsing typed numbers (decimal commas, ×10^, units) and tolerance checks. |
| `missions.ts` | Mission state machine: intro → practice steps → quiz → result; step results, streaks, boss lives, mini-boss timer, end reasons; kid-mode rule adjustments and hints. |
| `scoring.ts` | `scoreMission`: quiz points weighted by question difficulty + practice points; stars from accuracy; streak and speed bonuses. |
| `remediation.ts` | Clinic quizzes built from the player's missed questions (topped up with review questions), recommendations, and the cross-world mistakes list. |
| `worlds.ts` | Lock rules (mini-boss after 3 core clears, final boss after the mini-boss) and world progress toward the 80 % unlock. |
| `progress.ts` | Save format, migration/sanitising, collection primitives, and `applyMissionResult` (replay rules, first-clear rewards, world unlock, remediation clean-up). |
| `random.ts` | Seedable PRNG, shuffle, sample. |
| `daily.ts` | Daily Challenge: date keys, deterministic daily pick, streak rules, bonus. |

## Missions at runtime

`features/mission/MissionPage` looks up the mission; `MissionRun` shows a lock screen when
`missionAvailability` says so, otherwise runs attempts (`MissionAttempt`):

1. **Intro**: concept, boss rules (lives / time limit / pass mark), reward preview. Clinics build their
   personalised quiz here (`buildRemediationQuiz`), fixed for the attempt.
2. **Practice**: each step renders `InteractivePanel`, an exhaustive switch over the 24 interactive kinds
   (`interactives/basics`, `reactions`, `advanced`, `builders`). Widgets report `onComplete({ score })`;
   `guided` steps are ungraded, `practice` steps are graded. Shared building blocks: `ChoiceTasks`,
   `NumericTasks` (`interactives/tasks.tsx`).
3. **Quiz**: hearts for lives, a countdown for mini-bosses (interval + `expireTime`), feedback with the
   explanation. Transitions are bound to the step/question they were rendered for, so double clicks during an
   animation cannot skip ahead.
4. **Result**: the attempt is scored (`scoreMission`) and saved (`completeMission` → `applyMissionResult`)
   the moment the result appears; the card shows the breakdown, rewards, unlocks and a Clinic recommendation.

Per attempt, `MissionAttempt` also fixes: kid-mode rules (`adjustForAgeMode`: +1 life, +50 % time; hints via
`applyHint`), and whether the mission is today's Daily Challenge. That flag is decided at the start because
clearing a mission can unlock a world, which changes the daily pick; `completeMission(…, isDailyChallenge)` then
pays the daily bonus (`applyDailyCompletion`). Sound cues (`lib/sound.ts`) play on answers and results when the
Sound effects setting is on; each cue also dispatches a `cc:sound` window event that the e2e tests observe.

## State and persistence

- `store/useGameStore.ts` holds `progress` and actions. It persists **only** `progress` under
  `chemistry-companion-progress` (zustand `persist`, version 2).
- Every load goes through `migrateProgress`, which upgrades v1 saves (formula keys → molecule ids,
  missed-question tracking, rewards already claimed) and repairs malformed data field by field; it never throws.
  `importJson` rejects anything that is not a JSON object.

## UI, routing and accessibility

- React Router with one lazily loaded chunk per route (`App.tsx`); shared data (elements, missions) is split
  into its own chunks by the bundler.
- `RouteEffects` sets the document title per route (`lib/titles.ts`; mission pages set their own) and moves
  focus to `<main>` after navigation. A skip link precedes the top bar.
- `TopBar` uses `NavLink` (`aria-current="page"`), with a disclosure menu below the `md` breakpoint.
- Settings that affect the whole UI: theme (`data-theme` on `<html>`: dark, light, high-contrast), text size
  (root font size, `lib/display.ts`), reduced motion (in-app setting or OS preference: framer-motion
  transitions off, CSS transitions off), age mode (kid mode; `settings.kidTone` follows it), sound effects.
- The periodic table (`components/periodic/PeriodicGrid`) is a group of buttons with a roving tab index and
  arrow-key navigation; each cell's accessible name follows its visible text ("26 Fe Iron").
- Styling: Tailwind CSS v4 utilities plus CSS variables in `index.css`. The app's own element defaults are in
  `@layer base` and its component classes (`.btn`, `.card`, `.glass`, …) in `@layer components`, so utility
  classes such as `md:hidden` can override them (un-layered CSS would always win over Tailwind's layers).
- The Showcase page plays `public/media/demo.*` with a WebVTT captions track; its transcript is parsed from the
  same file (`lib/vtt.ts`). `Lightbox` is a modal dialog with a focus trap, Escape to close and arrow keys.

## Testing

| Command | What it runs |
|---|---|
| `npm test` | Vitest (jsdom): engine, data integrity, components and full mission flows (fake timers for the mini-boss). framer-motion animations are skipped in tests (`tests/setup.ts`). |
| `npm run test:coverage` | The same with V8 coverage; thresholds are enforced in `vite.config.ts` (statements 92, branches 83, functions 90, lines 94). |
| `npm run typecheck` / `typecheck:tests` | `tsc` for the app / for app + tests. |
| `npm run lint` | oxlint (incl. React hooks rules). |
| `npm run test:e2e` | Playwright against the dev server: navigation, periodic table, Lab, missions, bosses, timers (Playwright clock), Clinics, saves, settings, and axe WCAG 2.1 AA scans in all three themes. |
| `npm run test:e2e:sandbox` | Same, using `scripts/e2e-sandbox.sh` to provide Chromium where browser downloads are blocked. |
| `npm run test:stress` | `scripts/test-stress.sh`: the unit suite pinned to one CPU core shared with busy processes, with coverage, several times (`RUNS`, `LOAD`). Catches tests that only fail on slow or busy machines. |
| `npm run check` | `typecheck` + `typecheck:tests` + `lint` + `test:coverage` + `build`: the single pre-merge gate. |

Continuous integration (`.github/workflows/ci.yml`) runs `npm run check` and, in a second job,
`npx playwright install --with-deps chromium && npm run test:e2e`.

### Keeping tests timing-robust

Component tests run in jsdom, where a page with the 118-cell periodic table takes ~0.2 s to render and each
`*ByRole` query on it ~0.1 s (it inspects every element); under load both grow several times. So:

- `tests/setup.ts` sets Testing Library's `asyncUtilTimeout` to 5 s (default 1 s) and `vite.config.ts` sets
  `testTimeout` to 20 s. Both only matter when something is slow; passing tests are not slowed down.
- Tests that render lazily loaded pages preload the page modules first (see `tests/routes.test.tsx`).
- Prefer `findBy*` / `waitFor` over fixed sleeps; fix time with fake timers (`vi.useFakeTimers`,
  `vi.setSystemTime`) rather than depending on the real clock or date.
- Before merging changes to heavy pages, run `npm run test:stress`.

