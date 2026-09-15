/**
 * 8.4.2 probe: the suite's per-surface sweep (`trustSelectors.test.ts`, as of 8.4.1) across TIER × strategy, before the suite
 * itself gains the tier dimension — so the shape of that dimension is chosen from measurements, not guessed. Every surface is
 * computed on the tier's own engine store (`withProjectedBalances(s, isPremium)`, as each screen builds it), and Progress's
 * surfaces are added: the cash-flow bars (`L3-5a`) and both arms of the journey line (`L3-2`). Shapes include an UNPAID copy so
 * the projected arm is reachable. Strategies pool where a verdict agrees (the suite's rule); tiers never pool.
 * Prints EVERY non-exact key. Read-only; uses the tree's own `mayClaim`.
 * Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const R = (p: string) => pathToFileURL(`${process.env.ROOT ?? 'C:/Users/Jason/debt-app-v1'}/apps/rn/${p}`).href;
type Raw = Record<string, any>;

async function main() {
  const { payCyclesPerMonth } = await import(R('../../packages/core/payCycle/payCyclesPerMonth.ts'));
  const { REPAIRABLE_MONEY_FIELDS, runMigrations } = await import(R('src/data/migrations.ts'));
  const { selectWhatIf } = await import(R('src/store/analysisSelectors.ts'));
  const { selectDebtBalanceView, withProjectedBalances } = await import(R('src/store/balanceSelectors.ts'));
  const { selectAffordability, selectPaydayGuardian, selectWindfallSplit } = await import(R('src/store/guardianSelectors.ts'));
  const { selectCashTimeline, selectPayoffView } = await import(R('src/store/payoffSelectors.ts'));
  const { effectivePaycheckBuffer, selectAllocation, selectWaterFillPlan } = await import(R('src/store/selectors.ts'));
  const { selectPlanSummary, selectRequiredRows, selectRecommendedActions } = await import(R('src/store/planSelectors.ts'));
  const { selectJourneyTotals } = await import(R('src/store/journeySelectors.ts'));
  const { mayClaim, payoffStrategies, subscriptionTiers } = await import(R('src/store/trustSelectors.ts'));

  const DAY = '2026-08-26';
  const NEXT = '2026-09-09';
  const ANCHOR = '2026-03-01';
  const LIST: Record<string, string> = { debt: 'debts', requiredExpense: 'requiredExpenses', livingExpense: 'livingExpenses', goal: 'goals' };
  const BASE: any[] = [
    { name: 'tight-fixed', income: 1400, variable: false, big: true, pace: true },
    { name: 'tight-var', income: 1400, variable: true, big: true, pace: true },
    { name: 'tight-nopace', income: 1400, variable: false, big: true, pace: false },
    { name: 'loose-fixed', income: 2400, variable: false, big: false, pace: true },
    { name: 'loose-nopace', income: 2400, variable: false, big: false, pace: false },
    { name: 'loose-var', income: 2400, variable: true, big: false, pace: true },
    { name: 'clearing', income: 1800, variable: false, big: false, pace: true, clearing: true },
    { name: 'filling', income: 2400, variable: false, big: false, pace: false, filling: true },
    { name: 'capping', income: 2600, variable: false, big: false, pace: false, capping: true },
    { name: 'short', income: 900, variable: false, big: true, pace: true },
    { name: 'at-floor', income: 1250, variable: false, big: true, pace: false },
  ];
  const SHAPES = [
    ...BASE.map((s) => ({ ...s, autopay: true })),
    ...BASE.map((s) => ({ ...s, name: `${s.name}+noautopay`, autopay: false })),
    ...BASE.map((s) => ({ ...s, name: `${s.name}+unpaid`, autopay: false, unpaid: true })),
  ];
  const rawShape = (sh: any, strategy: string, tier: string): Raw => {
    const b = sh.big ? 3 : 1;
    const visa = sh.clearing ? 420 : sh.capping ? 900 : 3000 * b;
    return {
      version: 8,
      payoffStrategy: strategy,
      subscriptionPlan: tier,
      paycheck: { amount: String(sh.income), currentDate: DAY, nextPaycheckDate: NEXT, incomeVaries: sh.variable, leanAmount: Math.round(sh.income * 0.75), typicalAmount: sh.income },
      debts: [
        { id: 'd0', name: 'Chase', balance: 5000 * b, originalBalance: sh.unpaid ? 5000 * b : 6000 * b, minimumPayment: 150 * b, ...(sh.autopay ? { scheduledPaymentAmount: 200 * b } : {}), apr: 22, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: ANCHOR, lastVerifiedDate: ANCHOR },
        { id: 'd1', name: 'Visa', balance: visa, originalBalance: sh.unpaid ? visa : 3500 * b, minimumPayment: sh.capping ? 25 : 90 * b, ...(sh.autopay ? { scheduledPaymentAmount: 120 * b } : {}), apr: sh.capping ? 29 : 18, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: ANCHOR, lastVerifiedDate: ANCHOR },
      ],
      requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 600, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
      livingExpenses: [{ id: 'l0', name: 'Groceries', amount: 150, enabled: true }],
      goals: [{ id: 'g0', name: 'Trip', targetAmount: 1000, currentAmount: sh.filling ? 930 : 200, ...(sh.pace ? { priorityPerPaycheck: 40 } : {}), priority: true, type: 'savings' }],
      cushionFloor: 250,
      windfall: 300,
      expenseReserve: { balance: 300 },
      prefs: { onboardingComplete: true, hasSavingsElsewhere: true },
    };
  };
  const build = (raw: Raw, tier: string) => ({ ...runMigrations(raw), subscriptionPlan: tier });
  const setField = (r: Raw, entity: string, row: number, field: string, to: (o: unknown) => unknown) => {
    if (LIST[entity]) r[LIST[entity]][row][field] = to(r[LIST[entity]][row][field]);
    else if (field === 'leanAmount' || field === 'typicalAmount') r.paycheck[field] = to(r.paycheck[field]);
    else if (field === 'expenseReserveBalance') r.expenseReserve.balance = to(r.expenseReserve.balance);
    else r[field] = to(r[field]);
  };
  const prem = (s: any) => s.subscriptionPlan === 'premium';
  const summaryOf = (e: any) => {
    const a = selectAllocation(e);
    return a ? selectPlanSummary(e, a, selectRequiredRows(e, a)) : null;
  };
  const suggestedOf = (e: any) => {
    const a = selectAllocation(e);
    return a ? selectRecommendedActions(e, a).map((x: any) => [x.key, x.category, x.targetId, x.label, x.actualAmount]) : null;
  };

  type Claim = 'debt-balances' | 'projected-balance' | 'solved-projection' | 'paycheck-plan' | 'required-plan';
  const SURFACES: { claim: Claim; name: string; figure: (s: any) => string }[] = [
    { claim: 'projected-balance', name: "Money's total", figure: (s) => { const cpm = payCyclesPerMonth(s.paycheck.payCycle); return String(s.debts.filter((d: any) => d.balance > 0).reduce((t: number, d: any) => t + selectDebtBalanceView(d, s.paycheck.currentDate, prem(s), cpm).currentBalance, 0)); } },
    { claim: 'solved-projection', name: 'the payoff family', figure: (s) => { const e = withProjectedBalances(s, prem(s)); const { order, focus, ...view } = selectPayoffView(e); return JSON.stringify([view, order.map((d: any) => d.id), focus?.id, selectWhatIf(e, 100), selectCashTimeline(e, 6), selectWaterFillPlan(e), effectivePaycheckBuffer(e)]); } },
    { claim: 'solved-projection', name: 'the cushion forecast', figure: (s) => { const e = withProjectedBalances(s, prem(s)); return JSON.stringify([selectCashTimeline(e, 6), selectWaterFillPlan(e), effectivePaycheckBuffer(e)]); } },
    { claim: 'solved-projection', name: "Today's plan hero · the date", figure: (s) => { const m = summaryOf(withProjectedBalances(s, prem(s))); return m ? JSON.stringify([m.debtFreeDate]) : 'null'; } },
    { claim: 'required-plan', name: "Today's plan hero · the split and the verdict", figure: (s) => { const m = summaryOf(withProjectedBalances(s, prem(s))); return m ? JSON.stringify([m.billsReserve, m.everydayHeld, m.remainingAfterRequired, m.requiredTotal, m.shortfall, m.status]) : 'null'; } },
    { claim: 'paycheck-plan', name: "Today's plan hero · the suggested move", figure: (s) => JSON.stringify(suggestedOf(withProjectedBalances(s, prem(s)))) },
    { claim: 'paycheck-plan', name: 'the Recommended card', figure: (s) => JSON.stringify(suggestedOf(withProjectedBalances(s, prem(s)))) },
    { claim: 'required-plan', name: 'Required actions', figure: (s) => { const e = withProjectedBalances(s, prem(s)); const a = selectAllocation(e); return a ? JSON.stringify(selectRequiredRows(e, a).map((r: any) => [r.item.amount, r.item.category, r.item.label, r.item.reserveCovered, r.item.targetId, r.isAutopay, r.dueDate, r.view.isPaid, r.view.overdue, r.view.presumedPaid, r.view.autopayFailed])) : 'null'; } },
    { claim: 'paycheck-plan', name: 'the Guardian brief', figure: (s) => JSON.stringify(selectPaydayGuardian(withProjectedBalances(s, prem(s)))) },
    { claim: 'paycheck-plan', name: 'Affordability', figure: (s) => JSON.stringify(selectAffordability(withProjectedBalances(s, prem(s)), 500)) },
    { claim: 'paycheck-plan', name: 'Windfall routing', figure: (s) => JSON.stringify(selectWindfallSplit(withProjectedBalances(s, prem(s)), 1000)) },
    { claim: 'paycheck-plan', name: 'the paywall lead', figure: (s) => { const m = summaryOf(s); return m ? JSON.stringify([m.shortfall, m.cushion, effectivePaycheckBuffer(s)]) : 'null'; } },
    { claim: 'solved-projection', name: 'Progress cash-flow bars', figure: (s) => { const e = withProjectedBalances(s, prem(s)); return JSON.stringify([selectCashTimeline(e), effectivePaycheckBuffer(e)]); } },
    { claim: 'projected-balance', name: 'Progress journey line · projected arm', figure: (s) => { const j = selectJourneyTotals(s.debts, withProjectedBalances(s, prem(s)).debts); return j.lineIsProjected ? j.line : 'n/a'; } },
    { claim: 'debt-balances', name: 'Progress journey line · confirmed arm', figure: (s) => { const j = selectJourneyTotals(s.debts, withProjectedBalances(s, prem(s)).debts); return j.lineIsProjected ? 'n/a' : j.line; } },
  ];

  const variants: { name: string; mutate: (r: Raw) => void }[] = [];
  for (const [entity, lists] of Object.entries(REPAIRABLE_MONEY_FIELDS as Record<string, { required: string[]; optional: string[] }>)) {
    const rows = entity === 'debt' ? [0, 1] : [0];
    for (const field of [...lists.required, ...lists.optional]) {
      for (const row of rows) {
        const label = entity === 'debt' ? `debt[${row}].${field}` : `${entity}.${field}`;
        variants.push({ name: `${label} LOST`, mutate: (r) => setField(r, entity, row, field, () => 'abc') });
        variants.push({ name: `${label} recovered`, mutate: (r) => setField(r, entity, row, field, (o) => (o === undefined ? o : Number(o).toLocaleString('en-US'))) });
      }
    }
    if (LIST[entity]) {
      variants.push({ name: `${entity} WHOLE-ROW`, mutate: (r) => { r[LIST[entity]][0] = 'garbage'; } });
      variants.push({ name: `${entity} WHOLE-LIST`, mutate: (r) => { r[LIST[entity]] = 'garbage'; } });
    }
  }

  type At = { refused: Set<boolean>; moved: boolean };
  for (const tier of subscriptionTiers()) {
    const V = new Map<string, Map<string, At>>();
    for (const strategy of payoffStrategies()) {
      for (const sh of SHAPES) {
        const baseStore = build(rawShape(sh, strategy, tier), tier);
        if (baseStore.pendingDataRepairs.length !== 0) throw new Error(`${sh.name} base is not clean`);
        if (baseStore.subscriptionPlan !== tier || baseStore.payoffStrategy !== strategy) throw new Error(`${sh.name} did not carry ${tier}/${strategy}`);
        const base = SURFACES.map((x) => x.figure(baseStore));
        for (const v of variants) {
          const r = rawShape(sh, strategy, tier);
          v.mutate(r);
          const s = build(r, tier);
          SURFACES.forEach((surface, i) => {
            const now = surface.figure(s);
            if (now === 'n/a' && base[i] === 'n/a') return;
            const key = `${surface.claim} · ${surface.name} · ${v.name}`;
            const by = V.get(key) ?? new Map<string, At>();
            const at = by.get(strategy) ?? { refused: new Set<boolean>(), moved: false };
            at.refused.add(!mayClaim(s, surface.claim));
            if (now !== base[i]) at.moved = true;
            by.set(strategy, at);
            V.set(key, by);
          });
        }
      }
    }
    const lines: string[] = [];
    for (const [key, by] of V) {
      for (const [st, at] of by) if (at.refused.size !== 1) lines.push(`SPLIT-VERDICT ${key} · on ${st}`);
      const answers = new Set([...by.values()].map((at) => [...at.refused][0]));
      const qs: [string, boolean, boolean][] =
        answers.size === 1
          ? [[key, [...answers][0], [...by.values()].some((at) => at.moved)]]
          : [...by].map(([st, at]) => [`${key} · on ${st}`, [...at.refused][0], at.moved]);
      for (const [k, refuses, moved] of qs) {
        if (refuses && !moved) lines.push(`OVER  ${k}`);
        if (!refuses && moved) lines.push(`HOLE  ${k}`);
      }
    }
    console.log(`\n== TIER ${tier} · ${V.size} keys · ${lines.filter((l) => l.startsWith('HOLE')).length} holes · ${lines.filter((l) => l.startsWith('OVER')).length} over · ${lines.filter((l) => l.startsWith('SPLIT')).length} split ==`);
    for (const l of lines.sort()) console.log(`  ${l}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
