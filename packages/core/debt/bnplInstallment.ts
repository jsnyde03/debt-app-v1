import type { Debt } from "@core/storage/debtPlannerStorage";
import { advanceDueDateOnce } from "@core/recurrence/rolloverPayCycle";
import { parseLocalDate } from "@core/utils/localDate";

function roundMoney(amount: number) {
	return Math.round(amount * 100) / 100;
}

/**
 * BNPL "installment-native" model (2.7.2).
 *
 * A Buy-Now-Pay-Later plan is fundamentally "N payments of $X" — an Affirm/Klarna/Afterpay
 * schedule, not an interest-accruing balance:
 *   - `scheduledPaymentAmount` = the fixed installment (→ `minimumPayment`, what the engine pays)
 *   - `remainingPayments`      = how many installments are left
 *
 * ⛔ **S1.13.7.6 [pass-6 `A2-2`] · 🎯 DECIDED 2026-08-31 — THE BALANCE IS CANONICAL, and this header used
 * to say the opposite.** It claimed the installment fields were the truth and `balance` was derived
 * (`balance := scheduled × remaining`) — while `bnplPaymentsRemaining` twenty lines below derived the
 * count from the balance. **Two answers to one question, and only one of them can be made safe.**
 *
 * ⚡ An extra payment leaves a balance `scheduled × remaining` **cannot represent**, so any rule deriving
 * the balance from the count has to round — and rounding a balance is inventing or deleting money.
 * Measured on a $400 4-pay: an extra $60 persisted **$200** (deleting $40); an extra $40 persisted
 * **$300** (inventing $40), on the next ordinary `updateDebt` — **a rename**.
 *
 * So the installment fields **describe** the balance. `remainingPayments` is derived with `ceil`, because
 * a part-installment still owed is a payment the user has to make; `minimumPayment` still follows
 * `scheduledPaymentAmount`, the one direction that never disagreed.
 *
 * Before 2.7.2 these two fields were CAPTURED (the debt sheet + CSV import) but read back
 * nowhere: the engine and the amortization view both ran BNPL off `balance` + `minimumPayment`
 * (with `apr` forced to 0), so a plan whose real installment differed from the entered minimum
 * projected the wrong payoff. Normalizing at every write seam makes the installment the number
 * the whole engine actually uses.
 *
 * A BNPL WITHOUT both installment fields (legacy / imported without them) is NOT installment-native
 * → it falls back to the plain balance+minimum path unchanged, which needs no reconciliation at all.
 */
export function isInstallmentNative(debt: Debt): boolean {
	return (
		debt.type === "bnpl" &&
		typeof debt.scheduledPaymentAmount === "number" &&
		debt.scheduledPaymentAmount > 0 &&
		typeof debt.remainingPayments === "number" &&
		debt.remainingPayments > 0
	);
}

/**
 * Reconcile an installment-native BNPL's derived fields to its installment truth:
 *   balance        := scheduledPaymentAmount × remainingPayments
 *   minimumPayment := scheduledPaymentAmount
 * Any other debt — a plain debt, or a BNPL missing installment fields (the fallback path) — is
 * returned UNCHANGED (referentially, when nothing moved) so callers can apply it blanket at a
 * write seam. Idempotent: re-normalizing an already-consistent debt returns it untouched.
 */
export function normalizeBnplInstallment(debt: Debt): Debt {
	if (!isInstallmentNative(debt)) return debt;
	const scheduled = roundMoney(debt.scheduledPaymentAmount as number);
	/**
	 * ⛔ **S1.13.7.6 [pass-6 `A2-2`] · 🎯 DECIDED 2026-08-31 — THE BALANCE IS CANONICAL, and this used to
	 * overwrite it from the installment count.**
	 *
	 * ⚡ Measured: on a `$400` 4-pay Klarna, an extra **$60** left a true balance of `$240`, and the next
	 * ordinary `updateDebt` — **a RENAME** — re-derived `scheduled × round(240/100)` and persisted
	 * **`$200`**, deleting $40 of the user's debt. An extra **$40** persisted `$300`, inventing $40. Four
	 * more records followed the rewritten balance.
	 *
	 * ⛔ **The module answered "which field is canonical" two ways** — this header said the installment
	 * fields were, `bnplPaymentsRemaining` said the balance was — and only one of those answers can be
	 * made safe. An extra payment leaves a balance that `scheduled × remaining` **cannot represent**, so
	 * any rule deriving the balance FROM the count has to round, and rounding a balance is inventing or
	 * deleting money. The count can absorb the imprecision; the money cannot.
	 *
	 * ⚠️ So the installment fields now **describe** the balance: `remainingPayments` is derived with
	 * `ceil`, because a part-installment still owed is a payment the user has to make. `minimumPayment`
	 * still follows `scheduledPaymentAmount` — that direction never disagreed.
	 *
	 * ⚠️ **A caller that means to change the SCHEDULE must set the balance too.** Editing
	 * `remainingPayments` alone no longer moves the balance; it is a statement about a balance that has
	 * its own value.
	 */
	const balance = roundMoney(debt.balance);
	const remaining = Math.max(0, Math.ceil(balance / scheduled));
	if (balance === debt.balance && scheduled === debt.minimumPayment && remaining === debt.remainingPayments) return debt;
	return { ...debt, balance, minimumPayment: scheduled, remainingPayments: remaining };
}

