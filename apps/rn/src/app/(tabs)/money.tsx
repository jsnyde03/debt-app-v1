import { useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrency } from '@core/utils/formatCurrency';

import { DebtSheet } from '@/components/entities/DebtSheet';
import { ExpenseSheet } from '@/components/entities/ExpenseSheet';
import { GoalSheet } from '@/components/entities/GoalSheet';
import { MoreButton } from '@/components/more-button';
import { Screen } from '@/components/screen';
import { AddRow } from '@/components/ui/AddRow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRow } from '@/components/ui/ListRow';
import { Pill } from '@/components/ui/Pill';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import type { Debt, Goal, RequiredExpense } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { selectPayoffView } from '@/store/payoffSelectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

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
    <Screen title="Money" right={<MoreButton />} scroll={view !== 'debts'}>
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

// ── Debts (the hero section) — the debts + the payoff plan (strategy · order · focus, moved here
//    from Progress: management belongs in Money per the IA). Elevated visually at 1.5.
function DebtsSection() {
  const store = useAppStore((s) => s.store);
  const strategy = store.payoffStrategy;
  const view = selectPayoffView(store);
  const [sheet, setSheet] = useState<{ editing: Debt | null } | null>(null);
  const paidOff = store.debts.filter((d) => d.balance <= 0);
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  if (store.debts.length === 0) {
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

  const active = view.order; // ranked by the payoff strategy
  const focusId = view.focus?.id;
  const totalBal = active.reduce((s, d) => s + d.balance, 0);

  type DebtGroup = { key: string; title?: string; data: Debt[] };
  const sections: DebtGroup[] = [{ key: 'active', data: active }];
  if (paidOff.length > 0) sections.push({ key: 'paid', title: 'PAID OFF', data: paidOff });

  // Own scroll surface (virtualized) — the debt-heavy user (student loans, BNPL, medical) can carry
  // 20–30+ debts. Hero + strategy stay pinned above the scrolling list; payoff order is the
  // findability (focus debt is always first), so no grouping/search here.
  return (
    <View style={styles.flex}>
      <MoneyHero value={formatWhole(totalBal)} sub={`remaining across ${active.length} ${active.length === 1 ? 'debt' : 'debts'}`} />
      <View style={styles.strategyBlock}>
        <SegmentedToggle
          value={strategy}
          onChange={(s) => appStore.getState().setPayoffStrategy(s)}
          options={[
            { value: 'snowball', label: 'Snowball' },
            { value: 'avalanche', label: 'Avalanche' },
          ]}
        />
        <Text style={[textStyles.caption, styles.strategyDesc, { color: c.text.tertiary }]}>
          {strategy === 'snowball'
            ? 'Smallest balance first — quick wins. Your debts are listed in payoff order.'
            : 'Highest APR first — least interest. Your debts are listed in payoff order.'}
        </Text>
      </View>

      <SectionList
        style={styles.flex}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.huge }}
        ItemSeparatorComponent={() => <View style={styles.rowGap} />}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <Text style={[textStyles.footnote, styles.groupLabel, { color: c.text.tertiary }]}>{section.title}</Text>
          ) : null
        }
        renderItem={({ item }) => <DebtRow debt={item} focus={item.id === focusId} onEdit={(x) => setSheet({ editing: x })} />}
        ListFooterComponent={
          <View style={styles.listFooter}>
            <AddRow label="Add debt" onPress={() => setSheet({ editing: null })} />
          </View>
        }
      />
      {sheet ? <DebtSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
    </View>
  );
}

function DebtRow({ debt, focus, onEdit }: { debt: Debt; focus?: boolean; onEdit: (d: Debt) => void }) {
  const c = useAppColors();
  const progress = debt.originalBalance && debt.originalBalance > 0 ? 1 - debt.balance / debt.originalBalance : undefined;
  const chips = [
    focus ? <Pill key="f" label="Focus" tone="action" /> : null,
    debt.type === 'bnpl' ? <Pill key="b" label="BNPL" tone="neutral" /> : debt.isAutopay ? <Pill key="a" label="Autopay" tone="autopay" /> : null,
  ].filter(Boolean);
  return (
    <ListRow
      title={debt.name}
      meta={`${formatCurrency(debt.balance)} · ${debt.apr}% APR`}
      amount={formatCurrency(debt.minimumPayment)}
      amountSuffix="/mo"
      badges={chips.length ? <>{chips}</> : undefined}
      progress={progress}
      progressColor={focus ? c.accent.primary : undefined}
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
/** The calm anchoring stat for a Money section — one big number + context, on a hairline (no box). */
function MoneyHero({ value, sub }: { value: string; sub: string }) {
  const c = useAppColors();
  return (
    <View style={styles.hero}>
      <Text style={[styles.heroNum, { color: c.text.primary }]}>{value}</Text>
      <Text style={[textStyles.subhead, { color: c.text.tertiary }]}>{sub}</Text>
      <View style={[styles.hairline, { backgroundColor: c.border.default }]} />
    </View>
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
  flex: { flex: 1 },
  rowGap: { height: spacing.sm },
  listFooter: { marginTop: spacing.md },
  hero: { gap: 2, marginBottom: spacing.xs },
  heroNum: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  hairline: { height: StyleSheet.hairlineWidth, marginTop: spacing.md },
  summary: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  cell: { flex: 1, gap: 2 },
  cellLabel: { textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
  groupLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', marginTop: spacing.sm },
  strategyBlock: { gap: spacing.xs, marginTop: spacing.xs },
  strategyDesc: { textAlign: 'center' },
  living: { gap: spacing.xs },
  livingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
