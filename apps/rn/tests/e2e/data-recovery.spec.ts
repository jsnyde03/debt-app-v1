import { expect, test, type Page } from '@playwright/test';

import { day, scenario, seedStore } from './helpers/seed';

/**
 * P6.8.7c.2 (audit B4 · M3-1 · M3-2) — the two silent data events now SAY something.
 *
 * ⛔ **Both defects were invisible by construction, which is why these assert on rendered text.** The
 * store half is unit-tested in `persistenceLifecycle.test.ts`; the claim THOSE tests cannot make is that
 * a human sees anything. A `storageError` set correctly and a screen that never renders it is the same
 * app, from where the user stands.
 */
test.use({ viewport: { width: 402, height: 874 } });

const KEY = 'debtPlanner.rnStore';

/**
 * Seed ONCE, then leave the app's own writes alone.
 *
 * ⛔ `seedStore` uses `addInitScript`, which re-runs on **every** navigation — including `reload()`. A
 * persistence test built on it re-injects the fixture and then "proves" the app restored state it never
 * wrote. Measured here: the acknowledgement test failed against correct code for exactly this reason.
 */
async function seedOnce(page: Page, store: Record<string, unknown>) {
  await page.addInitScript(
    (arg) => {
      if (!window.localStorage.getItem(arg.key)) window.localStorage.setItem(arg.key, arg.blob);
    },
    { key: KEY, blob: JSON.stringify(store) },
  );
}

/** Wait until the app has actually PERSISTED the state under test — autosave is debounced. */
// ⚠️ The element type is named rather than `unknown[]`: two callers read `r.acknowledged`, and under
// `unknown` that is only legal because nothing typechecked this tree. [P6.8.9.7.11.13.3]
async function waitForPersisted(
  page: Page,
  // ⚠️ Named rather than `unknown`, for [P6.8.9.7.11.13.3]'s reason. `pendingPayoff` joined it at S1.9.2
  // [C3], where the assertion that the crossing IS stamped is as load-bearing as the one on the screen.
  predicate: (store: { pendingDataRepairs?: { acknowledged?: boolean }[]; pendingPayoff?: { kind?: string } | null }) => boolean,
) {
  await expect
    .poll(async () => {
      const raw = await page.evaluate((key) => window.localStorage.getItem(key), KEY);
      try {
        return predicate(JSON.parse(raw ?? '{}'));
      } catch {
        return false;
      }
    }, { timeout: 15_000 })
    .toBe(true);
}

/**
 * Put bytes in localStorage that `runMigrations` will refuse — the corrupt-store path.
 *
 * ⚠️ **`JSON.stringify('this is not a store')` is VALID JSON**, and that was measured rather than noticed:
 * `JSON.parse` succeeds, returns the string, and `runMigrations` refuses it. It is a real case and it stays
 * — but it is the one member of the class on which the web adapter and the native adapter AGREED, and the
 * whole suite rested on it while a truncated write read as *"nothing is stored"*. See `seedTruncated`.
 */
async function seedCorrupt(page: Page) {
  await page.addInitScript(
    (arg) => {
      window.localStorage.setItem(arg.key, arg.blob);
    },
    { key: KEY, blob: JSON.stringify('this is not a store') },
  );
}

/**
 * ⛔ **S1.10.6.4 [pass-3 B4] — THE MEMBER OF THE CLASS NOTHING TESTED.** Bytes that are not valid JSON at
 * all: a write truncated by a killed tab or a quota error, which is the ordinary way a blob goes bad. The
 * web adapter read these as `null`, so the app onboarded silently, `persistence.ts` ran the v1.6 legacy
 * import over a device that already had a v1.7 store, and the first autosave overwrote the last copy.
 *
 * ⚠️ Added BESIDE `seedCorrupt`, never in place of it — replacing the fixture would trade one uncovered
 * member of the class for another.
 */
async function seedTruncated(page: Page) {
  await page.addInitScript(
    (arg) => {
      window.localStorage.setItem(arg.key, arg.blob);
    },
    { key: KEY, blob: '{"debts":[{"id":"d1","name":"Chase","balance":12' },
  );
}

// ── M3-1: the wipe is announced, and it offers a way back ────────────────────────────────────────
test('a corrupt store does NOT drop the user into silent onboarding', async ({ page }) => {
  await seedCorrupt(page);
  await page.goto('/');

  // ⛔ The defect, stated as an assertion: onboarding without a word is what used to happen.
  await expect(page.getByTestId('data-reset')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('We couldn’t open your saved plan')).toBeVisible();

  // The copy must not claim the data was deleted — it was quarantined, and an iCloud copy is untouched.
  await expect(page.getByText(/Nothing was deleted/)).toBeVisible();

  // A way out is offered, not just an explanation.
  await expect(page.getByTestId('data-reset-import')).toBeVisible();
});

