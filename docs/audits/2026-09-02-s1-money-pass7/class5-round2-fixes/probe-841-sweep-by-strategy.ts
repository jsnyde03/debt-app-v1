/**
 * 8.4.1 probe: `.5.4d`'s per-surface sweep (`trustSelectors.test.ts` ~ :760-962), re-run across BOTH payoff strategies,
 * with the plan hero split into its two figure families (`L3-4`) and the Recommended card added (`FX-2`).
 * Unlike the suite it does not stop at the first failure: it prints EVERY non-exact key, under two routings —
 *   current  : `mayClaim` as the tree has it
 *   proposed : `'paycheck-plan'` also refuses on a lost debt APR when the store is on avalanche (🎯 2026-09-14, `FX-1`)
 * Read-only. Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const ROOT = process.env.ROOT ?? 'C:/Users/Jason/debt-app-v1';
const R = (p: string) => pathToFileURL(`${ROOT}/apps/rn/${p}`).href;

type Raw = Record<string, any>;
type Shape = { name: string; income: number; variable: boolean; big: boolean; pace: boolean; clearing?: boolean; filling?: boolean; capping?: boolean; autopay?: boolean };

async function main() {
  const { payCyclesPerMonth } = await import(R('../../packages/core/payCycle/payCyclesPerMonth.ts'));
  const { REPAIRABLE_MONEY_FIELDS, runMigrations } = await import(R('src/data/migrations.ts'));
  const { selectWhatIf } = await import(R('src/store/analysisSelectors.ts'));
  const { selectDebtBalanceView, withProjectedBalances } = await import(R('src/store/balanceSelectors.ts'));
  const { selectAffordability, selectPaydayGuardian, selectWindfallSplit } = await import(R('src/store/guardianSelectors.ts'));
  const { selectCashTimeline, selectPayoffView } = await import(R('src/store/payoffSelectors.ts'));
  const { effectivePaycheckBuffer, selectAllocation, selectWaterFillPlan } = await import(R('src/store/selectors.ts'));
  const { selectPlanSummary, selectRequiredRows, selectRecommendedActions } = await import(R('src/store/planSelectors.ts'));
  const { mayClaim } = await import(R('src/store/trustSelectors.ts'));

  const DAY = '2026-08-26';
  const NEXT = '2026-09-09';
  const ANCHOR = '2026-03-01';
  const LIST: Record<string, string> = { debt: 'debts', requiredExpense: 'requiredExpenses', livingExpense: 'livingExpenses', goal: 'goals' };
  const BASE_SHAPES: Shape[] = [
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
  const SHAPES: Shape[] = [...BASE_SHAPES.map((s) => ({ ...s, autopay: true })), ...BASE_SHAPES.map((s) => ({ ...s, name: `${s.name}+noautopay`, autopay: false }))];
  const rawShape = (sh: Shape, strategy: string): Raw => {
    const b = sh.big ? 3 : 1;
    return {
      version: 8,
      payoffStrategy: strategy,
      paycheck: { amount: String(sh.income), currentDate: DAY, nextPaycheckDate: NEXT, incomeVaries: sh.variable, leanAmount: Math.round(sh.income * 0.75), typicalAmount: sh.income },
      debts: [
        { id: 'd0', name: 'Chase', balance: 5000 * b, originalBalance: 6000 * b, minimumPayment: 150 * b, ...(sh.autopay ? { scheduledPaymentAmount: 200 * b } : {}), apr: 22, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: ANCHOR, lastVerifiedDate: ANCHOR },
        { id: 'd1', name: 'Visa', balance: sh.clearing ? 420 : sh.capping ? 900 : 3000 * b, originalBalance: 3500 * b, minimumPayment: sh.capping ? 25 : 90 * b, ...(sh.autopay ? { scheduledPaymentAmount: 120 * b } : {}), apr: sh.capping ? 29 : 18, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: ANCHOR, lastVerifiedDate: ANCHOR },
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
  const premium = (raw: unknown) => ({ ...runMigrations(raw), subscriptionPlan: 'premium' });
  const setField = (r: Raw, entity: string, row: number, field: string, to: (old: unknown) => unknown): void => {
    if (LIST[entity]) r[LIST[entity]][row][field] = to(r[LIST[entity]][row][field]);
    else if (field === 'leanAmount' || field === 'typicalAmount') r.paycheck[field] = to(r.paycheck[field]);
    else if (field === 'expenseReserveBalance') r.expenseReserve.balance = to(r.expenseReserve.balance);
    else r[field] = to(r[field]);
  };
  const summaryOf = (e: any) => {
    const a = selectAllocation(e);
    return a ? selectPlanSummary(e, a, selectRequiredRows(e, a)) : null;
  };
  const recOf = (e: any) => {
    const a = selectAllocation(e);
    return a ? selectRecommendedActions(e, a).map((x: any) => [x.key, x.category, x.targetId, x.label, x.actualAmount]) : null;
  };

  type Claim = 'projected-balance' | 'solved-projection' | 'paycheck-plan' | 'required-plan';
  const SURFACES: { claim: Claim; name: string; figure: (s: any) => string }[] = [
    { claim: 'projected-balance', name: "Money's total", figure: (s) => { const cpm = payCyclesPerMonth(s.paycheck.payCycle); return String(s.debts.filter((d: any) => d.balance > 0).reduce((t: number, d: any) => t + selectDebtBalanceView(d, s.paycheck.currentDate, true, cpm).currentBalance, 0)); } },
    { claim: 'solved-projection', name: 'the payoff family', figure: (s) => { const engine = withProjectedBalances(s, true); const { order, focus, ...view } = selectPayoffView(engine); return JSON.stringify([view, order.map((d: any) => d.id), focus?.id, selectWhatIf(engine, 100), selectCashTimeline(engine, 6), selectWaterFillPlan(engine), effectivePaycheckBuffer(engine)]); } },
    { claim: 'solved-projection', name: 'the cushion forecast', figure: (s) => { const engine = withProjectedBalances(s, true); return JSON.stringify([selectCashTimeline(engine, 6), selectWaterFillPlan(engine), effectivePaycheckBuffer(engine)]); } },
    { claim: 'solved-projection', name: "Today's plan hero · the date", figure: (s) => { const m = summaryOf(withProjectedBalances(s, true)); return m ? JSON.stringify([m.debtFreeDate]) : 'null'; } },
    { claim: 'paycheck-plan', name: "Today's plan hero · split, verdict, suggested move", figure: (s) => { const e = withProjectedBalances(s, true); const m = summaryOf(e); return m ? JSON.stringify([m.billsReserve, m.everydayHeld, m.remainingAfterRequired, m.requiredTotal, m.shortfall, m.status, recOf(e)]) : 'null'; } },
    { claim: 'paycheck-plan', name: 'the Recommended card', figure: (s) => JSON.stringify(recOf(withProjectedBalances(s, true))) },
    { claim: 'required-plan', name: 'Required actions', figure: (s) => { const e = withProjectedBalances(s, true); const a = selectAllocation(e); return a ? JSON.stringify(selectRequiredRows(e, a).map((r: any) => [r.item.amount, r.item.category, r.item.label, r.item.reserveCovered, r.item.targetId, r.isAutopay, r.dueDate, r.view.isPaid, r.view.overdue, r.view.presumedPaid, r.view.autopayFailed])) : 'null'; } },
    { claim: 'paycheck-plan', name: 'the Guardian brief', figure: (s) => JSON.stringify(selectPaydayGuardian(withProjectedBalances(s, true))) },
    { claim: 'paycheck-plan', name: 'Affordability', figure: (s) => JSON.stringify(selectAffordability(withProjectedBalances(s, true), 500)) },
    { claim: 'paycheck-plan', name: 'Windfall routing', figure: (s) => JSON.stringify(selectWindfallSplit(withProjectedBalances(s, true), 1000)) },
    { claim: 'paycheck-plan', name: 'the paywall lead', figure: (s) => { const m = summaryOf(s); return m ? JSON.stringify([m.shortfall, m.cushion, effectivePaycheckBuffer(s)]) : 'null'; } },
  ];

  const variants: { name: string; lost: boolean; mutate: (r: Raw) => void }[] = [];
  for (const [entity, lists] of Object.entries(REPAIRABLE_MONEY_FIELDS as Record<string, { required: string[]; optional: string[] }>)) {
    const rows = entity === 'debt' ? [0, 1] : [0];
    for (const field of [...lists.required, ...lists.optional]) {
      for (const row of rows) {
        const label = entity === 'debt' ? `debt[${row}].${field}` : `${entity}.${field}`;
        variants.push({ name: `${label} LOST`, lost: true, mutate: (r) => setField(r, entity, row, field, () => 'abc') });
        variants.push({ name: `${label} recovered`, lost: false, mutate: (r) => setField(r, entity, row, field, (o) => (o === undefined ? o : Number(o).toLocaleString('en-US'))) });
      }
    }
    if (LIST[entity]) {
      variants.push({ name: `${entity} WHOLE-ROW`, lost: true, mutate: (r) => { r[LIST[entity]][0] = 'garbage'; } });
      variants.push({ name: `${entity} WHOLE-LIST`, lost: true, mutate: (r) => { r[LIST[entity]] = 'garbage'; } });
    }
  }

  const proposedRefuses = (s: any, claim: Claim) =>
    !mayClaim(s, claim) ||
    (claim === 'paycheck-plan' && s.payoffStrategy === 'avalanche' && s.pendingDataRepairs.some((r: any) => r.entity === 'debt' && r.field === 'apr' && r.kind !== 'recovered'));

  for (const strategy of ['snowball', 'avalanche']) {
    const verdict = new Map<string, { cur: Set<boolean>; prop: Set<boolean>; moved: boolean }>();
    for (const sh of SHAPES) {
      const base = premium(rawShape(sh, strategy));
      if (base.payoffStrategy !== strategy) throw new Error(`fixture did not carry ${strategy}: got ${base.payoffStrategy}`);
      if (base.pendingDataRepairs.length !== 0) throw new Error(`${sh.name} base is not clean`);
      const baseFigures = SURFACES.map((x) => x.figure(base));
      for (const v of variants) {
        const r = rawShape(sh, strategy);
        v.mutate(r);
        const s = premium(r);
        SURFACES.forEach((surface, i) => {
          const key = `${surface.claim} · ${surface.name} · ${v.name}`;
          const at = verdict.get(key) ?? { cur: new Set<boolean>(), prop: new Set<boolean>(), moved: false };
          at.cur.add(!mayClaim(s, surface.claim));
          at.prop.add(proposedRefuses(s, surface.claim));
          if (surface.figure(s) !== baseFigures[i]) at.moved = true;
          verdict.set(key, at);
        });
      }
    }
    for (const routing of ['cur', 'prop'] as const) {
      const lines: string[] = [];
      for (const [key, v] of verdict) {
        const set = v[routing];
        if (set.size !== 1) { lines.push(`  SPLIT-VERDICT  ${key}`); continue; }
        const refuses = [...set][0];
        if (refuses && !v.moved) lines.push(`  OVER  ${key}`);
        if (!refuses && v.moved) lines.push(`  HOLE  ${key}`);
      }
      console.log(`\n== ${strategy} · ${routing === 'cur' ? 'CURRENT routes' : 'PROPOSED (apr on avalanche)'} · ${verdict.size} keys · ${lines.length} non-exact ==`);
      for (const l of lines.sort()) console.log(l);
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
