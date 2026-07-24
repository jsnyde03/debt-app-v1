import type { RequiredExpense, RequiredExpenseCategory } from "@core/storage/debtPlannerStorage";

export type Deferability = "essential" | "deferrable";

/**
 * §2.6 Recovery Plan — is this obligation safe to defer a cycle, or must it be paid now? A per-bill user
 * `deferability` override ALWAYS wins; otherwise it derives from `category`. Only categories genuinely
 * KNOWN to be deferrable (subscriptions) default to deferrable; everything else — the essential
 * categories AND `other`/uncategorized — defaults to ESSENTIAL. (MF.1 / audit #3: never call a bill we
 * can't classify "safe to defer"; `ExpenseSheet` defaults new bills to `other`, and migrated bills have
 * no category, so a deferrable default would pre-suggest deferring the user's rent.) Debt minimums are
 * essential by rule in the recovery engine (credit impact) — this classifies REQUIRED EXPENSES only.
 */
const DEFERRABLE_CATEGORIES: readonly RequiredExpenseCategory[] = ["subscriptions"];

export function classifyDeferability(expense: RequiredExpense): Deferability {
	if (expense.deferability) return expense.deferability; // the user's explicit call wins
	if (expense.category && DEFERRABLE_CATEGORIES.includes(expense.category)) return "deferrable";
	return "essential";
}
