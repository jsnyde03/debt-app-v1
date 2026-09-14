/**
 * 8.4.1 before-scan probe: does a lost APR move PlanHero's SUGGESTED MOVE under avalanche?
 * The L3 audit measured one debt only, where the target cannot change. Read-only.
 * Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const ROOT = 'C:/Users/Jason/debt-app-v1';
const R = (p: string) => pathToFileURL(`${ROOT}/apps/rn/${p}`).href;

async function main() {
  const { scenario, day } = await import(R('tests/e2e/helpers/seed.ts'));
  const { runMigrations } = await import(R('src/data/migrations.ts'));
  const bal = await import(R('src/store/balanceSelectors.ts'));
  const sel = await import(R('src/store/selectors.ts'));
  const plan = await import(R('src/store/planSelectors.ts'));
  const trust = await import(R('src/store/trustSelectors.ts'));
  const g = await import(R('src/store/guardianSelectors.ts'));

  for (const strategy of ['snowball', 'avalanche'] as const) {
    for (const lose of ['none', 'd0.apr', 'd1.apr'] as const) {
      const debts = [
        { id: 'd0', name: 'Chase', balance: 5000, originalBalance: 6000, minimumPayment: 150, apr: lose === 'd0.apr' ? '' : 22, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
        { id: 'd1', name: 'Visa', balance: 3000, originalBalance: 3500, minimumPayment: 90, apr: lose === 'd1.apr' ? '' : 18, dueDate: day(8), type: 'debt', recurrence: 'monthly' },
      ];
      const raw = scenario({ debts, payoffStrategy: strategy });
      const store = { ...runMigrations(raw), subscriptionPlan: 'premium' };
      const engine = bal.withProjectedBalances(store, true);
      const allocation = sel.selectAllocation(engine);
      const rows = allocation ? plan.selectRequiredRows(engine, allocation) : [];
      const rec = allocation ? plan.selectRecommendedActions(engine, allocation) : [];
      const summary = allocation ? plan.selectPlanSummary(engine, allocation, rows) : null;
      const suggestTotal = rec.reduce((s: number, a: { actualAmount: number }) => s + a.actualAmount, 0);
      const suggestLabel = rec.length === 1 ? rec[0].label : rec.length > 1 ? `${rec.length} suggested moves` : null;
      const guardian = g.selectPaydayGuardian ? g.selectPaydayGuardian(engine) : 'n/a';
      console.log(JSON.stringify({
        strategy: store.payoffStrategy,
        lose,
        repairs: store.pendingDataRepairs.map((r: { entity: string; field: string }) => `${r.entity}.${r.field}`),
        'solved-projection': trust.mayClaim(store, 'solved-projection'),
        'paycheck-plan': trust.mayClaim(store, 'paycheck-plan'),
        split: summary && [summary.requiredTotal, summary.shortfall, summary.everydayHeld, summary.billsReserve, summary.remainingAfterRequired, summary.status],
        date: summary?.debtFreeDate,
        suggest: rec.map((a: { label: string; actualAmount: number }) => `${a.label}=${a.actualAmount}`),
        suggestLine: suggestLabel && suggestTotal > 0 ? `Suggested · ${suggestTotal} · ${suggestLabel}` : null,
        guardian: JSON.stringify(guardian).slice(0, 400),
      }));
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
