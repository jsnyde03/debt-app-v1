import path from 'path';

import { expect, test, type Page } from '@playwright/test';

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
 * ⚠️ **ASSERTS NOTHING ABOUT APPEARANCE** — evidence, like `phase35-themes.shot.ts` and
 * `floor-impact.shot.ts`. Appearance is judged by looking. What it DOES assert is its own completeness:
 * every recipe that fails to reach its subject prints `⛔ UNREACHED` **and fails the run softly**.
 *
 * ⛔ **P6.8.9.1 — IT USED TO ONLY PRINT, AND THAT IS HOW FOUR HOLES SURVIVED THE ENTIRE AUDIT.** The
 * `log-payment` and `living-expense-sheet` recipes reached nothing in either theme from the day this file
 * was written. The run said so, every time, in four `⛔` lines — and the number that got carried into the
 * plan, the synthesis and three memory files was **"226 frames"**, which is what landed rather than what
 * was owed. **The true size was 230.** Thirteen lenses and six refuters then read a matrix that had
 * absorbed its own holes into its headline count, with no frame of the Log-a-payment sheet at all.
 *
 * ⚡ The fix is `expect.soft`, not `throw`: one surface failing to reach its subject must not read as "the
 * pass is broken", and soft keeps every frame this run can produce **and still exits 1** — a non-zero exit
 * being the one thing a headline count cannot absorb.
 * ⚠️ **The original rationale here was "the text-scale block loops surfaces INSIDE one test, so a throw
 * costs every later surface its frame." That is no longer true** — P6.8.9.7.11.2 split that block to one
 * test per surface, because the shared page was silently losing seeds. Soft is still right, for the
 * smaller reason above, but the sentence that justified it described a structure that is gone.
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
  // ⚠️ `cycleHistory` was missing and `/history`'s `seedOver` supplies five — see the guard at the state
  // recipe. Every collection any `seedOver` sets has to be named here, and the guard is what says so.
  empty: { debts: [], requiredExpenses: [], goals: [], livingExpenses: [], cycleHistory: [] },
  // One of each — where "a list" and "a single item" are different designs and usually only one exists.
  single: { debts: [{ id: 'd0', name: 'Card', balance: 1200, minimumPayment: 40, apr: 19.99, dueDate: day(7), type: 'debt', recurrence: 'monthly' }], requiredExpenses: [], goals: [] },
  // Enough rows to push every list past its scroll, and past any fixed-height container.
  many: {
    debts: Array.from({ length: 12 }, (_, i) => ({ id: `d${i}`, name: `Creditor ${i + 1}`, balance: 900 + i * 431, minimumPayment: 25 + i * 7, apr: 9 + i, dueDate: day(3 + i), type: 'debt', recurrence: 'monthly' })),
    requiredExpenses: Array.from({ length: 14 }, (_, i) => ({ id: `e${i}`, name: `Bill ${i + 1}`, amount: 40 + i * 23, dueDate: day(2 + i), recurrence: 'monthly', category: 'other' })),
  },
  // ⛔ P6.8.9.1 — THE PORTFOLIO WHERE THE TWO STRATEGIES DISAGREE, and the matrix had no such state.
  // Every seed here is one debt or twelve of a kind, so snowball and avalanche produce the SAME list and
  // C7's whole surface has nothing to say in any of them. Smallest-balance-first and highest-APR-first
  // pick opposite debts here, which is the difference [D59] built the comparison out of.
  divergent: {
    debts: [
      { id: 'd0', name: 'Store card', balance: 800, minimumPayment: 25, apr: 8.0, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      { id: 'd1', name: 'Big card', balance: 6000, minimumPayment: 120, apr: 26.99, dueDate: day(11), type: 'debt', recurrence: 'monthly' },
    ],
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

/**
 * ⛔ **[P6.8.9.7.11.12.11 · D-J2-2] THE SCREEN'S OWN IDENTITY, and it is why `ready` is not optional.**
 *
 * `Screen` renders its `title` with `accessibilityRole="header"`, which RNW emits as `role="heading"` — so
 * every route that uses the scaffold already carries a machine-readable claim about **which screen this
 * is**. That is exactly the assertion the matrix needs: the failure class it cannot otherwise see is *a
 * recipe that reaches a page and photographs the WRONG screen*, and `⛔ UNREACHED` cannot see it because
 * nothing throws.
 *
 * ⚠️ **Not `toBeVisible`, and not a testID.** A testID would be a marker added for the test; the heading is
 * the thing the app already tells a screen reader it is, so the assertion and the product claim are the
 * same claim. ⚠️ It also means **a copy change breaks the matrix loudly** — correct for an identity check,
 * and a one-line fix when it happens.
 */
const heading = (name: string | RegExp) => (p: Page) => p.getByRole('heading', { name }).first().waitFor({ timeout: FAST });

/** A route worth a frame, and what it needs to be worth one. */
interface Surface {
  name: string;
  goto: string;
  /**
   * ⛔ **REQUIRED — this is the gate, and the type is what enforces it.** [P6.8.9.7.11.12.11 · D-J2-2] It
   * was optional and **one** of the ten surfaces set it, while the prose below the shooting blocks claimed
   * *"every surface now carries a `ready` assertion."* A new surface could be added with no way to tell a
   * correct frame from a photograph of Today, and nothing would say so.
   *
   * ⚠️ Playwright compiles this file, so an entry without one fails the run rather than merely linting —
   * which matters here because `apps/rn/tsconfig.json` **excludes `tests/`** from `typecheck:rn`.
   */
  ready: (page: Page) => Promise<unknown>;
  seedOver?: Record<string, unknown>;
  /** Which viewports this surface is shot at. Defaults to all. */
  only?: ViewportName[];
  /** States to shoot in addition to the default seed (phone + both themes only — the cross product bites). */
  states?: string[];
}

const SURFACES: Surface[] = [
  // ⚠️ Today's header is the GREETING, which is time-dependent — so the identity is the greeting's shape,
  // not one of its three values. A literal would make the matrix pass or fail by the clock.
  { name: 'today', goto: '/', ready: heading(/^Good (morning|afternoon|evening)/), states: ['empty', 'single', 'many', 'huge', 'long-names'] },
  { name: 'money-debts', goto: '/money', ready: heading('Money'), states: ['empty', 'single', 'many', 'huge', 'long-names'] },
  { name: 'progress', goto: '/progress', ready: heading('Progress'), states: ['empty', 'single', 'many', 'huge', 'divergent'] },
  // ⚠️ The HEADING named "More", not the ••• button of the same name that Today and Money render — the
  // role is what separates them.
  { name: 'more', goto: '/more', ready: heading('More') },
  {
    /**
     * ⛔ **[P6.8.9.7.7] THE POPULATED PAY CYCLE HISTORY HAD NEVER BEEN PHOTOGRAPHED** — the same defect
     * `/living-expenses` had at .9.1: `scenario()` seeds no `cycleHistory`, so this route's ten default
     * frames AND its two `empty` state frames were the same empty screen. Twelve pictures of one design,
     * and the anchor figure, the per-cycle rows and the debt-delta arrows appeared in none of them.
     *
     * ⚠️ It was deferred at .9.1 on the grounds that its rows "come through `selectHistoryRows` off cycle
     * records, so it needs a real fixture rather than a one-liner". **That was overcautious** —
     * `cycleHistory` is a plain array of `PayCycleSnapshot`, and the selector reads three fields off it.
     * ⚡ A deferral is a claim about cost, and this one was never measured.
     *
     * Balances fall and payments land, so `debtDelta` is negative across the run — which is what makes the
     * summary's "paid down across N cycles" line and the row arrows render at all.
     */
    name: 'history',
    goto: '/history',
    ready: heading('Pay cycle history'),
    seedOver: {
      cycleHistory: Array.from({ length: 5 }, (_, i) => ({
        cycleEndDate: day(-120 + i * 30),
        totalDebtBalance: 5000 - i * 640,
        totalPaidThisCycle: 640,
        completedRecommendedActions: [],
        payoffStrategy: 'snowball',
      })),
    },
    states: ['empty'],
  },
  // ⛔ P6.8.9.1 — THE POPULATED DESIGN HAD NEVER BEEN PHOTOGRAPHED. `scenario()` seeds no
  // `livingExpenses`, so this route's ten default frames AND its two `empty` state frames were the same
  // empty screen — twelve pictures of one design, and the summary card, the ledger rows and the `AddRow`
  // appeared in none of them. ⚠️ `states: ['empty']` still pins the empty branch explicitly, so nothing
  // is lost; what is gained is the branch four lenses were blind to.
  //
  // ⛔ **THIS COMMENT WAS FALSE, AND SO WAS ITS REASON.** It said `/history` had the same defect, was NOT
  // fixed here, and needed "a real fixture and not a one-liner" because rows come through
  // `selectHistoryRows` off cycle records. `cycleHistory` is a plain array, the selector reads three
  // fields, and `/history`'s `seedOver` sits fifteen lines above this — it WAS fixed, in the same change
  // that wrote the sentence saying it was not. ⚡ **A deferral is a claim about cost, and that one was
  // never measured.** (P6.8.9.7.10 · A-7.)
  {
    name: 'living-expenses',
    goto: '/living-expenses',
    ready: heading('Everyday spending'),
    seedOver: {
      livingExpenses: [
        { id: 'l0', name: 'Groceries', amount: 320, enabled: true },
        { id: 'l1', name: 'Gas', amount: 90, enabled: true },
        { id: 'l2', name: 'Fun money', amount: 60, enabled: false },
      ],
    },
    states: ['empty'],
  },
  { name: 'cushion-forecast', goto: '/cushion-forecast', ready: heading('Your cushion forecast') },
  { name: 'paywall', goto: '/paywall', seedOver: { subscriptionPlan: 'free' }, ready: heading('Premium') },
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
  // ⚠️ The one surface with no `Screen` scaffold and so no heading — `+not-found.tsx` is a bare `View`.
  // Its own sentence is the identity, matched loosely because the apostrophe in it is a curly one
  // (`lint:apostrophes` requires that, and a straight one here would silently never match).
  { name: 'not-found', goto: '/no-such-route', ready: (p) => p.getByText(/This screen doesn.t exist/).first().waitFor({ timeout: FAST }) },
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
  // ⛔ P6.8.9.1 — THIS SCREEN HAS TWO DOORS AND THIS RECIPE NAMED NEITHER. It looked for `Add` (exact),
  // which matches nothing on either branch. ⚠️ Two wrong fixes on the way here, and the second is the
  // instructive one: `Add spending item` is a REAL label (`living-expenses.tsx:80`) and still matched
  // nothing, because `scenario()` seeds NO `livingExpenses` at all — so this route only ever renders its
  // EMPTY branch, whose CTA reads `Add your first item` (`living-expenses.tsx:49`).
  // ⚡ A correct string for the branch that never renders is indistinguishable from a wrong string.
  { name: 'living-expense-sheet', goto: '/living-expenses', open: (p) => p.getByText(/Add spending item|Add your first item/).first().click({ timeout: FAST }) },
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
 * ⚡ **An instrument that fails LOUDLY is safer than one that fails accurately most of the time.** The
 * sheet timeouts announced themselves and cost two frames; this failed silently and cost ten. That is
 * why every surface carries a `ready` assertion.
 *
 * ⛔ **AND FOR A MONTH THAT SENTENCE WAS FALSE.** [P6.8.9.7.11.12.11 · D-J2-2] `ready` was **optional** and
 * exactly ONE of the ten surfaces set it, while this paragraph told every later author the class was
 * closed — *load-bearing prose*, which is the whole reason a wrong sentence here rates `major`. It was
 * also consulted in only one of the two blocks that shoot a `Surface`, so **eight
 * `textscale-*x-onboarding.png` frames were taken with the guard off**, on the one route documented to
 * have its seed overruled on read.
 *
 * ⚠️ **The sentence is now true BY CONSTRUCTION, not by diligence:** `ready` is a required field, so a
 * surface added without one does not compile, and both `SURFACES` loops call it. ⚠️ The other two
 * shooting blocks (`SHEETS`, `EXPANDED`) never took a `ready` and never should — they carry an `open`
 * recipe whose own `FAST` timeout throws, which is the same guarantee by a different name. **The finding
 * counted four blocks as un-guarded; two of them do not shoot a `Surface` at all.**
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
/**
 * ⛔ **THE 1,800 ms WAS A GUESS AT A QUANTITY THAT MOVES, AND UNDER LOAD IT LOST.** P6.8.9.7.5.
 *
 * `useSkiaReady` opens on the CanvasKit promise; `WithSkiaWeb` awaits that **plus** `getComponent()`'s own
 * chunk, a Suspense re-render and a first paint. So the labels always win, and the window between them is
 * the photograph: a `ChartSkeleton` — four faint hairlines — under a full set of correctly-positioned axis
 * labels, waypoint bead and end pill. **It looks like a finished chart with no curve.**
 *
 * Measured on the real export at this shutter: **serially 0/8 blank; with four browsers competing on a
 * 4-core box, 10/10 blank on BOTH a 2-debt and a 12-debt portfolio.** Two workers is the matrix's default.
 * ⚡ **A single serial pass is not a control — it is one sample of a race**, and reading one as proof is
 * how the timing hypothesis was wrongly ruled out in the first place.
 *
 * ⚠️ **ORDER IS LOAD-BEARING: the skeleton check runs AFTER the timer, never instead of it.**
 * `toHaveCount(0)` is true of a page that never rendered — this repo has two specs that stayed green with a
 * defect planted for exactly that reason. The timer (and each surface's own `ready`) establishes that
 * something is on screen; this establishes that no chart on it is still loading.
 *
 * ⚠️ Waiting on `chart-skeleton` rather than on `canvas` is deliberate: a canvas wait needs a LIST of which
 * surfaces have charts, and enumerated lists have undercounted five consecutive times here. "No chart is
 * still loading" is a property of every surface — a chartless one satisfies it instantly.
 */
const settle = async (page: Page) => {
  await page.waitForTimeout(1_800);
  await expect(page.getByTestId('chart-skeleton')).toHaveCount(0, { timeout: 15_000 });
};

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
            expect.soft(`${vpName}/${theme}/${s.name}`, 'route recipe reached nothing').toBeNull();
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
        // ⛔ P6.8.9.1 — `coachMarksSeen`, and it is the reason `log-payment` had NO FRAME IN EITHER THEME
        // since the matrix was built. The `payoff-schedule` mark renders INSIDE the debt sheet's footer,
        // in flow — look at `sheet-debt-sheet-edit.png` from any earlier run and it is sitting exactly
        // where the "Log a payment" row belongs, having displaced it.
        //
        // ⚠️ The mark does NOT intercept: `coach-marks.spec.ts:89` asserts "the marked control stays live
        // — a hint is not a modal", and line 33 names this same flow-layout artifact. So the first guess
        // here (pointer interception) was wrong, and the spec had already written down why.
        //
        // ⚠️ Nothing is lost by suppressing it: the mark carries an assertion-bearing e2e spec AND pinned
        // frames at `capture-ref/phase35/<theme>/coach-payoff-schedule.png` — strictly better coverage
        // than a frame in an evidence set that asserts nothing.
        const over = (s.seedOver ?? {}) as { prefs?: Record<string, unknown> };
        await reseed(
          page,
          seed(theme, {
            ...over,
            prefs: { ...(over.prefs ?? {}), coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'] },
          }),
          s.goto,
        );
        try {
          await page.waitForTimeout(400);
          await s.open(page);
          await settle(page);
          await shot(page, 'phone', theme, `sheet-${s.name}`);
          console.log(`  ✓ sheet ${theme}/${s.name}`);
        } catch (e) {
          console.log(`  ⛔ UNREACHED sheet ${theme}/${s.name} — ${(e as Error).message.split('\n')[0]}`);
          expect.soft(`sheet ${theme}/${s.name}`, 'sheet recipe reached nothing').toBeNull();
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
          const merged = { ...(s.seedOver ?? {}), ...STATES[stateName] };
          /**
           * ⛔ **A STATE CANNOT OVERRIDE A KEY IT DOES NOT NAME, AND `empty` HAS TO NAME THEM ALL.**
           * `/history`'s `seedOver` supplies five `cycleHistory` snapshots and `STATES.empty` did not
           * carry that key, so the spread left them in place and `state-history-empty` photographed the
           * **populated** screen. `<EmptyHistory>` then appeared in no frame in the entire matrix — the
           * gap the `seedOver` was added to close, inverted rather than closed. (P6.8.9.7.10 · A-1.)
           *
           * ⚡ **Gated as a class, not fixed as a key.** Adding `cycleHistory: []` to `STATES.empty` fixes
           * today and says nothing about the next `seedOver` someone adds — and `/living-expenses` escaped
           * only because `STATES.empty` happens to list `livingExpenses`, which is an accident, not a
           * mechanism. This asserts the property the state's NAME claims.
           */
          if (stateName === 'empty') {
            const populated = Object.entries(merged)
              .filter(([, v]) => Array.isArray(v) && v.length > 0)
              .map(([k]) => k);
            if (populated.length > 0) {
              throw new Error(
                `state "empty" for ${s.name} still carries populated ${populated.join(', ')} from its seedOver — ` +
                  'STATES.empty must name every collection any seedOver sets, or the frame is of the populated design',
              );
            }
          }
          await reseed(page, seed(theme, merged), s.goto);
          try {
            // ⛔ [P6.8.9.7.11.12.11 · D-J2-2] The identity check runs HERE TOO. This block loops the same
            // `SURFACES` array as the route block and consulted `ready` in neither — so a state frame
            // could be a photograph of the wrong screen with nothing to say so. ⚠️ A `ready` must
            // therefore be state-AGNOSTIC: every one of them is the screen's heading, which `empty` and
            // `huge` render alike.
            await s.ready(page);
            await settle(page);
            await shot(page, 'phone', theme, `state-${s.name}-${stateName}`);
            console.log(`  ✓ state ${theme}/${s.name}/${stateName}`);
          } catch (e) {
            console.log(`  ⛔ UNREACHED state ${theme}/${s.name}/${stateName} — ${(e as Error).message.split('\n')[0]}`);
            expect.soft(`state ${theme}/${s.name}/${stateName}`, 'state recipe reached nothing').toBeNull();
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
      /**
       * ⛔ **ONE TEST PER SURFACE — this block looped ten of them inside ONE test, and the rule it broke is
       * stated 140 lines above it, in this same file.** That rule is not about tidiness or timeouts. It is
       * there because *"the PREVIOUS surface's app is still alive when the next seed is written, and its
       * 500 ms autosave debounce fires and puts its own store back over the blob."* A shared page cannot
       * be reseeded reliably; only a fresh one can.
       *
       * ⚡ **MEASURED, NOT REASONED — P6.8.9.7.11.2 compared the two frames.**
       * `phone/dark/history.png` (route block, one test per surface) shows five cycles and *"$2,560 paid
       * down"*. `phone/dark/textscale-2x-history.png` (this block, ten surfaces per test), from the **same
       * `seedOver`, theme and viewport**, shows *"No finished cycles yet."* **The seed did not take.**
       *
       * ⚠️ **And it is invisible by construction.** The frame exists, it is not stale, it is not UNREACHED
       * — every completeness signal the shooter has says fine. It only shows where a `seedOver` adds
       * something the base seed lacks; `/living-expenses` looks correct because the base seed already
       * carries `livingExpenses`, which is an accident and not a defence.
       *
       * Splitting also retires the shared-timeout hazard the old `expect.soft` was patching: ten surfaces
       * shared one 180 s budget, and `settle`'s 15 s skeleton wait meant a handful of stalls — the
       * measured case under four-way contention — could take the whole test down with everything after it.
       */
      for (const s of SURFACES) {
      test(`text at ${scale}× ${s.name} (${vpName}/${theme})`, async ({ page }) => {
        {
          await reseed(page, seed(theme, s.seedOver), s.goto);
          try {
            // ⛔ [P6.8.9.7.11.12.11 · D-J2-2] **THIS WAS THE CONCRETE HOLE.** This block loops `SURFACES`
            // across two scales × two viewports × two themes and never consulted `ready` — so the EIGHT
            // `textscale-{1.35,2}x-onboarding.png` frames were shot with the guard that exists for that
            // exact route switched off, on the one route whose seed `runMigrations` is documented to
            // overrule. A frame of Today under the name `onboarding` exited 0 and printed `✓`.
            await s.ready(page);
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
            // ⚠️ Still soft: one surface failing to settle must not read as "the text-scale pass is broken".
            // It no longer has to carry the other nine — each has its own test and its own budget now.
            expect.soft(`textscale ${scale}× ${vpName}/${theme}/${s.name}`, 'text-scale recipe reached nothing').toBeNull();
          }
        }
      });
      }
    }
  });
}
}

// ── EXPANDED DISCLOSURES, phone × both themes. ────────────────────────────────────────────────────
//
// ⛔ **P6.8.9.1 — THE STATE THE MATRIX HAS NEVER SHOT.** Both of the Trajectory card's disclosures ship
// COLLAPSED, and for the strategy compare that is a deliberate choice ([D59]: "should I switch?" is an
// occasional question, so opening it must not disturb the resting card). The consequence is that **every
// other frame in the matrix** photographs the card at rest, and everything behind both toggles had never
// been in the evidence set at all — including the entire C7 surface that cluster g built.
// ⚠️ This read "all 226 frames" and the count was already wrong when it was written; a literal total in
// prose ages the moment a recipe is added. The claim it needs to make is *"every other frame"*, which
// cannot go stale. (P6.8.9.7.10 · A-7.)
//
// ⚠️ g.5 stacked the second disclosure directly beneath the first, so the two now share one bottom edge
// treatment. Whether they read as a stack or as clutter is a question **no closed frame can pose**, which
// is why the both-open state is shot rather than either-open.
//
// ⚠️ `coachMarksSeen` is seeded here **and in the sheet block above** (see the `prefs` merge there): the
// mark's card sits over the control, so without it a recipe that CLICKS can mis-tap or time out. Blocks
// that only navigate are unaffected, which is why the omission took so long to bite.
// ⛔ This used to claim the seeding happened "nowhere else in this file", which was false in the same
// commit that wrote it — and the correction matters, because "nowhere else" is the sentence that stops
// the next person looking. (P6.8.9.7.10 · A-7.)
/**
 * ⛔ **A COMPARISON NEEDS SOMETHING TO COMPARE, and the default seed has ONE debt.** With one debt
 * snowball and avalanche are the same list, so the first version of `strategy-compare-full` photographed
 * two identical columns — a frame of C7's feature in the one portfolio where C7 has nothing to say.
 * ⚡ `DIVERGENT` is built so the two orders MUST disagree: snowball takes the smallest balance first
 * (Store card, $800) and avalanche the highest APR first (Big card, 27%). Same debts, opposite first row —
 * which is exactly the difference [D59] chose to show instead of two indistinguishable curves.
 */
// ⛔ **ONE DEFINITION, NOT A BYTE COPY.** This was duplicated from `STATES.divergent` verbatim — two
// portfolios that MUST disagree about strategy order, maintained in two places, where editing one balance
// silently makes the state frames and the disclosure frames disagree about what "divergent" means. The
// whole value of this seed is that snowball and avalanche pick opposite first rows; a drifted copy keeps
// the name and loses the property. (P6.8.9.7.10 · A-7.)
const DIVERGENT = STATES.divergent;

const EXPANDED: { name: string; goto: string; open: (page: Page) => Promise<unknown>; seedOver?: Record<string, unknown> }[] = [
  {
    name: 'progress-disclosures-open',
    goto: '/progress',
    open: async (p) => {
      // ⚠️ The what-if toggle carries no `testID` — its `accessibilityLabel` is the stable handle, and
      // using it keeps this recipe out of app source. A testID would be a source edit, and a source edit
      // owes its own `validate:release:rn`; an instrument is not worth that.
      await p.getByRole('button', { name: /What if you paid extra/i }).first().click({ timeout: FAST });
      await p.getByTestId('strategy-compare-toggle').click({ timeout: FAST });
    },
  },
  {
    // ⛔ P6.8.9.1 after-scan — THE FRAME ABOVE IS NOT ENOUGH, and an independent verifier caught it.
    // With both disclosures open the card is taller than the viewport, so `expanded-progress-disclosures-open`
    // stops one row into the comparison and **the avalanche column is in no frame in either theme** —
    // C7's whole point is the two orders side by side, and half of it was still unphotographed.
    // ⚡ The first frame is kept rather than replaced: it answers the STACK question (do two disclosures
    // under one card read as a stack or as clutter), which a scrolled frame cannot pose.
    name: 'strategy-compare-full',
    goto: '/progress',
    seedOver: DIVERGENT,
    open: async (p) => {
      await p.getByTestId('strategy-compare-toggle').click({ timeout: FAST });
      // ⚠️ `scrollIntoViewIfNeeded` alone left the avalanche column half under the tab bar — RN Web's
      // ScrollView satisfied "needed" with the element barely at the edge. `block: 'center'` is what
      // actually puts the whole comparison in the frame.
      await p.getByTestId('strategy-compare-takeaway').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    },
  },
];

for (const theme of THEMES) {
  test.describe(`expanded · ${theme}`, () => {
    test.use({ viewport: VIEWPORTS.phone });

    for (const s of EXPANDED) {
      test(`expanded ${s.name} (${theme})`, async ({ page }) => {
        await reseed(
          page,
          seed(theme, {
            ...(s.seedOver ?? {}),
            prefs: { coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'] },
          }),
          s.goto,
        );
        try {
          await page.waitForTimeout(400);
          await s.open(page);
          await settle(page);
          await shot(page, 'phone', theme, `expanded-${s.name}`);
          console.log(`  ✓ expanded ${theme}/${s.name}`);
        } catch (e) {
          console.log(`  ⛔ UNREACHED expanded ${theme}/${s.name} — ${(e as Error).message.split('\n')[0]}`);
          expect.soft(`expanded ${theme}/${s.name}`, 'disclosure recipe reached nothing').toBeNull();
        }
      });
    }
  });
}