test('B4 · TRUNCATED bytes are quarantined too, not read as a first launch', async ({ page }) => {
  /**
   * ⛔ **The two implementations of one `StorageAdapter` contract disagreed on these exact bytes.**
   * `createAdapter.ts` hands corrupt bytes back as a raw string so the blob is quarantined; the web adapter
   * caught `getItem` and `JSON.parse` in one `catch { return null }` and reported *"nothing is stored"*.
     * ⚠️ The assertions are the same as the valid-JSON case above **by design**: unreadable bytes must reach
   * the same quarantine whatever shape they are in, so identical assertions ARE the guard.
   */
  await seedTruncated(page);
  await page.goto('/');
  await expect(page.getByTestId('data-reset')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('We couldn’t open your saved plan')).toBeVisible();
  await expect(page.getByText(/Nothing was deleted/)).toBeVisible();
  // ⛔ The defect by name: silent onboarding over a store the user still had.
  await expect(page.getByText('Will you make it to payday?')).toHaveCount(0);
});

test('the reset screen blocks onboarding until the user answers it', async ({ page }) => {
  await seedCorrupt(page);
  await page.goto('/');
  await expect(page.getByTestId('data-reset')).toBeVisible({ timeout: 15_000 });

  // Onboarding is NOT already behind it — the point of blocking is that the setup form does not get to
  // be the user's first evidence of what happened.
  await expect(page.getByText('Will you make it to payday?')).toHaveCount(0);

  await page.getByTestId('data-reset-continue').click();
  await expect(page.getByTestId('data-reset')).toHaveCount(0);
  await expect(page.getByText('Will you make it to payday?')).toBeVisible({ timeout: 10_000 });
});

// ── M3-2: a repaired amount is named, and outlives the read that found it ────────────────────────
test('an unreadable balance is NAMED on Today, not silently filed as paid off', async ({ page }) => {
  // `balance: null` is the shape v1.6 wrote for a grouped number — the state `migrations.ts` says it
  // measured in the wild.
  await seedStore(
    page,
    scenario({ debts: [{ id: 'd1', name: 'Chase card', balance: null, minimumPayment: 50, apr: 20, dueDate: '2026-07-01', type: 'debt', recurrence: 'monthly' }] }),
  );
  await page.goto('/');

  await expect(page.getByTestId('data-repairs-ack')).toBeVisible({ timeout: 15_000 });
  /**
   * ⚠️ The NAME is the assertion. A card saying "an amount could not be read" without saying which is
   * useless — the user cannot tell a repaired balance from a real one by looking.
   *
   * ⛔ **SCOPED TO THE REPAIRS CARD, and the reason is `S1.13.7.8 [pass-6 `C1-1`]`.** Unscoped, this was a
   * **strict-mode violation the moment that fix landed**: the Guardian and Required cards now name the
   * figure too, so three elements say "Chase card" on this screen at once. ⚡ The assertion was never
   * about the page — it was about THIS card naming the row — and it only became ambiguous because the
   * neighbouring copy got better. **A defect that exists only in the GREEN state**, which is the class no
   * plant can see: under a plant the text is absent and the locator resolves to one element.
   */
  await expect(page.getByTestId('data-repairs-ack').getByText(/Chase card/)).toBeVisible();
});

test('the notice survives a reload — it is not a one-session message', async ({ page }) => {
  await seedOnce(
    page,
    scenario({ debts: [{ id: 'd1', name: 'Chase card', balance: null, minimumPayment: 50, apr: 20, dueDate: '2026-07-01', type: 'debt', recurrence: 'monthly' }] }),
  );
  await page.goto('/');
  await expect(page.getByTestId('data-repairs-ack')).toBeVisible({ timeout: 15_000 });

  // ⛔ THE WHOLE POINT. `dataRepairs` is empty on the second pass by design, so before
  // `pendingDataRepairs` this reload is where the notice vanished for good. The app has now written the
  // REPAIRED store over the seed, so what reloads is its own output, not the fixture.
  await waitForPersisted(page, (s) => (s.pendingDataRepairs?.length ?? 0) === 1);
  await page.reload();
  await expect(page.getByTestId('data-repairs-ack')).toBeVisible({ timeout: 15_000 });

  // Acknowledging is what ends it — and it must stay ended.
  await page.getByTestId('data-repairs-ack-button').click();
  await expect(page.getByTestId('data-repairs-ack')).toHaveCount(0);
  // ⚠️ The record SURVIVES the ack and carries the acknowledgement — emptying it also disarmed the
  // celebration guards that read it. The card is gone; the knowledge that these numbers are untrustworthy
  // is not. [P6.8.9.7.11.10 · A-J2-1]
  await waitForPersisted(page, (s) => (s.pendingDataRepairs ?? []).every((r) => r.acknowledged === true));
  await waitForPersisted(page, (s) => (s.pendingDataRepairs?.length ?? 0) === 1);
  await page.reload();
  await expect(page.getByTestId('data-repairs-ack')).toHaveCount(0, { timeout: 15_000 });
});

