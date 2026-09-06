/**
 * `.16.3` probe — the report says `Math.round` announces payments the balance cannot fund.
 * Before choosing a remedy: how many charges ACTUALLY land, and what is reserved?
 *
 * The sentence makes two claims at once — "N payments land" and, via "about $X each",
 * "N × X is the money held back". A remedy that fixes one reading can break the other,
 * so both are printed here per balance.
 */
import { createDefaultStore } from '@/data/defaults';
import type { Debt, DebtStore } from '@/data/models';
import { bnplInstallmentAmount, effectiveMinimumInWindow } from '@core/debt/bnplInstallment';
import { selectBnplBetweenPaycheck } from '@/store/guardianSelectors';

const CURRENT = '2026-08-03';
const NEXT = '2026-08-31';
const DUE = '2026-08-06';
const EACH = 50;

const weeklyDebt = (over: Partial<Debt> = {}): Debt =>
  ({
    id: 'd1', name: 'Car Loan', balance: 5000, minimumPayment: EACH, apr: 10,
    dueDate: DUE, type: 'debt', recurrence: 'weekly', ...over,
  }) as unknown as Debt;

const storeWith = (debt: Debt): DebtStore =>
  ({
    ...createDefaultStore(),
    paycheck: {
      ...createDefaultStore().paycheck,
      amount: '3000', payCycle: 'monthly', currentDate: CURRENT, nextPaycheckDate: NEXT,
    },
    debts: [debt], requiredExpenses: [], livingExpenses: [], goals: [],
    prefs: { ...createDefaultStore().prefs, onboardingComplete: true },
  }) as DebtStore;

/** Charges that actually land: full ones until the balance runs out, plus a short final one. */
function charges(balance: number, each: number): number[] {
  const out: number[] = [];
  let left = balance;
  while (left > 0 && out.length < 20) {
    const c = Math.min(each, left);
    out.push(c);
    left -= c;
  }
  return out;
}

console.log('bal  | reserved | charges that land        | round | floor | ceil | says      | N*50 vs reserve');
for (const balance of [49, 50, 75, 99, 100, 110, 124, 125, 149, 175, 199, 200]) {
  const d = weeklyDebt({ balance });
  const each = bnplInstallmentAmount(d);
  const reserved = Math.min(effectiveMinimumInWindow(d, CURRENT, NEXT), balance);
  const landing = charges(reserved, each);
  const line = selectBnplBetweenPaycheck(storeWith(d));
  const m = line?.match(/— (\d+) /);
  const said = m ? Number(m[1]) : 0;
  // The sentence states the TOTAL now, so read the total it states - not `said * each`, which is a
  // claim this line stopped making and would have gone on reporting a defect that no longer exists.
  const t = line?.match(/totalling about \$([\d,]+)/);
  const stated = t ? Number(t[1].replace(/,/g, '')) : 0;
  const delta = stated - reserved;
  console.log(
    `$${String(balance).padStart(4)}| $${String(reserved).padStart(7)} | ${landing.map((c) => '$' + c).join('+').padEnd(24)} | ` +
      `${String(Math.round(reserved / each)).padStart(5)} | ${String(Math.floor(reserved / each)).padStart(5)} | ` +
      `${String(Math.ceil(reserved / each)).padStart(4)} | ${(m ? m[1] : 'silent').padStart(9)} | ` +
      `${delta > 0 ? `OVER +$${delta}` : delta < 0 ? `under -$${-delta}` : said ? 'exact' : '-'}`,
  );
}
