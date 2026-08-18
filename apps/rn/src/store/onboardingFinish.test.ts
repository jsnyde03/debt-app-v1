import { finishLine } from '@/store/onboardingFinish';

/**
 * T3B (audit L5-11) — onboarding's finish line must always say something true about THIS user.
 *
 * It used to be a single ternary: their projected debt-free date, or **"You're all set"**. That fallback
 * fired for everyone who skipped the paycheck step, skipped the debt step, or chose **Expense** in step 2
 * — an option the product offers as an equal. So the one memorable moment was dropped for exactly the
 * users carrying the least momentum, and replaced with a line that says nothing.
 *
 * ⚠️ Asserts each rung is REACHED and that the generic rung is reached ONLY when nothing is known — a
 * test that only checked the top rung would pass on the old single-ternary code.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function run() {
  console.log('Running onboarding finish-line (T3B/L5-11) tests...');

  const best = finishLine('Mar 2029', '2026-08-26');
  assert(best.title.includes('Mar 2029'), 'a debt-free date leads — their own number, unchanged');

  // The rung that did not exist. This user has a paycheck and no debts (the "Expense" path).
  const mid = finishLine(null, '2026-08-26');
  assert(!mid.title.includes('all set'), 'no debt-free date → NOT the content-free line');
  assert(/Aug 26/.test(mid.title), '…it names their next payday instead');
  assert(mid.body.length > 0 && !/^Your plan is ready/.test(mid.body), '…with a body about what that paycheck covers');

  // Only when nothing at all is known may it be generic.
  const none = finishLine(null, '');
  assert(none.title === 'Your plan is ready', 'nothing known → the generic rung, and only here');

  // The three rungs are distinct: a ladder that repeats itself is a ternary wearing a ladder's clothes.
  const titles = new Set([best.title, mid.title, none.title]);
  assert(titles.size === 3, 'all three rungs are distinct lines');

  console.log(`✅ Onboarding finish-line tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
