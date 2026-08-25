import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { DataRepair } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';

import { repairBlocks, repairsA11yLabel } from './dataRepairsCopy';

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
 *
 * ⛔ **THIS CARD USED TO STATE THE OPPOSITE OF WHAT HAPPENED, for the one repair that touches money.**
 * It said the amounts *"are showing as $0, so your plan is leaving them out"* — true of a repaired
 * balance, and **exactly backwards** for a goal's per-paycheck pace, which repaired to `0` and therefore
 * funded the goal **uncapped, ahead of the user's debt**. The card told the person the benign version of
 * the harm. (P6.8.9.7.10 · B-1.) Each line now carries its own consequence, because the consequences
 * differ and no single sentence covers them honestly. The pace line is written in `migrations.ts`.
 *
 * ⛔ **"UNTIL YOU SET IT AGAIN" WAS FALSE FOR THREE OF THE FIVE PRODUCERS OF A REPAIR RECORD.**
 * [P6.8.9.7.11.13.8 · J1-4] It was written for a named item with a sheet behind it, and applied to
 * everything: a whole list that would not read, a single row that would not read, and the v1.6 bridge's
 * counts have **no item to open**. ⚡ Enumerated from the producers, not from the audit's list.
 *
 * ⚠️ **The pace half of this closed differently** — at `.11.13.4`, by making the promise TRUE:
 * `GoalSheet` now writes `priorityPerPaycheck`, so a stood-down goal has a route. The rest is split into
 * its own block in `dataRepairsCopy`, because for those there is genuinely nothing to reopen and the only
 * honest instruction is to check against the old app.
 *
 * ⛔ **The words live in `dataRepairsCopy`, not here** — a recovered amount and a lost one are opposite
 * events and the card said the loss sentence over both. Pinning the strings needs them out of JSX.
 */
export function DataRepairsCard({ repairs, onAck }: { repairs: DataRepair[]; onAck: () => void }) {
  const c = useAppColors();
  const blocks = repairBlocks(repairs);

  return (
    <Card tone="accent" testID="data-repairs-ack" style={styles.card}>
      <View {...groupLabel(repairsA11yLabel(blocks))}>
        {blocks.map((block) => (
          <View key={block.kind} style={styles.block}>
            <View style={styles.head}>
              {/* `healing` is the repair glyph the icon map already carries — a recovered amount was
                  mended and is fine, which is not the warning the loss block is. */}
              <AppIcon
                // ⚠️ [P6.8.9.7.11.13.8] `unrecoverable` is a LOSS and takes the warning glyph — a two-way
                // `=== 'lost' ? … : …` would have handed it `healing`, the mended-amount icon, which is
                // the opposite claim. The block kinds are now three; this had to stop being a boolean.
                name={block.kind === 'recovered' ? 'healing' : 'error-outline'}
                size={20}
                color={block.kind === 'recovered' ? c.text.secondary : c.accent.warning}
              />
              <Text style={[textStyles.subhead, styles.headText, { color: c.text.primary }]}>{block.heading}</Text>
            </View>
            <Text style={[textStyles.footnote, { color: c.text.secondary }]}>{block.detail}</Text>
            <View style={styles.list}>
              {block.lines.map((line) => (
                <Text key={line} style={[textStyles.footnote, { color: c.text.primary }]}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
      <Button label="Got it" variant="text" onPress={onAck} testID="data-repairs-ack-button" />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  block: { gap: spacing.xxs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headText: { flex: 1, fontWeight: '600' },
  list: { gap: spacing.xxs, marginTop: spacing.xxs },
});
