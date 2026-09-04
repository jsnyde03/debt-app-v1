/**
 * U11 re-audit: what does `lib/joinedCode` weld that it should not, measured over the LIVE population?
 *
 * For all 280 registry entries: is the token present on one physical non-comment line (the pre-U11
 * question), and is it present in the joined text (the post-U11 question)? Every case where the two
 * disagree is a behaviour change round 5 introduced, and each one is either a legitimate wrap or an
 * over-weld. Also checks `lineAt`'s attribution against the raw source.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { joinAllLines, joinCodeLines, normaliseFragment } from '../../../../scripts/lib/joinedCode';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const registry = JSON.parse(
  readFileSync(join(REPO_ROOT, 'scripts/finding-guards.json'), 'utf8'),
) as Record<string, { file?: string; token?: string }>;

const NL = String.fromCharCode(10);
const isCommentLine = (l: string) => /^\s*(?:\/\/|\*|\/\*)/.test(l);

let checked = 0;
const joinedOnly: string[] = [];
const lineOnly: string[] = [];
const badLine: string[] = [];

for (const [id, e] of Object.entries(registry)) {
  if (!e.file || !e.token) continue;
  const abs = join(REPO_ROOT, e.file);
  if (!existsSync(abs)) continue;
  checked++;
  const text = readFileSync(abs, 'utf8');
  const perLine = text.split(NL).some((l) => !isCommentLine(l) && l.includes(e.token!));
  const j = joinCodeLines(text);
  const needle = normaliseFragment(e.token);
  const at = j.text.indexOf(needle);
  const joined = at >= 0;
  if (joined && !perLine) joinedOnly.push(`${id}  ${e.file}`);
  if (perLine && !joined) lineOnly.push(`${id}  ${e.file}`);
  if (joined) {
    // does lineAt land on a source line that carries the token's FIRST word?
    const first = needle.replace(/^[^A-Za-z0-9]+/, '').split(/\s+/)[0] ?? '';
    const ln = j.lineAt(at);
    const src = text.split(NL)[ln - 1] ?? '';
    if (first.length > 2 && !src.includes(first)) badLine.push(`${id}  ${e.file}:${ln}  want first word ${JSON.stringify(first)}  got ${JSON.stringify(src.trim().slice(0, 70))}`);
  }
}

console.log(`registry entries with an existing file+token: ${checked}`);
console.log(`\nFOUND ONLY IN THE JOINED TEXT (round 5's new tolerance) — ${joinedOnly.length}`);
for (const l of joinedOnly) console.log('  ', l);
console.log(`\nFOUND ONLY PER PHYSICAL LINE (a REGRESSION if any) — ${lineOnly.length}`);
for (const l of lineOnly) console.log('  ', l);
console.log(`\nlineAt LANDS ON A LINE WITHOUT THE TOKEN'S FIRST WORD — ${badLine.length}`);
for (const l of badLine.slice(0, 20)) console.log('  ', l);

// ── over-weld probes on synthetic input ────────────────────────────────────────────────────────
console.log('\n── synthetic ──');
const show = (label: string, src: string) =>
  console.log(`${label.padEnd(46)} :: ${JSON.stringify(joinCodeLines(src).text)}`);
show('two unrelated statements', "const a = 'set it again';" + NL + "const b = 'above the fold';");
show('emoji then an identifier', "const a = '⛔ x';" + NL + '  alignItems: 1,');
show('block comment opened MID-LINE', 'const x = 1; /* opens' + NL + 'const token = "SECRET GUARD";' + NL + '*/');
show('line starting /* with a */ inside then unclosed', '/* a */ /* opens' + NL + 'const token = "SECRET GUARD";' + NL + '*/');
show('a brace inside an interpolated string', 'const a = `x ${f("}")} y`;' + NL + 'const b = 1;');
console.log(
  'joinAllLines keeps comments'.padEnd(46) +
    ' :: ' +
    JSON.stringify(joinAllLines('// only in a comment: TOKEN' + NL + 'const x = 1;').text),
);
