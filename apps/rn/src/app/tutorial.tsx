import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Motion } from '@/motion/Motion';
import { Screen } from '@/components/screen';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { TUTORIAL_MAX_CYCLES } from '@/store/sandboxBeats';
import { harnessScenario, publishSandbox, unpublishSandbox } from '@/store/sandboxHarness';
import { scenarioFor } from '@/store/sandboxScenarios';
import { createSandboxStore } from '@/store/sandboxStore';
import {
  isLastStep,
  nextIndex,
  prevIndex,
  resumeIndex,
  stepAnnouncement,
  TUTORIAL_STEPS,
  TUTORIAL_STEP_COUNT,
} from '@/store/tutorialPath';
import { markTutorialSeen, type TutorialRun } from '@/store/tutorialSelectors';
import { useAppStore } from '@/store/useAppStore';
import { useSandboxStore } from '@/store/useSandboxStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { announce, headerProps } from '@/utils/a11y';

/**
 * 3.5.1/3.5.2 — the Guardian tutorial route.
 *
 * 3.5.1 gave it entry, the sandbox lifecycle and the seen-flag. **3.5.2 adds the PATH**: stepping,
 * skip, interrupt-resume, and the accessibility contract — every step reachable and operable by
 * VoiceOver, announced on entry, and calm under Reduce Motion. The beats' actual content is 3.5.3's;
 * the copy here is placeholder by design.
 *
 * Everything renders from a SANDBOX, never the real store, so nothing done here touches the user's plan.
 *
 * A11y notes worth keeping: the step title carries `headerProps` so the VoiceOver rotor can jump by
 * heading; `announce()` fires on every step change because the transition is otherwise MOTION-ONLY and
 * a screen-reader user would get no signal at all; and the controls sit outside any grouped element so
 * each is reachable as its own button (the MF.2 lesson).
 */
export default function TutorialScreen() {
  const c = useAppColors();
  const params = useLocalSearchParams<{ run?: string }>();
  const realStore = useAppStore((s) => s.store);
  const run: TutorialRun =
    params.run === 'premium' ? 'premium' : params.run === 'free' ? 'free' : realStore.subscriptionPlan === 'premium' ? 'premium' : 'free';

  // Resume where they left off. Read ONCE on mount: re-reading would yank a user back mid-step as the
  // pref updates beneath them.
  const [index, setIndex] = useState(() => resumeIndex(realStore.prefs.tutorialStep));

  const sandbox = useMemo(() => {
    const scenario =
      harnessScenario({ maxGenuineCycles: TUTORIAL_MAX_CYCLES }) ??
      scenarioFor(realStore, 'clear', { premium: run === 'premium', maxGenuineCycles: TUTORIAL_MAX_CYCLES });
    const store = createSandboxStore(scenario);
    publishSandbox(store, scenario.id);
    return store;
    // Mount-only: rebuilding the sandbox when the real store changes would restart the lesson mid-step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = TUTORIAL_STEPS[index];

  // The step change is motion-only, so announce it — otherwise VoiceOver users hear nothing move.
  useEffect(() => {
    announce(stepAnnouncement(index));
  }, [index]);

  useEffect(() => () => unpublishSandbox(), []);

  /** Persist the resume point as they move, so an interruption keeps their place. */
  const goTo = (next: number) => {
    setIndex(next);
    appStore.getState().updatePrefs({ tutorialStep: next });
  };

  /**
   * Leaving — by finishing, skipping, or backing out — all record the run as seen and CLEAR the resume
   * point. A completed walkthrough that resumed at its last step would otherwise reopen there forever.
   */
  const leave = () => {
    const prefs = appStore.getState().store.prefs;
    appStore.getState().updatePrefs({ ...markTutorialSeen(prefs, run), tutorialStep: null });
    // Same cold-entry guard as the payoff-schedule route (3.7.A0): this is reachable directly (More,
    // a deep link, a QA harness run), and with no history `router.back()` silently no-ops — leaving the
    // user stuck on a walkthrough whose Finish button does nothing. Caught by the 3.5.2 e2e.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const sandboxDate = useSandboxStore(sandbox, (s) => s.store.paycheck.currentDate);
  const sandboxFloor = useSandboxStore(sandbox, (s) => s.store.cushionFloor);
  const last = isLastStep(index);

  return (
    <Screen title="How your Guardian works" onBack={leave}>
      <View style={styles.body} testID="tutorial-scaffold">
        {/* Position first, and as text — a screen-reader user has no progress dots to glance at. */}
        <Text style={[textStyles.caption, { color: c.text.tertiary }]} testID="tutorial-progress">
          Step {index + 1} of {TUTORIAL_STEP_COUNT}
        </Text>

        {/* Keyed on the step so each entry re-runs the fade; `Motion` degrades to none under the
            system Reduce-Motion setting, so this stays calm for anyone who asked for calm. */}
        <Motion key={step.id} style={styles.stepBlock}>
          <Text {...headerProps()} style={[textStyles.title3, { color: c.text.primary }]} testID="tutorial-step-title">
            {step.title}
          </Text>
          {/* Body copy is deliberately NOT font-capped: Dynamic Type should scale it freely. Only
              oversized display numerals get `maxFontSizeMultiplier` in this app. */}
          <Text style={[textStyles.body, { color: c.text.secondary }]}>{step.body}</Text>
        </Motion>

        {/* Placeholder for the beat's interactive content (3.5.3). Rendering live sandbox values keeps
            the scaffold honest — if the sandbox binding broke, this screen would show it. */}
        <Text style={[textStyles.caption, { color: c.text.tertiary }]} testID="tutorial-sandbox-proof">
          Example paycheck dated {sandboxDate} · cushion line ${sandboxFloor}
        </Text>

        {/* Controls: each its own reachable element, never inside a grouped label. */}
        <View style={styles.nav}>
          {index > 0 ? (
            <Button label="Back" variant="text" onPress={() => goTo(prevIndex(index))} />
          ) : null}
          <Button
            label={last ? 'Finish' : 'Next'}
            onPress={() => (last ? leave() : goTo(nextIndex(index)))}
          />
        </View>

        {/* Skip stays available on EVERY step — a walkthrough you can't leave is a trap, and that's
            worse for the people most likely to need to leave. */}
        {!last ? (
          <Pressable onPress={leave} accessibilityRole="button" accessibilityLabel="Skip the walkthrough" hitSlop={8} testID="tutorial-skip">
            <Text style={[textStyles.caption, styles.skip, { color: c.text.tertiary }]}>Skip</Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md, paddingVertical: spacing.md },
  stepBlock: { gap: spacing.xs },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  skip: { textAlign: 'center', paddingVertical: spacing.sm },
});
