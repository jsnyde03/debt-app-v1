import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/screen';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { TUTORIAL_MAX_CYCLES } from '@/store/sandboxBeats';
import { harnessScenario, publishSandbox, unpublishSandbox } from '@/store/sandboxHarness';
import { scenarioFor } from '@/store/sandboxScenarios';
import { createSandboxStore } from '@/store/sandboxStore';
import { markTutorialSeen, type TutorialRun } from '@/store/tutorialSelectors';
import { useAppStore } from '@/store/useAppStore';
import { useSandboxStore } from '@/store/useSandboxStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { announce } from '@/utils/a11y';

/**
 * 3.5.1 — the Guardian tutorial route. **This is the SCAFFOLD**: it owns entry, the sandbox lifecycle,
 * and the seen-flag, so the invitation and replay entries have a real destination and the whole path is
 * verifiable end-to-end. The path machinery (skip / interrupt-resume / VoiceOver-operable steps) is
 * 3.5.2, and the ≤7 beats are 3.5.3 — both fill in here.
 *
 * Everything it renders comes from a SANDBOX (`createSandboxStore`), never the real store, so nothing a
 * user does in here can touch their plan. It scales that sandbox off their own numbers when there are
 * any (`scenarioFor`), so the lesson is told in figures they recognise, and falls back to the persona
 * otherwise.
 *
 * It declares `TUTORIAL_MAX_CYCLES` as its honesty ceiling — higher than the demo's day-one bound,
 * because the tutorial's subject IS what happens across the first few paydays, and under the demo's
 * ceiling the safety-net release could never fire (3.5.0.4).
 */
export default function TutorialScreen() {
  const c = useAppColors();
  const params = useLocalSearchParams<{ run?: string }>();
  const realStore = useAppStore((s) => s.store);
  const run: TutorialRun = params.run === 'premium' ? 'premium' : params.run === 'free' ? 'free' : realStore.subscriptionPlan === 'premium' ? 'premium' : 'free';

  // One sandbox per mount. A test may name the opening state (3.5.0.7); a real user always gets their
  // own scaled scenario. Built once — re-creating it on render would restart the lesson mid-step.
  const sandbox = useMemo(() => {
    const scenario =
      harnessScenario({ maxGenuineCycles: TUTORIAL_MAX_CYCLES }) ??
      scenarioFor(realStore, 'clear', { premium: run === 'premium', maxGenuineCycles: TUTORIAL_MAX_CYCLES });
    const store = createSandboxStore(scenario);
    publishSandbox(store, scenario.id);
    return store;
    // Intentionally mount-only: the sandbox must not be rebuilt when the real store changes underneath.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    announce('Guardian walkthrough');
    return () => unpublishSandbox();
  }, []);

  // The sandbox's first REAL render (the 3.5.0 carry-forward): proves the binding drives UI, not just tests.
  const guardianState = useSandboxStore(sandbox, (s) => s.store.paycheck.currentDate);
  const sandboxFloor = useSandboxStore(sandbox, (s) => s.store.cushionFloor);

  /** Finishing OR dismissing both count as answered — the offer doesn't return either way. */
  const close = () => {
    appStore.getState().updatePrefs(markTutorialSeen(appStore.getState().store.prefs, run));
    router.back();
  };

  return (
    <Screen title="How your Guardian works" onBack={close}>
      <View style={styles.body} testID="tutorial-scaffold">
        <Text style={[textStyles.body, { color: c.text.secondary }]}>
          A short walkthrough of how your paycheck gets protected — running on example numbers, not your
          real plan.
        </Text>
        {/* 3.5.3 replaces this with the ≤7-beat arc. Rendering live sandbox values keeps the scaffold
            honest: if the sandbox binding breaks, this screen shows it rather than passing silently. */}
        <Text style={[textStyles.caption, { color: c.text.tertiary }]} testID="tutorial-sandbox-proof">
          Example paycheck dated {guardianState} · cushion line ${sandboxFloor}
        </Text>
        <Button label="Done" onPress={close} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md, paddingVertical: spacing.md },
});
