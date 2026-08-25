/**
 * 5.8.6 [D31] — THE WHOLESALE-OVERWRITE GUARD.
 *
 * `importStore` replaces the user's ENTIRE portfolio in one call, and nothing undoes it. Until 5.8, one
 * of its call sites sat behind a parser that accepted any JSON object at all — an empty object, a
 * `package.json`, another app's export — and a single tap committed it. That shipped through a seven-lens
 * audit gate with 117 findings, because the surface had no test that imported anything.
 *
 * ⛔ **The lesson is not "check the importer". It is that a new caller of a wholesale overwrite can be
 * added without anyone noticing it is one.** The three current callers each earned their place for a
 * different reason; a fourth is not automatically wrong, but it must never arrive silently.
 *
 * So this is an ALLOW-LIST, not a bare count. A bare count tells you the number changed; an allow-list
 * tells you WHICH file appeared, which is the question a reviewer actually has. Adding a caller means
 * adding a line here with a reason — the same discipline `mapLegacyStore`'s `DROPPED` table uses, and for
 * the same reason: "we did not think about this" and "we decided this" look identical in the result, and
 * only one of them is a defect.
 *
 * ⛔ **[P6.8.9.7.11.12.12 · D-J2-3] AND FOR A MONTH THE UNIT OF SANCTION WAS THE FILE, SO A SECOND CALL IN
 * A SANCTIONED FILE ARRIVED SILENTLY.** The old check was `if (rel in ALLOWED) return;` — **before the call
 * was ever examined** — while every reason below describes **one specific call site**: *"the fresh-install
 * iCloud restore OFFER"*, *"behind an in-sheet two-tap confirm"*. Nothing bound the exemption to that site.
 * A second, unguarded `importStore(blob)` fifty lines away in the same file was admitted, and the staleness
 * check could not notice either — it only asked whether the file still contains *a* call.
 *
 * ⚡ The sibling gate in this same family already argues the discipline explicitly —
 * `check-native-a11y-props.ts`: *"Per-PROP rather than per-file deliberately: exempting a whole file to
 * permit one prop silently un-gates the other six in it."* `importStore` is the most destructive operation
 * in the app, and it was the one place the weaker rule was used.
 *
 * ⚠️ **So each entry now declares HOW MANY sites it sanctions, and the count is checked exactly.** A second
 * call cannot arrive without editing the line that holds the reason — which is the whole mechanism: not
 * that a new caller is forbidden, but that it cannot be added without someone writing down why.
 *
 * Usage: npm run lint:destructive   ·   runs inside `lint:rn` → `validate:release:rn`
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const ROOT = join(REPO_ROOT, 'apps', 'rn', 'src');

/**
 * Every sanctioned site of a wholesale store overwrite, with the reason it is allowed to be one **and how
 * many sites that reason covers.**
 *
 * ⚠️ `sites` is not bookkeeping — it is the binding between the reason and the code. Every reason below is
 * written about ONE call; declaring the number is what stops a second one inheriting it.
 * ⛔ **`store.ts` is 2 and neither is a call** — see `CALL`.
 */
const ALLOWED: Record<string, { sites: number; reason: string }> = {
  'apps/rn/src/store/store.ts': { sites: 2, reason: 'the definition itself — the interface member and the implementation, neither of them a call' },
  'apps/rn/src/store/persistence.ts': { sites: 1, reason: 'hydrate — the store is EMPTY at this point, so nothing is overwritten' },
  'apps/rn/src/components/more/BackupSheets.tsx': {
    sites: 1,
    reason: 'the backup restore — gated behind readBackup (refuses unrecognised input) AND a second deliberate tap (5.8.4)',
  },
  'apps/rn/src/app/_layout.tsx': {
    sites: 1,
    reason:
      "the fresh-install iCloud restore OFFER (P6.3.3.6) — same verified input (decodeCloudBackup → readBackup), and consent is the whole point of the dialog: it only ever runs for a store that has NOT onboarded, and only the explicit 'Restore' button calls this. Declining sets `declinedRestore`, which then suppresses auto-backup",
  },
  'apps/rn/src/components/DataResetScreen.tsx': {
    sites: 1,
    reason:
      'the corrupt-store recovery (P6.8.7c.2) — same verified input as the other two cloud callers (decodeCloudBackup → readBackup), and an explicit tap on the offered action. ⚡ It is also the weakest case this check can ever see: the store it overwrites is `createDefaultStore()`, because the wipe it exists to recover from has already happened, so there is nothing left to destroy',
  },
  'apps/rn/src/hooks/use-cloud-backup.ts': {
    sites: 1,
    reason:
      'the iCloud restore (P6.3.3.5) — the blob goes through decodeCloudBackup → readBackup, so it is VERIFIED and not merely parsed, and the caller is behind an in-sheet two-tap confirm naming what is lost. It also refuses a SANDBOX store outright',
  },
};

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p)) && !/\.test\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

/**
 * ⚠️ **A SITE, and "site" is looser than "call" — measured, 2026-08-25.** This pattern also matches the
 * interface member `importStore(store: DebtStore): void;` and the implementation `importStore(store) {`,
 * which is why `store.ts` declares **2**. The docstring here used to claim *"a CALL, not a mention"*; it
 * excludes mentions in prose, and nothing more. Left as it is deliberately — over-matching on the
 * definition file costs one number in the allow-list, while narrowing the pattern risks missing a real
 * call shape. **What it must never do is under-match.**
 */
