import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { DataRepair } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';

/**
 * ⚠️ The `Record` is EXHAUSTIVE on purpose, and it earned that at P6.8.9.7.2: adding `goal` to
 * `DataRepair['entity']` failed the build right here. An index signature would have shipped a repair the
 * user reads as *"Your item list — targetAmount"*, via the `?? 'item'` fallback below, and nothing would
 * have said so. The compiler is the gate for this class.
 */
const ENTITY_NOUN: Record<Exclude<DataRepair['entity'], 'migration'>, string> = {
  debt: 'debt',
  requiredExpense: 'bill',
  livingExpense: 'expense',
  goal: 'savings goal',
};

/** "Chase card — balance", the whole-list case, or a migration loss, which is already a sentence. */
function describe(repair: DataRepair): string {
  // M3-20 — a migration entry carries no entity and no name: its `field` IS the sentence, because the
  // v1.6 key it came from ("debtPlanner.rolloverCount") means nothing to the person reading it.
  if (repair.entity === 'migration') return repair.field;
  const noun = ENTITY_NOUN[repair.entity] ?? 'item';
  if (!repair.name) return `Your ${noun} list — ${repair.field}`;
  return `${repair.name} — ${repair.field}`;
}

/**
 * P6.8.7c.2 (audit B4/M3-2) — the amounts this launch could not read, said out loud.
 *
 * ⛔ **The absence of this card was the defect, not a missing nicety.** `readMoney` deliberately repairs an
 * unreadable amount to `0` and RECORDS it, choosing that over silently coercing or dropping the row,
 * because *"only the last one lets the person find out"*. Nothing ever rendered the record — so the
 * shipped behaviour was the option the design rejected: a $12,000 card shows $0.00, is filed under
 * `PAID OFF`, and drops out of the plan, the payoff schedule, the Guardian and the widget, invisibly.
 *
 * ⚠️ **It names the items, because the user is the only one who knows the real number.** A card saying
 * "some amounts could not be read" would be technically honest and useless — they cannot tell a repaired
 * balance from a real one by looking, so without the names there is nothing they can act on.
 *
 * ⚠️ Deliberately NOT auto-dismissing and not tied to a session: it is cleared only by
 * `acknowledgeDataRepairs`. The list it reads (`pendingDataRepairs`) exists precisely because the
 * per-read `dataRepairs` is empty again as soon as anything saves.
 */
export function DataRepairsCard({ repairs, onAck }: { repairs: DataRepair[]; onAck: () => void }) {
  const c = useAppColors();
  const lines = repairs.map(describe);

  return (
    <Card tone="accent" testID="data-repairs-ack" style={styles.card}>
      <View style={styles.head} {...groupLabel(`${lines.length === 1 ? 'An amount' : 'Some amounts'} could not be read. ${lines.join('. ')}. These are showing as $0 until you set them.`)}>
        <AppIcon name="error-outline" size={20} color={c.accent.warning} />
        <Text style={[textStyles.subhead, styles.headText, { color: c.text.primary }]}>
          {lines.length === 1 ? 'An amount could not be read' : `${lines.length} amounts could not be read`}
        </Text>
      </View>
      <Text style={[textStyles.footnote, { color: c.text.secondary }]}>
        {lines.length === 1 ? 'It is' : 'They are'} showing as $0, so your plan is leaving {lines.length === 1 ? 'it' : 'them'} out. Open{' '}
        {lines.length === 1 ? 'it' : 'each one'} and enter the real amount.
      </Text>
      <View style={styles.list}>
        {lines.map((line) => (
          <Text key={line} style={[textStyles.footnote, { color: c.text.primary }]}>
            {line}
          </Text>
        ))}
      </View>
      <Button label="Got it" variant="text" onPress={onAck} testID="data-repairs-ack-button" />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headText: { flex: 1, fontWeight: '600' },
  list: { gap: spacing.xxs },
});
