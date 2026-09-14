/**
 * L3 probe 04 — the FREE tier under `'paycheck-plan'`. The per-surface assertion in `trustSelectors.test.ts` measures every
 * surface through `withProjectedBalances(s, true)` — premium only. AffordabilityCard refuses its FREE line ("You have about $X
 * spare this paycheck") on the same claim, and WindfallSheet refuses before its free branch. This prints, for a free user,
 * each surface's rendered figure with one goal / plan field lost vs the readable twin.
 * Imports only store modules. Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>   (ROOT selects the tree)
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const ROOT = process.env.ROOT ?? 'C:/Users/Jason/audit-c5r1-L3';
const R = (p: string) => pathToFileURL(`${ROOT}/apps/rn/${p}`).href;

async function main() {
  const { scenario, day } = await import(R('tests/e2e/helpers/seed.ts'));
  const { runMigrations } = await import(R('src/data/migrations.ts'));
  const bal = await import(R('src/store/balanceSelectors.ts'));
  const g = await import(R('src/store/guardianSelectors.ts'));
  const trust = await import(R('src/store/trustSelectors.ts'));
  const claims = trust.claimFields ? Object.keys(trust.claimFields()) : [];
  const may = (s: unknown, c: string) => (claims.includes(c) || c === 'required-plan' ? trust.mayClaim(s, c) : 'n/a');

  const goal = (over: Record<string, unknown>) => ({ id: 'g0', name: 'Roof', targetAmount: 1000, currentAmount: 200, type: 'savings', ...over });
  const base = (tier: string, goals: unknown[], extra: Record<string, unknown> = {}) =>
    scenario({
      subscriptionPlan: tier,
      debts: [{ id: 'd0', name: 'Card', balance: 8000, minimumPayment: 100, apr: 22, dueDate: day(9), type: 'debt', recurrence: 'monthly' }],
      goals,
      paycheck: { amount: '2000', currentDate: day(0), nextPaycheckDate: day(31) },
      prefs: { onboardingComplete: true },
      ...extra,
    });

  const variants: Record<string, (tier: string) => Record<string, unknown>> = {
    'readable twin': (t) => base(t, [goal({})]),
    'goal.targetAmount lost': (t) => base(t, [goal({ targetAmount: '' })]),
    'goal.currentAmount lost': (t) => base(t, [goal({ currentAmount: '' })]),
    'priority goal · readable': (t) => base(t, [goal({ priority: true, priorityPerPaycheck: 150 })]),
    'priority goal · priorityPerPaycheck lost': (t) => base(t, [goal({ priority: true, priorityPerPaycheck: 'abc' })]),
    'priority goal · targetAmount lost': (t) => base(t, [goal({ priority: true, priorityPerPaycheck: 150, targetAmount: '' })]),
    'cushionFloor lost': (t) => base(t, [goal({})], { cushionFloor: 'abc' }),
  };

  for (const tier of ['free', 'premium']) {
    for (const [name, make] of Object.entries(variants)) {
      const store = runMigrations(make(tier));
      const engine = bal.withProjectedBalances(store, store.subscriptionPlan === 'premium');
      const aff = g.selectAffordability(engine, 500);
      const split = g.selectWindfallSplit ? g.selectWindfallSplit(engine, 1000) : null;
      console.log(JSON.stringify({
        tier,
        variant: name,
        repairs: store.pendingDataRepairs.map((r: { entity: string; field: string }) => `${r.entity}.${r.field}`),
        'paycheck-plan': may(store, 'paycheck-plan'),
        freeLine: aff ? `You have about $${Math.round(aff.discretionaryNow)} spare this paycheck.` : null,
        verdict: aff ? `${aff.verdict} · cushionAfter ${Math.round(aff.cushionAfter)}` : null,
        windfallItems: split ? split.items.map((i: { label?: string; key?: string; amount: number }) => `${i.key ?? i.label}:${Math.round(i.amount)}`) : null,
      }));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
