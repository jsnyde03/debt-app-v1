/**
 * B1 — the ONE place a typed money string becomes a number.
 *
 * ⛔ **Why this is shared code and not a good line copied into each form.** The guard the forms shipped
 * was `!raw || Number(raw) <= 0`, and **`NaN <= 0` is `false`** — so `"1,200"`, `"$1200"`, `"abc"` and
 * `"Infinity"` all PASS it. The value is then written straight to the store, where `JSON.stringify`
 * serialises `NaN` and `Infinity` alike as `null`. A debt whose balance reads `null` is loaded as `0`,
 * and `money.tsx` files every debt with `balance <= 0` under the literal header `PAID OFF`, while the
 * plan, the payoff schedule, the Guardian and the widget all drop it. A plausible paste congratulates
 * the user on clearing a portfolio the app just failed to read.
 *
 * ⚡ **Four correct expressions already existed and they did not agree.** Three used `Number`, one used
 * `parseFloat` — and those two disagree on exactly the input that motivated this: `Number("1,200")` is
 * `NaN` while `parseFloat("1,200")` is `1`. One of them would have refused a grouped number and the
 * other would have logged a **$1** payment against it. Correctness that lives in fourteen hand-written
 * comparisons is correctness that drifts.
 *
 * **Separators are stripped, not refused.** `"1,200"` means 1200 to the person typing it, and
 * `data/migrations.ts` already repairs stored values on that reading, so refusing it in the form would
 * put the input boundary at odds with the repair path. ⚠️ **This is safe because of where the app ships**
 * (US · CA · AU · NZ — every one period-decimal). A comma-decimal storefront would make `"1,50"` mean
 * one-fifty, and `strip` would read it as a hundred and fifty; that storefront is out of 2.0 scope, and
 * this note is the reason it cannot be added without revisiting this file.
 */

/** Strip what a person types around a number: grouping commas, spaces, and the currency symbol. */
function normalize(raw: string): string {
  return raw.replace(/[,\s$]/g, '');
}

/**
 * A money field that must carry a real, positive amount — a balance, a minimum, a bill, a target.
 *
 * Returns `null` for blank, for anything that does not parse, and for zero or negative. ⚠️ `null` is the
 * only refusal channel: callers must branch on it rather than on a falsy check, because **`0` is a value
 * this function can legitimately never return but its siblings can**.
 */
export function parseAmountField(raw: string): number | null {
  const cleaned = normalize(raw);
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * A money field where blank legitimately means zero — an APR left empty, a savings goal started from
 * nothing, a free trial that charges $0 today.
 *
 * ⛔ **Blank and unparseable are NOT the same answer**, which is the bug this replaces: `Number(raw) || 0`
 * collapsed them, so a mistyped `"5,5"` APR became **0%** and the engine planned an interest-free payoff
 * on a card that charges. Blank returns `0`; unparseable returns `null` so the form can refuse it.
 */
export function parseOptionalAmount(raw: string): number | null {
  const cleaned = normalize(raw);
  if (cleaned === '') return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * A money field where zero is a real answer but blank is not — confirming a balance that may genuinely
 * have reached $0, logging a payment of nothing.
 *
 * Blank returns `null` so the caller can keep whatever it was showing. ⚠️ That distinction is load-bearing
 * in the payday balance check: `Number('')` is `0`, so clearing a pre-filled balance used to confirm the
 * debt at **zero** — the same `PAID OFF` filing the positive-amount guard above exists to prevent.
 */
export function parseNonNegativeAmount(raw: string): number | null {
  const cleaned = normalize(raw);
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * What a money field may CONTAIN as the user types — the display string, not the parsed number.
 *
 * ⛔ **The parsers above answer "what is this worth". This answers "what may stay in the box", and the
 * two are different jobs.** A controlled input echoes this back on every keystroke, so it has to tolerate
 * half-typed states (`"12."`) that no parser would accept.
 *
 * ⚡ **Shared because the one hand-rolled copy was wrong by a factor of 100.** `WhatIfControls` stripped
 * with `[^0-9]`, which deletes the separator instead of the digits around it: `"12.50"` became `1250` and
 * `"0.75"` became `75`, feeding a payoff projection from an amount the user never typed — on a field whose
 * `keyboardType="numeric"` offers a decimal key on iOS. [S1.10.6.7.3 · pass-3 m4]
 *
 * ⚠️ **Only the FIRST point survives.** Keeping every point lets `"12..5"` through, and `Number("12..5")`
 * is `NaN`, which callers' `|| 0` then read as **zero** — silently worse than the hundredfold error.
 * Grouping separators and the currency symbol are dropped rather than kept, matching `normalize` above:
 * `"1,200"` reads back as `"1200"`, which is the same number to the person typing it.
 *
 * ⛔ **S1.11.5.4 [pass-4 `A-F2`] — AND THE SENTENCE ABOVE WAS NOT TRUE.** The collapse was
 * `.replace(/(\..*)\./g, '$1')`, which removes **one** point per non-overlapping match while the greedy
 * `.*` makes each match span to the *last* point — so a run of three or more points leaves two or more
 * behind, and the exact `NaN → || 0 → $0` failure the paragraph above names was still reachable:
 *
 * ```
 * "12..5"    -> "12.5"     12.5    <- the ONE row the test asserted
 * "1.2.3"    -> "1.23"     1.23    <- a DIFFERENT number, silently, not NaN
 * "1.2.3.4"  -> "1.2.34"   NaN     <- two points survive
 * "1..2..3"  -> "1..2.3"   NaN     <- three survive
 * ```
 *
 * ⚡ Pasting `1.2.3.4` into What-If's extra-payment box left `1.2.34` in the field while the projection
 * simulated **$0 extra** — the dashed *"with extra"* curve and the date under it drawing the un-boosted
 * plan, beneath a number the user had just entered.
 *
 * ⛔ **The replacement is not order-dependent**: split on the point, keep the first segment and join the
 * rest. There is no regex pass whose result depends on how many points it met. ⚠️ `"12."` must still come
 * back as `"12."` — a trailing point is a required half-typed state — so the property is **at most one
 * point**, not *parses to a finite number*.
 */
export function sanitizeAmountInput(raw: string): string {
  const digits = raw.replace(/[^0-9.]/g, '');
  const [head, ...rest] = digits.split('.');
  return rest.length > 0 ? `${head}.${rest.join('')}` : head;
}
