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
 * So this is an ALLOW-LIST, not a count. A count tells you the number changed; an allow-list tells you
 * WHICH file appeared, which is the question a reviewer actually has. Adding a caller means adding a line
 * here with a reason — the same discipline `mapLegacyStore`'s `DROPPED` table uses, and for the same
 * reason: "we did not think about this" and "we decided this" look identical in the result, and only one
 * of them is a defect.
 *
 * Usage: npm run lint:destructive   ·   runs inside `lint:rn` → `validate:release:rn`
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const ROOT = join(REPO_ROOT, 'apps', 'rn', 'src');

/** Every sanctioned caller of a wholesale store overwrite, with the reason it is allowed to be one. */
const ALLOWED: Record<string, string> = {
  'apps/rn/src/store/store.ts': 'the definition itself',
  'apps/rn/src/store/persistence.ts': 'hydrate — the store is EMPTY at this point, so nothing is overwritten',
  'apps/rn/src/components/more/BackupSheets.tsx':
    'the backup restore — gated behind readBackup (refuses unrecognised input) AND a second deliberate tap (5.8.4)',
  'apps/rn/src/app/_layout.tsx':
    "the fresh-install iCloud restore OFFER (P6.3.3.6) — same verified input (decodeCloudBackup → readBackup), and consent is the whole point of the dialog: it only ever runs for a store that has NOT onboarded, and only the explicit 'Restore' button calls this. Declining sets `declinedRestore`, which then suppresses auto-backup",
  'apps/rn/src/components/DataResetScreen.tsx':
    'the corrupt-store recovery (P6.8.7c.2) — same verified input as the other two cloud callers (decodeCloudBackup → readBackup), and an explicit tap on the offered action. ⚡ It is also the weakest case this check can ever see: the store it overwrites is `createDefaultStore()`, because the wipe it exists to recover from has already happened, so there is nothing left to destroy',
  'apps/rn/src/hooks/use-cloud-backup.ts':
    'the iCloud restore (P6.3.3.5) — the blob goes through decodeCloudBackup → readBackup, so it is VERIFIED and not merely parsed, and the caller is behind an in-sheet two-tap confirm naming what is lost. It also refuses a SANDBOX store outright',
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

/** A CALL, not a mention — `importStore(` with a preceding `.` or a declaration. Comments are stripped. */
const CALL = /(?<![\w.])importStore\s*\(|\.\s*importStore\s*\(/;

const offenders: { file: string; line: number; text: string }[] = [];

for (const file of walk(ROOT)) {
  const rel = relative(REPO_ROOT, file).split(sep).join('/');
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((raw, i) => {
    // Strip line comments and doc-comment bodies — several files DISCUSS `importStore(demoStore())` in
    // prose explaining a defect that was fixed, and a guard that reds on its own postmortem is noise.
    const line = raw.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '');
    if (!CALL.test(line)) return;
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

// ⚠️ Also fail when a sanctioned entry stops existing. An allow-list that outlives its subject quietly
// stops guarding anything, and reads as coverage while providing none.
const stale = Object.keys(ALLOWED).filter((f) => {
  try {
    return !CALL.test(readFileSync(join(REPO_ROOT, f), 'utf8'));
  } catch {
    return true;
  }
});
if (stale.length > 0) {
  console.error(`\n❌ wholesale overwrite: ${stale.length} ALLOWED entr(y/ies) no longer call \`importStore\`:\n`);
  for (const f of stale) console.error(`  ${f}`);
  console.error('\n  Remove it — a stale allow-list entry is a hole with a comment in front of it.\n');
  process.exit(1);
}

console.log(
  `✅ wholesale overwrite: ${Object.keys(ALLOWED).length}/${Object.keys(ALLOWED).length} \`importStore\` callers sanctioned, none unaccounted for.`,
);
