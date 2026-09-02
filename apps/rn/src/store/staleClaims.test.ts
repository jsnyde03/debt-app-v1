import { readFileSync } from 'node:fs';

/**
 * `S1.13.7.11` [pass-6 **`B1-4`**, **`B2-1`**, **`B2-2`**] — three claims that decayed into falsehoods,
 * and the assertions that keep the corrections from decaying the same way.
 *
 * ⛔ **A comment is a carried premise and decays like a carried number.** None of these three cost a user
 * anything directly; all three cost the next author, by telling them a thing is guaranteed when it is not.
 * That is `findings-cite-comments-as-evidence` from the other side: the repo has already authored a plan
 * item off a stale docblock once.
 *
 * ⚠️ **Both directions, every time.** Asserting the new sentence is present proves nothing if the old one
 * is still sitting three lines below it — `[D17]` says correcting a false comment means DELETING it, not
 * annotating it, and only the absence half can check that.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

console.log('\n▶ B1-4 · B2-1 · B2-2 — three expired claims, restated as what is true');

// ── B1-4: the gate LEDGERS re-derivations; it does not ban them ──────────────────
const trust = read('./trustSelectors.ts');
assert(trust.includes('export function liveDebts'), 'trustSelectors was actually read');
assert(
  /LEDGERS re-derivations; it does not ban them/.test(trust),
  'the owner docblock states what `lint:trust-claims` DOES',
);
assert(
  !/`lint:trust-claims` reds on a re-derivation/.test(trust),
  '⛔ …and the claim that it reds on one is gone — B1-1 and B1-3 were both re-derivations that shipped',
);

// ── B2-1: what fences /paywall is [D9], not the exit sequence ────────────────────
// ⚠️ Two files said this, in different words. Both are checked, because correcting one and leaving the
// other is the defect class this whole round keeps measuring.
for (const [rel, anchor] of [
  ['../store/StoreContext.tsx', 'export'],
  ['../store/demoExit.ts', 'export'],
] as const) {
  const src = read(rel);
  assert(src.includes(anchor), `${rel} was actually read`);
  assert(
    /\[D9\][^\n]*|D9/.test(src) && /runs PREMIUM|sandbox runs PREMIUM|the sandbox runs PREMIUM/i.test(src),
    `${rel} names [D9] — the sandbox running premium — as what fences /paywall`,
  );
  assert(
    !/exits tear the session down BEFORE navigating/.test(src),
    `${rel}: ⛔ the terminal-exit claim is gone, not annotated`,
  );
}

// ── B2-2: the allow-list reason is coupled to the decision that actually holds ────
const sandboxGate = read('../../../../scripts/check-sandbox-writes.ts');
assert(sandboxGate.includes('paywall.tsx'), 'the sandbox allow-list was actually read');
assert(
  /coupled to \[D9\]/.test(sandboxGate),
  "paywall.tsx's exemption names the decision it depends on, so a change to [D9] has somewhere to land",
);
assert(
  !/the demo exits are TERMINAL/.test(sandboxGate),
  '⛔ …and the expired reason is gone — an allow-list can detect a changed PATH and never a changed WORLD',
);

console.log(`\n✅ B1-4 · B2-1 · B2-2 — ${passed} assertion(s) passed\n`);