test('Money does not celebrate a portfolio it failed to read', async ({ page }) => {
  // Every debt unreadable → all repaired to 0 → all filed under PAID OFF → the hero used to read
  // "Every balance cleared" over debts that are still owed.
  await seedStore(
    page,
    scenario({ debts: [{ id: 'd1', name: 'Chase card', balance: null, minimumPayment: 50, apr: 20, dueDate: '2026-07-01', type: 'debt', recurrence: 'monthly' }] }),
  );
  await page.goto('/money');
  // ⛔ **Wait for the screen to exist before asserting what is NOT on it.** `toHaveCount(0)` is satisfied
  // by an unrendered page, so without this the test passes before the app has drawn anything — measured:
  // it stayed green with the guard planted out. The debt row is the marker because it renders in both the
  // celebrating and the non-celebrating branch.
  await expect(page.getByText('Chase card')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Every balance cleared')).toHaveCount(0);
});

test('…and a BLANK balance is unread money too, not a cleared debt', async ({ page }) => {
  /**
   * ⛔ **THE TEST ABOVE PICKED THE ONE MEMBER OF THE CLASS THAT WORKED.** [P6.8.9.7.11.18 · S1.1 —
   * round-4 blocker #1] The class is *money the app could not read*; every fixture in the tree seeded
   * `balance: null`, which is `lost` under the defect and under the fix. `''` was not — `Number('')` is
   * `0`, not `NaN`, so `readMoney` stamped it **`recovered`**, `.11.12.1`'s narrowed guard
   * (`r.kind !== 'recovered'`) read the repair as trustworthy, and Money congratulated the user over a
   * debt they still owe. **For the life of the install: the repaired `0` is permanent.**
   *
   * ⚠️ A blank field is what a hand-edited or third-party export produces, and `readBackup.ts` hands an
   * arbitrary user file straight to `runMigrations`. The unit half is `src/data/migrations.test.ts`; this
   * is the half that says a human sees the right screen.
   */
  await seedStore(
    page,
    scenario({ debts: [{ id: 'd1', name: 'Chase card', balance: '', minimumPayment: 50, apr: 20, dueDate: '2026-07-01', type: 'debt', recurrence: 'monthly' }] }),
  );
  await page.goto('/money');
  // ⛔ The positive assertion first — `toHaveCount(0)` is satisfied by a page that never rendered.
  await expect(page.getByText('Chase card')).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText('Every balance cleared'),
    'a blank balance is money the app could not read, so the celebration stays suppressed',
  ).toHaveCount(0);
});

test('the celebration guard SURVIVES the acknowledgement', async ({ page }) => {
  /**
   * ⛔ **THE ACK HID THE CARD AND DISARMED THE GUARD, AND THE REPAIRED ZEROS ARE PERMANENT.**
   * [P6.8.9.7.11.10 · A-J2-1] `unreadDebts` reads `pendingDataRepairs`, which the ack used to EMPTY — so
   * the test above passed on a first launch and Money reverted to **"Every balance cleared"**, over debts
   * still owed, one tap later and for the life of the install.
   *
   * ⚠️ The test above cannot see this: it never taps *"Got it"*. A guard that holds only until the user
   * dismisses a notice is not a guard, and the gap between the two states is one button.
   */
  await seedStore(
    page,
    scenario({ debts: [{ id: 'd1', name: 'Chase card', balance: null, minimumPayment: 50, apr: 20, dueDate: '2026-07-01', type: 'debt', recurrence: 'monthly' }] }),
  );
  await page.goto('/');
  await page.getByTestId('data-repairs-ack-button').click();
  await expect(page.getByTestId('data-repairs-ack')).toHaveCount(0);
  /**
   * ⛔ **WAIT FOR THE ACK TO PERSIST, OR THIS TEST PASSES BECAUSE IT NEVER HAPPENED.** Writes go through a
   * `SAVE_DEBOUNCE_MS` debounce, and `goto` is a full navigation that re-hydrates from storage — so
   * without this the next page loads the **pre-ack** store, the guard is still armed for the ordinary
   * reason, and the assertion below holds while proving nothing. Measured: the planted defect passed.
   * ⚠️ The sibling ack test waits for exactly this, which is where the shape came from.
   */
  await waitForPersisted(page, (s) => (s.pendingDataRepairs ?? []).some((r) => r.acknowledged === true));

  await page.goto('/money');
  await expect(page.getByText('Chase card')).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText('Every balance cleared'),
    'after the ack, Money still must not congratulate over a balance it could not read',
  ).toHaveCount(0);

  // …and across a relaunch, because the repair is durable and the guard has to be too.
  await page.reload();
  await expect(page.getByText('Chase card')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Every balance cleared')).toHaveCount(0);
});

