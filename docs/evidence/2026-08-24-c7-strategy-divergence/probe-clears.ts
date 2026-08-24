import { simulatePayoff } from '@core/debt/buildPayoffTrajectory';

/**
 * C7 probe 2 — WHICH debt clears WHEN, per strategy. Run per the folder README.
 * The curves probe (probe-curves.ts) answers "do the lines separate"; this answers "does anything differ".
 */
type D = { id: string; name: string; balance: number; minimumPayment: number; apr: number };
const CASES: { label: string; debts: D[]; extra: number }[] = [
  { label: 'classic 3-card', extra: 200, debts: [
    { id:'1', name:'Store card', balance: 600, minimumPayment: 25, apr: 26.99 },
    { id:'2', name:'Visa', balance: 4200, minimumPayment: 105, apr: 22.9 },
    { id:'3', name:'Car loan', balance: 9000, minimumPayment: 260, apr: 5.9 }]},
  { label: 'tiny cheap + huge expensive', extra: 400, debts: [
    { id:'1', name:'Tiny cheap', balance: 300, minimumPayment: 15, apr: 0 },
    { id:'2', name:'Huge expensive', balance: 18000, minimumPayment: 300, apr: 29.99 }]},
  { label: 'five mixed', extra: 300, debts: [
    { id:'1', name:'A', balance: 450, minimumPayment: 25, apr: 19.9 },
    { id:'2', name:'B', balance: 2300, minimumPayment: 70, apr: 24.9 },
    { id:'3', name:'C', balance: 5100, minimumPayment: 130, apr: 12.5 },
    { id:'4', name:'D', balance: 800, minimumPayment: 35, apr: 29.9 },
    { id:'5', name:'E', balance: 11000, minimumPayment: 240, apr: 6.9 }]},
];
for (const p of CASES) {
  const s = simulatePayoff({ debts: p.debts as never, monthlyExtraPayment: p.extra, strategy: 'snowball' });
  const a = simulatePayoff({ debts: p.debts as never, monthlyExtraPayment: p.extra, strategy: 'avalanche' });
  const fmt = (cl: { name?: string; month: number }[]) =>
    cl.slice().sort((x, y) => x.month - y.month).map((c) => `${c.name}@${c.month}`).join(' → ');
  const firstS = Math.min(...s.clears.map((c) => c.month));
  const firstA = Math.min(...a.clears.map((c) => c.month));
  console.log(`\n## ${p.label}`);
  console.log(`  snowball : ${fmt(s.clears)}`);
  console.log(`  avalanche: ${fmt(a.clears)}`);
  console.log(`  FIRST WIN — snowball month ${firstS} vs avalanche month ${firstA} (Δ ${firstA - firstS})`);
}
