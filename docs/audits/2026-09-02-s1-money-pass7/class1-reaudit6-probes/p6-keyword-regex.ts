/**
 * Probe: stripCode.ts's KEYWORD_BEFORE_REGEX is `/\b(return|typeof|…)$/` tested against
 * `src.slice(i-12, i)`. The window ENDS at the `/`, so `return /re/` (with the space every
 * formatter writes) never matches, and the `/` falls through as an ordinary character.
 * If that regex holds a quote or a backtick, the scanner then opens a runaway string.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { stripCommentsOnly, stripCommentsAndStrings } from '../../../../scripts/lib/stripCode';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const NL = String.fromCharCode(10);
const KEYWORD_BEFORE_REGEX = /\b(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;

// direct unit check of the window arithmetic
for (const s of ['  return /a/.test(x)', '  return/a/.test(x)', 'typeof /a/', 'case /a/:']) {
  const i = s.indexOf('/');
  const win = s.slice(Math.max(0, i - 12), i);
  console.log(`window=${JSON.stringify(win).padEnd(18)} matches=${KEYWORD_BEFORE_REGEX.test(win)}   ${JSON.stringify(s)}`);
}
console.log('');

function walk(d: string, out: string[] = []): string[] {
  for (const e of readdirSync(d)) {
    if (e === 'node_modules' || e === '.expo' || e === 'dist') continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p))) out.push(p);
  }
  return out;
}
const files = [
  ...walk(join(ROOT, 'scripts')),
  ...walk(join(ROOT, 'apps', 'rn', 'src')),
  ...walk(join(ROOT, 'apps', 'rn', 'tests')),
  ...walk(join(ROOT, 'packages', 'core')),
];

// A file is AFFECTED if stripCommentsOnly leaves a line whose trimmed form still opens a
// line comment or a starred doc line — a correct strip blanks every one of them.
const survived: string[] = [];
const blindChars: string[] = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const only = stripCommentsOnly(src);
  const rel = relative(ROOT, f);
  const bad: number[] = [];
  only.split(NL).forEach((l, idx) => {
    const t = l.trim();
    if (t.startsWith('//') || (t.startsWith('* ') && t.length > 4)) bad.push(idx + 1);
  });
  if (bad.length) survived.push(`${rel}  ${bad.length} comment line(s) survive as CODE, first at L${bad[0]}`);

  // blind direction: how much did stripCommentsAndStrings blank that stripCommentsOnly kept
  // as CODE (i.e. neither comment nor string)?  A runaway shows up as a long blanked run.
  const both = stripCommentsAndStrings(src);
  let run = 0;
  let worst = 0;
  let worstAt = 0;
  for (let k = 0; k < src.length; k++) {
    if (both[k] === ' ' && only[k] !== ' ' && src[k] !== ' ') {
      run++;
      if (run > worst) { worst = run; worstAt = k; }
    } else run = 0;
  }
  if (worst > 400) {
    const line = src.slice(0, worstAt).split(NL).length;
    blindChars.push(`${rel}  longest blanked run ${worst} chars, ending L${line}`);
  }
}
console.log(`=== stripCommentsOnly: COMMENTS SURVIVING AS CODE — ${survived.length} of ${files.length} files ===`);
survived.forEach((s) => console.log('  ' + s));
console.log(`\n=== stripCommentsAndStrings: blanked runs > 400 chars (runaway candidates) — ${blindChars.length} files ===`);
blindChars.slice(0, 30).forEach((s) => console.log('  ' + s));
