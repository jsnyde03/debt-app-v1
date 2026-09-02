import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync('scripts/finding-guards.json', 'utf8'));
const ids = Object.keys(r);
const withProof = ids.filter((i) => r[i].proof);
const authored = withProof.filter((i) => !r[i].proof.measured);
const executed = withProof.filter((i) => r[i].proof.measured);
const guardOnly = ids.filter((i) => !r[i].proof && r[i].guardOnly);
const unguarded = ids.filter((i) => !r[i].proof && !r[i].guardOnly && r[i].unguarded);
const untested = ids.filter((i) => !r[i].proof && !r[i].guardOnly && !r[i].unguarded);
console.log('entries        :', ids.length);
console.log('withProof      :', withProof.length);
console.log('authored(never):', authored.length);
console.log('executed       :', executed.length);
console.log('guardOnly      :', guardOnly.length);
console.log('unguarded      :', unguarded.length);
console.log('untested       :', untested.length);
console.log('authored ids   :', authored.join(', '));
// duplicate id detection off raw text
const raw = readFileSync('scripts/finding-guards.json', 'utf8');
const keyRe = /^  "([^"]+)":/gm;
const seen = new Map(); let m;
while ((m = keyRe.exec(raw))) seen.set(m[1], (seen.get(m[1]) ?? 0) + 1);
console.log('raw top-level keys:', seen.size, 'dupes:', [...seen].filter(([, n]) => n > 1));
// playwright-backed proofs
const pw = withProof.filter((i) => JSON.stringify(r[i].proof.cmd ?? r[i].proof.run ?? '').includes('playwright'));
console.log('proofs whose cmd/run literally contains "playwright":', pw.length);
const runs = withProof.map((i) => r[i].proof.run ?? (r[i].proof.cmd||[]).join(' '));
const tally = {}; for (const x of runs) tally[x] = (tally[x] ?? 0) + 1;
console.log('commands:'); for (const [k,v] of Object.entries(tally).sort((a,b)=>b[1]-a[1])) console.log('   ', v, k);
