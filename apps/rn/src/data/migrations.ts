import { normalizeBnplInstallment } from '@core/debt/bnplInstallment';
import { createDefaultStore } from './defaults';
import { CURRENT_STORE_VERSION, type DataRepair, type DebtStore } from './models';

/**
 * Bring a raw persisted blob up to `CURRENT_STORE_VERSION`. v1 = the initial RN consolidated shape;
 * v2 adds `driftBaseline` (additive — an older blob merges onto the current defaults → `null`, and
 * gets a baseline written on its next plan-establish/rollover);
 * v3/v4 (Projection auto-maintenance, 2.3) backfill each debt's projection dates. `lastVerifiedDate`
 * (last user confirmation) defaults to the app's current date — the upgrade treats the existing
 * balance as freshly verified, so projection starts at zero drift rather than an alarming jump.
 * `balanceAsOfDate` (the projection anchor) defaults to `lastVerifiedDate` (the balance is as-of when
 * it was last confirmed). Both are backfilled together so a v2 OR the interim-v3 blob lands correct.
 * v5 (Payday Cushion Guardian substrate, 2.4.D) is purely ADDITIVE — the new store-level fields
 * (`inputsAsOf`, `genuineCycleCount`, the logs, the current-cycle carriers, `missedArrivals`) and the
 * new `PaycheckConfig` income fields (`incomeVaries`/`leanAmount`/`typicalAmount`) merge onto the
 * current defaults below (top-level via `...base`, paycheck via the explicit paycheck merge), so an
 * older blob backfills to safe values (fixed income, zero genuine cycles, empty logs) with no bespoke
 * step. `inputsAsOf` lands at the current date → an upgrade reads as freshly-entered, not stale.
 * v6 (BNPL installment-native model, 2.7.2) reconciles each installment-native BNPL — one with both
 * a `scheduledPaymentAmount` and a `remainingPayments` — so `balance` = scheduled × remaining and
 * `minimumPayment` = scheduled. Before v6 those two fields were captured but read back nowhere, so a
 * BNPL whose entered minimum differed from its real installment projected the wrong payoff; the
 * upgrade snaps the derived fields to the installment truth the user actually entered. A BNPL missing
 * either field is left untouched (the balance+minimum fallback path).
 * A raw that isn't a plain object throws → the caller quarantines it (never writes corrupt data
 * back). Older/partial shapes are merged onto the current defaults so a missing field never bricks
 * hydration. (The Capacitor per-key `debtPlanner.*` → this blob mapping is the Phase-D data bridge,
 * not here.)
 */
/**
 * 5.10 — money that cannot be read is REPAIRED and REPORTED, never trusted and never silently dropped.
 *
 * ⛔ Measured: v1.6's onboarding guards new debts with `Number(balance) <= 0`, and **`NaN <= 0` is false**,
 * so `Number("12,000")` — a comma, on the first debt a user ever types — passes and persists. `JSON`
 * writes `NaN` as `null`, so real v1.6 stores in the wild hold `balance: null` today. v1.6's *edit* path
 * documents fixing exactly this and the fix never reached onboarding.
 *
 * ⚠️ The value lands at 0 but the debt is KEPT and the repair is RECORDED. The three options were: coerce
 * silently (a $12,000 debt renders as PAID OFF — wrong and invisible, the worst of the three), drop the
 * row (destroys a record the user recognises by name), or repair-and-surface. Only the last one lets the
 * person find out, and finding out is one tap from being correct.
 */
function readMoney(value: unknown): { value: number; repaired: boolean } {
  if (typeof value === 'number' && Number.isFinite(value)) return { value, repaired: false };
  // A numeric string is recoverable and common — v1.6's own inputs were HTML fields. Commas are stripped
  // for the same reason its `parseDebtFormValues` tolerates them: "12,000" is a real thing users type.
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    if (Number.isFinite(parsed)) return { value: parsed, repaired: true };
  }
  return { value: 0, repaired: true };
}


