import type { Debt } from "@core/storage/debtPlannerStorage";
import { advanceDueDateOnce } from "@core/recurrence/rolloverPayCycle";
import { isInstallmentNative, bnplPaymentsTotal } from "./bnplInstallment";

export interface BnplInstallmentEntry {
	debtId: string;
	debtName: string;
	/** The plan's provider (Klarna/Affirm/…) or "BNPL" when unspecified. */
	provider: string;
	/** ISO date this installment charges. */
	date: string;
	amount: number;
	/** 1-based position in the plan ("payment {paymentNumber} of {totalPayments}"). 0/0 for a fallback
	 *  BNPL whose remaining count is unknown (a single next-due row, no "i of N"). */
	paymentNumber: number;
	totalPayments: number;
}

/**
 * The forward BNPL installment schedule across ALL of a user's BNPL plans (2.7.5) — every upcoming
 * installment, sorted by date, for the consolidated "when do my BNPL hit?" calendar.
 *
 * For an installment-native BNPL it enumerates each remaining installment: steps the due date by the
 * plan's cadence (`advanceDueDateOnce`), capped at `remainingPayments`, each carrying its "i of N"
 * position. For a FALLBACK BNPL (no installment fields) it emits a single next-due row — an unknown
 * remaining count can't be enumerated. Paid-off BNPLs (balance ≤ 0) and non-BNPL debts are skipped.
 *
 * Pure + deterministic. `fromISO` (optional) drops installments dated before it (defaults to keeping
 * all) — the caller passes the current date so a past installment doesn't linger in the calendar.
 */
/**
 * ⛔ **S1.13.7.7 [pass-6 `A2-3`] — A `per-paycheck` BNPL SHOWED ONE INSTALLMENT OF FOUR, CAPTIONED
 * *"payment 1 of 4"*.**
 *
 * `advanceDueDateOnce` returns the SAME date for `per-paycheck` — correctly, because that cadence has no
 * calendar period of its own; it is defined by the user's pay cycle. So the loop below broke after one
 * row while the caption kept counting to the true total, and the month subtotal was short by three
 * quarters of the plan.
 *
 * ⚠️ `nextPayday` is how the caller lends this function the one fact it cannot derive. Omitted, the
 * behaviour is exactly what it was — so every non-`per-paycheck` plan and every existing caller is
 * unaffected.
 */
export function buildBnplSchedule(
	debts: Debt[],
	fromISO?: string,
	nextPayday?: (afterISO: string) => string,
): BnplInstallmentEntry[] {
	const from = fromISO ? new Date(`${fromISO}T00:00:00`).getTime() : -Infinity;
	const entries: BnplInstallmentEntry[] = [];

	for (const d of debts) {
		if (d.type !== "bnpl" || d.balance <= 0) continue;

		if (isInstallmentNative(d)) {
			const total = bnplPaymentsTotal(d) ?? (d.remainingPayments as number);
			const remaining = d.remainingPayments as number;
			const amount = d.scheduledPaymentAmount as number;
			const provider = d.bnplProvider || "BNPL";
			let due = d.dueDate;
			for (let k = 0; k < remaining; k++) {
				if (new Date(`${due}T00:00:00`).getTime() >= from) {
					entries.push({
						debtId: d.id,
						debtName: d.name,
						provider,
						date: due,
						amount,
						paymentNumber: total - remaining + k + 1,
						totalPayments: total,
					});
				}
				// ⛔ A2-3 — a per-paycheck plan charges on PAYDAYS; the caller supplies that step.
				const next =
					d.recurrence === "per-paycheck" && nextPayday ? nextPayday(due) : advanceDueDateOnce(due, d.recurrence);
				if (next === due) break; // one-time / per-paycheck — a single installment
				due = next;
			}
		} else if (new Date(`${d.dueDate}T00:00:00`).getTime() >= from) {
			// Fallback BNPL (no installment fields): a single next-due row.
			entries.push({
				debtId: d.id,
				debtName: d.name,
				provider: d.bnplProvider || "BNPL",
				date: d.dueDate,
				amount: d.minimumPayment,
				paymentNumber: 0,
				totalPayments: 0,
			});
		}
	}

	return entries.sort((a, b) => a.date.localeCompare(b.date));
}
