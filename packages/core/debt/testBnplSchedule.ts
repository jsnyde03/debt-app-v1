import type { Debt } from "@core/storage/debtPlannerStorage";
import { buildBnplSchedule } from "./bnplSchedule";

function assertEqual<T>(actual: T, expected: T, label: string) {
	if (actual !== expected) {
		throw new Error(`FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
	}
	console.log(`  ✓ ${label}`);
}

function debt(overrides: Partial<Debt>): Debt {
	return {
		id: "d1", name: "Test", balance: 0, minimumPayment: 0, dueDate: "2026-08-01",
		apr: 0, type: "debt", recurrence: "monthly", ...overrides,
	};
}

function runBnplScheduleTests() {
	console.log("Running BNPL schedule (2.7.5) tests...");

	// An installment-native biweekly BNPL, 2 of 4 already paid (remaining 2, original 4).
	const klarna = debt({
		id: "k", name: "Klarna", type: "bnpl", bnplProvider: "Klarna", scheduledPaymentAmount: 100,
		remainingPayments: 2, balance: 200, originalBalance: 400, minimumPayment: 100,
		dueDate: "2026-08-15", recurrence: "biweekly",
	});
	const affirm = debt({
		id: "a", name: "Affirm", type: "bnpl", bnplProvider: "Affirm", scheduledPaymentAmount: 50,
		remainingPayments: 3, balance: 150, originalBalance: 150, minimumPayment: 50,
		dueDate: "2026-08-10", recurrence: "monthly",
	});

	const sched = buildBnplSchedule([klarna, affirm], "2026-08-01");
	assertEqual(sched.length, 5, "2 Klarna + 3 Affirm = 5 upcoming installments");
	assertEqual(sched[0].date, "2026-08-10", "sorted by date — Affirm Aug 10 is first");
	assertEqual(sched[0].provider, "Affirm", "…and it's the Affirm installment");
	assertEqual(sched[1].date, "2026-08-15", "Klarna's first upcoming installment is Aug 15");
	assertEqual(sched[1].paymentNumber, 3, "…numbered 3 of 4 (2 already paid)");
	assertEqual(sched[1].totalPayments, 4, "…of a 4-payment plan");
	// Klarna's second upcoming installment steps by the biweekly cadence.
	const klarna2 = sched.find((e) => e.debtId === "k" && e.paymentNumber === 4);
	assertEqual(klarna2?.date, "2026-08-29", "Klarna's 4th installment is Aug 29 (biweekly step)");

	// `fromISO` drops past installments.
	const affirmPast = debt({
		id: "a2", name: "Affirm-old", type: "bnpl", bnplProvider: "Affirm", scheduledPaymentAmount: 50,
		remainingPayments: 2, balance: 100, originalBalance: 100, minimumPayment: 50,
		dueDate: "2026-07-01", recurrence: "monthly",
	});
	const fromFuture = buildBnplSchedule([affirmPast], "2026-08-01");
	assertEqual(fromFuture.length, 1, "a July installment is dropped; only the Aug one remains");
	assertEqual(fromFuture[0].date, "2026-08-01", "…the August installment (July stepped past)");

	// A fallback BNPL (no installment fields) → a single next-due row, no "i of N".
	const fallback = debt({ id: "f", name: "PayPal", type: "bnpl", balance: 60, minimumPayment: 20, dueDate: "2026-08-05" });
	const fbSched = buildBnplSchedule([fallback], "2026-08-01");
	assertEqual(fbSched.length, 1, "fallback BNPL emits a single next-due row");
	assertEqual(fbSched[0].totalPayments, 0, "…with no known total (0/0)");
	assertEqual(fbSched[0].amount, 20, "…at its minimum payment");

	// Paid-off BNPLs + non-BNPL debts are excluded.
	const paidOff = debt({ id: "p", name: "Done", type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 0, balance: 0 });
	const plain = debt({ id: "c", name: "Card", balance: 1000, minimumPayment: 40, dueDate: "2026-08-03" });
	assertEqual(buildBnplSchedule([paidOff, plain], "2026-08-01").length, 0, "a paid-off BNPL and a plain debt contribute nothing");

	console.log("✅ BNPL schedule (2.7.5) tests passed.");
}

runBnplScheduleTests();
