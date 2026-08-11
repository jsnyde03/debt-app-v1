import { canManageSubscription, premiumKind } from '@/premium/premiumKind';

/**
 * 3.7.A5 — the three premium states, and the one that had never been rendered or tested.
 *
 * ⚠️ Before this, NOTHING covered the Lifetime row, the manage-subscription link, or the offline path.
 * The mislabel shipped and stayed green because no test would have failed either way.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function eq<T>(a: T, b: T, label: string) {
  assert(a === b, `${label} (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`);
}

function run() {
  console.log('Running premium-kind (3.7.A5) tests...');

  eq(premiumKind({ plan: 'free', premiumResolved: true, premiumIsLifetime: false }), 'none', 'free → none');
  eq(premiumKind({ plan: 'free', premiumResolved: false, premiumIsLifetime: false }), 'none', 'free, unresolved → still none (the plan gate comes first)');

  eq(premiumKind({ plan: 'premium', premiumResolved: true, premiumIsLifetime: true }), 'lifetime', 'resolved + lifetime → lifetime');
  eq(premiumKind({ plan: 'premium', premiumResolved: true, premiumIsLifetime: false }), 'subscription', 'resolved + not lifetime → subscription');

  // The defect. A Lifetime owner launching offline: the persisted plan says premium, RevenueCat never
  // answers, and `premiumIsLifetime` sits at its default false — which used to read as "subscription".
  eq(premiumKind({ plan: 'premium', premiumResolved: false, premiumIsLifetime: false }), 'unresolved', 'A5 — premium but unanswered → unresolved, NOT subscription');
  // Defensive: a stale true with resolved=false is still unresolved. `resolved` is the authority on
  // whether the other flag means anything at all.
  eq(premiumKind({ plan: 'premium', premiumResolved: false, premiumIsLifetime: true }), 'unresolved', '…and `resolved` gates the flag in both directions');

  eq(canManageSubscription('subscription'), true, 'only a real subscription offers Manage Subscription');
  eq(canManageSubscription('lifetime'), false, '…never a Lifetime owner (the subs page would be empty)');
  eq(canManageSubscription('unresolved'), false, '…and never while unresolved — a dead link is worse than a missing one');
  eq(canManageSubscription('none'), false, '…nor a free user');

  console.log(`✅ premium-kind (3.7.A5) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
