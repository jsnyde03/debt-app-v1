import { createDefaultStore } from './defaults';
import { CURRENT_STORE_VERSION, type DebtStore } from './models';

/**
 * Bring a raw persisted blob up to `CURRENT_STORE_VERSION`. v1 is the initial RN consolidated shape.
 * A raw that isn't a plain object throws → the caller quarantines it (never writes corrupt data
 * back). Older/partial shapes are merged onto the current defaults so a missing field never bricks
 * hydration. (The Capacitor per-key `debtPlanner.*` → this blob mapping is the Phase-D data bridge,
 * not here.)
 */
export function runMigrations(raw: unknown): DebtStore {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('runMigrations: persisted store is not an object');
  }
  const base = createDefaultStore();
  const r = raw as Partial<DebtStore>;
  return {
    ...base,
    ...r,
    storeVersion: CURRENT_STORE_VERSION,
    paycheck: { ...base.paycheck, ...(r.paycheck ?? {}) },
    prefs: { ...base.prefs, ...(r.prefs ?? {}) },
  };
}
