/**
 * ⛔ **S1.12.5.3 [pass-5 `A5-2` · `B5-4`] — THE MONEY FORMATTERS' FIRST TEST.**
 *
 * ⚡ **`formatCurrency`'s `Number.isFinite` guard survived its own un-fix in all four gates that run.**
 * Deleting it renders `$NaN` and `$∞`, and `test:regression`, `test:app`, `test:scenarios` **and**
 * `lint:money` were all green over that build. It is the highest-fan-in money guard in the tree — its own
 * header calls it the root fix that let T6.4 collapse **seven** local formatters — and nothing asserted it.
 *
 * ⚠️ **`lint:money` was written to stop the formatters MULTIPLYING, not to stop the survivor being edited.**
 * The two questions look alike and are not: one is about how many there are, this is about what they do.
 *
 * ⛔ **WHY THIS ITERATES A TABLE RATHER THAN NAMING A FUNCTION.** The finding was reported against
 * `formatCurrency`. Probing the class found **`formatDisplayAmount` rendering `"NaN.N"` with no guard at
 * all** — a fifth formatter, and the one `check-trust-claims`'s `PRINTS_MONEY` cannot see (`D5-13`). A test
 * that named `formatCurrency` would have closed the finding and left that standing. ⚠️ **The table below is
 * still an enumeration, which is this repo's most-repeated failure**, so it is not the last line of
 * defence: `lint:trust-claims` discovers money-string producers from the tree and requires each to appear
 * here. The list being wrong is a gate failure, not a silent gap.
 */
import { formatDisplayAmount } from '@core/utils/formatDisplayAmount';
import { formatCurrency } from '@core/utils/formatCurrency';

import { formatWhole } from '@/utils/format';

function assert(cond: boolean, label: string): void {
  if (!cond) throw new Error(`FAIL [${label}]`);
}
function eq(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

/** Every function in the tree that turns a number into money a person reads. */
const FORMATTERS: { name: string; render: (n: number) => string }[] = [
  { name: 'formatCurrency', render: formatCurrency },
  { name: 'formatWhole', render: formatWhole },
  {
    name: 'formatDisplayAmount',
    // It returns the two halves a screen renders side by side; joined here as the string a user SEES,
    // because "NaN" in the dollars span and "N" in the cents span is one sentence to the person reading it.
    render: (n) => {
      const { dollars, cents } = formatDisplayAmount(n);
      return `${dollars}.${cents}`;
    },
  },
];

/**
 * ⛔ **THE PROPERTY: a non-finite input can never reach the screen as a non-finite string.**
 *
 * Asserted on what is RENDERED rather than on the guard's presence — a test that greps for
 * `Number.isFinite` is a deletion detector, which is the whole `lint:finding-guards` lesson one level down.
 */
const NON_FINITE: [string, number][] = [
  ['NaN', NaN],
  ['Infinity', Infinity],
  ['-Infinity', -Infinity],
];

for (const f of FORMATTERS) {
  for (const [label, input] of NON_FINITE) {
    const out = f.render(input);
    assert(
      !/NaN|∞|Infinity/.test(out),
      `⛔ A5-2 · ${f.name}(${label}) rendered ${JSON.stringify(out)} — a non-finite value reached the screen`,
    );
    // ⚠️ Not merely "no garbage": it must be ZERO. A formatter returning "" or "—" would pass the check
    // above while silently removing a figure the layout still has a slot for.
    assert(
      /^-?\$?0(\.00)?$/.test(out),
      `⛔ A5-2 · ${f.name}(${label}) rendered ${JSON.stringify(out)} — a non-finite value must render as zero, not as nothing`,
    );
  }
}

/**
 * ⭐ **THE CONTROLS, AND WITHOUT THEM THE BLOCK ABOVE IS SATISFIED BY A BROKEN FORMATTER.**
 *
 * ⛔ Lane A named this exactly: *"without the control, a remedy that re-adds a `Math.max(0, …)` clamp would
 * pass while re-introducing the 'hide money' behaviour this file's own header refuses."* A formatter that
 * returned `"$0"` for everything satisfies every assertion above.
 */
eq(formatCurrency(-45), '-$45', '⭐ A5-2 control — a real negative is still shown, never clamped to $0');
eq(formatWhole(-45), '-$45', '⭐ A5-2 control — formatWhole does not clamp either');
eq(formatCurrency(1240.37), '$1,240.37', '⭐ A5-2 control — a real amount is unchanged');
eq(formatWhole(1240.37), '$1,240', '⭐ A5-2 control — formatWhole rounds to whole dollars');
eq(formatDisplayAmount(1240.37).dollars, '1,240', '⭐ A5-2 control — formatDisplayAmount splits a real amount');
eq(formatDisplayAmount(1240.37).cents, '37', '⭐ A5-2 control — …and keeps its cents');

/**
 * ⛔ **[pass-5 `B5-4`] — NEGATIVE ZERO IS ZERO, AND CENTS ARE ALL-OR-NOTHING.**
 *
 * Measured before the fix: `formatCurrency(-0)` → `"-$0"` · `formatCurrency(-0.004)` → `"-$0"` ·
 * `formatCurrency(-0.4)` → `"-$0.4"` · `formatWhole(-0)` → `"-$0"`. A minus sign in front of $0 states a
 * direction the money does not have, and `$0.4` is not a form money is written in.
 */
eq(formatCurrency(-0), '$0', '⛔ B5-4 — negative zero is $0, not -$0');
eq(formatCurrency(-0.004), '$0', '⛔ B5-4 — a value that rounds to zero from below is $0');
eq(formatWhole(-0), '$0', '⛔ B5-4 — formatWhole, same rule');
eq(formatWhole(-0.4), '$0', '⛔ B5-4 — …including a value that rounds to zero at whole dollars');
eq(formatDisplayAmount(-0).dollars, '0', '⛔ B5-4 — formatDisplayAmount, same rule');
eq(formatCurrency(-0.4), '-$0.40', '⛔ B5-4 — cents are all-or-nothing: never "$0.4"');
eq(formatCurrency(0.4), '$0.40', '⛔ B5-4 — …in both directions');
// ⭐ THE CONTROL FOR THAT RULE, and it is the decision recorded in formatCurrency's own header: a WHOLE
// amount must never be padded to two decimals. A fix that set minimumFractionDigits: 2 passes every row
// above and re-introduces exactly the noise the App Preview sweep removed.
eq(formatCurrency(1240), '$1,240', '⭐ B5-4 control — a whole amount is NEVER padded to $1,240.00');
eq(formatCurrency(0), '$0', '⭐ B5-4 control — …including zero');

console.log('  ✓ money formatters — non-finite never reaches the screen, and real amounts are untouched');
