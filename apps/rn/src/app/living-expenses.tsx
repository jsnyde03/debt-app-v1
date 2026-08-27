import { EVERYDAY_SPENDING_LABEL } from '@core/copy/vocabulary';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { LivingExpenseSheet } from '@/components/entities/LivingExpenseSheet';
import { UNREAD_FIGURE, unreadRowCaption } from '@/components/plan/dataRepairsCopy';
import { Screen } from '@/components/screen';
import { AddRow } from '@/components/ui/AddRow';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRow } from '@/components/ui/ListRow';
import type { LivingExpense } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { formatWhole } from '@/utils/format';
import { useActiveStore } from '@/store/StoreContext';
import { selectLivingReserveRequest } from '@/store/expenseReserveSelectors';
import { anyRowFieldUnread, rowFieldUnread, unreadFieldsFor } from '@/store/trustSelectors';
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
  // ⛔ S1.10.6.2 [C-1 · C-2] — the rows and the headline both restate money the app may not have read.
  const store = useAppStore((s) => s.store);
  const reserveUnread = anyRowFieldUnread(store, 'row-figures', 'livingExpense', 'amount');

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
            {/* ⛔ S1.10.6.2 [C-2] — A TOTAL MISSING AN UNKNOWN ADDEND IS NOT A TOTAL. This headline read
                "$120" over a true figure of at least $520, because an unreadable amount repairs to `0` and
                still sums. ⚠️ Store-wide over THIS entity, not per row: the figure is a sum, so one unread
                addend makes the whole of it unstatable — while the rows below still say what the app read.
                It is the treatment `money.tsx`'s debts hero already carries, on the screen that was never
                looked at. */}
            {/* ⚠️ The testID is load-bearing for the guard: "$120" also appears as the Gas ROW's own
                amount, so an assertion on the page text cannot tell a suppressed headline from a
                surviving row. The first cut of that test could not, and passed for the wrong reason. */}
            <Text testID="living-reserve-headline" style={[textStyles.numericBody, { color: c.text.primary, fontWeight: '700' }]}>
              {reserveUnread ? UNREAD_FIGURE : formatWhole(activeTotal)}
            </Text>
          </Card>
          {reserveUnread ? (
            <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
              Some amounts could not be read — set them again and your total comes back.
            </Text>
          ) : null}

          {items.map((item) => {
            // ⛔ S1.10.6.2 [C-1] — this row printed "Groceries · Counts toward reserve · $0" with no
            // caption at all, over an amount `pendingDataRepairs` already recorded as unreadable.
            // ⚠️ Hoisted out of the JSX attributes: `lint:copy` buckets every `jsx-expr` string literal as
            // user-facing COPY, so an entity key inside an attribute reds the duplicate-copy gate.
            const amountUnread = rowFieldUnread(store, 'row-figures', 'livingExpense', item.id, 'amount');
            const caption = unreadRowCaption(unreadFieldsFor(store, 'livingExpense', item.id));
            return (
              <ListRow
                key={item.id}
                title={item.name}
                meta={item.enabled ? 'Counts toward reserve' : 'Not counted'}
                amount={amountUnread ? UNREAD_FIGURE : formatCurrency(item.amount)}
                caption={caption}
                badges={item.enabled ? undefined : [{ label: 'Off', tone: 'neutral' }]}
                onPress={() => setSheet({ editing: item })}
                onDelete={() => store_.getState().removeLivingExpense(item.id)}
              />
            );
          })}

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
