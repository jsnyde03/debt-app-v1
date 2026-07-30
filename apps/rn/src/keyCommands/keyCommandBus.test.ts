import { onAddDebtRequested, requestAddDebt } from './keyCommandBus';

/**
 * TEST-3 (closeout) — the ⌘N add-debt bus latch (3.6.6). Pure JS, self-runs on import via `test:app`.
 * The native listener is device-only, but this latch (request held while Debts is unmounted, delivered to
 * the next subscriber exactly once) is the part a refactor would silently break on every platform.
 */
let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [keyCommandBus: ${label}]`);
  passed++;
}

// Latch (module state is fresh: nothing pending, no subscribers) — a request with no subscriber is HELD
// and delivered to the next subscriber, exactly once.
{
  requestAddDebt(); // cold ⌘N: Debts not mounted yet → held
  let n = 0;
  const offA = onAddDebtRequested(() => {
    n++;
  });
  assert(n === 1, 'a pending request is delivered to the next subscriber');

  let m = 0;
  const offB = onAddDebtRequested(() => {
    m++;
  });
  assert(m === 0, 'the latch fires only ONCE (a later subscriber gets nothing)');
  offA();
  offB();
}

// Live delivery + unsubscribe (pending was consumed above).
{
  let k = 0;
  const off = onAddDebtRequested(() => {
    k++;
  });
  requestAddDebt();
  assert(k === 1, 'an active subscriber receives the request');
  requestAddDebt();
  assert(k === 2, 'an active subscriber receives EACH request (no latch when live)');
  off();
  requestAddDebt();
  assert(k === 2, 'an unsubscribed listener stops receiving');
}

console.log(`\n  keyCommandBus: ${passed} assertions passed\n`);