function repairMoneyFields<T extends Record<string, unknown>>(
  rows: unknown,
  fallback: T[],
  fields: readonly string[],
  entity: DataRepair['entity'],
  repairs: DataRepair[],
): T[] {
  // ⛔ A non-array here used to THROW out of `runMigrations` — which the import door caught and the
  // WebKit bridge did not, so one corrupt v1.6 key silently skipped a whole migration (5.10, finding 1).
  // Being total is what makes both doors behave the same.
  if (!Array.isArray(rows)) {
    // ⛔ RECORDED, not silently swapped. The first cut of this returned `fallback` bare, and
    // `persistenceLifecycle`'s malformed-nested case caught it: a corrupt `debts` key became an empty
    // list with nothing to show for it — the precise silent drop this whole item exists to remove, added
    // by the fix for it. `rows === undefined` is the ordinary "key absent" case and is not a loss.
    if (rows !== undefined) repairs.push({ entity, id: '', name: '', field: '(whole list unreadable)' });
    return fallback;
  }
  return rows.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row as T;
    const next = { ...(row as Record<string, unknown>) };
    for (const field of fields) {
      if (next[field] === undefined) continue;
      const { value, repaired } = readMoney(next[field]);
      next[field] = value;
      if (repaired) {
        repairs.push({
          entity,
          id: typeof next.id === 'string' ? next.id : '',
          name: typeof next.name === 'string' ? next.name : '',
          field,
        });
      }
    }
    return next as T;
  });
}

/**
 * ⛔ A store carrying a WORKING plan has been onboarded — found on a real device (🎯 2026-08-19).
 *
 * v1.6's `buildBackupData()` never emitted `hasCompletedOnboarding`, so a genuine v1.6 backup FILE cannot
 * carry it. The import therefore landed `onboardingComplete: false`, and `_layout.tsx`'s route guard
 * (`Stack.Protected guard={!onboardingComplete}`) sent the user to onboarding **with the whole restored
 * portfolio imported but invisible behind the gate.** It reads as "the import did nothing" — the worst way
 * a successful restore can present.
 *
 * ⚠️ It lives HERE, at the single choke point every door passes through, rather than in the import path.
 * The first cut put it in `readBackup` and the differential oracle immediately caught it: the two doors
 * onto the same data started disagreeing. Fixing it at the root is what makes them agree by construction —
 * the same lesson as the non-array `debts` throw earlier in 5.10.
 *
 * ⛔ **Income AND an obligation, not either.** A looser "has any debt" signal wrongly skipped onboarding
 * for a user mid-setup who had entered one debt and no income — they cannot be shown a plan, so they must
 * finish onboarding. An explicit `true` is always honoured; this only ever promotes, never demotes.
 */
function inferOnboarding(
  r: Partial<DebtStore>,
  incomingPrefs: Record<string, unknown>,
  paycheck: DebtStore['paycheck'],
): boolean {
  if (incomingPrefs.onboardingComplete === true) return true;
  const hasIncome = typeof paycheck.amount === 'string' && paycheck.amount.trim() !== '';
  const hasObligation =
    (Array.isArray(r.debts) && r.debts.length > 0) ||
    (Array.isArray(r.requiredExpenses) && r.requiredExpenses.length > 0);
  return hasIncome && hasObligation;
}

