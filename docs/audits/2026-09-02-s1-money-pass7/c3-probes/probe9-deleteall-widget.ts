import { createDebtStore } from '@/store/store';
import { startWidgetSync } from '@/widget/widgetSync';
import { buildWidgetSnapshot, type WidgetSnapshot } from '@/widget/snapshot';

const tick = () => new Promise((r) => setTimeout(r, 60));

async function run(label: string, failAfterFirst: boolean) {
  let writeLands = true;
  const store = createDebtStore();
  store.getState().addDebt({ id: 'd1', name: 'Chase Sapphire', balance: 9000, originalBalance: 12000, minimumPayment: 250, apr: 24, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' } as never);
  // What the App Group holds is the last payload a write actually LANDED.
  let appGroup: WidgetSnapshot | null = null;
  const writes: WidgetSnapshot[] = [];
  startWidgetSync(store, (w) => { writes.push(w); if (writeLands) appGroup = w; return writeLands; }, () => 1, 0);
  await tick();
  console.log(`\n${label}`);
  console.log('  before delete-all: App Group debtsJson =', appGroup ? (appGroup as WidgetSnapshot).debtsJson : 'nothing written');

  // more.tsx:179-182 — the C3-10 fix clears the pendingActions key, then resets the store.
  // (pendingActionBridge.clear() touches only `pendingActions`; nothing in the tree removes `debtSnapshot`.)
  if (failAfterFirst) writeLands = false;
  store.getState().reset();
  await tick();
  console.log('  after  delete-all: writes attempted =', writes.length);
  console.log('                     App Group debtsJson =', appGroup ? (appGroup as WidgetSnapshot).debtsJson : 'nothing written');
  console.log('                     store now says      =', JSON.stringify(buildWidgetSnapshot(store.getState().store, 1).debtsJson));
}

void (async () => {
  await run('CASE A — the debounced widget write LANDS (the only thing that scrubs the App Group)', false);
  await run('CASE B — the initial mirror lands, then the post-reset write is dropped by the native bridge', true);
})();
