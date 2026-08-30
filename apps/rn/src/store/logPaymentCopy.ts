import { formatCurrency } from '@core/utils/formatCurrency';

import type { Debt, DebtStore } from '@/data/models';
import { rowFieldUnread } from '@/store/trustSelectors';

/**
 * ⛔ **S1.12.5.6 [pass-5 `C5-3`] — "Log payment" SAID "$0 owed" ON A CARD THE USER OWES $12,000 ON, ONE
 * TAP BELOW A ROW THAT CORRECTLY PRINTED AN EM DASH.**
 *
 * ⚡ Restore a backup where a balance could not be read: Money puts the debt under **BALANCE UNREAD** and
 * the row prints `—`, exactly as pass-3 `C-1` intended. Open it, tap **Log payment**, and the header read
 * **"Chase · $0 owed"**; type the $500 actually paid and the field said **"More than the balance — this
 * will clear it to $0."** Two false statements in the one flow where the user is telling the app what they
 * paid.
 *
 * ⚠️ **The write was NOT damaged, and that was checked rather than assumed** — `logManualPayment` clamps
 * to `0`, the repair record survives because the value did not move, and no celebration fires. **The
 * defect is the two sentences.** *"A remedy that deletes a debt from the screen"* is this round's named
 * hazard, and reporting a data-loss that is not there would have been easy.
 *
 * ⛔ **`'row-figures'` is the claim, the same one the row beside it asks.** Its population was taken to be
 * *"rows in a list"*, so every SHEET restating the same row's money was outside it by construction —
 * `lint:trust-claims` reports 0 open claim sites while eight sheets reference no trust selector at all.
 * ⚠️ Lane C measured only this one; the rest are a population to check, named in `C-screens.md`.
 *
 * ## Why these live in a store module rather than in the component
 *
 * ⛔ **A test has to reach the REAL predicate.** `C5-4`'s first test in this round asserted a COPY of the
 * expression it was checking and a plant left the suite green — `tested-helper-is-not-a-used-helper`.
 * The app-layer runner only loads modules with no `react-native` import (its own header says so), so a
 * helper exported from the `.tsx` is unreachable by any test. Here, both the sheet and the test call the
 * same function.
 */

/** The sheet's header line: the debt and what is owed, or an honest refusal to state it. */
export function logPaymentSubtitle(store: DebtStore, debt: Debt): string {
  return rowFieldUnread(store, 'row-figures', 'debt', debt.id, 'balance')
    ? `${debt.name} · balance not read`
    : `${debt.name} · ${formatCurrency(debt.balance)} owed`;
}

/**
 * The over-payment note, or `undefined` when there is nothing honest to say.
 *
 * ⛔ **PAIRED WITH THE SUBTITLE ON PURPOSE.** Suppressing the header's figure alone leaves this firing —
 * *"More than the balance"* — which is the louder of the two sentences, and it asserts a comparison
 * against a balance the app has just said it could not read. `snapshot.ts` states the same rule for its
 * four figures: they degrade together, or the fix is cosmetic.
 */
export function logPaymentOverNote(store: DebtStore, debt: Debt, parsed: number | null): string | undefined {
  if (rowFieldUnread(store, 'row-figures', 'debt', debt.id, 'balance')) return undefined;
  return parsed != null && parsed > debt.balance ? 'More than the balance — this will clear it to $0.' : undefined;
}
