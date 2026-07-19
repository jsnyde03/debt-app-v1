import { MemoryStorageAdapter, type StorageAdapter } from './adapter';

/**
 * Native storage adapter. **B.9 native re-glue** replaces this with an MMKV-backed (encrypted)
 * adapter. Until then it's in-memory — native data does not persist across launches yet, which is
 * fine because B.1–B.8 verify on web (localStorage-backed, see `createAdapter.web.ts`).
 */
export function createStorageAdapter(): StorageAdapter {
  return new MemoryStorageAdapter();
}
