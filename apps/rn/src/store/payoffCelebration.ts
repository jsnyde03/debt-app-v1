import type { Debt, PendingPayoff, PayoffStrategy } from '@/data/models';

import { rankDebts } from './payoffSelectors';

/**
 * P6.8.7e.1 [B2 / M2-5] — **detect a debt reaching $0, wherever it happens.**
 *
 * ⛔ **The finding was not "the celebration is gated"; it was that the celebration was wired to the wrong
 * event.** It fired from `confirmPayoff`, which is reachable only from `PayoffInvitationCard`, which is
 * offered only from `selectProvisionalPayoffs` — and that returns `[]` for a free user. So the moment the
 * product is built toward was attached to *the premium estimator noticing a payoff* rather than to **the
 * payoff**. A free user could clear every debt they owned and see nothing.
 *
 * ⚠️ **The premium line is deliberately untouched.** Premium still buys the app *spotting* a payoff the
 * user has not confirmed — that removes WORK, which is the premium spec's own price test. A celebration
 * removes no work; it is the moment itself, and it belongs to whoever reached it.
 *
 * ⛔ **Captured at the crossing, never reconstructed after.** By the time anything renders, the balance is
 * zero and the ranking has moved on — so *what was cleared* and *what is next* are only knowable from the
 * BEFORE state. This is the one property the old in-component version got right, and losing it in the move
 * would have been a fix that reintroduced its own defect.
 */
export function detectPayoff(
  before: Debt[],
  after: Debt[],
  strategy: PayoffStrategy,
): PendingPayoff | null {
  const liveBefore = before.filter((d) => d.balance > 0);
  if (liveBefore.length === 0) return null;

  // ⚠️ `before > 0 && after <= 0`, and BOTH halves matter. Re-verifying an already-cleared debt at $0 is a
  // normal thing the Payday Autopilot does in batch; celebrating it would fire the finale on a debt the
  // user cleared months ago, every time they confirmed a batch.
  const afterById = new Map(after.map((d) => [d.id, d]));
  const crossed = liveBefore.filter((d) => {
    const now = afterById.get(d.id);
    // ⛔ A debt that VANISHED was deleted, not paid off. `removeDebt` does not move a balance, so it
    // cannot reach this function today — but "gone" must never read as "cleared" if it ever does.
    return now !== undefined && now.balance <= 0;
  });
  if (crossed.length === 0) return null;

  // Every live debt is now clear → the once-ever finale. ⚠️ Checked against what is live AFTER, not
  // against `crossed.length`, so clearing the last two in one batch is one finale rather than a beat.
  const liveAfter = after.filter((d) => d.balance > 0);
  if (liveAfter.length === 0) return { kind: 'finale' };

  // Otherwise the contained per-debt beat. On a batch that cleared several, the first ranked one speaks
  // for the moment — several full-screen beats in a row would bury the thing they are celebrating.
  const subject = rankDebts(crossed, strategy)[0] ?? crossed[0];
  const next = rankDebts(liveAfter, strategy)[0];
  return {
    kind: 'beat',
    debtName: subject.name,
    debtId: subject.id,
    amount: subject.originalBalance ?? null,
    freed: subject.minimumPayment,
    nextDebtName: next?.name ?? null,
  };
}
