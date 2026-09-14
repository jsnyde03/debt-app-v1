/**
 * L3 probe 01 — selector-level measurements behind three leads. Read-only: builds stores through the app's own
 * hydration (`runMigrations`) from the e2e `scenario()` blobs and prints what each surface would be handed.
 * Run from the worktree's apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 * The ROOT env var picks the tree (pin worktree or the c7df99c2 base worktree).
 */
const ROOT = process.env.ROOT ?? 'C:/Users/Jason/audit-c5r1-L3';
// ⚠️ tsx's ESM loader refuses a bare `C:/…` specifier (ERR_UNSUPPORTED_ESM_URL_SCHEME) — a file URL is required.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const R = (p: string) => pathToFileURL(`${ROOT}/apps/rn/${p}`).href;

async function main() {
  const { scenario, day } = await import(R('tests/e2e/helpers/seed.ts'));
  const { runMigrations } = await import(R('src/data/migrations.ts'));
  const bal = await import(R('src/store/balanceSelectors.ts'));
  const sel = await import(R('src/store/selectors.ts'));
  const plan = await import(R('src/store/planSelectors.ts'));
  const trust = await import(R('src/store/trustSelectors.ts'));
  const has = (claim: string) => (trust.claimFields ? claim in trust.claimFields() : false);
  const may = (s: unknown, claim: string) => (has(claim) || claim === 'debt-balances' || claim === 'required-plan' ? trust.mayClaim(s, claim) : 'n/a');

  // ── A · Today's plan hero over a lost APR (trust-claims.spec .5.4d fixture) ───────────────────────
  console.log('\n== A · PlanHero inputs, lost APR vs readable APR (premium) ==');
  for (const apr of ['', 20] as const) {
    const store = runMigrations(scenario({ debts: [{ id: 'd0', name: 'Visa', balance: 5000, originalBalance: 8000, minimumPayment: 150, apr, dueDate: day(6), type: 'debt', recurrence: 'monthly' }] }));
    const engine = bal.withProjectedBalances(store, store.subscriptionPlan === 'premium');
    const allocation = sel.selectAllocation(engine);
    const rows = allocation ? plan.selectRequiredRows(engine, allocation) : [];
    const rec = allocation ? plan.selectRecommendedActions(engine, allocation) : [];
    const summary = allocation ? plan.selectPlanSummary(engine, allocation, rows) : null;
    const suggestTotal = rec.reduce((s: number, a: { actualAmount: number }) => s + a.actualAmount, 0);
    const suggestLabel = rec.length === 1 ? rec[0].label : rec.length > 1 ? `${rec.length} suggested moves` : null;
    console.log(JSON.stringify({
      apr: apr === '' ? "'' (unread)" : apr,
      repairs: store.pendingDataRepairs.map((r: { entity: string; field: string }) => `${r.entity}.${r.field}`),
      'solved-projection': may(store, 'solved-projection'),
      'paycheck-plan': may(store, 'paycheck-plan'),
      split: summary && { requiredTotal: summary.requiredTotal, shortfall: summary.shortfall, everydayHeld: summary.everydayHeld, billsReserve: summary.billsReserve, remainingAfterRequired: summary.remainingAfterRequired, status: summary.status, debtFreeDate: summary.debtFreeDate },
      suggestLine: suggestLabel && suggestTotal > 0 ? `Suggested · $${suggestTotal} · ${suggestLabel}` : null,
    }));
  }

  // ── B · Progress journey line, lost APR, FREE vs PREMIUM, nothing paid yet ────────────────────────
  console.log('\n== B · Progress journey line over a lost APR (balance == originalBalance → the "to go" arm) ==');
  const { selectJourneyTotals } = await import(R('src/store/journeySelectors.ts'));
  for (const tier of ['free', 'premium'] as const) {
    for (const apr of ['', 19] as const) {
      const store = runMigrations(scenario({
        subscriptionPlan: tier,
        requiredExpenses: [],
        debts: [
          { id: 'd0', name: 'Chase card', balance: 8000, originalBalance: 8000, minimumPayment: 100, apr, dueDate: day(4), type: 'debt', recurrence: 'monthly', balanceAsOfDate: day(-90), lastVerifiedDate: day(-90) },
          { id: 'd1', name: 'Visa', balance: 4000, originalBalance: 4000, minimumPayment: 80, apr: 19, dueDate: day(6), type: 'debt', recurrence: 'monthly' },
        ],
      }));
      const isPremium = store.subscriptionPlan === 'premium';
      const engine = bal.withProjectedBalances(store, isPremium);
      const j = selectJourneyTotals(store.debts, engine.debts);
      const mayProj = may(store, 'projected-balance');
      const mayBal = may(store, 'debt-balances');
      // progress.tsx at the pin, verbatim logic
      const lineReadable = j.lineIsProjected ? mayProj : mayBal;
      const shown = lineReadable === true ? j.line : mayBal ? 'Some figures couldn’t be read' : 'Some balances couldn’t be read';
      console.log(JSON.stringify({ tier, apr: apr === '' ? "'' (unread)" : apr, totalConfirmed: j.totalConfirmed, totalCurrent: j.totalCurrent, line: j.line, lineIsProjected: j.lineIsProjected, 'projected-balance': mayProj, 'debt-balances': mayBal, progressShowsAtPin: shown }));
    }
  }

  // ── C · Save-for-it capacity on a short paycheck ─────────────────────────────────────────────────
  console.log('\n== C · save-for-it capacity (premium) ==');
  const g = await import(R('src/store/guardianSelectors.ts'));
  const shapes: Record<string, Record<string, unknown>> = {
    'bills eat the paycheck to the line': { paycheck: { amount: '2000', currentDate: day(0), nextPaycheckDate: day(31) }, requiredExpenses: [{ id: 'rent', name: 'rent', amount: 1700, dueDate: day(10), recurrence: 'monthly', category: 'housing' }], debts: [{ id: 'd0', name: 'Card', balance: 3000, minimumPayment: 100, apr: 22, dueDate: day(9), type: 'debt', recurrence: 'monthly' }], cushionFloor: 200 },
    'already short': { paycheck: { amount: '2000', currentDate: day(0), nextPaycheckDate: day(31) }, requiredExpenses: [{ id: 'rent', name: 'rent', amount: 2100, dueDate: day(10), recurrence: 'monthly', category: 'housing' }], debts: [], cushionFloor: 200 },
    'roomy (control)': { paycheck: { amount: '4000', currentDate: day(0), nextPaycheckDate: day(31) }, requiredExpenses: [{ id: 'rent', name: 'rent', amount: 900, dueDate: day(10), recurrence: 'monthly', category: 'housing' }], debts: [], cushionFloor: 200 },
  };
  for (const [name, over] of Object.entries(shapes)) {
    const store = runMigrations(scenario({ prefs: { onboardingComplete: true }, ...over }));
    const engine = bal.withProjectedBalances(store, true);
    for (const amount of [500, 5000]) {
      const aff = g.selectAffordability(engine, amount);
      const cap = g.selectPriorityGoalCapacity ? g.selectPriorityGoalCapacity(engine, amount) : 'n/a';
      const opts = g.selectSaveForItOptions(engine, amount).map((o: { key: string; perPaycheck: number | null }) => `${o.key}:${o.perPaycheck}`);
      // SaveForItSheet at the pin, verbatim, for a typed custom pace of $300
      const customPace = 300;
      const capacity = typeof cap === 'number' ? cap : 0;
      const customFunded = capacity > 0 ? Math.min(customPace, capacity) : customPace;
      const customCapped = capacity > 0 && customPace > capacity;
      console.log(JSON.stringify({ shape: name, amount, verdict: aff?.verdict ?? null, capacity: cap, options: opts, typed300: { dated_from: customFunded, caption: customCapped, confirmation: `Now saving $${customFunded}/paycheck` } }));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
