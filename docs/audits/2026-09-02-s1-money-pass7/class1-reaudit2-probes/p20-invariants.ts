/** flattenContinuations invariants over EVERY tracked ts/tsx file. */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { flattenContinuations } from '../../../../scripts/lib/logicalLines';

const REPO_ROOT = join(import.meta.dirname, '../../../..');
const files = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: REPO_ROOT, encoding: 'utf8' })
  .split('\n').map((s) => s.trim()).filter(Boolean);

let lenBad = 0, lineBad = 0, runMax = 0, atCap = 0, crlfLeft = 0, nlBad = 0;
const runHist = new Map<number, number>();
const capSites: string[] = [];
const lineBadSites: string[] = [];
const nlBadSites: string[] = [];
for (const rel of files) {
  const src = readFileSync(join(REPO_ROOT, rel), 'utf8');
  const f = flattenContinuations(src);
  if (f.text.length !== src.length) { lenBad++; console.log(`LEN ${rel}: src=${src.length} flat=${f.text.length}`); }
  // lineAt must agree with counting newlines in the SOURCE, at every offset that starts a line
  // plus a sample of interior offsets.
  const starts = [0]; for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  for (let ln = 0; ln < starts.length; ln++) {
    if (f.lineAt(starts[ln]) !== ln + 1) { lineBad++; if (lineBadSites.length < 8) lineBadSites.push(`${rel} @${starts[ln]} want ${ln+1} got ${f.lineAt(starts[ln])}`); }
  }
  // end-of-file offset
  const eof = f.lineAt(src.length);
  if (eof < 1 || eof > starts.length) { lineBad++; lineBadSites.push(`${rel} EOF got ${eof} of ${starts.length}`); }
  // every surviving newline in flat.text must be a newline in src (no invented ones)
  for (let i = 0; i < f.text.length; i++) {
    if ((f.text[i] === '\n') !== (src[i] === '\n')) { nlBad++; if (nlBadSites.length < 8) nlBadSites.push(`${rel}@${i}`); break; }
  }
  // stray \r left in the middle of a flattened statement?
  for (let i = 0; i < f.text.length - 1; i++) {
    if (f.text[i] === '\r' && f.text[i + 1] !== '\n') { crlfLeft++; console.log(`STRAY-CR ${rel}@${i}`); break; }
  }
  // measure the flatten runs actually produced
  let run = 1;
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '\n') { if (f.text[i] === ' ') run++; else { runHist.set(run, (runHist.get(run) ?? 0) + 1); if (run > runMax) runMax = run; if (run >= 8) { atCap++; if (capSites.length < 10) capSites.push(`${rel}:${f.lineAt(i) - run + 1}`); } run = 1; } }
  }
}
console.log(`files=${files.length}`);
console.log(`length mismatches      = ${lenBad}`);
console.log(`lineAt disagreements   = ${lineBad}`, lineBadSites.slice(0,8));
console.log(`invented/lost newlines = ${nlBad}`, nlBadSites.slice(0,8));
console.log(`stray CR mid-statement = ${crlfLeft}`);
console.log(`widest flatten run     = ${runMax}  (MAX_RUN = 8)`);
console.log(`runs at the cap (>=8)  = ${atCap}`, capSites);
console.log('run-length histogram (physical lines per flattened statement, >1 only):');
for (const k of [...runHist.keys()].sort((a, b) => a - b)) if (k > 1) console.log(`  ${k}: ${runHist.get(k)}`);
