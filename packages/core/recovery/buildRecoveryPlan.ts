/**
 * §2.6 Recovery Plan engine — the deficit direction of the Guardian's priority ladder. Given the cycle's
 * shortfall (the gap the Guardian already computes) and this cycle's obligations split into essential
 * ("cover now") and deferrable, it builds the catch-up plan: which deferrable bills to push to next
 * cycle, ranked largest-first so the gap closes with the FEWEST defers, the running amount each closes,
 * and — honestly — whether deferring everything deferrable even closes it (the un-closeable branch).
 *
 * Pure + deterministic (reconciliation-tested). It only RANKS + does gap math; the user confirms every
 * defer, and the apply writes back through the store (advancing due dates). Debt minimums are essential
 * by rule (credit impact) — the caller places them in `essential`, so this stays obligation-agnostic.
 */

function roundMoney(n: number): number {
	return Math.round(n * 100) / 100;
}

/** A cent of tolerance so float dust never leaves a "$0.00 still short" or drops a just-covering defer. */
const EPS = 0.005;

export interface RecoveryCandidate {
	id: string;
	name: string;
	amount: number;
}

export interface RecoveryDeferItem extends RecoveryCandidate {
	/** How much of the gap is closed after deferring through this item (capped at the gap). */
	cumulativeClosed: number;
	/** In the minimal largest-first set that first closes the gap (the app suggests these pre-checked). */
	suggested: boolean;
}

export interface RecoveryPlan {
	/** The shortfall to close (rounded, never negative). */
	gap: number;
	/** Essential obligations that must be paid this cycle (informational "pay these first"). */
	coverNow: RecoveryCandidate[];
	/** Deferrable obligations, ranked largest-first, with the running close + the suggested set. */
	safeToDefer: RecoveryDeferItem[];
	/** Some subset of the deferrable bills can close the gap (gap 0 → trivially true). */
	closeable: boolean;
	/** The gap that remains even after deferring EVERY deferrable bill (>0 → the honest un-closeable branch). */
	residualGap: number;
	/** The minimal largest-first defer set that first closes the gap (all deferrable when not closeable). */
	suggestedDeferIds: string[];
}

export function buildRecoveryPlan(input: {
	gap: number;
	deferrable: RecoveryCandidate[];
	essential?: RecoveryCandidate[];
}): RecoveryPlan {
	const gap = Math.max(0, roundMoney(input.gap));
	const coverNow = input.essential ?? [];

	// Largest-first: closes the gap with the fewest bills pushed to next cycle. Ignore non-positive amounts.
	const sorted = input.deferrable.filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);
	const totalDeferrable = roundMoney(sorted.reduce((s, c) => s + c.amount, 0));
	const closeable = gap === 0 || totalDeferrable >= gap - EPS;
	const residualGap = roundMoney(Math.max(0, gap - totalDeferrable));

	let running = 0;
	let closed = false;
	const safeToDefer: RecoveryDeferItem[] = sorted.map((c) => {
		const suggested = gap > 0 && !closed; // the prefix up to and including the item that crosses the gap
		running = roundMoney(running + c.amount);
		if (gap > 0 && running >= gap - EPS) closed = true;
		return { ...c, cumulativeClosed: gap > 0 ? Math.min(running, gap) : 0, suggested };
	});

	return {
		gap,
		coverNow,
		safeToDefer,
		closeable,
		residualGap,
		suggestedDeferIds: safeToDefer.filter((i) => i.suggested).map((i) => i.id),
	};
}
