/**
 * [S1.10.6.5.8.4 · GAP-13] — **EVERY TRACKED SOURCE FILE IS EITHER FINGERPRINTED OR EXCUSED BY NAME.**
 *
 * ⛔ **THE HOLE:** `gateSources.ts` decides what [D49]'s freshness check fingerprints, and it decides it
 * with `ROOTS` — **an inclusion list of directories**. Removing a root does not red anything standing: the
 * fingerprint changes, `lint:gate-freshness` reds **once**, and the very next `gate:record` writes the new
 * fingerprint and it is green forever after, over a tree whose gate inputs nobody is watching any more.
 *
 * ⚡ **`gateSources.ts`'s own header argues for exactly this check and then does not perform it:** *"SCOPE
 * IS AN EXCLUSION LIST, NOT AN INCLUSION LIST — [W1-4]. An inclusion list fails silent: a gate input nobody
 * thought to enumerate is simply absent, and the freshness check then reports a green that no longer
 * describes the tree."* That doctrine is applied **inside** the roots, by `skipDir`. It is not applied to
 * the roots themselves, which are an inclusion list of exactly the kind the paragraph condemns.
 *
 * ⛔ **GAP-13 PROPOSED A `fileCount >= 789` FLOOR AND THAT IS THE WEAKER HALF.** An aggregate floor is
 * one number over 812 files: it cannot say WHICH root vanished, it carries slack the moment the repo grows
 * (789 against a live 812 is 23 files of it), and — the direction that matters — **it cannot see a NEW tree
 * arriving outside `ROOTS` at all**, because adding unfingerprinted files makes no count go down. GAP-13's
 * own better alternative was *"every directory any registered gate walks is inside ROOTS"*; this is that
 * invariant, stated over files rather than over a static read of each gate's source.
 *
 * ⚠️ **Both directions red, and a stale exemption reds too** — the `MAX_EXEMPT` shape this repo already
 * uses. An entry here that matches nothing tracked is a hole with a comment in front of it.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT, sourceFiles } from './gateSources';

/** The extensions `gateSources` treats as source. Kept in sync by the assertion at the bottom. */
const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.yml', '.yaml']);

/**
 * ⛔ **THE ONLY SANCTIONED WAY FOR A TRACKED SOURCE FILE NOT TO BE FINGERPRINTED.** Each prefix carries
 * the reason it does not change what `validate:release:rn` decides. ⚠️ A file that is genuinely a gate
 * input does NOT belong here — it belongs in `ROOTS`.
 */
const EXCUSED: { prefix: string; why: string }[] = [
  {
    prefix: 'docs/',
    why: "[D49]'s one accepted residue, stated in gateSources.ts's header: lint:closure reads the plan and the log, so a docs-only commit genuinely can change a gate's verdict — but those files are edited many times per session and fingerprinting them would leave freshness permanently red, which is the failure this repo has already lived through once.",
  },
  {
    prefix: 'gate-status.json',
    why: 'The record the freshness check writes. Fingerprinting the output of the run would make every recorded pass invalidate itself.',
  },
  {
    prefix: 'ios/App/App/Assets.xcassets/',
    why: 'Xcode asset-catalog manifests in the LEGACY Capacitor shell. No gate reads them; the RN app builds from apps/rn. P6.11 deletes this tree.',
  },
  {
    prefix: 'capacitor.config.ts',
    why: 'The legacy Capacitor root surface, retired with validate:release:legacy. P6.11 deletes it.',
  },
  {
    prefix: 'next.config.ts',
    why: 'The legacy Next root surface. P6.11 deletes it.',
  },
  {
    prefix: 'postcss.config.mjs',
    why: 'The legacy Next root surface. P6.11 deletes it.',
  },
  {
    prefix: 'playwright.config.ts',
    why: "The LEGACY root e2e config. ⚠️ Checked rather than assumed: validate:release:rn runs apps/rn/playwright.config.ts, which is inside the apps/rn root and IS fingerprinted.",
  },
  {
    prefix: 'playwright.history.config.ts',
    why: 'The legacy root history-suite config. Same tree, same deletion.',
  },
  {
    prefix: 'codemagic.yaml',
    why: "The CM BUILD config. It decides how a binary is produced, not what any gate on validate:release:rn decides — lint:lane parses .github/workflows and .github/actions, and lint:ci-chain reads the workflow chain; neither reads this.",
  },
];

const tracked = execSync('git ls-files', { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 128e6 })
  .split('\n')
  .filter(Boolean)
  .filter((f) => SOURCE_EXT.has(f.slice(f.lastIndexOf('.'))));

const fingerprinted = new Set(sourceFiles());
const problems: string[] = [];

// ── Direction 1: a tracked source file that is neither fingerprinted nor excused ────────────────────
// Catches BOTH a root being removed and a new tree arriving outside ROOTS.
const orphans = tracked.filter(
  (f) => !fingerprinted.has(f) && !EXCUSED.some((e) => f === e.prefix || f.startsWith(e.prefix)),
);
if (orphans.length > 0) {
  problems.push(
    `${orphans.length} tracked source file(s) are in NO gateSources root and carry no exemption:\n` +
      orphans.slice(0, 25).map((f) => `      ${f}`).join('\n') +
      (orphans.length > 25 ? `\n      … and ${orphans.length - 25} more` : '') +
      '\n      Either add the directory to ROOTS in scripts/gateSources.ts (if a gate reads it) or add an\n' +
      '      EXCUSED entry here saying why it cannot change what validate:release:rn decides.',
  );
}