// ── A-J2-2: a RECOVERED amount is not spoken as a lost one ───────────────────────────────────────
test('an amount read in a different format is not reported as unreadable', async ({ page }) => {
  /**
   * ⛔ **THE CARD SAID THE LOSS SENTENCE OVER AN AMOUNT IT HAD READ CORRECTLY.**
   * [P6.8.9.7.11.12 · A-J2-2] `targetAmount: '4,000'` recovers to the real 4000 — Money renders the goal
   * at $4,000 and the engine allocates against it — while Today said *"An amount could not be read · Your
   * plan is running without it until you set it again"*. Two screens contradicting each other about the
   * user's money, and this was the one that was wrong.
   *
   * ⚠️ **This is the assertion `dataRepairsCopy.test` cannot make.** That suite pins the sentences given a
   * record; it cannot see JSX, so it cannot tell whether the recovered block reaches a screen at all.
   */
  await seedStore(
    page,
    scenario({
      goals: [{ id: 'g1', name: 'Roof fund', type: 'savings', targetAmount: '4,000', currentAmount: 0 }],
    }),
  );
  await page.goto('/');

  await expect(page.getByTestId('data-repairs-ack')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('An amount was written in a different format')).toBeVisible();
  await expect(page.getByText(/Roof fund/)).toBeVisible();
  // ⛔ The loss language must be ABSENT — and the card above is already on screen, so this is not an
  // absence assertion racing an unrendered page.
  await expect(page.getByText('An amount could not be read')).toHaveCount(0);
});

// ── B-J2-1: a restore FROM the reset screen must end the reset ───────────────────────────────────
test('restoring a backup file from the reset screen leaves that screen', async ({ page }) => {
  /**
   * ⛔ **THE USER WAS RETURNED TO THE ERROR THEY HAD JUST FIXED.**
   * [P6.8.9.7.11.12 · B-J2-1] `DataResetScreen` IS the whole tree while `storageError === 'data-reset'`.
   * Its file-import sheet ran `importStore` and closed — nothing cleared the error — so the sheet lifted
   * to reveal the same *"We couldn't open your saved plan"* panel, with no sign the restore worked and
   * the only way onward labelled **"Start fresh"**. The iCloud button five lines above it called
   * `onStartFresh()` afterwards and was fine; nothing made the two agree.
   *
   * ⚠️ **This is the combination no spec covered.** The reset-screen tests above never open the sheet,
   * and `backup.spec.ts` drives the import only from `/more`.
   */
  await seedCorrupt(page);
  await page.goto('/');
  await expect(page.getByTestId('data-reset')).toBeVisible({ timeout: 15_000 });

  await page.getByTestId('data-reset-import').click();
  await page.getByTestId('backup-import-input').fill(
    JSON.stringify(
      scenario({
        debts: [
          { id: 'd1', name: 'Restored Visa', balance: 1200, minimumPayment: 35, apr: 19.99, dueDate: day(1), type: 'debt', recurrence: 'monthly' },
        ],
      }),
    ),
  );
  await page.getByRole('button', { name: 'Check backup' }).click();
  await page.getByRole('button', { name: 'Replace my data' }).click();

  // ⛔ The panel is GONE — not merely "the sheet closed". That distinction is the entire finding.
  await expect(page.getByTestId('data-reset')).toHaveCount(0, { timeout: 15_000 });

  /**
   * …and the restored portfolio is really there, polled rather than read once — autosave is debounced,
   * and a single `readStore` asserts over whatever happened to be on disk at that instant.
   *
   * ⛔ **Deliberately NOT `goto('/money')` to look for the debt.** `seedCorrupt` uses `addInitScript`,
   * which re-runs on EVERY navigation, so a `goto` re-injects the corrupt bytes and the app re-hydrates
   * straight back into the reset screen. Measured here: the first cut of this test failed for exactly
   * that reason, against a correct fix — the same trap this file's header documents.
   */
  await expect
    .poll(
      async () => {
        const raw = await page.evaluate((key) => window.localStorage.getItem(key), KEY);
        try {
          return (JSON.parse(raw ?? '{}') as { debts?: { name?: string }[] }).debts?.[0]?.name;
        } catch {
          return undefined;
        }
      },
      { timeout: 15_000 },
    )
    .toBe('Restored Visa');
});

/**
 * ⛔ **[P6.8.9.7.11.13.5 · J1-1 Q2] THE MIGRATION CHANGED THE PLAN AND SAID NOTHING.**
 *
 * A store an earlier build already wrote carries `priority: true` with a pace of `0`, and a finite `0`
 * re-reads as `repaired: false` — so it carries **no repair record**. `runMigrations` stands the goal down
 * for it (correctly: `0` is the UNCAPPED value, and leaving it funds the goal at full speed ahead of the
 * debt) and used to do so with no card and no entry. That is the silent drop `migrations.ts`'s own opening
 * rule forbids: *"money that cannot be read is REPAIRED and REPORTED."*
 *
 * ⚠️ **Why this is a spec and not only a unit assertion.** `persistenceLifecycle.test.ts` pins the record;
 * what it cannot show is that the record reaches a screen — the record travels through `runMigrations` on
 * hydrate, into `pendingDataRepairs`, into `repairBlocks`, into the card. **Every link is the claim.**
 *
 * ⚠️ *"Until you set it again"* only became followable at `.11.13.4`, which is why this is reportable now:
 * `GoalSheet` can set the pace. Reporting a loss with no way to act on it would have been a different
 * defect wearing the same words.
 */
