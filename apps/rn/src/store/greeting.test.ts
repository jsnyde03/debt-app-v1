import { greetingBand, MAX_DISPLAY_NAME, normalizeDisplayName, selectGreeting } from '@/store/greeting';

/**
 * 3.7.B.2 (F10.1) — Today's greeting. Every band BOUNDARY is pinned (an off-by-one here greets someone
 * "good evening" over lunch), plus the name normalisation that keeps "cleared" and "never set" one state.
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
  console.log('Running Today greeting (3.7.B.2) tests...');

  // ── bands, at every edge ──
  eq(greetingBand(4), 'evening', '04:59 is still evening (the small hours)');
  eq(greetingBand(5), 'morning', '05:00 opens morning');
  eq(greetingBand(11), 'morning', '11:59 is still morning');
  eq(greetingBand(12), 'afternoon', 'noon opens afternoon');
  eq(greetingBand(16), 'afternoon', '16:59 is still afternoon');
  eq(greetingBand(17), 'evening', '17:00 opens evening');
  eq(greetingBand(23), 'evening', 'late night is evening');
  eq(greetingBand(0), 'evening', 'midnight is evening, not morning');

  // Out-of-range / junk never throws and never yields `undefined` in the title.
  eq(greetingBand(24), 'evening', 'hour 24 wraps to 0');
  eq(greetingBand(-1), 'evening', 'a negative hour wraps, not crashes');
  eq(greetingBand(NaN), 'afternoon', 'NaN falls back rather than producing "undefined"');

  // ── name normalisation ──
  eq(normalizeDisplayName(undefined), undefined, 'unset → undefined');
  eq(normalizeDisplayName(''), undefined, 'empty → undefined');
  eq(normalizeDisplayName('   '), undefined, 'whitespace-only → undefined (cleared === never set)');
  eq(normalizeDisplayName('  Jason  '), 'Jason', 'trimmed');
  eq(normalizeDisplayName('Jason   R'), 'Jason R', 'interior whitespace collapses');
  eq(normalizeDisplayName('x'.repeat(40))?.length, MAX_DISPLAY_NAME, 'a long name is capped so the title cannot wrap');

  // ── the greeting itself ──
  eq(selectGreeting(undefined, 9), 'Good morning', 'no name → the bare time-of-day greeting');
  eq(selectGreeting('Jason', 9), 'Good morning, Jason', 'a name personalises it');
  eq(selectGreeting('Jason', 14), 'Good afternoon, Jason', '…in every band');
  eq(selectGreeting('Jason', 20), 'Good evening, Jason', '…in every band');
  eq(selectGreeting('   ', 9), 'Good morning', 'a whitespace name is no name — never "Good morning, "');

  console.log(`✅ Today greeting (3.7.B.2) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
