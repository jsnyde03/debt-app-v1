import { createDefaultStore } from './defaults';
import { CURRENT_STORE_VERSION, type DebtStore } from './models';

/**
 * Bring a raw persisted blob up to `CURRENT_STORE_VERSION`. v1 = the initial RN consolidated shape;
 * v2 adds `driftBaseline` (additive — an older blob merges onto the current defaults → `null`, and
 * gets a baseline written on its next plan-establish/rollover);
 * v3/v4 (Projection auto-maintenance, 2.3) backfill each debt's projection dates. `lastVerifiedDate`
 * (last user confirmation) defaults to the app's current date — the upgrade treats the existing
 * balance as freshly verified, so projection starts at zero drift rather than an alarming jump.
 * `balanceAsOfDate` (the projection anchor) defaults to `lastVerifiedDate` (the balance is as-of when
 * it was last confirmed). Both are backfilled together so a v2 OR the interim-v3 blob lands correct.
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
  // v3/v4 backfill: a debt with no user-confirmation date is treated as confirmed "now"; the projection
  // anchor defaults to that same date (balance is as-of when it was last confirmed).
  const debts = (r.debts ?? base.debts).map((debt) => {
    const lastVerifiedDate = debt.lastVerifiedDate ?? paycheck.currentDate;
    const balanceAsOfDate = debt.balanceAsOfDate ?? lastVerifiedDate;
    return { ...debt, lastVerifiedDate, balanceAsOfDate };
  });
  return {
    ...base,
    ...r,
    storeVersion: CURRENT_STORE_VERSION,
    debts,
    paycheck,
    prefs: { ...base.prefs, ...(r.prefs ?? {}) },
  };
}
