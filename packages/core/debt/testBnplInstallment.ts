import type { Debt } from "@core/storage/debtPlannerStorage";
import {
	isInstallmentNative,
	normalizeBnplInstallment,
	bnplPaymentsRemaining,
	bnplPaymentsTotal,
} from "./bnplInstallment";

function assertEqual<T>(actual: T, expected: T, label: string) {
	if (actual !== expected) {
		throw new Error(`FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
	}
	console.log(`  ✓ ${label}`);
}

function assertTrue(actual: boolean, label: string) {
	if (!actual) throw new Error(`FAIL [${label}]: expected true`);
	console.log(`  ✓ ${label}`);
}

function debt(overrides: Partial<Debt>): Debt {
	return {
		id: "d1",
		name: "Test",
		balance: 0,
		minimumPayment: 0,
		dueDate: "2026-08-01",
		apr: 0,
		type: "debt",
		recurrence: "monthly",
		...overrides,
	};
}

function runBnplInstallmentTests() {
	console.log("Running BNPL installment-native model (2.7.2) tests...");

	// --- isInstallmentNative gate ---
	assertEqual(
		isInstallmentNative(debt({ type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 4 })),
		true,
		"a BNPL with both installment fields is installment-native"
	);
	assertEqual(
		isInstallmentNative(debt({ type: "debt", scheduledPaymentAmount: 100, remainingPayments: 4 })),
		false,
		"a plain debt is never installment-native (even with the fields set)"
	);
	assertEqual(
		isInstallmentNative(debt({ type: "bnpl", balance: 380, minimumPayment: 95 })),
		false,
		"a BNPL missing installment fields falls back (not installment-native)"
	);
	assertEqual(
		isInstallmentNative(debt({ type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 0 })),
		false,
		"a BNPL with zero remaining is not installment-native (nothing to derive)"
	);

	// --- normalizeBnplInstallment: derive balance + minimum from the installment truth ---
	const messy = debt({ type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 4, balance: 380, minimumPayment: 95 });
	const fixed = normalizeBnplInstallment(messy);
	assertEqual(fixed.balance, 400, "balance is reconciled to scheduled × remaining (4 × $100)");
	assertEqual(fixed.minimumPayment, 100, "minimumPayment is reconciled to the scheduled installment");
	assertEqual(fixed.remainingPayments, 4, "the canonical installment fields are preserved");
	assertEqual(fixed.scheduledPaymentAmount, 100, "the scheduled installment is preserved");

	// --- idempotence: normalizing an already-consistent debt returns it untouched (same reference) ---
	const consistent = debt({ type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 4, balance: 400, minimumPayment: 100 });
	assertTrue(normalizeBnplInstallment(consistent) === consistent, "normalize is idempotent (no-op returns the same reference)");

	// --- fallback + plain debts pass through untouched ---
	const plain = debt({ type: "debt", balance: 1000, minimumPayment: 50, apr: 20 });
	assertTrue(normalizeBnplInstallment(plain) === plain, "a plain debt is returned untouched");
	const fallbackBnpl = debt({ type: "bnpl", balance: 380, minimumPayment: 95 });
	assertTrue(normalizeBnplInstallment(fallbackBnpl) === fallbackBnpl, "a fallback BNPL (no installment fields) is returned untouched");

	// --- fractional installment rounds to cents ---
	const fractional = normalizeBnplInstallment(debt({ type: "bnpl", scheduledPaymentAmount: 33.33, remainingPayments: 3 }));
	assertEqual(fractional.balance, 99.99, "a fractional installment derives a cent-rounded balance");

	// --- remaining/total derive off the current balance (stays in sync as the plan pays down) ---
	const paidDown = debt({ type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 4, balance: 200, minimumPayment: 100, originalBalance: 400 });
	assertEqual(bnplPaymentsRemaining(paidDown), 2, "payments-remaining derives from the current balance ($200 → 2 left)");
	assertEqual(bnplPaymentsTotal(paidDown), 4, "payments-total derives from the original balance ($400 → 4 total)");
	assertEqual(bnplPaymentsRemaining(plain), null, "payments-remaining is null for a non-installment-native debt");

	console.log("✅ BNPL installment-native model (2.7.2) tests passed.");
}

runBnplInstallmentTests();
