import type { StorageAdapter } from './adapter';

/**
 * Web storage adapter — one JSON blob in `localStorage`, so reloads persist (real persistence on
 * web + the platform the B.1–B.8 rebuild verifies against). Every access is guarded so a private-mode
 * / disabled-storage environment degrades to a no-op rather than throwing.
 */
const KEY = 'debtPlanner.rnStore';
const QUARANTINE_PREFIX = 'debtPlanner.rnStore.__quarantine__';

/**
 * 3.5.7.3 — **THE EMBED PERSISTS NOTHING.** [D32] makes the privacy stance a gate rather than a promise,
 * and `sessionStorage` only, cleared on exit, is one of its three claims. The app itself keeps
 * `localStorage`: real persistence across reloads is correct there and is what B.1–B.8 verified against.
 *
 * ⛔ BUILD-TIME, NOT A RUNTIME TOGGLE. `EXPO_PUBLIC_*` is inlined by the bundler, so this resolves to a
 * constant in the built embed and there is no switch left in the artifact to flip. Same reasoning [D32]
 * gave for analytics — *"a toggle can be flipped, a flag that omits the code cannot"* — and, per that
 * item's before-scan, this is the ONE place that reasoning actually had something to bite on.
 *
 * ⚠️ Read lazily inside the existing guards, never at module scope: touching `sessionStorage` eagerly
 * throws in private-mode and sandboxed-iframe environments, and an embed is exactly where those happen.
 * The try/catch degradation already here is the reason this file survives disabled storage at all.
 * ⚠️ The claim is PROVEN by 3.5.7.4's Playwright gate, not by this comment.
 */
const EMBED = process.env.EXPO_PUBLIC_EMBED === '1';
const backing = (): Storage | undefined =>
  EMBED ? globalThis.sessionStorage : globalThis.localStorage;

export function createStorageAdapter(): StorageAdapter {
  return {
    /**
     * ⛔ **TWO DIFFERENT QUESTIONS WERE SHARING ONE `catch`, AND THEY HAVE DIFFERENT ANSWERS.**
     * [S1.10.6.4 · pass-3 B4]
     *
     * ⚡ *"Storage is unavailable"* (private mode, a disabled backing store) is a genuine `null` — the
     * degradation this file's header is about. *"There are bytes and they will not parse"* is **not**: it is
     * a truncated write from a killed tab or a quota error, and `adapter.ts` states the contract for it —
     * *"never lose the user's bytes"* — while `createAdapter.ts` implements it, handing the raw string back
     * so `runMigrations` refuses and the blob is **quarantined**.
     *
     * ⛔ **Two implementations of one interface disagreed on the same bytes.** Measured: a truncated blob
     * read as `null` here, so `persistence.ts` treated it as *"RN storage is genuinely empty"*, ran the v1.6
     * legacy import over a device that already had a v1.7 store, dropped the user into onboarding with no
     * warning, and let the first autosave overwrite the last copy of their plan.
     *
     * ⚠️ **The `getItem` catch stays exactly where it was.** That half of the old behaviour is correct and
     * is the reason this file survives disabled storage at all; only the `JSON.parse` half moves.
     */
    async read() {
      let raw: string | null;
      try {
        raw = backing()?.getItem(KEY) ?? null;
      } catch {
        return null; // storage unavailable — the private-mode degradation, unchanged
      }
      if (raw === null || raw === '') return null; // genuinely empty
      try {
        return JSON.parse(raw);
      } catch {
        // Corrupt bytes: hand the raw string back so hydrate → runMigrations throws → quarantined.
        return raw;
      }
    },
    async write(store) {
      try {
        backing()?.setItem(KEY, JSON.stringify(store));
      } catch {
        // storage unavailable / quota — drop silently (data-safety escape hatches cover the real risk)
      }
    },
    async quarantine(raw, reason) {
      try {
        backing()?.setItem(`${QUARANTINE_PREFIX}.${reason}.${Date.now()}`, raw);
      } catch {
        /* no-op */
      }
    },
    async clearQuarantine() {
      try {
        const ls = backing();
        if (!ls) return;
        Object.keys(ls)
          .filter((k) => k.startsWith(QUARANTINE_PREFIX))
          .forEach((k) => ls.removeItem(k));
      } catch {
        /* no-op */
      }
    },
  };
}
