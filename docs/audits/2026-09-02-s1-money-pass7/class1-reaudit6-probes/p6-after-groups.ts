/**
 * Probe: `afterEnclosingGroups` (lib/logicalLines.ts:149, added by V1) decides GROUPING vs CALL
 * paren from the single non-space character before the `(`. A KEYWORD ends in a word character.
 */
import { afterEnclosingGroups, findCalls } from '../../../../scripts/lib/logicalLines';

const PARSER_CALL =
  /\b(?:parseAmountField|parseNonNegativeAmount|parseOptionalAmount)\s*(?:<[^<>()]*>)?\s*(?:\?\.)?\s*\(/g;
const AFTER = /^\s*\?\?\s*0\b/;

const cases: [string, string, 'collapse' | 'not-a-collapse'][] = [
  ['bare', 'const v = parseAmountField(a) ?? 0;', 'collapse'],
  ['V1 (d) grouping', 'const v = (parseAmountField(a)) ?? 0;', 'collapse'],
  ['return + grouping', 'return (parseAmountField(a)) ?? 0;', 'collapse'],
  ['typeof-ish keyword: await', 'const v = await (parseAmountField(a)) ?? 0;', 'collapse'],
  ['yield + grouping', 'const v = yield (parseAmountField(a)) ?? 0;', 'collapse'],
  ['case + grouping', 'switch (x) { case (parseAmountField(a)) ?? 0: break; }', 'collapse'],
  ['double grouping', 'const v = ((parseAmountField(a))) ?? 0;', 'collapse'],
  ['arrow body + grouping', 'const f = () => (parseAmountField(a)) ?? 0;', 'collapse'],
  ['as-cast', 'const v = (parseAmountField(a) as number) ?? 0;', 'collapse'],
  ['NOISY control: wrapper call', 'const v = Number(parseAmountField(a)) ?? 0;', 'not-a-collapse'],
  ['NOISY control: optional wrapper', 'const v = fmt?.(parseAmountField(a)) ?? 0;', 'not-a-collapse'],
  ['NOISY control: unary !', 'const v = !(parseAmountField(a)) ?? 0;', 'not-a-collapse'],
];

for (const [name, code, want] of cases) {
  let hit = false;
  for (const call of findCalls(code, PARSER_CALL)) {
    if (AFTER.test(afterEnclosingGroups(code, call.argsEnd))) hit = true;
  }
  const got = hit ? 'collapse' : 'not-a-collapse';
  const verdict = got === want ? 'ok  ' : got === 'not-a-collapse' ? 'BLIND' : 'NOISY';
  console.log(`${verdict}  want=${want.padEnd(15)} got=${got.padEnd(15)} ${name}`);
}
