import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { DebtStore } from '@/data/models';
import { runMigrations } from '@/data/migrations';
import { buildPaydayActivityContent } from '@/liveActivity/paydayActivityContent';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { paywallLead } from '@/store/paywallLead';
import { selectPlanSummary, selectRequiredRows } from '@/store/planSelectors';
import { effectivePaycheckBuffer, selectAllocation } from '@/store/selectors';
import { mayClaim } from '@/store/trustSelectors';
import { buildWidgetSnapshot } from '@/widget/snapshot';

/**
 * ⛔ **S1.11.4.2 [pass-4 blocker `C4-7`] — THE `'required-plan'` CLAIM, ASSERTED OVER ITS SURFACES AS A
 * CLASS.**
 *
 * ⚡ **The defect this exists to make unrepeatable.** Pass 3's `D3-2` wired
 * `mayClaim(store, 'required-plan')` into the Lock Screen and the widget/Siri — **the two surfaces
 * outside the app** — and stopped. On one store with one variable (a $1,500 minimum the reader lost) the
 * outer two then refused to say anything while **Today's Payday Guardian card said "Apply the spare
 * $1,800 toward Visa" against a true $300**, which is the app instructing someone to move six times the
 * money they actually have free. ⛔ **Fixing that one mount is what produced this round**: the finding is
 * not "the Guardian card is ungated", it is "this claim is wired per-site and nothing walks the sites."
 *
 * ⛔ **SO THE SURFACES ARE A LIST AND THE ASSERTION WALKS IT** — never one test naming one member. Adding
 * a surface means adding a row here, and a row that cannot be satisfied is the point at which someone
 * finds out the new surface never asked.
 *
 * ⚠️ **THE LIST'S COMPLETENESS IS NOT THIS FILE'S CLAIM, AND SAYING SO IS THE HONEST PART.** A list is
 * exactly what someone has to remember to extend. `lint:trust-claims`' check 3 is the structural half
 * that derives the population instead of typing it — and **pass 4's `C4-4` is the measured hole in it**:
 * `(tabs)/index.tsx` is in that gate's population and is `continue`d because its *source contains the
 * substring* `trustSelectors`, so a file that imports the claim for one card and never asks it for
 * another walks straight through. `C4-7` came through that escape. **`C4-4` is the completeness half and
 * it is open** (`S1.11.5`); this file is the behavioural half, and the two fail in different directions.
 *
 * ⚠️ **A COMPONENT SURFACE IS PROVEN IN TWO PLACES AND NEITHER ALONE IS ENOUGH.** A React card cannot be
 * rendered by this runner (the store and selectors are pure by design; nothing here imports
 * `react-native`), so a `component` row proves the **wiring** — the mount really does ask the claim owner
 * — and names the e2e that proves the **render**. ⛔ Re-implementing the card's suppression logic here
 * instead would be a second producer of the rule, which is the class this round is collapsing everywhere
 * else; a source assertion carries no copy of the logic.
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

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

/**
 * ⭐ **THE PAIR IS THE TEST.** One store, one variable: Visa's `minimumPayment` is either the $1,500 the
 * user owes this cycle or a value the reader could not parse, which `migrations.ts` repairs to `$0` and
 * records. ⚠️ The due date sits INSIDE the cycle deliberately — with it outside, the minimum is not owed
 * this paycheck and the two stores agree, which is the one shape in which this defect is invisible.
 */
