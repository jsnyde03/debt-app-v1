/**
 * The "•••" More header action — the ratified IA EVOLVE entry point (no gear, no 5th tab).
 * Present in every tab header for consistent access; opens the More hub (Data / Preferences / About).
 */

import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { useTutorialSession } from '@/store/tutorialSession';
import { icons } from '@/theme/icons';

export function MoreButton() {
  const c = useAppColors();
  // Fenced off for the duration of a walkthrough — and fenced in the A11Y TREE, not just visually.
  //
  // The scrim blocks a finger, but a VoiceOver double-tap dispatches straight to the focused element and
  // never goes through hit-testing. On the two interactive beats the coached screen is deliberately left
  // exposed so the user can reach the real control, and this button was exposed along with it: swipe
  // past "Adjust your line", double-tap More, and a route pushes out from under the still-mounted
  // overlay. That is the same leak 3.5.3.5.9 closed for touch, still open for the users the a11y work
  // was for. One shared component, so one fix covers every tab header.
  //
  // Deliberately NOT hidden outside a session: More is the reviewer-findable paywall entry and must stay
  // a stable, always-available affordance ([[feedback_paywall_reviewer_findability]]). A walkthrough is
  // a transient state the user chose, with Skip permanently on screen.
  const inTutorial = useTutorialSession((s) => s.active);
  return (
    <Pressable
      onPress={() => router.push('/more')}
      disabled={inTutorial}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="More"
      accessibilityElementsHidden={inTutorial}
      importantForAccessibility={inTutorial ? 'no-hide-descendants' : 'auto'}>
      {/* Routed through AppIcon so iOS gets the SF-Symbol ellipsis (more-horiz → ellipsis). */}
      <AppIcon name={icons.more} size={24} color={c.text.secondary} />
    </Pressable>
  );
}