test('a legacy stood-down goal is NAMED on Today, with the consequence', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      goals: [{ id: 'g0', name: 'Roof', type: 'savings', targetAmount: 4000, currentAmount: 0, priority: true, priorityPerPaycheck: 0 }],
    }),
  );
  await page.goto('/');

  await expect(page.getByTestId('data-repairs-ack')).toBeVisible({ timeout: 15_000 });
  // The NAME, or the person cannot tell which goal changed.
  await expect(page.getByText(/Roof/)).toBeVisible();
  // ⛔ And the CONSEQUENCE. "could not be read" alone describes a field; what the user needs to know is
  // that their plan stopped funding this ahead of their debt — the half a field name cannot carry.
  await expect(page.getByText(/no longer funded ahead of your debt/)).toBeVisible();
});

/**
 * ⛔ **[P6.8.9.7.11.13.8 · J1-4] THE CARD TOLD PEOPLE TO GO AND SET SOMETHING THAT CANNOT BE SET.**
 *
 * *"Your plan is running without it until you set it again"* was written for a named item with a sheet
 * behind it and applied to every record. **Three of the five producers of a repair emit one with no item
 * to open** — a whole list that would not read, a single row that would not read, and the v1.6 bridge's
 * counts. J1-4's own Q3 says nothing asserted either sentence and no fixture produced the case; this is
 * that fixture.
 *
 * ⚠️ **The block SPLIT rather than the sentence softening.** A named loss keeps the actionable wording,
 * because for it the wording is true — and at `.11.13.4` it became true of a stood-down goal pace too.
 */
test('a loss with nothing to reopen is not told to "set it again"', async ({ page }) => {
  // A `null` row is dropped and reported by `repairMoneyFields` — no id, no name, nothing to open.
  await seedStore(page, scenario({ debts: [null] }));
  await page.goto('/');

  await expect(page.getByTestId('data-repairs-ack')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Some of your old data did not come across')).toBeVisible();
  await expect(page.getByText(/nothing to reopen for it/)).toBeVisible();
  // ⛔ And the false instruction is ABSENT. ⚠️ Asserted only after the card is proven on screen — an
  // absence assertion is trivially true of a page that never rendered.
  await expect(page.getByText(/until you set it again/)).toHaveCount(0);
});

// ── S1.9.2 · pass-2 C1–C4: the same rule, wired to a subset of FIELDS and a subset of CLAIM SITES ──
//
// ⛔ **The unit half is `src/store/trustSelectors.test.ts`, and it cannot see any of this.** Every fix
// below is a selector wired into a render, and pass 1's own lesson is that *a tested helper is not a used
// helper*: `mayClaim`, `rowFieldUnread` and `selectCelebration` all typecheck perfectly at a call site
// that never asks them. These are the assertions a human's screen can red.

/**
 * A plan with a bill the app knows about but that falls OUTSIDE this cycle, so `hasAnyBills` is true and
 * `outstanding` is legitimately 0. ⚠️ Both C4 tests share it and differ in exactly one character of one
 * field — the auditor's own single-variable method, and the only way the control means anything.
 */
const PLAN_WITH_NOTHING_DUE = (minimumPayment: unknown) =>
  scenario({
    paycheck: { amount: '2000', currentDate: day(0), nextPaycheckDate: day(14) },
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 350, dueDate: day(60), recurrence: 'one-time', category: 'housing' }],
    debts: [{ id: 'd1', name: 'Chase card', balance: 5000, minimumPayment, apr: 20, dueDate: day(4), type: 'debt', recurrence: 'monthly' }],
  });

test('C4 · a minimum the app could not read does NOT read as "caught up"', async ({ page }) => {
  /**
   * ⛔ **[B5]'S EXACT SENTENCE, THROUGH A DIFFERENT DOOR.** An unreadable `minimumPayment` repairs to
   * `$0`; `allocatePaycheck` emits neither an allocation row nor an unfunded item for an obligation of
   * `$0`, so the debt leaves the plan entirely, `countOutstandingRequired` honestly returns 0, and Today
   * printed *"You're caught up for this paycheck."* in success green over an unpaid $5,000 card whose
   * minimum is due in four days. ⚠️ [B5]'s remedy is intact — the count is right about the arrays it is
   * handed. The arrays were wrong.
   */
  await seedStore(page, PLAN_WITH_NOTHING_DUE('n/a'));
  await page.goto('/');
  await expect(page.getByText('Required actions')).toBeVisible({ timeout: 15_000 });
  // ⛔ The honest state SAID, asserted by name — not merely the false one withheld. Suppressing a false
  // sentence can produce a different false one: [B1]'s first cut replaced "Every balance paid off" with
  // "Add a debt", over debts the user still owed.
  await expect(page.getByTestId('required-unread-inputs')).toBeVisible();
  await expect(page.getByText('You’re caught up for this paycheck.')).toHaveCount(0);
  // …and it is not the OTHER zero state either. This user has told the app about a bill.
  await expect(page.getByTestId('required-no-bills')).toHaveCount(0);
});

