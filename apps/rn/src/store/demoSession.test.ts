import { appStore } from '@/store/appStore';
import { isDebtProjectedPaidOff } from '@core/debt/projectCurrentBalance';

import { DEMO_STAGES, demoScenario } from '@/store/demoRun';
import { demoSession } from '@/store/demoSession';
import { createSandboxStore, isSandboxStore } from '@/store/sandboxStore';

/**
 * 3.5.4.1 — the demo session's invariants.
 *
 * Scoped to what is genuinely pure. `boundedRun` reaches `tutorialSession`, which imports `expo-router`,
 * and this runner is headless tsx — so the PREDICATE is proven by the e2e instead, and proven better
 * there: it asserts the fences a demo actually engages (tabs held, More withheld) rather than the boolean
 * they read. Asserting the boolean would be a test agreeing with itself, which is the vacuity class this
 * phase found five times.
 *
 * What is left here is the half a refactor breaks silently: the store is really a sandbox, re-entry does
 * not swap it, and `end()` cannot publish a frame where the two halves disagree.
 */

let passed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`❌ ${msg}`);
  passed += 1;
}

function run() {
  console.log('\n▶ demo session + bounded-run predicate');

  demoSession.getState().start();
  const { active, sandbox } = demoSession.getState();
  assert(active, 'start() activates the session');
  assert(sandbox !== null, 'start() creates a sandbox');
  assert(isSandboxStore(sandbox!), 'the demo runs on a SANDBOX store, never the singleton');
  assert(sandbox !== (appStore as unknown), "the demo's store is not the app store");

  // Re-entry must not silently swap the store underneath a running demo: the screen would keep rendering
  // the old sandbox's figures while every write went to a new one.
  const first = demoSession.getState().sandbox;
  demoSession.getState().start();
  assert(demoSession.getState().sandbox === first, 're-entering an active demo keeps the same sandbox');

  // `end()` writes both fields in ONE set. Asserted through a subscription rather than by reading after
  // the fact, because the defect this guards against is a single intermediate FRAME — active true with no
  // sandbox (a fenced screen over the user's real plan), or a sandbox with the fences already down.
  let sawSplit = false;
  const unsub = demoSession.subscribe((s) => {
    if (s.active !== (s.sandbox !== null)) sawSplit = true;
  });
  demoSession.getState().end();
  unsub();
  assert(!sawSplit, 'end() never publishes a frame where active and sandbox disagree');
  assert(!demoSession.getState().active && demoSession.getState().sandbox === null, 'end() clears both halves');

  // ── 3.5.4.6 — the script ────────────────────────────────────────────────────────────────────────
  //
  // THE honesty invariant of the demo, and the one nothing else would catch. Passing `maxGenuineCycles`
  // lets a scripted payday cross the discovery gate so the safety net RELEASES — correct for the
  // walkthrough, which is teaching what the Guardian does over time, and a lie in a demo, where nobody
  // watching has a history the app could have learned from. Held reserves and a scorecard-as-future are
  // the day-one truth; a ceiling here would have the demo claiming results for its viewer.
  //
  // It would also be a silent lie: the run still plays, it just shows a better outcome than a day-one
  // user can have. Exactly the shape of [E6] — a scripted beat that fails convincingly.
  for (const stage of DEMO_STAGES) {
    const scenario = demoScenario(stage);
    assert(scenario.maxGenuineCycles === undefined, `stage "${stage.id}" keeps the day-one bound (reserves HELD)`);
  }

  // [D19] — the arc must LEAVE Today. A preview that never moves is a demo of one feature, and that is
  // the whole reason this script was rebuilt. Asserted on the screens rather than the copy, because the
  // copy will change and the structure is the decision.
  const screens = new Set(DEMO_STAGES.map((s) => s.screen));
  assert(screens.size >= 3, 'the arc visits at least three screens — situation, mechanism, payoff');
  assert(DEMO_STAGES[0].screen === '/money', 'it OPENS on the problem, not on a feature');
  assert(DEMO_STAGES.some((s) => s.screen === '/progress'), 'it reaches Progress, where the debt-free date lives');

  // The closing beat has to leave a debt ONE TAP from zero — `balance > 0` and projecting to `<= 0` — or
  // the payoff invitation never renders and the capture driver has nothing to confirm. Asserted through
  // the same predicate the screen uses, not by eyeballing the numbers: a $40 balance that happens not to
  // project to zero would look right in the store and produce no card.
  const closing = DEMO_STAGES[DEMO_STAGES.length - 1];
  assert(closing.prime !== undefined, 'the closing beat primes a payoff');
  const box = createSandboxStore(demoScenario(closing));
  closing.prime!(box);
  const primed = box.getState().store;
  const invited = primed.debts.filter((d) => isDebtProjectedPaidOff(d, primed.paycheck.currentDate));
  assert(invited.length === 1, 'exactly one debt is primed to the payoff invitation — not none, not all');

  // 3.5.8.4 — the closing prime must leave the debt-free date ALONE, and that is asserted in the e2e
  // (`demo-containment`), not here. It was tried here first and the headless version was WRONG: it
  // compared RAW stores, while Today renders its summary on `withProjectedBalances(store, …)` — the
  // projection that reads the very `balanceAsOfDate` the prime moves. So the raw comparison reported a
  // five-month shift that no viewer can see, on a store no screen uses. Asserting it through the real
  // render is both truthful and immune to which projection each screen picks.

  // Strictly increasing, and the opener is synchronous — a scheduled first stage shows the sandbox's
  // default for a beat first, which is a wasted opening frame on a capture and a flicker in the app.
  assert(DEMO_STAGES[0].at === 0, 'the opening stage is applied synchronously');
  assert(DEMO_STAGES.every((s, i) => i === 0 || s.at > DEMO_STAGES[i - 1].at), 'stages are strictly ordered in time');

  console.log(`✅ demo session: ${passed} assertions passed.\n`);
}

run();
