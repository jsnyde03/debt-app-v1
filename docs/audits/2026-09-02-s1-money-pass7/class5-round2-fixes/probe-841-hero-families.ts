/**
 * 8.4.1 probe: which claim is EXACT for each figure family PlanHero draws — the split, the verdict, the suggested move, the
 * date — measured separately, because serialising two families as one is what hid `L3-4`. Same fixtures and variants as
 * `trustSelectors.test.ts`' sweep, both strategies, the tree's own `mayClaim` (the `FX-1` route included). Pools strategies
 * where a verdict agrees across them and splits them where it differs — the suite's rule. Read-only.
 * Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const R = (p: string) => pathToFileURL(`${process.env.ROOT ?? 'C:/Users/Jason/debt-app-v1'}/apps/rn/${p}`).href;
type Raw = Record<string, any>;

async function main() {
  const { REPAIRABLE_MONEY_FIELDS, runMigrations } = await import(R('src/data/migrations.ts'));
  const { withProjectedBalances } = await import(R('src/store/balanceSelectors.ts'));
  const { selectAllocation } = await import(R('src/store/selectors.ts'));
  const { selectPlanSummary, selectRequiredRows, selectRecommendedActions } = await import(R('src/store/planSelectors.ts'));
  const { mayClaim, payoffStrategies } = await import(R('src/store/trustSelectors.ts'));

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
  const SHAPES = [...BASE.map((s) => ({ ...s, autopay: true })), ...BASE.map((s) => ({ ...s, name: `${s.name}+noautopay`, autopay: false }))];
  const rawShape = (sh: any, strategy: string): Raw => {
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
  const setField = (r: Raw, entity: string, row: number, field: string, to: (o: unknown) => unknown) => {
    if (LIST[entity]) r[LIST[entity]][row][field] = to(r[LIST[entity]][row][field]);
    else if (field === 'leanAmount' || field === 'typicalAmount') r.paycheck[field] = to(r.paycheck[field]);
    else if (field === 'expenseReserveBalance') r.expenseReserve.balance = to(r.expenseReserve.balance);
    else r[field] = to(r[field]);
  };

  /** Exactly what PlanHero.tsx draws, by family: the bar and legend, the verdict, the suggested move, the date. */
  const hero = (s: any): Record<string, string> => {
    const e = withProjectedBalances(s, true);
    const a = selectAllocation(e);
    const m = a ? selectPlanSummary(e, a, selectRequiredRows(e, a)) : null;
    if (!m || !a) return { split: 'null', verdict: 'null', suggestion: 'null', date: 'null' };
    const required = Math.max(0, m.requiredTotal - m.shortfall);
    const everyday = Math.max(0, m.everydayHeld);
    const bills = Math.max(0, m.billsReserve);
    const free = Math.max(0, m.remainingAfterRequired - everyday - bills);
    const rec = selectRecommendedActions(e, a).map((x: any) => [x.targetId, x.label, x.actualAmount]);
    return {
      split: JSON.stringify([m.requiredTotal + m.remainingAfterRequired, required, everyday, bills, free]),
      verdict: JSON.stringify([m.status]),
      suggestion: JSON.stringify(rec),
      date: JSON.stringify([m.debtFreeDate]),
    };
  };
  const FAMILIES = ['split', 'verdict', 'suggestion', 'date'];
  const CLAIMS = ['required-plan', 'paycheck-plan', 'solved-projection'];

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
  const V = new Map<string, Map<string, At>>();
  for (const strategy of payoffStrategies()) {
    for (const sh of SHAPES) {
      const base = hero(premium(rawShape(sh, strategy)));
      for (const v of variants) {
        const r = rawShape(sh, strategy);
        v.mutate(r);
        const s = premium(r);
        const h = hero(s);
        for (const f of FAMILIES) {
          for (const c of CLAIMS) {
            const key = `${f} · ${c} · ${v.name}`;
            const by = V.get(key) ?? new Map<string, At>();
            const at = by.get(strategy) ?? { refused: new Set<boolean>(), moved: false };
            at.refused.add(!mayClaim(s, c));
            if (h[f] !== base[f]) at.moved = true;
            by.set(strategy, at);
            V.set(key, by);
          }
        }
      }
    }
  }

  const report = new Map<string, string[]>();
  for (const [key, by] of V) {
    const [f, c] = key.split(' · ');
    const list = report.get(`${f} · ${c}`) ?? [];
    for (const [, at] of by) if (at.refused.size !== 1) list.push(`SPLIT-VERDICT ${key}`);
    const answers = new Set([...by.values()].map((at) => [...at.refused][0]));
    const qs: [string, boolean, boolean][] =
      answers.size === 1
        ? [[key, [...answers][0], [...by.values()].some((at) => at.moved)]]
        : [...by].map(([st, at]) => [`${key} · on ${st}`, [...at.refused][0], at.moved]);
    for (const [k, refuses, moved] of qs) {
      if (refuses && !moved) list.push(`OVER ${k}`);
      if (!refuses && moved) list.push(`HOLE ${k}`);
    }
    report.set(`${f} · ${c}`, list);
  }
  for (const f of FAMILIES) {
    for (const c of CLAIMS) {
      const list = report.get(`${f} · ${c}`) ?? [];
      const holes = list.filter((l) => l.startsWith('HOLE')).length;
      const overs = list.filter((l) => l.startsWith('OVER')).length;
      console.log(`\n== ${f} on '${c}': ${holes} holes · ${overs} over-suppressions ==`);
      for (const l of list.sort()) console.log(`  ${l}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
