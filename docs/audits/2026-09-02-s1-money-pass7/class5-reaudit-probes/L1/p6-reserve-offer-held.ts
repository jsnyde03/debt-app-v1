/**
 * L1 probe 6 — B1-2: the reserve offer. "Set by $offer" commits `alreadyReserved + offer` (SpokenForSheet.tsx:115)
 * through the real wired `setExpenseReserveContribution`. Does the engine then HOLD that total, and does the
 * pot read `potAfter`? Sweep: tier × paycheck × already reserved × pot × crunch ahead.
 * Run from <tree>/apps/rn:  npx tsx --tsconfig <tree>/apps/rn/tsconfig.json <this file>
 */
import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { selectExpenseReserveNow, selectExpenseReserveOffer } from '@/store/expenseReserveSelectors';
import { selectAllocation } from '@/store/selectors';
import { createDebtStore } from '@/store/store';

const DAY = '2026-08-26';
const NEXT = '2026-09-09';

let checked = 0;
let broken = 0;
for (const premium of [false, true])
  for (const income of [550, 900, 2000])
    for (const already of [0, 50, 100])
      for (const pot of [0, 300])
        for (const crunch of [false, true]) {
          const seed: DebtStore = {
            ...runMigrations({
              version: 8,
              paycheck: { amount: String(income), currentDate: DAY, nextPaycheckDate: NEXT },
              debts: [{ id: 'd0', name: 'Chase', balance: 3000, minimumPayment: 60, apr: 22, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY }],
              requiredExpenses: [
                { id: 'e0', name: 'Rent', amount: 250, dueDate: '2026-09-20', recurrence: 'monthly', category: 'housing' },
                { id: 'e1', name: 'Phone', amount: 90, dueDate: '2026-09-25', recurrence: 'monthly', category: 'utilities' },
                ...(crunch ? [{ id: 'e2', name: 'Insurance', amount: 1400, dueDate: '2026-10-01', recurrence: 'quarterly', category: 'insurance' }] : []),
              ],
              cushionFloor: 100,
              expenseReserve: { balance: pot, ...(already > 0 ? { contribution: { forCycle: NEXT, amount: already } } : {}) },
              prefs: { onboardingComplete: true, hasSavingsElsewhere: true },
            }),
            subscriptionPlan: premium ? 'premium' : 'free',
          };
          const offer = selectExpenseReserveOffer(seed);
          if (!offer || offer.offer <= 0) {
            console.log(JSON.stringify({ premium, income, already, pot, crunch, offer: offer ? { offer: offer.offer, spare: offer.spare } : null }));
            continue;
          }
          const app = createDebtStore({ now: () => DAY });
          app.setState({ store: seed });
          app.getState().setExpenseReserveContribution(offer.alreadyReserved + offer.offer);
          const after = app.getState().store;
          const held = selectAllocation(after)?.expenseReserveHeld ?? 0;
          const promisedTotal = Math.round((offer.alreadyReserved + offer.offer) * 100) / 100;
          const now = selectExpenseReserveNow(after);
          checked += 1;
          const bad = Math.round(held * 100) < Math.round(promisedTotal * 100);
          if (bad) broken += 1;
          console.log(JSON.stringify({ premium, income, already, pot, crunch, offer: offer.offer, spare: offer.spare, promisedTotal, held, potAfter: offer.potAfter, reserveNow: now, bad }));
        }
console.log(JSON.stringify({ checked, brokenPromises: broken }));
