import type { DebtStore } from '@/data/models';

/**
 * ⛔ [S1.13.7.12.6.5.7.4a-1] — WHICH QUEUED INTENTS THIS STORE HAS ALREADY APPLIED.
 *
 * A Siri payment or a Lock Screen roll reaches the store through the App Group queue: read, apply, clear. The clear is
 * best-effort and swallows its failure, so an entry can outlive the drain that applied it — and the next drain (return
 * to foreground) applied it again. Measured through the real store: a $250 payment taken twice, a payday rolled twice.
 *
 * ⚠️ The id is recorded in the SAME store write as the effect, so the two land or are lost together. ⛔ And the record
 * is carried through every write that REPLACES the store (`carryAppliedIntents`, called from the store's set wrapper):
 * Undo restores a snapshot taken before the id existed, so a record kept only on the mutation is erased by the one
 * action that exists to take the effect back, and the lingering entry re-applies what the user just undid.
 *
 * ⚠️ Ids, never content. Each Swift producer mints a UUID per invocation, so two deliberate payments of the same amount
 * stay two. Capped: an id only needs remembering while its entry can still be in the queue.
 */
export const APPLIED_INTENT_CAP = 50;

/**
 * The record, read defensively: anything but an array reads as empty and non-string entries are dropped.
 * ⛔ A bare string would otherwise answer `includes` by SUBSTRING and swallow a real payment.
 */
export function appliedIntentIdsOf(store: DebtStore): readonly string[] {
  const raw: unknown = store.appliedIntentIds;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export function hasAppliedIntent(store: DebtStore, id: string): boolean {
  return appliedIntentIdsOf(store).includes(id);
}

/** `store` with `id` recorded, newest last and capped. No id → the same store, by reference. */
export function withAppliedIntent(store: DebtStore, id: string | undefined): DebtStore {
  if (!id) return store;
  const ids = appliedIntentIdsOf(store).filter((x) => x !== id);
  return { ...store, appliedIntentIds: [...ids, id].slice(-APPLIED_INTENT_CAP) };
}

/**
 * The store about to land, keeping every id the outgoing store had recorded. Returns `next` by reference when nothing
 * is missing, so an ordinary write is untouched.
 */
export function carryAppliedIntents(prev: DebtStore, next: DebtStore): DebtStore {
  const had = appliedIntentIdsOf(prev);
  if (had.length === 0) return next;
  const has = appliedIntentIdsOf(next);
  const present = new Set(has);
  if (had.every((id) => present.has(id))) return next;
  const known = new Set(had);
  return { ...next, appliedIntentIds: [...had, ...has.filter((id) => !known.has(id))].slice(-APPLIED_INTENT_CAP) };
}
