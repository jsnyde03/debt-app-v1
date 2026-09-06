import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync('scripts/finding-guards.json', 'utf8'));
for (const [id, e] of Object.entries(r)) {
  if (e.proof && e.proof.expect === undefined) {
    console.log(`${id}\n   token=${JSON.stringify(e.token)}\n   run=${e.proof.run ?? (e.proof.cmd||[]).join(' ')}  measured=${e.proof.measured} sha=${e.proof.sha}`);
  }
}
