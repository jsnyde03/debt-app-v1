import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { track } from '@/analytics/funnel';
import { EXAMPLE_MONEY } from '@/components/plan/ExampleCanvasMarker';
import { CAPTURE_DEMO, isDemoReachable } from '@/config/qa';
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
  const { from, capture, mode } = useLocalSearchParams<{ from?: string; capture?: string; mode?: string }>();
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
    //
    // 3.5.8.9 — the clock is held on `CAPTURE_DEMO`, NOT on `?capture=1`, and the distinction is the
    // whole correctness argument. `CaptureSlate` is the only thing that releases a held clock and it is
    // inlined out of every non-capture build, so holding on the query param strands the run forever
    // anywhere else — which is exactly what it did: the e2e drives `/demo?capture=1` against the web
    // export, where there is no capture flag, and the demo sat on beat 1 for the whole spec.
    //
    // Two conditions that must agree are one condition. `?capture=1` keeps the job it can do alone —
    // stripping the chrome, which 3.5.7's marketing embed will also want without being a capture build.
    // 3.5.10 — WHICH demo, decided here, by who is watching.
    //
    // A real user gets `explore`: the sandbox seeded and then left alone, tabs live, no script. The
    // SCRIPTED run is for the two audiences that need a fixed 25 seconds — the App-Preview capture and
    // 3.5.7's marketing embed — and both arrive with `?mode=scripted` or the capture flag.
    //
    // ⚠️ This is the fix for one artifact doing two jobs. The scripted run was built to be a video, then
    // shipped to users as "try it"; the video's requirements won because they came first, and what a user
    // got was an app-preview they could not touch.
    // `?capture=1` implies scripted: stripping the chrome only makes sense for a recording, and the e2e
    // drives that param against a web export where `CAPTURE_DEMO` is false — so keying on the flag alone
    // would hand the capture path an explore run with no script to record.
    const scripted = CAPTURE_DEMO || capture === '1' || mode === 'scripted';
    demoSession.getState().start({
      chrome: capture !== '1',
      holdClock: CAPTURE_DEMO,
      mode: scripted ? 'scripted' : 'explore',
    });
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
  }, [enabled, from, capture, mode]);

  if (!enabled) return <Redirect href="/" />;
  if (!started) return null;
  // The FIRST STAGE's screen, not a hardcoded `/(tabs)`. Hardcoding it raced `DemoDirector`: this redirect
  // and the director's first navigate fired together, the redirect won, and the run sat on Today for the
  // whole opening beat. The e2e passed anyway, because it asserted Today content — a test agreeing with a
  // bug. Landing on the arc's own opening screen removes the race rather than sequencing it.
  return <Redirect href={DEMO_STAGES[0].screen} />;
}
