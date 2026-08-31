/**
 * S1.13.7.3 [pass-6 `A2-6` · `D1-3`] — **ONE PRODUCER OF "IS THIS ACTUALLY A NUMBER?", BECAUSE EVERY
 * COMPARISON GUARD IN THIS REPO IS BLIND TO `NaN`.**
 *
 * ⛔ **`NaN` compares `false` to everything.** So `Math.abs(actual - expected) > tolerance` is `false`
 * when `actual` is `NaN`, and the `throw` beneath it is unreachable — the assertion passes and prints a
 * green tick over a value that is not a number at all. The same sentence is true of `x < 0`, `x > 0`,
 * `x <= 0`: **a guard written as a comparison cannot see `NaN`.**
 *
 * ⚡ **TWO LANES FOUND THIS INDEPENDENTLY, in different files, on different spellings**, which is why it
 * is a class and not a bug:
 *
 *   • `A2-6` planted `NaN` into `projectCurrentBalance` and the debt-math suite printed **`✓`** over two
 *     money assertions before an unrelated `assertTrue` caught it; planted into `computeDrift`, the
 *     assertion `assertClose(behind.daysBehind, 59, 1)` **never fired at all**.
 *   • `D1-3` found all three guards on `endingBalance ≥ 0` spelled `x < 0`, so `test:regression` printed
 *     **✅ All regression tests passed** over a `NaN` cycle balance.
 *
 * ⛔ **AND THE USER NEVER SEES `NaN`** — `formatWhole` renders it as **`$0`**, to the screen and to
 * VoiceOver. So the failure mode is not a visible crash; it is a confident zero.
 *
 * ⚠️ **Why a shared RULE rather than a shared ASSERTION.** There were five copies of the tolerance helper
 * across three directories under two different signatures (`assertClose(a, e, tol, label)` and
 * `assertApprox(a, e, msg, tolerance = 0.01)`). Unifying the signatures would have rewritten every call
 * site in the regression suites — a large diff whose failure mode is a silently dropped assertion, which
 * is the very thing this class is about. So the *rule* lives here once and each helper keeps its own
 * shape and message. **The duplication that mattered was the rule, not the wrapper.**
 */

/**
 * Refuse a value that is not a finite number, before any comparison is attempted.
 *
 * ⛔ `Number.isFinite` rather than `!Number.isNaN`: `Infinity` fails every tolerance comparison the same
 * silent way once it is subtracted from itself, and a money figure is never legitimately infinite.
 */
export function requireFinite(actual: number, label: string): void {
  if (!Number.isFinite(actual)) {
    throw new Error(
      `${label} failed: received ${String(actual)}, which is not a finite number.\n` +
        '  ⛔ A comparison guard cannot see this — `NaN > tol` and `NaN < 0` are both false, so the ' +
        'assertion below would have passed. [pass-6 A2-6 / D1-3]',
    );
  }
}
