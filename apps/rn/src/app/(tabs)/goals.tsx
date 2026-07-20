import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { GoalSheet } from '@/components/entities/GoalSheet';
import { MoreButton } from '@/components/more-button';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRow } from '@/components/ui/ListRow';
import { Pill } from '@/components/ui/Pill';
import type { Goal } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export default function GoalsScreen() {
  const goals = useAppStore((s) => s.store.goals);
  const [sheet, setSheet] = useState<{ editing: Goal | null } | null>(null);

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overall = totalTarget > 0 ? totalSaved / totalTarget : 0;

  return (
    <Screen title="Goals" right={<MoreButton />}>
      {goals.length === 0 ? (
        <EmptyState
          icon="flag"
          title="No goals yet"
          body="Add an emergency fund or savings goal to start tracking progress."
          cta="Add your first goal"
          onCta={() => setSheet({ editing: null })}
        />
      ) : (
        <>
          <Card style={styles.summary}>
            <SummaryCell label="Saved" value={formatCurrency(totalSaved)} />
            <SummaryCell label="Target" value={formatCurrency(totalTarget)} />
            <SummaryCell label="Progress" value={`${Math.round(overall * 100)}%`} />
          </Card>
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0;
            const funded = g.currentAmount >= g.targetAmount;
            return (
              <ListRow
                key={g.id}
                title={g.name}
                meta={g.type === 'emergency' ? 'Emergency fund' : 'Savings'}
                amount={funded ? 'Funded' : formatCurrency(Math.max(0, g.targetAmount - g.currentAmount))}
                amountSuffix={funded ? undefined : ' left'}
                badges={funded ? <Pill label="Funded" tone="paid" /> : undefined}
                progress={pct}
                onPress={() => setSheet({ editing: g })}
              />
            );
          })}
          <Button label="Add goal" variant="secondary" onPress={() => setSheet({ editing: null })} />
        </>
      )}
      {sheet ? <GoalSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
    </Screen>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  const c = useAppColors();
  return (
    <View style={styles.cell}>
      <Text style={[textStyles.footnote, styles.cellLabel, { color: c.text.tertiary }]}>{label}</Text>
      <Text style={[textStyles.numericBody, { color: c.text.primary, fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  cell: { flex: 1, gap: 2 },
  cellLabel: { textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
});