/**
 * Installments left on an installment-native BNPL, derived from the CURRENT balance so it stays
 * in sync as the plan is paid down (a rollover reduces `balance`; this reads the count back off it).
 * Returns null for a non-installment-native debt. Rounded — an interest-free schedule keeps balance
 * an exact multiple of the installment, so the ratio is a whole number in the common case.
 */
export function bnplPaymentsRemaining(debt: Debt): number | null {
	if (!isInstallmentNative(debt)) return null;
	const scheduled = debt.scheduledPaymentAmount as number;
	// ⛔ S1.13.7.6 [pass-6 A2-2] — `ceil`, so the three producers of this count agree exactly.
	return Math.max(0, Math.ceil(debt.balance / scheduled));
}

/**
 * Total installments in the plan (for a "payment 2 of 4" progress read, 2.7.3), derived from the
 * ORIGINAL balance when we have it, else the current remaining count. Returns null for a
 * non-installment-native debt.
 */
/**
 * ⛔ **S1.11.4.4 [pass-4 blocker `C4-1`] — EVERY REPAIRABLE FIELD THE INSTALLMENT COUNT IS DERIVED FROM,
 * NAMED ONCE, AT THE PRODUCER.**
 *
 * ⚡ The count is not a dollar figure, and that is exactly why it got past three widenings of `B1`'s rule
 * (claim sites → fields → surfaces, all three about money). `rowFieldUnread` is asked before every
 * `formatCurrency` on a BNPL row and was asked before **none** of the count, the ordinal or the total —
 * which are computed from `originalBalance`, a field the reader can lose. Measured: a Klarna 4-pay with
 * two installments already paid printed *"$200.00 · **0 of 2** paid"* on Money and *"payment 1 of 2"* in
 * the calendar, against a true **2 of 4**, because `repairMoneyFields` drops the unreadable
 * `originalBalance` and `raiseOriginalBalance` stamps it to `Math.max(0, balance)` on the next line — so
 * `basis / scheduled` collapses to `remainingPayments`.
 *
 * ⚠️ **A LIST, and it lives at the producer rather than at either reader** — `BnplCalendarSection`'s
 * filter named `scheduledPaymentAmount` alone, which is how it was *"one field short"* (`C-6`'s open
 * half). ⛔ Do NOT exempt BNPL from `raiseOriginalBalance`: `originalBalanceHighWater.ts` records that
 * inference being made and being wrong, and it would re-open the journey-ring defect `D62` closed.
 */
export const BNPL_COUNT_FIELDS = ['balance', 'scheduledPaymentAmount', 'originalBalance'] as const;

export function bnplPaymentsTotal(debt: Debt): number | null {
	if (!isInstallmentNative(debt)) return null;
	const scheduled = debt.scheduledPaymentAmount as number;
	const basis = debt.originalBalance && debt.originalBalance > 0 ? debt.originalBalance : debt.balance;
	return Math.max(bnplPaymentsRemaining(debt) ?? 0, Math.round(basis / scheduled));
}

/**
 * How many installments of an installment-native BNPL fall in the pay-cycle window [start, end) —
 * i.e. how many times it actually charges before the next paycheck (2.7.4). A biweekly BNPL in a
 * MONTHLY paycheck window charges ~2×, but the per-cycle allocator (which keys off a single due date)
 * counts it as 1 → the Guardian under-detects that crunch. This is the count that lets the cash read
 * reflect the FULL between-paycheck outflow. Steps from the debt's next due date by its cadence,
 * counting occurrences in `[start, end)`, capped at `remainingPayments`. Returns 0 for a
 * non-installment-native debt, when nothing is due before `end`, or when a one-time plan's single
 * charge already fell before `start`. ⛔ **Both bounds are live** — see the block at the skip loop for
 * what it cost when only one of them was. In the aligned case (a biweekly
 * BNPL for a biweekly-paid user) the window holds exactly one charge → 1, so nothing changes.
 */
