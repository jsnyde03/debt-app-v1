import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { appStore } from '@/store/appStore';
import { resumeIndex } from '@/store/tutorialPath';
import { tutorialSession } from '@/store/tutorialSession';
import { qaEnabled } from '@/config/qa';
import { tutorialRunFor, type TutorialRun } from '@/store/tutorialSelectors';

/**
 * 3.5.3.1 — the tutorial LAUNCHER.
 *
 * This route used to host the walkthrough. It no longer does: the beats run as an overlay on the REAL
 * Today tab, because `useGoToTab` calls `useNavigation()` and only behaves inside the tabs navigator —
 * hosting a copy of Today from this Stack route would resolve up through the root and land as a
 * detached tab group, i.e. a blank screen on device (Freedom RN lesson #7).
 *
 * So the route survives purely as the ENTRY: it starts a session (picking up any interrupted step) and
 * hands off to Today.
 *
 * ⚠️ It is NOT how the app itself starts a walkthrough. The More row and the Guardian card's replay
 * affordance both call `startTutorial()` directly. This route exists for the two callers that can only
 * express themselves as a URL: **deep links and the e2e**.
 */
export default function TutorialLauncher() {
  const params = useLocalSearchParams<{ run?: string }>();

  useEffect(() => {
    const real = appStore.getState().store;
    // An explicit `?run=` param pins the run — but ONLY in a QA build. It is a test affordance, and it
    // was reachable in production on a route registered in the production Stack: any free user opening
    // `…/tutorial?run=premium` (a mis-built marketing link, a shared URL) would be handed the PREMIUM
    // finale — "your Guardian does exactly this with every paycheck you add" — a claim that is false of
    // their tier, in place of the free finale that exists for the sole purpose of saying premium is what
    // did the holding. [D9]'s honesty rests entirely on that one string, and a URL could swap it.
    //
    // Gated behind the same `__DEV__ || QA_TOOLS` switch as the scenario harness, so both test hooks on
    // this route disappear together at the Phase-6 flip. Outside QA the run always follows the tier.
    const qa = qaEnabled();
    const run: TutorialRun =
      qa && params.run === 'premium' ? 'premium' : qa && params.run === 'free' ? 'free' : tutorialRunFor(real);

    tutorialSession.getState().start(real, run, resumeIndex(real.prefs.tutorialStep));

    // Get out of the way WITHOUT re-mounting the tab group.
    //
    // `navigate`, not `push`/`replace`/`back`. A deep link arrives with no history at all while the e2e
    // arrives with some, and both must end up on the Today TAB with nothing duplicated: `replace`
    // re-mounted the tab group (two Todays, two overlays — the detached-tab-group class `useGoToTab`
    // documents) and `back`/`dismissAll` landed wherever the caller happened to be. `navigate` targets
    // the existing route if there is one and only creates it otherwise.
    //
    // This route serves the DEEP LINK; the Guardian card's replay and the More row both go through
    // `startTutorial` instead. (Round 5 moved a "three entry points at different stack depths" rationale
    // to `startTutorial` "where it is still true" — it isn't quite: the deep link is the one member that
    // never reaches `startTutorial`, so neither file sees all three. Corrected in both, round 6.)
    router.navigate('/');
    // Mount-only: this route's whole job is to fire once and get out of the way.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
