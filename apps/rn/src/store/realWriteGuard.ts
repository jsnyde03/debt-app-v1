import type { DebtStore } from '@/data/models';
import { reportError } from '@/utils/reportError';

/**
 * [R4] — while a SANDBOX subtree is mounted, the user's real plan is READ-ONLY.
 *
 * ⛔ **This module exists because the previous backstop REPORTED and did not BLOCK.** It watched the real
 * store from a `subscribe` callback, which fires *after* the write has landed — so the one thing it was
 * built to prevent (a component inside a demo mutating the user's real plan) happened in full, and the
 * guard's only contribution was to describe it afterwards. Sentry caught exactly that from TestFlight:
 * a user edited an expense inside the demo and the write went to their real plan.
 *
 * The rule is unchanged; the enforcement moved. `createDebtStore` now consults `refuseRealStoreWrite`
 * *inside* the action's own `set`, so a forbidden write never lands at all. The subscribe-based reporter
 * in `StoreContext` stays as defence in depth: it covers the one seam this cannot reach (`api.setState`,
 * which the actions deliberately bypass).
 *
 * ⚠️ **Refusal is silent to the user by design, and that is correct.** A refused write was aimed at the
 * wrong store — the screen the user is looking at is the sandbox, so the write they intended is the one
 * `useActiveStore()` performs. A refusal therefore only ever fires on a BUG, and every refusal is
 * reported, so a miss surfaces in Sentry loudly instead of corrupting money quietly.
 *
 * ⚠️ Deliberately dependency-free of `appStore`/`StoreContext`/the session stores. `appStore.ts` imports
 * this to build the singleton, so anything it imported back would be an evaluation cycle around the very
 * `const` being defined.
 */

/**
 * The ONLY real-store prefs a bounded run may write: its resume position, and the record that the run was
 * seen. Both must outlive the sandbox, which is why they are written to the real store at all.
 */
export const TUTORIAL_WRITABLE_PREFS = ['tutorialStep', 'tutorialSeen'];

/** How many sandbox subtrees are currently mounted. A counter, not a boolean — see `enterSandboxScope`. */
let sandboxDepth = 0;

/**
 * Declare that a sandbox subtree is on screen. Returns the matching release, which is idempotent.
 *
 * A COUNTER rather than a flag because the walkthrough mounts its own provider inside Today while the
 * demo's provider sits above the navigator — two live scopes is a reachable state, and a boolean would
 * let the inner one's unmount re-open the real store while the outer one is still showing scripted money.
 */
export function enterSandboxScope(): () => void {
  sandboxDepth += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    sandboxDepth -= 1;
  };
}

/** Is any sandbox subtree mounted right now? */
export function isSandboxMounted(): boolean {
  return sandboxDepth > 0;
}

/**
 * Some real-store writes during a session are legitimate and have nothing to do with the sandbox: the
 * app's own background work landing while a bounded run happens to be on screen. `drainPendingActions()`
 * is the archetype — a user who taps the Live Activity's "Payday landed" while backgrounded mid-demo has
 * their real plan rolled the instant they come back, and that write is correct.
 *
 * ⚠️ **Now load-bearing, not merely noise-suppressing.** Under the old reporter an undeclared background
 * write produced a false alarm; under refusal it is DROPPED. Every legitimate real-store writer that can
 * fire while a run is on screen must be wrapped — see `_layout.tsx`, `premiumSync.ts` and
 * `use-notification-sync.ts`.
 *
 * ⛔ **Synchronous only.** The flag is down again by the time this returns, so wrapping an `async`
 * function protects nothing past its first `await`. Wrap the synchronous call that performs the write,
 * never the promise chain around it.
 */
let realWriteAllowed = false;
export function allowRealStoreWrite<T>(fn: () => T): T {
  const prev = realWriteAllowed;
  realWriteAllowed = true;
  try {
    return fn();
  } finally {
    realWriteAllowed = prev;
  }
}

/**
 * Is a declared real-store write in flight right now?
 *
 * ⚠️ Only meaningful SYNCHRONOUSLY inside `allowRealStoreWrite`. zustand notifies subscribers during
 * `set`, so the `StoreProvider` reporter observes the flag still raised for the write it is looking at —
 * which is what stops a declared write from being reported as a veto bypass.
 */
export function isRealWriteAllowed(): boolean {
  return realWriteAllowed;
}

/**
 * Which fields of the user's plan this write would move — field by field, ignoring a bounded run's own
 * resume bookkeeping. Empty means the write changes nothing the user owns.
 *
 * [B3] The UNION of both key sets on both halves. Iterating the next object alone is blind to a REMOVED
 * key, and a dropped field is a real-store change like any other: `windfall` is read as `store.windfall
 * ?? 0`, so its disappearance is invisible downstream, and prefs written without `onboardingComplete`
 * would silently re-onboard the user.
 */
export function forbiddenRealStoreChanges(prev: DebtStore, next: DebtStore): string[] {
  if (prev === next) return [];
  const { prefs: prevPrefs, ...prevPlan } = prev;
  const { prefs: nextPrefs, ...nextPlan } = next;
  const planKeys = new Set([...Object.keys(prevPlan), ...Object.keys(nextPlan)]);
  const changed = ([...planKeys] as (keyof typeof nextPlan)[]).filter((k) => nextPlan[k] !== prevPlan[k]).map(String);
  // Prefs are diffed against a two-key allowlist rather than excluded wholesale. Dropping the whole
  // `prefs` object was too generous by a wide margin: a sandboxed component writing `onboardingComplete:
  // false` through the singleton would re-onboard the user, past a backstop looking the other way.
  const prefKeys = new Set([...Object.keys(prevPrefs), ...Object.keys(nextPrefs)]);
  for (const k of [...prefKeys] as (keyof typeof nextPrefs)[]) {
    if (nextPrefs[k] === prevPrefs[k]) continue;
    if (TUTORIAL_WRITABLE_PREFS.includes(String(k))) continue;
    changed.push(`prefs.${String(k)}`);
  }
  return changed;
}

/**
 * The veto `createDebtStore` consults on the REAL singleton's every action. `true` = drop this write.
 *
 * ⛔ Refuses the whole `set`, not the offending field. A write that reaches here was aimed at the wrong
 * store outright, so there is no salvageable half — and a partial application would leave the plan in a
 * shape no action ever produces.
 *
 * ⚠️ `hydrate` also writes `store` through this seam, and refusing THAT would show the user an empty
 * plan. It cannot collide: the root renders `null` until `isHydrated`, so no provider — and therefore no
 * sandbox scope — exists while hydration is in flight, and the storage-error retry replaces the tree
 * above the provider entirely.
 */
export function refuseRealStoreWrite(prev: DebtStore, next: DebtStore): boolean {
  if (sandboxDepth === 0) return false;
  if (realWriteAllowed) return false;
  const changed = forbiddenRealStoreChanges(prev, next);
  if (changed.length === 0) return false;
  reportError(new Error('Real-store write REFUSED while a sandbox subtree was mounted'), {
    seam: 'realWriteGuard',
    hint: 'a component inside the subtree is writing via appStore instead of useActiveStore(); the write was dropped',
    fields: changed.join(','),
  });
  return true;
}

/** Test seam: drop any leaked scope so one test's mount cannot bleed into the next. */
export function __resetSandboxScopesForTest(): void {
  sandboxDepth = 0;
  realWriteAllowed = false;
}
