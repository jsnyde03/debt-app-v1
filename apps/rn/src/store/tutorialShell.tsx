import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { TargetRect } from '@/hooks/spotlightGeometry';

/**
 * 3.5.3.5.7 — the seam between the coaching overlay and the screen it coaches.
 *
 * The overlay used to render INSIDE the Today screen, which meant its scrim could only ever cover what
 * Today itself occupies. On the iPad regular layout the tab bar becomes a left sidebar RAIL that belongs
 * to the navigator, not to the screen — so the rail sat fully lit beside a dimmed screen.
 *
 * Mounting the overlay above the tab navigator fixes that, but splits one job across two places: the
 * SCREEN knows where the beat's subject is (it owns the scroller and the target registry), while the
 * OVERLAY knows how tall its coaching dock is — and each needs the other's answer. This context is that
 * exchange, and nothing more.
 *
 * ⚠️ What deliberately did NOT move: Today itself. 3.5.3.1 put the walkthrough inside the tabs because
 * hosting a COPY of Today in a Stack route lands a detached tab group — a blank screen on device
 * (Freedom RN lesson #7). That risk is about hosting the SCREEN; hoisting the overlay view doesn't touch
 * it, and Today still renders exactly where it always did.
 */

interface TutorialShell {
  /** Where the current beat's subject landed, in window coordinates. Published by the screen. */
  spotlight: TargetRect | null;
  setSpotlight(rect: TargetRect | null): void;
  /** [D4] Is a stage-scroll in flight? `spotlight` is null both while the subject TRAVELS and when it
   *  doesn't exist at all, and the overlay owes those two cases opposite scrims — so the screen has to
   *  say which null this is. Carried as its own boolean rather than folded into `spotlight` so the ~6
   *  rect consumers keep their existing shape. */
  settling: boolean;
  setSettling(settling: boolean): void;
  /** Should the cutout pass TOUCHES, not just light? Only when the hole sits over a control the beat is
   *  asking the user to operate. The overlay knows the beat is interactive; only the SCREEN knows the
   *  spotlight has moved off that control onto the beat's payoff, which is a thing to read, not tap. */
  passThrough: boolean;
  setPassThrough(passThrough: boolean): void;
  /** The coaching dock's measured height — the screen needs it to know where the usable stage ends. */
  dockH: number;
  setDockH(height: number): void;
  /** The beat's earned payoff, if the user has produced one. Derived from the sandbox, so the SCREEN
   *  computes it and the overlay only displays it. */
  impact: { before: number; after: number; freed: number } | null;
  setImpact(impact: { before: number; after: number; freed: number } | null): void;
}

const TutorialShellContext = createContext<TutorialShell | null>(null);

export function TutorialShellProvider({ children }: { children: ReactNode }) {
  const [spotlight, setSpotlight] = useState<TargetRect | null>(null);
  const [settling, setSettling] = useState(false);
  const [passThrough, setPassThrough] = useState(false);
  const [dockH, setDockH] = useState(0);
  const [impact, setImpact] = useState<TutorialShell['impact']>(null);
  const value = useMemo(
    () => ({ spotlight, setSpotlight, settling, setSettling, passThrough, setPassThrough, dockH, setDockH, impact, setImpact }),
    [spotlight, settling, passThrough, dockH, impact],
  );
  return <TutorialShellContext.Provider value={value}>{children}</TutorialShellContext.Provider>;
}

/** Null outside the tab layout, so a screen rendered elsewhere degrades rather than throwing. */
export function useTutorialShell(): TutorialShell | null {
  return useContext(TutorialShellContext);
}
