import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

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

  // ⛔ [M1-8] THE CONSENT ROW AND THE SINK ARE NOW COUPLED, AND THIS IS THE COUPLING.
  //
  // More's "Share anonymous usage" switch was removed because it governed nothing — no sink is ever
  // installed, so the control offered a choice about data that never moves. What that removal creates is
  // a latent hazard pointing the other way: `analyticsOptOut` is absent by default, which reads as
  // opted-IN, so the day a sink is attached telemetry would begin flowing with no control on any screen.
  //
  // So the sink may not gain a production caller silently. This fails the moment one appears, and its
  // message says what to do about it — which is the only way the decision gets re-read by whoever makes
  // it, rather than by whoever finds it afterwards.
  // ⚠️ Comments are blanked and the DEFINING file is skipped. Without both, this guard reports itself:
  // `funnel.ts` declares the function, and `more.tsx` names it in the note explaining why the row is
  // gone — so a bare text scan called the fix its own violation. Same reason `check-native-a11y-props`
  // strips comments: a guard whose documentation trips it gets deleted rather than obeyed.
  const stripComments = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
  const srcDir = join(import.meta.dirname, '..');
  const DEFINES = join(srcDir, 'analytics', 'funnel.ts');
  const callers: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) { if (entry !== 'node_modules') walk(p); continue; }
      if (!/\.tsx?$/.test(p) || /\.test\.tsx?$/.test(p) || p === DEFINES) continue;
      if (/(^|[\\/])(testing|__fixtures__)[\\/]/.test(p)) continue;
      if (stripComments(readFileSync(p, 'utf8')).includes('setFunnelSink')) callers.push(relative(srcDir, p));
    }
  };
  walk(srcDir);
  assert(
    callers.length === 0,
    `setFunnelSink now has a production caller (${callers.join(', ')}) — a sink is being installed, so ` +
      'the "Share anonymous usage" control must return to More in this same commit, and the live privacy ' +
      'page\'s "no behavioral analytics" claim must be retired with it. See the [M1-8] note in more.tsx.',
  );

  console.log(`✅ funnel seam: ${passed} assertions passed.\n`);
}

run();
