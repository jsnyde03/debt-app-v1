import path from 'path';

import { test, type Page } from '@playwright/test';

import { day, scenario } from '../e2e/helpers/seed';

/**
 * P6.8.1 — THE FINISH-SWEEP MATRIX. Every surface × theme × size class, plus the states nothing renders.
 *
 * ⭐ **This is built BEFORE any audit agent runs, and that ordering is the lesson of the last gate.** The
 * 2026-08-17 audit's own #1 finding was *"the instruments are under-reporting, and they gate everything
 * else"* — 25 of 39 e2e specs seeded a plan with no bills, and the surface inventory tracked 3 formatters
 * where 9 existed. Four P6.8 lenses read these frames. **A surface missing here is a surface four agents
 * are blind to at once.**
 *
 * ⛔ **`audit:surfaces` IS THE WRONG INVENTORY FOR THIS, and reaching for it would have repeated the
 * defect.** It answers *"which money formatter does each route reach"*, counts `_layout.tsx` and
 * `+not-found` as surfaces, and contains **no sheets at all** — while P6.8's charter is *"every screen ·
 * sheet · card · state"*. There are **14 sheets**, and not one has ever been swept in both themes. They
 * are enumerated here by hand, from the tree.
 *
 * ⚠️ **ASSERTS NOTHING** — evidence, like `phase35-themes.shot.ts` and `floor-impact.shot.ts`. Appearance
 * is judged by looking. What it DOES assert is its own completeness: every recipe that fails to reach its
 * subject prints `⛔ UNREACHED`, so the matrix reports its holes instead of quietly having them.
 *
 * ⛔ **WHAT THIS CANNOT CAPTURE, stated so no lens over-claims from it** *(measured, not assumed —
 * `DEBT_3.5_DEVICE_QA_CHECKLIST.md:213`)*: react-native-web has **no OS text scaling**
 * (`PixelRatio.getFontScale()` is always 1), **no VoiceOver**, no haptics and no native gesture handling.
 * So **Dynamic Type is NOT in these frames** and cannot be — V3 gets a static pass plus the CSS
 * approximation below, and the real thing is a P6.14 device row. Likewise the iPad tab **rail** is a
 * native layout: `phase35-themes.shot.ts` measured that the overlay origin is 0 on web at every width, so
 * a wide viewport here is NOT an iPad.
 *
 * `npx playwright test --config apps/rn/playwright.shots.config.ts p6.8-matrix`
 * Frames → `apps/rn/capture-ref/p6.8/<viewport>/<theme>/` (gitignored; regenerate on demand).
 */

const OUT = path.resolve(__dirname, '../../capture-ref/p6.8');
const THEMES = ['light', 'dark'] as const;

/** ⚠️ Widths, not devices. See the header: a wide viewport on web is not an iPad. */
const VIEWPORTS = {
  phone: { width: 402, height: 874 },
  'phone-small': { width: 320, height: 568 }, // the narrowest shipping iPhone width — where truncation starts
  'ipad-portrait': { width: 834, height: 1194 },
  'ipad-landscape': { width: 1194, height: 834 },
  'split-view': { width: 507, height: 1194 }, // iPad 1/2 split — compact width at tall height
} as const;

type ViewportName = keyof typeof VIEWPORTS;

/** Seeds. `themeMode` is what the app reads; every other field shapes a STATE the matrix is here to show. */
function seed(theme: string, over: Record<string, unknown> = {}) {
  const { prefs, ...rest } = over as { prefs?: Record<string, unknown> };
  return scenario({ prefs: { onboardingComplete: true, themeMode: theme, ...(prefs ?? {}) }, ...rest });
}

