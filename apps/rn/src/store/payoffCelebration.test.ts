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
    dueDate: '2026-09-01',
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
    const result = detectPayoff(before, after, 'avalanche');
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
    eq(detectPayoff(before, after, 'snowball')?.kind, 'finale', 'clearing the last live debt fires the FINALE');
  }

  // ── ⛔ THE OVER-FIRING GUARD. Both halves of `before > 0 && after <= 0` matter. ──────────────────
  //
  // The Payday Autopilot re-verifies balances in batch, and a long-cleared debt is re-confirmed at $0
  // every time. Without the `before > 0` half, every one of those confirms would fire the finale.
  {
    const settled = [debt({ id: 'a', balance: 0 }), debt({ id: 'b', balance: 0 })];
    eq(
      detectPayoff(settled, settled, 'avalanche'),
      null,
      '⛔ re-verifying already-cleared debts at $0 fires NOTHING — the finale is once-ever, not once-per-confirm',
    );
  }
  {
    const before = [debt({ id: 'a', balance: 500 })];
    const after = [debt({ id: 'a', balance: 300 })];
    eq(detectPayoff(before, after, 'avalanche'), null, 'a payment that does not clear the debt fires nothing');
  }
  {
    // A debt that VANISHED was deleted, not paid off. Nothing may read "gone" as "cleared".
    const before = [debt({ id: 'a', balance: 500 }), debt({ id: 'b', balance: 100 })];
    const after = [before[1]];
    eq(detectPayoff(before, after, 'avalanche'), null, '⛔ a DELETED debt is not a payoff');
  }
  {
    // The empty plan. Nothing was live, so nothing crossed.
    eq(detectPayoff([], [], 'avalanche'), null, 'an empty plan fires nothing');
  }

  // ── A batch clearing several at once. ───────────────────────────────────────────────────────────
  {
    // ⚠️ Two cleared, one still live → ONE beat, not two full-screen overlays stacked on each other.
    const before = [debt({ id: 'a', balance: 100, apr: 30 }), debt({ id: 'b', balance: 200, apr: 5 }), debt({ id: 'c', balance: 900 })];
    const after = [{ ...before[0], balance: 0 }, { ...before[1], balance: 0 }, before[2]];
    const result = detectPayoff(before, after, 'avalanche');
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
    eq(detectPayoff(before, after, 'avalanche')?.kind, 'finale', '⛔ clearing the last two at once is ONE finale');
  }

  // ── A debt with no recorded original still gets its moment. ─────────────────────────────────────
  {
    const before = [debt({ id: 'a', balance: 400, originalBalance: undefined }), debt({ id: 'b', balance: 900 })];
    const after = [{ ...before[0], balance: 0 }, before[1]];
    const result = detectPayoff(before, after, 'snowball');
    assert(result?.kind === 'beat', 'a debt with no recorded original still celebrates');
    if (result?.kind === 'beat') {
      eq(result.amount, null, 'it just declines to claim a total it never knew — never a 0, which would read as "$0 paid off"');
    }
  }

  console.log(`✅ payoff celebration (B2) tests passed (${passed} asserts).`);
}
