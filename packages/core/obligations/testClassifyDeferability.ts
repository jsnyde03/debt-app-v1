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

// Category defaults — essential set.
for (const category of ["housing", "utilities", "medical", "insurance"] as RequiredExpenseCategory[]) {
	assertEq(classifyDeferability(bill({ category })), "essential", `${category} → essential`);
}
// Category defaults — deferrable set.
for (const category of ["subscriptions", "other"] as RequiredExpenseCategory[]) {
	assertEq(classifyDeferability(bill({ category })), "deferrable", `${category} → deferrable`);
}
// Uncategorized → deferrable (offered, never auto-deferred; the user confirms).
assertEq(classifyDeferability(bill({ category: undefined })), "deferrable", "uncategorized → deferrable");

// The user override ALWAYS wins over the category default (both directions).
assertEq(classifyDeferability(bill({ category: "housing", deferability: "deferrable" })), "deferrable", "override flips an essential category to deferrable");
assertEq(classifyDeferability(bill({ category: "subscriptions", deferability: "essential" })), "essential", "override flips a deferrable category to essential");

console.log("✅ §2.6 classifyDeferability tests passed.");
