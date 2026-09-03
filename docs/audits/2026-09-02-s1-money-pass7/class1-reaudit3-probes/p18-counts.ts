import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

// ── MIN_ENTRIES ────────────────────────────────────────────────────────────────────────
const reg = JSON.parse(readFileSync(join(ROOT, 'scripts/finding-guards.json'), 'utf8')) as Record<string, unknown>;
console.log(`MIN_ENTRIES: JSON.parse gives ${Object.keys(reg).length} top-level ids   (pinned at 268?)`);

// ── HAND_PARSE_BASELINE: per-line vs per-match, independently ──────────────────────────
const HAND_PARSE = /new Date\(\s*[`'"][^`'"]*\$\{[^}]*\}T00:00:00[`'"]\s*\)|new Date\(\s*[`'"][\d-]+T00:00:00[`'"]\s*\)/;
const HP_G = new RegExp(HAND_PARSE.source, 'g');
let perMatch = 0;
let perLine = 0;
const twoOnALine: string[] = [];
for (const rel of tracked) {
  if (!/^(packages\/core|apps\/rn\/src|apps\/rn\/tests)/.test(rel)) continue;
  if (!/\.(ts|tsx|js|jsx|cjs|mjs)$/.test(rel)) continue;
  if (rel === 'packages/core/utils/localDate.ts') continue;
  const code = stripCommentsOnly(readFileSync(join(ROOT, rel), 'utf8'));
  perMatch += [...code.matchAll(HP_G)].length;
  for (const [i, line] of code.split(/\r?\n/).entries()) {
    const n = [...line.matchAll(HP_G)].length;
    if (n > 0) perLine++;
    if (n > 1) twoOnALine.push(`${rel}:${i + 1} (${n})`);
  }
}
console.log(`\nHAND_PARSE_BASELINE: per-match ${perMatch} · per-line ${perLine} · lines carrying >1: ${twoOnALine.length}`);
for (const t of twoOnALine) console.log('   ', t);
console.log(`   arithmetic: ${perLine} + ${twoOnALine.length} extra = ${perLine + twoOnALine.length}  (pinned at 43?)`);

// ── MAX_AGED_FIXTURE_DATES: re-derive the gate's classification independently ──────────
const isTestShaped = (f: string): boolean =>
  /(^|\/)tests?\//.test(f) || /\.(test|spec|shot)\.tsx?$/.test(f) || /(^|\/)testing\//.test(f) || f.includes('__fixtures__');
const testFiles = tracked.filter((f) => isTestShaped(f) && /\.(ts|tsx|mjs|cjs)$/.test(f));
const AGING_KEY = /([A-Za-z_]*(?:Date|At|AsOf))\s*(?::|(?<![=!<>])=)\s*$/;
const LITERAL = /'(\d{4})-(\d{2})-(\d{2})'/g;
const CLOCK_PIN = /currentDate\s*:\s*'\d{4}-\d{2}-\d{2}'/;
const today = new Date();
today.setHours(0, 0, 0, 0);
let aged = 0;
let pinned = 0;
let nonAging = 0;
let imminent = 0;
let agedRaw = 0; // with CLOCK_PIN read from RAW text (the pre-N-2 behaviour)
for (const f of testFiles) {
  let raw: string;
  try {
    raw = readFileSync(join(ROOT, f), 'utf8');
  } catch {
    continue;
  }
  const srcLines = raw.split('\n');
  const code = stripCommentsOnly(raw);
  const starts = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === '\n') starts.push(i + 1);
  const lineAt = (ix: number): number => {
    let lo = 0;
    for (let k = 0; k < starts.length; k++) if (starts[k] <= ix) lo = k;
    return lo + 1;
  };
  const isPinned = CLOCK_PIN.test(code);
  const isPinnedRaw = CLOCK_PIN.test(raw);
  for (const m of code.matchAll(LITERAL)) {
    const i = lineAt(m.index) - 1;
    if (/fixture-date-ok:/.test(srcLines[i] ?? '')) continue;
    const before = code.slice(Math.max(0, m.index - 160), m.index);
    const key = AGING_KEY.exec(before)?.[1] ?? '';
    if (!key) {
      nonAging++;
      continue;
    }
    if (isPinned) {
      pinned++;
      if (!isPinnedRaw) console.log('   pinned by CODE but not RAW (impossible):', f);
      continue;
    }
    const when = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
    const days = Math.round((when.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) aged++;
    else if (days <= 21) imminent++;
    if (!isPinnedRaw && days < 0) agedRaw++;
  }
}
console.log(`\nfixture-dates: files=${testFiles.length} imminent=${imminent} aged=${aged} pinned=${pinned} nonAging=${nonAging}`);
console.log(`   (pinned caps: MAX_AGED_FIXTURE_DATES 120, MIN_TEST_FILES?)`);

// ── MIN_CAPS: count MAX_/MIN_ cap declarations across scripts/ the way check-cap-literals does ──
const DECL = /^[^\S\n]*(?:export\s+)?const\s+((?:MAX|MIN)_[A-Z0-9_]+)\s*(?::[^=;]+)?=\s*([\s\S]*?);[ \t\r]*$/gm;
let caps = 0;
const capNames: string[] = [];
for (const rel of tracked) {
  if (!rel.startsWith('scripts/') || !rel.endsWith('.ts')) continue;
  const code = stripCommentsOnly(readFileSync(join(ROOT, rel), 'utf8'));
  for (const m of code.matchAll(DECL)) {
    caps++;
    capNames.push(`${rel}:${m[1]}`);
  }
}
console.log(`\nMIN_CAPS: ${caps} MAX_/MIN_ const declarations across scripts/*.ts  (pinned at 27?)`);
console.log(`   MAX_JOIN present anywhere in code? ${capNames.some((n) => n.endsWith('MAX_JOIN'))}`);
console.log(`   MAX_RUN present anywhere in code?  ${capNames.some((n) => n.endsWith('MAX_RUN'))}`);
