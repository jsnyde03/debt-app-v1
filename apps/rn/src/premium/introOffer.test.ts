import { introPrefix, type IntroEligibility } from './introOffer';
import type { PackageLike } from './purchases';

/**
 * [P6.4.5 · audit L5-19] The intro-offer prefix, and the eligibility guard that is the point of it.
 *
 * ⛔ **Both directions, deliberately.** Asserting only that an eligible user SEES the offer would pass an
 * implementation that shows it to everyone — which is exactly the defect: `introPrice` describes the
 * product, eligibility describes the person, and Apple grants the offer once per Apple Account per
 * subscription group. A returning subscriber promised "30 days free" and charged in full is a false
 * claim about money on the screen that takes it.
 */
let passed = 0;
function assert(cond: boolean, what: string) {
  if (!cond) throw new Error(`FAIL: ${what}`);
  passed += 1;
  console.log(`  ✓ ${what}`);
}

const pkgWith = (intro: PackageLike['product']['introPrice']): PackageLike => ({
  identifier: '$rc_annual',
  packageType: 'ANNUAL',
  product: { priceString: '$29.99', price: 29.99, title: 'Annual', identifier: 'annual', introPrice: intro },
});

const FREE_30 = pkgWith({ priceString: '$0.00', price: 0, periodNumberOfUnits: 30, periodUnit: 'DAY' });
const PAID_3MO = pkgWith({ priceString: '$4.99', price: 4.99, periodNumberOfUnits: 3, periodUnit: 'MONTH' });
const NO_OFFER = pkgWith(null);

function run() {
  console.log('Running intro-offer (L5-19) tests...');

  assert(introPrefix(FREE_30, 'eligible') === '30 days free, then ', 'an ELIGIBLE user sees a free trial named');
  assert(introPrefix(PAID_3MO, 'eligible') === '$4.99 for 3 months, then ', '…and a DISCOUNTED intro is priced, never called free');

  // ⛔ The guard. Each of these would be a false promise about money.
  assert(introPrefix(FREE_30, 'not-eligible') === '', 'an INELIGIBLE user is promised nothing — Apple would charge them in full');
  assert(
    introPrefix(FREE_30, 'unknown') === '',
    "UNKNOWN shows plain pricing — the SDK's own instruction, and Android always returns it",
  );

  assert(introPrefix(NO_OFFER, 'eligible') === '', 'no configured offer → no prefix, even for an eligible user');

  // Singular/plural, because "1 days free" is the kind of thing that ships.
  const oneDay = pkgWith({ priceString: '$0.00', price: 0, periodNumberOfUnits: 1, periodUnit: 'MONTH' });
  assert(introPrefix(oneDay, 'eligible') === '1 month free, then ', 'a single period is singular');

  // A zero-length offer is malformed; treat it as no offer rather than rendering "0 days free".
  const zero = pkgWith({ priceString: '$0.00', price: 0, periodNumberOfUnits: 0, periodUnit: 'DAY' });
  assert(introPrefix(zero, 'eligible') === '', 'a zero-length offer renders nothing, never "0 days free"');

  // ⚠️ The type is the enforcement: eligibility cannot be omitted, only answered.
  const every: IntroEligibility[] = ['eligible', 'not-eligible', 'unknown'];
  assert(every.filter((e) => introPrefix(FREE_30, e) !== '').length === 1, 'exactly ONE of the three states renders the offer');

  console.log(`✅ Intro-offer (L5-19) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
