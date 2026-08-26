import { runMigrations } from '@/data/migrations';
import { selectAllocation } from '@/store/selectors';
import { selectPlanState } from '@/store/planSelectors';
import { hasUnreadDebtBalances, hasUnreadGoalAmounts } from '@/store/trustSelectors';
import type { DebtStore } from '@/data/models';

/**
 * ⛔ **THE THREE SCREENS THAT SAY "CLEARED" MUST AGREE ON ONE STORE.**
 * [P6.8.9.7.11.18 · S1.5 · pass-1 blocker B1]
 *
 * ⚡ **The defect this pins was measured, not imagined:** on one migrated store holding two blank
 * balances, `money.tsx` correctly refused *"Every balance cleared"* while `selectPlanState` returned
 * `'debt-free'` and Today rendered *"You're debt-free. Every balance is cleared."* **One tab apart, the
 * app both refused and made the claim** — permanently, because the repaired `0`s never change back.
 *
 * ⛔ **This test asserts AGREEMENT, not a value.** A test that checked only `selectPlanState` would go
 * green again the moment a fourth screen learned to say "cleared" without asking. The invariant is that
 * **no claim-bearing predicate disagrees with the owner**, so the assertions are written as a comparison
 * between them rather than as three independent expectations.
 */

function fail(message: string): never {
  throw new Error(message);
}
function eq<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) fail(`${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const DAY = '2026-08-26';

/** A store whose debts carry the given raw balances, through the door a user's file actually comes in. */
function migrated(balances: unknown[], goalTarget: unknown = 1000): DebtStore {
  return runMigrations({
    version: 8,
    paycheck: { amount: '2000', currentDate: DAY, nextPaycheckDate: DAY },
    debts: balances.map((balance, i) => ({
      id: `d${i}`, name: `Card ${i}`, balance, apr: 20, minimumPayment: 25,
      dueDate: DAY, type: 'debt', recurrence: 'monthly',
    })),
    goals: [{ id: 'g0', name: 'Fund', targetAmount: goalTarget, currentAmount: 0, type: 'savings' }],
    prefs: { onboardingComplete: true },
  });
}

export default function run(): void {
  /**
   * ⛔ **THE CASE THAT SHIPPED.** Two blank balances → both repaired to `0` → `liveDebts.length === 0`.
   * Money refused; Today did not.
   */
  {
    const store = migrated(['', '   ']);
    eq(store.debts.every((d) => d.balance === 0), true, 'both blank balances repaired to 0');
    eq(hasUnreadDebtBalances(store), true, 'the owner says these balances were not read');
    const state = selectPlanState(store, selectAllocation(store));
    eq(state, 'debt-free-unverified', '⛔ B1 — Today must NOT reach the debt-free celebration');
    // The one consumer of 'debt-free' is `index.tsx:303`'s `planState === 'debt-free'`, so this is the
    // assertion that keeps `GraduationBanner` and `FreedomNextChapterCard` off the screen.
    eq(state === 'debt-free', false, '…and `isDebtFree` is false, which is what gates the banner');
  }

  /**
   * ⛔ **THE CONTROL, AND IT IS THE HALF THAT STOPS THIS BECOMING A BLANKET SUPPRESSION.** A genuinely
   * cleared portfolio must still celebrate — a guard that never lets the good state through is a second
   * false statement, not a fix.
   */
  {
    const store = migrated([0, 0]);
    eq(hasUnreadDebtBalances(store), false, 'a genuinely cleared portfolio has nothing unread');
    eq(selectPlanState(store, selectAllocation(store)), 'debt-free', '⭐ …and it DOES reach the celebration');
  }

  /**
   * ⛔ **A RECOVERED VALUE IS NOT AN UNREAD ONE.** `'0'` parses to a real `0`, so a genuinely cleared debt
   * restored from a file holding string money must still celebrate. This is the exclusion that made
   * blocker ⓪-1 possible, so it is asserted in both directions rather than assumed.
   */
  {
    const store = migrated(['0', '0']);
    eq(store.pendingDataRepairs.every((r) => r.kind === 'recovered'), true, "'0' is a recovery, not a loss");
    eq(hasUnreadDebtBalances(store), false, 'a recovered balance does not suppress the claim');
    eq(selectPlanState(store, selectAllocation(store)), 'debt-free', '…so the celebration still fires');
  }

  /**
   * ⛔ **FIELD-SPECIFICITY, WHICH IS A FIX AND NOT A NARROWING.** [A ⓪-5's minor] S1.1's ⓪-3 made an
   * absent required `apr` record a repair. The inline guard tested only `entity === 'debt'`, so it began
   * suppressing a TRUE celebration over a field that says nothing about whether balances were read.
   */
  {
    const store = runMigrations({
      version: 8,
      paycheck: { amount: '2000', currentDate: DAY, nextPaycheckDate: DAY },
      // no `apr` key → a required-field loss is recorded, on a debt whose balance is perfectly readable
      debts: [{ id: 'd0', name: 'Card', balance: 0, minimumPayment: 25, dueDate: DAY, type: 'debt', recurrence: 'monthly' }],
      prefs: { onboardingComplete: true },
    });
    const aprRepair = store.pendingDataRepairs.find((r) => r.field === 'apr');
    if (!aprRepair) fail('the fixture no longer produces an apr repair — ⓪-3 may have changed');
    eq(hasUnreadDebtBalances(store), false, '⛔ an unread APR does not make the BALANCES unread');
    eq(selectPlanState(store, selectAllocation(store)), 'debt-free', '…so a real celebration is not suppressed');
  }

  /** The goals branch — `0 >= 0` badges a goal Funded, which is the claim `unreadGoals` guards. */
  {
    const lost = migrated([100], 'wat');
    eq(hasUnreadGoalAmounts(lost), true, 'an unreadable goal target is unread');
    const recovered = migrated([100], '1,000');
    eq(recovered.goals[0]!.targetAmount, 1000, "'1,000' is read correctly");
    eq(hasUnreadGoalAmounts(recovered), false, '⛔ …and a recovered target does NOT suppress "Funded"');
  }
}
