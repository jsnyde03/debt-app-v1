import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { appStore } from '@/store/appStore';
import { resumeIndex } from '@/store/tutorialPath';
import { tutorialSession } from '@/store/tutorialSession';
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
 * affordance both call `startTutorial()` directly — see `tutorialSession.ts`, which has said so all
 * along. This header claimed all four entry points "still have a stable URL to aim at"; two of them
 * don't aim at a URL at all. What the route is actually for is the two callers that can only express
 * themselves as a URL: **deep links and the e2e**.
 */
export default function TutorialLauncher() {
  const params = useLocalSearchParams<{ run?: string }>();

  useEffect(() => {
    const real = appStore.getState().store;
    // [F] An explicit `?run=` param wins (deep links and the e2e pin a run); otherwise ask
    // `tutorialRunFor`, which is the one definition of who gets which walkthrough.
    const run: TutorialRun =
      params.run === 'premium' ? 'premium' : params.run === 'free' ? 'free' : tutorialRunFor(real);

    tutorialSession.getState().start(real, run, resumeIndex(real.prefs.tutorialStep));

    // Get out of the way WITHOUT re-mounting the tab group.
    //
    // [round-2 E1] Two paragraphs used to sit here asserting opposite mechanisms — one describing a pop
    // guarded by `canGoBack()`, immediately followed by the one below explaining why `navigate` is used
    // instead. Neither a pop nor `canGoBack()` has ever appeared in this file; the first paragraph
    // described an approach that was tried and dropped, and it survived directly above its own
    // replacement. Precisely the defect the claim-vs-code lens exists for, found in the fix block that
    // was correcting that same class elsewhere.
    //
    // `navigate`, not `push`/`replace`/`back`. The three entry points sit at different stack depths —
    // the Guardian card is on Today, the More row is its own Stack route, a deep link has no history —
    // and each needs to end up on the Today TAB with nothing duplicated. `replace` re-mounted the tab
    // group (two Todays, two overlays — the detached-tab-group class `useGoToTab` documents), and
    // `back`/`dismissAll` landed wherever the caller happened to be. `navigate` targets the existing
    // route if there is one and only creates it otherwise, which is the one behaviour all three share.
    router.navigate('/');
    // Mount-only: this route's whole job is to fire once and get out of the way.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
