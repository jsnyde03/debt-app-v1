import { StyleSheet, Text, View } from 'react-native';

import { notify } from '@/utils/confirm';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { liveActivityBridge } from '@/liveActivity/liveActivityBridge';
import type { PaydayActivityContent } from '@/liveActivity/paydayActivityContent';
import { appStore } from '@/store/appStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * Dev/QA-only controls to exercise the Payday Countdown Live Activity (3.5.3) directly on device —
 * start it in each Guardian state / day without hand-tuning your paycheck date + sandbox premium, and
 * simulate the "Payday landed" drain (roll + Undo). Gated by `QA_TOOLS` (removed before submission);
 * the bridge is a no-op on web/Android so this is inert off iOS.
 */
function sample(over: Partial<PaydayActivityContent>): PaydayActivityContent {
  return {
    paydayDateISO: '2026-08-01',
    daysUntilPayday: 2,
    countdownLabel: 'in 2 days',
    guardianState: 'clear',
    title: 'Looks clear this paycheck',
    line: 'Cushion holds · $420 free to deploy',
    cycleProgress: 0.85,
    ...over,
  };
}

const STATES: { label: string; content: PaydayActivityContent }[] = [
  { label: 'Clear · 2 days', content: sample({}) },
  {
    label: 'Tight · tomorrow',
    content: sample({ daysUntilPayday: 1, countdownLabel: 'Tomorrow', guardianState: 'tight', title: 'A little tight this paycheck', line: 'Move $200 from savings to hold your line', cycleProgress: 0.93 }),
  },
  {
    label: 'At-risk · today',
    content: sample({ daysUntilPayday: 0, countdownLabel: 'Today', guardianState: 'at-risk', title: 'Very tight this paycheck', line: '$180 short of your obligations', cycleProgress: 1 }),
  },
  {
    label: 'Payday day (button)',
    content: sample({ daysUntilPayday: 0, countdownLabel: 'Today', cycleProgress: 1 }),
  },
];

export function LiveActivityQA() {
  const c = useAppColors();
  const enabled = liveActivityBridge.areActivitiesEnabled();
  return (
    <Card style={styles.card}>
      <Text style={[textStyles.subhead, { color: c.text.primary, fontWeight: '700' }]}>Live Activity QA</Text>
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
        {enabled
          ? 'Start a state, then check the Lock Screen / Dynamic Island. (iOS only.)'
          : 'Live Activities are OFF in device Settings, or unsupported here (web / <iOS 16.2).'}
      </Text>
      <View style={styles.grid}>
        {STATES.map((s) => (
          <Button key={s.label} label={s.label} variant="secondary" onPress={() => liveActivityBridge.start(s.content)} />
        ))}
      </View>
      <View style={styles.grid}>
        <Button label="End activity" variant="text" onPress={() => liveActivityBridge.end()} />
        <Button
          label="Simulate 'Payday landed'"
          variant="text"
          onPress={() => {
            appStore.getState().applyPaydayLandedIntent();
            notify('Payday landed', 'Rolled the cycle — check the Today tab for the Undo card.');
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
