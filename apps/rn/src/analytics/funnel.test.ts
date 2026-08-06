import { setFunnelSink, track, type FunnelEvent } from '@/analytics/funnel';
import { appStore } from '@/store/appStore';

/**
 * 3.5.4.9 [D-A] — the seam's two promises.
 *
 * "No financial data" is enforced by the TYPE, not by a test: the event union is closed over literals, so
 * a balance cannot be passed without a compile error, and a runtime assertion here would be weaker than
 * what already holds. What a test can pin is the behaviour a refactor breaks silently — that nothing is
 * sent when nothing is listening, and that the user's choice is honoured at the choke point rather than
 * at every call site individually.
 */

let passed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`❌ ${msg}`);
  passed += 1;
}

function run() {
  console.log('\n▶ funnel seam');

  const seen: FunnelEvent[] = [];
  const optOutBefore = appStore.getState().store.prefs.analyticsOptOut;

  // No sink: the v1.7 build. Nothing may be emitted, and nothing may throw — every call site runs this.
  setFunnelSink(null);
  appStore.getState().updatePrefs({ analyticsOptOut: false });
  track({ name: 'demo_started', source: 'welcome' });
  assert(seen.length === 0, 'with no sink installed, nothing is emitted');

  setFunnelSink((e) => seen.push(e));
  track({ name: 'demo_started', source: 'paywall' });
  assert(seen.length === 1 && seen[0].name === 'demo_started', 'an installed sink receives events');

  // The opt-out is honoured HERE, so no call site can forget it.
  appStore.getState().updatePrefs({ analyticsOptOut: true });
  track({ name: 'demo_completed' });
  track({ name: 'tutorial_started', audience: 'free' });
  assert(seen.length === 1, 'an opted-out user emits nothing, whatever the call site does');

  appStore.getState().updatePrefs({ analyticsOptOut: false });
  track({ name: 'demo_exited', reason: 'unlock_premium' });
  assert(seen.length === 2, 'turning it back on resumes');

  setFunnelSink(null);
  appStore.getState().updatePrefs({ analyticsOptOut: optOutBefore });

  console.log(`✅ funnel seam: ${passed} assertions passed.\n`);
}

run();
