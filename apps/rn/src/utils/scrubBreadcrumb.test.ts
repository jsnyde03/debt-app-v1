import { REDACTED, redactMoney, scrubBreadcrumb } from '@/utils/scrubBreadcrumb';

/**
 * P6.5 — the breadcrumb scrub.
 *
 * ⛔ **What these assertions defend is the app's central claim.** [D41]: *"Your data never goes to our
 * servers."* Sentry is a server, and its touch integration records the pressed element's accessibility
 * label — which on the Money tab is built out of the user's own balances. Every case below is a real label
 * shape from this codebase, not an invented one.
 *
 * ⚠️ The negative assertions matter as much as the positive ones: a scrub that blanked everything would
 * pass "no money leaked" while making the crash trail useless, and a useless trail gets switched off.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`scrubBreadcrumb: ${label}`);
  passed += 1;
}
function eq<T>(actual: T, expected: T, label: string) {
  assert(Object.is(actual, expected), `${label} (got ${String(actual)}, expected ${String(expected)})`);
}

// ── Every money shape this app actually emits. ──────────────────────────────────────────────────
{
  eq(redactMoney('$1,350'), REDACTED, 'thousands separator');
  eq(redactMoney('$450'), REDACTED, 'plain');
  eq(redactMoney('$1,234.56'), REDACTED, 'cents');
  eq(redactMoney('$ 12'), REDACTED, 'a space after the sign');
  eq(redactMoney('$0'), REDACTED, 'zero is still a balance');
  // ⛔ The real label from `money.tsx:828`.
  eq(
    redactMoney('Overdue, 2 items, $450'),
    `Overdue, 2 items, ${REDACTED}`,
    'a real a11y label keeps its structure and loses the amount',
  );
  // Two amounts in one string — `.replace` with a /g regex, so both must go.
  eq(
    redactMoney('You have $1,350 cushion, $450 required'),
    `You have ${REDACTED} cushion, ${REDACTED} required`,
    'EVERY amount in the string, not just the first',
  );
}

// ── What must SURVIVE, or the trail is worthless. ───────────────────────────────────────────────
{
  eq(redactMoney('2 expenses'), '2 expenses', 'a count is not money');
  eq(redactMoney('/schedule/d1'), '/schedule/d1', 'a route with an id is not money');
  eq(redactMoney('step 3 of 7'), 'step 3 of 7', 'a step index is not money');
  // ⛔ [S1.10.6.6 · B7] The fixture WAS `'Mark Pay Rent paid'` — a user-authored bill name, asserted as
  // correctly untouched, which pinned the leak green: any future widening of the scrub would red this file
  // and show a reader an assertion saying the current behaviour was intended. An app-authored string says
  // what the assertion means. ⛔ `redactMoney` is the MONEY rule and it is right; names leave via the
  // category drop in `scrubBreadcrumb`, which is where the assertions for them now live.
  eq(redactMoney('Add a debt'), 'Add a debt', 'an app-authored label is untouched');
  eq(redactMoney('19.99% APR'), '19.99% APR', 'a rate carries no currency sign and is diagnostic');
}

// ── Breadcrumbs: message, data, and the category that is dropped outright. ──────────────────────
{
  /**
   * ⛔ **[S1.10.6.6 · B7] A TOUCH BREADCRUMB IS DROPPED, NOT REDACTED.** Its message is the pressed row's
   * accessibility label, which this app builds out of the user's own creditor names — and the money regex
   * took the amounts and left *"Visa … 22.99% APR … verified Jun 3"* standing. A name cannot be
   * pattern-matched, so the category goes the way `console` already does.
   */
  eq(
    scrubBreadcrumb({ category: 'touch', message: 'Visa, Focus, $2,400 · 22.99% APR', data: { target: 'Chase Sapphire Reserve' } }),
    null,
    '⛔ B7 — a touch breadcrumb carrying a creditor name is DROPPED',
  );
  eq(
    scrubBreadcrumb({ category: 'ui.click', message: 'Chase Freedom, $1,240 · 24.99% APR' }),
    null,
    '⛔ B7 — …under the other spelling the SDK uses, too',
  );

  // ⭐ CONTROL — the trail this feature exists for still travels, or the privacy win costs the feature.
  const nav = scrubBreadcrumb({
    category: 'navigation',
    message: 'Overdue, 2 items, $450',
    data: { target: '/schedule/d1', count: 2 },
  });
  assert(nav !== null, '⭐ control — a navigation breadcrumb is KEPT');
  eq(nav?.message, `Overdue, 2 items, ${REDACTED}`, 'its message is redacted');
  eq((nav?.data as Record<string, unknown>).target, '/schedule/d1', 'and a route survives — that is the diagnosis');
  eq((nav?.data as Record<string, unknown>).count, 2, 'a non-string data value passes through unchanged');

  // ⛔ Console content is unbounded — in development it has carried whole store objects.
  eq(scrubBreadcrumb({ category: 'console', message: 'anything at all' }), null, 'console breadcrumbs are DROPPED');

  eq(scrubBreadcrumb(null), null, 'a null breadcrumb stays null');

  const navigation = scrubBreadcrumb({ category: 'navigation', data: { from: '/', to: '/money' } });
  eq((navigation?.data as Record<string, unknown>).to, '/money', 'navigation is untouched — it is the useful half');
}

// ── The scrub does not MUTATE the caller's object. ──────────────────────────────────────────────
//
// ⚠️ Sentry hands the live breadcrumb in. Mutating it in place would edit the object the SDK still holds,
// which is the kind of side effect that works until the SDK reuses the reference.
{
  const original = { category: 'touch', message: 'Total $99', data: { label: 'Balance $5,000' } };
  scrubBreadcrumb(original);
  eq(original.message, 'Total $99', 'the input message is unchanged');
  eq(original.data.label, 'Balance $5,000', 'the input data is unchanged');
}

console.log(`✅ breadcrumb scrub tests passed (${passed} asserts).`);
