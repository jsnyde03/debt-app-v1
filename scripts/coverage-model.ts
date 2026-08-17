/**
 * 4.1.9c — THE CHECKLIST'S GRAMMAR, OWNED ONCE.
 *
 * ⛔ EXTRACTED, NOT INVENTED. `coverage-split.ts` (the reader) and `stamp-coverage.ts` (the writer) both
 * have to agree on what a row is, what an id is, and where a `✅auto·<runId>` stamp lives. If they each
 * carried their own regexes the writer could stamp a row the reader cannot see — a stamp that counts for
 * nothing, or worse, a row the reader reads differently from the file the writer edited.
 *
 * This repo has hit "two places, one rule" three times in one wave (Wave A: A6a, A5, A3.6), and each was
 * fixed by extracting a single authority. ⚡ **Agreeing copies are still copies — they just have not
 * diverged yet.** So the grammar is here and both scripts import it.
 *
 * ⚠️ NOTHING HERE WRITES. Parsing and the write path are deliberately separate files: the checklist
 * carries hand-recorded results that are not regenerable, and the reader must be unable to touch it even
 * by accident.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const REPO_ROOT = join(import.meta.dirname, '..');
export const CHECKLIST = join(REPO_ROOT, 'docs', 'DEBT_3.5_DEVICE_QA_CHECKLIST.md');
export const FLOW_DIR = join(REPO_ROOT, 'apps', 'rn', '.maestro');

/**
 * ⚠️ SINGLE SOURCE. §6's two subsections are lettered (`§6a.N`, `§6b.N`) and the BUILD deltas are
 * `§B2.N`/`§B3.N`. The first verifier written against these ids used `\d+|B\d+` and reported 14 false
 * failures against ids that were perfectly well formed. Every id regex in the instrument derives from here.
 */
export const IDCHARS = String.raw`(?:\d+[ab]?|B\d+)(?:\.\d+)*`;

/**
 * ⭐ `X` JOINED THE TAXONOMY 2026-08-17 (4.1.6a.7.5) — a row a NATIVE DRIVER can carry.
 *
 * The letters are tools, not grades: `M` Maestro · `M◐` its automatable half · `A` Appium (exactly the
 * three ⌘-key rows) · `X` XCUITest · `D` device-only · `—` not a check.
 *
 * ⚠️ A VERDICT IS NOT A STATUS. It claims a row CAN be automated by this lane, never that it is.
 */
export type Verdict = 'M' | 'M◐' | 'A' | 'X' | 'D' | '—';
export const VERDICTS: readonly string[] = ['M', 'M◐', 'A', 'X', 'D', '—'];
export const AUTOMATABLE: readonly Verdict[] = ['M', 'M◐', 'A', 'X'];

/**
 * ⚠️ A row's id is its LEADING token, and even that is not sufficient on its own: §9 carries a prose row
 * opening `**§11 · §12 · §13 clean = …`, which is a citation, not a definition. A real id is always
 * followed by ` — ` (legacy, id inside the title span) or closed by `**` (id in its own span).
 */
/**
 * ⛔ CAPTURED FOR *REPLACEMENT*, not just for reading. The checkbox character gets its own group so the
 * writer can flip `[ ]` → `[x]` by rewriting one group — never by re-emitting the line from parsed parts,
 * which is how a hand-written file loses its formatting. The reader ignores the extra groups.
 *
 *   1 = prefix through `[`   2 = the box char   3 = `] \`[`   4 = verdict   5 = `\`]\`` … `**§`
 *   6 = id   7 = the rest of the line
 */
export const ROW = new RegExp(
  String.raw`^(\s*-\s*\[)([ xX])(\]\s*\x60\[)([^\]]+)(\]\x60\s+\*\*§)(${IDCHARS})(?:\*\*\s*|\s+—\s*)(.*)$`,
);
/** cheap pre-filter: any checkbox line at all, so a malformed row can be REPORTED rather than skipped */
export const BARE_ROW = /^\s*-\s*\[[ xX]\]/;

/** the provenance mark. ⚠️ Both scripts must agree on it exactly — see the file header. */
export const STAMP_RE = /✅auto·(\d+)/;
/** the same token with its leading space and backticks, for removal */
export const STAMP_TOKEN_RE = /[ \t]*`✅auto·\d+`/;
export const stampToken = (runId: string) => `\`✅auto·${runId}\``;

