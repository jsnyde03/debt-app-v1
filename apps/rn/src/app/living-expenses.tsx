import { EVERYDAY_SPENDING_LABEL } from '@core/copy/vocabulary';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { LivingExpenseSheet } from '@/components/entities/LivingExpenseSheet';
import { Screen } from '@/components/screen';
import { AddRow } from '@/components/ui/AddRow';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRow } from '@/components/ui/ListRow';
import { Pill } from '@/components/ui/Pill';
import type { LivingExpense } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { formatWhole } from '@/utils/format';
import { useActiveStore } from '@/store/StoreContext';
import { selectLivingReserveRequest } from '@/store/expenseReserveSelectors';
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
  // [R4] the store this subtree resolves to — sandbox under a demo, real singleton otherwise.
  const store_ = useActiveStore();
  const items = useAppStore((s) => s.store.livingExpenses);
  const [sheet, setSheet] = useState<{ editing: LivingExpense | null } | null>(null);

  // [P6.4.3 · L4-15] One owner — `money.tsx` had this expression verbatim, off the same store field.
  const activeTotal = useAppStore((s) => selectLivingReserveRequest(s.store));

  return (
    <Screen title={EVERYDAY_SPENDING_LABEL} onBack={() => router.back()}>
      <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
        Everyday spending reserved each paycheck, before debt and goals.
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
            {/* [T6.5 · L4-9] `formatWhole` — this is a summary card headline, the same tier and the same
                concept as Money's "reserved each paycheck" hero one tab away, which is already whole. The
                `ListRow` amounts below stay `formatCurrency`: they are the ledger. */}
            <Text style={[textStyles.numericBody, { color: c.text.primary, fontWeight: '700' }]}>
              {formatWhole(activeTotal)}
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
              onDelete={() => store_.getState().removeLivingExpense(item.id)}
            />
          ))}

          {/* [P6.4.5 · audit L4-12] `AddRow`, matching Money. Its own docstring says it "replaces the
              chunky secondary button at the foot of the Money sections" — and this list, reached FROM
              the Money tab's reserve tile, still ended in exactly that. Same job, same position, two
              affordances. */}
          <AddRow label="Add spending item" onPress={() => setSheet({ editing: null })} />
        </>
      )}

      {sheet ? <LivingExpenseSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
});
