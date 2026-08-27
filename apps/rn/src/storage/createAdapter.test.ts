import { createStorageAdapter } from './createAdapter.web';

/**
 * ⛔ **S1.10.6.4 [pass-3 B4] — NEITHER STORAGE ADAPTER HAD A UNIT TEST, AND NO STORE TEST PARSES A BLOB.**
 *
 * ⚡ `MemoryStorageAdapter` is what every store test uses and it has **no parse step at all**, so nothing in
 * either runner ever executed a `JSON.parse` of a persisted blob. The one test of *"bytes the app cannot
 * open"* is `data-recovery.spec.ts`'s `seedCorrupt`, and it writes `JSON.stringify('this is not a store')`
 * — **valid JSON**. That is the single member of the class on which the web adapter and the native adapter
 * agree, and ten green tests rested on it.
 *
 * ⛔ **The two implementations of one `StorageAdapter` contract disagreed on the same bytes.**
 * `createAdapter.ts` states the doctrine and implements it — *"Corrupt bytes: hand the raw string back so
 * the store's hydrate → runMigrations throws → the blob is quarantined (never silently dropped)"* — while
 * the web adapter wrapped `getItem` **and** `JSON.parse` in one `catch { return null }`. A truncated write
 * from a killed tab therefore read as *"nothing is stored"*, `persistence.ts` ran the v1.6 legacy import
 * over a device that already had a v1.7 store, the user landed in onboarding with no warning, and the first
 * autosave overwrote the last copy of their plan.
 *
 * ⚠️ Web-only by construction: `createAdapter.ts` needs MMKV, which is native. The contract half that
 * matters here is the one that was violated, and it is this file's.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`createAdapter: ${label}`);
  passed++;
}
function eq<T>(a: T, b: T, label: string) {
  assert(a === b, `${label} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`);
}

const KEY = 'debtPlanner.rnStore';

/** A minimal `Storage`, or one that throws on every access — the private-mode case. */
function fakeStorage(initial: string | null, opts?: { throws?: boolean }): Storage {
  let value = initial;
  const store = {
    getItem(k: string) {
      if (opts?.throws) throw new Error('storage disabled');
      return k === KEY ? value : null;
    },
    setItem(k: string, v: string) {
      if (opts?.throws) throw new Error('storage disabled');
      if (k === KEY) value = v;
    },
    removeItem() {},
    clear() {},
    key() {
      return null;
    },
    get length() {
      return value === null ? 0 : 1;
    },
  };
  return store as unknown as Storage;
}

async function readWith(raw: string | null, opts?: { throws?: boolean }): Promise<unknown> {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage(raw, opts), configurable: true });
  try {
    return await createStorageAdapter().read();
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete (globalThis as { localStorage?: unknown }).localStorage;
  }
}

export default async function run() {
  console.log('\n▶ storage adapters (S1.10.6.4 · B4)');

  // ── The two answers that were being conflated ────────────────────────────────────────────────────
  eq(await readWith(null), null, 'genuinely empty → null');
  eq(await readWith(null, { throws: true }), null, 'storage unavailable (private mode) → null — unchanged');

  /**
   * ⛔ **THE MEMBER OF THE CLASS NOTHING TESTED.** A truncated write is the ordinary way a blob goes bad —
   * a killed tab, a quota error mid-`setItem` — and it is invalid JSON, unlike the e2e's fixture.
   */
  const truncated = '{"debts":[{"id":"d1","balance":12';
  eq(await readWith(truncated), truncated, '⛔ B4 — corrupt bytes come back as the RAW STRING, so hydrate quarantines them');
  eq(await readWith('not json at all'), 'not json at all', '⛔ B4 — …and so do garbage bytes');

  // ⭐ CONTROL — a real blob still parses, or the fix bought its correctness by refusing to read anything.
  const real = await readWith('{"debts":[],"storeVersion":8}');
  assert(real !== null && typeof real === 'object', '⭐ control — a valid blob still hydrates as an object');
  eq((real as { storeVersion?: number }).storeVersion, 8, '⭐ control — …with its contents intact');

  /**
   * ⚠️ **The valid-JSON member the e2e uses is kept, not replaced.** It is a real case — a file that parses
   * and is not a store — and dropping it would trade one uncovered member of the class for another.
   */
  eq(await readWith(JSON.stringify('this is not a store')), 'this is not a store', 'a JSON string still parses, and runMigrations refuses it downstream');

  console.log(`✅ storage adapters — ${passed} assertions passed\n`);
  return passed;
}
