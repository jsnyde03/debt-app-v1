/**
 * Class 1 probe 8 — the spellings the class-1 RE-AUDIT found still open (`R11`, `R12`).
 *
 * Each row is a defect that was measured GREEN after round 1. All must red now, and the correct-code row
 * (R11's false positive) must stay green — a fix that reds on correct code is not a fix.
 *
 * Run: node docs/audits/2026-09-02-s1-money-pass7/class1-probes/p8-r11-r12-spellings.mjs
 */
import { copyFileSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../../../..');

const CASES = [
  {
    label: 'R11 false negative — hoisted initialiser',
    target: 'apps/rn/src/components/entities/DebtSheet.tsx',
    anchor: 'const seed = editing ?? prefill ?? null;',
    snippet:
      "\n  const __r11Hoisted = editing ? String(editing.apr) : '';\n  const [__r11a, __setR11a] = useState(__r11Hoisted);\n",
    want: 'RED',
  },
  {
    label: 'R11 false POSITIVE — correct code, comment inside a wrapped useState',
    target: 'apps/rn/src/components/entities/DebtSheet.tsx',
    anchor: 'const seed = editing ?? prefill ?? null;',
    snippet:
      "\n  const [__r11b, __setR11b] = useState(\n    // an editing debt reaches this through `seed`, never through the prop\n    seed?.apr != null ? String(seed.apr) : '',\n  );\n",
    want: 'GREEN',
  },
  {
    label: 'R12 — the refusal phrase, CONCATENATED',
    target: 'apps/rn/src/components/plan/RequiredActionsCard.tsx',
    anchor: null,
    snippet: "\nexport const __r12 = `... so this list is incomplete — set it again ` + `above.`;\n",
    want: 'RED',
  },
];

function runSuite() {
  try {
    execFileSync('npm', ['run', 'test:app'], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', shell: true });
    return 0;
  } catch (e) {
    return e.status ?? -1;
  }
}

console.log(`baseline exit=${runSuite()}  (must be 0, or nothing below is a measurement)`);

let wrong = 0;
for (const c of CASES) {
  const abs = join(ROOT, c.target);
  const backup = `${abs}.p8-backup`;
  const original = readFileSync(abs, 'utf8');
  copyFileSync(abs, backup);
  try {
    const planted = c.anchor ? original.replace(c.anchor, c.anchor + c.snippet) : original + c.snippet;
    writeFileSync(abs, planted, 'utf8');
    const applied = readFileSync(abs, 'utf8') !== original;
    const code = runSuite();
    const got = code === 0 ? 'GREEN' : 'RED';
    const ok = got === c.want;
    if (!ok) wrong++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.label}`);
    console.log(`       plant-applied=${applied ? 'YES' : 'NO'} · exit=${code} · got=${got} want=${c.want}`);
  } finally {
    copyFileSync(backup, abs);
    unlinkSync(backup);
  }
  if (readFileSync(abs, 'utf8') !== original) {
    console.error('RESTORE FAILED on', c.target);
    process.exit(1);
  }
}

console.log(`\nafter restore exit=${runSuite()}`);
console.log(wrong ? `${wrong} row(s) wrong` : 'all rows as intended');
process.exit(wrong ? 1 : 0);
