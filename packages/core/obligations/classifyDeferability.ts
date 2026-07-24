import type { RequiredExpense, RequiredExpenseCategory } from "@core/storage/debtPlannerStorage";

export type Deferability = "essential" | "deferrable";

/**
 * §2.6 Recovery Plan — is this obligation safe to defer a cycle, or must it be paid now? A per-bill user
 * `deferability` override ALWAYS wins; otherwise it derives from `category` (the day-one default, no new
 * capture). Housing / utilities / medical / insurance = essential (lapsing has real consequences);
 * subscriptions / other / uncategorized = deferrable (the user still confirms every defer, so an
 * unknown bill is offered — never auto-deferred). Debt minimums are essential by rule in the recovery
 * engine (credit impact), handled there — this classifies REQUIRED EXPENSES only.
 */
const ESSENTIAL_CATEGORIES: readonly RequiredExpenseCategory[] = ["housing", "utilities", "medical", "insurance"];

export function classifyDeferability(expense: RequiredExpense): Deferability {
	if (expense.deferability) return expense.deferability; // the user's explicit call wins
	if (expense.category && ESSENTIAL_CATEGORIES.includes(expense.category)) return "essential";
	return "deferrable";
}
