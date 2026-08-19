import { withBackfilledOriginalBalance } from './originalBalance';
import { LEGACY_KEY_PREFIX } from './webkitLocalStorage';
import type { DebtStore, ThemeMode } from '@/data/models';

/**
 * 5.2 — the v1.6 → v1.7 key mapping.
 *
 * v1.6 stored ~28 loose `debtPlanner.*` localStorage keys; v1.7 stores ONE JSON blob. This turns the
 * former into the latter, and it is a pure function so every branch is provable without a device.
 *
 * ⭐ **It builds a `Partial<DebtStore>` and stops.** The defaults, the v3/v4 date backfill and the v6
 * BNPL normalisation all live in `runMigrations`, which already runs on every hydrate — so the bridge
 * hands its partial to that and inherits them. Re-implementing those here would be a second copy of the
 * same rules, which is the drift class T8 spent a day on. Measured at 5.2's before-scan: **across all six
 * persisted types, v1.6 has ZERO fields v1.7 dropped**, so nothing needs translating field-by-field —
 * the arrays pass through and `runMigrations` fills the three new `Debt` fields.
 *
 * ⛔ **NOTHING IS SILENTLY DISCARDED.** Every key is accounted for in the report as mapped, deliberately
 * dropped (with a reason), unknown, or unparseable. An unknown key is the dangerous one: it means v1.6
 * persisted something this mapper has never heard of, and the only safe response is to say so. A bridge
 * that quietly ignores a key it does not recognise loses data in exactly the way nobody notices.
 */

/** v1.6 wrote a theme as a string, OR as a bare boolean before `ThemePreference` existed, OR not at all. */
function mapThemeMode(value: unknown): ThemeMode | undefined {
  if (value === 'system' || value === 'light' || value === 'dark') return value;
  // ⚠️ The pre-`ThemePreference` shape, still sitting in the oldest installs — the users most likely to
  // have carried data forward. A mapper that only handles the string form silently mis-themes them.
  if (value === true) return 'dark';
  if (value === false) return 'light';
  return undefined;
}

export interface LegacyMapReport {
  /** Keys consumed into the store. */
  mapped: string[];
  /** Keys deliberately not carried, each with the reason — a drop must be a decision, not an omission. */
  dropped: { key: string; why: string }[];
  /** ⛔ Keys this mapper does not recognise. Non-empty means v1.6 persisted something unaccounted for. */
  unknown: string[];
  /** Keys whose value would not parse. Reported, never defaulted. */
  unparseable: string[];
  /** `debtPlanner.__corrupt__.*` — v1.6's quarantine, carried forward rather than destroyed. */
  quarantined: string[];
  /** The legacy `schemaVersion` (absent reads as 0), which decides the `originalBalance` backfill. */
  legacySchemaVersion: number;
  /** How many debts needed `originalBalance` filled in — >0 means the blob predated v1.5's migration. */
  originalBalanceBackfilled: number;
}

/**
 * What the mapper emits: a `DebtStore` shape where `paycheck` and `prefs` may be INCOMPLETE.
 *
 * ⚠️ Not `Partial<DebtStore>` — that types those two as all-or-nothing, and the bridge genuinely produces
 * partial ones (v1.6 has no `incomeVaries`, no `tutorialSeen`, no `coachMarksSeen`). `runMigrations`
 * merges them onto the current defaults — `{ ...base.paycheck, ...r.paycheck }` — so a partial is exactly
 * what it expects. Saying so in the type stops the next reader from "fixing" it with a cast.
 */
export interface LegacyPartialStore extends Omit<Partial<DebtStore>, 'paycheck' | 'prefs'> {
  paycheck?: Partial<DebtStore['paycheck']>;
  prefs?: Partial<DebtStore['prefs']>;
}

export interface LegacyMapResult {
  partial: LegacyPartialStore;
  /** The v1.6 quarantine, verbatim, for the bridge to re-quarantine on the RN side. */
  quarantine: Record<string, string>;
  report: LegacyMapReport;
}

/** Straight `debtPlanner.<key>` → top-level `DebtStore` field, no transform beyond JSON.parse. */
const DIRECT: Record<string, keyof DebtStore> = {
  debts: 'debts',
  requiredExpenses: 'requiredExpenses',
  livingExpenses: 'livingExpenses',
  goals: 'goals',
  cycleHistory: 'cycleHistory',
  completedRecommendedActions: 'completedRecommendedActions',
  payoffStrategy: 'payoffStrategy',
  milestoneMaxProgress: 'milestoneMaxProgress',
  lastHandledPaydayDate: 'lastHandledPaydayDate',
  lastSavedAt: 'lastSavedAt',
};

/** `debtPlanner.<key>` → a field on `paycheck`. */
const PAYCHECK: Record<string, string> = {
  amount: 'amount',
  payCycle: 'payCycle',
  currentDate: 'currentDate',
  nextPaycheckDate: 'nextPaycheckDate',
  semiMonthlyFirstDay: 'semiMonthlyFirstDay',
  semiMonthlySecondDay: 'semiMonthlySecondDay',
  monthlyPayDay: 'monthlyPayDay',
};

/** `debtPlanner.<key>` → a field on `prefs`. */
const PREFS: Record<string, string> = {
  hasCompletedOnboarding: 'onboardingComplete',
  notificationsEnabled: 'notificationsEnabled',
  appLockEnabled: 'appLockEnabled',
};

/**
 * Keys v1.6 persisted that v1.7 deliberately does not carry. ⛔ Each needs a REASON, because "we did not
 * map it" and "we decided not to map it" look identical in the resulting store and only one of them is
 * a defect.
 */
