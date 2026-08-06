/**
 * The "•••" More header action — the ratified IA EVOLVE entry point (no gear, no 5th tab).
 * Present in every tab header for consistent access; opens the More hub (Data / Preferences / About).
 */

import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { useInBoundedRun } from '@/store/boundedRun';
import { icons } from '@/theme/icons';
import { a11yHidden } from '@/utils/a11y';

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
  // Deliberately NOT hidden outside a bounded run: More is the reviewer-findable paywall entry and must
  // stay a stable, always-available affordance ([[feedback_paywall_reviewer_findability]]). A walkthrough
  // or a demo is a transient state the user chose, with an exit permanently on screen.
  //
  // 3.5.4.1 — a demo needs this more than the walkthrough does. `/more` carries **Reset**, and the demo's
  // audience is a stranger evaluating the app: the one route that must not be one tap from a marketing
  // run is the one that can wipe a plan.
  const inBoundedRun = useInBoundedRun();
  return (
    <Pressable
      onPress={() => router.push('/more')}
      disabled={inBoundedRun}
      // Explicit, not inherited from `disabled`. RNW derives `tabIndex` from `disabled`, so the tab-order
      // half of this fence currently holds for a reason unrelated to fencing — change why this is
      // disabled and the control silently rejoins the tab order while still being `aria-hidden`, which is
      // the `aria-hidden-focus` violation. Stating it here makes the fence depend on the fence.
      tabIndex={inBoundedRun ? -1 : undefined}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="More"
      {...a11yHidden(inBoundedRun)}>
      {/* Routed through AppIcon so iOS gets the SF-Symbol ellipsis (more-horiz → ellipsis). */}
      {/* Dimmed while held, so it doesn't read as live-but-broken under the scrim. */}
      <AppIcon name={icons.more} size={24} color={inBoundedRun ? c.text.tertiary : c.text.secondary} />
    </Pressable>
  );
}
