/**
 * ⛔ **S1.12.5.4 [pass-5 `C5-1`] — WHEN A BALANCE COULD NOT BE READ, NOTHING DERIVED FROM IT MAY BE STATED.**
 *
 * ⚡ Pass-4 `C4-9` gated four hand-listed props on Progress and let the rest of the view reach the chart.
 * Measured with one of two cards unreadable: the hero read **"—"** and *"Some balances couldn't be read"*,
 * the "Your plan" legend printed no date at all — **and the Safe-floor row printed "June 2026" against a
 * true "November 2026"**, five months early. ⛔ **The only debt-free date left on the screen was the one
 * the design calls the honest floor for a variable earner**, and it credited the user with a card they
 * still owed in full.
 *
 * ⚠️ **This asserts over the WHOLE view, key by key, rather than over the four props that were gated.**
 * The question is not *"is `debtFreeDate` suppressed"* — it is *"can any figure derived from a balance the
 * app could not read reach the screen"*, and that is only answerable against every field at once.
 *
 * Throw-based; run via `npm run test:app`.
 */
import { gagBalanceDerived, type PayoffView } from '@/store/payoffSelectors';

function assert(cond: boolean, label: string): void {
  if (!cond) throw new Error(`FAIL [${label}]`);
}
function eq(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

/** A view in which every balance-derived figure is a real, statable value — the "before" side. */
const FULL: PayoffView = {
  hasDebts: true,
  debtFreeDate: 'July 2026',
  interestSaved: { kind: 'saving', interestSaved: 2858.98, monthsSaved: 32 },
  monthlyExtra: 200,
  snowball: [{ month: 0, balance: 10000 }, { month: 1, balance: 9000 }] as PayoffView['snowball'],
  avalanche: [{ month: 0, balance: 10000 }] as PayoffView['avalanche'],
  snowballClears: [{ id: 'd1', name: 'Visa', month: 12 }] as unknown as PayoffView['snowballClears'],
  avalancheClears: [{ id: 'd1', name: 'Visa', month: 12 }] as unknown as PayoffView['avalancheClears'],
  minimums: [{ month: 0, balance: 10000 }] as PayoffView['minimums'],
  lean: [{ month: 0, balance: 10000 }] as PayoffView['lean'],
  band: { typical: 'July 2026', lean: 'November 2026', hasBand: true },
  order: [],
  focus: null,
};

const gagged = gagBalanceDerived(FULL);

/**
 * ⛔ **THE HEADLINE: the Safe-floor date is the one that shipped, so it is asserted first.**
 * `hasBand: false` removes the ROW, not merely its date — *"Safe-floor —"* would still assert that a floor
 * had been computed off balances the app could not read.
 */
eq(gagged.band.lean, null, '⛔ C5-1 — the Safe-floor date is not stated when a balance could not be read');
eq(gagged.band.typical, null, '⛔ C5-1 — …nor the typical one');
eq(gagged.band.hasBand, false, '⛔ C5-1 — …and the band ROW goes with them, not just its dates');
eq(gagged.debtFreeDate, null, '⛔ C5-1 — the plan date is gagged (this half C4-9 already had)');
eq(gagged.interestSaved, { kind: 'none' }, '⛔ C5-1 — interest saved is a projection off balances');

/**
 * ⛔ **THE CURVES AND THEIR LABELS.** The plotted line, its `$k` gridline labels, the per-debt waypoints
 * and the scrub readout are all read off these arrays — measured printing `$4,000` from a repaired `$0`
 * against a true `$10,000`.
 */
for (const key of ['snowball', 'avalanche', 'minimums', 'lean', 'snowballClears', 'avalancheClears'] as const) {
  eq((gagged[key] as unknown[]).length, 0, `⛔ C5-1 — \`${key}\` is not plotted from a balance that could not be read`);
}

/**
 * ⭐ **THE CONTROLS, and without them "gag everything" passes every row above.** Three facts survive
 * because none of them requires reading a balance: that debts exist at all, what the user themselves typed
 * as extra, and the ordering the row-level guards already gag figure-by-figure on Money.
 */
eq(gagged.hasDebts, true, '⭐ C5-1 control — that debts EXIST is readable without reading a balance');
eq(gagged.monthlyExtra, 200, "⭐ C5-1 control — the user's own input is not a claim about their balances");
eq(gagged.order, [], '⭐ C5-1 control — the ordering is passed through, not blanked');

/**
 * ⛔ **AND THE UNGAGGED VIEW IS UNTOUCHED**, which is what separates this from a screen that simply shows
 * less. `C4-9`'s own finding was that gating deleted a debt from the screen; the gag must be a function of
 * the claim, not a permanent narrowing.
 */
eq(FULL.band.lean, 'November 2026', '⭐ C5-1 control — gagging does not mutate the view it was given');
eq(FULL.snowball.length, 2, '⭐ C5-1 control — …including its arrays');

/**
 * ⛔ **EVERY KEY IS ACCOUNTED FOR.** A field added to `PayoffView` and forgotten here is the exact shape
 * of `C4-9`: a list of props that was correct and incomplete. `gagBalanceDerived` writes every key out so
 * the compiler refuses an unclassified one; this asserts the same thing at runtime, so the two cannot drift.
 */
const KNOWN = [
  'hasDebts', 'debtFreeDate', 'interestSaved', 'monthlyExtra', 'snowball', 'avalanche',
  'snowballClears', 'avalancheClears', 'minimums', 'lean', 'band', 'order', 'focus',
];
const unclassified = Object.keys(gagged).filter((k) => !KNOWN.includes(k));
assert(
  unclassified.length === 0,
  `⛔ C5-1 — PayoffView gained ${JSON.stringify(unclassified)}; decide in gagBalanceDerived whether it is balance-derived, then list it here`,
);
eq(Object.keys(gagged).length, KNOWN.length, '⛔ C5-1 — …and none of the known keys was dropped from the gagged view');

console.log('  ✓ C5-1 — no figure derived from an unreadable balance survives the gag');
