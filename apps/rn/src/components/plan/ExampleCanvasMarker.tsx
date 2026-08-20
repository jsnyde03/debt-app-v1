import { Text, View } from 'react-native';
import { useStore } from 'zustand';

import { Pill } from '@/components/ui/Pill';
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
      {/* ⛔ [P6.4.4 · 🎯 2026-08-20] R3 fixed what this exit SAYS and left it a line of `caption` text.
          🎯's original report was that an exit *"was not obvious"* going to the demo from More → premium,
          and a relabel answers "what does it mean once found", never "can I find it". ⚡ The comment above
          reasons entirely about REACH — *"on screen wherever they walked TO"* — and never asks whether it
          is visible on any of those screens. The scripted run gets a dock with a full-width Button; the
          explore run got small text. **That asymmetry was the defect.**

          ⛔ The usual objection does not apply here: a prominent exit competes with demo content only on a
          MARKETING surface, and explore never is one. Explore is reached from Welcome and from the paywall
          — both inside the installed app; the embed and capture runs are `scripted` (`DemoAutoEntry`). So
          nothing is traded away by making this obvious.

          ⚠️ `Pill` rather than a new affordance — it is the house primitive for an in-row control, stays
          one line so the persistent chrome does not grow, and keeps `testID` + both labels EXACTLY as they
          were, because `09-demo-explore.yaml` drives the id and `demo-containment.spec.ts` asserts the
          text. ⛔ `demo-containment` has 14 tests, two aimed at this path, and both passed while the exit
          was unusable: a suite can prove an exit is present and reachable and say nothing about whether a
          human can see it. */}
      {inExplore ? (
        (() => {
          const hasRealPlan = appStore.getState().store.prefs.onboardingComplete === true;
          return (
            <Pill
              label={hasRealPlan ? 'Back to my plan' : 'Start my real plan'}
              tone="action"
              testID="demo-explore-exit"
              onPress={() => exitDemo(hasRealPlan ? '/' : '/onboarding')}
            />
          );
        })()
      ) : null}
    </View>
  );
}