/** ⛔ The states nothing else in the repo renders. Each one is a design question, not a data question. */
const STATES: Record<string, Record<string, unknown>> = {
  // The shape 25 of 39 e2e specs accidentally used, and the one a brand-new user actually has.
  empty: { debts: [], requiredExpenses: [], goals: [], livingExpenses: [] },
  // One of each — where "a list" and "a single item" are different designs and usually only one exists.
  single: { debts: [{ id: 'd0', name: 'Card', balance: 1200, minimumPayment: 40, apr: 19.99, dueDate: day(7), type: 'debt', recurrence: 'monthly' }], requiredExpenses: [], goals: [] },
  // Enough rows to push every list past its scroll, and past any fixed-height container.
  many: {
    debts: Array.from({ length: 12 }, (_, i) => ({ id: `d${i}`, name: `Creditor ${i + 1}`, balance: 900 + i * 431, minimumPayment: 25 + i * 7, apr: 9 + i, dueDate: day(3 + i), type: 'debt', recurrence: 'monthly' })),
    requiredExpenses: Array.from({ length: 14 }, (_, i) => ({ id: `e${i}`, name: `Bill ${i + 1}`, amount: 40 + i * 23, dueDate: day(2 + i), recurrence: 'monthly', category: 'other' })),
  },
  // ⚠️ Six figures and cents. The hero numbers clamp at `maxFontSizeMultiplier` but nothing clamps WIDTH.
  huge: {
    paycheck: { amount: '18500' },
    debts: [{ id: 'd0', name: 'Mortgage', balance: 847362.55, minimumPayment: 4211.87, apr: 6.875, dueDate: day(9), type: 'debt', recurrence: 'monthly' }],
  },
  // The longest real creditor names. `ListRow` has a note that large type "squeezed 'Chase Sapphire
  // Preferred Card' to a few characters" — this is that case without needing type scaling.
  'long-names': {
    debts: [
      { id: 'd0', name: 'Chase Sapphire Preferred Card — Authorized User', balance: 5400, minimumPayment: 120, apr: 21.24, dueDate: day(5), type: 'debt', recurrence: 'monthly' },
      { id: 'd1', name: 'Navient Federal Consolidation Loan Group B', balance: 22100, minimumPayment: 310, apr: 5.5, dueDate: day(12), type: 'debt', recurrence: 'monthly' },
    ],
    requiredExpenses: [{ id: 'e0', name: 'Homeowners association quarterly assessment', amount: 415, dueDate: day(4), recurrence: 'quarterly', category: 'housing' }],
  },
};

/**
 * ⛔ FAIL FAST. A recipe that cannot reach its subject must cost seconds, not the 180 s test timeout —
 * which does not merely waste time, it KILLS THE WHOLE TEST. Measured: one bad locator cost
 * `living-expense-sheet` and `backup-sheets` their frames entirely, and the log said nothing about them
 * at all. A slow failure is a silent one.
 *
 * ⚠️ Declared HERE, above `SURFACES`, because `SURFACES` now uses it in a `ready` guard — a `const` used
 * before its declaration is a temporal-dead-zone throw at module load, and the whole file would collect
 * zero tests with a stack trace nobody reads as "wrong line order".
 */
const FAST = 8_000;

/** A route worth a frame, and what it needs to be worth one. */
interface Surface {
  name: string;
  goto: string;
  /** Wait for THIS before shooting, or the frame is of a loading state pretending to be a design. */
  ready?: (page: Page) => Promise<unknown>;
  seedOver?: Record<string, unknown>;
  /** Which viewports this surface is shot at. Defaults to all. */
  only?: ViewportName[];
  /** States to shoot in addition to the default seed (phone + both themes only — the cross product bites). */
  states?: string[];
}

const SURFACES: Surface[] = [
  { name: 'today', goto: '/', states: ['empty', 'single', 'many', 'huge', 'long-names'] },
  { name: 'money-debts', goto: '/money', states: ['empty', 'single', 'many', 'huge', 'long-names'] },
  { name: 'progress', goto: '/progress', states: ['empty', 'single', 'many', 'huge'] },
  { name: 'more', goto: '/more' },
  { name: 'history', goto: '/history', states: ['empty'] },
  { name: 'living-expenses', goto: '/living-expenses', states: ['empty'] },
  { name: 'cushion-forecast', goto: '/cushion-forecast' },
  { name: 'paywall', goto: '/paywall', seedOver: { subscriptionPlan: 'free' } },
  {
    // ⛔ THE PLAN MUST BE EMPTY, NOT JUST THE FLAG FALSE — and this took three tries to get right.
    // `runMigrations` → `inferOnboarding` (migrations.ts:112) returns `hasIncome && hasObligation`, so a
    // blob carrying a paycheck AND a debt is promoted to `onboardingComplete: true` **whatever the blob
    // says**. `scenario()` always seeds both. The explicit `false` was being overruled on read, which is
    // why all ten onboarding frames were photographs of Today.
    //
    // ⚡ Two earlier fixes were wrong and one of them was re-shot before being caught: "init scripts
    // accumulate" (false) and "the previous app's 500 ms autosave races the seed" (mine — plausible,
    // measured false by lens O1 in a brand-new context). ⛔ **A re-shoot on a wrong fix is worse than the
    // original bug**, because the frames come back carrying a fix's authority. Measure, then re-shoot.
    name: 'onboarding',
    goto: '/onboarding',
    seedOver: {
      prefs: { onboardingComplete: false },
      paycheck: { amount: '' },
      debts: [],
      requiredExpenses: [],
      goals: [],
      livingExpenses: [],
    },
    // ⚠️ And PROVE it. `ready` existed on this interface and was used by nothing — O1's point: this repo's
    // known defect class is "a destination with no tested door", and a shot that succeeds while
    // photographing the wrong screen is its mirror. A frame that cannot find its subject must now fail.
    ready: (p) => p.getByText(/Take control|Get started|Welcome/i).first().waitFor({ timeout: FAST }),
  },
  { name: 'not-found', goto: '/no-such-route' },
];

