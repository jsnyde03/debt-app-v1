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