const DROPPED: Record<string, string> = {
  isDemoMode: 'inert — nothing reads it (5.6 drops the field entirely)',
  mockSubscription: 'a v1.6 QA hook; real entitlement comes from RevenueCat',
  schemaVersion: 'consumed — it decides the originalBalance backfill, it is not stored',
  // ⚠️ NOT nothing: v1.6 wrote a full pre-reset snapshot here so "undo my reset" was possible. v1.7 has
  // no equivalent surface, so carrying it would store data nothing can ever show. Reported rather than
  // dropped in silence — if it is non-empty for real users, that is a product question, not a mapping one.
  resetSnapshot: 'v1.6 reset-undo buffer; v1.7 has no surface that could restore it',
  rolloverCount: 'a v1.6 review-prompt counter; v1.7 tracks review prompting separately',
  reviewRequested: 'superseded by `reviewPrompted` on the RN store, set by v1.7 on its own terms',
  // ⚡ FOUND IN THE CAPTURED CONTAINER, NOT IN THE SOURCE SWEEP. `lib/testing/simSmokeSeed.ts` writes it;
  // the shipping v1.6 app only ever derives a local const of the same name. So it is a FIXTURE artifact —
  // no real user has it — and it is dropped rather than left `unknown` so the capture fixture does not
  // raise a false alarm on every run. ⚠️ The corollary matters more: the fixture's key set is the
  // SEEDER's, not a user's, and is missing `isDemoMode`, `resetSnapshot`, `rolloverCount`,
  // `reviewRequested`, `lastHandledPaydayDate` and any `__corrupt__` bytes. It proves LOCATION and SHAPE,
  // not coverage. → 5.10 builds the adversarial corpus by hand.
  hasConfiguredPaycheck: 'written only by v1.6’s SIM_SMOKE seeder, never by the shipping app',
};

export function mapLegacyStore(items: Record<string, string>): LegacyMapResult {
  const report: LegacyMapReport = {
    mapped: [],
    dropped: [],
    unknown: [],
    unparseable: [],
    quarantined: [],
    legacySchemaVersion: 0,
    originalBalanceBackfilled: 0,
  };
  const partial: LegacyPartialStore = {};
  const paycheck: Record<string, unknown> = {};
  const prefs: Record<string, unknown> = {};
  const quarantine: Record<string, string> = {};

  const parse = (key: string, raw: string): { ok: true; value: unknown } | { ok: false } => {
    try {
      return { ok: true, value: JSON.parse(raw) };
    } catch {
      report.unparseable.push(key);
      return { ok: false };
    }
  };

  for (const [fullKey, raw] of Object.entries(items)) {
    if (!fullKey.startsWith(LEGACY_KEY_PREFIX)) continue;
    const key = fullKey.slice(LEGACY_KEY_PREFIX.length);

    // ⛔ `debtPlanner.rnStore*` is v1.7's OWN web-adapter key, sharing the v1.6 namespace. It is not
    // legacy data and must never be mapped or counted (5.2 before-scan).
    if (key === 'rnStore' || key.startsWith('rnStore.')) continue;

    // v1.6's quarantine: `__corrupt__.<key>.<ISO>`. For anyone who ever hit corruption these bytes are
    // the ONLY surviving copy of that data, so they are carried, not dropped (5.1a's after-scan).
    if (key.startsWith('__corrupt__')) {
      quarantine[fullKey] = raw;
      report.quarantined.push(fullKey);
      continue;
    }

    if (key in DROPPED) {
      report.dropped.push({ key: fullKey, why: DROPPED[key] });
      if (key === 'schemaVersion') {
        const parsed = parse(fullKey, raw);
        if (parsed.ok && typeof parsed.value === 'number') report.legacySchemaVersion = parsed.value;
      }
      continue;
    }

    if (key === 'darkMode') {
      const parsed = parse(fullKey, raw);
      if (!parsed.ok) continue;
      const mode = mapThemeMode(parsed.value);
      if (mode) {
        prefs.themeMode = mode;
        report.mapped.push(fullKey);
      } else {
        // `null` is a real stored value meaning "no preference" — not a failure, and not a theme.
        report.dropped.push({ key: fullKey, why: 'no theme preference stored (null) — defaults apply' });
      }
      continue;
    }

    const parsed = parse(fullKey, raw);
    if (!parsed.ok) continue;

    if (key in DIRECT) {
      (partial as Record<string, unknown>)[DIRECT[key]] = parsed.value;
      report.mapped.push(fullKey);
    } else if (key in PAYCHECK) {
      paycheck[PAYCHECK[key]] = parsed.value;
      report.mapped.push(fullKey);
    } else if (key in PREFS) {
      prefs[PREFS[key]] = parsed.value;
      report.mapped.push(fullKey);
    } else {
      // ⛔ The one that matters. v1.6 persisted something this mapper has never heard of.
      report.unknown.push(fullKey);
    }
  }

  // ⚠️ v1.5's migration backfilled `originalBalance` on debts that predate the field, and it ran INSIDE
  // v1.6 at startup — so a blob whose owner launched v1.6 is already at schemaVersion 2. Applied here
  // unconditionally anyway: a debt with no positive `originalBalance` is excluded from milestone
  // tracking and (historically) from the debt-free check, and the cost of re-running a no-op backfill is
  // nothing next to the cost of trusting a version stamp we did not write.
  if (Array.isArray(partial.debts)) {
    const before = partial.debts;
    const after = withBackfilledOriginalBalance(before);
    report.originalBalanceBackfilled = after.filter((debt, i) => debt !== before[i]).length;
    partial.debts = after;
  }

  if (Object.keys(paycheck).length > 0) partial.paycheck = paycheck as Partial<DebtStore['paycheck']>;
  if (Object.keys(prefs).length > 0) partial.prefs = prefs as Partial<DebtStore['prefs']>;

  return { partial, quarantine, report };
}
