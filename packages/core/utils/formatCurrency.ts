export function formatCurrency(amount: number) {
    // Defensive: never render "$NaN"/"$Infinity". A non-finite value here means
    // something upstream broke; show $0.00 rather than a garbage figure.
    const safe = Number.isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(safe);
}