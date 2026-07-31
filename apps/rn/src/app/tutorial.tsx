import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { appStore } from '@/store/appStore';
import { resumeIndex } from '@/store/tutorialPath';
import { tutorialSession } from '@/store/tutorialSession';
import type { TutorialRun } from '@/store/tutorialSelectors';

/**
 * 3.5.3.1 — the tutorial LAUNCHER.
 *
 * This route used to host the walkthrough. It no longer does: the beats run as an overlay on the REAL
 * Today tab, because `useGoToTab` calls `useNavigation()` and only behaves inside the tabs navigator —
 * hosting a copy of Today from this Stack route would resolve up through the root and land as a
 * detached tab group, i.e. a blank screen on device (Freedom RN lesson #7).
 *
 * So the route survives purely as the ENTRY: it starts a session (picking up any interrupted step) and
 * hands off to Today. Keeping it means the deep link, the More row, the card's replay affordance and
 * the e2e all still have a stable URL to aim at — they simply arrive somewhere else now.
 */
export default function TutorialLauncher() {
  const params = useLocalSearchParams<{ run?: string }>();

  useEffect(() => {
    const real = appStore.getState().store;
    const run: TutorialRun =
      params.run === 'premium' ? 'premium' : params.run === 'free' ? 'free' : real.subscriptionPlan === 'premium' ? 'premium' : 'free';

    tutorialSession.getState().start(real, run, resumeIndex(real.prefs.tutorialStep));

    // Get out of the way WITHOUT re-mounting the tab group. `router.replace('/')` from a pushed Stack
    // route renders `(tabs)` a SECOND time — two Todays, two overlays — which is the duplicate/detached
    // tab-group failure `useGoToTab` documents (Freedom RN lesson #7), reproduced here in the e2e.
    // Popping returns to the Today that's already mounted; `replace` is only for a cold deep link with
    // no history to pop. Third time this session that `canGoBack()` has been the right guard.
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
