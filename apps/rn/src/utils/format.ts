/** Whole-dollar currency (no cents) — for big summary/hero figures where cents read as noise. */
export function formatWhole(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(safe);
}
