import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { track } from '@/analytics/funnel';
import { EXAMPLE_MONEY } from '@/components/plan/ExampleCanvasMarker';
import { isDemoReachable } from '@/config/qa';
import { DEMO_STAGES } from '@/store/demoRun';
import { demoSession } from '@/store/demoSession';
import { announce } from '@/utils/a11y';

/**
 * 3.5.4.2 — the demo entry.
 *
 * This route exists to START a session and get out of the way. It renders no UI of its own: [D18] made
 * the demo a kiosk over the real Today screen, the same in-situ decision the walkthrough is built on, and
 * for the same reason — hosting a COPY of Today in a Stack route lands a detached tab group and a blank
 * screen on device (Freedom RN lesson #7, and the note in the root layout). So it seeds the sandbox, then
 * redirects into the tabs, which now resolve to that sandbox through the hoisted provider.
 *
 * Reachability is `isDemoReachable()` — one lever, shared with the entries that offer it. A real user
 * gets this in v1.7 (Jason, 2026-08-06), reached from the Welcome slot and the paywall's
 * "See it in action".
 */
export default function DemoEntry() {
  // `isDemoReachable()`, not a second copy of its expression. This route had its own inline version while
  // `qa.ts` claimed to be the one definition — the claim was false the moment the second one was written,
  // and it is the shape that lets an entry point outlive its destination.
  const { from, capture } = useLocalSearchParams<{ from?: string; capture?: string }>();
  const enabled = isDemoReachable();
  // Start in an effect, not during render: `demoSession.start()` sets state, and the route guard in the
  // root layout reads it — writing another store mid-render is the loop this codebase has already paid
  // for once. `started` keeps the redirect from firing before the sandbox exists, which would land on a
  // guard that has not opened yet.
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    // `?capture=1` strips the demo's own chrome — the App-Preview pipeline (3.5.8) launches with it, the
    // marketing embed (3.5.7) does not.
    demoSession.getState().start({ chrome: capture !== '1' });
    setStarted(true);
    // `?from=` names the entry, because the funnel's first question is which door people come through and
    // the route cannot infer it. Anything unrecognised is `direct` rather than trusted — a query string is
    // user-editable, and this union is the guarantee that a funnel event carries nothing else.
    track({ name: 'demo_started', source: from === 'welcome' || from === 'paywall' ? from : 'direct' });
    // 3.5.4.3 — said once, on the way in. The persistent marker is a header a screen-reader user can find
    // with the rotor, but only if they think to look; the one moment they are guaranteed to be listening
    // is the transition that brought them here. The written and spoken halves share `EXAMPLE_MONEY` so
    // they cannot drift into saying different things about the same money.
    announce(`${EXAMPLE_MONEY}. This is a demonstration with sample figures.`);
  }, [enabled, from, capture]);

  if (!enabled) return <Redirect href="/" />;
  if (!started) return null;
  // The FIRST STAGE's screen, not a hardcoded `/(tabs)`. Hardcoding it raced `DemoDirector`: this redirect
  // and the director's first navigate fired together, the redirect won, and the run sat on Today for the
  // whole opening beat. The e2e passed anyway, because it asserted Today content — a test agreeing with a
  // bug. Landing on the arc's own opening screen removes the race rather than sequencing it.
  return <Redirect href={DEMO_STAGES[0].screen} />;
}
