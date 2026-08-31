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
 *
 * ## ⛔ S1.12.5.7 [pass-5 `B5-9`] — "the ids that EXIST" WAS THE WRONG SET, AND THAT PREMISE WAS THE DEFECT
 *
 * ⚡ Measured through the real store with real actions: tick the Today card's extra-payment checkbox
 * against a Store Card (**$500**), delete the Store Card, add a Car loan. `newDebtId` minted
 * `debt-<cycle>-2` — **the deleted debt's id** — because it checked the surviving `debts` array, and at
 * the next payday the Car loan was written down to **$10,967.54 instead of $11,467.54**. ⛔ **$500 of a
 * payment that was never made against it, persisted**, with nothing on any screen saying why. One
 * variable, the minted id; the control minted on a different cycle date and produced $11,467.54.
 *
 * ⚡ **And four more records followed the id**: a brand-new $11,380 debt inherited a 75% milestone
 * high-water (so its 25/50/75% beats can never fire), a `recommendationOverride`, a pending *"paid off!"*
 * beat naming it, and a data-repair record. The CSV import door does the same in batch.
 *
 * ⛔ **Uniqueness against the `debts` array is not uniqueness against the ids the STORE still references.**
 * `completedRecommendedActions`, `milestoneMaxProgress`, `recommendationOverrides`, `pendingPayoff` and
 * `pendingDataRepairs` all key on debt id and all outlive a delete. The docblock above was careful about
 * the counter it rejected and silent about the set it was checking, which is the half that was wrong.
 * ⚠️ `cycleDate` is `paycheck.currentDate` and holds still for a whole pay cycle, so *"delete and re-add
 * inside one cycle"* is the ORDINARY case, not a corner.
 *
 * ⛔ **The obvious repair is refused, and lane B said why**: purging `completedRecommendedActions` on
 * delete closes this and INTRODUCES a different loss — those entries are the record of payments the user
 * reported making, and `cycleHistory`'s snapshot is built from them at rollover, so deleting them
 * rewrites the closing cycle's history. Minting from a persisted high-water changes the id scheme for
 * every future debt. **The set is widened instead: mint against every id the store still mentions.**
 */

/**
 * Every debt id the store still REFERENCES, wherever it appears — not the ids the `debts` array holds.
 *
 * ⛔ **Derived from the serialized store, deliberately, rather than from a list of the fields that key on
 * debt id.** Such a list is exactly the enumeration this round has watched fail eight times: it would be
 * right on the day it was written and silent about the next field anyone adds. A dead id cannot hide from
 * a scan of the whole document. ⚠️ The cost is a `JSON.stringify` of the store on each mint, which happens
 * once per debt the user adds.
 */
export function reservedDebtIds(store: unknown): Set<string> {
	const found = new Set<string>();
	for (const m of JSON.stringify(store ?? null).matchAll(/debt-\d{4}-\d{2}-\d{2}-\d+/g)) found.add(m[0]);
	return found;
}
export function newDebtId(cycleDate: string, reserved: ReadonlySet<string>): string {
	// ⚠️ From 1, not from `existing.length + 1`. The old start was an optimisation over a contiguous list
	// and it is wrong over a set with a gap — which is precisely the shape a delete leaves behind.
	let n = 1;
	while (reserved.has(`debt-${cycleDate}-${n}`)) n += 1;
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
export function mintDebtIds(cycleDate: string, reserved: ReadonlySet<string>, count: number): string[] {
	const claimed = new Set(reserved);
	const minted: string[] = [];
	for (let i = 0; i < count; i += 1) {
		const id = newDebtId(cycleDate, claimed);
		minted.push(id);
		claimed.add(id);
	}
	return minted;
}
