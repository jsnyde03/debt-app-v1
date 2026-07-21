import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { DebtSheet } from '@/components/entities/DebtSheet';
import { ExpenseSheet } from '@/components/entities/ExpenseSheet';
import { GoalSheet } from '@/components/entities/GoalSheet';
import { MoreButton } from '@/components/more-button';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRow } from '@/components/ui/ListRow';
import { Pill } from '@/components/ui/Pill';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import type { Debt, Goal, RequiredExpense } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * Money — the consolidated management hub (Elevation IA). One tab holds all three entity types as
 * sectioned sub-surfaces; **Debts is the hero and opens first**. Calm reference lists (the beats
 * live on Today/Progress, not here). Merged from the former Bills + Goals tabs.
 */
type MoneyView = 'debts' | 'bills' | 'goals';

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function MoneyScreen() {
  const [view, setView] = useState<MoneyView>('debts');

  return (
    <Screen title="Money" right={<MoreButton />}>
      <SegmentedToggle
        value={view}
        onChange={setView}
        options={[
          { value: 'debts', label: 'Debts' },
          { value: 'bills', label: 'Bills' },
          { value: 'goals', label: 'Goals' },
        ]}
      />
      {view === 'debts' ? <DebtsSection /> : view === 'bills' ? <BillsSection /> : <GoalsSection />}
    </Screen>
  );
}

// ── Debts (the hero section) ──────────────────────────────────────────────────
function DebtsSection() {
  const debts = useAppStore((s) => s.store.debts);
  const [sheet, setSheet] = useState<{ editing: Debt | null } | null>(null);
  const active = debts.filter((d) => d.balance > 0);
  const paidOff = debts.filter((d) => d.balance <= 0);
  const c = useAppColors();

  if (debts.length === 0) {
    return (
      <>
        <EmptyState
          icon="credit-card"
          title="No debts yet"
          body="Add a loan, credit card, or BNPL balance to see your debt-free date."
          cta="Add your first debt"
          onCta={() => setSheet({ editing: null })}
        />
        {sheet ? <DebtSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
      </>
    );
  }

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
        <DebtRow key={d.id} debt={d} onEdit={(x) => setSheet({ editing: x })} />
      ))}
      {paidOff.length > 0 ? (
        <>
          <Text style={[textStyles.footnote, styles.groupLabel, { color: c.text.tertiary }]}>PAID OFF</Text>
          {paidOff.map((d) => (
            <DebtRow key={d.id} debt={d} onEdit={(x) => setSheet({ editing: x })} />
          ))}
        </>
      ) : null}
      <Button label="Add debt" variant="secondary" onPress={() => setSheet({ editing: null })} />
      {sheet ? <DebtSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
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

// ── Bills (required expenses) ─────────────────────────────────────────────────
function BillsSection() {
  const expenses = useAppStore((s) => s.store.requiredExpenses);
  const living = useAppStore((s) => s.store.livingExpenses);
  const [sheet, setSheet] = useState<{ editing: RequiredExpense | null } | null>(null);
  const livingTotal = living.filter((l) => l.enabled).reduce((s, l) => s + l.amount, 0);

  return (
    <>
      {expenses.length === 0 ? (
        <EmptyState
          icon="receipt-long"
          title="No bills yet"
          body="Add a required bill or payment to build your paycheck plan."
          cta="Add your first bill"
          onCta={() => setSheet({ editing: null })}
        />
      ) : (
        <>
          {expenses.map((e) => (
            <ListRow
              key={e.id}
              title={e.name}
              meta={`Due ${shortDate(e.dueDate)} · ${e.recurrence}${e.expenseType === 'variable' ? ' · Variable' : ''}`}
              amount={formatCurrency(e.amount)}
              badges={e.isAutopay ? <Pill label="Autopay" tone="autopay" /> : undefined}
              onPress={() => setSheet({ editing: e })}
            />
          ))}
          <Button label="Add bill" variant="secondary" onPress={() => setSheet({ editing: null })} />
          {livingTotal > 0 ? <LivingReserve total={livingTotal} /> : null}
        </>
      )}
      {sheet ? <ExpenseSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
    </>
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

// ── Goals ─────────────────────────────────────────────────────────────────────
function GoalsSection() {
  const goals = useAppStore((s) => s.store.goals);
  const [sheet, setSheet] = useState<{ editing: Goal | null } | null>(null);

  if (goals.length === 0) {
    return (
      <>
        <EmptyState
          icon="flag"
          title="No goals yet"
          body="Add an emergency fund or savings goal to start tracking progress."
          cta="Add your first goal"
          onCta={() => setSheet({ editing: null })}
        />
        {sheet ? <GoalSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
      </>
    );
  }

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overall = totalTarget > 0 ? totalSaved / totalTarget : 0;

  return (
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
      {sheet ? <GoalSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
    </>
  );
}

// ── shared ────────────────────────────────────────────────────────────────────
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
