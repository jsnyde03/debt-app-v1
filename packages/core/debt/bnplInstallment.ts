import type { Debt } from "@core/storage/debtPlannerStorage";

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
export function bnplPaymentsTotal(debt: Debt): number | null {
	if (!isInstallmentNative(debt)) return null;
	const scheduled = debt.scheduledPaymentAmount as number;
	const basis = debt.originalBalance && debt.originalBalance > 0 ? debt.originalBalance : debt.balance;
	return Math.max(bnplPaymentsRemaining(debt) ?? 0, Math.round(basis / scheduled));
}
