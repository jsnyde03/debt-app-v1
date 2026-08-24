/**
 * Where a new debt's id comes from.
 *
 * ⚠️ **Uniqueness comes from the ids that EXIST, not from a module counter.** A counter namespaced by the
 * cycle date looks equivalent and is not: it restarts at zero on every launch while the cycle date stays
 * put, so a debt added before a relaunch and one added after can be handed the same id.
 *
 * ⛔ **No `Date.now()`** — the React Compiler treats it as an impure render-time call, and the callers
 * declare their submit handlers in the component body.
 *
 * Shared rather than local to the debt sheet because the CSV import mints ids too, and a second scheme
 * for the same entity is how two rows end up disagreeing about which debt they are.
 */
export function newDebtId(cycleDate: string, existing: { id: string }[]): string {
  const used = new Set(existing.map((d) => d.id));
  let n = existing.length + 1;
  while (used.has(`debt-${cycleDate}-${n}`)) n += 1;
  return `debt-${cycleDate}-${n}`;
}

/**
 * Ids for a whole batch, each unique against the existing portfolio **and** against the ones already
 * minted in this batch.
 *
 * ⛔ This is the reason `newDebtId` alone is not enough for an import. Called in a loop against an
 * unchanged list it returns the SAME id every time — the list it derives from has not grown yet. The
 * accumulator is the fix, and it is easy to get wrong in a caller, so it lives here with its own test.
 */
export function mintDebtIds(cycleDate: string, existing: { id: string }[], count: number): string[] {
  const claimed = existing.map((d) => ({ id: d.id }));
  const minted: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = newDebtId(cycleDate, claimed);
    minted.push(id);
    claimed.push({ id });
  }
  return minted;
}
