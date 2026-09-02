/**
 * Class 1 probe 2 — plant BOTH spellings of the defect against `lint:amount-collapse`.
 *
 * ⛔ The point of the class: plant A (same line) is what the gate already caught; plant B (Prettier-wrapped)
 * is the escape `D1-3` reported. A fix is only proven when B reds **for the named reason** and A still does.
 *
 * Run: node docs/audits/2026-09-02-s1-money-pass7/class1-probes/p2-plant-both-spellings.mjs
 */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../../../..');
const TARGET = 'packages/core/utils/percentComplete.ts';
const abs = join(ROOT, TARGET);
const backup = join(import.meta.dirname, 'percentComplete.backup');

const PLANTS = {
  'A · same line (the spelling the gate already caught)':
    '\nexport const __plantA = (raw: string) => parseAmountField(raw) ?? 0;\n',
  'B · Prettier-wrapped (D1-3, the escape)':
    '\nexport const __plantB = (raw: string) =>\n  parseAmountField(\n    raw,\n  ) ?? 0;\n',
};

function runGate() {
  try {
    const out = execFileSync('npx', ['tsx', 'scripts/check-amount-collapse.ts'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? -1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

copyFileSync(abs, backup);
const original = readFileSync(abs, 'utf8');

const base = runGate();
console.log(`baseline                                        exit=${base.code}  ${base.out.trim().split('\n').pop()}`);

for (const [label, snippet] of Object.entries(PLANTS)) {
  writeFileSync(abs, original + snippet, 'utf8');
  const applied = readFileSync(abs, 'utf8') !== original;
  const r = runGate();
  const named = /collapses a parsed amount to 0/.test(r.out);
  const line = (r.out.match(/percentComplete\.ts:(\d+)/) ?? [])[1] ?? '-';
  console.log(
    `plant ${label}\n` +
      `  plant-applied=${applied ? 'YES' : 'NO'} · exit=${r.code} · reason-named=${named ? 'YES' : 'NO'} · reported line=${line}`,
  );
  // restore from the copy taken BEFORE the plant, then prove the bytes are identical
  copyFileSync(backup, abs);
  const restored = readFileSync(abs, 'utf8') === original;
  console.log(`  restored byte-identical=${restored ? 'YES' : 'NO'}`);
  if (!restored) throw new Error('RESTORE FAILED — stop and repair by hand');
}

const after = runGate();
console.log(`after restore                                   exit=${after.code}  ${after.out.trim().split('\n').pop()}`);
