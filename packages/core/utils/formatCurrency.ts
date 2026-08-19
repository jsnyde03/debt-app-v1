/**
 * ⭐ **THE MONEY-PRECISION RULE — stated here once, and nowhere else (T6.2).**
 *
 *   · **Hero / summary figures → `formatWhole`** (`apps/rn/src/utils/format.ts`) — whole dollars, because
 *     cents on a big figure read as noise.
 *   · **Ledger rows and anything a reader may SUM → `formatCurrency`** (here) — cents only when there are
 *     cents.
 *   · ⛔ **The two must never straddle one TIER.** A category subtotal is a category subtotal on every
 *     screen; a figure that is whole on a card and to the cent one tap into that card is the defect. That
 *     is L4-1/3/4/5/9, all of the same shape.
 *
 * ⚠️ **This rule was already true and was already written down — in the comment below, from the App
 * Preview defect (3.5.8.7).** It still drifted onto both sides of the same tier in five places, because a
 * rule stated inside one function's body is not a rule anyone else reads. Hence this header, and hence
 * `lint:money` (T6.9): the rule the codebase states for itself is the one it must be held to.
 *
 * ⛔ **NEVER hand-roll a money formatter.** T6.4 collapsed **seven** local copies; four were byte-identical
 * and three had already drifted — `LeanSuggestionCard`'s rendered `$-45` and `$NaN`, and `paywallLead`'s
 * (behind the live public embed) had quietly dropped its `Number.isFinite` guard.
 *
 * ⚠️ **A negative clamp is NOT a formatting rule.** Several of those locals did `Math.max(0, n)`, which
 * silently turns −$45 into $0 — the exact "hide money" behaviour the comment below refuses. If a value
 * cannot legitimately go negative, clamp it at the SELECTOR; if it can, show it.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 * ⚠️ **KNOWN AND DELIBERATE — `tabular-nums` does not align these columns (audit L4-8, minor).**
 *
 * `numericBody` and the ledger columns set `fontVariant: ['tabular-nums']`, which equalises digit
 * WIDTHS but not fraction COUNTS — so a column carrying `$1,240` beside `$45.37` does not line its
 * decimal points up. The typography choice and the formatter choice were each right and were made
 * against each other.
 *
 * ⛔ **The audit's suggested fix — a 2-decimal variant for aligned columns — was NOT taken**, because
 * padding `$1,240` to `$1,240.00` is precisely the noise the App Preview sweep below removed on a real
 * screen, and it would add a third formatter days after nine were collapsed to two. Alignment is worth
 * less than the calm this app decided on. **Re-open only with a decision that the trade has flipped —
 * not as a formatter tweak.**
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 */
export function formatCurrency(amount: number) {
    // Defensive: never render "$NaN"/"$Infinity". A non-finite value here means
    // something upstream broke; show $0.00 rather than a garbage figure.
    const safe = Number.isFinite(amount) ? amount : 0;
    // `minimumFractionDigits: 0` — cents render only when there ARE cents. USD defaults the MINIMUM to 2,
    // so `maximumFractionDigits: 2` alone was still forcing "$1,240.00" onto whole amounts.
    //
    // Found on the App Preview's opening frame (3.5.8.7): the debt rows read "$1,240.00 · 26.99% APR" and
    // "$45.00/mo" directly beneath a hero reading "$19,440" — the same screen using two conventions,
    // because the hero goes through `formatWhole` and the rows through here. That is Wave C1's cents
    // sweep, and this is its root rather than another call-site patch.
    //
    // Deliberately NOT `formatWhole`: rounding a real $1,240.37 to $1,240 would hide money. This only
    // removes noise that was never information.
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(safe);
}