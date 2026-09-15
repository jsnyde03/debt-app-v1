/**
 * 8.4.2 probe: does a strategy or tier OUTSIDE its union survive `runMigrations`? If it does, `030a312b`'s
 * `RANKED_BY[store.payoffStrategy][entity]` throws inside `mayClaim` on any store with a repair, and `contextOf` is a fix,
 * not a nicety. Also reports what the two rankers do with such a value, since they disagree by construction:
 * `rankDebts` treats non-snowball as avalanche, `selectActiveRecommendedActions` treats non-avalanche as snowball.
 * Read-only. Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const R = (p: string) => pathToFileURL(`${process.env.ROOT ?? 'C:/Users/Jason/debt-app-v1'}/apps/rn/${p}`).href;

async function main() {
  const { scenario, day } = await import(R('tests/e2e/helpers/seed.ts'));
  const { runMigrations } = await import(R('src/data/migrations.ts'));
  const { mayClaim } = await import(R('src/store/trustSelectors.ts'));
  const { rankDebts } = await import(R('src/store/payoffSelectors.ts'));
  const { selectAllocation } = await import(R('src/store/selectors.ts'));
  const { selectRecommendedActions } = await import(R('src/store/planSelectors.ts'));

  for (const [payoffStrategy, subscriptionPlan] of [['snowball', 'premium'], ['foo', 'premium'], ['avalanche', 'gold'], [undefined, undefined], [42, null]] as const) {
    const raw = scenario({
      ...(payoffStrategy === undefined ? {} : { payoffStrategy }),
      ...(subscriptionPlan === undefined ? {} : { subscriptionPlan }),
      debts: [
        { id: 'd0', name: 'Chase', balance: 5000, minimumPayment: 150, apr: '', dueDate: day(6), type: 'debt', recurrence: 'monthly' },
        { id: 'd1', name: 'Visa', balance: 3000, minimumPayment: 90, apr: 18, dueDate: day(8), type: 'debt', recurrence: 'monthly' },
      ],
    });
    const s = runMigrations(raw);
    let claim: string;
    try {
      claim = String(mayClaim(s, 'paycheck-plan'));
    } catch (e) {
      claim = `THREW ${(e as Error).message}`;
    }
    const a = selectAllocation(s);
    console.log(JSON.stringify({
      seeded: { payoffStrategy, subscriptionPlan },
      stored: { payoffStrategy: s.payoffStrategy, subscriptionPlan: s.subscriptionPlan },
      repairs: s.pendingDataRepairs.length,
      "mayClaim('paycheck-plan')": claim,
      rankDebtsFirst: rankDebts(s.debts, s.payoffStrategy)[0]?.name,
      recommendedFirst: a ? selectRecommendedActions(s, a)[0]?.label : null,
    }));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
