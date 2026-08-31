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
