/**
 * §2.6 reconciliation tests for essential-vs-deferrable classification — the category default
 * (subscriptions + [D25]'s `discretionary` deferrable; housing/utilities/medical/insurance AND
 * `other`/uncategorized essential) and the per-bill override that always wins.
 *
 * ⚠️ This header used to say "subscriptions/other/uncategorized deferrable", which the assertions
 * below have contradicted since MF.1 / audit #3 flipped the unknown default to essential. A doc that
 * disagrees with the checks beside it is how A3.7 came to be filed backwards in the honesty ledger.
 */
import type { RequiredExpense, RequiredExpenseCategory } from "@core/storage/debtPlannerStorage";
import { classifyDeferability } from "@core/obligations/classifyDeferability";

function assertEq(actual: string, expected: string, label: string) {
	if (actual !== expected) throw new Error(`FAIL [${label}]: expected ${expected}, got ${actual}`);
}

function bill(over: Partial<RequiredExpense>): RequiredExpense {
	return { id: "e1", name: "Bill", amount: 100, dueDate: "2026-08-01", recurrence: "monthly", ...over };
}

// Only genuinely-known-deferrable categories default deferrable (MF.1 / audit #3).
assertEq(classifyDeferability(bill({ category: "subscriptions" })), "deferrable", "subscriptions → deferrable");
// [D25] (3.7.A3.7) — a one-off discretionary buy is deferrable BY STATED RULE. Before this, the
// affordability card applied purchases with no category at all, so a "New couch" inherited the
// uncategorized ESSENTIAL default and Recovery would sooner defer a medical bill than cut it.
assertEq(classifyDeferability(bill({ category: "discretionary" })), "deferrable", "discretionary → deferrable ([D25])");
assertEq(classifyDeferability(bill({ category: "discretionary", deferability: "essential" })), "essential", "…and the user can still override it back to essential");
// The essential categories default essential.
for (const category of ["housing", "utilities", "medical", "insurance"] as RequiredExpenseCategory[]) {
	assertEq(classifyDeferability(bill({ category })), "essential", `${category} → essential`);
}
// `other` + uncategorized → ESSENTIAL (never pre-suggest deferring a bill we can't classify).
assertEq(classifyDeferability(bill({ category: "other" })), "essential", "other → essential (can't classify → don't call it safe)");
assertEq(classifyDeferability(bill({ category: undefined })), "essential", "uncategorized → essential");

// The user override ALWAYS wins over the category default (both directions).
assertEq(classifyDeferability(bill({ category: "housing", deferability: "deferrable" })), "deferrable", "override flips an essential category to deferrable");
assertEq(classifyDeferability(bill({ category: "subscriptions", deferability: "essential" })), "essential", "override flips a deferrable category to essential");

console.log("✅ §2.6 classifyDeferability tests passed.");
