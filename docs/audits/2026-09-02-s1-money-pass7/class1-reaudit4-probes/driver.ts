
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

export interface Case {
  id: string;
  target: string;            // repo-relative file to plant into
  append?: string;           // text appended (raw bytes, LF)
  replace?: [string, string];// or an exact substring replacement
  cmd: string[];             // argv after `npx tsx` OR ['npm','run',...]
  want: RegExp;              // must appear in the planted run output
  wantExit?: number;         // default 1
}

export function runCases(cases: Case[]): void {
  for (const c of cases) {
    const abs = join(ROOT, c.target);
    const before = readFileSync(abs);
    let ok = true;
    let out = '';
    let exit = 0;
    try {
      let next = before.toString('binary');
      if (c.replace) {
        const [from, to] = c.replace;
        if (!next.includes(from)) { console.log(`${c.id.padEnd(8)} PLANT-NOT-APPLIED (anchor not found in ${c.target})`); continue; }
        next = next.replace(from, to);
      }
      if (c.append) next = next + c.append;
      writeFileSync(abs, Buffer.from(next, 'binary'));
      const applied = !readFileSync(abs).equals(before);
      if (!applied) { console.log(`${c.id.padEnd(8)} PLANT-NOT-APPLIED`); continue; }
      try {
        out = execFileSync(c.cmd[0], c.cmd.slice(1), { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', shell: true });
        exit = 0;
      } catch (e: any) { out = `${e.stdout ?? ''}${e.stderr ?? ''}`; exit = e.status ?? -1; }
    } finally {
      writeFileSync(abs, before);
      ok = readFileSync(abs).equals(before);
    }
    const named = c.want.test(out);
    const wantExit = c.wantExit ?? 1;
    const verdict = exit === wantExit && named ? 'CLOSED' : exit !== wantExit ? `NOT-CLOSED(exit=${exit})` : 'RED-WRONG-REASON';
    const line = (out.split(/\r?\n/).find((l) => c.want.test(l)) ?? out.split(/\r?\n/).filter(Boolean).slice(-2)[0] ?? '').trim();
    console.log(`${c.id.padEnd(8)} ${verdict.padEnd(18)} restore=${ok ? 'OK' : 'FAIL'} :: ${line.slice(0, 150)}`);
  }
}
