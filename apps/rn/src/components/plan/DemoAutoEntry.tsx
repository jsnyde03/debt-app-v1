import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';

import { CAPTURE_DEMO, EMBED_DEMO } from '@/config/qa';
import { demoSession } from '@/store/demoSession';

/**
 * 3.5.8.3 + 3.5.7.5 — the builds that enter the demo BY THEMSELVES.
 *
 * Two of them, and they want different runs:
 *   - the App-Preview CAPTURE build → `/demo?capture=1`     chrome stripped, clock held for the recording
 *   - the web marketing EMBED build → `/demo?mode=scripted` chrome kept, clock free
 *
 * ⛔ ONE COMPONENT, NOT TWO, and that is the whole reason this file replaced `CaptureAutoStart`. The
 * original's own comment states the rule it was protecting: *"a second starter would be a second
 * definition of entering the demo — the exact shape `isDemoReachable()` was written to prevent, where an
 * entry outlives or diverges from its destination."* Adding an `EmbedAutoStart` beside it would have
 * broken that rule while quoting it. So the component answers one question — *does this build enter the
 * demo on its own, and where* — and `demo.tsx` remains the single entry that starts the session, decides
 * chrome, fires the funnel event and makes the a11y announcement.
 *
 * ⚠️ THE DESTINATION IS A QUERY STRING, NOT A SECOND SET OF SESSION ARGUMENTS. Both builds route through
 * `/demo`, so neither can drift from what a real user's demo does. `demo.tsx` already reads
 * `mode=scripted` and already names this build as one of its two scripted audiences.
 *
 * Inert in every ordinary build: both flags are inlined false by Metro, so the effect returns before it
 * does anything and no route is ever replaced.
 */
export function DemoAutoEntry() {
  const active = useStore(demoSession, (s) => s.active);
  // Once per launch. Without it, ending the demo (or any re-render after it) would re-enter immediately
  // and the build could never be used for anything else — including looking at what it shipped.
  const started = useRef(false);

  useEffect(() => {
    if (active || started.current) return;
    // ⚠️ CAPTURE WINS IF BOTH ARE SOMEHOW SET. A recording that quietly gained the embed's chrome would
    // ship a dock into a store video, which is a visible defect in a submitted asset; an embed that
    // quietly lost its dock is a page with no exit. Neither is acceptable, but only one of them is
    // reviewed by Apple, so the tie-break is explicit rather than whichever `if` came first.
    const href = CAPTURE_DEMO ? '/demo?capture=1' : EMBED_DEMO ? '/demo?mode=scripted' : null;
    if (!href) return;
    started.current = true;
    // `replace`, not `push`: the launch destination IS the demo, and leaving onboarding on the stack
    // would put a back-chevron in a store video — and, in the embed, an exit into a stranger's
    // onboarding flow.
    router.replace(href);
  }, [active]);

  return null;
}
