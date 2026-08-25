import { bnplPaymentsTotal } from "@core/debt/bnplInstallment";
import { raiseOriginalBalance } from "@core/debt/originalBalanceHighWater";
import type { Debt } from "@core/storage/debtPlannerStorage";

/**
 * [P6.8.9.7.11.15 · D62] `originalBalance` as a HIGH-WATER MARK.
 *
 * ⛔ **The deciding case is the CORRECTION, not the setback**, and it is the first block below: enter
 * `$500` by mistake, fix it to `$5,000`, and before this the ring read **0% for the rest of that debt's
 * life** because `paid = original − balance` was negative. ⚠️ `verifyDebtBalances` is a flow the app
 * *asks* people to use, so the old behaviour pointed a disincentive at the behaviour the product wants.
 *
 * ⛔ **The BNPL block is the one [D62] never considered.** `bnplPaymentsTotal` divides `originalBalance`
 * to say *"payment 2 of 4"*, and `addDebt` leaves the field deliberately empty on an installment-native
 * plan so the basis falls back to `balance`. These assert the COUNT A USER READS, not the field — a test
 * that only checked `originalBalance === undefined` would pass against a fix that changed the count some
 * other way.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
	if (!cond) throw new Error(`originalBalanceHighWater: ${label}`);
	passed += 1;
}
function eq(actual: unknown, expected: unknown, label: string) {
	assert(actual === expected, `${label} — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

const debt = (over: Partial<Debt>): Debt => ({
	id: "d",
	name: "Card",
	balance: 1000,
	minimumPayment: 50,
	dueDate: "2026-09-01",
	apr: 20,
	type: "debt",
	recurrence: "monthly",
	...over,
});

// ── THE DECIDING CASE: a correction upward ──────────────────────────────────────────────────────────
{
	const typo = debt({ originalBalance: 500, balance: 5000 });
	eq(raiseOriginalBalance(typo).originalBalance, 5000, "a balance corrected ABOVE the stamp raises it");

	// ⚠️ Asserted as the thing a user SEES, not as the field: percent paid must not be negative.
	const raised = raiseOriginalBalance(typo);
	const pct = ((raised.originalBalance as number) - raised.balance) / (raised.originalBalance as number);
	eq(pct, 0, "…so the ring reads 0% and never a negative");
}

// ── The ordinary paid-down case is UNTOUCHED, and the object identity is too ────────────────────────
{
	const paidDown = debt({ originalBalance: 12000, balance: 4800 });
	const out = raiseOriginalBalance(paidDown);
	eq(out.originalBalance, 12000, "paying down does NOT lower the stamp");
	assert(out === paidDown, "…and an unchanged debt is the SAME object (mapLegacyStore counts repairs by identity)");
}

// ── A setback below the stamp keeps the high-water mark ────────────────────────────────────────────
{
	const setback = debt({ originalBalance: 12000, balance: 9000 });
	eq(raiseOriginalBalance(setback).originalBalance, 12000, "a balance rising but still under the stamp leaves it");
}

// ── An unstamped debt is seeded; a zero one is not invented ────────────────────────────────────────
{
	eq(raiseOriginalBalance(debt({ balance: 800 })).originalBalance, 800, "an unstamped debt seeds from its balance");
	const zero = debt({ balance: 0 });
	assert(raiseOriginalBalance(zero) === zero, "a $0 unstamped debt is left alone, not stamped 0");
	// A repaired-to-0 field must never lower a real stamp — the invariant runs over persisted blobs.
	eq(raiseOriginalBalance(debt({ originalBalance: 400, balance: -9 })).originalBalance, 400, "a negative balance cannot lower the stamp");
}

// ── ⛔ BNPL: ONE RULE, AND THE COUNT A USER READS CANNOT INFLATE ───────────────────────────────────
//
// The case for exempting installment plans was that a stamp would turn "2 of 4" into "2 of 6". Measured
// false: `bnplPaymentsTotal` is `max(remaining, basis / scheduled)`, so a stamp can only RAISE the total,
// and `balance` is `scheduled × remaining` — the total rises only when the plan itself gets longer.
// ⚠️ These assert the COUNT, not the field: a test that checked `originalBalance` would say nothing about
// the number the user actually reads, which is the whole reason the exemption looked necessary.
{
	const bnpl = (over: Partial<Debt>) =>
		debt({ type: "bnpl", apr: 0, recurrence: "biweekly", scheduledPaymentAmount: 100, minimumPayment: 100, ...over });

	// A half-paid plan: 2 × $100 left. Unstamped, the plan's history is already lost.
	const halfPaid = bnpl({ balance: 200, remainingPayments: 2 });
	eq(bnplPaymentsTotal(halfPaid), 2, "precondition — an UNSTAMPED half-paid plan reads 'of 2', its history gone");

	const stamped = raiseOriginalBalance(halfPaid);
	eq(stamped.originalBalance, 200, "the rule applies to BNPL like anything else");
	eq(bnplPaymentsTotal(stamped), 2, "⛔ and the count is UNCHANGED — a stamp cannot inflate it");

	// The case the exemption was meant to protect, stated as the number on screen.
	const withHistory = bnpl({ balance: 200, remainingPayments: 2, originalBalance: 400 });
	eq(bnplPaymentsTotal(withHistory), 4, "a plan that KEPT its stamp reads 'of 4' — better, not worse");
	eq(bnplPaymentsTotal(raiseOriginalBalance(withHistory)), 4, "…and raising leaves it at 4");

	// A plan corrected UPWARD (2 → 4 payments): the total must follow the schedule, not lag it.
	const corrected = bnpl({ balance: 400, remainingPayments: 4, originalBalance: 200 });
	eq(raiseOriginalBalance(corrected).originalBalance, 400, "a lengthened plan raises the stamp");
	eq(bnplPaymentsTotal(raiseOriginalBalance(corrected)), 4, "…and reads 'of 4', never 'of 6'");
}

console.log(`  ✓ originalBalanceHighWater — ${passed} assertions`);
