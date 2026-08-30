/**
 * ⛔ **S1.12.5.3 [pass-5, found while closing `A5-2`] — THIS FORMATTER HAD NO GUARD AT ALL.**
 *
 * Measured, all three: `NaN → "NaN.N"` · `Infinity → "∞.N"` · `-Infinity → "-∞.N"`. `Math.floor(NaN)` is
 * `NaN`, and `(NaN % 1).toFixed(2)` is the string `"NaN"`, whose `.slice(2)` is `"N"` — so the cents span
 * renders a single letter beside a dollars span reading `NaN`.
 *
 * ⚡ **It is the FIFTH money formatter, and `check-trust-claims`'s `PRINTS_MONEY` enumerates four** — which
 * is `D5-13` exactly: a population that is a list of names, blind to a member whose name is not on it.
 *
 * ⚠️ **Its only consumers are `components/ResultsSection.tsx`, on the legacy root surface `5.5.1` deletes**,
 * so nothing a user meets today renders this. It is guarded anyway because the function lives in
 * `packages/core`, which survives that deletion — an RN screen importing it tomorrow would inherit the hole,
 * and `formatCurrency`'s own header records that this is precisely how the last one happened.
 */
export function formatDisplayAmount(amount: number): { dollars: string; cents: string } {
    // Same contract as `formatCurrency`: a non-finite value means something upstream broke, and $0 is the
    // honest thing to show rather than a garbage figure. The sign is taken from the SAFE value, so `NaN`
    // cannot leak a "-" either.
    const safe = Number.isFinite(amount) ? amount : 0;
    const abs = Math.abs(safe);
    const dollars = Math.floor(abs).toLocaleString("en-US");
    const cents = (abs % 1).toFixed(2).slice(2);
    // ⚠️ `safe < 0`, not `amount < 0` — and NOT `Object.is(safe, -0)`: a true -0 is $0, not "-$0". Same
    // negative-zero rule the two string formatters carry (`B5-4`).
    return { dollars: (safe < 0 ? "-" : "") + dollars, cents };
}