test('C4 control · a minimum the app CAN read still reads as caught up', async ({ page }) => {
  // ⭐ The fix must not buy its correctness by refusing to speak. ⚠️ `0` is the discriminating control: a
  // minimum of literally zero is a real answer (a BNPL with nothing due), it produces no row for the same
  // arithmetic reason as the repaired one, and the ONLY difference is the repair record.
  await seedStore(page, PLAN_WITH_NOTHING_DUE(0));
  await page.goto('/');
  await expect(page.getByText('Required actions')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('required-unread-inputs')).toHaveCount(0);
  await expect(page.getByText('You’re caught up for this paycheck.')).toBeVisible();
});

async function openGoals(page: Page) {
  await page.goto('/money');
  await page.getByText('Goals', { exact: true }).click();
  await expect(page.getByRole('button', { name: /^Car,/ })).toBeVisible({ timeout: 15_000 });
}

test('C2 · a goal whose SAVED amount could not be read does not print a remainder', async ({ page }) => {
  /**
   * ⛔ **THE GUARD WAS ON ONE FIELD AND ABSENT FROM ITS TWIN.** `trustSelectors`' own docblock says both
   * sides of `currentAmount >= targetAmount` are money fields that repair to `0`; both `money.tsx`
   * consumers narrowed it to `targetAmount === 0`. Measured: *"House Fund · Savings · $1,000.00 left"*
   * with an empty bar and **no caption**, one inch under a hero reading *"$1,000 saved of $3,000 target ·
   * 33% funded"* — every figure wrong, while the Today card said the amount could not be read.
   *
   * ⚠️ The two goals carry DIFFERENT targets on purpose. With both at $1,000 the false remainder and the
   * healthy neighbour's real one are the same string, and no absence assertion could tell them apart.
   */
  await seedStore(
    page,
    scenario({
      goals: [
        { id: 'g1', name: 'House Fund', type: 'savings', targetAmount: 1000, currentAmount: 'wat' },
        { id: 'g2', name: 'Car', type: 'savings', targetAmount: 3000, currentAmount: 1000 },
      ],
    }),
  );
  await openGoals(page);

  const row = page.getByRole('button', { name: /^House Fund,/ });
  // ⛔ The honest state by NAME first. The row falls back to the figure the app DID read and says which
  // one is missing — a row that merely dropped the falsehood would satisfy the absence assertion below.
  await expect(row).toHaveAccessibleName(/Saved amount could not be read/);
  await expect(row).toHaveAccessibleName(/\$1,000 target/);
  // ⛔ The false figure: it printed the entire target as the remainder.
  await expect(row).not.toHaveAccessibleName(/left/);
  await expect(row).not.toHaveAccessibleName(/Funded/);
  // The hero cannot state a total that is missing an unknown addend.
  await expect(page.getByText('Some amounts unread')).toBeVisible();
  await expect(page.getByText('33% funded')).toHaveCount(0);
  // ⭐ PER ROW, NOT PER SCREEN: the healthy goal beside it still states its own number.
  await expect(page.getByRole('button', { name: /^Car,/ })).toHaveAccessibleName(/\$2,000 left/);
});

test('C2 control · a goal whose amounts BOTH read still shows its remainder and its total', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      goals: [
        { id: 'g1', name: 'House Fund', type: 'savings', targetAmount: 1000, currentAmount: 250 },
        { id: 'g2', name: 'Car', type: 'savings', targetAmount: 3000, currentAmount: 1000 },
      ],
    }),
  );
  await openGoals(page);
  await expect(page.getByRole('button', { name: /^House Fund,/ })).toHaveAccessibleName(/\$750 left/);
  await expect(page.getByText('Some amounts unread')).toHaveCount(0);
  // 1,250 saved of 4,000 target → 31% funded. The caption and the bar are back.
  await expect(page.getByText('31% funded')).toBeVisible();
});

