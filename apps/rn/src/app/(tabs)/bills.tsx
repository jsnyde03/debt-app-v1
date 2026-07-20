import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { DebtSheet } from '@/components/entities/DebtSheet';
import { ExpenseSheet } from '@/components/entities/ExpenseSheet';
import { MoreButton } from '@/components/more-button';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRow } from '@/components/ui/ListRow';
import { Pill } from '@/components/ui/Pill';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import type { Debt, RequiredExpense } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

type BillsView = 'expenses' | 'debts';

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function BillsScreen() {
  const expenses = useAppStore((s) => s.store.requiredExpenses);
  const debts = useAppStore((s) => s.store.debts);
  const living = useAppStore((s) => s.store.livingExpenses);
  const [view, setView] = useState<BillsView>('expenses');
  const [expenseSheet, setExpenseSheet] = useState<{ editing: RequiredExpense | null } | null>(null);
  const [debtSheet, setDebtSheet] = useState<{ editing: Debt | null } | null>(null);

  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const debtTotal = debts.reduce((s, d) => s + d.balance, 0);
  const livingTotal = living.filter((l) => l.enabled).reduce((s, l) => s + l.amount, 0);

  return (
    <Screen title="Bills" right={<MoreButton />}>
      <SegmentedToggle
        value={view}
        onChange={setView}
        options={[
          { value: 'expenses', label: `Bills · ${formatCurrency(expenseTotal)}` },
          { value: 'debts', label: `Debts · ${formatCurrency(debtTotal)}` },
        ]}
      />

      {view === 'expenses' ? (
        expenses.length === 0 ? (
          <EmptyState
            icon="receipt-long"
            title="No bills yet"
            body="Add a required bill or payment to build your paycheck plan."
            cta="Add your first bill"
            onCta={() => setExpenseSheet({ editing: null })}
          />
        ) : (
          <>
            {expenses.map((e) => (
              <ListRow
                key={e.id}
                title={e.name}
                meta={`Due ${shortDate(e.dueDate)} · ${e.recurrence}`}
                amount={formatCurrency(e.amount)}
                badges={e.isAutopay ? <Pill label="Autopay" tone="autopay" /> : undefined}
                onPress={() => setExpenseSheet({ editing: e })}
              />
            ))}
            <Button label="Add bill" variant="secondary" onPress={() => setExpenseSheet({ editing: null })} />
            {livingTotal > 0 ? <LivingReserve total={livingTotal} /> : null}
          </>
        )
      ) : debts.length === 0 ? (
        <EmptyState
          icon="credit-card"
          title="No debts yet"
          body="Add a loan, credit card, or BNPL balance to see your debt-free date."
          cta="Add your first debt"
          onCta={() => setDebtSheet({ editing: null })}
        />
      ) : (
        <>
          <DebtsList debts={debts} onEdit={(d) => setDebtSheet({ editing: d })} />
          <Button label="Add debt" variant="secondary" onPress={() => setDebtSheet({ editing: null })} />
        </>
      )}

      {expenseSheet ? <ExpenseSheet editing={expenseSheet.editing} onClose={() => setExpenseSheet(null)} /> : null}
      {debtSheet ? <DebtSheet editing={debtSheet.editing} onClose={() => setDebtSheet(null)} /> : null}
    </Screen>
  );
}

function LivingReserve({ total }: { total: number }) {
  const c = useAppColors();
  return (
    <Card tone="accent" style={styles.living}>
      <View style={styles.livingRow}>
        <Text style={[textStyles.subhead, { color: c.text.secondary }]}>Everyday spending reserve</Text>
        <Text style={[textStyles.numericBody, { color: c.text.primary }]}>{formatCurrency(total)}</Text>
      </View>
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Set aside each paycheck · manage in More</Text>
    </Card>
  );
}

function DebtsList({ debts, onEdit }: { debts: Debt[]; onEdit: (d: Debt) => void }) {
  const c = useAppColors();
  const active = debts.filter((d) => d.balance > 0);
  const paidOff = debts.filter((d) => d.balance <= 0);
  const totalBal = active.reduce((s, d) => s + d.balance, 0);
  const totalMin = active.reduce((s, d) => s + d.minimumPayment, 0);

  return (
    <>
      <Card style={styles.summary}>
        <SummaryCell label="Total debt" value={formatCurrency(totalBal)} />
        <SummaryCell label="Minimums" value={formatCurrency(totalMin)} />
        <SummaryCell label="Active" value={String(active.length)} />
      </Card>
      {active.map((d) => (
        <DebtRow key={d.id} debt={d} onEdit={onEdit} />
      ))}
      {paidOff.length > 0 ? (
        <>
          <Text style={[textStyles.footnote, styles.groupLabel, { color: c.text.tertiary }]}>PAID OFF</Text>
          {paidOff.map((d) => (
            <DebtRow key={d.id} debt={d} onEdit={onEdit} />
          ))}
        </>
      ) : null}
    </>
  );
}

function DebtRow({ debt, onEdit }: { debt: Debt; onEdit: (d: Debt) => void }) {
  const progress = debt.originalBalance && debt.originalBalance > 0 ? 1 - debt.balance / debt.originalBalance : undefined;
  const badges =
    debt.type === 'bnpl' ? <Pill label="BNPL" tone="neutral" /> : debt.isAutopay ? <Pill label="Autopay" tone="autopay" /> : undefined;
  return (
    <ListRow
      title={debt.name}
      meta={`${formatCurrency(debt.balance)} · ${debt.apr}% APR`}
      amount={formatCurrency(debt.minimumPayment)}
      amountSuffix="/mo"
      badges={badges}
      progress={progress}
      onPress={() => onEdit(debt)}
    />
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
  groupLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', marginTop: spacing.sm },
  living: { gap: spacing.xs },
  livingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
