/**
 * S1.13.5 — **THE LANES' READ-LISTS BECOME THE COVERAGE CLAIM, MECHANICALLY.**
 *
 * ⛔ **THE HOLE THIS FILLS WAS FOUND AT PASS 6'S SWITCH-IN, IN THE DISPATCH RECORD ITSELF.**
 * `DISPATCH.md` states the contract as *"every lane emits `READ-<lane>.txt` incrementally"* and the exit
 * as `audit:read-coverage` at 446/446. ⚡ **`check-pass-coverage.ts` never opens a `READ-*` file.** Its
 * population and its per-file claims both come from `scripts/surface-coverage.<surface>.json`, and
 * `surface-coverage.ts` only ever tells you to *"Edit"* that by hand.
 *
 * So the dispatch as recorded ended in **twelve lane files hand-merged into a 484-entry JSON** — the
 * enumeration class this project has come in short on for eight consecutive items, performed once, by
 * hand, on the artifact that decides whether the pass may be called converged.
 *
 * ⚠️ **This does NOT make the claim less explicit, which is the half [D69] rests on.** The lane still
 * asserts what it read, in its own file, as it reads. What stops being hand-work is only the *merge* —
 * enumeration, which is mechanical, exactly as `audit-route.ts`'s header argues for the route.
 *
 * ## The two refusals, and why a silent success is the danger here
 *
 * ⛔ **A run that records NOTHING must not exit 0.** If the lane files are missing, empty, or named
 * something else, the merge is a no-op and the pass looks recorded. That is this surface's defining
 * shape — *a check that passes because it found nothing to check* — and it is the one
 * `check-pass-coverage.ts`'s own `MIN_MONEY_BEARING` floor exists to stop, one instrument upstream.
 *
 * ⛔ **A path that is not tracked is a REFUSAL, never a skip.** A lane naming a file that does not exist
 * has either typed it or invented it, and both make its whole list suspect. `check-pass-coverage.ts`
 * refuses on ghosts for the same reason; catching it here names the lane that produced it.
 *
 * ⚠️ **A tracked path that is not on the surface is REPORTED and NOT RECORDED.** Lanes are routed 620
 * files and only 446 of them are the S1 exit's population — S0 instruments, off-surface config and the
 * legacy root are legitimately read and cannot be claimed on this surface's sheet.
 *
 * ⚠️ **[D5-10]: the inventory stamps a HASH OF THIS FILE.** Writing claims without regenerating the
 * inventory leaves `audit-route.ts` refusing to read it as STALE — correct behaviour, and a confusing
 * place to arrive. The required command is printed on every run that writes.
 *
 * Usage:
 *   npx tsx scripts/record-reads.ts --surface=s1 --pass=s1p6 --dir=docs/audits/<dir>
 *   npx tsx scripts/record-reads.ts --surface=s1 --pass=s1p6 --dir=<dir> --dry-run
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const CLAIMS: Record<string, string> = {
  s0: 'scripts/surface-coverage.s0.json',
  s1: 'scripts/surface-coverage.s1.json',
};

function die(msg: string): never {
  console.error(`\n❌ record-reads: ${msg}\n`);
  process.exit(1);
}

const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');

const surface = (arg('surface') ?? 's1').toLowerCase();
const pass = arg('pass');
const dir = arg('dir');
const dryRun = process.argv.includes('--dry-run');

if (!pass) die('--pass=<id> is required — it is the claim being written, e.g. s1p6.');
if (!dir) die('--dir=<path> is required — the audit directory holding the READ-*.txt lane files.');
const claimsRel = CLAIMS[surface];
if (!claimsRel) die(`unknown surface "${surface}". Known: ${Object.keys(CLAIMS).join(', ')}.`);

const absDir = join(REPO_ROOT, dir);
if (!existsSync(absDir)) die(`${dir} does not exist.`);

const laneFiles = readdirSync(absDir)
  .filter((f) => /^READ-.+\.txt$/.test(f))
  .sort();

/**
 * ⛔ The first refusal. Zero lane files is indistinguishable from twelve empty ones, and both are
 * indistinguishable from a successful merge if this exits 0.
 */
