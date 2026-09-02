import { appStore } from '@/store/appStore';
import {
  __resetSandboxScopesForTest,
  allowRealStoreWrite,
  enterSandboxScope,
  forbiddenRealStoreChanges,
} from '@/store/realWriteGuard';
import { setErrorReporter } from '@/utils/reportError';

/**
 * [R4] — the demo/walkthrough veto. The user's real plan is READ-ONLY while a sandbox is on screen.
 *
 * ⛔ **What this exists to stop, in the shape it actually shipped.** `demo-containment.spec.ts` had 14
 * passing tests while a user edited an expense inside the demo and the write landed on their real plan:
 * every one of them asserted NAVIGATION containment, and none asserted WRITE containment. The e2e now
 * drives a real edit; this pins the mechanism underneath it, where a unit test can hold the cases a
 * browser cannot reach cheaply — a declared background write, a bounded run's own resume bookkeeping,
 * and the removed-key diff.
 *
 * ⚠️ Every assertion here drives the REAL singleton deliberately, because "writes through `appStore`
 * while a sandbox is mounted" IS the defect. A test that drove a sandbox would agree with itself.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
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
  console.log('[R4] real-store write veto (a demo cannot write the user\'s plan)...');
  __resetSandboxScopesForTest();

  // Every refusal reports. Capture rather than silence it: "the write was refused" and "the refusal was
  // announced" are two separate promises, and a guard that drops writes quietly is the failure this
  // whole item is replacing.
  let reports = 0;
  let lastFields = '';
  setErrorReporter((_e, ctx) => {
    if (ctx?.seam !== 'realWriteGuard') return;
    reports++;
    lastFields = ctx.fields ?? '';
  });

  // ── The real store is writable with no sandbox mounted. ──────────────────────────────────────────
  // ⚠️ `cushionFloor` snaps to 25s, so every figure here is a multiple of 25. A value the setter rounds
  // reads as "the write was refused" and would make this file pass for the wrong reason.
  appStore.getState().setCushionFloor(100);
  eq(appStore.getState().store.cushionFloor, 100, 'with no sandbox mounted the real store writes normally');
  // Onboard first, so the `onboardingComplete: false` case below is a real CHANGE. Against the default
  // store that write is a no-op, and a no-op is indistinguishable from a refusal.
  appStore.getState().updatePrefs({ onboardingComplete: true });
  // ⛔ S1.13.7.11 [A3-3] — a bill the REAL plan genuinely holds, added before the scope opens. Without it
  // the only `updateExpense` this file could make was one no id matched, and after A3-3 that write does
  // not happen at all — so the refusal it was meant to prove had nothing to refuse.
  appStore.getState().addExpense({
    id: 'real-bill-0',
    name: 'Rent',
    amount: 850,
    dueDate: '2026-03-01',
    recurrence: 'monthly',
    category: 'housing',
    isPaidThisCycle: false,
  });

  // ── A sandbox is mounted: the SAME call is refused. ──────────────────────────────────────────────
  const leave = enterSandboxScope();
  const blobBefore = appStore.getState().store;

  appStore.getState().setCushionFloor(225);
  eq(appStore.getState().store.cushionFloor, 100, 'the cushion-floor write is REFUSED, not merely reported');
  assert(appStore.getState().store === blobBefore, '…and the store blob identity never moved at all');
  eq(reports, 1, '…and the refusal was reported');
  assert(lastFields.includes('cushionFloor'), '…naming the field it refused');

  // The exact site Sentry caught: an expense edited from inside a demo.
  appStore.getState().addExpense({
    id: 'sbx-bill-0',
    name: 'Utilities',
    amount: 120,
    dueDate: '2026-03-01',
    recurrence: 'monthly',
    category: 'utilities',
    isPaidThisCycle: false,
  });
  eq(appStore.getState().store.requiredExpenses.length, blobBefore.requiredExpenses.length, 'addExpense from a sandboxed subtree appends NOTHING to the real plan');
  eq(reports, 2, '…and that refusal was reported too');

  /**
   * ⛔ **S1.13.7.11 [pass-6 `A3-3`] — THIS BLOCK USED TO PROVE R4 WITH AN INPUT THAT WOULD HAVE BEEN A
   * NO-OP ANYWAY, and the comment that stood here named the reason without treating it as one:**
   * *"`updateExpense` on an id the real plan does not hold still re-stamps read-freshness — `.map()`
   * returns a new array either way."* `A3-3` closed that: an unmatched id now writes nothing at all, so
   * there is no attempt for the guard to refuse and `reports` cannot move.
   *
   * ⚠️ **Removing the refusal assertion here would have quietly weakened R4** — the guard's own finding
   * `B2-1` is *"what actually holds the line is an unrelated flag"*, and this is that shape aimed at the
   * test. So the case is SPLIT rather than dropped: the unmatched id proves `A3-3`, and a **matched** id
   * — one the real plan genuinely holds, so the write would otherwise land — proves the refusal.
   */
  appStore.getState().updateExpense('sbx-bill-0', { amount: 999 });
  assert(appStore.getState().store === blobBefore, 'an unmatched updateExpense writes nothing at all (A3-3)');
  eq(reports, 2, '…so there is no attempt to refuse, and nothing new is reported');

  const realBillId = blobBefore.requiredExpenses[0]?.id;
  assert(!!realBillId, 'the fixture holds a real bill to aim a MATCHED write at');
  appStore.getState().updateExpense(realBillId!, { amount: 999 });
  assert(appStore.getState().store === blobBefore, '⛔ a MATCHED write from inside a sandbox is refused — the plan never moved');
  eq(reports, 3, '…and THAT is the refusal, on a write that would otherwise have landed');

  // ── A bounded run's own resume bookkeeping is still allowed. ─────────────────────────────────────
  // [B3]: the walkthrough persists its position to the REAL store on every step, by design. Refusing
  // that would break resume; reporting it was 100% noise. The allowlist is two keys, and no more.
  appStore.getState().updatePrefs({ tutorialStep: 4 });
  eq(appStore.getState().store.prefs.tutorialStep, 4, 'a walkthrough may still write its resume position');
  eq(reports, 3, '…and that is not reported as a leak');

  appStore.getState().updatePrefs({ onboardingComplete: false });
  eq(appStore.getState().store.prefs.onboardingComplete, true, '…but re-onboarding the user through prefs is refused');
  eq(reports, 4, '…and reported');

  // ── A DECLARED write lands. ─────────────────────────────────────────────────────────────────────
  // Under the old reporter an undeclared background write was a false alarm; under refusal it is
  // DROPPED. Every legitimate writer that can fire mid-run must be wrapped, so the wrapper must work.
  allowRealStoreWrite(() => appStore.getState().setCushionFloor(325));
  eq(appStore.getState().store.cushionFloor, 325, 'a declared real-store write (allowRealStoreWrite) lands');
  eq(reports, 4, '…and is not reported');

  // …and the permission does not outlive the call.
  appStore.getState().setCushionFloor(450);
  eq(appStore.getState().store.cushionFloor, 325, 'the declaration does not leak past its own callback');

  // ── The scope closes. ───────────────────────────────────────────────────────────────────────────
  const leaveInner = enterSandboxScope();
  leaveInner();
  appStore.getState().setCushionFloor(550);
  eq(appStore.getState().store.cushionFloor, 325, 'nesting: the INNER scope closing does not re-open the real store');
  leave();
  appStore.getState().setCushionFloor(675);
  eq(appStore.getState().store.cushionFloor, 675, '…and with every scope released the real store is writable again');

  // ── The diff itself: a REMOVED key is a change. ─────────────────────────────────────────────────
  // A dropped optional field is invisible downstream (`store.windfall ?? 0`), so a single-sided diff
  // would let a sandboxed component delete real money past a backstop looking the other way.
  const base = appStore.getState().store;
  const dropped: typeof base = { ...base, windfall: 500 };
  delete (dropped as Partial<typeof base>).windfall;
  assert(forbiddenRealStoreChanges({ ...base, windfall: 500 }, dropped).includes('windfall'), 'the diff counts a REMOVED plan field as a change');
  const prefsDropped: typeof base = { ...base, prefs: { ...base.prefs } };
  delete (prefsDropped.prefs as Partial<typeof base.prefs>).onboardingComplete;
  assert(
    forbiddenRealStoreChanges(base, prefsDropped).includes('prefs.onboardingComplete'),
    '…and a REMOVED pref too',
  );

  setErrorReporter(() => {});
  __resetSandboxScopesForTest();
  console.log(`✅ [R4] real-store write veto: ${passed} assertions passed.\n`);
}

run();
