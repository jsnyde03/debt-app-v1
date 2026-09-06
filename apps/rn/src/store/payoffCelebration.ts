import { bnplMonthlyEquivalentMinimum } from '@core/debt/bnplPayoffPace';

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
  /**
   * ⛔ **S1.13.7.4 [pass-6 `B1-1`] — THE ONCE-EVER FINALE WAS DECIDED ON `balance > 0`, SO AN UNREAD
   * BALANCE IS WHAT EMPTIED THE LIST.**
   *
   * ⚡ Measured through the real wired store: restore a backup with one unreadable balance (repaired to
   * `0`), pay off the other card → `pendingPayoff: finale`, correctly gagged by `selectCelebration`. Then
   * the user does exactly what the repair card asks and retypes the lost **$12,000** — `mayClaim` flips
   * true, **the stamped record is never re-examined**, and the full-screen *"you are debt-free"* finale
   * fires over a live $12,000 debt, reading *"$15,000 paid off · 1 debt"*. **It fires once and cannot be
   * got back.**
   *
   * ⛔ **The render gate is a DELAY, not a filter** — the record outlives the condition it was gated on,
   * so answering the repair is the very event that both makes the record false *and* lifts the gag.
   *
   * ⚠️ **REQUIRED, not defaulted.** A default empty set would preserve the defect at any caller that
   * forgot to pass it — `tested-helper-is-not-a-used-helper`, where the clamp existed and was correct
   * while the defect shipped, because what was missing was the call.
   */
  unreadBalanceIds: ReadonlySet<string>,
  /**
   * ⛔ **[class 4 round-3 `R3-4`] `freed` IS A PER-MONTH FIGURE AND WAS BUILT FROM THE PER-INSTALLMENT
   * MINIMUM.** The beat read **"Freed $50/mo"** where a weekly debt frees **$216.67** — on screen, in
   * speech, and on a ShareCard, understating the user's own win by 4.33× on the one moment the product
   * is built toward.
   *
   * ⚡ **Why nobody's site list caught it:** `bnplMonthlyEquivalentMinimum` is the declared producer of
   * *this debt's cost per month* and every call site of it is a **projection engine**. A celebration
   * is not a projection, so it was never in the population anyone enumerated — the sixth consecutive
   * undercount of that list. ⚠️ **The field name carries no unit**; `/mo` appears two files away.
   *
   * ⚠️ **REQUIRED, not defaulted** — `A5-1`, and the same reasoning as `unreadBalanceIds` above: a
   * default would leave every caller that forgot it silently assuming a monthly cadence, which is the
   * exact defect. Every call site is a typecheck error until it passes a real value.
   */
  cyclesPerMonth: number,
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
    // ⛔ B1-1 — a repaired-to-$0 UNREAD balance is not a debt that was paid off. It is a debt whose
    // number the app could not read, and reading it as `cleared` is what stamps a false finale.
    return now !== undefined && now.balance <= 0 && !unreadBalanceIds.has(now.id);
  });
  if (crossed.length === 0) return null;

  // Every live debt is now clear → the once-ever finale. ⚠️ Checked against what is live AFTER, not
  // against `crossed.length`, so clearing the last two in one batch is one finale rather than a beat.
  const liveAfter = after.filter((d) => d.balance > 0 || unreadBalanceIds.has(d.id));
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
    /**
     * ⛔ **A ONE-TIME LUMP FREES NO RECURRING MONTHLY CASH, AND `bnplMonthlyEquivalentMinimum`
     * RETURNS ITS WHOLE BALANCE.** [round-4 `R4-1`, blocker — a regression `R3-4` introduced]
     *
     * ⚡ Measured: a $600 Pay-in-30 whose minimum is $50 announced **"Freed $600/mo"** — 12×, on
     * screen, in speech and on the ShareCard. The producer's own header says every caller must
     * exclude the lump with `isOneTimeBnplLump`; ⛔ **`R3-4` read that pairing at four sites, wrote
     * "pairs correctly at all four", and then created the fifth without it.** The class's own defect,
     * inside the fix for a member of it.
     *
     * ⚠️ **0 is the honest figure, not the stored minimum.** Every surface already omits the clause
     * at 0 — `showCascade` gates the text and the utterance, and `ShareCard` gates the badge.
     */
    // ⛔ [round-5 `R5-1`] THE QUESTION IS THE SCHEDULE, NOT THE LABEL. `R4-1` reached for
    // `isOneTimeBnplLump`, which is `type === 'bnpl' && recurrence === 'one-time'`, so a plain debt
    // with a one-time schedule still announced a recurring $50/mo that does not exist — reachable by
    // CSV import and by switching a Klarna plan's type to Debt. ⚡ **This is `A3-1`'s own rule, which
    // this workstream established and I then broke: a cadence is a fact about the SCHEDULE, not the
    // debt's label.** Third time this line has been wrong.
    //
    // ⚠️ Scoped HERE rather than by widening `isOneTimeBnplLump`, which `projectDebtPayoff` and
    // `buildPayoffTrajectory` read as the flag driving a month-1 clearing payment: widening it would
    // move the debt-free date and the chart for every non-BNPL one-time debt at once. Separate
    // question, filed, and it must not ride in on a celebration fix.
    freed: subject.recurrence === 'one-time' ? 0 : bnplMonthlyEquivalentMinimum(subject, cyclesPerMonth),
    nextDebtName: next?.name ?? null,
  };
}
