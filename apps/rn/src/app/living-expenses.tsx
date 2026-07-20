import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { LivingExpenseSheet } from '@/components/entities/LivingExpenseSheet';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRow } from '@/components/ui/ListRow';
import { Pill } from '@/components/ui/Pill';
import type { LivingExpense } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * Living Expenses management — pushed from More → Preferences (the B.6 deferral). Add/edit via the
 * shared sheet; the inline switch toggles whether an item counts toward the reserve set aside each
 * paycheck (it flows into `selectAllocation`'s `livingExpenseReserve`).
 */
export default function LivingExpensesScreen() {
  const c = useAppColors();
  const items = useAppStore((s) => s.store.livingExpenses);
  const [sheet, setSheet] = useState<{ editing: LivingExpense | null } | null>(null);

  const activeTotal = items.filter((i) => i.enabled).reduce((sum, i) => sum + i.amount, 0);

  return (
    <Screen title="Living Expenses" onBack={() => router.back()}>
      <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
        Everyday spending set aside each paycheck, before debt and goals.
      </Text>

      {items.length === 0 ? (
        <EmptyState
          icon="shopping-cart"
          title="No spending items yet"
          body="Add groceries, gas, or fun money to reserve for everyday spending each paycheck."
          cta="Add your first item"
          onCta={() => setSheet({ editing: null })}
        />
      ) : (
        <>
          <Card tone="accent" style={styles.summary}>
            <Text style={[textStyles.subhead, { color: c.text.secondary }]}>Reserve per paycheck</Text>
            <Text style={[textStyles.numericBody, { color: c.text.primary, fontWeight: '700' }]}>
              {formatCurrency(activeTotal)}
            </Text>
          </Card>

          {items.map((item) => (
            <ListRow
              key={item.id}
              title={item.name}
              meta={item.enabled ? 'Counts toward reserve' : 'Not counted'}
              amount={formatCurrency(item.amount)}
              badges={item.enabled ? undefined : <Pill label="Off" tone="neutral" />}
              onPress={() => setSheet({ editing: item })}
            />
          ))}

          <Button label="Add spending item" variant="secondary" onPress={() => setSheet({ editing: null })} />
        </>
      )}

      {sheet ? <LivingExpenseSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
});
