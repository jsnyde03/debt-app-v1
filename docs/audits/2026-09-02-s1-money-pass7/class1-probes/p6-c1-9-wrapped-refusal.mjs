/**
 * Class 1 probe 6 — pass-7 `C1-9`: does the "no refusal points at a sibling card" guard see the phrase
 * when it WRAPS a line?
 *
 * Plant 1 is the control (phrase on one line) — it must red, proving the checker sees the subject.
 * Plant 2 is the same defect wrapped — before the fix it passed 30 green assertions.
 *
 * Run: node docs/audits/2026-09-02-s1-money-pass7/class1-probes/p6-c1-9-wrapped-refusal.mjs
 */
import { copyFileSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../../../..');
const TARGET = 'apps/rn/src/components/plan/RequiredActionsCard.tsx';
// ⚠️ The spec cannot run standalone — it needs the app runner's module aliases, so `npx tsx <spec>`
// fails on resolution and would make every plant look like a red. The whole suite is the valid harness.
const SPEC = 'apps/rn/src/components/plan/unreadInputsCopy.test.ts';
const abs = join(ROOT, TARGET);
const backup = `${abs}.c19-backup`;

const PLANTS = {
  '1 · control — phrase on ONE line':
    "\nexport const __c19control = `... so this list is incomplete — set it again above.`;\n",
  '2 · the SAME defect, WRAPPED across a line':
    "\nexport const __c19wrapped = `... so this list is incomplete — set it again\n      above.`;\n",
};

function runSpec() {
  try {
    const out = execFileSync('npm', ['run', 'test:app'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      shell: true,
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? -1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

const original = readFileSync(abs, 'utf8');
copyFileSync(abs, backup);

const base = runSpec();
console.log(`baseline                                   exit=${base.code}`);

try {
  for (const [label, snippet] of Object.entries(PLANTS)) {
    writeFileSync(abs, original + snippet, 'utf8');
    const applied = readFileSync(abs, 'utf8') !== original;
    const r = runSpec();
    const named = /no refusal points|above/i.test(r.out);
    console.log(`plant ${label}`);
    console.log(`  plant-applied=${applied ? 'YES' : 'NO'} · exit=${r.code} · reason-named=${named ? 'YES' : 'NO'}`);
    copyFileSync(backup, abs);
    if (readFileSync(abs, 'utf8') !== original) throw new Error('RESTORE FAILED');
  }
} finally {
  copyFileSync(backup, abs);
  unlinkSync(backup);
}

console.log(`restored byte-identical=${readFileSync(abs, 'utf8') === original ? 'YES' : 'NO'}`);
const after = runSpec();
console.log(`after restore                              exit=${after.code}`);
