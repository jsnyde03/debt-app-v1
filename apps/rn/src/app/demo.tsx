import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { QA_TOOLS } from '@/config/qa';
import { demoSession } from '@/store/demoSession';

/**
 * 3.5.4.2 — the demo entry.
 *
 * This route exists to START a session and get out of the way. It renders no UI of its own: [D18] made
 * the demo a kiosk over the real Today screen, the same in-situ decision the walkthrough is built on, and
 * for the same reason — hosting a COPY of Today in a Stack route lands a detached tab group and a blank
 * screen on device (Freedom RN lesson #7, and the note in the root layout). So it seeds the sandbox, then
 * redirects into the tabs, which now resolve to that sandbox through the hoisted provider.
 *
 * ⚠️ Gated `__DEV__ || QA_TOOLS`, the same one switch the sandbox harness and the Live-Activity QA
 * controls use — so it disappears at the Phase-6 flip with `git grep QA_TOOLS` and not a second lever.
 * The pre-purchase entry points that make this reachable by a real user (Welcome slot, paywall
 * "See it in action") land at 3.5.4.7, once there is a scripted run worth entering.
 */
export default function DemoEntry() {
  const enabled = (typeof __DEV__ !== 'undefined' && __DEV__) || QA_TOOLS;
  // Start in an effect, not during render: `demoSession.start()` sets state, and the route guard in the
  // root layout reads it — writing another store mid-render is the loop this codebase has already paid
  // for once. `started` keeps the redirect from firing before the sandbox exists, which would land on a
  // guard that has not opened yet.
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    demoSession.getState().start();
    setStarted(true);
  }, [enabled]);

  if (!enabled) return <Redirect href="/" />;
  if (!started) return null;
  return <Redirect href="/(tabs)" />;
}
