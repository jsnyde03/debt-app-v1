// D1 probe: are the routed-but-unclaimed files money-bearing by the exit's OWN predicate?
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { carriesMoneyClaim, MIN_MONEY_BEARING } from '../../../../scripts/lib/moneyClaim';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const D = join(ROOT, 'docs/audits/2026-09-02-s1-money-pass7');
const c1 = JSON.parse(readFileSync(join(ROOT, 'scripts/surface-coverage.s1.json'), 'utf8')) as Record<string, string[]>;
const c0 = JSON.parse(readFileSync(join(ROOT, 'scripts/surface-coverage.s0.json'), 'utf8')) as Record<string, string[]>;

const routed = new Set<string>();
for (const f of readdirSync(D).filter((n) => /^ROUTING-[A-D]\d\.txt$/.test(n))) {
  for (const l of readFileSync(join(D, f), 'utf8').split('\n')) {
    const p = l.trim();
    if (p) routed.add(p);
  }
}
const unclaimed = [...routed].filter((p) => !(p in c1) && !(p in c0));
const money = unclaimed.filter(carriesMoneyClaim);
console.log('MIN_MONEY_BEARING =', MIN_MONEY_BEARING);
console.log('routed (12 sub-lanes) =', routed.size);
console.log('routed but in NEITHER claims file =', unclaimed.length);
console.log('of those, MONEY-BEARING by the exit\'s own predicate =', money.length);
for (const m of money.slice(0, 25)) console.log('   money-bearing + unclaimed:', m);
