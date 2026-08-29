/**
 * ⛔ **"1 cycles" — AND THE HELPER THAT PREVENTS IT ALREADY EXISTED TWICE.**
 * [S1.11.5.5 · pass-4 `C4-8`]
 *
 * ⚡ History's headline read *"$200 paid down across **1 cycles**"* — on the **first** render of that
 * line for every user, because the screen shows it as soon as `paidDown > 0`, which is the first rollover
 * in which anything was paid. Grammar rather than money, which is why it is a `minor`; worth closing
 * because it is the one render of that headline everybody sees.
 *
 * ⚠️ **`data/backup.ts` and `data/readBackup.ts` each carried a private copy**, character-identical. The
 * finding's own remedy was *"use either; do not add a third spelling"* — collapsing the pair is the same
 * move for one unit of extra work, and it is what every other fix this round did with two producers of
 * one fact.
 *
 * ⛔ **Sites this does NOT cover, measured rather than assumed.** A repo-wide sweep of interpolated
 * `{count} <word>s` strings outside tests returns five: `money.tsx:817`, `money.tsx:1014` and
 * `dataRepairsCopy.ts` handle the singular inline and are correct; `CashRunwayChart`'s *"next {n}
 * paychecks"* is **unreachable at 1** — the component returns `null` above it when `cycles.length < 2`.
 * That leaves History as the only live one, which is why this is a helper and not a sweep.
 */
export function plural(n: number, one: string, many: string): string {
	return `${n} ${n === 1 ? one : many}`;
}
