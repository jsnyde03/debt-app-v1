import type { Debt, RequiredExpense } from "@core/storage/debtPlannerStorage";

/**
 * ⛔ **S1.13.7.8 [pass-6 blocker `C2-3`] — THE ONE PRODUCER OF "THIS BILL, AS A DEBT".**
 *
 * 3.7.A10.2's mis-file rescue moves an obligation out of `requiredExpenses` and into `debts` in one
 * write. The prefill for it was an inline object literal in `money.tsx` naming four fields, and
 * **`isAutopay` was not one of them** — so a bill on autopay became a debt the user pays by hand. From
 * the next cycle on `isAutopayPresumedPaid` no longer suppresses it (it requires `isAutopay === true`),
 * the payday check-in asks them to pay it, and the required-actions list shows as outstanding **money
 * the bank has already taken.** Nothing on the convert screen says the setting was dropped: the sheet
 * has an Autopay switch, and it was seeded `false` from a bill that had it on.
 *
 * ⚡ **WHY THIS IS A MODULE AND NOT FOUR MORE KEYS IN THAT LITERAL.** A hand-written prefill is a list,
 * and a list is blind to the field omitted from it — which is how `recurrence` was lost before
 * (`S1.5.3 [B4]`, a quarterly bill filed as a monthly minimum) and `isAutopay` after it. The partition
 * below is **exhaustive by the compiler**: {@link EXPENSE_FIELDS_DROPPED} is keyed on every field of
 * `RequiredExpense` that this function does not carry, so adding a field to `RequiredExpense` **fails
 * `typecheck:core`** until somebody either carries it or writes down why it is dropped. There is no
 * spelling of "I forgot" that compiles.
 *
 * ⚠️ **The user still supplies the balance and the APR** — an expense has neither, and those two are what
 * make an obligation payoff-able. [D22c]: a silent re-file would be a guess about their money. This
 * carries what the bill already knows and nothing else.
 */

/** The fields carried onto the new debt. Everything else must appear in {@link EXPENSE_FIELDS_DROPPED}. */
type CarriedFromExpense =
	| "name"
	| "amount"
	| "dueDate"
	| "recurrence"
	| "isAutopay"
	| "autopayFailedThisCycle"
	| "isPaidThisCycle";

/**
 * ⛔ **EVERY FIELD OF `RequiredExpense` THIS CONVERSION DOES NOT CARRY, WITH THE REASON.**
 *
 * ⚠️ **The type is the gate.** `Exclude<keyof RequiredExpense, CarriedFromExpense>` means the compiler
 * requires an entry for every remaining field and refuses one for a field that does not exist. A
 * hand-maintained list of "fields we checked" would decay the moment `RequiredExpense` grows; this
 * cannot, because the population is derived from the type rather than typed out beside it.
 */
export const EXPENSE_FIELDS_DROPPED: Record<Exclude<keyof RequiredExpense, CarriedFromExpense>, string> = {
	id: "the debt mints its own id from the cycle; the expense row is deleted in the same write",
	originalDueDate:
		"⚠️ DELIBERATE, and the direction matters. It is the recurrence ANCHOR — `advanceDueDateToPlanDate` " +
		"takes its anchor day from `originalDueDate ?? dueDate`. The convert sheet lets the user EDIT the due " +
		"date, so carrying the bill’s anchor would silently override the date they just typed at the first " +
		"rollover. Added debts carry no anchor today (only `debtCsv` stamps one), which is a real gap and is " +
		"filed to the backlog rather than half-closed here.",
	expenseType:
		"fixed-vs-variable describes how much a BILL costs each time. A debt’s per-cycle figure is its " +
		"minimum payment, which the form captures directly.",
	category: "RequiredExpenseCategory has no counterpart on Debt — debts are ranked by the payoff strategy",
	isTrial: "trial/intro pricing is a subscription shape; a debt has a balance and an APR",
	fullAmount: "only meaningful with `isTrial` — see above",
	fullChargeDate: "only meaningful with `isTrial` — see above",
	deferability:
		"the Recovery engine’s essential-vs-deferrable override, which applies to BILLS. Debts are ordered " +
		"by the payoff strategy and are never deferred as a class.",
};

/**
 * A mis-filed bill, as the prefill for the debt sheet. The user supplies `balance` and `apr`.
 *
 * ⚠️ `isPaidThisCycle` is carried onto BOTH of the debt's spellings. `deriveRequiredActionView` reads
 * `debt.minimumPaidThisCycle ?? debt.isPaidThisCycle`, so dropping it would ask a user who has already
 * paid this cycle's bill to pay it again the moment they re-file it — the same consequence as the
 * autopay loss, one branch over.
 */
export function debtPrefillFromExpense(expense: RequiredExpense): Partial<Debt> {
	return {
		name: expense.name,
		minimumPayment: expense.amount,
		dueDate: expense.dueDate,
		recurrence: expense.recurrence,
		isAutopay: expense.isAutopay,
		autopayFailedThisCycle: expense.autopayFailedThisCycle,
		isPaidThisCycle: expense.isPaidThisCycle,
		minimumPaidThisCycle: expense.isPaidThisCycle,
	};
}