/**
 * ⛔ THE PER-INSTALLMENT AMOUNT, for an installment-native BNPL **or a fallback one** (S1P3-A4).
 *
 * An installment-native BNPL carries `scheduledPaymentAmount`. A FALLBACK BNPL — `type: 'bnpl'` with
 * `recurrence` + `dueDate` but no installment fields, which the CSV importer and a pre-2.7.2 backup
 * both produce — carries the same number in `minimumPayment`. Both are "what this plan charges once".
 */
function bnplInstallmentAmount(debt: Debt): number {
	return typeof debt.scheduledPaymentAmount === "number" && debt.scheduledPaymentAmount > 0
		? debt.scheduledPaymentAmount
		: debt.minimumPayment;
}

/**
 * ⛔ A BNPL WHOSE CADENCE IS KNOWN — the gate the in-window seams use (S1P3-A4, 🎯 2026-08-26).
 *
 * Wider than `isInstallmentNative` **on purpose**. A biweekly plan charges 26 times a year; that is a
 * fact about the plan, not about whether we happen to hold its installment columns. Gating the RESERVE
 * on installment data meant a CSV-imported biweekly BNPL was reserved and paid down at $100/cycle while
 * the chart and the debt-free date rated it at $216.67/month — **one debt, two screens, 2× apart.**
 *
 * 🎯 chose to move the RESERVE to the cadence rather than move the date to the reserve: under-reserving
 * tells a user they have money they have already committed, which is the dangerous direction for a debt
 * app. ⚠️ The cost is named rather than hidden — the app now holds back against a cadence it cannot
 * verify from installment data, so a CSV that says `biweekly` wrongly reserves too much. That is the
 * conservative error.
 *
 * ⚠️ One-time plans are NOT excluded here, and an earlier draft of this predicate excluded them —
 * which red `testBnplInstallment.ts:98` ("a one-time BNPL charges exactly once"). The loop already
 * handles them: `advanceDueDateOnce` returns the same date, so it counts exactly one occurrence and
 * breaks. ⛔ That exclusion was a rule I invented rather than measured; the test caught it.
 */
export function hasKnownBnplCadence(debt: Debt): boolean {
	return (
		debt.type === "bnpl" &&
		typeof debt.dueDate === "string" &&
		debt.dueDate.length > 0 &&
		bnplInstallmentAmount(debt) > 0
	);
}

/**
 * ⛔ **S1.11.5.1 — `parseLocalDate`, NOT `new Date(`${iso}T00:00:00`)`.** The hand-rolled form is correct
 * and `@core/utils/localDate` owns it; this file spelled it out four times, and `lint:local-dates` reds on
 * the count RISING, which is exactly what adding `A-F3`'s two did. Collapsing all four to the owner is the
 * cheaper answer than raising a baseline that exists to stop this class growing.
 */
const at = (iso: string): number => parseLocalDate(iso).getTime();

export function bnplInstallmentsInWindow(debt: Debt, windowStartISO: string, windowEndISO: string): number {
	// ⛔ S1P3-A4 — gated on CADENCE, not on installment data. See `hasKnownBnplCadence`.
	if (!hasKnownBnplCadence(debt)) return 0;
	const end = at(windowEndISO);
	// ⚠️ An unknown remaining-count is an UNKNOWN CAP, which is `Infinity` — not `0`. Reading a missing
	// `remainingPayments` as a cap of 0 is what made the loop return 0 and the whole seam a no-op.
	const cap =
		typeof debt.remainingPayments === "number" && debt.remainingPayments > 0
			? debt.remainingPayments
			: Number.POSITIVE_INFINITY;
	let count = 0;
	let due = debt.dueDate;

	/**
	 * ⛔ **S1.11.5.1 [pass-4 blocker `A-F3`] — `windowStartISO` WAS A DECLARED PARAMETER THAT APPEARED
	 * NOWHERE IN THIS BODY, so the window had one live bound and the docstring above claimed two.**
	 *
	 * ⚡ Every occurrence a plan MISSED before the window opened was counted as due in the CURRENT pay
	 * cycle. Measured on a $1,200 biweekly Klarna against a $2,000 monthly paycheck, window
	 * `2026-08-01 → 2026-09-01`, varying only the stored due date:
	 *
	 * ```
	 * dueDate 2026-08-01 ->  3 charges  ->   $300 required
	 * dueDate 2026-02-01 -> 16 charges  -> $1,200 required   (the whole balance)
	 * dueDate 2025-08-01 -> 29 charges  -> $1,200 required
	 * ```
	 *
	 * ⛔ **And it is reachable**: `debtCsv.ts` validates a due date for shape and calendar validity only,
	 * and `DateField` passes no `minimumDate`, so a past "Next payment" is one scroll away in the add
	 * form. The steady state hides it — `applyRollover` advances the cycle and the due dates in the same
	 * call — so a date can only fall behind the window by *arriving* behind it.
	 *
	 * 🎯 **2026-08-29 — HONOUR THE CONTRACT.** The alternative reading (*a genuinely overdue plan IS all
	 * due now*) was put and declined: the concrete harm today is that one payday capture then zeroes the
	 * whole balance and files **$1,200 in History as paid down** — a record of money the user never paid,
	 * which is the class this whole audit exists for. ⚠️ **The arrears do not vanish**: the balance is
	 * untouched, the debt still lists at its full amount, and a due date in the past makes its row read
	 * overdue. What changes is only *how much this paycheck is told to cover*.
	 *
	 * ⚠️ **Skipping does NOT consume `cap`.** `remainingPayments` counts what is still owed, and a missed
	 * installment is still owed — spending the cap on it would under-count the charges that really do
	 * fall inside the window.
	 */
	const start = at(windowStartISO);
	while (at(due) < start) {
		const next = advanceDueDateOnce(due, debt.recurrence);
		// ⛔ A one-time / per-paycheck plan does not advance. Without this the skip loop never terminates —
		// and it is the same `next === due` condition the counting loop below already depends on.
		if (next === due) return 0;
		due = next;
	}

	while (count < cap && at(due) < end) {
		count += 1;
		const next = advanceDueDateOnce(due, debt.recurrence);
		if (next === due) break; // one-time / per-paycheck don't advance → a single occurrence in-window
		due = next;
	}
	return count;
}

