import type { Debt } from "@core/storage/debtPlannerStorage";
import { advanceDueDateOnce } from "@core/recurrence/rolloverPayCycle";

function roundMoney(amount: number) {
	return Math.round(amount * 100) / 100;
}

/**
 * BNPL "installment-native" model (2.7.2).
 *
 * A Buy-Now-Pay-Later plan is fundamentally "N payments of $X" — an Affirm/Klarna/Afterpay
 * schedule, not an interest-accruing balance. So for BNPL the two INSTALLMENT fields are the
 * canonical truth and `balance`/`minimumPayment` are DERIVED from them:
 *   - `scheduledPaymentAmount` = the fixed installment (→ `minimumPayment`, what the engine pays)
 *   - `remainingPayments`      = how many installments are left (→ `balance` = scheduled × remaining)
 *
 * Before 2.7.2 these two fields were CAPTURED (the debt sheet + CSV import) but read back
 * nowhere: the engine and the amortization view both ran BNPL off `balance` + `minimumPayment`
 * (with `apr` forced to 0), so a plan whose real installment differed from the entered minimum
 * projected the wrong payoff. Normalizing at every write seam makes the installment the number
 * the whole engine actually uses.
 *
 * A BNPL WITHOUT both installment fields (legacy / imported without them) is NOT installment-native
 * → it falls back to the plain balance+minimum path unchanged. That fallback IS the reconciliation:
 * when installment data exists, balance can't drift from scheduled × remaining because it's derived.
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
	const balance = roundMoney(scheduled * (debt.remainingPayments as number));
	if (balance === debt.balance && scheduled === debt.minimumPayment) return debt;
	return { ...debt, balance, minimumPayment: scheduled };
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
	return Math.max(0, Math.round(debt.balance / scheduled));
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
 * counting occurrences strictly before `end`, capped at `remainingPayments`. Returns 0 for a
 * non-installment-native debt or when nothing is due before `end`. In the aligned case (a biweekly
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

export function bnplInstallmentsInWindow(debt: Debt, windowStartISO: string, windowEndISO: string): number {
	// ⛔ S1P3-A4 — gated on CADENCE, not on installment data. See `hasKnownBnplCadence`.
	if (!hasKnownBnplCadence(debt)) return 0;
	const end = new Date(`${windowEndISO}T00:00:00`).getTime();
	// ⚠️ An unknown remaining-count is an UNKNOWN CAP, which is `Infinity` — not `0`. Reading a missing
	// `remainingPayments` as a cap of 0 is what made the loop return 0 and the whole seam a no-op.
	const cap =
		typeof debt.remainingPayments === "number" && debt.remainingPayments > 0
			? debt.remainingPayments
			: Number.POSITIVE_INFINITY;
	let count = 0;
	let due = debt.dueDate;
	while (count < cap && new Date(`${due}T00:00:00`).getTime() < end) {
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
