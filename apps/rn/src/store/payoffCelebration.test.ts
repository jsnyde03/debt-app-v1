import type { Debt } from '@/data/models';
import { detectPayoff } from '@/store/payoffCelebration';

/**
 * P6.8.7e.1 [B2 / M2-5] — the payoff crossing.
 *
 * ⛔ **The finding: the product's emotional terminus was a premium feature by accident of wiring.** The
 * beat and the finale rendered from a `useState` inside Today, set only by `confirmPayoff`, reached only
 * from `PayoffInvitationCard`, offered only from `selectProvisionalPayoffs` — which returns `[]` for a
 * free user. R3 grepped the whole repo *including `node_modules`*: exactly two files touched
 * `setCelebration`. **A free user could pay off every debt they owned and see nothing.**
 *
 * ⚠️ The celebration is now wired to the CROSSING, so these assertions are about what counts as one. The
 * dangerous direction is over-firing: a finale on a batch re-verify of long-dead debts would turn the
 * once-ever moment into noise, which is worse than the bug.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`payoffCelebration: ${label}`);
  passed += 1;
}
function eq<T>(actual: T, expected: T, label: string) {
  assert(Object.is(actual, expected), `${label} (got ${String(actual)}, expected ${String(expected)})`);
}

function debt(over: Partial<Debt> & { id: string }): Debt {
  return {
    name: `Debt ${over.id}`,
    balance: 1000,
    minimumPayment: 50,
    apr: 20,
    dueDate: '2026-09-01',  // fixture-date-ok: passenger — PLANTED 2020-01-01 across all 11 sites, `test:app` stayed green, so no assertion here reads this date against the clock
    type: 'debt',
    recurrence: 'monthly',
    ...over,
  } as Debt;
}

export default async function run() {
  // ── A single debt clearing while others live → the contained per-debt beat. ─────────────────────
  {
    const before = [debt({ id: 'a', balance: 400, originalBalance: 1200, minimumPayment: 75 }), debt({ id: 'b', balance: 900, apr: 10 })];
    const after = [{ ...before[0], balance: 0 }, before[1]];
    const result = detectPayoff(before, after, 'avalanche', new Set());
    assert(result?.kind === 'beat', 'clearing one of two debts fires the BEAT');
    if (result?.kind === 'beat') {
      eq(result.debtName, 'Debt a', 'named for the debt that cleared');
      // ⛔ Read from the BEFORE state. After the crossing the balance is 0, so `originalBalance` is the
      // only surviving record of what was cleared — reconstructing this later reports nothing.
      eq(result.amount, 1200, 'and it reports what that debt STARTED at, not its (now zero) balance');
      eq(result.freed, 75, 'and the monthly payment the payoff just freed, forever');
      eq(result.nextDebtName, 'Debt b', 'and what the plan attacks next');
    }
  }

  // ── The LAST live debt clearing → the once-ever finale. ─────────────────────────────────────────
  {
    const before = [debt({ id: 'a', balance: 0 }), debt({ id: 'b', balance: 250 })];
    const after = [before[0], { ...before[1], balance: 0 }];
    eq(detectPayoff(before, after, 'snowball', new Set())?.kind, 'finale', 'clearing the last live debt fires the FINALE');
  }

  /**
   * ⛔ **S1.13.7.8 [pass-6, after-scan] — `unreadBalanceIds` HAD NO UNIT COVERAGE AT ALL.**
   *
   * `S1.13.7.4`'s `B1-1` added this parameter — required, not defaulted, for the reason its own docblock
   * gives — and **every call in this file passed `new Set()`**, so the behaviour it was added for was
   * asserted nowhere. ⚡ The only test that exercised it was an e2e (`data-recovery.spec.ts` C3), and
   * that test pinned the OLD design and **had been red since `d6fd015d`**. This is the sub-step's own
   * class, one level up: the fix reached the production call site and the coverage did not follow.
   *
   * ⚠️ **Both directions, because the parameter changes two separate decisions**: a repaired-to-$0 unread
   * balance is not a CROSSING (nothing to celebrate), and it is still LIVE afterwards (so clearing its
   * neighbour is a beat, not the finale).
   */
  {
    // ⛔ Chase's balance could not be read and repaired to 0. Visa clears. This is NOT debt-free.
    const before = [debt({ id: 'chase', balance: 0, originalBalance: 12000 }), debt({ id: 'visa', balance: 400, originalBalance: 400 })];
    const after = [before[0], { ...before[1], balance: 0 }];
    const unread = new Set(['chase']);

    const result = detectPayoff(before, after, 'snowball', unread);
    assert(result?.kind === 'beat', '⛔ B1-1 — an UNREAD balance repaired to $0 is still live: this is a beat, not the finale');
    if (result?.kind === 'beat') {
      eq(result.debtName, 'Debt visa', 'named for the debt that actually crossed');
      eq(result.nextDebtName, 'Debt chase', '…and the unread debt is what the plan says comes next, because it is not cleared');
    }

    // ⭐ THE CONTROL, and it is the assertion that makes the one above mean something: the SAME states
    // with nothing unread give the finale. Without it, a `detectPayoff` that never fires the finale
    // would pass the row above perfectly.
    eq(detectPayoff(before, after, 'snowball', new Set())?.kind, 'finale', '…while the same states with a READ balance still fire it');

    // ⛔ AND THE MOMENT IS NOT LOST, which is what the old design was protecting. Once the balance is
    // supplied and that debt clears, the crossing happens then and the finale fires — deferred to the
    // true event rather than spent on a portfolio the app could not read.
    const supplied = [debt({ id: 'chase', balance: 12000, originalBalance: 12000 }), debt({ id: 'visa', balance: 0, originalBalance: 400 })];
    const cleared = [{ ...supplied[0], balance: 0 }, supplied[1]];
    eq(detectPayoff(supplied, cleared, 'snowball', new Set())?.kind, 'finale', '⭐ …and the finale still arrives when the real last debt clears');
  }

  // ── ⛔ THE OVER-FIRING GUARD. Both halves of `before > 0 && after <= 0` matter. ──────────────────
  //
  // The Payday Autopilot re-verifies balances in batch, and a long-cleared debt is re-confirmed at $0
  // every time. Without the `before > 0` half, every one of those confirms would fire the finale.
  {
    const settled = [debt({ id: 'a', balance: 0 }), debt({ id: 'b', balance: 0 })];
    eq(
      detectPayoff(settled, settled, 'avalanche', new Set()),
      null,
      '⛔ re-verifying already-cleared debts at $0 fires NOTHING — the finale is once-ever, not once-per-confirm',
    );
  }
  {
    const before = [debt({ id: 'a', balance: 500 })];
    const after = [debt({ id: 'a', balance: 300 })];
    eq(detectPayoff(before, after, 'avalanche', new Set()), null, 'a payment that does not clear the debt fires nothing');
  }
  {
    // A debt that VANISHED was deleted, not paid off. Nothing may read "gone" as "cleared".
    const before = [debt({ id: 'a', balance: 500 }), debt({ id: 'b', balance: 100 })];
    const after = [before[1]];
    eq(detectPayoff(before, after, 'avalanche', new Set()), null, '⛔ a DELETED debt is not a payoff');
  }
  {
    // The empty plan. Nothing was live, so nothing crossed.
    eq(detectPayoff([], [], 'avalanche', new Set()), null, 'an empty plan fires nothing');
  }

  // ── A batch clearing several at once. ───────────────────────────────────────────────────────────
  {
    // ⚠️ Two cleared, one still live → ONE beat, not two full-screen overlays stacked on each other.
    const before = [debt({ id: 'a', balance: 100, apr: 30 }), debt({ id: 'b', balance: 200, apr: 5 }), debt({ id: 'c', balance: 900 })];
    const after = [{ ...before[0], balance: 0 }, { ...before[1], balance: 0 }, before[2]];
    const result = detectPayoff(before, after, 'avalanche', new Set());
    assert(result?.kind === 'beat', 'a batch clearing two of three still fires ONE beat');
    if (result?.kind === 'beat') {
      eq(result.debtName, 'Debt a', 'and the strategy picks which one speaks for the moment (avalanche → highest APR)');
    }
  }
  {
    // ⛔ …and clearing the last TWO in one batch is a finale, not a beat. Deciding on `crossed.length`
    // rather than on what remains live would have produced a beat pointing at no next debt.
    const before = [debt({ id: 'a', balance: 100 }), debt({ id: 'b', balance: 200 })];
    const after = [{ ...before[0], balance: 0 }, { ...before[1], balance: 0 }];
    eq(detectPayoff(before, after, 'avalanche', new Set())?.kind, 'finale', '⛔ clearing the last two at once is ONE finale');
  }

  // ── A debt with no recorded original still gets its moment. ─────────────────────────────────────
  {
    const before = [debt({ id: 'a', balance: 400, originalBalance: undefined }), debt({ id: 'b', balance: 900 })];
    const after = [{ ...before[0], balance: 0 }, before[1]];
    const result = detectPayoff(before, after, 'snowball', new Set());
    assert(result?.kind === 'beat', 'a debt with no recorded original still celebrates');
    if (result?.kind === 'beat') {
      eq(result.amount, null, 'it just declines to claim a total it never knew — never a 0, which would read as "$0 paid off"');
    }
  }

  console.log(`✅ payoff celebration (B2) tests passed (${passed} asserts).`);
}