export interface Check {
  id: string;
  verdict: Verdict;
  section: string;
  done: boolean;
  title: string;
  /** 1-indexed line of the row's FIRST line */
  line: number;
  /** 0-indexed [start, end] of the row's whole logical block, inclusive */
  block: [number, number];
  /** the run id from a `✅auto·<runId>` stamp; undefined for a bare `[x]` or an unticked row */
  stamp?: string;
}

export interface Claim {
  id: string;
  kind: 'COVERS' | 'PARTIAL';
  why: string;
  flow: string;
  line: number;
}

/**
 * ⚠️ A CHECKLIST ROW WRAPS, and the stamp belongs to the ROW, not to a line.
 *
 * Measured the hard way: reading only the first line counted five freshly machine-stamped rows as
 * human-earned, collapsing the exact provenance distinction the instrument exists to keep. A row's first
 * line usually ends mid-sentence, so a stamp naturally lands on a continuation line. A block ends at the
 * next row, a blank line, a heading, or a table.
 */
export function blockEnd(lines: string[], start: number): number {
  let end = start;
  while (end + 1 < lines.length) {
    const next = lines[end + 1];
    if (BARE_ROW.test(next) || /^\s*$/.test(next) || /^#{1,6}\s/.test(next) || /^\s*\|/.test(next)) break;
    end++;
  }
  return end;
}

/**
 * ⛔ THE CHECKLIST IS A **CRLF** FILE — 593 of them, zero bare LFs — and the writer joins lines back
 * together. Splitting on `/\r?\n/` and joining on `'\n'` rewrites every line ending in a hand-maintained
 * document: a whole-file diff, from a script whose entire design goal is to touch one character and one
 * token. Caught by the format-preservation scenario, which is the only check that could see it.
 */
export function parseChecklist(path = CHECKLIST): { checks: Check[]; problems: string[]; lines: string[]; eol: string } {
  const problems: string[] = [];
  const checks: Check[] = [];
  const raw = readFileSync(path, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  let section = '(preamble)';
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^#{2,3}\s+(.*)$/);
    if (h) { section = h[1].replace(/\s+—.*$/, '').replace(/[*_`]/g, '').trim(); continue; }
    if (!BARE_ROW.test(lines[i])) continue;
    const m = lines[i].match(ROW);
    if (!m) { problems.push(`${path}:${i + 1} — checkbox row without a \`[verdict]\` + \`**§id**\`: ${lines[i].slice(0, 88)}`); continue; }
    const [, , box, , verdict, , id, title] = m;
    if (!VERDICTS.includes(verdict)) {
      problems.push(`${path}:${i + 1} — unknown verdict [${verdict}] on §${id}`);
      continue;
    }
    const end = blockEnd(lines, i);
    const stamp = lines.slice(i, end + 1).join('\n').match(STAMP_RE)?.[1];
    checks.push({
      id: `§${id}`,
      verdict: verdict as Verdict,
      section,
      done: box.toLowerCase() === 'x',
      title: title.replace(STAMP_RE, '').replace(/\*\*/g, '').replace(/[_`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 96),
      line: i + 1,
      block: [i, end],
      stamp,
    });
  }
  const seen = new Map<string, number>();
  for (const c of checks) {
    if (seen.has(c.id)) problems.push(`duplicate id ${c.id} — lines ${seen.get(c.id)} and ${c.line}`);
    seen.set(c.id, c.line);
  }
  return { checks, problems, lines, eol };
}

export const CLAIM_RE = new RegExp(String.raw`^#\s*(COVERS|PARTIAL):\s*§(${IDCHARS})\s*—\s*(.*)$`);

export function parseFlows(dir = FLOW_DIR): Claim[] {
  const claims: Claim[] = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.yaml'))) {
    const lines = readFileSync(join(dir, f), 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(CLAIM_RE);
      if (!m) continue;
      claims.push({ kind: m[1] as Claim['kind'], id: `§${m[2]}`, why: m[3].trim(), flow: f, line: i + 1 });
    }
  }
  return claims;
}

export function claimsById(claims: Claim[]): Map<string, Claim[]> {
  const m = new Map<string, Claim[]>();
  for (const c of claims) m.set(c.id, [...(m.get(c.id) ?? []), c]);
  return m;
}