/** A sheet, and the recipe that opens it. ⛔ NONE of these has ever been swept in both themes. */
interface Sheet {
  name: string;
  goto: string;
  open: (page: Page) => Promise<unknown>;
  seedOver?: Record<string, unknown>;
}

const SHEETS: Sheet[] = [
  { name: 'add-obligation-chooser', goto: '/money', open: (p) => p.getByTestId('money-add').first().click({ timeout: FAST }) },
  { name: 'debt-sheet-edit', goto: '/money', open: (p) => p.getByText('Card', { exact: true }).first().click({ timeout: FAST }) },
  {
    name: 'debt-sheet-add',
    goto: '/money',
    open: async (p) => {
      await p.getByTestId('money-add').first().click({ timeout: FAST });
      await p.getByTestId('add-choice-debt').click({ timeout: FAST });
    },
  },
  {
    name: 'expense-sheet-add',
    goto: '/money',
    open: async (p) => {
      await p.getByTestId('money-add').first().click({ timeout: FAST });
      await p.getByTestId('add-choice-expense').click({ timeout: FAST });
    },
  },
  {
    name: 'goal-sheet-add',
    goto: '/money',
    open: async (p) => {
      await p.getByTestId('money-add').first().click({ timeout: FAST });
      await p.getByTestId('add-choice-goal').click({ timeout: FAST });
    },
  },
  {
    name: 'expense-sheet-edit',
    goto: '/money',
    open: async (p) => {
      await p.getByText('Expenses', { exact: true }).first().click({ timeout: FAST });
      await p.getByText('Rent', { exact: true }).first().click({ timeout: FAST });
    },
  },
  {
    // ⚠️ "Log a payment" — `LOG_PAYMENT_ENTRY`, not the "Log payment" this recipe first guessed. The
    // matrix's UNREACHED line is what caught it, which is the whole reason the holes are printed rather
    // than swallowed: a guessed string produces a missing frame, and a missing frame is indistinguishable
    // from a surface that does not exist.
    //
    // ⚠️ The row's OTHER entry — the long-press context menu — is iOS-only (`RowContextMenu` is a
    // passthrough elsewhere), so the sheet's own row is the only cross-platform door and the only one
    // reachable here.
    name: 'log-payment',
    goto: '/money',
    open: async (p) => {
      await p.getByText('Card', { exact: true }).first().click({ timeout: FAST });
      // ⚠️ The testID, not the text. The label sits inside the `Pressable`, and clicking the inner `Text`
      // is not the same target — the first two attempts here burned 180 s each proving that.
      await p.getByTestId('debt-log-payment').click({ timeout: FAST });
    },
  },
  { name: 'living-expense-sheet', goto: '/living-expenses', open: (p) => p.getByText('Add', { exact: true }).first().click({ timeout: FAST }) },
  { name: 'backup-sheets', goto: '/more', open: (p) => p.getByText(/Back up|Backup/i).first().click({ timeout: FAST }) },
];

const shot = (page: Page, viewport: string, theme: string, name: string) =>
  page.screenshot({ path: path.join(OUT, viewport, theme, `${name}.png`), fullPage: false });

