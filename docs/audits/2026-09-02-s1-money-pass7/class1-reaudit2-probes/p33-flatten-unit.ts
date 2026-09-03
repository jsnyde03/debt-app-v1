/** Targeted attacks on flattenContinuations: CRLF, templates, JSX, regex, unbalanced brackets, MAX_RUN. */
import { flattenContinuations } from '../../../../scripts/lib/logicalLines';

const NL = String.fromCharCode(10);
const CR = String.fromCharCode(13);
const show = (s: string) => JSON.stringify(s);

function probe(label: string, src: string) {
  let f;
  try {
    f = flattenContinuations(src);
  } catch (e) {
    console.log(`THREW  ${label}: ${(e as Error).message}`);
    return;
  }
  const lenOk = f.text.length === src.length;
  console.log(`${lenOk ? 'len=OK ' : 'len=BAD'} ${label}`);
  console.log(`        ${show(f.text)}`);
}

// 1 — CRLF: is the \r blanked and the length kept?
probe('CRLF wrapped call', `const a = foo(${CR}${NL}  x,${CR}${NL});${CR}${NL}`);
// 2 — a template literal spanning lines, at depth 0
probe('template at depth 0', 'const a = `line one' + NL + 'line two`;' + NL);
// 3 — a template literal spanning lines INSIDE a call (depth > 0)
probe('template inside a call', 'foo(`line one' + NL + 'line two`);' + NL);
// 4 — a regex literal containing brackets and a quote
probe('regex with brackets', "const re = /[('\"]/g;" + NL + 'const b = 1;' + NL);
// 5 — unbalanced brackets: a stray close
probe('stray close paren', 'const a = 1);' + NL + 'const b = 2;' + NL + 'const c = 3;' + NL);
// 6 — unbalanced brackets: a stray open that never closes
probe('unclosed open paren', 'const a = foo(' + NL + 'const b = 2;' + NL + 'const c = 3;' + NL + 'const d = 4;' + NL);
// 7 — JSX children with no bracket
probe('JSX children', 'return (' + NL + '  <View>' + NL + '    <Text>a</Text>' + NL + '  </View>' + NL + ');' + NL);
// 8 — MAX_RUN boundary: a genuinely wrapped 10-line call
probe(
  'wrapped call over 10 lines',
  'foo(' + NL + [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `  a${i},`).join(NL) + NL + ');' + NL + "const after = parseAmountField(z) ?? 0;" + NL,
);
// 9 — lineAt at a flattened newline and at EOF
{
  const src = 'foo(' + NL + '  x,' + NL + ');' + NL;
  const f = flattenContinuations(src);
  const nl0 = src.indexOf(NL);
  console.log(`lineAt: at the flattened newline (offset ${nl0}) = ${f.lineAt(nl0)} (the line it ENDED = 1)`);
  console.log(`lineAt: at EOF (offset ${src.length}) = ${f.lineAt(src.length)} of ${src.split(NL).length} split-parts`);
  console.log(`lineAt: past EOF (offset ${src.length + 50}) = ${f.lineAt(src.length + 50)}`);
  console.log(`lineAt: negative (-1) = ${f.lineAt(-1)}`);
}
// 10 — an unterminated template literal (named as NOT modelled)
probe('unterminated template', 'const a = `open' + NL + 'const b = parseAmountField(x) ?? 0;' + NL);
// 11 — a NUL byte / control character mid-file
probe('NUL byte', 'const a = foo(' + NL + '  ' + String.fromCharCode(0) + 'x,' + NL + ');' + NL);
