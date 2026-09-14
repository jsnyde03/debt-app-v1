/**
 * L3 probe 03 — Progress's cash-flow bars (`CashFlowSection`), which `progress.tsx` feeds with
 * `selectCashTimeline(engineStore)` and `effectivePaycheckBuffer(engineStore)`. Two stores, each beside its readable twin:
 *   M · cushion-forecast.spec's C3-11 store — Visa's `minimumPayment: ''` is the one unreadable field
 *   L · a premium store whose `cushionFloor: 'abc'` is the one unreadable field (the user set $350)
 * Imports only store/data modules — none of the 16 L3-pinned proofs plant these, so it is safe beside a prove:guards run.
 * Run from the worktree's apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>   (ROOT selects the tree)
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const ROOT = process.env.ROOT ?? 'C:/Users/Jason/audit-c5r1-L3';
const R = (p: string) => pathToFileURL(`${ROOT}/apps/rn/${p}`).href;

async function main() {
  const { scenario, day } = await import(R('tests/e2e/helpers/seed.ts'));
  const { runMigrations } = await import(R('src/data/migrations.ts'));
  const bal = await import(R('src/store/balanceSelectors.ts'));
  const sel = await import(R('src/store/selectors.ts'));
  const pay = await import(R('src/store/payoffSelectors.ts'));
  const trust = await import(R('src/store/trustSelectors.ts'));
  const claims = trust.claimFields ? Object.keys(trust.claimFields()) : [];
  const may = (s: unknown, c: string) => (claims.includes(c) || c === 'required-plan' ? trust.mayClaim(s, c) : 'n/a');

  const UNREAD_BASE = {
    cushionFloor: 400,
    paycheck: { amount: '1650', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
    debts: [
      { id: 'd0', name: 'Visa', balance: 6200, originalBalance: 8000, minimumPayment: 160, apr: 22, dueDate: day(10), type: 'debt', recurrence: 'monthly' },
      { id: 'd2', name: 'Car', balance: 11000, originalBalance: 14000, minimumPayment: 320, apr: 6, dueDate: day(20), type: 'debt', recurrence: 'monthly' },
    ],
    prefs: { onboardingComplete: true },
  };
  const stores: Record<string, Record<string, unknown>> = {};
  for (const tier of ['premium', 'free']) {
    stores[`M ${tier} · Visa minimum unread`] = scenario({ ...UNREAD_BASE, subscriptionPlan: tier, debts: [{ ...UNREAD_BASE.debts[0], minimumPayment: '' }, UNREAD_BASE.debts[1]] });
    stores[`M ${tier} · readable twin`] = scenario({ ...UNREAD_BASE, subscriptionPlan: tier });
  }
  stores['L premium · cushion line unread (set was $350)'] = scenario({ ...UNREAD_BASE, cushionFloor: 'abc' });
  stores['L premium · readable twin ($350)'] = scenario({ ...UNREAD_BASE, cushionFloor: 350 });

  for (const [name, blob] of Object.entries(stores)) {
    const store = runMigrations(blob);
    const isPremium = store.subscriptionPlan === 'premium';
    const engine = bal.withProjectedBalances(store, isPremium);
    const cycles = pay.selectCashTimeline(engine);
    const floor = sel.effectivePaycheckBuffer(engine);
    const line = sel.cushionLine ? sel.cushionLine(engine) : 'n/a';
    console.log(JSON.stringify({
      store: name,
      repairs: store.pendingDataRepairs.map((r: { entity: string; field: string }) => `${r.entity}.${r.field}`),
      'solved-projection': may(store, 'solved-projection'),
      caption: `your $${floor} line · room after each paycheck`,
      cushionLine: line,
      cycles: cycles.map((c: { net: number; cushionStatus: string; guardianState?: string }) => `${Math.round(c.net)}:${c.cushionStatus}`),
    }));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
