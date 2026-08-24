import { simulatePayoff } from '@core/debt/buildPayoffTrajectory';

type D = { id: string; name: string; balance: number; minimumPayment: number; apr: number };

const PORTFOLIOS: { label: string; debts: D[]; extra: number }[] = [
  { label: 'classic 3-card (the textbook snowball case)', extra: 200, debts: [
    { id: '1', name: 'Store card', balance: 600, minimumPayment: 25, apr: 26.99 },
    { id: '2', name: 'Visa', balance: 4200, minimumPayment: 105, apr: 22.9 },
    { id: '3', name: 'Car loan', balance: 9000, minimumPayment: 260, apr: 5.9 },
  ]},
  { label: 'high-APR small / low-APR large (max divergence)', extra: 150, debts: [
    { id: '1', name: 'Payday-ish', balance: 900, minimumPayment: 40, apr: 34.9 },
    { id: '2', name: 'Student loan', balance: 14000, minimumPayment: 180, apr: 4.5 },
  ]},
  { label: 'inverted: big debt is also the expensive one', extra: 250, debts: [
    { id: '1', name: 'Small loan', balance: 1200, minimumPayment: 60, apr: 6.0 },
    { id: '2', name: 'Big card', balance: 9500, minimumPayment: 200, apr: 27.9 },
  ]},
  { label: 'five mixed debts', extra: 300, debts: [
    { id: '1', name: 'A', balance: 450, minimumPayment: 25, apr: 19.9 },
    { id: '2', name: 'B', balance: 2300, minimumPayment: 70, apr: 24.9 },
    { id: '3', name: 'C', balance: 5100, minimumPayment: 130, apr: 12.5 },
    { id: '4', name: 'D', balance: 800, minimumPayment: 35, apr: 29.9 },
    { id: '5', name: 'E', balance: 11000, minimumPayment: 240, apr: 6.9 },
  ]},
];

function months(pts: { month: number; balance: number }[]) {
  const hit = pts.find((p) => p.balance <= 0);
  return hit ? hit.month : pts[pts.length - 1]?.month ?? 0;
}
/** Area under the curve ~ how far apart the two lines sit on screen, as % of the active max. */
function maxGapPct(a: {month:number;balance:number}[], b: {month:number;balance:number}[]) {
  const top = Math.max(...a.map(p=>p.balance), ...b.map(p=>p.balance));
  let worst = 0;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const av = a[i]?.balance ?? 0, bv = b[i]?.balance ?? 0;
    worst = Math.max(worst, Math.abs(av - bv));
  }
  return { worstAbs: Math.round(worst), worstPct: +(100 * worst / top).toFixed(1) };
}

console.log('portfolio | snowball mo | avalanche mo | Δ months | worst vertical gap ($ / % of chart height)');
for (const p of PORTFOLIOS) {
  const s = simulatePayoff({ debts: p.debts as never, monthlyExtraPayment: p.extra, strategy: 'snowball' });
  const a = simulatePayoff({ debts: p.debts as never, monthlyExtraPayment: p.extra, strategy: 'avalanche' });
  const ms = months(s.points), ma = months(a.points);
  const g = maxGapPct(s.points, a.points);
  console.log(`${p.label} | ${ms} | ${ma} | ${ms - ma} | $${g.worstAbs} / ${g.worstPct}%`);
}
