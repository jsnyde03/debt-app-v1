/**
 * ⛔ **THE SUBJECT OF `prove:guards --selftest`, AND IT IS DELIBERATELY TRIVIAL.**
 *
 * The harness's own 2×2 needs a file it can un-fix without touching anything real: a hermetic control
 * cannot depend on a live defect, because the day that defect is fixed the control silently inverts.
 * `prove-guards-probe.mjs` reads the marker below and reds when it is gone — that is the entire contract.
 *
 * ⚠️ **Nothing imports this.** It is an input to a plant, like `authoring-plant-target.md`.
 */
export const MARKER = 'the guard holds';
// The line below is deliberately inert: the DEAD half of the self-test un-fixes THIS, and the probe is
// blind to it — a plant that lands and changes nothing the check is about.
export const IGNORED_BY_THE_PROBE = 'this line is not what the probe reads';
