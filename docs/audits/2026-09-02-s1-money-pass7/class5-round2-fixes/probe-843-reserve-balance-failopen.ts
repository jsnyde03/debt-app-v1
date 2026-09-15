/**
 * 8.4.3 lead probe: does a LOST expense-reserve balance get its repair cleared by a rollover — with the real balance never
 * re-supplied? Mechanism read, not measured: no user action writes `expenseReserve.balance` (`setExpenseReserveContribution`
 * keeps it), `applyRollover` rewrites it (`payday.ts:216`), and every store write passes the wrapper that runs
 * `clearResuppliedRepairs`, whose plan branch clears on a MOVED value (`trustSelectors.ts:628`).
 *
 * Through the real doors: `runMigrations` for the file, `createDebtStore` for the wired actions, the user's own
 * `setExpenseReserveContribution`, then `rolloverPayCycle`. Two controls: a lost balance with nothing contributed (the value
 * cannot move), and a readable balance with a contribution (nothing to clear). Read-only.
 * Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const R = (p: string) => pathToFileURL(`${process.env.ROOT ?? 'C:/Users/Jason/debt-app-v1'}/apps/rn/${p}`).href;

async function main() {
  const { scenario, day } = await import(R('tests/e2e/helpers/seed.ts'));
  const { runMigrations } = await import(R('src/data/migrations.ts'));
  const { createDebtStore } = await import(R('src/store/store.ts'));
  const { selectAllocation } = await import(R('src/store/selectors.ts'));
  const { mayClaim } = await import(R('src/store/trustSelectors.ts'));

  const cases = [
    { name: 'SUBJECT · lost balance + a contribution', balance: 'abc' as unknown, contribute: 100 },
    { name: 'control · lost balance, nothing contributed', balance: 'abc' as unknown, contribute: 0 },
    { name: 'control · readable $300 balance + a contribution', balance: 300 as unknown, contribute: 100 },
  ];

  for (const c of cases) {
    const raw = scenario({
      subscriptionPlan: 'premium',
      expenseReserve: { balance: c.balance },
      paycheck: { amount: '2000', currentDate: day(0), nextPaycheckDate: day(0) },
    });
    const s = createDebtStore();
    s.setState({ store: runMigrations(raw) });

    const snap = (at: string) => {
      const st = s.getState().store;
      const a = selectAllocation(st);
      console.log(JSON.stringify({
        case: c.name,
        at,
        balance: st.expenseReserve?.balance,
        contribution: st.expenseReserve?.contribution ?? null,
        held: a?.expenseReserveHeld ?? null,
        drawn: a?.expenseReserveDrawn ?? null,
        reserveRepair: st.pendingDataRepairs
          .filter((r: { field: string }) => r.field === 'expenseReserveBalance')
          .map((r: { kind?: string; acknowledged?: boolean }) => `${r.kind ?? 'lost'}${r.acknowledged ? ':ack' : ''}`),
        "mayClaim('required-plan')": mayClaim(st, 'required-plan'),
        nextPaycheckDate: st.paycheck.nextPaycheckDate,
      }));
    };

    snap('seeded');
    if (c.contribute > 0) {
      s.getState().setExpenseReserveContribution(c.contribute);
      snap('after the user contributes');
    }
    s.getState().rolloverPayCycle();
    snap('after rolloverPayCycle');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