/**
 * ⛔ THE MINIMUM ACTUALLY DUE INSIDE A PAY-CYCLE WINDOW — the ONE producer of this number (S1P3-A2).
 *
 * For an installment-native BNPL more than one installment can fall inside a pay-cycle window (a
 * biweekly plan for a monthly earner charges ~2×). The allocator RESERVES that full in-window amount
 * (`scaleBnplMinimumsForWindow`) and `applyRolloverPayment` pays the balance down by the same, or the
 * balance drifts high forever (after-scan AS.2). ⚠️ `minimumPayment` — the stored PER-INSTALLMENT
 * amount — is untouched; this is only how much is due in this window.
 *
 * ⚡ **Extracted because it had two producers and one of them never got the memo.** The allocator, the
 * forecast, the recovery plan and the rollover all scaled; `buildCycleSnapshot` summed the raw
 * `minimumPayment`, so History told a user who paid $200 that they paid $100 (S1P3-A2). ⛔ **Do not
 * re-derive this expression at a third site — call this.** Two producers of one fact is the shape that
 * produced both A1 and A2 in the same pass.
 *
 * No window (or not installment-native) → the stored minimum, unchanged.
 */
export function effectiveMinimumInWindow(
	debt: Debt,
	windowStartISO?: string,
	windowEndISO?: string
): number {
	if (hasKnownBnplCadence(debt) && windowStartISO && windowEndISO) {
		// Capped at the balance, or a final SHORT installment over-reports.
		return roundMoney(
			Math.min(
				Math.max(1, bnplInstallmentsInWindow(debt, windowStartISO, windowEndISO)) *
					bnplInstallmentAmount(debt),
				debt.balance
			)
		);
	}
	return debt.minimumPayment;
}

/**
 * Reflect a BNPL's FULL in-window outflow by scaling its effective per-cycle minimum to
 * (installments in the window) × the installment (2.7.4), capped at its balance so it never over-pays.
 * A no-op when the window holds ≤1 charge (the common aligned case) and for every non-BNPL debt — so
 * it's safe to apply blanket at an engine boundary. This is a per-cycle VIEW: it changes what the
 * allocator/forecast reserve for the BNPL this cycle, not the stored installment (the row still shows
 * the true per-installment amount) and not the paid-flag/rollover machinery.
 */
export function scaleBnplMinimumForWindow(debt: Debt, windowStartISO: string, windowEndISO: string): Debt {
	if (!hasKnownBnplCadence(debt)) return debt;
	const n = bnplInstallmentsInWindow(debt, windowStartISO, windowEndISO);
	if (n <= 1) return debt;
	const scaled = roundMoney(Math.min(n * bnplInstallmentAmount(debt), debt.balance));
	return scaled === debt.minimumPayment ? debt : { ...debt, minimumPayment: scaled };
}

/** Map `scaleBnplMinimumForWindow` across a debt list (the engine-boundary transform). */
export function scaleBnplMinimumsForWindow(debts: Debt[], windowStartISO: string, windowEndISO: string): Debt[] {
	return debts.map((d) => scaleBnplMinimumForWindow(d, windowStartISO, windowEndISO));
}
