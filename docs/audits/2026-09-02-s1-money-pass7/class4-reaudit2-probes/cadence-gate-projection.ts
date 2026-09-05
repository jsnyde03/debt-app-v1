/**
 * ROUND-2 PROBE — pass-6 `A3-1` removed the `type === "bnpl"` gate from the in-window RESERVE, and class
 * 4's `A2-3`/`A2-8` removed it from the row CAPTION, both on the stated rule that
 * *"a cadence is a fact about the SCHEDULE, not about the debt's label."*
 *
 * Two PROJECTION sites still carry it:
 *   apps/rn/src/store/analysisSelectors.ts:181   selectDebtAmortization
 *   packages/core/debt/projectCurrentBalance.ts:74
 *
 * Both read `debt.type === 'bnpl' ? bnplMonthlyEquivalentMinimum(debt, cyclesPerMonth) : debt.minimumPayment`.
 * `bnplMonthlyEquivalentMinimum` is purely cadence-driven — it never reads `debt.type` except for the
 * one-time lump — so the gate is the only thing keeping a plain weekly debt on a 1× monthly figure.
 *
 * This is the exact divergence `hasKnownBnplCadence`'s docblock cites as the reason the gate was removed:
 * "reserved and paid down at $100/cycle while the chart and the debt-free date rated it at $216.67/month
 *  — one debt, two screens, 2× apart."
 */
import { bnplMonthlyEquivalentMinimum } from '../../../../packages/core/debt/bnplPayoffPace';
import { projectCurrentBalance } from '../../../../packages/core/debt/projectCurrentBalance';
import { effectiveMinimumInWindow } from '../../../../packages/core/debt/bnplInstallment';
import type { Debt } from '../../../../packages/core/storage/debtPlannerStorage';

const CPM = 1; // a monthly payer

function row(label: string, type: 'debt' | 'bnpl', recurrence: string) {
  const d = {
    id: 'd', name: 'Loan', balance: 5000, minimumPayment: 50, apr: 0,
    dueDate: '2026-08-01', balanceAsOfDate: '2026-08-01', type, recurrence,
  } as unknown as Debt;

  // what the two projection sites actually use
  const gated = type === 'bnpl' ? bnplMonthlyEquivalentMinimum(d, CPM) : d.minimumPayment;
  // what the same expression gives with the gate removed (the rule A3-1/A2-3 adopted)
  const ungated = bnplMonthlyEquivalentMinimum(d, CPM);
  // what the RESERVE says the same debt costs in one monthly window (the seam class 4 fixed)
  const reserve = effectiveMinimumInWindow(d, '2026-08-01', '2026-09-01');

  const proj = projectCurrentBalance(d as never, '2027-08-01', CPM);
  const projUngated = projectCurrentBalance({ ...d, type: 'bnpl' } as never, '2027-08-01', CPM);

  console.log(
    `  ${label.padEnd(26)} amortises at $${String(gated).padStart(7)}/mo` +
    ` · cadence-true $${String(ungated).padStart(7)}/mo` +
    ` · the RESERVE holds $${String(reserve).padStart(6)} in one monthly window`,
  );
  console.log(
    `  ${''.padEnd(26)} balance projected 12 months on: $${proj}   (cadence-true: $${projUngated})`,
  );
}

console.log('\nA $50-per-charge debt, $5,000 balance, 0% APR, monthly payer\n');
row('plain debt · weekly', 'debt', 'weekly');
row('plain debt · biweekly', 'debt', 'biweekly');
row('plain debt · monthly (control)', 'debt', 'monthly');
row('BNPL · weekly (control)', 'bnpl', 'weekly');
console.log('\nThe control rows are the point: the BNPL and the plain debt have identical cadence and');
console.log('identical per-charge amounts, and only the plain one is projected at 1×.');
