/**
 * L1 probe 1 — can a plan-money repair be ANSWERED when the honest value equals the repaired 0?
 * Through the real wired store (createDebtStore), seeded via runMigrations (the import door).
 * Run from <tree>/apps/rn:  npx tsx --tsconfig <tree>/apps/rn/tsconfig.json <this file>
 */
import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { createDebtStore } from '@/store/store';
import * as sel from '@/store/selectors';
import * as trust from '@/store/trustSelectors';
import { selectPaydayGuardian } from '@/store/guardianSelectors';

const DAY = '2026-08-26';
const NEXT = '2026-09-09';
const raw = (cushionFloor: unknown, windfall: unknown) => ({
  version: 8,
  paycheck: { amount: '2000', currentDate: DAY, nextPaycheckDate: NEXT },
  debts: [{ id: 'd0', name: 'Chase', balance: 5000, minimumPayment: 150, apr: 22, dueDate: DAY, type: 'debt', recurrence: 'monthly' }],
  requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 600, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
  cushionFloor,
  windfall,
  prefs: { onboardingComplete: true },
});

function claim(s: DebtStore, c: string): string {
  try {
    return String(trust.mayClaim(s, c as never));
  } catch (e) {
    return `n/a(${(e as Error).message.slice(0, 40)})`;
  }
}
function report(label: string, s: DebtStore) {
  const plan = s.pendingDataRepairs.filter((r) => r.entity === 'plan').map((r) => `${r.field}:${r.kind}${r.acknowledged ? ':ack' : ''}`);
  const owner = (sel as unknown as { cushionLine?: (s: DebtStore) => unknown }).cushionLine;
  const brief = selectPaydayGuardian(s) as (ReturnType<typeof selectPaydayGuardian> & { floorUnread?: boolean }) | null;
  console.log(
    JSON.stringify({
      label,
      cushionFloor: s.cushionFloor,
      windfall: s.windfall,
      planRepairs: plan,
      cushionLine: owner ? owner(s) : 'no-owner',
      effectivePaycheckBuffer: sel.effectivePaycheckBuffer(s),
      briefFloor: brief?.floor,
      briefFloorUnread: brief?.floorUnread,
      mayClaim_required: claim(s, 'required-plan'),
      mayClaim_paycheck: claim(s, 'paycheck-plan'),
    }),
  );
}

function seeded(cushionFloor: unknown, windfall: unknown) {
  const app = createDebtStore({ now: () => DAY });
  app.setState({ store: { ...runMigrations(raw(cushionFloor, windfall)), subscriptionPlan: 'premium' } });
  return app;
}

// A — lost line, the user taps "Got it", then sets their line to $0 (what they really hold).
{
  const app = seeded('abc', 0);
  report('A0 lost line seeded', app.getState().store);
  app.getState().acknowledgeDataRepairs();
  report('A1 after ack', app.getState().store);
  app.getState().setCushionFloor(0);
  report('A2 after setCushionFloor(0)', app.getState().store);
}
// B — lost line, user sets it to $0 directly (no ack); then the control, a value that MOVES.
{
  const app = seeded('abc', 0);
  app.getState().setCushionFloor(0);
  report('B1 setCushionFloor(0) no ack', app.getState().store);
  app.getState().setCushionFloor(25);
  report('B2 control: setCushionFloor(25)', app.getState().store);
}
// C — lost windfall (whose ordinary honest value is $0), ack, then setWindfall(0).
{
  const app = seeded(250, 'abc');
  report('C0 lost windfall seeded', app.getState().store);
  app.getState().acknowledgeDataRepairs();
  report('C1 after ack', app.getState().store);
  app.getState().setWindfall(0);
  report('C2 after setWindfall(0)', app.getState().store);
}