const withMinimum = (minimumPayment: unknown): DebtStore =>
  runMigrations({
    version: 8,
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    paycheck: { amount: '2000', currentDate: '2026-03-02', nextPaycheckDate: '2026-03-16' },
    cushionFloor: 200,
    debts: [
      { id: 'a', name: 'Visa', balance: 5000, originalBalance: 8000, minimumPayment, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' },
    ],
    prefs: { onboardingComplete: true, paydayLiveActivityEnabled: true },
  });

const UNREAD = withMinimum('n/a');
const CONTROL = withMinimum(2500);

/**
 * The figure the unread store INVENTS, and the figure the control really has — both measured, both
 * spelled as the screens spell them, so a formatting change reds here instead of quietly making this
 * file vacuous.
 *
 * ⚠️ **The minimum is $2,500 and not the finding's $1,500, and the reason is the paywall row.** At
 * $1,500 the control's cycle still clears, and `paywallLead` states *"You have $0 cushion this
 * paycheck."* on BOTH stores — an identical sentence either side of the variable, which is a row that
 * cannot fail. ⛔ A shortfall is what makes all three pure surfaces discriminate at once, so the pair
 * is chosen to exercise the class rather than to match the report's numbers. The report's own pair is
 * pinned separately below, where it is the subject rather than the fixture.
 */
const INVENTED = '$1,800';
const TRUE_FIGURE = '$500';

type Surface =
  /** Answerable purely: hand it a store, read back the sentence it would put on screen (or `null` when
   *  it refuses). ⛔ Both directions are asserted — a surface that refuses on BOTH stores has bought its
   *  honesty by going silent, which is not the fix. */
  | { label: string; kind: 'pure'; states: (s: DebtStore) => string | null }
  /** A React card. `file` must ask the claim owner at the mount named by `gate`; `e2e` names the spec
   *  that proves the rendered result, because a passed prop is not a suppressed figure. */
  | { label: string; kind: 'component'; file: string; gate: RegExp; e2e: string };

const REQUIRED_PLAN_SURFACES: Surface[] = [
  {
    label: 'Lock Screen · the payday Live Activity',
    kind: 'pure',
    states: (s) => buildPaydayActivityContent(s)?.line ?? null,
  },
  {
    label: 'Home Screen widget · Siri',
    kind: 'pure',
    // `guardianSpoken` is `''` when it refuses; normalised to `null` so every pure row means one thing.
    states: (s) => buildWidgetSnapshot(s, 600).guardianSpoken || null,
  },
  {
    label: 'Paywall · the lead',
    kind: 'pure',
    // ⛔ pass-3 `C-5`: the one surface where the app asks for money. `mayStatePlanFigures` is a REQUIRED
    // parameter there by design, so this row exercises the caller's answer, not the module's default.
    states: (s) => {
      const engine = withProjectedBalances(s, true);
      const allocation = selectAllocation(engine);
      const summary = allocation ? selectPlanSummary(engine, allocation, selectRequiredRows(engine, allocation)) : null;
      return paywallLead(summary, effectivePaycheckBuffer(s), mayClaim(s, 'required-plan'), null)?.fact ?? null;
    },
  },
  {
    label: 'Today · the Payday Guardian card',
    kind: 'component',
    file: 'app/(tabs)/index.tsx',
    // The mount, then the claim, within one JSX element — a file-wide grep for the claim is what `C4-4`
    // proved is satisfied by an import.
    gate: /<PaydayGuardianCard[\s\S]{0,2000}?unreadPlanInputs=\{!mayClaim\(store, 'required-plan'\)\}/,
    e2e: 'tests/e2e/trust-claims.spec.ts · "C4-7 · the Payday Guardian card"',
  },
  {
    label: 'Today · the required-actions list',
    kind: 'component',
    file: 'app/(tabs)/index.tsx',
    gate: /<RequiredActionsCard[\s\S]{0,3000}?unreadPlanInputs=\{!mayClaim\(store, 'required-plan'\)\}/,
    e2e: 'tests/e2e/data-recovery.spec.ts · pass-2 [C4]',
  },
  {
    label: 'Today · the affordability card',
    kind: 'component',
    // Self-gating: it takes the store, not a prop, so its own source carries the call.
    file: 'components/plan/AffordabilityCard.tsx',
    gate: /const unreadPlanInputs = !mayClaim\(store, 'required-plan'\);/,
    e2e: 'tests/e2e/trust-claims.spec.ts · pass-3 [G-4]',
  },
];

function run() {
  console.log('\n── S1.11.4.2 [C4-7] · the required-plan claim, walked over its surfaces ──');

  // ⭐ The fixture really does lose the minimum, and the control really does not. Without this the whole
  // file could be asserting over two identical stores and reporting sound.
  assert(UNREAD.pendingDataRepairs.some((r) => r.field === 'minimumPayment'), '⭐ fixture — the unread store really did lose the minimum');
  eq(CONTROL.pendingDataRepairs.length, 0, '⭐ fixture — the control records no repair');
  eq(mayClaim(UNREAD, 'required-plan'), false, '⭐ fixture — …so the claim owner refuses on it');
  eq(mayClaim(CONTROL, 'required-plan'), true, '⭐ fixture — …and permits on the control');

  let pure = 0;
  let component = 0;

  for (const surface of REQUIRED_PLAN_SURFACES) {
    if (surface.kind === 'pure') {
      pure++;
      const spoken = surface.states(UNREAD);
      eq(
        spoken,
        null,
        `⛔ ${surface.label} — states NOTHING while an obligation this paycheck must cover went unread`,
      );
      // ⭐ THE CONTROL THAT MAKES THE ABOVE MEAN ANYTHING. A surface that went permanently silent would
      // satisfy every refusal assertion in this file. ⚠️ Non-null is not enough — the figure itself is
      // named, so a surface degraded to an em-dash placeholder is not mistaken for one that still works.
      const truth = surface.states(CONTROL);
      assert(
        truth !== null && truth.includes(TRUE_FIGURE),
        `⭐ ${surface.label} control — a plan the app READ still states its real ${TRUE_FIGURE} (got ${JSON.stringify(truth)})`,
      );
      continue;
    }
    component++;
    const src = read(surface.file);
    assert(surface.gate.test(src), `⛔ ${surface.label} — the mount in ${surface.file} asks the claim owner`);
    // ⚠️ Named, not asserted: this runner cannot execute Playwright. The string exists so a reader of a
    // failure here knows where the OTHER half of this surface's proof lives.
    assert(surface.e2e.length > 0, `   ↳ ${surface.label} — render proven by ${surface.e2e}`);
  }

  /**
   * ⛔ **`C4-7`'s OWN MEASUREMENT, PINNED — and it says the fix is NOT in the selector.**
   *
   * `selectPaydayGuardian` is honest about the arrays it was handed; the arrays are wrong. It still
   * computes the invented spare, and it SHOULD — the brief is a derivation, and gagging the derivation
   * would take the figure away from the tutorial sandbox and the prediction pipeline, which read the same
   * selector over stores that have no losses. ⛔ **The claim is made by whoever puts it on screen**, which
   * is why every row above is a surface and none of them is a selector. If this assertion ever reds, read
   * it as *"someone moved the gate into the producer"* and check what else consumes it before agreeing.
   */
  const brief = selectPaydayGuardian(withProjectedBalances(UNREAD, true));
  assert(
    brief?.safeMove?.includes(INVENTED) === true,
    `⭐ ${INVENTED} — the brief still derives the invented spare from the repaired-to-$0 obligation (got ${JSON.stringify(brief?.safeMove)})`,
  );
  eq(brief?.title, 'Looks clear this paycheck', '⭐ …and the VERDICT it derives is the reassurance the card must not print');

  // ⛔ THE LIST IS NOT ALLOWED TO SHRINK, and the floors are LITERALS. A count derived from the list it
  // caps is `n > n` — the shape `lint:trust-claims` shipped twice and pass 4 found, so it is not repeated
  // here. Raise these WITH the row.
  assert(pure >= 3, `⛔ the pure surfaces cannot be deleted to make this file pass (saw ${pure}, floor 3)`);
  assert(component >= 3, `⛔ the component surfaces cannot be deleted to make this file pass (saw ${component}, floor 3)`);

  console.log(`  ✔ ${passed} assertions across ${REQUIRED_PLAN_SURFACES.length} surfaces\n`);
}

run();