export function runMigrations(raw: unknown): DebtStore {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('runMigrations: persisted store is not an object');
  }
  const base = createDefaultStore();
  const r = raw as Partial<DebtStore>;
  const repairs: DataRepair[] = [];
  const paycheck = { ...base.paycheck, ...(r.paycheck ?? {}) };
  // `paycheck.amount` is deliberately a STRING on both sides — it mirrors the input model and is parsed at
  // the engine boundary — so it is normalised to a string rather than to a number.
  if (paycheck.amount !== undefined && typeof paycheck.amount !== 'string') {
    paycheck.amount = paycheck.amount === null || typeof paycheck.amount === 'object' ? '' : String(paycheck.amount);
  }
  // v3/v4 backfill: a debt with no user-confirmation date is treated as confirmed "now"; the projection
  // anchor defaults to that same date (balance is as-of when it was last confirmed).
  const debts = repairMoneyFields(
    r.debts,
    base.debts,
    ['balance', 'minimumPayment', 'apr', 'originalBalance', 'scheduledPaymentAmount'],
    'debt',
    repairs,
  ).map((debt) => {
    const lastVerifiedDate = debt.lastVerifiedDate ?? paycheck.currentDate;
    const balanceAsOfDate = debt.balanceAsOfDate ?? lastVerifiedDate;
    // v6: reconcile an installment-native BNPL's balance+minimum to its scheduled × remaining truth.
    // ⚠️ Runs AFTER the money repair, deliberately: it multiplies `scheduledPaymentAmount × remaining`,
    // and multiplying an unrepaired `null` would produce a plausible-looking 0 balance from arithmetic
    // rather than from a value anyone can point at.
    return normalizeBnplInstallment({ ...debt, lastVerifiedDate, balanceAsOfDate });
  });
  const requiredExpenses = repairMoneyFields(r.requiredExpenses, base.requiredExpenses, ['amount'], 'requiredExpense', repairs);
  const livingExpenses = repairMoneyFields(r.livingExpenses, base.livingExpenses, ['amount'], 'livingExpense', repairs);
  // v7 (5.6) — DROP two inert prefs. Both were measured at zero production reads, and the merge below
  // would otherwise carry them forward forever: `{ ...base.prefs, ...r.prefs }` preserves any extra key
  // an older blob happens to hold, so deleting them from the TYPE alone would leave them in the data.
  // ⚠️ Deleted from a copy — mutating `r.prefs` would edit the caller's object, and one caller is the
  // JSON-restore path where that object is the user's file.
  const { isDemoMode: _isDemoMode, guardianIntroSeen: _guardianIntroSeen, ...incomingPrefs } = (r.prefs ??
    {}) as Record<string, unknown>;

  return {
    ...base,
    ...r,
    storeVersion: CURRENT_STORE_VERSION,
    debts,
    requiredExpenses,
    livingExpenses,
    paycheck,
    prefs: { ...base.prefs, ...incomingPrefs, onboardingComplete: inferOnboarding(r, incomingPrefs, paycheck) },
    // ⚠️ REPLACED, not merged with whatever the blob carried. This describes what THIS read had to
    // repair; carrying a previous run's list forward would keep re-reporting a field the user has since
    // fixed, and a notice that will not go away is one people learn to dismiss.
    dataRepairs: repairs,
    // ⛔ MERGED, which is the exact opposite rule to the line above, on purpose. `dataRepairs` answers
    // "what did this read fix"; this answers "what has the user not been told yet", and the second
    // question outlives the read that raised it — the list above is empty again as soon as anything
    // saves. Only an acknowledgement empties this one.
    //
    // ⚠️ Deduped by entity+id+field so a blob re-migrated before the user acknowledges cannot stack the
    // same repair twice. That is also what keeps a second pass identical to the first, which the
    // `idempotent` invariant compares on every field except `dataRepairs`.
    pendingDataRepairs: mergeRepairs(Array.isArray(r.pendingDataRepairs) ? r.pendingDataRepairs : [], repairs),
  };
}

/** Union of already-pending repairs and this read's, keyed by the field a repair actually identifies. */
function mergeRepairs(pending: DataRepair[], fresh: DataRepair[]): DataRepair[] {
  const out: DataRepair[] = [];
  const seen = new Set<string>();
  for (const rep of [...pending, ...fresh]) {
    if (!rep || typeof rep !== 'object') continue;
    const key = `${rep.entity}|${rep.id}|${rep.field}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(rep);
  }
  return out;
}
