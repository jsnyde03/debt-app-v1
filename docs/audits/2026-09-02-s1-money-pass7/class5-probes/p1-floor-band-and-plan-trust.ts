/* Class 5 · `.5.2` probe 1 — the two things C1-1 and C1-6 assert without measuring.
 *
 *   Q1. Does a repaired (sentinel) floor MOVE the Guardian's band?
 *       Both findings warn it does: C1-1 says "the band is computed against `floor` too, so a naive
 *       change moves the verdict; check the tight/clear boundary before adopting". But computeState.ts:32
 *       reads `floor > 0 ? floor : 200` — it substitutes the default ITSELF. If that insulates, the
 *       stated risk is false and the fix is far cheaper than either finding assumed.
 *
 *   Q2. Does the field-level trust question fire on a `plan` entity?
 *       migrations.ts:299 records plan repairs as { entity: 'plan', id: '', field } and
 *       CLAIM_FIELDS['required-plan'].plan routes 'any' — but NOTHING in the tree has ever asked.
 *       `.5.2` would be the first caller, so the call is traced, not proven, until this runs.
 *
 * ⛔ Both questions carry a control in BOTH directions. A "0 flips" result from a probe that cannot
 *    detect a flip reads exactly like a working one.
 *
 * Run: npx tsx --tsconfig apps/rn/tsconfig.json docs/audits/2026-09-02-s1-money-pass7/class5-probes/p1-floor-band-and-plan-trust.ts
 */
import { computeState, baseState } from '@core/guardian/computeState';

import { unreadRowCaption } from '@/components/plan/dataRepairsCopy';
import { runMigrations } from '@/data/migrations';
import { mayClaim, rowFieldUnread, unreadFieldsFor } from '@/store/trustSelectors';

// ── Q1 · is the band insulated against a non-positive floor? ──────────────────────────────────────
const BANDS = [null, 'clear', 'tight', 'at-risk'] as const;
let n = 0;
let flips0vs200 = 0; // the QUESTION: sentinel 0 vs the default the `||` substitutes
let flips0vs350 = 0; // the CONTROL: a real, different line MUST move the band, or this probe is blind
let baseFlips0vs200 = 0;
const examples: string[] = [];

for (let d = 0; d <= 600; d += 5) {
  for (const prior of BANDS) {
    n++;
    const atZero = computeState(d, 0, prior);
    const atDefault = computeState(d, 200, prior);
    const atReal = computeState(d, 350, prior);
    if (atZero !== atDefault) {
      flips0vs200++;
      if (examples.length < 5) examples.push(`d=${d} prior=${prior ?? 'none'} → 0:${atZero} vs 200:${atDefault}`);
    }
    if (atZero !== atReal) flips0vs350++;
    if (baseState(d, 0) !== baseState(d, 200)) baseFlips0vs200++;
  }
}

console.log('\n======== Q1 · does a sentinel floor move the BAND?');
console.log(`  cases swept (discretionary 0..600 step 5 × 4 prior bands) = ${n}`);
console.log(`  computeState: floor 0 vs 200  → ${flips0vs200} disagreement(s)   ⟵ THE QUESTION`);
console.log(`  baseState   : floor 0 vs 200  → ${baseFlips0vs200} disagreement(s)`);
console.log(`  computeState: floor 0 vs 350  → ${flips0vs350} disagreement(s)   ⟵ CONTROL (must be > 0)`);
if (examples.length) console.log('  examples:', examples.join(' | '));
console.log(
  flips0vs350 === 0
    ? '  ⛔ CONTROL FAILED — a real floor change moved nothing, so this probe cannot see a flip. Result void.'
    : flips0vs200 === 0
      ? '  ⭐ INSULATED — computeState substitutes 200 for any floor ≤ 0 itself, so passing the sentinel\n' +
        '     cannot move the verdict. The risk both findings lead with does NOT hold for the band.'
      : '  ⚠️ NOT insulated — the findings\' warning stands; the tight/clear boundary moves.',
);

// ── Q2 · does the field-level trust question fire on a `plan` entity? ─────────────────────────────
function store(cushionFloor: unknown) {
  const raw: any = {
    storeVersion: 12,
    paycheck: {
      amount: '2000', payCycle: 'biweekly', nextPaycheckDate: '2026-09-15', currentDate: '2026-09-02',
      semiMonthlyFirstDay: '1', semiMonthlySecondDay: '15', monthlyPayDay: '1', incomeVaries: false,
      leanAmount: 0, typicalAmount: 0,
    },
    payoffStrategy: 'snowball',
    debts: [{ id: 'd1', name: 'Visa', balance: 3000, minimumPayment: 60, apr: 22, type: 'debt', recurrence: 'monthly', dueDate: '2026-09-10' }],
    requiredExpenses: [{ id: 'r1', name: 'Rent', amount: 900, dueDate: '2026-09-05', recurrence: 'monthly' }],
    livingExpenses: [], goals: [], cushionFloor, subscriptionPlan: 'premium', prefs: { onboardingComplete: true },
  };
  return runMigrations(raw);
}

/* ⛔ THE CASE THE WHOLE DESIGN RESTS ON is the third one. `setCushionFloor` clamps with Math.max(0, …),
 * so a user CAN hold a legitimate $0 line — and `readMoney` repairs a lost one to $0 as well. The two
 * are byte-identical in value. If the repair record cannot tell them apart, no fix can. */
const CASES = [
  ['A · readable (350)          ', 350, false],
  ['B · UNREADABLE ("abc")      ', 'abc', true],
  ['C · a LEGITIMATE $0 line    ', 0, false],
] as const;

console.log('\n======== Q2 · the plan-entity trust question (nothing in the tree has ever asked it)');
let q2Wrong = 0;
for (const [label, raw, wantUnread] of CASES) {
  const s: any = store(raw);
  const unread = rowFieldUnread(s, 'required-plan', 'plan', '', 'cushionFloor');
  const fields = unreadFieldsFor(s, 'plan', '');
  const ok = unread === wantUnread;
  if (!ok) q2Wrong++;
  console.log(`\n  ${label}`);
  console.log(`    store.cushionFloor                    = ${s.cushionFloor}`);
  console.log(`    rowFieldUnread(…,'plan','','cushionFloor') = ${unread}   ${ok ? '✅' : '⛔ EXPECTED ' + wantUnread}`);
  console.log(`    mayClaim(store,'required-plan')       = ${mayClaim(s, 'required-plan')}`);
  console.log(`    unreadFieldsFor(store,'plan','')      = ${JSON.stringify(fields)}`);
  console.log(`    unreadRowCaption(…)                   = ${JSON.stringify(unreadRowCaption(fields) ?? null)}`);
}

console.log(
  q2Wrong === 0
    ? '\n  ⭐ The discriminator works, and B vs C is the load-bearing pair: both carry cushionFloor = 0,\n' +
      '     and only the LOST one is flagged. The repair record separates them where no value test can.'
    : `\n  ⛔ ${q2Wrong} case(s) answered wrongly — the traced call does NOT hold. Do not build on it.`,
);
