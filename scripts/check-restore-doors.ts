/**
 * ⛔ **THE RESTORE DOORS — DERIVED, NEVER TYPED.** [S1.11.4.3 · pass-4 `C4-11`]
 *
 * ⚡ **The finding is not "two doors are undisclosed". It is that the ledger said TWO and there are
 * FOUR.** `S1P3-C7B-CLOUDDOOR`'s registry text reads *"both doors compose from one owner
 * (`describeRestorePreview`) so they cannot drift"*, written over a hand-counted pair. A repo-wide count
 * of production calls that write a backup into the live store returned four, and the two nobody had
 * counted were the two with no disclosure at all — including the launch-time offer, which fires over a
 * store the user has already typed a paycheck and a debt into and replaces it on one tap.
 *
 * ⛔ **SO THE POPULATION IS COMPUTED FROM THE CODE.** A gate that carries a LIST of the doors it audits
 * is blind to the door omitted from the list, which is the failure it exists to catch — the same
 * inversion `lint:surface-complete` had to make after the roots were wrong five times. The population
 * here is *every production call to `importStore(`*, and each one must either compose its disclosure from
 * a shared owner or be recorded in `NOT_A_DOOR` **with a measured reason**.
 *
 * ⚠️ **What this can and cannot prove, stated exactly.** It proves a call site COMPOSES from an owner; it
 * cannot prove the sentence reaches the user's eyes. `readBackup.test.ts` owns what the owners SAY —
 * including `describeLocalOverwrite`, the half neither of them had. ⛔ **And the RENDER of doors 3 and 4
 * is unreachable to automation**: door 3 is an OS `Alert`, and door 4 renders only when
 * `restoreFromCloud` succeeds, which on web is the unavailable stub by construction — the same hole
 * `CloudBackupSheet`'s own docblock records for its `ready` branch, where *"the computed diagnosis is
 * dropped at the last layer"* once survived thirteen lenses. **Saying so is the point.** `C4-11` slipped
 * past a registry entry that asserted the WORDING and never the COUNT; an instrument that overstates its
 * reach is how the next one slips past this.
 *
 * ⚠️ **ONE WORLD: the file list comes from `git ls-files`, the content from the working tree.** A door
 * added in a still-untracked file is invisible here and reds in CI on the commit that adds it — chosen
 * deliberately over `existsSync`, which is the split that made `lint:surface-complete` pass locally and
 * red in CI (`REVERIFY4-2`'s shape). Reading the working tree is what lets a fix be verified before it
 * is committed.
 *
 * Usage: tsx scripts/check-restore-doors.ts
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { assertScanFloor, scanNote, scanned } from './lib/scanFloor';
import { stripCommentsOnly } from './lib/stripCode';

/** GAP-8 — this gate's key in scripts/gate-scan-floors.json. */
const SCAN_GATE = 'restore-doors';

const REPO_ROOT = join(import.meta.dirname, '..');

/** The act being audited: a backup replacing the live store. */
const IMPORT_CALL = /\bimportStore\s*\(/;

/**
 * The disclosure owners. ⛔ Named rather than pattern-matched on "describe": a door that rolls its own
 * sentence is exactly the drift `C-7b`'s one-owner remedy exists to prevent, and it must not pass by
 * being *called* something similar.
 */
const OWNERS = /\b(describeBackup|describeRestorePreview)\s*\(/;

/**
 * ⛔ **AN `importStore` CALL SITE THAT IS NOT A DOOR, AND THE REASON IS PART OF THE ENTRY.** Silence here
 * is what turned a four-door surface into a two-door claim, so an exemption has to be written down and
 * survives only as long as its reason does.
 */
const NOT_A_DOOR: Record<string, string> = {
  'apps/rn/src/store/store.ts':
    'the action ITSELF — this is where `importStore` is declared and implemented, not a place that calls it',
  'apps/rn/src/store/persistence.ts':
    'the v1.6 legacy bridge at bootstrap. Traced, not assumed: it offers no choice and overwrites nothing ' +
    '(it runs only when there is no RN store to carry into), and it does disclose — `describeMigrationLosses` ' +
    'writes what was genuinely lost into `pendingDataRepairs`, which the data-repairs card surfaces. It is a ' +
    'migration, not a door.',
};

/**
 * ⛔ **THE WRITE AND THE SENTENCE CAN LIVE IN DIFFERENT MODULES, AND THE GATE FOUND THAT BY FLAGGING A
 * DOOR THAT IS ALREADY CORRECT.** `use-cloud-backup`'s `restoreNow` performs the import; the preview is
 * composed one module up, in the sheet that calls it. ⚠️ **Not solved with an exemption.** An exemption
 * says *"this one does not need a sentence"*; what is true is *"its sentence is over there"*, and the
 * difference is whether deleting the sentence reds. Each pair NAMES its discloser, and that file is
 * required to compose an owner — so the entry expires the moment either half moves.
 */
const PAIRED: Record<string, { discloser: string; why: string }> = {
  'apps/rn/src/hooks/use-cloud-backup.ts': {
    discloser: 'apps/rn/src/components/more/CloudBackupSheet.tsx',
    why: 'the hook owns the WRITE (`restoreNow`); the sheet that calls it owns the confirm and composes `describeRestorePreview` into it',
  },
};

/**
 * ⛔ **A LITERAL, DOWNWARD-ONLY.** `check-trust-claims` shipped two caps computed from the lists they
 * capped, so both "ratchets" were `n > n`. This one is typed, and it goes UP only when a door is genuinely
 * added — it exists so that deleting a door's disclosure by deleting the door's audit entry cannot pass.
 */
const MIN_DOORS = 4;

const files = execFileSync('git', ['ls-files', 'apps/rn/src'], { cwd: REPO_ROOT, encoding: 'utf8' })
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean)
  .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f));

