import { Text, View } from 'react-native';
import { useStore } from 'zustand';

import { useAppColors } from '@/hooks/use-app-colors';
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
  if (!isExample || inWalkthrough) return null;

  return (
    // OUTSIDE the scroll body by construction — `Screen` mounts this between the header and the
    // scroller. A marker that scrolls away is the failure 3.5.3.11 named: the entry copy alone scrolls
    // off, and by the tight beats a real-looking figure is on screen in a frightening state with nothing
    // beside it saying the money is invented.
    //
    // `header` role, not decorative: it is the one thing a screen-reader user needs in order to trust
    // everything below it, and the rotor is how they would find it after arriving mid-screen.
    <View accessibilityRole="header" style={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xs }}>
      <Text testID="example-canvas-marker" style={[textStyles.caption, { color: c.text.tertiary }]}>
        {EXAMPLE_MONEY}
      </Text>
    </View>
  );
}