test('C3 · the full-screen finale does not fire over a balance nobody read', async ({ page }) => {
  /**
   * ⛔ **THE CLAIM SITE B1'S OWNER NEVER REACHED, and it is the loudest surface in the product.** Measured
   * on one store at one instant: `selectPlanState` returned `debt-free-unverified` — Today's calm banner
   * correctly refusing — while the finale printed *"$12,400 paid off · 2 debts"* over a $12,000 card the
   * app could not read, three lines away. Dismissing it spends a once-ever moment.
   *
   * ⛔ **S1.13.7.8 — THIS DOCBLOCK'S CLAIM WAS OVERTAKEN, AND THE ASSERTION UNDER IT HAD BEEN RED SINCE
   * `d6fd015d`.** It used to read *"the crossing is still STAMPED; only the render waits"*, and required
   * `pendingPayoff.kind === 'finale'` on the argument that gating `detectPayoff` would lose the finale
   * for the life of the install. **`S1.13.7.4`'s `B1-1` changed exactly that** — an unread balance
   * repaired to `$0` now counts as still LIVE, so this crossing stamps a **`beat`** naming *"Chase card"*
   * as what comes next, which is the truth: the app has not read that balance and cannot say the user is
   * debt-free.
   *
   * ⚡ **The old concern was answered rather than ignored, and that is asserted at the unit level**
   * (`payoffCelebration.test.ts`): once the balance is supplied and that debt clears, the crossing
   * happens THEN and the finale fires. The moment is deferred to the real event, not spent.
   *
   * ⚠️ **The assertion is REPLACED, not deleted.** What it defends is unchanged — the once-ever finale
   * must not be spent on a portfolio the app could not read — and it now pins the record that actually
   * says so. ⛔ It was also the whole of `B1-1`'s coverage; that gap is closed in the unit suite.
   */
  await seedOnce(
    page,
    scenario({
      requiredExpenses: [],
      // ⚠️ Coach marks seeded as SEEN, and `celebration.spec.ts` carries the same note for the same click:
      // the `payoff-schedule` mark renders over the debt sheet's footer and its "Got it" intercepts the
      // pointer, so the test fails on the coach mark rather than on the thing it is testing. Measured
      // here as `element is not stable` on `debt-log-payment`.
      prefs: { onboardingComplete: true, guardianIntroSeen: true, coachMarksSeen: true },
      debts: [
        { id: 'd0', name: 'Chase card', balance: 'n/a', originalBalance: 12000, minimumPayment: 300, apr: 22, dueDate: day(4), type: 'debt', recurrence: 'monthly' },
        { id: 'd1', name: 'Visa', balance: 400, originalBalance: 400, minimumPayment: 40, apr: 19, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      ],
    }),
  );
  // ⚠️ By LOGGING THE FINAL PAYMENT, not by editing the balance to 0 — `DebtSheet` refuses that with
  // "Minimum payment can't exceed the balance", which is true of every debt at the moment it is cleared.
  // `celebration.spec.ts` carries the same note; the first draft of this test hit exactly that wall.
  await page.goto('/money');
  await page.getByText('Visa', { exact: true }).first().click();
  await expect(page.getByText('Edit debt')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('debt-log-payment').click();
  await page.getByLabel('Amount paid').fill('99999');
  await page.getByRole('button', { name: 'Log payment' }).click();
  await waitForPersisted(page, (s) => (s.pendingPayoff?.kind ?? null) === 'beat');
  // ⛔ …and it names the unread debt as what comes NEXT. A `beat` that named nothing next would be the
  // same refusal wearing a different word; this is the record stating that Chase is still owed.
  await waitForPersisted(page, (s) => (s.pendingPayoff as { nextDebtName?: string } | null)?.nextDebtName === 'Chase card');

  await page.goto('/');
  // ⛔ A beat is stamped, not a finale — so this is detection refusing, and the render below refuses too.
  await expect(page.getByTestId('data-repairs-ack')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('You’re debt-free')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue' })).toHaveCount(0);
});

test('C1 · retyping the amount the card asked for CLEARS the suppression, and it stays cleared', async ({ page }) => {
  /**
   * ⛔ **A REPAIR IS A QUESTION AND NOTHING COULD ANSWER IT.** `pendingDataRepairs` only ever grew, so a
   * person who imported a file with one unreadable balance, retyped it exactly as the card asked, and then
   * genuinely paid off every debt was shown the broken-plan Money screen, lost the Progress trophy shelf
   * and never saw the graduation banner — **for the life of the install.**
   *
   * ⛔ `seedOnce`, not `seedStore`: the whole finding is about what survives a relaunch, and `seedStore`'s
   * `addInitScript` re-injects the fixture on every navigation.
   */
  await seedOnce(
    page,
    scenario({
      requiredExpenses: [],
      // ⚠️ Coach marks seen — see the C3 test's note; this one drives the same sheet control.
      prefs: { onboardingComplete: true, guardianIntroSeen: true, coachMarksSeen: true },
      debts: [{ id: 'd1', name: 'Chase card', balance: '', originalBalance: 1200, minimumPayment: 50, apr: 20, dueDate: day(4), type: 'debt', recurrence: 'monthly' }],
    }),
  );
  await page.goto('/money');
  await expect(page.getByText('Chase card')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Every balance cleared')).toHaveCount(0);

  // The user does exactly what the repairs card asks: they open the debt and set the amount again.
  await page.getByText('Chase card', { exact: true }).first().click();
  await expect(page.getByText('Edit debt')).toBeVisible({ timeout: 10_000 });
  await page.getByLabel('Current balance').fill('1200');
  await page.getByRole('button', { name: 'Save' }).click();
  await waitForPersisted(page, (s) => (s.pendingDataRepairs?.length ?? 1) === 0);

  // …and now paying it off is celebrated, which under C1 it never was.
  await page.getByText('Chase card', { exact: true }).first().click();
  await expect(page.getByText('Edit debt')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('debt-log-payment').click();
  await page.getByLabel('Amount paid').fill('99999');
  await page.getByRole('button', { name: 'Log payment' }).click();
  await expect(page.getByText('Every balance cleared')).toBeVisible({ timeout: 15_000 });

  // ⛔ ACROSS A RELAUNCH — where C1 was measured. `runMigrations` re-merges the pending list on every
  // load, so an answer that is not persisted is an answer that comes back as a question.
  await page.reload();
  await expect(page.getByText('Every balance cleared')).toBeVisible({ timeout: 15_000 });
});

test('C1 control · the ACK still answers nothing — A-J2-1 holds', async ({ page }) => {
  /**
   * ⭐ **THE CONTROL THAT MATTERS MOST.** A-J2-1 is the blocker where `acknowledgeDataRepairs` emptied the
   * list and one *"Got it"* tap restored *"Every balance cleared"* over debts still owed. C1's reset path
   * must distinguish *the user corrected this field* from *the user dismissed the card*, or it re-opens a
   * closed blocker. ⚠️ The sibling test above cannot see this: it never taps "Got it".
   */
  await seedOnce(
    page,
    scenario({
      requiredExpenses: [],
      debts: [{ id: 'd1', name: 'Chase card', balance: '', originalBalance: 1200, minimumPayment: 50, apr: 20, dueDate: day(4), type: 'debt', recurrence: 'monthly' }],
    }),
  );
  await page.goto('/');
  await page.getByTestId('data-repairs-ack-button').click();
  await waitForPersisted(page, (s) => (s.pendingDataRepairs ?? []).some((r) => r.acknowledged === true));
  // The record SURVIVES the ack — the ack is about the card.
  await waitForPersisted(page, (s) => (s.pendingDataRepairs?.length ?? 0) === 1);

  await page.goto('/money');
  await expect(page.getByText('Chase card')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Every balance cleared')).toHaveCount(0);
});

test('C2’s shape on the DEBTS list · the hero does not total a portfolio missing an addend', async ({ page }) => {
  /**
   * ⚡ **FOUND BY [C2]'s AFTER-SCAN, and only because [C2] was fixed first.** [C2] is that a total missing
   * an unknown addend is not a total; the goals hero was corrected for it, and the debts hero — three
   * hundred lines up in the same file — has the identical shape and nobody looked. A balance repaired to
   * `0` is not in `active`, so **both** figures exclude a debt the user still owes.
   *
   * ⚠️ The existing guard beside it (`allCleared`) only ever covered the case where EVERY balance is
   * unread. This fixture is the one it cannot see: one debt read, one not.
   */
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'd0', name: 'Chase card', balance: null, originalBalance: 8000, minimumPayment: 100, apr: 20, dueDate: day(4), type: 'debt', recurrence: 'monthly' },
        { id: 'd1', name: 'Visa', balance: 4000, originalBalance: 4000, minimumPayment: 80, apr: 19, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      ],
    }),
  );
  await page.goto('/money');
  await expect(page.getByText('Visa')).toBeVisible({ timeout: 15_000 });
  const hero = page.getByTestId('money-hero-debts-value');
  // ⛔ The false figure by name: $4,000 "remaining across 1 debt", over two debts and an unknown amount.
  await expect(hero).not.toHaveText('$4,000');
  await expect(hero).toHaveText('Some balances unread');
  // …and it is not the CLEARED branch either — that would be a second false statement, which is exactly
  // how [B1]'s first cut replaced "Every balance paid off" with "Add a debt" over debts still owed.
  await expect(page.getByText('Every balance cleared')).toHaveCount(0);
});

test('C2’s debts-hero control · a portfolio the app fully read still states its total', async ({ page }) => {
  await seedStore(
    page,
    scenario({
      requiredExpenses: [],
      debts: [
        { id: 'd0', name: 'Chase card', balance: 8000, originalBalance: 8000, minimumPayment: 100, apr: 20, dueDate: day(4), type: 'debt', recurrence: 'monthly' },
        { id: 'd1', name: 'Visa', balance: 4000, originalBalance: 4000, minimumPayment: 80, apr: 19, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
      ],
    }),
  );
  await page.goto('/money');
  await expect(page.getByText('Visa')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('money-hero-debts-value')).toHaveText('$12,000');
});
