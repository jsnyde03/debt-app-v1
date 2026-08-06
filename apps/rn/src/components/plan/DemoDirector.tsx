import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';

import { DEMO_STAGES } from '@/store/demoRun';
import { demoSession } from '@/store/demoSession';

/**
 * 3.5.4.11 — drives the demo's camera.
 *
 * The script says which screen each beat plays on; this is what moves there. It lives on the UI side
 * rather than inside `demoRun` for a concrete reason: `expo-router` pulls in react-native, and the run and
 * the session are deliberately dependency-free so the headless suite can assert their invariants. Routing
 * belongs where routing already is.
 *
 * **The viewer still cannot navigate.** The tab bar is hidden and `holdTabs` fences the press; what
 * changed at [D19] is that the SCRIPT may move, not that the screen became open. Containment is unchanged
 * — it just stopped applying to the thing doing the demonstrating.
 *
 * Renders nothing.
 */
export function DemoDirector() {
  const active = useStore(demoSession, (s) => s.active);
  const stage = useStore(demoSession, (s) => s.stage);
  // What we last navigated to. Without this, any re-render while a stage is showing re-issues the same
  // navigate — harmless on web, a visible re-entry animation on native, and it would land in the middle of
  // a capture.
  const lastScreen = useRef<string | null>(null);

  useEffect(() => {
    if (!active) {
      lastScreen.current = null;
      return;
    }
    const screen = DEMO_STAGES.find((s) => s.id === stage)?.screen;
    if (!screen || screen === lastScreen.current) return;
    lastScreen.current = screen;
    // `navigate`, not `push`: the tabs are a single navigator and pushing would stack copies of screens
    // the viewer can never pop, which on a capture would show as a back-chevron appearing mid-run.
    router.navigate(screen);
  }, [active, stage]);

  return null;
}
