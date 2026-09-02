/**
 * ⛔ **S1.13.7.11 [pass-6 `A3-3`] — THE ONE WAY A STORE ACTION EDITS ONE ROW BY ID, AND IT REPORTS
 * WHETHER IT FOUND ONE.**
 *
 * ⚡ **The defect it retires:** every id-keyed write in `store.ts` was `list.map(x => x.id === id ? … : x)`
 * with **no `find` first and no branch for zero matches.** `.map` over an array containing no such id
 * returns a new, element-wise identical array; `set` fires, every subscriber re-renders, and **no return
 * value distinguishes a miss from a hit.** The user taps, the row does not change, and nothing anywhere
 * says why. `A3-2` was the live instance — a weekly bill's `${id}__occ2` matched the stored list, which
 * holds no such id — and it was invisible for exactly this reason.
 *
 * ⚠️ **The finding named two sites. There were eight.** `markExpensePaid` · `deferExpense` ·
 * `setDeferability` · `markDebtMinimumPaid` · `updateExpense` · `updateGoal` · `updateLivingExpense` ·
 * `verifyDebtBalance`. The standing rule — *budget the enumeration, not the list* — and the reason
 * `lint:store-id-writes` exists rather than eight edits and a hope.
 *
 * ⛔ **A MISS RETURNS THE ORIGINAL ARRAY, BY REFERENCE.** That is the testable half and it is deliberate:
 * `__DEV__` is `undefined` under the tsx runner (`sandboxStore.ts:217-221` records the same constraint),
 * so a dev-only warning is a decoration no test can observe. Identity preservation is a property a test
 * CAN assert, and it is also the fix for the phantom re-render.
 */
export function updateById<T extends { id: string }>(
    list: T[],
    id: string,
    patch: (item: T) => T
): { next: T[]; matched: boolean } {
    let matched = false;
    const next = list.map((item) => {
        if (item.id !== id) return item;
        matched = true;
        return patch(item);
    });
    // ⛔ The ORIGINAL reference on a miss, not `next` — an element-wise-identical copy is exactly what made
    // this class invisible, and a caller that returns it hands zustand a new object to notify on.
    return matched ? { next, matched } : { next: list, matched };
}