// ── Direction 2: a stale exemption ─────────────────────────────────────────────────────────────────
// Self-ratcheting. An entry matching nothing tracked outlived its subject and must go.
for (const e of EXCUSED) {
  const matches = tracked.filter((f) => f === e.prefix || f.startsWith(e.prefix));
  if (matches.length === 0) {
    problems.push(
      `EXCUSED entry "${e.prefix}" matches no tracked source file — it outlived its subject, delete it.`,
    );
  } else if (matches.every((f) => fingerprinted.has(f))) {
    problems.push(
      `EXCUSED entry "${e.prefix}" is redundant — every file it names is fingerprinted anyway. Delete it,\n` +
        '      or the exemption will silently cover a future file that genuinely needs review.',
    );
  }
}

// ── Direction 3: the scripts compiler's REACH ─────────────────────────────────────────────────────
/**
 * ⛔ **S1.11.3.3 [pass-3 `G-6`'s naive over-fix] — `npm run typecheck` CAN ALSO BE MADE GREEN BY
 * NARROWING WHAT IT COMPILES.**
 *
 * ⚡ `G-6` was 18 × `TS2307` from a gate importing app source into a program with no aliases. The fix was
 * the aliases. **The over-fix is an `exclude`** — drop the offending gate out of the program and the
 * errors go with it, buying the green by leaving that gate's own imports unchecked. That is the hole
 * `[P6.8.7a-1]` closed when it found `scripts/**` had no compiler behind it at all.
 *
 * ⛔ **A typecheck-based plant structurally CANNOT catch this**, because the over-fix makes typecheck
 * PASS — measured by auditor D: `paths` deleted **plus** an `exclude` for the importing gate →
 * `tsc` **exit 0, 0 errors**, with both registered tokens present and `lint:finding-guards` green.
 * `S1P3-G6-SCRIPTSTYPES` pins the aliases; this is the surface they apply to.
 *
 * ⚠️ **Asserted on the literal text, deliberately.** This config is JSONC — it opens with a 16-line
 * comment — so parsing it needs a stripper, and a stripper is exactly the layer whose silent failure
 * `GAP-8` and `GAP-9` are about. The two lines are stable and any edit to them is a deliberate act.
 */
const SCRIPTS_REACH = '"include": ["**/*.ts"],\n  "exclude": ["node_modules"]\n}';
const scriptsTsconfig = readFileSync(join(REPO_ROOT, 'scripts/tsconfig.json'), 'utf8').replace(/\r\n/g, '\n');
if (!scriptsTsconfig.includes(SCRIPTS_REACH)) {
  problems.push(
    'scripts/tsconfig.json no longer ends with the exact reach it is recorded as having:\n' +
      `      ${JSON.stringify(SCRIPTS_REACH)}\n` +
      '      Narrowing `include`, or excluding anything beyond node_modules, drops scripts out of the\n' +
      '      program — which is how `npm run typecheck` goes green by compiling less rather than by\n' +
      '      being right. If the change is deliberate, say so here and re-measure the reach.',
  );
}

// ── Direction 4: the POINTER to that config ───────────────────────────────────────────────────────
/**
 * ⛔ **S1.11.4.6 [pass-4 `D4-10`, and the residual its own measurement did not name] — THE CONFIG'S TEXT
 * IS GUARDED AND THE POINTER TO IT IS NOT.**
 *
 * ⚡ `D4-10` said `S1P3-G6-SCRIPTSREACH` was guard-only because *"a tsconfig's reach is `include` minus
 * `exclude`, and the token pins one of the two terms"*. ⭐ **Re-measured at switch-in, and that half is
 * already CLOSED** — direction 3 above asserts the pair, and re-running the finding's own over-fix (the
 * aliases dropped plus `"exclude": ["node_modules", "check-trust-claims.ts"]`) reds it. The report was
 * written before `S1.11.2` built direction 3.
 *
 * ⛔ **What is still open is one level up, and it is the same class.** Measured: repoint
 * `typecheck:scripts` at any other config and **`lint:gate-sources` and `lint:ci-chain` both stay green**
 * — the guarded file simply stops being the one compiled, and every assertion about it goes vacuous.
 * Narrowing the reach by changing what gets compiled is the defect; narrowing it by changing WHICH THING
 * gets compiled is the same defect through a door nothing was reading.
 */
const TYPECHECK_SCRIPTS = '"typecheck:scripts": "tsc --noEmit -p scripts/tsconfig.json"';
const rootPackage = readFileSync(join(REPO_ROOT, 'package.json'), 'utf8');
if (!rootPackage.includes(TYPECHECK_SCRIPTS)) {
  problems.push(
    'package.json no longer runs the scripts typecheck against the config this gate guards:\n' +
      `      ${JSON.stringify(TYPECHECK_SCRIPTS)}\n` +
      "      Direction 3 above pins that config's reach; pointing the script somewhere else leaves the\n" +
      '      pinned file uncompiled and every assertion about it vacuous. Same narrowing, one level up.',
  );
}

if (problems.length > 0) {
  console.error(`\n❌ gate sources: ${problems.length} problem(s).\n`);
  for (const p of problems) console.error(`  • ${p}\n`);
  console.error(
    '  [D49]: freshness is only as honest as the set it fingerprints. A gate input outside ROOTS makes\n' +
      '  a recorded green describe a tree it no longer covers.\n',
  );
  process.exit(1);
}

console.log(
  `✅ gate sources: ${fingerprinted.size} of ${tracked.length} tracked source files fingerprinted; ` +
    `the other ${tracked.length - fingerprinted.size} excused by ${EXCUSED.length} named entries, none stale.`,
);
