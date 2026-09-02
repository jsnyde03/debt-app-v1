import { createDebtStore } from '@/store/store';
import { drainPendingActions } from '@/appIntents/drainPendingActions';
import type { PendingActionBridge } from '@/appIntents/pendingActionBridge.types';

const store = createDebtStore();
store.getState().addDebt({ id: 'd1', name: 'Chase', balance: 1000, originalBalance: 1000, minimumPayment: 50, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' } as never);
const bal = () => store.getState().store.debts[0]?.balance;

// Siri offered the debt from the App-Group snapshot and queued `debtId: 'd-stale'` (the row the
// snapshot named no longer exists under that id — a restore / re-import / delete since the write).
const QUEUE = JSON.stringify([{ kind: 'log-payment', id: 'intent-uuid-9', debtId: 'd-stale', amount: 200 }]);
let cleared = 0;
const bridge: PendingActionBridge = { read: () => (cleared ? '[]' : QUEUE), clear: () => { cleared++; } };

console.log('balance before        =', bal());
const applied = drainPendingActions(bridge, store.getState());
console.log('drain returned        =', JSON.stringify(applied));
console.log('drain reported applied=', applied.length);
console.log('balance after         =', bal(), '  <-- unchanged: logManualPayment no-oped');
console.log('queue cleared         =', cleared === 1, ' <-- the action is gone forever');
console.log('intentRollback        =', store.getState().intentRollback, ' <-- no Undo card, nothing to tell the user');
