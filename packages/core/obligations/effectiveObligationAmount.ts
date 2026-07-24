import type { RequiredExpense } from "@core/storage/debtPlannerStorage";

/**
 * §2.5 trial / intro-price resolution. A trial obligation bills its entered `amount` (often $0 or a low
 * intro) until its occurrence reaches `fullChargeDate`, then bills `fullAmount`. Because the forecast
 * advances each obligation's `dueDate` per cycle (rollover), keying off the obligation's OWN `dueDate`
 * makes the conversion fall in the correct projected cycle with no cycle index threaded in.
 *
 * Returns the amount this obligation actually charges in the cycle its `dueDate` falls in. A non-trial
 * obligation — or a trial missing its full-price / kick-in date — returns `amount` unchanged, so this is
 * a strict no-op for every obligation that predates 2.5. Date compare is lexicographic on ISO yyyy-mm-dd.
 */
export function effectiveRequiredExpenseAmount(e: RequiredExpense): number {
	if (
		e.isTrial &&
		e.fullAmount != null &&
		Number.isFinite(e.fullAmount) &&
		e.fullChargeDate &&
		e.dueDate >= e.fullChargeDate
	) {
		return e.fullAmount;
	}
	return e.amount;
}

/**
 * Map a set of obligations to their effective (trial-resolved) amounts for the cycle their `dueDate` is
 * in. Applied at each store→engine boundary so every allocation / forecast consumer prices trials
 * correctly without changing the engine's narrow `Expense` contract. Idempotent, and a reference-stable
 * no-op for any obligation whose amount doesn't change (so re-resolving already-resolved input is safe).
 */
export function resolveTrialAmounts(expenses: RequiredExpense[]): RequiredExpense[] {
	return expenses.map((e) => {
		const effective = effectiveRequiredExpenseAmount(e);
		return effective === e.amount ? e : { ...e, amount: effective };
	});
}
