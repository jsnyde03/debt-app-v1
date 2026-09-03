import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const REASONS: Record<string, RegExp> = {
  'check-amount-collapse': /collapses a parsed amount to 0/,
  'check-rounding': /inline money-rounding expressions/,
  'check-sandbox-writes': /appStore|singleton|sanctioned/i,
  'check-local-dates': /routed through UTC/,
  'check-month-arithmetic': /overflowing|month arithmetic|setMonth/i,
  'check-glossary': /retired word|breathing room/i,
  'check-contrast': /failing pair|never-text|contrast/i,
  'check-trust-claims': /liveness|re-derivation/i,
  'check-fixture-dates': /cross into the past within \d+ days/,
};
for (const [gate, re] of Object.entries(REASONS)) {
  let out = '';
  try { out = execFileSync('npx', ['tsx', `scripts/${gate}.ts`], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', shell: true }); }
  catch (e: any) { out = `${e.stdout ?? ''}${e.stderr ?? ''}`; }
  const m = re.exec(out);
  console.log(`${gate.padEnd(26)} reason matches its OWN GREEN output = ${m ? 'YES  <-- vacuous ("' + m[0] + '")' : 'no'}`);
}
