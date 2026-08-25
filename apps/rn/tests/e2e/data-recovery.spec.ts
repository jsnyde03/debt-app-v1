import { expect, test, type Page } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

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
async function waitForPersisted(page: Page, predicate: (store: { pendingDataRepairs?: unknown[] }) => boolean) {
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

/** Put bytes in localStorage that `runMigrations` will refuse — the corrupt-store path. */
async function seedCorrupt(page: Page) {
  await page.addInitScript(
    (arg) => {
      window.localStorage.setItem(arg.key, arg.blob);
    },
    { key: KEY, blob: JSON.stringify('this is not a store') },
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
  // ⚠️ The NAME is the assertion. A card saying "an amount could not be read" without saying which is
  // useless — the user cannot tell a repaired balance from a real one by looking.
  await expect(page.getByText(/Chase card/)).toBeVisible();
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
