import { createDebtStore } from '@/store/store';
import { drainPendingActions } from '@/appIntents/drainPendingActions';
import type { PendingActionBridge } from '@/appIntents/pendingActionBridge.types';

const store = createDebtStore();
store.getState().addDebt({ id: 'd1', name: 'Chase', balance: 1000, originalBalance: 1000, minimumPayment: 50, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' } as never);
const id = store.getState().store.debts[0].id;
const bal = () => store.getState().store.debts[0].balance;
console.log('start balance             =', bal(), 'id=', JSON.stringify(id));

// The App-Group queue, exactly as `LogPaymentIntent.swift:107` writes it (one id, one $200 payment).
const QUEUE = JSON.stringify([{ kind: 'log-payment', id: 'intent-uuid-1', debtId: id, amount: 200 }]);

// `pendingActionBridge.native.clear()` swallows a native throw (`catch { /* best-effort */ }`),
// so a clear that FAILS is indistinguishable from one that succeeded: the queue survives.
let clearCalls = 0;
const bridgeWithFailingClear: PendingActionBridge = {
  read: () => QUEUE,                       // the queue is still there, because clear never landed
  clear: () => { clearCalls++; },          // native swallowed its own error; JS sees success
};

const a = drainPendingActions(bridgeWithFailingClear, store.getState());
console.log('after drain #1 (launch)   =', bal(), '| applied', a.length, '| clear() calls', clearCalls);
const b = drainPendingActions(bridgeWithFailingClear, store.getState());
console.log('after drain #2 (fg)       =', bal(), '| applied', b.length, '| clear() calls', clearCalls);
const c = drainPendingActions(bridgeWithFailingClear, store.getState());
console.log('after drain #3 (fg)       =', bal(), '| applied', c.length, '| clear() calls', clearCalls);
console.log('intentRollback.kind       =', store.getState().intentRollback?.kind);
store.getState().undoIntentAction();
console.log('balance after ONE Undo    =', bal(), '(true balance is 800; one payment of $200 was made)');
