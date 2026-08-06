import { appStore } from '@/store/appStore';
import { demoSession } from '@/store/demoSession';
import { isSandboxStore } from '@/store/sandboxStore';

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

  console.log(`✅ demo session: ${passed} assertions passed.\n`);
}

run();
