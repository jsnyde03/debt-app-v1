import { Pressable, Text, View } from 'react-native';
import { useStore } from 'zustand';

import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { exitDemo } from '@/store/demoExit';
import { demoSession } from '@/store/demoSession';
import { isSandboxStore } from '@/store/sandboxStore';
import { useActiveStore } from '@/store/StoreContext';
import { tutorialSession } from '@/store/tutorialSession';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** The one sentence, so the spoken and written halves cannot drift. */
export const EXAMPLE_MONEY = 'Example money';

/**
 * 3.5.4.3 — the canvas-level marker: this screen's figures are not the user's.
 *
 * The card chip marks the CARD. Everything else a sandbox renders — the hero's paycheck figure, required
 * and recommended actions, affordability, Recovery — carried nothing, and `personalScenario` seeds the
 * user's real debts BY NAME into fabricated states. A screenshot cropped below the Guardian card's title
 * row was indistinguishable from a real plan in trouble. That was survivable while a sandbox could only
 * render under the walkthrough's overlay, whose dock says "Example money" on every beat; 3.5.4.1 added an
 * overlay-less render path, and it is also the path an App Preview gets recorded from.
 *
 * **It marks the SCREEN, not a screen.** `Screen` renders this unconditionally and it decides for itself,
 * so a surface a demo can reach cannot forget to carry it — including surfaces that do not exist yet. The
 * alternative, a prop each screen passes, is the shape this phase has been bitten by over and over: a
 * class closed at some of its members.
 *
 * Keyed on `isSandboxStore` — the MONEY being fictional — never on a session. A marker that keys on the
 * session dies exactly where it is needed most, which is the defect this replaces.
 */
export function ExampleCanvasMarker() {
  const c = useAppColors();
  const isExample = isSandboxStore(useActiveStore());
  // The walkthrough's dock already says this on every beat, in a line that is always on screen. Two
  // markers is chrome, and [D6] settled that the disclosure should be quiet.
  const inWalkthrough = useStore(tutorialSession, (s) => s.active);
  const inExplore = useStore(demoSession, (s) => s.active && s.mode === 'explore');
  if (!isExample || inWalkthrough) return null;

  return (
    // OUTSIDE the scroll body by construction — `Screen` mounts this between the header and the
    // scroller. A marker that scrolls away is the failure 3.5.3.11 named: the entry copy alone scrolls
    // off, and by the tight beats a real-looking figure is on screen in a frightening state with nothing
    // beside it saying the money is invented.
    //
    // `header` role, not decorative: it is the one thing a screen-reader user needs in order to trust
    // everything below it, and the rotor is how they would find it after arriving mid-screen.
    <View
      accessibilityRole="header"
      style={{
        paddingHorizontal: spacing.base,
        paddingBottom: spacing.xs,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
      }}>
      <Text testID="example-canvas-marker" style={[textStyles.caption, { color: c.text.tertiary }]}>
        {EXAMPLE_MONEY}
      </Text>
      {/* 3.5.10 — the EXPLORE run's way out.
          The scripted run has a dock carrying its exits; explore has no dock, and a demo a user can walk
          around needs an exit that is on screen wherever they walked TO. This row already is: `Screen`
          mounts it above the scroller on every surface a sandbox can reach, so the exit inherits that
          reach for free rather than needing its own always-on chrome.
          ⚠️ `exitDemo` ends the session BEFORE navigating ([D18]) — the destination must never render with
          the sandbox still mounted. */}
      {/* R3 (🎯 2026-08-20, found by USING it) — the exit is labelled for WHO IS READING IT.
          It used to say "Start my real plan" to everyone. The paywall's "See it in action" is reached
          mostly by users who ALREADY have a plan, and to them that reads as *discard what I have and start
          over* — so the only way out looked destructive and the demo felt like a trap. It was in fact safe
          (the route guard bounces an onboarded user to the tabs), but nothing on screen said so.
          ⛔ The flag is read from the REAL store on purpose. This component renders INSIDE the sandbox, so
          the active store is the persona's — asking it would answer "has the DEMO onboarded", which is a
          question about a fiction. `getState()` rather than a subscription because the real flag cannot
          change while a demo is running: every exit ends the session before it navigates ([D18]). */}
      {inExplore ? (
        (() => {
          const hasRealPlan = appStore.getState().store.prefs.onboardingComplete === true;
          return (
            <Pressable
              onPress={() => exitDemo(hasRealPlan ? '/' : '/onboarding')}
              accessibilityRole="button"
              testID="demo-explore-exit"
              hitSlop={8}>
              <Text style={[textStyles.caption, { color: c.accent.primary, fontWeight: '600' }]}>
                {hasRealPlan ? 'Back to my plan' : 'Start my real plan'}
              </Text>
            </Pressable>
          );
        })()
      ) : null}
    </View>
  );
}
