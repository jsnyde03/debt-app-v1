/**
 * Durable-storage contract the store persists through. Two implementations: `createStorageAdapter`
 * (platform-split — localStorage on web, in-memory now / MMKV at B.9 on native) and the
 * `MemoryStorageAdapter` used by tests. Keeping the store dependent only on this interface means
 * the native module never enters the web bundle and persistence is unit-testable.
 */

export interface StorageAdapter {
  /** The persisted store blob, or `null` if nothing's stored (first launch). */
  read(): Promise<unknown | null>;
  /** Overwrite the persisted blob. */
  write(store: unknown): Promise<void>;
  /** Set aside a copy of a corrupt/unmigratable blob (never lose the user's bytes) before overwriting. */
  quarantine?(raw: string, reason: string): Promise<void>;
  /** Remove any quarantined blob (called from "reset all data"). */
  clearQuarantine?(): Promise<void>;
}

/** Encrypted-store-locked signal (device momentarily can't decrypt): retry, never reinitialize. */
export class StorageLockedError extends Error {
  constructor(message = 'Storage is locked') {
    super(message);
    this.name = 'StorageLockedError';
  }
}

/** In-memory adapter for tests + the native default until MMKV lands at B.9. */
export class MemoryStorageAdapter implements StorageAdapter {
  private data: unknown | null = null;
  async read() {
    return this.data;
  }
  async write(store: unknown) {
    this.data = store;
  }
  async quarantine() {}
  async clearQuarantine() {}
}
