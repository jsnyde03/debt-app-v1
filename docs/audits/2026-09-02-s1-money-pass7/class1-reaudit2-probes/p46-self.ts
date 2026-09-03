/** What does check-amount-collapse's SELF set hide? Every match in the two excluded files. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { flattenContinuations } from '../../../../scripts/lib/logicalLines';
const REPO_ROOT = join(import.meta.dirname, '../../../..');
const COLLAPSE = /\b(parseAmountField|parseNonNegativeAmount|parseOptionalAmount)\s*\([^\n]*?\)\s*\?\?\s*0/g;
for (const rel of ['scripts/check-amount-collapse.ts', 'scripts/test-wrap-escapes.ts']) {
  const src = readFileSync(join(REPO_ROOT, rel), 'utf8');
  const f = flattenContinuations(src);
  const ms = [...f.text.matchAll(COLLAPSE)];
  console.log(`${rel}: ${ms.length} match(es) hidden by SELF`);
  for (const m of ms) console.log(`   :${f.lineAt(m.index)}  ${m[0].replace(/\s+/g, ' ').slice(0, 90)}`);
  console.log(`   imports parseAmountField? ${/from\s+['"][^'"]*amountField['"]/.test(src)}`);
}
