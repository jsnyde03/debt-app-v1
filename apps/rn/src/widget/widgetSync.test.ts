import { createDefaultStore } from '@/data/defaults';
import type { Debt } from '@/data/models';
import { createDebtStore } from '@/store/store';
import { formatWhole } from '@/utils/format';

import { buildWidgetSnapshot, type WidgetSnapshot } from './snapshot';
import { startWidgetSync } from './widgetSync';

/**
 * 3.5.1 — the iOS widget App-Group bridge (JS side). Covers the pure snapshot builder (empty / paying-
 * down / all-cleared) + `startWidgetSync`'s initial mirror + idempotency. Throw-based; self-runs on
 * import; wired into `runAppTests`. The native `ExtensionStorage` write + the debounce timing are
 * device/Freedom-proven; here the injectable `write`/`now` keep it node-testable. Run: `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function eq<T>(a: T, b: T, label: string) {
  assert(a === b, `${label} (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`);
}

const debt = (over: Partial<Debt>): Debt =>
  ({ id: 'x', name: 'Debt', balance: 0, originalBalance: 0, minimumPayment: 50, apr: 10, dueDate: '2026-08-01', type: 'debt', recurrence: 'monthly', ...over }) as Debt;

console.log('\n▶ widget snapshot + sync (3.5.1)');

// Empty store → no data (widget shows the "open the app" prompt).
{
  const s = createDefaultStore();
  s.debts = [];
  const snap = buildWidgetSnapshot(s, 100);
  eq(snap.hasData, false, 'empty store → hasData false');
  eq(snap.pctPaid, 0, 'no debts → 0 progress');
  eq(snap.updatedAt, 100, 'updatedAt is injected (testable)');
}

// Paying down → progress + remaining are computed off originalBalance vs balance.
{
  const s = createDefaultStore();
  s.debts = [
    debt({ id: 'a', name: 'Visa', balance: 6000, originalBalance: 8000 }),
    debt({ id: 'b', name: 'Car', balance: 2000, originalBalance: 2000 }),
  ];
  const snap = buildWidgetSnapshot(s, 200);
  eq(snap.hasData, true, 'debts → hasData true');
  eq(snap.pctLabel, '20%', 'paid 2000 of 10000 → 20% label'); // (8000-6000)+(2000-2000)=2000
  assert(snap.pctPaid > 0.19 && snap.pctPaid < 0.21, 'pctPaid ~0.2');
  eq(snap.remaining, formatWhole(8000), 'remaining = current total balance');
}

// All debts cleared → "Debt-free!" (bypasses the projected-date lookup).
{
  const s = createDefaultStore();
  s.debts = [debt({ id: 'a', name: 'Visa', balance: 0, originalBalance: 8000 })];
  const snap = buildWidgetSnapshot(s, 300);
  eq(snap.debtFreeDate, 'Debt-free!', 'has debts, none live → Debt-free!');
  eq(snap.pctLabel, '100%', 'fully cleared → 100%');
}

// 3.5.5 — guardianSpoken (the Siri "am I okay this paycheck?" read): premium only.
{
  const free = createDefaultStore();
  free.paycheck = { ...free.paycheck, amount: '2000' };
  free.debts = [debt({ id: 'a', name: 'Visa', balance: 6000, originalBalance: 8000, minimumPayment: 100 })];
  eq(buildWidgetSnapshot(free, 400).guardianSpoken, '', 'free tier → guardianSpoken empty (Siri returns an upsell)');

  const premium = createDefaultStore();
  premium.subscriptionPlan = 'premium';
  premium.genuineCycleCount = 6; // established → a real read, no cold-start dampening
  premium.paycheck = { ...premium.paycheck, amount: '2000' };
  premium.debts = [debt({ id: 'a', name: 'Visa', balance: 6000, originalBalance: 8000, minimumPayment: 100 })];
  const spoken = buildWidgetSnapshot(premium, 400).guardianSpoken;
  assert(spoken.length > 0 && spoken.toLowerCase().includes('paycheck'), 'premium → a non-empty spoken Guardian read');
}

// startWidgetSync mirrors once at launch, and is idempotent per store.
{
  const store = createDebtStore();
  const writes: WidgetSnapshot[] = [];
  startWidgetSync(store, (w) => writes.push(w), () => 111);
  eq(writes.length, 1, 'initial mirror fires synchronously at start');
  eq(writes[0].updatedAt, 111, 'initial mirror uses the injected clock');
  startWidgetSync(store, (w) => writes.push(w), () => 222);
  eq(writes.length, 1, 'a second startWidgetSync on the same store is a no-op (idempotent)');
}

console.log(`✅ widget snapshot + sync — ${passed} assertions passed\n`);
