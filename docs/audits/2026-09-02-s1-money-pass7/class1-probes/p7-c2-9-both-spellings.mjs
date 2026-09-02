/**
 * Class 1 probe 7 — pass-7 `C2-9`: does the DebtSheet prefill guard see BOTH spellings of the defect?
 *
 * Plant A is the spelling it already caught (control). Plant B is the identical defect written the way the
 * sibling sheets write it — before the fix, 39 assertions passed over it.
 *
 * Run: node docs/audits/2026-09-02-s1-money-pass7/class1-probes/p7-c2-9-both-spellings.mjs
 */
import { copyFileSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../../../..');
const TARGET = 'apps/rn/src/components/entities/DebtSheet.tsx';
const abs = join(ROOT, TARGET);
const backup = `${abs}.c29-backup`;

const PLANTS = {
  'A · the spelling it already caught (control)':
    '\n  // eslint-disable-next-line\n  const __plantA = useState(editing?.apr);\n',
  'B · the SAME defect, sibling-sheet spelling':
    "\n  // eslint-disable-next-line\n  const __plantB = useState(editing ? String(editing.apr) : '');\n",
};

/** ⚠️ The spec needs the app runner's module aliases; standalone `tsx <spec>` fails on resolution. */
function runSuite() {
  try {
    const out = execFileSync('npm', ['run', 'test:app'], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', shell: true });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? -1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

const original = readFileSync(abs, 'utf8');
copyFileSync(abs, backup);

console.log(`baseline                                        exit=${runSuite().code}`);

try {
  for (const [label, snippet] of Object.entries(PLANTS)) {
    // Insert INSIDE the component body, after the seed line, so it is real code rather than trailing text.
    const anchor = 'const seed = editing ?? prefill ?? null;';
    const planted = original.replace(anchor, anchor + snippet);
    writeFileSync(abs, planted, 'utf8');
    const applied = readFileSync(abs, 'utf8') !== original;
    const r = runSuite();
    const named = /no useState in DebtSheet seeds from/.test(r.out);
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
console.log(`after restore                                   exit=${runSuite().code}`);
