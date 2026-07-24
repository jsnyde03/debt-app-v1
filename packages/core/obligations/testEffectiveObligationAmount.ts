/**
 * §2.5 reconciliation tests for trial / intro-price resolution — the amount an obligation charges in the
 * cycle its `dueDate` falls in, and the strict no-op guarantee for every non-trial obligation.
 */
import type { RequiredExpense } from "@core/storage/debtPlannerStorage";
import { effectiveRequiredExpenseAmount, resolveTrialAmounts } from "@core/obligations/effectiveObligationAmount";

function assertMoney(actual: number, expected: number, label: string) {
	if (actual !== expected) throw new Error(`FAIL [${label}]: expected ${expected}, got ${actual}`);
}
function assertTrue(cond: boolean, label: string) {
	if (!cond) throw new Error(`FAIL [${label}]`);
}

function base(over: Partial<RequiredExpense>): RequiredExpense {
	return { id: "e1", name: "Streaming", amount: 0, dueDate: "2026-08-01", recurrence: "monthly", ...over };
}

// A plain (non-trial) obligation is untouched.
assertMoney(effectiveRequiredExpenseAmount(base({ amount: 40 })), 40, "non-trial → amount");

// A trial whose occurrence is BEFORE the kick-in date still bills the intro amount.
assertMoney(
	effectiveRequiredExpenseAmount(base({ amount: 0, isTrial: true, fullAmount: 40, fullChargeDate: "2026-09-01", dueDate: "2026-08-01" })),
	0,
	"trial pre-conversion → intro amount ($0)",
);

// On/after the kick-in date it bills the full amount (boundary = on the date itself).
assertMoney(
	effectiveRequiredExpenseAmount(base({ amount: 0, isTrial: true, fullAmount: 40, fullChargeDate: "2026-09-01", dueDate: "2026-09-01" })),
	40,
	"trial on kick-in date → full amount",
);
assertMoney(
	effectiveRequiredExpenseAmount(base({ amount: 2, isTrial: true, fullAmount: 40, fullChargeDate: "2026-09-01", dueDate: "2026-10-01" })),
	40,
	"trial after kick-in date → full amount (intro $2 ignored)",
);

// Guards: an incompletely-specified trial degrades to the intro amount (never NaN / never a phantom jump).
assertMoney(effectiveRequiredExpenseAmount(base({ amount: 5, isTrial: true, fullAmount: 40 })), 5, "trial missing fullChargeDate → intro amount");
assertMoney(effectiveRequiredExpenseAmount(base({ amount: 5, isTrial: true, fullChargeDate: "2020-01-01" })), 5, "trial missing fullAmount → intro amount");
assertMoney(
	effectiveRequiredExpenseAmount(base({ amount: 5, isTrial: true, fullAmount: Number.NaN, fullChargeDate: "2020-01-01" })),
	5,
	"trial with non-finite fullAmount → intro amount (no NaN leak)",
);

// resolveTrialAmounts: reference-stable no-op for unchanged rows; maps only the converted one.
{
	const rows: RequiredExpense[] = [
		base({ id: "plain", amount: 40 }),
		base({ id: "pre", amount: 0, isTrial: true, fullAmount: 30, fullChargeDate: "2026-09-01", dueDate: "2026-08-01" }),
		base({ id: "post", amount: 0, isTrial: true, fullAmount: 30, fullChargeDate: "2026-09-01", dueDate: "2026-09-01" }),
	];
	const resolved = resolveTrialAmounts(rows);
	assertTrue(resolved[0] === rows[0], "unchanged plain row keeps reference identity");
	assertTrue(resolved[1] === rows[1], "pre-conversion trial keeps reference identity (amount unchanged)");
	assertTrue(resolved[2] !== rows[2] && resolved[2].amount === 30, "converted trial is a new row at the full amount");
	// Idempotent — resolving twice is stable.
	assertMoney(resolveTrialAmounts(resolved)[2].amount, 30, "resolveTrialAmounts is idempotent");
}

console.log("✅ §2.5 effective-obligation-amount (trial resolution) tests passed.");
