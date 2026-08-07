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