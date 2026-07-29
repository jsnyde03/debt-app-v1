import { drainPendingActions } from './drainPendingActions';
import type { PendingActionBridge } from './pendingActionBridge.types';
import {
  applyPendingActions,
  parsePendingActions,
  type PendingActionApi,
} from './pendingActions';

/**
 * 3.5.3.5 — the AppIntent → store bridge core: defensive parse · apply-dispatches-store-actions · drain.
 * Throw-based; runs via `npm run test:app`.
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

/** A stub store surface that counts dispatches. */
function stubApi() {
  const calls: string[] = [];
  const api: PendingActionApi = { applyPaydayLandedIntent: () => calls.push('applyPaydayLandedIntent') };
  return { api, calls };
}

// ── parsePendingActions (defensive) ─────────────────────────────────────────────
eq(parsePendingActions(null).length, 0, 'parse: null → []');
eq(parsePendingActions('not json').length, 0, 'parse: bad JSON string → []');
eq(parsePendingActions('{}').length, 0, 'parse: non-array JSON → []');
eq(parsePendingActions([{ kind: 'nope', id: '1' }]).length, 0, 'parse: unknown kind → dropped');
eq(parsePendingActions([{ kind: 'payday-landed' }]).length, 0, 'parse: missing id → dropped');
eq(parsePendingActions([null, 3, 'x', { kind: 'payday-landed', id: 'a' }]).length, 1, 'parse: mixed junk → keeps the valid one');
eq(parsePendingActions([{ kind: 'payday-landed', id: 'a' }, { kind: 'payday-landed', id: 'a' }]).length, 1, 'parse: dedupe by id');
{
  // A JSON string (the real App-Group shape) parses to the typed action.
  const parsed = parsePendingActions(JSON.stringify([{ kind: 'payday-landed', id: 'x1' }]));
  eq(parsed.length, 1, 'parse: JSON-string array → 1');
  eq(parsed[0].kind, 'payday-landed', 'parse: kind preserved');
}

// ── applyPendingActions (dispatches the real store action) ───────────────────────
{
  const { api, calls } = stubApi();
  const applied = applyPendingActions(parsePendingActions([{ kind: 'payday-landed', id: 'a' }]), api);
  eq(calls.length, 1, 'apply: payday-landed dispatches applyPaydayLandedIntent once');
  eq(calls[0], 'applyPaydayLandedIntent', 'apply: correct action (the Undo-aware roll)');
  eq(applied.length, 1, 'apply: returns the applied action');
}

// ── drainPendingActions (read → parse → apply → clear) ───────────────────────────
{
  const { api, calls } = stubApi();
  let cleared = false;
  const bridge: PendingActionBridge = {
    read: () => JSON.stringify([{ kind: 'payday-landed', id: 'a' }]),
    clear: () => { cleared = true; },
  };
  const applied = drainPendingActions(bridge, api);
  eq(applied.length, 1, 'drain: applied 1');
  eq(calls.length, 1, 'drain: dispatched the store action');
  assert(cleared, 'drain: cleared the queue after applying');
}
{
  // Empty queue → no dispatch, no clear (nothing to do).
  const { api, calls } = stubApi();
  let cleared = false;
  const applied = drainPendingActions({ read: () => null, clear: () => { cleared = true; } }, api);
  eq(applied.length, 0, 'drain: empty → nothing applied');
  eq(calls.length, 0, 'drain: empty → no dispatch');
  assert(!cleared, 'drain: empty → no clear');
}
{
  // A throwing bridge is swallowed (best-effort) — never crashes the app.
  const { api } = stubApi();
  const applied = drainPendingActions({ read: () => { throw new Error('boom'); }, clear: () => {} }, api);
  eq(applied.length, 0, 'drain: a throwing bridge is caught → []');
}

console.log(`\n  pendingActions (AppIntent bridge): ${passed} assertions passed\n`);
