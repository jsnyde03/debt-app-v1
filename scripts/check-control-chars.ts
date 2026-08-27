/**
 * [S1.10.6.5.8.6 · GAP-18] — **NO COMMITTED TEXT FILE CARRIES A RAW CONTROL CHARACTER.**
 *
 * ⛔ **The class has now recurred THREE times.** `R2-J1-8` found a raw NUL in `corpus.ts`, closed by
 * escaping. The commit that removed it **introduced another into the log**. And this build measured a
 * third, live: `docs/audits/strings-inventory.md` carried a raw `U+0000` written straight through from
 * the `key:unicode` torture fixture, because the generator escaped `|` and newlines and nothing else.
 *
 * ⚡ **GAP-18's premise was measured over FOUR named files and reported zero.** Scanning all **1,030**
 * tracked `.ts`/`.tsx`/`.md`/`.json` found one — the undercount class again, and the reason this gate
 * scans `git ls-files` rather than a directory list.
 *
 * ⚠️ **AND THE FIRST CUT OF THE FIX REINTRODUCED IT.** Escaping the characters with a regex class of
 * literal control bytes put a real NUL into `strings-inventory.ts` itself — the defect inside its own
 * fix, which is precisely the recurrence above. It is now a code-point test, and this gate is what
 * would have caught it.
 *
 * **Why it matters, plainly:** a raw NUL makes `grep` treat a text file as binary and skip it, truncates
 * the line in many editors, and is rejected outright by some parsers. A file that tooling silently
 * declines to read is the same failure mode as a gate that silently reads nothing.
 *
 * ⛔ **TAB, LF and CR are allowed** — they are legitimate text. Everything else below `U+0020`, plus
 * `U+007F`, is not.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.md', '.json', '.yml', '.yaml'];

/**
 * Files allowed to carry control bytes, each with the reason. ⚠️ Self-ratcheting: an entry that no
 * longer carries one reds, so an exemption cannot outlive its subject.
 */
const EXEMPT: Record<string, string> = {};

/**
 * ⛔ **`--others --exclude-standard`, AND A CONTROL RUN IS WHY.** A plain `git ls-files` lists only
 * TRACKED files, so a NUL planted into this very file read as **green** — the gate could not see a file
 * nobody had added yet. ⚡ That is the shape where *"not caught"* over a file the checker never reads is
 * indistinguishable from a real pass. The most likely moment for a raw control byte to appear is the
 * commit that CREATES the file, which a tracked-only scan structurally cannot cover.
 * ⚠️ `--exclude-standard` keeps `.gitignore` honoured, so build output and `node_modules` stay out.
 */
const tracked = execSync('git ls-files --cached --others --exclude-standard', { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 128e6 })
  .split('\n')
  .filter(Boolean)
  .filter((f) => EXT.some((e) => f.endsWith(e)));

const isControl = (code: number) => (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) || code === 0x7f;

const offenders: { file: string; line: number; code: string }[] = [];
const carriers = new Set<string>();

for (const rel of tracked) {
  let text: string;
  try {
    text = readFileSync(join(REPO_ROOT, rel), 'utf8');
  } catch {
    continue;
  }
  let line = 1;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 0x0a) { line++; continue; }
    if (isControl(code)) {
      carriers.add(rel);
      if (!EXEMPT[rel]) {
        offenders.push({ file: rel, line, code: `U+${code.toString(16).toUpperCase().padStart(4, '0')}` });
      }
    }
  }
}

const problems: string[] = [];
if (offenders.length > 0) {
  const shown = offenders.slice(0, 20);
  problems.push(
    `${offenders.length} raw control character(s) in committed text:\n` +
      shown.map((o) => `      ${o.file}:${o.line}  ${o.code}`).join('\n') +
      (offenders.length > 20 ? `\n      … and ${offenders.length - 20} more` : '') +
      '\n      ESCAPE it (\\u0000), do not delete it — a report that drops the byte lies about its own\n' +
      '      subject. If the raw byte is genuinely required, add the file to EXEMPT here with the reason.',
  );
}

// Self-ratcheting: an exemption for a file that no longer carries one is a hole with a comment in front.
for (const rel of Object.keys(EXEMPT)) {
  if (!carriers.has(rel)) {
    problems.push(`EXEMPT names ${rel}, which carries no control character any more — delete the entry.`);
  }
}

if (problems.length > 0) {
  console.error(`\n❌ control chars: ${problems.length} problem(s).\n`);
  for (const p of problems) console.error(`  • ${p}\n`);
  process.exit(1);
}

console.log(
  `✅ control chars: none in ${tracked.length} tracked text files (tab/LF/CR allowed, ${Object.keys(EXEMPT).length} exemptions).`,
);
