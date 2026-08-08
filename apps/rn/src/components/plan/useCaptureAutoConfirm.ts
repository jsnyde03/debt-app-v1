import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';

import { CAPTURE_DEMO } from '@/config/qa';
import { DEMO_STAGES } from '@/store/demoRun';
import { demoSession } from '@/store/demoSession';

/**
 * How long the invitation is left on screen before it is confirmed.
 *
 * The closing beat has to READ before it resolves — a viewer needs to see the debt reach zero and the
 * offer to make it official, or the celebration is a firework with no cause. 2s is the walkthrough's
 * settled "time to understand a change".
 *
 * ⚠️ Trimmed from 2.5s after cycle 13, where the celebration landed in the final TENTH of a second of the
 * cut. The real cause was the script's stage timers running ~4s late on a loaded runner (the conform's
 * ceiling went 25s → 29s for that), but the closing beat is the one place where every accumulated delay
 * lands at once, so it gets the margin too.
 */
const CONFIRM_AFTER_MS = 2000;

/**
 * 3.5.8.6b — in a CAPTURE build, the closing beat confirms itself.
 *
 * **The arc is situation → mechanism → proof → trajectory → TRIUMPH, and the triumph was missing.** The
 * App Preview ended on a "Confirm — it's paid off" button that nothing pressed, so the app's single best
 * moment — the finale, the mesh gradient, the haptics — never appeared in the one asset whose job is to
 * sell it.
 *
 * ⚠️ **Why this was withheld, and why that ground moved (Jason, 2026-08-08).** `demoRun` deliberately
 * reserved the tap for an external capture driver on honesty grounds: a demo must not claim an action its
 * viewer did not take. That constraint was written when the demo was going to SHIP — and [D19] pulled it
 * out of the app entirely, leaving it as the capture and embed vehicle. A marketing video showing what the
 * app does is not claiming the viewer did anything. So the honest objection no longer describes the
 * situation it was written for.
 *
 * The alternative was a driven coordinate tap, which is strictly more truthful and is the machinery that
 * already cost three CI cycles at ~40 minutes each without landing. Chosen against on cost, with the
 * reasoning recorded rather than the choice quietly made.
 *
 * **Scoped as narrowly as it can be:** capture builds only (`CAPTURE_DEMO` is inlined false everywhere
 * else), only while a demo is live, only on the FINAL stage, and only once. It confirms the same debt
 * through the same `confirmPayoff` the button calls — nothing is simulated and no second definition of
 * "a payoff was confirmed" exists.
 *
 * @param debt    the debt the invitation is offering, or undefined when none is
 * @param confirm the screen's own confirm handler — the button's, not a copy
 */
export function useCaptureAutoConfirm<T>(debt: T | undefined, confirm: (debt: T) => void): void {
  const stage = useStore(demoSession, (s) => s.stage);
  const active = useStore(demoSession, (s) => s.active);
  // Once per run. The celebration clears the debt, so a second call would land on nothing — but it would
  // also mean the closing beat had fired twice, which is a thing to prevent rather than survive.
  const fired = useRef(false);

  // `confirm` is an inline arrow in the screen and changes identity every render, so it is read through a
  // ref instead of being a dependency — otherwise the timer below restarts on every render and never runs.
  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;

  const finalStage = DEMO_STAGES[DEMO_STAGES.length - 1].id;

  useEffect(() => {
    if (!CAPTURE_DEMO || !active || fired.current) return;
    if (stage !== finalStage || debt === undefined) return;
    fired.current = true;
    const t = setTimeout(() => confirmRef.current(debt), CONFIRM_AFTER_MS);
    return () => clearTimeout(t);
  }, [active, stage, finalStage, debt]);
}