/**
 * Write the blob, then navigate. Used with ONE TEST PER SURFACE (see below) — the isolation is what
 * makes it reliable, not this function on its own.
 *
 * ⛔ **THE DEFECT THIS EXISTS FOR, AND THE TWO WRONG MECHANISMS ON THE WAY TO IT.** In the first run,
 * **every `onboarding.png` — five widths, both themes — was a photograph of Today.** Unlike the two sheet
 * timeouts it failed *silently*, writing plausible files that four visual lenses then read as evidence.
 * Three independent lenses (V3, V2, M2) caught it; the harness did not.
 *
 * Mechanism 1, proposed and false: *"`seedStore`'s `addInitScript` accumulates across iterations."* It
 * does accumulate — and the last-registered script still wins, so it was never the cause.
 * Mechanism 2, mine, implemented, re-shot, **and the frame was still Today**: *"write localStorage
 * directly instead of via init scripts."*
 * The actual cause: **the previous surface's app is still alive when the next seed is written**, and its
 * 500 ms autosave debounce puts its own store back over the blob. No amount of careful writing survives
 * a live app writing behind you — the app has to be *gone*, which is what per-test isolation gives.
 *
 * ⚡ Two lessons, and the second one cost more than the bug: **an instrument that fails loudly is safer
 * than one that fails accurately most of the time** (the timeouts announced themselves and cost two
 * frames; this said nothing and cost ten). And **a fix that sounds causal is still a hypothesis** — this
 * project has that written down about *agent* mechanisms, and it applies identically to mine.
 */
async function reseed(page: Page, blob: Record<string, unknown>, goto: string) {
  // An origin has to exist before `localStorage` is reachable.
  if (new URL(page.url(), 'http://localhost').pathname === 'blank' || page.url() === 'about:blank') await page.goto('/');
  await page.evaluate(
    (arg) => window.localStorage.setItem(arg.key, arg.blob),
    { key: 'debtPlanner.rnStore', blob: JSON.stringify(blob) },
  );
  await page.goto(goto);
}

/**
 * Layout, fonts and any entry animation have to land before a frame describes a design.
 *
 * ⛔ **700 ms was NOT enough, and lens V1 caught it by measurement rather than by eye.** Every
 * `today.png` — five viewports, both themes — was shot mid entrance-animation, and light and dark landed
 * at *different points in the same fade*: 0.0% card-token pixels against 40–44% on the settled
 * `state-today-*` frames, with the light hero sampling halfway to the ground colour and dark's Progress
 * bars physically shorter on identical data. A theme-parity lens reading those frames is comparing two
 * moments, not two themes.
 *
 * ⚠️ Count-up animations are the other half (`CountUp` on the money heroes): P1 measured light `today.png`
 * mid-count at $577 against dark's settled $1,032, on the same seed.
 */
const settle = (page: Page) => page.waitForTimeout(1_800);

// ── ROUTES × THEME × VIEWPORT ─────────────────────────────────────────────────────────────────────
for (const [vpName, viewport] of Object.entries(VIEWPORTS) as [ViewportName, { width: number; height: number }][]) {
  for (const theme of THEMES) {
    test.describe(`${vpName} · ${theme}`, () => {
      test.use({ viewport });

      // ⛔ ONE TEST PER SURFACE — NOT one test looping over surfaces. Playwright gives each test a fresh
      // page and a fresh origin, and that isolation is the only thing that makes the seed reliable.
      //
      // ⚡ Two wrong mechanisms were proposed before this one, and the second was mine after the first
      // failed — a reminder that a fix which *sounds* causal is still a hypothesis:
      //   1. "`seedStore`/`addInitScript` accumulates across iterations" — plausible, and false.
      //   2. "write localStorage then navigate" — implemented, re-shot, and the frame was STILL Today.
      // The actual cause: the PREVIOUS surface's app is still alive when the next seed is written, and
      // its 500 ms autosave debounce fires and puts its own store back over the blob. No amount of
      // careful writing survives a live app writing behind you; the app has to be gone.
      for (const s of SURFACES) {
        if (s.only && !s.only.includes(vpName)) continue;
        test(`route ${s.name} (${vpName}/${theme})`, async ({ page }) => {
          await reseed(page, seed(theme, s.seedOver), s.goto);
          try {
            if (s.ready) await s.ready(page);
            await settle(page);
            await shot(page, vpName, theme, s.name);
            console.log(`  ✓ ${vpName}/${theme}/${s.name}`);
          } catch (e) {
            // ⛔ The matrix reports its own holes. A silently missing frame is how four lenses go blind
            // to the same surface at once — the exact instrument failure the last gate found.
            console.log(`  ⛔ UNREACHED ${vpName}/${theme}/${s.name} — ${(e as Error).message.split('\n')[0]}`);
          }
        });
      }
    });
  }
}

