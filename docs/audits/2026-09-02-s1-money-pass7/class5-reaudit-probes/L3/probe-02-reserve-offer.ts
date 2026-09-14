/**
 * L3 probe 02 — the expense-reserve offer as Today mounts it. `index.tsx` computes `selectExpenseReserveOffer(store)` off
 * the RAW store; the plan, the hero's "Spoken for" and the sheet's `everydayHeld`/`billsReserve` come off
 * `withProjectedBalances(store, isPremium)`. This prints, per shape: the offer's `spare` (what it says the engine holds),
 * and what the engine holds for an unbounded contribution on the PROJECTED store Today actually allocates.
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
  const res = await import(R('src/store/expenseReserveSelectors.ts'));

  const heldFor = (s: any) => {
    const probe = { ...s, expenseReserve: { ...(s.expenseReserve ?? { balance: 0 }), contribution: { forCycle: s.paycheck.nextPaycheckDate, amount: Number.MAX_SAFE_INTEGER } } };
    const a = sel.selectAllocation(probe);
    return a ? Math.round((a.expenseReserveHeld ?? NaN) * 100) / 100 : null;
  };

  // A quarterly bill makes the smoothed recommendation non-zero; a tight paycheck makes `spare` the binding clamp.
  const quarterly = { id: 'ins', name: 'insurance', amount: 900, dueDate: day(60), recurrence: 'quarterly', category: 'insurance' };
  const shapes: Record<string, Record<string, unknown>> = {
    'premium · debt projected to $0 (min 120 > balance 100, stale anchor)': {
      subscriptionPlan: 'premium',
      paycheck: { amount: '1400', currentDate: day(0), nextPaycheckDate: day(14), payCycle: 'biweekly' },
      requiredExpenses: [{ id: 'rent', name: 'rent', amount: 900, dueDate: day(10), recurrence: 'monthly', category: 'housing' }, quarterly],
      debts: [
        { id: 'a', name: 'Chase Freedom', balance: 100, originalBalance: 4200, minimumPayment: 120, apr: 0, dueDate: day(3), type: 'debt', recurrence: 'monthly', lastVerifiedDate: day(-40), balanceAsOfDate: day(-40) },
        { id: 'b', name: 'Visa', balance: 3000, originalBalance: 3000, minimumPayment: 90, apr: 20, dueDate: day(8), type: 'debt', recurrence: 'monthly' },
      ],
    },
    'premium · stale anchor, interest grows the minimum-bearing balance': {
      subscriptionPlan: 'premium',
      paycheck: { amount: '1300', currentDate: day(0), nextPaycheckDate: day(14), payCycle: 'biweekly' },
      requiredExpenses: [{ id: 'rent', name: 'rent', amount: 900, dueDate: day(10), recurrence: 'monthly', category: 'housing' }, quarterly],
      debts: [{ id: 'b', name: 'Visa', balance: 3000, originalBalance: 3000, minimumPayment: 90, apr: 29, dueDate: day(8), type: 'debt', recurrence: 'monthly', lastVerifiedDate: day(-120), balanceAsOfDate: day(-120) }],
    },
    'free · same as the first shape (control: no projection)': {
      subscriptionPlan: 'free',
      paycheck: { amount: '1400', currentDate: day(0), nextPaycheckDate: day(14), payCycle: 'biweekly' },
      requiredExpenses: [{ id: 'rent', name: 'rent', amount: 900, dueDate: day(10), recurrence: 'monthly', category: 'housing' }, quarterly],
      debts: [
        { id: 'a', name: 'Chase Freedom', balance: 100, originalBalance: 4200, minimumPayment: 120, apr: 0, dueDate: day(3), type: 'debt', recurrence: 'monthly', lastVerifiedDate: day(-40), balanceAsOfDate: day(-40) },
        { id: 'b', name: 'Visa', balance: 3000, originalBalance: 3000, minimumPayment: 90, apr: 20, dueDate: day(8), type: 'debt', recurrence: 'monthly' },
      ],
    },
  };

  for (const [name, over] of Object.entries(shapes)) {
    const store = runMigrations(scenario({ prefs: { onboardingComplete: true }, ...over }));
    const isPremium = store.subscriptionPlan === 'premium';
    const engine = bal.withProjectedBalances(store, isPremium);
    const offerRaw = res.selectExpenseReserveOffer(store);
    const offerEngine = res.selectExpenseReserveOffer(engine);
    const rawA = sel.selectAllocation(store);
    const engA = sel.selectAllocation(engine);
    console.log(JSON.stringify({
      shape: name,
      balances: { raw: store.debts.map((d: any) => d.balance), projected: engine.debts.map((d: any) => Math.round(d.balance * 100) / 100) },
      shortfall: { raw: rawA?.shortfall ?? null, projected: engA?.shortfall ?? null },
      offerAsMountedOnToday_raw: offerRaw,
      offerIfAskedOfTodaysEngineStore: offerEngine,
      engineHoldsUnbounded: { raw: heldFor(store), projected: heldFor(engine) },
    }));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
