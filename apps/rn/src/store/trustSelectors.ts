import type { DebtStore } from '@/data/models';

/**
 * ⛔ **THE ONE OWNER OF *"MAY THE APP MAKE A CLAIM ABOUT THIS MONEY?"***
 * [P6.8.9.7.11.18 · S1.5 · pass-1 blocker B1]
 *
 * ⚡ **The whole app had exactly TWO trust guards and both were inline in `money.tsx`.** Meanwhile the
 * same claim was made, unguarded, from two other places: `selectPlanState` → `GraduationBanner`
 * (*"You're debt-free. Every balance is cleared."*) and `progress.tsx`'s *"Every balance paid off"* hero.
 * Measured on one migrated store with two blank balances: **Money refused the claim while Today made it.**
 * ⛔ **One tab apart, on one store, the app both refused and asserted the same sentence** — and the
 * repaired `0`s are permanent, so both screens keep celebrating for the life of the install.
 *
 * ⛔ **ANOTHER COPY OF THE CONJUNCT WAS THE WRONG FIX AND IS WHY THIS FILE EXISTS.** Call sites carrying
 * the same rule independently had **already** disagreed once this week: that was M9, where one goal was
 * called a different thing on every screen that named it, because each site tested `type === 'emergency'`
 * for itself. The remedy there was to ask **one owner** (`primaryEmergencyGoal`), and this is the same
 * remedy for the same shape. ⚠️ **The class recurs every time a new screen learns to say "cleared"**, so
 * the guard has to be a function a new screen can *find*, not a pattern it has to *remember*.
 *
 * ⚠️ **`selectPlanState` returns `'debt-free-unverified'` rather than calling this at the render site.**
 * Making the state unrepresentable beats making the check easy: a screen that forgets to ask gets a state
 * it does not handle, instead of a celebration it should not show.
 */

/**
 * Is there a repair on a debt's **balance** that was not a clean recovery?
 *
 * ⛔ **FIELD-SPECIFIC, AND THAT IS A FIX RATHER THAN A NARROWING.** [A ⓪-5's minor] `money.tsx`'s inline
 * guard tested `r.entity === 'debt'` with no field test. That was harmless while `balance` was nearly the
 * only debt field that could produce a repair — and **S1.1's own ⓪-3 fix made it wrong**, because an
 * absent required `apr` or `minimumPayment` now records a repair too, and neither says anything about
 * whether the balances are trustworthy. The claim is about balances, so the guard reads balances.
 *
 * ⚠️ **`recovered` is deliberately excluded and the exclusion is load-bearing in BOTH directions.** A
 * recovered value is exactly right and only its format was wrong (`'4,000'` → `4000`), so suppressing a
 * true celebration over one would be its own false statement. ⛔ **And that exclusion is precisely what
 * made blocker ⓪-1 possible** — `Number('')` was `0` and classified `recovered` — which is why the
 * classification itself is pinned by `migrations.test.ts`'s table rather than trusted here.
 */
export function hasUnreadDebtBalances(store: DebtStore): boolean {
  return store.pendingDataRepairs.some(
    (r) => r.entity === 'debt' && r.field === 'balance' && r.kind !== 'recovered',
  );
}

/**
 * Is there any repair on a goal that was not a clean recovery?
 *
 * ⚠️ **Not field-specific, unlike the debts branch, and the asymmetry is deliberate.** The goals claim the
 * app makes is *"Funded"*, which is `currentAmount >= targetAmount` — **both** sides of that comparison
 * are money fields that repair to `0`, and `0 >= 0` badges a goal Funded. A goal's `priorityPerPaycheck`
 * repairing does not touch the comparison, but it does mean the row's money was mangled, and the cost of
 * suppressing one true "Funded" badge is far below the cost of asserting a false one.
 */
export function hasUnreadGoalAmounts(store: DebtStore): boolean {
  return store.pendingDataRepairs.some((r) => r.entity === 'goal' && r.kind !== 'recovered');
}