// ── SHEETS × THEME, phone only. Fourteen exist; none has ever been theme-swept. ───────────────────
for (const theme of THEMES) {
  test.describe(`sheets · ${theme}`, () => {
    test.use({ viewport: VIEWPORTS.phone });

    // One test per sheet — same isolation reason as the routes above, and it also means a sheet whose
    // recipe fails can no longer take its neighbours down with it.
    for (const s of SHEETS) {
      test(`sheet ${s.name} (${theme})`, async ({ page }) => {
        await reseed(page, seed(theme, s.seedOver), s.goto);
        try {
          await page.waitForTimeout(400);
          await s.open(page);
          await settle(page);
          await shot(page, 'phone', theme, `sheet-${s.name}`);
          console.log(`  ✓ sheet ${theme}/${s.name}`);
        } catch (e) {
          console.log(`  ⛔ UNREACHED sheet ${theme}/${s.name} — ${(e as Error).message.split('\n')[0]}`);
        }
      });
    }
  });
}

// ── STATES, phone × both themes. The designs nothing else renders. ────────────────────────────────
for (const theme of THEMES) {
  test.describe(`states · ${theme}`, () => {
    test.use({ viewport: VIEWPORTS.phone });

    for (const s of SURFACES) {
      for (const stateName of s.states ?? []) {
        test(`state ${s.name}/${stateName} (${theme})`, async ({ page }) => {
          await reseed(page, seed(theme, { ...(s.seedOver ?? {}), ...STATES[stateName] }), s.goto);
          try {
            await settle(page);
            await shot(page, 'phone', theme, `state-${s.name}-${stateName}`);
            console.log(`  ✓ state ${theme}/${s.name}/${stateName}`);
          } catch (e) {
            console.log(`  ⛔ UNREACHED state ${theme}/${s.name}/${stateName} — ${(e as Error).message.split('\n')[0]}`);
          }
        });
      }
    }
  });
}

// ── V3's APPROXIMATION. Not Dynamic Type — see the header — but the failure MODE it produces. ─────
//
// ⚠️ Read this before trusting a finding from these frames. iOS scales text per style and the app clamps
// with `maxFontSizeMultiplier` in ~10 places; web ignores both. So this scales text-only via CSS, which
// makes containers hold still while their contents grow — the right failure mode, at the wrong fidelity.
// It therefore **OVER-reports** wherever a clamp exists, and reports **accurately** where none does.
// Every finding from here is a hypothesis for the refutation wave, and the real answer is a P6.14 row.
// ⚠️ SHOT AT phone-small (320) AS WELL AS phone (402). V3 measured that the first pass ran at 402 only —
// so the NARROWEST shipping width, which the spec itself calls "where truncation starts", had zero scaled
// frames. Narrowest × largest is the corner the whole pass is about, and it was the one corner missing.
for (const [vpName, viewport] of [['phone', VIEWPORTS.phone], ['phone-small', VIEWPORTS['phone-small']]] as const) {
for (const theme of THEMES) {
  test.describe(`text-scale · ${vpName} · ${theme}`, () => {
    test.use({ viewport });

    for (const scale of [1.35, 2.0]) {
      test(`text at ${scale}× (${vpName}/${theme})`, async ({ page }) => {
        for (const s of SURFACES) {
          await reseed(page, seed(theme, s.seedOver), s.goto);
          try {
            await settle(page);
            // ⛔ MULTIPLY THE *COMPUTED* SIZE, ELEMENT BY ELEMENT. The first version used a stylesheet
            // rule `font-size: calc(1em * S)`, and lens V3 measured that it inverted the type hierarchy:
            // `1em` resolves against the PARENT, so the rule REPLACES each declared size rather than
            // scaling it — a 40 pt hero rendered at 32 px at "2×" (smaller than at 1×) while 13 pt
            // eyebrows compounded through nesting. The frames could not show the one class this pass
            // exists for. Reading each element's own computed size first is what makes the scale real.
            await page.evaluate((s) => {
              for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
                const px = parseFloat(window.getComputedStyle(el).fontSize);
                if (Number.isFinite(px)) el.style.setProperty('font-size', `${px * s}px`, 'important');
              }
            }, scale);
            await page.waitForTimeout(450);
            await shot(page, vpName, theme, `textscale-${scale}x-${s.name}`);
            console.log(`  ✓ textscale ${scale}× ${vpName}/${theme}/${s.name}`);
          } catch (e) {
            console.log(`  ⛔ UNREACHED textscale ${scale}× ${vpName}/${theme}/${s.name} — ${(e as Error).message.split('\n')[0]}`);
          }
        }
      });
    }
  });
}
}
