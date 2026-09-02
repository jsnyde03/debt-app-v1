/**
 * ⛔ **EVERY WRAP-SENSITIVE GATE IS PLANTED WITH THE *WRAPPED* SPELLING OF ITS OWN DEFECT.**
 * [S1.13.7.12.6 class 1 · pass-7 `D1-11`]
 *
 * `D1-11` is the finding that explains the other six: **every registered proof and every
 * `test:gate-plants` scenario certifying these gates planted the ONE spelling the gate already caught.**
 * A gate and its proof share an author, so they share a blind spot — six gates were certified green while
 * a Prettier line-wrap walked past all of them.
 *
 * ⛔ **THE POPULATION IS DERIVED, NOT TYPED.** The wrap-sensitive set is *every `scripts/check-*.ts` that
 * imports `./lib/logicalLines`*. A gate joins this harness by importing the helper — and if it imports the
 * helper with **no recipe here, this file FAILS**. That is the difference between a class fix and six
 * edits: a list would be prose again, and prose is what let the class recur six times.
 *
 * ⚠️ **Each plant is the WRAPPED spelling only.** The same-line spelling is already covered by
 * `test:gate-plants`; planting it again here would re-measure the half that was never broken.
 *
 * Usage: npm run test:wrap-escapes
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const SCRIPTS = join(REPO_ROOT, 'scripts');

interface Recipe {
  /** the file the plant is written into, repo-relative */
  target: string;
  /** appended to the target — the defect, WRAPPED the way Prettier would wrap it */
  plant: string;
  /** the gate must red, and its output must name this */
  reason: RegExp;
}

/**
 * gate script → how to plant the wrapped spelling of the defect it exists to catch.
 *
 * ⚠️ A recipe appends to a real tracked file and is removed again. Every restore is verified
 * byte-identical before the run continues — `git checkout --` is not used, because it throws away an
 * uncommitted fix along with the plant.
 */
const RECIPES: Record<string, Recipe> = {
  'check-amount-collapse.ts': {
    target: 'packages/core/utils/percentComplete.ts',
    plant: '\nexport const __wrapEscape = (raw: string) =>\n  parseAmountField(\n    raw,\n  ) ?? 0;\n',
    reason: /collapses a parsed amount to 0/,
  },
  'check-rounding.ts': {
    target: 'packages/core/utils/percentComplete.ts',
    plant: '\nexport const __wrapEscape2 = (x: number) =>\n  Math.round(\n    x * 100,\n  ) / 100;\n',
    reason: /inline money-rounding expressions/,
  },
  'check-sandbox-writes.ts': {
    target: 'apps/rn/src/utils/a11y.ts',
    plant: "\nimport {\n  appStore,\n} from '../store/appStore';\nexport const __wrapEscape3 = appStore;\n",
    reason: /appStore|singleton|sanctioned/i,
  },
};

const wrapSensitive = readdirSync(SCRIPTS)
  .filter((f) => /^check-.*\.ts$/.test(f))
  .filter((f) => /from '\.\/lib\/logicalLines'/.test(readFileSync(join(SCRIPTS, f), 'utf8')));

const problems: string[] = [];

/** ⛔ A gate that declares itself wrap-sensitive and has no recipe makes this harness vacuous for it. */
for (const gate of wrapSensitive) {
  if (!(gate in RECIPES)) {
    problems.push(
      `${gate} imports lib/logicalLines and has NO plant recipe in scripts/test-wrap-escapes.ts.\n` +
        '        A wrap-sensitive gate certified by nothing is exactly the D1-11 shape this file exists to\n' +
        '        close. Add a recipe that plants the WRAPPED spelling of the defect it catches.',
    );
  }
}
for (const gate of Object.keys(RECIPES)) {
  if (!wrapSensitive.includes(gate)) {
    problems.push(
      `${gate} has a recipe here but no longer imports lib/logicalLines.\n` +
        '        A recipe covering nothing is slack — delete it, or restore the gate\'s logical-line scan.',
    );
  }
}

function runGate(gate: string): { code: number; out: string } {
  try {
    /**
     * ⚠️ **`shell: true` is required and its absence looked exactly like a finding.** On Windows `npx` is
     * a `.cmd`; without a shell the nested spawn fails, the gate never runs, and this harness scored all
     * three gates `RED-FOR-THE-WRONG-REASON` — *"it redded, but not for your defect"* — about runs in which
     * nothing redded at all. That is the same harness-fault-wearing-a-finding's-face shape `[D78]` was
     * written for, and `test-gate-plants.ts` already carried the answer.
     */
    const out = execFileSync('npx', ['tsx', `scripts/${gate}`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      shell: true,
    });
    return { code: 0, out };
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? -1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

const results: string[] = [];
for (const gate of wrapSensitive) {
  const recipe = RECIPES[gate];
  if (!recipe) continue;
  const abs = join(REPO_ROOT, recipe.target);
  const backup = `${abs}.wrapescape-backup`;
  const original = readFileSync(abs, 'utf8');
  copyFileSync(abs, backup);

  let verdict = 'UNKNOWN';
  try {
    writeFileSync(abs, original + recipe.plant, 'utf8');
    const applied = readFileSync(abs, 'utf8') !== original;
    const r = runGate(gate);
    const named = recipe.reason.test(r.out);
    if (!applied) verdict = 'PLANT-NOT-APPLIED';
    else if (r.code === 0) verdict = 'FAILED-OPEN';
    else if (!named) verdict = 'RED-FOR-THE-WRONG-REASON';
    else verdict = 'MATCHED';
  } finally {
    copyFileSync(backup, abs);
    unlinkSync(backup);
  }

  const restored = readFileSync(abs, 'utf8') === original;
  if (!restored) {
    console.error(`\n❌ ${gate}: RESTORE FAILED on ${recipe.target}. Repair by hand before continuing.\n`);
    process.exit(1);
  }
  results.push(`  ${verdict === 'MATCHED' ? '✅' : '❌'} ${gate.padEnd(28)} wrapped-plant=${verdict} · restored=YES`);
  if (verdict !== 'MATCHED') {
    problems.push(
      `${gate} did not red for the WRAPPED spelling of its defect (${verdict}).\n` +
        `        Planted into ${recipe.target}. This is the D1-3/D1-6/D1-8 escape: the gate catches the\n` +
        '        same-line spelling and a formatter defeats it.',
    );
  }
}

for (const line of results) console.log(line);

if (problems.length) {
  console.error(`\n❌ wrap-escapes: ${problems.length} problem(s).\n`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error('');
  process.exit(1);
}

console.log(
  `\n✅ wrap-escapes: ${wrapSensitive.length} wrap-sensitive gate(s), each red on the WRAPPED spelling of its own defect.`,
);
