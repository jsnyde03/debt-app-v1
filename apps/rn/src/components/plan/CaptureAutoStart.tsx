import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';

import { CAPTURE_DEMO } from '@/config/qa';
import { demoSession } from '@/store/demoSession';

/**
 * 3.5.8.3 — in a CAPTURE build, the app starts the demo itself.
 *
 * The App-Preview pipeline used to deep-link in. It cannot: `xcrun simctl openurl` on a custom scheme
 * makes iOS raise a confirmation dialog that nothing unattended dismisses, frontmost app or not. So the
 * capture build is launched (`simctl launch`, which raises nothing) and comes up here.
 *
 * **It navigates to `/demo?capture=1` rather than calling `demoSession.start()` directly**, and that is
 * the whole design. `demo.tsx` is the one entry: it starts the session, decides chrome from the query
 * param, fires the funnel event and makes the a11y announcement. A second starter would be a second
 * definition of "entering the demo" — the exact shape `isDemoReachable()` was written to prevent, where
 * an entry outlives or diverges from its destination.
 *
 * Inert in every real build: `CAPTURE_DEMO` is inlined false by Metro, so this returns before the effect
 * does anything.
 *
 * Renders nothing.
 */
export function CaptureAutoStart() {
  const active = useStore(demoSession, (s) => s.active);
  // Once per launch. Without it, ending the demo (or any re-render after it) would re-enter immediately
  // and the build could never be used for anything else — including looking at what it shipped.
  const started = useRef(false);

  useEffect(() => {
    if (!CAPTURE_DEMO || active || started.current) return;
    started.current = true;
    // `replace`, not `push`: the launch destination is the demo, and leaving onboarding on the stack
    // would put a back-chevron in a store video.
    router.replace('/demo?capture=1');
  }, [active]);

  return null;
}
