import { useRef } from 'react';
import { View } from 'react-native';
import type { ReactNode } from 'react';

import { useInert } from '@/hooks/use-inert';
import { useTutorialSession } from '@/store/tutorialSession';
import { a11yHidden } from '@/utils/a11y';

/**
 * Keep a subtree OUT of the accessibility tree for the whole of a walkthrough session.
 *
 * The counterpart to `TutorialTarget`'s `control` prop, for the much larger set of controls the
 * walkthrough never coaches. On the five scripted beats the screen-level fence already hides everything;
 * on the two INTERACTIVE beats it is deliberately open so the user can reach the real control — and every
 * other control on Today was open along with it. A VoiceOver user on beat 3 could swipe to "Edit
 * paycheck" and double-tap, putting a Modal on top of the live overlay; or toggle a Mark-paid row and
 * re-stage the very card the beat is narrating. Round 5 listed both of these as leaks and then fixed only
 * the two that happened to be coached subjects, because the registry can only reach coached subjects.
 *
 * A denylist rather than an allowlist because RN leaves no choice: `accessibilityElementsHidden` hides
 * descendants with no way for a child to opt back in, so "hide the whole screen except the coached
 * control" is not expressible. Wrapping REGIONS rather than individual controls is what stops this
 * becoming the one-member fix a sixth time — anything added inside one of these inherits the fence.
 *
 * Keyed on the SESSION, not on the registry's `activeId`: `activeId` is published by an effect, so it is
 * null for the opening frame(s) of every beat, and a fence that is briefly open is not a fence. It is
 * also not keyed on `isExample` (the sandbox brand), because the sandbox is designed to render without
 * any overlay in 3.5.4's demo and 3.5.7's web demo, where nothing should be fenced at all.
 */
export function TutorialFence({ children }: { children: ReactNode }) {
  const inWalkthrough = useTutorialSession((s) => s.active);
  // `aria-hidden` alone leaves every control in here tabbable on web — see `useInert`.
  const ref = useRef<View>(null);
  useInert(ref, inWalkthrough);
  return (
    <View ref={ref} {...a11yHidden(inWalkthrough)}>
      {children}
    </View>
  );
}
