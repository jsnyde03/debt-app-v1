import type { Debt } from "@core/storage/debtPlannerStorage";

/**
 * [P6.8.9.7.11.15 · D62] `originalBalance` is a HIGH-WATER MARK — the most this debt has ever been.
 *
 * ⛔ **The field name no longer describes the field, and that is deliberate** ([D62]): renaming a
 * persisted field is a migration for no user-visible gain in 2.0. Read the name as *"the most you ever
 * owed"*, which is what every consumer of it actually wants.
 *
 * ## Why this exists
 *
 * It was stamped once at creation and **no edit path updated it**, so a balance revised UPWARD left it
 * behind and `paid = original − balance` went negative. ⚡ **The deciding case is not a setback, it is a
 * CORRECTION**: a typo at entry, or a premium user verifying a stale estimate upward against a statement.
 * Enter `$500`, fix it to `$5,000`, and the journey ring reads **0% for the next $4,500 of real
 * repayment, permanently.** ⚠️ `verifyDebtBalances` is a flow the app *asks* people to use, so the old
 * behaviour pointed a disincentive at the behaviour the product wants.
 *
 * ## ⚠️ ONE RULE, INCLUDING BNPL — and the case for exempting it was measured false
 *
 * `bnplPaymentsTotal` divides this field to produce the user-facing **"payment 2 of 4"**, which looks
 * like a reason to leave installment plans alone. **It is not**, because that function is
 * `max(remaining, basis / scheduled)`: a stamp can only ever RAISE the total, and `balance` on an
 * installment plan is `scheduled × remaining`, so the total rises only when the plan itself gets longer.
 * Measured across the lifecycle — fresh, half-paid, and a plan corrected 2→4 — the count a user reads is
 * either unchanged or **more** correct with a stamp than without one (`"3 of 4"` where an unstamped plan
 * says `"1 of 2"`).
 *
 * ⛔ **`addDebt` skips BNPL for a different reason than it appears to.** Its comment says the row *"shows
 * 'X of N', not a bar"* — it is declining to draw a **momentum bar**, not protecting the count. Reading
 * that exemption as being about `bnplPaymentsTotal` is an inference, and it was wrong.
 *
 * ## One owner
 *
 * ⛔ **Six writers stamped this field and they already disagreed** — `addDebt` (with the BNPL carve-out),
 * the expense→debt conversion (without one, deliberately), two `DebtSheet` paths, the CSV import and the
 * v1.6 bridge backfill. `.11.12.3` closed a defect that existed *because* four consumers each decided a
 * rule for themselves. A seventh inline `Math.max` is that defect reproduced, so every seam calls this.
 */
export function raiseOriginalBalance<T extends Pick<Debt, "balance" | "originalBalance">>(debt: T): T {
	const balance = typeof debt.balance === "number" && Number.isFinite(debt.balance) ? debt.balance : 0;
	const current = typeof debt.originalBalance === "number" && Number.isFinite(debt.originalBalance) ? debt.originalBalance : undefined;

	// ⚠️ A negative balance is not a high-water mark. `verifyDebtBalances` clamps at its own seam, but the
	// invariant runs over PERSISTED blobs too, and a repaired-to-0 field must not lower a real stamp.
	const next = Math.max(current ?? 0, balance, 0);

	// Return the SAME object when nothing moves. The migration invariant runs on every hydrate and
	// `mapLegacyStore` reports "how many debts changed" by identity — a new object every read would
	// report a repair that did not happen.
	if (current !== undefined && next === current) return debt;
	if (current === undefined && next === balance && balance <= 0) return debt;
	return { ...debt, originalBalance: next };
}
