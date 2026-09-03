/** Re-auditor unit probes on scripts/lib/logicalLines.ts */
import { logicalLines } from '../../../../scripts/lib/logicalLines';
const show = (name: string, src: string, opts = {}) => {
  const ls = logicalLines(src, opts as never);
  console.log(`\n== ${name}`);
  for (const l of ls) console.log(`  line=${l.line} span=${l.span} :: ${JSON.stringify(l.text.slice(0, 110))}`);
};

show('CRLF wrapped call', 'const n =\r\n  parseAmountField(\r\n    raw,\r\n  ) ?? 0;\r\n', { blankStrings: true });
show('LF wrapped call', 'const n =\n  parseAmountField(\n    raw,\n  ) ?? 0;\n', { blankStrings: true });
show('template literal spanning lines', 'const s = `\n  ${parseAmountField(raw) ?? 0}\n`;\nconst t = 1;\n', { blankStrings: true });
show('regex literal with brackets', 'const RE = /[()]{2}/;\nconst n = parseAmountField(\n  raw,\n) ?? 0;\n', { blankStrings: true });
show('generic arrow type', 'const f: Array<(x: number) => void> = [];\nconst n = 1;\n');
show('unbalanced open paren', 'const bad = foo(\nconst a = 1;\nconst b = 2;\n');
show('MAX_JOIN boundary', 'x(\n' + 'a,\n'.repeat(10) + ')\n', { maxJoin: 5 });
show('JSX return', 'function C() {\n  return (\n    <View>\n      <Text>a</Text>\n    </View>\n  );\n}\n');
show('object literal at statement level', 'const o = {\n  a: 1,\n};\nconst p = 2;\n');
show('arrow body', 'const f = () => {\n  const n = 1;\n};\n');
show('fn with return-type annotation', 'export function g(a: number): Foo | null {\n  const n = 1;\n}\n');
