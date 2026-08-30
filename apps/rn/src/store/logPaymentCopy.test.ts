/**
 * ⛔ **S1.12.5.6 [pass-5 `C5-3`] — "Log payment" SAID "$0 owed" ON A CARD THE USER OWES $12,000 ON.**
 *
 * ⚡ Restore a backup where a balance could not be read: Money puts the debt under **BALANCE UNREAD** and
 * the row prints `—`, exactly as pass-3 `C-1` intended. One tap below, the sheet header read
 * **"Chase · $0 owed"**, and typing the $500 actually paid produced **"More than the balance — this will
 * clear it to $0."** Two false statements in the one flow where the user is telling the app what they paid.
 *
 * ⛔ **BOTH SENTENCES ARE ASSERTED, because suppressing one leaves the other.** The `over` note is the
 * louder of the two, and it asserts a comparison against a balance the app has just said it could not read.
 * Lane C named this hazard explicitly: *"they must move together."*
 *
 * ⚠️ **The two predicates are the file's own, imported — not re-derived here.** `C5-4`'s first test copied
 * the expression it was checking and a plant left the suite green; that is not repeated.
 */
import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { logPaymentOverNote, logPaymentSubtitle } from '@/store/logPaymentCopy';
import { rowFieldUnread } from '@/store/trustSelectors';

let passed = 0;
function assert(cond: boolean, label: string): void {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
}
function eq(actual: unknown, expected: unknown, label: string): void {
  assert(actual === expected, `${label} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}

const DAY = '2026-03-02';
const storeWith = (balance: unknown): DebtStore =>
  runMigrations({
    version: 8,
    paycheck: { amount: '2000', currentDate: DAY, nextPaycheckDate: DAY },
    debts: [{ id: 'a', name: 'Chase', balance, originalBalance: 12000, minimumPayment: 100, apr: 20, dueDate: DAY, type: 'debt', recurrence: 'monthly' }],
    prefs: { onboardingComplete: true },
  }) as DebtStore;

export default function run(): void {
  // ── the damaged store: the balance could not be read, and was repaired to 0 ──────────────────────
  const unread = storeWith('n/a');
  const debt = unread.debts[0];
  assert(unread.pendingDataRepairs.length > 0, '⭐ the fixture really did record a repair (or it proves nothing)');
  assert(rowFieldUnread(unread, 'row-figures', 'debt', 'a', 'balance'), '⭐ …and the row-level guard sees it');

  eq(
    logPaymentSubtitle(unread, debt),
    'Chase · balance not read',
    '⛔ C5-3 — the sheet does not say "$0 owed" over a balance it could not read',
  );
  eq(
    logPaymentOverNote(unread, debt, 500),
    undefined,
    '⛔ C5-3 — …and the "more than the balance" note does not fire against that same unread balance',
  );

  // ── ⭐ THE CONTROLS. A sheet that said "balance not read" always, or never warned, passes above. ──
  const healthy = storeWith(12000);
  const okDebt = healthy.debts[0];
  eq(
    logPaymentSubtitle(healthy, okDebt),
    'Chase · $12,000 owed',
    '⭐ C5-3 control — a readable balance is still stated',
  );
  eq(
    logPaymentOverNote(healthy, okDebt, 500),
    undefined,
    '⭐ C5-3 control — a payment UNDER the balance still warns about nothing',
  );
  assert(
    logPaymentOverNote(healthy, okDebt, 20000) !== undefined,
    '⭐ C5-3 control — …and a genuine overpayment on a READ balance still warns',
  );

  console.log(`  ✓ C5-3 — the log-payment sheet states the same balance the row does (${passed} assertions)`);
}
