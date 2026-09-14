// L4 probe (read-only): recompute check-trust-claims' claimCover/covers over the PIN worktree's own modules,
// and print every contained pair, so the vacuous-conjunct gate's lattice can be compared with trustSelectors.test.ts.
import { claimFields } from '../../../../../../audit-c5r1-L4/apps/rn/src/store/trustSelectors.ts';
import { REPAIRABLE_MONEY_FIELDS } from '../../../../../../audit-c5r1-L4/apps/rn/src/data/migrations.ts';
const routes = claimFields() as Record<string, Record<string, readonly string[] | 'any'>>;
const claimCover = (claim: string): Set<string> => {
  const out = new Set<string>();
  for (const [entity, fields] of Object.entries(routes[claim] ?? {})) {
    const lists = (REPAIRABLE_MONEY_FIELDS as Record<string, { required: readonly string[]; optional: readonly string[] }>)[entity];
    const all = fields === 'any' ? [...(lists?.required ?? []), ...(lists?.optional ?? []), '(any)'] : [...fields];
    for (const f of all) out.add(`${entity}.${f}`);
  }
  return out;
};
const covers = (outer: string, inner: string): boolean => {
  const o = claimCover(outer);
  return [...claimCover(inner)].every((k) => o.has(k) || (k.endsWith('.(any)') ? false : o.has(`${k.split('.')[0]}.(any)`)));
};
const claims = Object.keys(routes);
for (const c of claims) console.log(c, JSON.stringify(routes[c]));
for (const a of claims) for (const b of claims) if (a !== b && covers(b, a)) console.log(`CONTAINED: ${a} ⊑ ${b}`);
console.log('unknown-claim covers anything as inner:', covers('debt-balances', 'no-such-claim'));
