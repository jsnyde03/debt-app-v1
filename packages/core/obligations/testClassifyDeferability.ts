/**
 * §2.6 reconciliation tests for essential-vs-deferrable classification — the category default (housing/
 * utilities/medical/insurance essential; subscriptions/other/uncategorized deferrable) and the per-bill
 * override that always wins.
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
