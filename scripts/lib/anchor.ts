/**
 * ⛔ **ANCHOR MATCHING — ONE PRODUCER, AND IT IS LINE-ENDING AGNOSTIC.** [S1.11.6.0]
 *
 * ⚡ **`lint:finding-guards` was RED IN CI FOR SIX CONSECUTIVE PUSHES WHILE READING GREEN LOCALLY.**
 * `S1P3-M7`'s recorded proof anchors carry literal `\r\n`. A Windows working tree is CRLF, so they
 * matched here; CI checks out LF, so they matched **0×** and the gate reported *"the proof is VOID"* —
 * about a proof that is fine. ⛔ Twelve registry entries carry a multi-line anchor, so it is a class.
 *
 * ⚠️ **It fails in the shape this repo has now paid for three times: an instrument that is green where it
 * is run and red where it matters.** `REVERIFY4-2` — list from git, content from the working tree.
 * `lint:surface-complete` — `git ls-files` plus `existsSync`. This one. Each was closed by **picking one
 * world**, and that is what this does: every comparison happens in LF, on both sides.
 *
 * ⛔ **AND SIX SESSIONS IN A ROW REPORTED THIS GATE GREEN**, because locally it is. A permanently-red CI
 * is worse than no CI — `web-e2e.yml`'s own header records that failure killing the previous lane — and
 * nobody looked, because the local run said the opposite.
 *
 * ⚠️ **No side effects on import.** `prove-guards.ts` reads the registry and parses argv at module scope,
 * so importing *it* to test this would run a CLI; the logic lives here so `test-line-endings.ts` can
 * assert it directly. That is also why there is exactly one copy: two normalisers that drift is how the
 * checker and the planter would start disagreeing about what a proof means.
 */

/** Every anchor comparison happens in this world. */
export const lf = (s: string): string => s.replace(/\r\n/g, '\n');

export interface AnchorEdit {
	/** ⚠️ Carried so `Unfix` is assignable without a cast — the registry's own shape names the target too. */
	at?: string;
	find: string;
	replace: string;
}

/**
 * ⛔ **THE ANCHOR IS COUNTED, NOT SEARCHED.** `String.replace` takes the FIRST match and says nothing
 * about the others, so an anchor appearing twice silently un-fixes one of two sites and the plant then
 * measures a half-defect. ⚠️ Zero matches is the more dangerous direction: it reads as
 * `plant-not-applied`, which looks like a broken plant rather than what it is — **a proof whose anchor
 * the code has moved out from under**, i.e. a recorded measurement that no longer describes this tree.
 *
 * ⚠️ `next` is built from the NORMALISED text on purpose. A plant that wrote back CRLF on one machine and
 * LF on another would make the *restore* platform-dependent too — the half that loses work, rather than
 * the half that reds.
 */
export function planEdit(text: string, u: AnchorEdit): { next: string; count: number } {
	const find = lf(u.find);
	const body = lf(text);
	const count = body.split(find).length - 1;
	return { next: count === 1 ? body.split(find).join(lf(u.replace)) : text, count };
}

/** How many times an anchor occurs in a file's text, in the one world. */
export function anchorCount(text: string, find: string): number {
	return lf(text).split(lf(find)).length - 1;
}
