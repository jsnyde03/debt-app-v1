import { execSync } from 'node:child_process';
const OLD = JSON.parse(execSync('git show 1cebd764:scripts/finding-guards.json', { encoding: 'utf8', maxBuffer: 1 << 28 }));
const NEW = JSON.parse(execSync('git show HEAD:scripts/finding-guards.json', { encoding: 'utf8', maxBuffer: 1 << 28 }));
for (const [id, e] of Object.entries(OLD)) {
  const n = NEW[id];
  const oe = e.proof?.expect, ne = n?.proof?.expect;
  if (oe !== ne) {
    console.log(`${id}\n  old expect: ${JSON.stringify(oe)}\n  new expect: ${JSON.stringify(ne)}\n  token: ${JSON.stringify(n?.token)}\n  run: ${n?.proof?.run ?? JSON.stringify(n?.proof?.cmd)}`);
    // is the removed value a borrow?
    if (oe !== undefined) {
      const lenders = Object.entries(NEW).filter(([o, x]) => o !== id && x.token?.includes(oe)).map(([o]) => o);
      console.log(`  was it borrow-shaped? own token contains it: ${n?.token?.includes(oe)} · other tokens containing it: [${lenders.join(', ')}]`);
    }
  }
}
console.log('--- ids added ---', Object.keys(NEW).filter((k) => !(k in OLD)).join(', '));
console.log('--- ids removed ---', Object.keys(OLD).filter((k) => !(k in NEW)).join(', '));
