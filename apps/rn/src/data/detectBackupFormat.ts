import { isBackupEnvelope } from './backup';

/**
 * 5.8.2 — what IS this file the user just handed us?
 *
 * ⛔ The asymmetry that sets every threshold below: a **false negative** (refusing a real backup) annoys
 * the user and their data survives — they can retry, or paste. A **false positive** (treating foreign JSON
 * as a backup) runs it through `importStore`, which REPLACES their portfolio, and nothing gets it back.
 * The two errors are not comparable, so this classifier refuses whenever it is unsure. That is the whole
 * inversion of the pre-5.8 behaviour, which accepted any JSON object at all (measured, 5.8 before-scan).
 *
 * ⭐ All three recognised formats are **self-identifying** — none of them is inferred from a field soup:
 *   - `envelope`   — 5.8.1's `format: 'debt-planner-backup'` marker.
 *   - `v16-file`   — v1.6's `buildBackupData()` stamps `version` + `exportedAt` on every file it has ever
 *                    written (`git log -S` on `origin/v1.6-dev`: present since the function existed, never
 *                    changed), so a real v1.6 backup announces itself.
 *   - `raw-v17`    — the pre-5.8 clipboard export: a bare `DebtStore`, carrying its own `storeVersion`.
 *                    ⚠️ This one is the weakest marker of the three, so it is also the most constrained:
 *                    it must ALSO have the two structural fields no partial blob would carry by accident.
 *
 * ⚠️ **Classification only — deliberately.** Routing (which reader runs, and the v1.6 adapter) lands with
 * 5.8.3, so there is never a shipped build in which a format is recognised but then mishandled. Detection
 * that runs ahead of its reader is how the 5.8.1 after-scan's total-loss round trip would have happened.
 */

export type BackupKind = 'envelope' | 'v16-file' | 'raw-v17' | 'unrecognised';

export interface BackupDetection {
  kind: BackupKind;
  /** Why it landed where it did — carried into 5.8.4's confirm step and into the refusal message. */
  detail: string;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * v1.6's own marker pair. ⚠️ BOTH are required. `version` alone is far too common a key to be evidence of
 * anything — a `package.json`, a lockfile and most config files carry one — and treating it as a v1.6
 * signal is exactly the guess this module exists to refuse.
 */
function looksLikeV16(o: Record<string, unknown>): boolean {
  if (typeof o.version !== 'number') return false;
  if (typeof o.exportedAt !== 'string') return false;
  // v1.7 nests everything the v1.6 file keeps flat. If either v1.7 structural field is present this is
  // not a v1.6 file, whatever else it carries — and saying so here keeps the two branches disjoint
  // rather than order-dependent.
  if ('storeVersion' in o || 'paycheck' in o) return false;
  // At least one field that is unmistakably v1.6's flat pay configuration. The marker pair says "a backup
  // from something"; this says "from THIS app".
  return typeof o.payCycle === 'string' || 'amount' in o || Array.isArray(o.requiredExpenses);
}

/**
 * The pre-5.8 clipboard export — a bare store, no wrapper. It has no marker of its own, so all three
 * structural fields are required together: `storeVersion` is a number, `paycheck` is an object and
 * `debts` is an array. A blob carrying all three is a `DebtStore` or something deliberately imitating one.
 */
function looksLikeRawV17(o: Record<string, unknown>): boolean {
  return typeof o.storeVersion === 'number' && isPlainObject(o.paycheck) && Array.isArray(o.debts);
}

export function detectBackupFormat(parsed: unknown): BackupDetection {
  if (!isPlainObject(parsed)) {
    return { kind: 'unrecognised', detail: 'not a JSON object' };
  }
  if (isBackupEnvelope(parsed)) {
    return { kind: 'envelope', detail: 'a Debt Planner backup file' };
  }
  if (looksLikeV16(parsed)) {
    return { kind: 'v16-file', detail: 'a backup from an older version of Debt Planner' };
  }
  if (looksLikeRawV17(parsed)) {
    return { kind: 'raw-v17', detail: 'an unwrapped Debt Planner backup' };
  }
  return { kind: 'unrecognised', detail: 'no recognised backup format' };
}

/** Convenience for the callers that hold text rather than a parsed value. Never throws. */
export function detectBackupText(raw: string): BackupDetection {
  try {
    return detectBackupFormat(JSON.parse(raw));
  } catch {
    return { kind: 'unrecognised', detail: 'not readable as JSON' };
  }
}
