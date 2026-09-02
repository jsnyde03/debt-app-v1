import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync('scripts/finding-guards.json', 'utf8'));
for (const id of process.argv.slice(2)) {
  console.log('###', id);
  console.log(JSON.stringify(r[id], null, 2));
}
