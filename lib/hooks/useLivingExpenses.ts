import { usePersistedState } from "@/lib/storage/usePersistedState";
import type { LivingExpense } from "@core/types/livingExpense";
import { livingExpensePresets } from "@core/constants/livingExpensePresets";

/**
 * Owns the `livingExpenses` persisted state, seeded from the presets — one
 * domain hook matching the other `lib/hooks/*` extractions (extracted from
 * `page.tsx` in 2.18 Phase 1; no behaviour change).
 */
export function useLivingExpenses() {
    const [livingExpenses, setLivingExpenses] = usePersistedState<LivingExpense[]>(
        "debtPlanner.livingExpenses",
        livingExpensePresets.map((expense, index) => ({
            ...expense,
            id: `living-${index}`,
        }))
    );

    return { livingExpenses, setLivingExpenses };
}
