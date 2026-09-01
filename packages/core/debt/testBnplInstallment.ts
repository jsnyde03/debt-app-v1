import type { Debt } from "@core/storage/debtPlannerStorage";
import {
	isInstallmentNative,
	normalizeBnplInstallment,
	bnplPaymentsRemaining,
	bnplPaymentsTotal,
	bnplInstallmentsInWindow,
	scaleBnplMinimumForWindow,
	effectiveMinimumInWindow,
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

	/**
	 * --- normalizeBnplInstallment: the BALANCE is canonical; the installment fields describe it ---
	 *
	 * ⛔ **S1.13.7.6 [pass-6 `A2-2`] · 🎯 DECIDED 2026-08-31 — this block asserted the OPPOSITE canon and
	 * that was the blocker.** It required `balance := scheduled × remaining`, so an extra payment — which
	 * leaves a balance that product cannot represent — was silently rounded away by the next ordinary
	 * `updateDebt`. Measured: an extra $60 on a $400 4-pay persisted **$200**, deleting $40; an extra $40
	 * persisted **$300**, inventing $40. **On a RENAME.**
	 *
	 * ⚠️ Replaced, not deleted: this is the only unit coverage of the reconciliation, and the fixture is
	 * exactly the disagreement case (a $380 balance under a 4 × $100 schedule).
	 */
	const messy = debt({ type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 4, balance: 380, minimumPayment: 95 });
	const fixed = normalizeBnplInstallment(messy);
	assertEqual(fixed.balance, 380, "⛔ A2-2 — the balance is the user's money and is NEVER rewritten from the count");
	assertEqual(fixed.minimumPayment, 100, "minimumPayment is reconciled to the scheduled installment");
	assertEqual(fixed.remainingPayments, 4, "the count follows the balance: ceil(380 / 100) = 4, a part-installment still owed");
	assertEqual(fixed.scheduledPaymentAmount, 100, "the scheduled installment is preserved");

	// ⭐ THE REGRESSION THIS EXISTS FOR: an extra payment, then an unrelated edit. Neither may move money.
	const overpaid = debt({ type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 4, balance: 240, minimumPayment: 100 });
	const renamed = normalizeBnplInstallment({ ...overpaid, name: "Klarna (renamed)" });
	assertEqual(renamed.balance, 240, "⛔ A2-2 — a rename does not delete $40 of debt");
	assertEqual(renamed.remainingPayments, 3, "…and the count says 3 payments left, which is what the user owes");

	// --- idempotence: normalizing an already-consistent debt returns it untouched (same reference) ---
	const consistent = debt({ type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 4, balance: 400, minimumPayment: 100 });
	assertTrue(normalizeBnplInstallment(consistent) === consistent, "normalize is idempotent (no-op returns the same reference)");

	// --- fallback + plain debts pass through untouched ---
	const plain = debt({ type: "debt", balance: 1000, minimumPayment: 50, apr: 20 });
	assertTrue(normalizeBnplInstallment(plain) === plain, "a plain debt is returned untouched");
	const fallbackBnpl = debt({ type: "bnpl", balance: 380, minimumPayment: 95 });
	assertTrue(normalizeBnplInstallment(fallbackBnpl) === fallbackBnpl, "a fallback BNPL (no installment fields) is returned untouched");

	/**
	 * --- fractional installment: the balance is kept to cents, and the count follows it ---
	 *
	 * ⛔ **S1.13.7.6 [pass-6 `A2-2`] — this asserted that normalize DERIVES `99.99` from `3 × 33.33`.**
	 * Under the balance-canonical rule it derives nothing: **deriving the balance is the defect**. The
	 * cent-rounding this row exists for now lives at the seams that genuinely declare a schedule —
	 * `prepareNewDebt` and the CSV importer — and what normalize owes is that it does not disturb a
	 * fractional balance on the way past.
	 */
	const fractional = normalizeBnplInstallment(debt({ type: "bnpl", scheduledPaymentAmount: 33.33, remainingPayments: 3, balance: 99.99 }));
	assertEqual(fractional.balance, 99.99, "a fractional balance survives normalization to the cent");
	assertEqual(fractional.remainingPayments, 3, "…and the count derives from it: ceil(99.99 / 33.33) = 3");

	// --- remaining/total derive off the current balance (stays in sync as the plan pays down) ---
	const paidDown = debt({ type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 4, balance: 200, minimumPayment: 100, originalBalance: 400 });
	assertEqual(bnplPaymentsRemaining(paidDown), 2, "payments-remaining derives from the current balance ($200 → 2 left)");
	assertEqual(bnplPaymentsTotal(paidDown), 4, "payments-total derives from the original balance ($400 → 4 total)");
	assertEqual(bnplPaymentsRemaining(plain), null, "payments-remaining is null for a non-installment-native debt");

	// ── 2.7.4 — in-window installment count + minimum scaling (Guardian-aware cadence) ──
	// A biweekly BNPL (installment $100, 4 left, due Aug 1) — the count is window-accurate (each charge
	// date that lands strictly before the window end), so a monthly window holds 2–3 depending on alignment.
	const biweeklyBnpl = debt({ type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 4, balance: 400, minimumPayment: 100, dueDate: "2026-08-01", recurrence: "biweekly" });
	assertEqual(bnplInstallmentsInWindow(biweeklyBnpl, "2026-08-01", "2026-09-01"), 3, "biweekly BNPL, due on the window start → Aug 1/15/29 all land before Sep 1 (3 charges)");
	assertEqual(bnplInstallmentsInWindow(biweeklyBnpl, "2026-08-01", "2026-08-28"), 2, "biweekly BNPL in a ~4-week window → 2 charges (Aug 1, 15; Aug 29 is out)");
	assertEqual(bnplInstallmentsInWindow(biweeklyBnpl, "2026-08-01", "2026-08-15"), 1, "biweekly BNPL in a 2-week (aligned) window → 1 charge");
	assertEqual(bnplInstallmentsInWindow(biweeklyBnpl, "2026-08-01", "2026-11-01"), 4, "a long window is capped at remaining payments (4, not 6)");
	assertEqual(bnplInstallmentsInWindow(debt({ type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 1, balance: 100, minimumPayment: 100, dueDate: "2026-08-01", recurrence: "one-time" }), "2026-08-01", "2026-09-01"), 1, "a one-time BNPL charges exactly once (never advances)");
	assertEqual(bnplInstallmentsInWindow(biweeklyBnpl, "2026-08-01", "2026-07-15"), 0, "nothing due before a window that ends before the due date");
	/**
	 * ⛔ **S1.13.7.7 [pass-6 `A3-1`] — THIS ROW ENCODED THE TYPE GATE, AND THE TYPE GATE WAS THE DEFECT.**
	 *
	 * A cadence is a fact about the SCHEDULE, not about the debt's label. Gating on `type === "bnpl"`
	 * meant a plain debt with `weekly`/`biweekly` recurrence under a monthly payer reserved **one payment
	 * of three** — flipping one dropdown moved `totalRequired` from $300 to $100, and the engine offered
	 * the $250 it owes as an extra payment to that same debt.
	 *
	 * ⚠️ Replaced with the property that actually matters, in both directions: an ALIGNED plain debt
	 * counts one charge (so the scaler is still a no-op for it), and a SUB-WINDOW one counts the charges
	 * it really makes.
	 */
	assertEqual(bnplInstallmentsInWindow(debt({ type: "debt", balance: 1000, minimumPayment: 50, dueDate: "2026-08-01", recurrence: "monthly" }), "2026-08-01", "2026-09-01"), 1, "an ALIGNED plain debt charges once in the window — the scaler stays a no-op");
	assertEqual(bnplInstallmentsInWindow(debt({ type: "debt", balance: 1000, minimumPayment: 100, dueDate: "2026-08-01", recurrence: "weekly" }), "2026-08-01", "2026-09-01"), 5, "⛔ A3-1 — a WEEKLY plain debt charges five times before a monthly payday, and the reserve must see all five");

	/**
	 * ⛔ **S1.11.5.1 [pass-4 blocker `A-F3`] — THE OTHER SIDE OF THE WINDOW, WHICH NO ROW HERE TESTED.**
	 *
	 * ⚡ Every window row above uses `dueDate === windowStart`, and the one row that varies the
	 * relationship — *"nothing due before a window that ends before the due date"* — moves the **END**
	 * before the due date. **The class is "the due date is outside the window" and every row picked the
	 * far side of it**, so `windowStartISO` could be a dead parameter with the whole file green. Measured:
	 * three different window STARTS against one debt returned the same 3.
	 *
	 * ⛔ **The rows are a SWEEP over the relationship, not a list of examples.** `before` · `on` · `inside`
	 * · `after` — the four positions a due date can hold relative to `[start, end)`.
	 *
	 * ⚠️ **The finding predicted the far-behind row would be 2 and it is 3 — measured, not taken.** Feb 1
	 * plus 14 × 13 days lands on **Aug 2**, so the resumed schedule charges Aug 2 / 16 / 30. The premise
	 * (`windowStartISO` is dead, and $1,200 is required against a true $300) reproduced exactly; the
	 * number attached to its proposed REMEDY did not. That is the round's own rule, one more time.
	 */
	const SWEEP: { label: string; dueDate: string; expect: number }[] = [
		{ label: "one cycle BEFORE the start", dueDate: "2026-07-18", expect: 3 },
		{ label: "far behind — six months of missed charges", dueDate: "2026-02-01", expect: 3 },
		{ label: "ON the start", dueDate: "2026-08-01", expect: 3 },
		{ label: "INSIDE the window", dueDate: "2026-08-20", expect: 1 },
		{ label: "AFTER the end", dueDate: "2026-09-15", expect: 0 },
	];
	for (const row of SWEEP) {
		assertEqual(
			bnplInstallmentsInWindow(
				debt({ type: "bnpl", balance: 1200, minimumPayment: 100, dueDate: row.dueDate, recurrence: "biweekly" }),
				"2026-08-01",
				"2026-09-01",
			),
			row.expect,
			`⛔ A-F3 · the due date ${row.label} — the window counts what is charged INSIDE it`,
		);
	}
	// ⭐ THE CONTROL THAT MAKES THE SWEEP MEAN SOMETHING: the answers must not all be the same, or a
	// function ignoring both bounds would satisfy every row above.
	assertTrue(new Set(SWEEP.map((r) => r.expect)).size > 1, "⭐ A-F3 control — the sweep discriminates; the counts are not one number");
	// ⛔ A one-time plan whose single charge already fell before the window contributes NOTHING — and the
	// skip loop cannot advance it, so this is also the non-termination case.
	assertEqual(
		bnplInstallmentsInWindow(
			debt({ type: "bnpl", scheduledPaymentAmount: 100, remainingPayments: 1, balance: 100, minimumPayment: 100, dueDate: "2026-07-01", recurrence: "one-time" }),
			"2026-08-01",
			"2026-09-01",
		),
		0,
		"⛔ A-F3 — a one-time BNPL charged before the window is not charged again inside it",
	);
	// scaleBnplMinimumForWindow: reflect the full in-window outflow in the effective minimum.
	assertEqual(scaleBnplMinimumForWindow(biweeklyBnpl, "2026-08-01", "2026-08-28").minimumPayment, 200, "2-charge window → effective minimum scales to 2 × the installment");
	assertTrue(scaleBnplMinimumForWindow(biweeklyBnpl, "2026-08-01", "2026-08-15") === biweeklyBnpl, "aligned window (1 charge) → no-op, same reference");
	assertEqual(scaleBnplMinimumForWindow(biweeklyBnpl, "2026-08-01", "2026-12-01").minimumPayment, 400, "a long window's scaled minimum is capped at the balance (never over-pays)");
	assertTrue(scaleBnplMinimumForWindow(plain, "2026-08-01", "2026-09-01") === plain, "a plain debt is never scaled");

	// ── S1P3-A4 — A FALLBACK BNPL IS RESERVED AT ITS CADENCE, NOT AT ONE INSTALLMENT (🎯 2026-08-26) ──
	// `type: 'bnpl'` + `recurrence` + `dueDate` but NO installment fields. Reachable in the shipping app:
	// the CSV importer writes `scheduledPaymentAmount`/`remainingPayments` only when the columns are
	// present, while still accepting `type: bnpl` and `recurrence: biweekly`; a restored pre-2.7.2 backup
	// is the second door. The in-window seams used to be gated on `isInstallmentNative`, so this shape
	// reserved and paid down $100/cycle while the chart and the debt-free date rated it $216.67/month —
	// one debt, two screens, 2× apart.
	// ⚠️ 🎯 chose to move the RESERVE to the cadence, not the date to the reserve: under-reserving tells a
	// user they have money they have already committed.
	const fallbackBiweekly = debt({ type: "bnpl", balance: 1200, minimumPayment: 100, dueDate: "2026-08-01", recurrence: "biweekly" });
	assertEqual(bnplInstallmentsInWindow(fallbackBiweekly, "2026-08-01", "2026-09-01"), 3, "a fallback BNPL counts its in-window charges (S1P3-A4)");
	assertEqual(scaleBnplMinimumForWindow(fallbackBiweekly, "2026-08-01", "2026-08-28").minimumPayment, 200, "a fallback BNPL is RESERVED at 2 × its installment in a 2-charge window (S1P3-A4)");
	assertEqual(effectiveMinimumInWindow(fallbackBiweekly, "2026-08-01", "2026-08-28"), 200, "…and PAID DOWN by the same amount, so reserve and paydown stay in lockstep (S1P3-A4)");

	// ⛔ AN UNKNOWN remainingPayments IS AN UNKNOWN CAP — Infinity, not 0. Reading it as 0 is what made
	// the loop return 0 and the whole seam a silent no-op for this shape.
	assertEqual(bnplInstallmentsInWindow(fallbackBiweekly, "2026-08-01", "2026-11-01"), 7, "an absent remaining-count caps at nothing, not at zero (S1P3-A4)");

	/**
	 * ⚠️ **THE ARREARS DO NOT VANISH, and this is the assertion that says so.** The effective minimum falls
	 * to what the window really holds; the BALANCE is untouched, which is what keeps the debt on the books.
	 *
	 * ⛔ **S1.12.5.1 [pass-5 D5-4] — THIS BLOCK MOVED DOWN, AND THE ORDER IS LOAD-BEARING.** It used to sit
	 * ABOVE the `S1P3-A4` block. Its fixture is itself a **fallback BNPL** (`type: bnpl` + `recurrence`, no
	 * installment fields), so it depends on A4's fix — the seam being gated on `hasKnownBnplCadence` rather
	 * than `isInstallmentNative`. ⚡ Restoring A4's defect therefore reds THIS line first, and since
	 * `runRegressionTests` is import-driven and `assertEqual` throws, `S1P3-A4`'s own assertion 20 lines
	 * below **never ran**. Its registered proof redded for A-F3's reason and was unattributable — measured
	 * the first time that proof was ever executed.
	 *
	 * ⚠️ **Neither assertion is weakened and neither fixture changed** — changing either would change which
	 * member of its class it covers, which is the trap this round is full of. Only the order moved: the
	 * seam is asserted before the thing built on top of it. ⛔ **A future assertion inserted above
	 * `S1P3-A4`'s block that also reacts to A4's un-fix re-creates this**, and what catches it now is that
	 * `prove:guards` executes and records — the state that made this invisible for three passes is gone.
	 */
	const behind = debt({ type: "bnpl", balance: 1200, minimumPayment: 100, dueDate: "2026-02-01", recurrence: "biweekly" });
	assertEqual(effectiveMinimumInWindow(behind, "2026-08-01", "2026-09-01"), 300, "⛔ A-F3 — a plan six months behind is due THREE charges this cycle, not its whole $1,200 balance");
	assertEqual(behind.balance, 1200, "⚠️ A-F3 — …and it still owes every cent of it");

	// ⚠️ CONTROLS, both directions. The scaling must be CADENCE-specific, not a blanket BNPL bump — and
	// it must not reach a plain debt at all.
	const fallbackMonthly = debt({ type: "bnpl", balance: 400, minimumPayment: 100, dueDate: "2026-08-01", recurrence: "monthly" });
	assertTrue(scaleBnplMinimumForWindow(fallbackMonthly, "2026-08-01", "2026-09-01") === fallbackMonthly, "a MONTHLY fallback BNPL is not scaled (control)");
	assertEqual(effectiveMinimumInWindow(plain, "2026-08-01", "2026-09-01"), plain.minimumPayment, "a plain debt's in-window minimum is its stored minimum (control)");

	console.log("✅ BNPL installment-native model (2.7.2/2.7.4) tests passed.");
}

runBnplInstallmentTests();
