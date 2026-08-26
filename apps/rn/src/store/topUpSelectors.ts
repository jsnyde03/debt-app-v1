import type { CycleTopUpEntry, DebtStore } from '@/data/models';

/**
 * ⛔ S1.5.3 [B3] — THE ONE READER of this cycle's top-up entries, legacy blobs included.
 *
 * Two independent one-tap money moves write here — the Guardian's tight top-up and the affordability
 * card's cover-a-dip — and each has its own Undo. The record used to be a single accumulated `amount`
 * with a single `goalId`, so the second flow overwrote the first's source and one Undo handed both draws
 * back to the wrong goal ($70 permanently teleported between two savings goals, aggregate conserved).
 * A second undo could also fire from stale component state and invent $50. `entries` is what makes each
 * undo able to find its OWN draw.
 *
 * **Cycle-keyed:** a record from a cycle that already rolled describes money the waterfall has since
 * refilled, so it reads as nothing rather than being handed back twice.
 *
 * ⚠️ **Legacy blobs.** A pre-S1.5.3 record has `amount`/`goalId` and no `entries`; it reads as a single
 * `'guardian'` entry, which is the behaviour it already had — the Guardian card was the only surface that
 * could undo from the store at all. A legacy record with **no** `goalId` reads as NO entries, matching
 * `selectAppliedTopUp`'s existing rule that a sourceless record offers no control rather than one that
 * would fail. No migration is needed and none should be added: the record is cycle-keyed, so any legacy
 * one stops being read at the next rollover.
 *
 * ⛔ Lives in its own module rather than in `store.ts` because `guardianSelectors` needs it too, and
 * `guardianSelectors → store` would close an import cycle.
 */
export function topUpEntries(store: DebtStore): CycleTopUpEntry[] {
  const rec = store.cycleTopUp;
  if (!rec || rec.forCycle !== store.paycheck.nextPaycheckDate) return [];
  if (rec.entries) return rec.entries.filter((e) => e.amount > 0);
  return rec.goalId && rec.amount > 0 ? [{ source: 'guardian', goalId: rec.goalId, amount: rec.amount }] : [];
}

/**
 * Rebuild the record from its entries.
 *
 * ⛔ **`amount` is DERIVED — never written independently** — so the total the cushion is credited with
 * cannot drift from the sum of what actually left the goals. *Σ `cycleTopUp` must equal what actually
 * left the goals* is the invariant nothing asserted, and both of [B3]'s variants broke it: one by
 * accumulating across two sources under one id, the other by letting a second undo drive it to −50 where
 * `Math.max(0, …)` hid the corruption.
 *
 * `goalId` is still written when there is exactly one entry, purely so an older reader (or an older build
 * opening a newer blob) still sees a single source. It is never the source of truth.
 */
export function buildCycleTopUp(forCycle: string, entries: CycleTopUpEntry[]): DebtStore['cycleTopUp'] {
  const live = entries.filter((e) => e.amount > 0);
  const amount = Math.round(live.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
  return live.length === 1 ? { forCycle, amount, goalId: live[0].goalId, entries: live } : { forCycle, amount, entries: live };
}

/** The top-up already applied for the CURRENT cycle (cycle-keyed → a stale one self-corrects). */
export function appliedTopUp(store: DebtStore): number {
  return store.cycleTopUp?.forCycle === store.paycheck.nextPaycheckDate ? Math.max(0, store.cycleTopUp.amount) : 0;
}

/**
 * ⛔ **S1.9.3 [pass-2 A1] — THE TOP-UP IS NETTED AGAINST THE SHORTFALL EXACTLY ONCE, AND EVERY READ TAKES
 * THE RESULT.** 🎯 2026-08-26 chose this rule.
 *
 * ⚡ **Three reads of the same money, and the fix range before this moved two of them.** M3 made the band
 * net the shortfall; AS-3 made the affordability figure a blanket `0` while short; `holdsLine` was left on
 * the old expression. Measured: a premium user **$1 short** after moving $200 at the Guardian's own
 * suggestion was told a $20 purchase would leave them *"$20 short"*, in the same card saying the $200
 * *"holds your line"*, with **$199 unspent**.
 *
 * ⛔ **Every existing test passed under BOTH implementations** — the whole tree fixed `topUp 200` against
 * `shortfall 400`, the one member of the class where a blanket `0` and netting agree exactly.
 *
 * The two quantities are complements: a dollar of top-up is spent on the shortfall or it is cushion,
 * never both.
 *
 *  - **`residual`** — what the paycheck still cannot cover. ⛔ This **HONOURS M3 rather than reverting it**:
 *    M3's defect was a top-up lifting a *proxy* while the shortfall itself went untouched, and here the
 *    money is applied to the shortfall first, so `shortfall > 0 → at-risk` stays the band's rule verbatim.
 *  - **`surplus`** — what is left over, and the only part that can be cushion.
 *
 * ⚠️ **A real behaviour change, stated rather than discovered:** a top-up that genuinely covers a small
 * shortfall now clears the band. AS-3's docblock rejected netting for fear of leaving a small spare beside
 * an `at-risk` band; under this rule the band is not `at-risk` in that range, so the case cannot arise.
 *
 * ⛔ **HERE, and not in `guardianSelectors`, because THREE producers need it** [S1.9.6 · pass-2 D2-1] —
 * the card, `selectPlanSummary` and the forecast. `computeState`'s own docblock requires them to derive
 * the band from one function *"so they can never disagree"*, and they were passing it three different
 * first arguments. This module already exists to be the one owner a `guardianSelectors → store` import
 * cycle would otherwise prevent.
 */
export function nettedTopUp(store: DebtStore, cycleShortfall: number | undefined): { residual: number; surplus: number } {
  const topUp = appliedTopUp(store);
  // ⚠️ A plain number, not an `Allocation`: `forecastCycles` is deliberately free of a `selectors` import
  // to avoid a cycle, and it holds an `AllocationResult` rather than an `Allocation`. The shortfall is
  // the only field this needs, so asking for it directly lets all THREE producers share one owner.
  const shortfall = Math.max(0, cycleShortfall ?? 0);
  return {
    residual: Math.round(Math.max(0, shortfall - topUp) * 100) / 100,
    surplus: Math.round(Math.max(0, topUp - shortfall) * 100) / 100,
  };
}
