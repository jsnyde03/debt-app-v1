/**
 * The AppIntent → store bridge (3.5.3.5), REUSABLE shared machinery. A Swift AppIntent (a Live Activity
 * button, a Shortcut, Siri) can't touch the JS/MMKV store, so it queues a "pending action" into the App
 * Group; the app drains + applies them on launch/foreground (`drainPendingActions`), then clears the
 * queue. This module is the pure, testable core: the action model, a DEFENSIVE parser for the App-Group
 * payload, and the apply mapping. 3.5.5's voice log-a-payment adds its own `kind`.
 *
 * Apply DISPATCHES the existing store actions (not a reimplementation) so a queued action is byte-identical
 * to doing it in-app — single source of truth.
 */

/** A mutation queued by an iOS AppIntent for the app to apply. `id` dedupes a double-write. */
export type PendingAction =
  | { kind: 'payday-landed'; id: string }
  | { kind: 'log-payment'; id: string; debtId: string; amount: number };

type PendingKind = PendingAction['kind'];
const KINDS: ReadonlySet<string> = new Set<PendingKind>(['payday-landed', 'log-payment']);

/** The narrow store surface a pending action drives — keeps this decoupled + testable with a stub. */
export interface PendingActionApi {
  /** Roll the cycle with a snapshot for Undo (3.5.3.5) — the AppIntent-driven counterpart to a manual roll. */
  applyPaydayLandedIntent(): void;
  /** Log a payment against a debt with Undo (3.5.5) — the voice log-a-payment intent's target. */
  logManualPayment(debtId: string, amount: number): void;
}

/**
 * Parse the App-Group payload (a JSON array, or an already-decoded array) into valid actions. Defensive
 * by design — a corrupt / foreign / partial entry is dropped, never thrown on or mis-applied — and
 * deduped by `id` (an intent can double-write across a relaunch).
 */
export function parsePendingActions(raw: unknown): PendingAction[] {
  let arr: unknown = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];

  const seen = new Set<string>();
  const out: PendingAction[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const { kind, id } = rec;
    if (typeof kind !== 'string' || !KINDS.has(kind)) continue;
    if (typeof id !== 'string' || id.length === 0 || seen.has(id)) continue;
    if (kind === 'log-payment') {
      // Extra fields must be present + sane, or the whole entry is dropped (never a partial mutation).
      const { debtId, amount } = rec;
      if (typeof debtId !== 'string' || debtId.length === 0) continue;
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) continue;
      seen.add(id);
      out.push({ kind: 'log-payment', id, debtId, amount });
    } else {
      seen.add(id);
      out.push({ kind: 'payday-landed', id });
    }
  }
  return out;
}

/** Apply one action by dispatching its store action. Returns whether it was handled. */
export function applyPendingAction(action: PendingAction, api: PendingActionApi): boolean {
  switch (action.kind) {
    case 'payday-landed':
      api.applyPaydayLandedIntent();
      return true;
    case 'log-payment':
      api.logManualPayment(action.debtId, action.amount);
      return true;
    default:
      return false;
  }
}

/** Apply all actions in order; returns the ones actually handled (for an Undo / telemetry). */
export function applyPendingActions(actions: PendingAction[], api: PendingActionApi): PendingAction[] {
  return actions.filter((action) => applyPendingAction(action, api));
}