if (laneFiles.length === 0) {
  die(
    `no READ-*.txt lane files in ${dir}.\n` +
      '  ⛔ Recording nothing and exiting 0 would read exactly like a recorded pass. If the lanes have not\n' +
      '  written yet, that is the answer — not an empty merge.',
  );
}

const tracked = new Set(
  execFileSync('git', ['ls-files'], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean),
);

const claims: Record<string, string[]> = JSON.parse(readFileSync(join(REPO_ROOT, claimsRel), 'utf8'));

const byLane = new Map<string, string[]>();
const ghosts: string[] = [];
const offSurface = new Map<string, string>();
const seen = new Set<string>();

for (const lf of laneFiles) {
  const lane = lf.replace(/^READ-|\.txt$/g, '');
  const paths = readFileSync(join(absDir, lf), 'utf8')
    .split('\n')
    .map((s) => s.trim().replace(/\\/g, '/'))
    .filter((s) => s && !s.startsWith('#'));
  byLane.set(lane, paths);
  for (const p of paths) {
    if (!tracked.has(p)) {
      ghosts.push(`${p}   (READ-${lane}.txt)`);
      continue;
    }
    if (!(p in claims)) {
      offSurface.set(p, lane);
      continue;
    }
    seen.add(p);
  }
}

/**
 * ⛔ The second refusal — and it names the lane, which is the whole reason to catch it here rather than
 * downstream in `check-pass-coverage.ts`'s ghost check.
 */
if (ghosts.length > 0) {
  die(
    `${ghosts.length} path(s) in the read-lists are not tracked by git:\n  ${ghosts.join('\n  ')}\n\n` +
      '  ⛔ A lane naming a file that does not exist has typed it or invented it, and either makes the\n' +
      '  rest of that list suspect. Fix the list; do not skip the line.',
  );
}

/**
 * ⛔ The first refusal's other half: files were listed, and none of them landed on this surface.
 */
if (seen.size === 0) {
  die(
    `${laneFiles.length} lane file(s) read, and NOT ONE path is on the ${surface.toUpperCase()} surface.\n` +
      '  ⛔ Writing an unchanged claims file and exiting 0 would read as a recorded pass.',
  );
}

let added = 0;
let already = 0;
for (const f of seen) {
  const list = claims[f] ?? [];
  if (list.includes(pass)) {
    already += 1;
    continue;
  }
  claims[f] = [...list, pass].sort();
  added += 1;
}

const moneyTotal = Object.keys(claims).length;
console.log(`\n📖 record-reads [${surface} · ${pass}] — ${laneFiles.length} lane file(s): ${[...byLane.keys()].join(' ')}`);
for (const [lane, paths] of byLane) console.log(`   READ-${lane}.txt: ${paths.length} path(s)`);
console.log(`\n   on-surface paths: ${seen.size} of ${moneyTotal} claims entries · newly stamped ${added} · already carried ${pass} ${already}`);

if (offSurface.size > 0) {
  console.log(`\n   ⚠️ ${offSurface.size} tracked path(s) read but NOT on the ${surface.toUpperCase()} surface — read, not recorded:`);
  for (const [p, lane] of offSurface) console.log(`      ${p}   (READ-${lane}.txt)`);
  console.log('      These are routed (S0 instruments, off-surface config, the legacy root) and carry no claim here.');
}

if (dryRun) {
  console.log(`\n   --dry-run: ${claimsRel} was NOT written.\n`);
  process.exit(0);
}

// ⛔ D5-6 — this file is committed LF. `JSON.stringify` emits LF and nothing here re-encodes, so the
// write is byte-stable on Windows; a CRLF round-trip here would dirty the tree on every run.
writeFileSync(join(REPO_ROOT, claimsRel), `${JSON.stringify(claims, Object.keys(claims).sort(), 2)}\n`, 'utf8');

console.log(
  `\n✅ ${claimsRel} updated — ${added} file(s) now carry ${pass}.\n\n` +
    `   ⛔ [D5-10] NEXT, AND NOT OPTIONAL: \`npm run lint:${surface}-coverage\`\n` +
    `   The inventory stamps a hash of this file. Until it is regenerated, \`audit-route.ts\` refuses to\n` +
    `   read it as STALE — which is correct, and a confusing place to arrive without being told.\n\n` +
    `   Then the exit: \`npm run audit:read-coverage -- --surface=${surface} --pass=${pass}\`\n`,
);
