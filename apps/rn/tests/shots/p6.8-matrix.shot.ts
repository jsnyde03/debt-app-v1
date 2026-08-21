import path from 'path';

import { test, type Page } from '@playwright/test';

import { day, scenario, seedStore } from '../e2e/helpers/seed';

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
  { name: 'onboarding', goto: '/onboarding', seedOver: { prefs: { onboardingComplete: false } } },
  { name: 'not-found', goto: '/no-such-route' },
];

/**
 * ⛔ FAIL FAST. A recipe that cannot reach its subject must cost seconds, not the 180 s test timeout —
 * which does not merely waste time, it KILLS THE WHOLE TEST and takes every sheet after it down too.
 * Measured: one bad locator cost `living-expense-sheet` and `backup-sheets` their frames entirely, and
 * the log said nothing about them at all. A slow failure is a silent one.
 */
const FAST = 8_000;

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

/** Layout, fonts and any entry animation have to land before a frame describes a design. */
const settle = (page: Page) => page.waitForTimeout(700);

// ── ROUTES × THEME × VIEWPORT ─────────────────────────────────────────────────────────────────────
for (const [vpName, viewport] of Object.entries(VIEWPORTS) as [ViewportName, { width: number; height: number }][]) {
  for (const theme of THEMES) {
    test.describe(`${vpName} · ${theme}`, () => {
      test.use({ viewport });

      test(`routes (${vpName}/${theme})`, async ({ page }) => {
        for (const s of SURFACES) {
          if (s.only && !s.only.includes(vpName)) continue;
          await seedStore(page, seed(theme, s.seedOver));
          await page.goto(s.goto);
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
        }
      });
    });
  }
}

// ── SHEETS × THEME, phone only. Fourteen exist; none has ever been theme-swept. ───────────────────
for (const theme of THEMES) {
  test.describe(`sheets · ${theme}`, () => {
    test.use({ viewport: VIEWPORTS.phone });

    test(`sheets (${theme})`, async ({ page }) => {
      for (const s of SHEETS) {
        await seedStore(page, seed(theme, s.seedOver));
        await page.goto(s.goto);
        try {
          await page.waitForTimeout(400);
          await s.open(page);
          await settle(page);
          await shot(page, 'phone', theme, `sheet-${s.name}`);
          console.log(`  ✓ sheet ${theme}/${s.name}`);
        } catch (e) {
          console.log(`  ⛔ UNREACHED sheet ${theme}/${s.name} — ${(e as Error).message.split('\n')[0]}`);
        }
      }
    });
  });
}

// ── STATES, phone × both themes. The designs nothing else renders. ────────────────────────────────
for (const theme of THEMES) {
  test.describe(`states · ${theme}`, () => {
    test.use({ viewport: VIEWPORTS.phone });

    test(`states (${theme})`, async ({ page }) => {
      for (const s of SURFACES) {
        for (const stateName of s.states ?? []) {
          await seedStore(page, seed(theme, { ...(s.seedOver ?? {}), ...STATES[stateName] }));
          await page.goto(s.goto);
          try {
            await settle(page);
            await shot(page, 'phone', theme, `state-${s.name}-${stateName}`);
            console.log(`  ✓ state ${theme}/${s.name}/${stateName}`);
          } catch (e) {
            console.log(`  ⛔ UNREACHED state ${theme}/${s.name}/${stateName} — ${(e as Error).message.split('\n')[0]}`);
          }
        }
      }
    });
  });
}

// ── V3's APPROXIMATION. Not Dynamic Type — see the header — but the failure MODE it produces. ─────
//
// ⚠️ Read this before trusting a finding from these frames. iOS scales text per style and the app clamps
// with `maxFontSizeMultiplier` in ~10 places; web ignores both. So this scales text-only via CSS, which
// makes containers hold still while their contents grow — the right failure mode, at the wrong fidelity.
// It therefore **OVER-reports** wherever a clamp exists, and reports **accurately** where none does.
// Every finding from here is a hypothesis for the refutation wave, and the real answer is a P6.14 row.
for (const theme of THEMES) {
  test.describe(`text-scale · ${theme}`, () => {
    test.use({ viewport: VIEWPORTS.phone });

    for (const scale of [1.35, 2.0]) {
      test(`text at ${scale}× (${theme})`, async ({ page }) => {
        for (const s of SURFACES) {
          await seedStore(page, seed(theme, s.seedOver));
          await page.goto(s.goto);
          try {
            await settle(page);
            await page.addStyleTag({
              // Text nodes only. Scaling the root would be browser zoom, which grows the layout WITH the
              // text and hides the exact overflow this is looking for.
              content: `div[dir="auto"], span, p, button { font-size: calc(1em * ${scale}) !important; line-height: 1.15 !important; }`,
            });
            await page.waitForTimeout(450);
            await shot(page, 'phone', theme, `textscale-${scale}x-${s.name}`);
            console.log(`  ✓ textscale ${scale}× ${theme}/${s.name}`);
          } catch (e) {
            console.log(`  ⛔ UNREACHED textscale ${scale}× ${theme}/${s.name} — ${(e as Error).message.split('\n')[0]}`);
          }
        }
      });
    }
  });
}
