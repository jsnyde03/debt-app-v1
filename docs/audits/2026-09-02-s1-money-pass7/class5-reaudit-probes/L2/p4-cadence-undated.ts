/**
 * L2 probe P4. Run: copy to apps/rn/src/__probe_L2_p4.ts, `tsx`. BASE=1 at c7df99c2 (dated taps are ignored there:
 * the base parser drops the field, and the base action takes no argument).
 *
 * The dated tap across cadences, drained late (after the NEXT payday has arrived), and an older build's UNDATED queue.
 * `pendingActions.test.ts` measures only the default cadence.
 */
import { drainPendingActions } from '@/appIntents/drainPendingActions';
import { createDefaultStore } from '@/data/defaults';
import { createDebtStore } from '@/store/store';

const base = createDefaultStore();
const today = base.paycheck.currentDate;

type Cadence = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
const CADENCES: Cadence[] = ['weekly', 'biweekly', 'semimonthly', 'monthly'];

function storeOn(payCycle: Cadence, payday: string, clock: string) {
  const s = createDebtStore({ now: () => clock });
  s.setState({
    store: {
      ...base,
      prefs: { ...base.prefs, onboardingComplete: true },
      paycheck: { ...base.paycheck, payCycle, semiMonthlyFirstDay: '1', semiMonthlySecondDay: '15', monthlyPayDay: '14', nextPaycheckDate: payday },
    },
  });
  return s;
}
const drain = (s: ReturnType<typeof storeOn>, entries: unknown[]) => {
  let q: string | null = JSON.stringify(entries);
  drainPendingActions({ read: () => q, clear: () => { q = null; } }, s.getState());
};
const cycles = (s: ReturnType<typeof storeOn>) => s.getState().store.cycleHistory.length;

for (const c of CADENCES) {
  const probe = storeOn(c, today, today);
  drain(probe, [{ kind: 'payday-landed', id: 'p' }]);
  const following = probe.getState().store.paycheck.nextPaycheckDate;
  const row: Record<string, unknown> = { cadence: c, today, following };

  // dated: two taps for today's payday, drained on the day of the following payday
  const a = storeOn(c, today, following);
  drain(a, [{ kind: 'payday-landed', id: 't1', paydayDateISO: today }, { kind: 'payday-landed', id: 't2', paydayDateISO: today }]);
  row.datedTwoTapsDrainedLate = cycles(a);

  // undated (an older build's queue): two taps from today's payday, drained on the following payday
  const b = storeOn(c, today, following);
  drain(b, [{ kind: 'payday-landed', id: 'u1' }, { kind: 'payday-landed', id: 'u2' }]);
  row.undatedTwoTapsDrainedLate = cycles(b);

  // undated, drained the same day (control for the above)
  const d = storeOn(c, today, today);
  drain(d, [{ kind: 'payday-landed', id: 'u1' }, { kind: 'payday-landed', id: 'u2' }]);
  row.undatedTwoTapsSameDay = cycles(d);
  console.log(JSON.stringify(row));
}