const doors: string[] = [];
const undisclosed: string[] = [];
const seenExempt = new Set<string>();
const seenPaired = new Set<string>();
const failuresEarly: string[] = [];

for (const rel of files) {
  const src = scanned(SCAN_GATE, stripCommentsOnly(readFileSync(join(REPO_ROOT, rel), 'utf8')));
  if (!IMPORT_CALL.test(src)) continue;
  const key = rel.replace(/\\/g, '/');
  if (NOT_A_DOOR[key]) {
    seenExempt.add(key);
    continue;
  }
  doors.push(key);
  const pair = PAIRED[key];
  if (!pair) {
    if (!OWNERS.test(src)) undisclosed.push(key);
    continue;
  }
  seenPaired.add(key);
  // ⛔ The named discloser is read from disk rather than trusted: a pair whose other half has stopped
  // composing the sentence is exactly the drift this entry claims cannot happen.
  let disclosureSrc = '';
  try {
    disclosureSrc = stripCommentsOnly(readFileSync(join(REPO_ROOT, pair.discloser), 'utf8'));
  } catch {
    failuresEarly.push(`[pair] ${key} names ${pair.discloser} as its discloser and that file does not exist.`);
    continue;
  }
  if (!OWNERS.test(disclosureSrc)) {
    failuresEarly.push(
      `[pair] ${key} performs the import and names ${pair.discloser} as the half that discloses — ` +
        'and that file no longer composes `describeRestorePreview` / `describeBackup`. The sentence has ' +
        'been deleted from the only place this door said it lived.',
    );
  }
}

const failures: string[] = [...failuresEarly];

if (undisclosed.length > 0) {
  for (const d of undisclosed) {
    failures.push(
      `[door] ${d} writes a backup into the live store and never composes a disclosure. ` +
        'Call `describeRestorePreview(store)` (or `describeBackup(result)`) into what the user is shown ' +
        'BEFORE the replace — that is what pass-4 C4-11 found missing at two of the four doors.',
    );
  }
}

// ⛔ The count, in BOTH directions. A door removed is as interesting as one added: `C4-11` exists because
// a two-door claim outlived the arrival of doors three and four, and a shrinking count with the floor
// left high is how the opposite mistake would hide.
if (doors.length < MIN_DOORS) {
  failures.push(
    `[count] ${doors.length} restore door(s) found and MIN_DOORS is ${MIN_DOORS}. A door was removed, or ` +
      'this gate has gone blind to one. Lower MIN_DOORS in the same edit that removed the door.',
  );
}

// ⛔ An exemption whose file is gone is a standing permission nobody re-read. Same expiry rule
// `S1P2-SKIP-EXPIRY` applies to the surface skip list.
for (const key of Object.keys(NOT_A_DOOR)) {
  if (!seenExempt.has(key)) {
    failures.push(
      `[exempt] NOT_A_DOOR names ${key}, which no longer calls \`importStore\`. Remove the entry — an ` +
        'exemption outliving its reason is a permission nobody granted.',
    );
  }
}
for (const key of Object.keys(PAIRED)) {
  if (!seenPaired.has(key)) {
    failures.push(
      `[pair] PAIRED names ${key}, which no longer calls \`importStore\`. Remove the entry — a pairing ` +
        'that outlives its writer is a claim about a door that is gone.',
    );
  }
}

if (failures.length > 0) {
  console.error(`\n❌ restore doors: ${failures.length} problem(s).\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('\n  The rule: never replace a plan without saying what is coming in — and, where there');
  console.error('  is something underneath, what is going out.\n');
  process.exit(1);
}

const observedScan = assertScanFloor(SCAN_GATE);
console.log(
  `✅ restore doors: ${doors.length} door(s), every one composing its disclosure from a shared owner ` +
    `(floor ${MIN_DOORS}) · ${Object.keys(PAIRED).length} disclosing through a named pair · ` +
    `${Object.keys(NOT_A_DOOR).length} not doors, each with a reason.` +
    scanNote(SCAN_GATE, observedScan),
);
console.log(`   ${doors.join('\n   ')}`);