/**
 * ⛔ **[P6.8.9.7.11.18 · S0.3 · M11] THE CALL-SHAPE PATTERN UNDER-MATCHED — FOUR WAYS, MEASURED.**
 * The docstring above already names the one thing this must never do, and it was doing it:
 *
 * | spelling | old pattern |
 * |---|---|
 * | `importStore(blob)` · `s.importStore(blob)` · `s?.importStore(blob)` · destructured | MATCH |
 * | **`s.importStore?.(blob)`** — the optional call | ❌ **MISS** |
 * | **`const fn = s.importStore; fn(blob)`** — aliased | ❌ **MISS** |
 * | **`s['importStore'](blob)`** — computed | ❌ **MISS** |
 * | **`s.importStore.call(s, blob)`** | ❌ **MISS** *(the audit named three; this is the fourth)* |
 *
 * ⚡ **Enumerating call SHAPES is the wrong game** — it is the same loop as the month gate's five
 * spellings and the bare-`announce` gate's `announceForAccessibility?.(…)`, and the enumeration has been
 * short every single time. So this matches the **IDENTIFIER**, and every way of reaching it comes free.
 *
 * ⚠️ **That is deliberately looser, and the file already accepts loose:** the docstring above explains
 * why the interface member and the implementation both count as "sites" and why over-matching costs only
 * a number in the allow-list. **A site is now "this file names the un-undoable operation" — which is the
 * question a reviewer actually wants answered.**
 */
const CALL = /(?<![\w$])importStore(?![\w$])/;

const offenders: { file: string; line: number; text: string }[] = [];
/** Sites found per file, whether or not the file is sanctioned. */
const found = new Map<string, number>();

for (const file of walk(ROOT)) {
  const rel = relative(REPO_ROOT, file).split(sep).join('/');
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((raw, i) => {
    // Strip line comments and doc-comment bodies — several files DISCUSS `importStore(demoStore())` in
    // prose explaining a defect that was fixed, and a guard that reds on its own postmortem is noise.
    // ⛔ **`\r` FIRST — the doc-comment strip below never worked on a CRLF file.** [S0.3] This repo has
    // mixed line endings; `split('\n')` leaves a trailing `\r`, and JS `.` does not match `\r` while `$`
    // (no `m` flag) does not sit before one — so `/^\s*\*.*$/` failed on EVERY CRLF file and every
    // doc-comment body sailed through unstripped. Latent since the gate was written: the old call-shape
    // pattern needed a `(`, and prose does not write `importStore(`. Widening the pattern is what exposed
    // it, on `sandboxStore.ts:16` — a comment explaining the very defect this gate guards.
    const line = raw.replace(/\r$/, '').replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '');
    if (!CALL.test(line)) return;
    found.set(rel, (found.get(rel) ?? 0) + 1);
    if (rel in ALLOWED) return;
    offenders.push({ file: rel, line: i + 1, text: raw.trim() });
  });
}

if (offenders.length > 0) {
  console.error(`\n❌ wholesale overwrite: ${offenders.length} unsanctioned call(s) to \`importStore\`.\n`);
  for (const o of offenders) console.error(`  ${o.file}:${o.line}\n    ${o.text}`);
  console.error(
    '\n  `importStore` replaces the ENTIRE store and cannot be undone. A new caller needs two things:\n' +
      '  input it has verified (not just parsed), and the user\'s deliberate consent to overwrite.\n' +
      '  If this one has both, add it to ALLOWED in scripts/check-destructive-writes.ts with the reason.\n',
  );
  process.exit(1);
}

/**
 * ⛔ **[P6.8.9.7.11.12.12 · D-J2-3] THE COUNT, AND IT SUBSUMES THE OLD STALENESS CHECK.** That one asked
 * whether a sanctioned file still contains *a* call — so it could not see a second one arriving, and it
 * could not see the first one leaving while a different one took its place. Comparing the exact number
 * answers both: 0 found is a stale entry, more than declared is an unreviewed new caller.
 */
const drift = Object.entries(ALLOWED)
  .map(([file, { sites }]) => ({ file, declared: sites, actual: found.get(file) ?? 0 }))
  .filter((d) => d.declared !== d.actual);

if (drift.length > 0) {
  console.error(`\n❌ wholesale overwrite: ${drift.length} ALLOWED entr(y/ies) no longer match the code.\n`);
  for (const d of drift) {
    console.error(`  ${d.file}\n    sanctioned: ${d.declared}   found: ${d.actual}`);
  }
  console.error(
    '\n  Each reason in ALLOWED is written about a SPECIFIC call site, so the number is the binding\n' +
      '  between the two. If a site was ADDED, it needs verified input and deliberate consent like the\n' +
      '  others — say so in the reason and raise the count. If one was REMOVED, lower it, and delete the\n' +
      '  entry at 0: a stale allow-list entry is a hole with a comment in front of it.\n',
  );
  process.exit(1);
}

const total = Object.values(ALLOWED).reduce((n, { sites }) => n + sites, 0);
console.log(`✅ wholesale overwrite: ${total}/${total} \`importStore\` sites sanctioned across ${Object.keys(ALLOWED).length} files, none unaccounted for.`);
