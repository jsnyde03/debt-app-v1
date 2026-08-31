/**
 * ⛔ **S1.13.3 — ONE PRODUCER OF "CAN THIS FILE HOLD A MONEY DEFECT?"**
 *
 * Both the pass-coverage exit (`check-pass-coverage.ts`) and the router (`audit-route.ts`) need this
 * question answered, and they need the SAME answer: a router that seeds files the exit does not require,
 * or an exit that requires files the router never seeds, is two producers of one fact — the class this
 * round collapsed in `A5-1`, `A5-2`, `A-F4` and `C5-2`. It lives here so there is nothing to disagree.
 *
 * ## ⚠️ The predicate is over CONTENT, and it fails toward INCLUSION
 *
 * It is not a path list and not a directory list. Both are the shape that has undercounted this class
 * every time it was measured — 19 → 67 → 93 for `A5-4`, five files → six for the conflict markers, and
 * five separate widenings of S1's own roots. **One money word makes a file money-bearing.** The cost of a
 * false positive is a lane reading a `Button.tsx`; the cost of a false negative is a money defect nobody
 * was pointed at.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');

/**
 * ⚠️ Deliberately broad: a term earns its place by being unable to appear in a file that could NOT hold a
 * money defect. `price`/`cost` because the paywall is money; `apr`/`interest` because the projection is;
 * `cycle`/`payday` because a cadence error IS a money error, which is what CLASS V cost three files to
 * learn; `floor`/`guardian` because the Guardian state is derived from cash against a floor — added after
 * LOOKING at what the first cut excluded rather than trusting its count, which is how
 * `packages/core/guardian/testComputeState.ts` was caught sitting outside the money set.
 */
export const MONEY_WORDS = [
  'balance', 'amount', 'paycheck', 'payday', 'payment', 'debt', 'reserve', 'goal', 'apr', 'interest',
  'cash', 'money', 'currency', 'dollar', 'surplus', 'shortfall', 'allocat', 'budget', 'expense', 'income',
  'payoff', 'snowball', 'avalanche', 'premium', 'price', 'cost', 'bnpl', 'minimum', 'cushion', 'buffer',
  'cycle', 'forecast', 'projection', 'milestone', 'subscription', 'refund', 'billing',
  'floor', 'guardian', 'owe', 'spend', 'afford',
];

const MONEY_RE = new RegExp(`(${MONEY_WORDS.join('|')})`, 'i');

/**
 * ⛔ **S1.13.5 [pass-6 `D2-3`] — THE FLOOR LIVES BESIDE THE PREDICATE, because both consumers need it and
 * only one had it.**
 *
 * ⚡ **Measured by lane D2, by planting:** blind `carriesMoneyClaim` and the route's money population
 * collapses **446 → 72**, while `audit:route-check` still exits **0** and prints
 * `⭐ exit reachable: all 72 …`. Both of that assertion's totality checks filter by *the predicate under
 * test*, so a blind predicate makes the population empty, the unreachable set empty, and the check
 * green — **the identical fail-open `check-pass-coverage.ts` already carried this constant to prevent**,
 * re-committed one file over, in the fix written to make the exit checkable.
 *
 * ⛔ **And the window was the whole pass**: the router runs BEFORE the lanes and the exit runs AFTER, so
 * the guarded half could not have caught it until every lane had already been dispatched at a route built
 * from 72 files.
 *
 * ⚠️ **Exported from here rather than re-declared**, for the reason this module exists at all: a floor on
 * a predicate, kept in a different file from the predicate, is two producers of one fact.
 * **Downward-only** — 424 is 95% of the 446 measured 2026-08-31, per `gate-scan-floors.json`'s margin.
 */
export const MIN_MONEY_BEARING = 424;

export function carriesMoneyClaim(rel: string): boolean {
  // ⚠️ The PATH counts too, not only the contents: a file named `moneyFormatters.test.ts` whose body is
  // all fixtures still belongs to the money surface, and a reader looking only at contents would miss it.
  if (MONEY_RE.test(rel)) return true;
  try {
    return MONEY_RE.test(readFileSync(join(REPO_ROOT, rel), 'utf8'));
  } catch {
    // ⛔ Unreadable → money-bearing. Failing toward inclusion is the whole posture: an unreadable file is
    // an UNKNOWN, and silently classifying unknowns as "no money here" is how a population goes quietly
    // empty while every count above it still reads plausible.
    return true;
  }
}
