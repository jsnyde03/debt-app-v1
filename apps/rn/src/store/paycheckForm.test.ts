import { nextPaycheckFrom, PAYCHECK_ERRORS, paydayFieldError } from '@/store/paycheckForm';

/**
 * T3.4 (audit L5-14) — the pay-cycle day fields must never be guessed at.
 *
 * `nextPaycheckFrom` used to CATCH an invalid day and return `getNextPaycheckDate({payCycle:'biweekly'})`
 * — today + 14 days. The preview card rendered that with full confidence and Continue wrote it, so a
 * user who picked Semi-monthly and left "First payday" empty had their very first fact about themselves
 * stored as `semimonthly` + a blank day + a biweekly-derived date, with no error shown anywhere.
 *
 * ⚠️ **The day values here are chosen so a correct answer cannot coincide with today + 14.** The first
 * probe of this used 1 & 15, and on the day it ran every row — valid and invalid alike — returned the
 * same date, so the fixture could not tell the defect from correct behaviour.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function run() {
  console.log('Running paycheck-form (T3.4) tests...');

  // ── An unusable day yields NO date, rather than a plausible wrong one ──
  assert(nextPaycheckFrom('monthly', '', '', '') === null, 'monthly with a blank day → null (was: today + 14)');
  assert(nextPaycheckFrom('monthly', '', '', '45') === null, 'monthly with a day out of 1–31 → null');
  assert(nextPaycheckFrom('semimonthly', '', '20', '') === null, 'semi-monthly with a blank first day → null');
  assert(nextPaycheckFrom('semimonthly', '20', '20', '') === null, 'semi-monthly with two identical days → null');

  // ── …and a usable one still resolves, on the day the user actually named ──
  assert(nextPaycheckFrom('monthly', '', '', '20')?.endsWith('-20') === true, 'monthly day 20 → lands on the 20th');
  assert(nextPaycheckFrom('semimonthly', '5', '20', '') !== null, 'semi-monthly 5 & 20 → a real date');
  // Weekly/bi-weekly carry no day fields at all, so blank ones must NOT be treated as an error.
  assert(nextPaycheckFrom('biweekly', '', '', '') !== null, 'bi-weekly needs no day fields → still resolves');

  // ── The refusal is explained, and both hosts read it from HERE ──
  assert(paydayFieldError('monthly', '', '', '') === PAYCHECK_ERRORS.paydayRequired, 'blank monthly day → "which day" message');
  assert(paydayFieldError('monthly', '', '', '45') === PAYCHECK_ERRORS.paydayRange, 'out-of-range day → the range message');
  assert(paydayFieldError('semimonthly', '20', '20', '') === PAYCHECK_ERRORS.paydaySame, 'identical days → the "must differ" message');
  assert(paydayFieldError('semimonthly', '5', '20', '') === null, 'a valid pair → no error');
  assert(paydayFieldError('biweekly', '', '', '') === null, 'bi-weekly → never an error');
  assert(paydayFieldError('weekly', '', '', '') === null, 'weekly → never an error');

  // ⚠️ The two agree in both directions. They are read by two different hosts at two different moments
  // (preview vs submit), so a state where one says "fine" and the other says "no date" is a form that
  // either blocks with no message or continues with no date.
  const grid: [Parameters<typeof nextPaycheckFrom>[0], string, string, string][] = [
    ['monthly', '', '', ''], ['monthly', '', '', '45'], ['monthly', '', '', '20'],
    ['semimonthly', '', '20', ''], ['semimonthly', '20', '20', ''], ['semimonthly', '5', '20', ''],
    ['biweekly', '', '', ''], ['weekly', '', '', ''],
  ].map((c) => c as [Parameters<typeof nextPaycheckFrom>[0], string, string, string]);
  for (const [cycle, f, s, p] of grid) {
    const hasDate = nextPaycheckFrom(cycle, f, s, p) !== null;
    const hasError = paydayFieldError(cycle, f, s, p) !== null;
    assert(hasDate === !hasError, `${cycle} [${f}|${s}|${p}]: a date exists exactly when there is no error`);
  }

  console.log(`✅ Paycheck-form (T3.4) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
