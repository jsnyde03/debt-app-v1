import { createDefaultStore } from './defaults';
import { CURRENT_STORE_VERSION, type DebtStore } from './models';

/**
 * Bring a raw persisted blob up to `CURRENT_STORE_VERSION`. v1 = the initial RN consolidated shape;
 * v2 adds `driftBaseline` (additive — an older blob merges onto the current defaults → `null`, and
 * gets a baseline written on its next plan-establish/rollover);
 * v3 (Projection auto-maintenance, 2.3) backfills each debt's `lastVerifiedDate` — the trust anchor.
 * A pre-v3 debt has no verified date, so we stamp it at the app's current date: the upgrade treats the
 * existing balance as freshly verified, so projection starts at zero drift rather than an alarming jump.
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
  const paycheck = { ...base.paycheck, ...(r.paycheck ?? {}) };
  // v3 backfill: a debt with no `lastVerifiedDate` is treated as verified as of "now".
  const debts = (r.debts ?? base.debts).map((debt) =>
    debt.lastVerifiedDate ? debt : { ...debt, lastVerifiedDate: paycheck.currentDate }
  );
  return {
    ...base,
    ...r,
    storeVersion: CURRENT_STORE_VERSION,
    debts,
    paycheck,
    prefs: { ...base.prefs, ...(r.prefs ?? {}) },
  };
}
