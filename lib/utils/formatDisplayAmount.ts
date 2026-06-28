export function formatDisplayAmount(amount: number): { dollars: string; cents: string } {
    const abs = Math.abs(amount);
    const dollars = Math.floor(abs).toLocaleString("en-US");
    const cents = (abs % 1).toFixed(2).slice(2);
    return { dollars: (amount < 0 ? "-" : "") + dollars, cents };
}
