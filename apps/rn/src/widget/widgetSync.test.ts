import { createDefaultStore } from '@/data/defaults';
import { runMigrations } from '@/data/migrations';
import type { Debt, DebtStore } from '@/data/models';
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
  eq(snap.debtFreeDate, 'Debt-free', 'has debts, none live → Debt-free');
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
  const premiumSnap = buildWidgetSnapshot(premium, 400);
  assert(premiumSnap.guardianSpoken.length > 0 && premiumSnap.guardianSpoken.toLowerCase().includes('paycheck'), 'premium → a non-empty spoken Guardian read');
  eq(premiumSnap.isPremium, true, 'premium → isPremium true');
  eq(buildWidgetSnapshot(free, 400).isPremium, false, 'free → isPremium false');

  // debtsJson — the live debt list for Siri's DebtEntity (a flat JSON string).
  const parsed = JSON.parse(premiumSnap.debtsJson) as { id: string; name: string; balance: string }[];
  eq(parsed.length, 1, 'debtsJson lists the live debt');
  eq(parsed[0].name, 'Visa', '…with its name');
  assert(typeof parsed[0].id === 'string' && typeof parsed[0].balance === 'string', '…id + formatted balance');
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

/**
 * ⛔ **S1.10.6.3 [pass-3 blockers D3-1 · D3-2] — THE WIDGET AND THE APP MADE THE SAME CLAIM AND DISAGREED.**
 *
 * ⚡ **No fixture in the repo had ever put a `pendingDataRepairs` entry through `buildWidgetSnapshot`** —
 * measured, `grep -rn "pendingDataRepairs" apps/rn/src/widget apps/rn/src/liveActivity` returned **0**. The
 * all-cleared case above pins the HONEST one (a genuinely paid-off store) and is why these are additions
 * rather than edits: the fix must not touch it.
 *
 * ⚠️ Built through the real `runMigrations` rather than by setting `pendingDataRepairs` by hand, so the
 * repair records are the ones the import path actually writes.
 */
function migratedWidgetStore(debts: unknown[], premium = false): DebtStore {
  return runMigrations({
    version: 8,
    subscriptionPlan: premium ? 'premium' : 'free',
    genuineCycleCount: 6,
    paycheck: { amount: '2000', currentDate: '2026-03-02', nextPaycheckDate: '2026-03-16' },
    debts,
    prefs: { onboardingComplete: true },
  });
}

// D3-1 — a cleared card beside one whose balance could not be read.
{
  const unread = migratedWidgetStore([
    { id: 'a', name: 'Chase', balance: 'n/a', originalBalance: 12000, minimumPayment: 100, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' },
    { id: 'b', name: 'Visa', balance: 0, originalBalance: 400, minimumPayment: 25, apr: 19, dueDate: '2026-03-12', type: 'debt', recurrence: 'monthly' },
  ]);
  assert(unread.pendingDataRepairs.length > 0, '⭐ the fixture really did record a repair (or it proves nothing)');
  const snap = buildWidgetSnapshot(unread, 500);
  // ⛔ THE HONEST STATE BY NAME FIRST — a payload that merely dropped the word would satisfy the three below.
  eq(snap.debtFreeDate, 'Balances unread', '⛔ D3-1 — the Home Screen does not say "Debt-free" over balances the app refused to claim');
  eq(snap.pctLabel, '—', '⛔ D3-1 — …and the ring does not say 100%, which is the same falsehood without the word');
  eq(snap.remaining, '—', '⛔ D3-1 — …and it does not say $0 remaining over $12,400 still owed');
  // ⛔ NOT the empty state: Swift renders "Add debts in app" for `hasData: false`, which is the false
  // replacement `progress.tsx` records having shipped once — a true statement withheld, a new one invented.
  eq(snap.hasData, true, '⛔ D3-1 — the widget still points at the app rather than claiming there is no data');
}

// D3-1's other direction — the guard is not only about the cleared branch.
{
  const unread = migratedWidgetStore([
    { id: 'a', name: 'Chase', balance: 'n/a', originalBalance: 12000, minimumPayment: 100, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' },
    { id: 'b', name: 'Visa', balance: 4000, originalBalance: 4000, minimumPayment: 80, apr: 19, dueDate: '2026-03-12', type: 'debt', recurrence: 'monthly' },
  ]);
  const snap = buildWidgetSnapshot(unread, 500);
  eq(snap.remaining, '—', '⛔ D3-1 — a STILL-PAYING portfolio missing an addend has no total either');
  eq(snap.pctLabel, '—', '…and no percentage');
}

// ⭐ D3-1 CONTROL — the same shape with every balance read still celebrates.
{
  const read = migratedWidgetStore([
    { id: 'a', name: 'Chase', balance: 0, originalBalance: 12000, minimumPayment: 100, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' },
    { id: 'b', name: 'Visa', balance: 0, originalBalance: 400, minimumPayment: 25, apr: 19, dueDate: '2026-03-12', type: 'debt', recurrence: 'monthly' },
  ]);
  eq(read.pendingDataRepairs.length, 0, 'control — a readable portfolio records no repair');
  const snap = buildWidgetSnapshot(read, 500);
  eq(snap.debtFreeDate, 'Debt-free', '⭐ control — a portfolio the app fully read still says Debt-free');
  eq(snap.pctLabel, '100%', '⭐ control — …with its real percentage');
}

// D3-2 — Siri's spoken read, on the pass-2 C4 class: a minimum the app could not read.
{
  const unread = migratedWidgetStore(
    [{ id: 'a', name: 'Visa', balance: 6000, originalBalance: 8000, minimumPayment: 'n/a', apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' }],
    true,
  );
  assert(unread.pendingDataRepairs.some((r) => r.field === 'minimumPayment'), '⭐ the fixture really did lose the minimum');
  eq(buildWidgetSnapshot(unread, 600).guardianSpoken, '', '⛔ D3-2 — Siri says nothing rather than naming money free over an obligation nobody read');

  // ⭐ CONTROL — the same debt with a real minimum still speaks, or the fix bought silence.
  const read = migratedWidgetStore(
    [{ id: 'a', name: 'Visa', balance: 6000, originalBalance: 8000, minimumPayment: 100, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' }],
    true,
  );
  assert(buildWidgetSnapshot(read, 600).guardianSpoken.length > 0, '⭐ control — a plan the app read is still spoken');
}

console.log(`✅ widget snapshot + sync — ${passed} assertions passed\n`);
