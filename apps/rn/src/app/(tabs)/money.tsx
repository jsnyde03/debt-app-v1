import { router } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bnplPaymentsRemaining, bnplPaymentsTotal, isInstallmentNative } from '@core/debt/bnplInstallment';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';
import { parseStatementText } from '@core/scan/parseStatementText';
import type { Recurrence } from '@core/types/recurrence';
import { formatCurrency } from '@core/utils/formatCurrency';

import { DebtSheet } from '@/components/entities/DebtSheet';
import { ExpenseSheet } from '@/components/entities/ExpenseSheet';
import { GoalSheet } from '@/components/entities/GoalSheet';
import { AllocationBarCanvas } from '@/components/money/AllocationBarCanvas';
import { BnplCalendarSection } from '@/components/money/BnplCalendarSection';
import { isScanAvailable, scanStatement } from '@/lib/scan';
import type { AllocationSegment } from '@/components/money/AllocationBarChart';
import { BillBreakdownSheet, type BillBreakdownData } from '@/components/money/BillBreakdownSheet';
import { MoreButton } from '@/components/more-button';
import { Screen } from '@/components/screen';
import { AddRow } from '@/components/ui/AddRow';
import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRow } from '@/components/ui/ListRow';
import { Pill } from '@/components/ui/Pill';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import type { Debt, Goal, RequiredExpense, RequiredExpenseCategory } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { selectDebtBalanceView, buildEstimateCaption } from '@/store/balanceSelectors';
import { selectPayoffView } from '@/store/payoffSelectors';
import { useAppStore } from '@/store/useAppStore';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole, monthlyEquivalent } from '@/utils/format';

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

// A BNPL installment recurs on its own cadence (usually biweekly), not monthly — so the row's
// per-payment suffix stays truthful (a "/mo" on a biweekly plan would misstate the outflow).
const CADENCE_SUFFIX: Record<Recurrence, string> = {
  'monthly': '/mo',
  'weekly': '/wk',
  'biweekly': '/2 wks',
  'per-paycheck': '/check',
  'quarterly': '/qtr',
  'annually': '/yr',
  'one-time': '',
};

export default function MoneyScreen() {
  const [view, setView] = useState<MoneyView>('debts');

  return (
    <Screen title="Money" right={<MoreButton />} scroll={view === 'goals'}>
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
  // Memoized on the store so re-renders that don't change the plan (e.g. the parent's Debts/Bills/Goals
  // section toggle) don't rebuild all three payoff trajectories.
  const view = useMemo(() => selectPayoffView(store), [store]);
  const [sheet, setSheet] = useState<{ editing: Debt | null; prefill?: Partial<Debt> } | null>(null);
  const paidOff = store.debts.filter((d) => d.balance <= 0);
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  // §2.8 scan-to-prefill (free): scan a statement → OCR text → parse → open the sheet PREFILLED for the
  // user to confirm. Nothing is saved without their tap. Hidden where the native scanner isn't available.
  async function handleScan() {
    const text = await scanStatement();
    if (!text) return; // cancelled
    const parsed = parseStatementText(text);
    if (parsed.balance == null && parsed.minimumPayment == null && !parsed.name) return; // nothing usable
    setSheet({ editing: null, prefill: parsed });
  }

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
        {isScanAvailable() ? <View style={styles.scanEmpty}><AddRow label="Scan a statement" icon="document-scanner" onPress={handleScan} /></View> : null}
        {sheet ? <DebtSheet editing={sheet.editing} prefill={sheet.prefill} onClose={() => setSheet(null)} /> : null}
      </>
    );
  }

  const isPremium = store.subscriptionPlan === 'premium';
  const currentDate = store.paycheck.currentDate;
  const active = view.order; // ranked by the payoff strategy
  const focusId = view.focus?.id;
  // Premium sums the projected (always-current) balances so the hero reconciles with the rows.
  const totalBal = active.reduce((s, d) => s + selectDebtBalanceView(d, currentDate, isPremium).currentBalance, 0);

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
        renderItem={({ item }) => (
          <DebtRow debt={item} focus={item.id === focusId} currentDate={currentDate} isPremium={isPremium} onEdit={(x) => setSheet({ editing: x })} />
        )}
        ListFooterComponent={
          <View style={styles.listFooter}>
            <AddRow label="Add debt" onPress={() => setSheet({ editing: null })} />
            {/* §2.8 — scan a statement to prefill a new debt (free). Hidden where no native scanner. */}
            {isScanAvailable() ? <AddRow label="Scan a statement" icon="document-scanner" onPress={handleScan} /> : null}
            {/* §2.7.5 — the consolidated BNPL calendar (renders only when there are upcoming installments). */}
            <BnplCalendarSection debts={active} currentDate={currentDate} />
          </View>
        }
      />
      {sheet ? <DebtSheet editing={sheet.editing} prefill={sheet.prefill} onClose={() => setSheet(null)} /> : null}
    </View>
  );
}

function DebtRow({
  debt,
  focus,
  currentDate,
  isPremium,
  onEdit,
}: {
  debt: Debt;
  focus?: boolean;
  currentDate: string;
  isPremium: boolean;
  onEdit: (d: Debt) => void;
}) {
  const c = useAppColors();
  const view = selectDebtBalanceView(debt, currentDate, isPremium);
  const est = buildEstimateCaption(view, isPremium, shortDate);
  // A stale premium estimate becomes a one-tap in-place verify: tap → accept the estimate as the
  // verified balance (re-anchors both dates to today). Blue = interactive (not the amber warning).
  const canVerify = isPremium && view.isEstimate && view.confidence.staleness === 'stale';
  const captionText = canVerify ? 'estimated · tap to verify' : est.text || undefined;
  const captionColor = canVerify ? c.accent.primary : est.attention ? c.accent.warning : undefined;
  // Progress off the (projected) current balance so the bar tracks what the row shows.
  const progress = debt.originalBalance && debt.originalBalance > 0 ? 1 - view.currentBalance / debt.originalBalance : undefined;
  // Installment-native BNPL reads as its plan ("2 of 4 · interest-free"), not a meaningless APR;
  // the per-payment suffix follows the plan's cadence, and the pill names the provider (2.7.3).
  const bnplRemaining = isInstallmentNative(debt) ? bnplPaymentsRemaining(debt) : null;
  const bnplTotal = isInstallmentNative(debt) ? bnplPaymentsTotal(debt) : null;
  const isBnpl = debt.type === 'bnpl';
  const balanceText = view.isEstimate ? `~${formatWhole(view.currentBalance)}` : formatCurrency(view.currentBalance);
  const meta = bnplRemaining != null && bnplTotal != null
    ? `${balanceText} · ${bnplTotal - bnplRemaining} of ${bnplTotal} paid · interest-free`
    : isBnpl
      ? `${balanceText} · interest-free`
      : `${balanceText} · ${debt.apr}% APR`;
  const chips = [
    focus ? <Pill key="f" label="Focus" tone="action" /> : null,
    isBnpl ? <Pill key="b" label={debt.bnplProvider || 'BNPL'} tone="neutral" /> : debt.isAutopay ? <Pill key="a" label="Autopay" tone="autopay" /> : null,
  ].filter(Boolean);
  return (
    <ListRow
      title={debt.name}
      meta={meta}
      caption={captionText}
      captionColor={captionColor}
      onCaptionPress={canVerify ? () => appStore.getState().verifyDebtBalance(debt.id, view.currentBalance, currentDate) : undefined}
      amount={formatCurrency(debt.minimumPayment)}
      amountSuffix={isBnpl ? (CADENCE_SUFFIX[debt.recurrence] || '/mo') : '/mo'}
      badges={chips.length ? <>{chips}</> : undefined}
      progress={progress}
      progressColor={focus ? c.accent.primary : undefined}
      onPress={() => onEdit(debt)}
    />
  );
}

// ── Bills (required expenses) — the management surface. Paycheck-centric like the rest of the app:
//    the anchor is what each paycheck sets aside for RECURRING bills (with an ≈/mo caption for the
//    familiar frame). One-time bills aren't part of that steady load, so they're summed + surfaced
//    on their own (never as "$0/mo"). Once long, it groups by category (collapsible, count +
//    per-paycheck subtotal) + a "One-time" group, and offers search. Own virtualized scroll. (1.5.2)
const BILL_CATEGORY_LABEL: Record<RequiredExpenseCategory, string> = {
  housing: 'Housing',
  utilities: 'Utilities',
  insurance: 'Insurance',
  subscriptions: 'Subscriptions',
  medical: 'Medical',
  other: 'Other',
};
const BILL_CATEGORY_ORDER: RequiredExpenseCategory[] = [
  'housing',
  'utilities',
  'insurance',
  'subscriptions',
  'medical',
  'other',
];
/** Below this, a flat list reads fine; at/above it, grouping + search earn their chrome. */
const BILL_GROUPING_THRESHOLD = 8;

type BillGroup = {
  key: string; // a category value, or 'one-time'
  title: string;
  count: number;
  subtotal: string; // visual, e.g. "$790/paycheck" or "$430 one-time"
  subtotalA11y: string; // spoken form (no "/" glyph)
  data: RequiredExpense[];
};

function BillsSection() {
  const expenses = useAppStore((s) => s.store.requiredExpenses);
  const living = useAppStore((s) => s.store.livingExpenses);
  const payCycle = useAppStore((s) => s.store.paycheck.payCycle);
  const [sheet, setSheet] = useState<{ editing: RequiredExpense | null } | null>(null);
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  const livingTotal = living.filter((l) => l.enabled).reduce((s, l) => s + l.amount, 0);
  const cyclesPerMonth = payCyclesPerMonth(payCycle);
  const perCycle = cyclesPerMonth > 0 ? cyclesPerMonth : 1;

  // Recurring bills = the ongoing per-paycheck load; one-time bills are discrete, summed separately.
  const recurring = expenses.filter((e) => e.recurrence !== 'one-time');
  const oneTime = expenses.filter((e) => e.recurrence === 'one-time');
  const monthlyTotal = recurring.reduce((s, e) => s + monthlyEquivalent(e.amount, e.recurrence, cyclesPerMonth), 0);
  const perPaycheckTotal = monthlyTotal / perCycle;
  const oneTimeTotal = oneTime.reduce((s, e) => s + e.amount, 0);
  const monthlyRedundant = formatWhole(perPaycheckTotal) === formatWhole(monthlyTotal); // paid monthly → ≈/mo caption is noise

  // Per-category smoothed contributions (recurring only) — feeds both the hero allocation bar and
  // the "where it goes" receipt. Sorted largest → smallest for the bar's tonal ramp.
  const categoryBreakdown = BILL_CATEGORY_ORDER.map((category) => {
      const catBills = recurring.filter((e) => e.category === category);
      return {
        key: category,
        label: BILL_CATEGORY_LABEL[category],
        perPaycheck: catBills.reduce((s, e) => s + monthlyEquivalent(e.amount, e.recurrence, cyclesPerMonth), 0) / perCycle,
        bills: catBills.map((e) => ({
          id: e.id,
          name: e.name,
          recurrence: e.recurrence,
          amount: e.amount,
          perPaycheck: monthlyEquivalent(e.amount, e.recurrence, cyclesPerMonth) / perCycle,
        })),
      };
    })
      .filter((x) => x.bills.length > 0)
      .sort((a, b) => b.perPaycheck - a.perPaycheck);

  const barTotal = categoryBreakdown.reduce((s, x) => s + x.perPaycheck, 0);
  const segCount = categoryBreakdown.length;
  const segments: AllocationSegment[] =
    barTotal > 0
      ? categoryBreakdown.map((x, i) => ({ fraction: x.perPaycheck / barTotal, opacity: segCount <= 1 ? 1 : 1 - (i / (segCount - 1)) * 0.6 }))
      : [];

  const breakdownData: BillBreakdownData = {
    perPaycheckTotal,
    monthlyTotal,
    perCycleEqualsMonth: monthlyRedundant,
    categories: categoryBreakdown,
    oneTimeTotal,
    oneTimeCount: oneTime.length,
  };

  const grouped = expenses.length >= BILL_GROUPING_THRESHOLD;
  const searching = query.trim().length > 0;

  const sections: BillGroup[] = (() => {
    const q = query.trim().toLowerCase();
    const match = (e: RequiredExpense) => !q || e.name.toLowerCase().includes(q);
    const perCheck = (bills: RequiredExpense[]) =>
      bills.reduce((s, e) => s + monthlyEquivalent(e.amount, e.recurrence, cyclesPerMonth), 0) / perCycle;

    if (!grouped) {
      // Short list: a flat list reads fine (the adaptive hero already tells the recurring/one-time story).
      const data = expenses.filter(match);
      return [{ key: 'all', title: '', count: data.length, subtotal: '', subtotalA11y: '', data }];
    }

    const recur = expenses.filter((e) => e.recurrence !== 'one-time');
    const once = expenses.filter((e) => e.recurrence === 'one-time');

    const groups: BillGroup[] = BILL_CATEGORY_ORDER.map((category) => {
      const items = recur.filter((e) => e.category === category);
      const shown = items.filter(match);
      // Count + subtotal track matches while searching, else the full group (so a collapsed header
      // still shows its true count + per-paycheck overview). Search overrides collapse.
      const summ = searching ? shown : items;
      const amt = perCheck(summ);
      const open = searching ? shown.length > 0 : !collapsed.has(category);
      return {
        key: category,
        title: BILL_CATEGORY_LABEL[category],
        count: summ.length,
        subtotal: `${formatWhole(amt)}/paycheck`,
        subtotalA11y: `${formatWhole(amt)} per paycheck`,
        data: open ? shown : [],
      };
    }).filter((g) => (searching ? g.data.length > 0 : g.count > 0));

    if (once.length > 0) {
      const shown = once.filter(match);
      if (!searching || shown.length > 0) {
        const summ = searching ? shown : once;
        const amt = summ.reduce((s, e) => s + e.amount, 0);
        const open = searching ? true : !collapsed.has('one-time');
        groups.push({
          key: 'one-time',
          title: 'One-time',
          count: summ.length,
          subtotal: `${formatWhole(amt)} one-time`,
          subtotalA11y: `${formatWhole(amt)} in one-time bills`,
          data: open ? shown : [],
        });
      }
    }
    return groups;
  })();

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (expenses.length === 0) {
    return (
      <>
        <EmptyState
          icon="receipt-long"
          title="No bills yet"
          body="Add a required bill or payment to build your paycheck plan."
          cta="Add your first bill"
          onCta={() => setSheet({ editing: null })}
        />
        {sheet ? <ExpenseSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
      </>
    );
  }

  const bills = (n: number) => (n === 1 ? 'bill' : 'bills');
  const hasBar = recurring.length > 0 && segments.length > 0;
  const hero =
    recurring.length === 0
      ? // no recurring load at all — anchor honestly on the one-time sum, never "$0 per month"
        { value: formatWhole(oneTimeTotal), sub: `${oneTime.length} one-time ${bills(oneTime.length)}`, caption: undefined as string | undefined }
      : {
          value: formatWhole(perPaycheckTotal),
          sub: 'set aside per paycheck',
          // Drop the ≈/mo caption when the user is paid monthly (per-paycheck == per-month → redundant).
          caption: monthlyRedundant ? undefined : `≈ ${formatWhole(monthlyTotal)}/mo`,
        };

  return (
    <View style={styles.flex}>
      <MoneyHero
        value={hero.value}
        sub={hero.sub}
        caption={hero.caption}
        bar={hasBar ? <AllocationBar segments={segments} /> : undefined}
        onPress={recurring.length > 0 ? () => setBreakdownOpen(true) : undefined}
      />
      {grouped ? <BillSearch value={query} onChange={setQuery} /> : null}

      <SectionList
        style={styles.flex}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.huge }}
        ItemSeparatorComponent={() => <View style={styles.rowGap} />}
        renderSectionHeader={
          grouped
            ? ({ section }) => (
                <BillGroupHeader
                  title={section.title}
                  count={section.count}
                  subtotal={section.subtotal}
                  subtotalA11y={section.subtotalA11y}
                  open={section.data.length > 0 || (searching ? false : !collapsed.has(section.key))}
                  disabled={searching}
                  onToggle={() => toggle(section.key)}
                />
              )
            : undefined
        }
        renderSectionFooter={grouped ? () => <View style={styles.rowGap} /> : undefined}
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
            meta={`Due ${shortDate(item.dueDate)} · ${item.recurrence}${item.expenseType === 'variable' ? ' · Variable' : ''}${item.isTrial && item.fullChargeDate ? ` · Trial → ${formatCurrency(item.fullAmount ?? 0)} ${shortDate(item.fullChargeDate)}` : ''}`}
            amount={formatCurrency(item.amount)}
            badges={item.isAutopay ? <Pill label="Autopay" tone="autopay" /> : undefined}
            onPress={() => setSheet({ editing: item })}
          />
        )}
        ListEmptyComponent={
          searching ? (
            <Text style={[textStyles.subhead, styles.noResults, { color: c.text.tertiary }]}>No bills match “{query.trim()}”.</Text>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.listFooter}>
            <AddRow label="Add bill" onPress={() => setSheet({ editing: null })} />
            {livingTotal > 0 ? <LivingReserve total={livingTotal} /> : null}
          </View>
        }
      />
      {sheet ? <ExpenseSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
      <BillBreakdownSheet visible={breakdownOpen} onClose={() => setBreakdownOpen(false)} data={breakdownData} />
    </View>
  );
}

/** The measured container for the hero allocation bar — Skia needs an explicit pixel width. */
function AllocationBar({ segments }: { segments: AllocationSegment[] }) {
  const c = useAppColors();
  const [w, setW] = useState(0);
  const H = 10;
  return (
    <View style={styles.allocBar} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {w > 0 ? (
        <AllocationBarCanvas width={w} height={H} segments={segments} color={c.accent.primary} trackColor={c.background.tertiary} radius={H / 2} />
      ) : null}
    </View>
  );
}

/** Lightweight search affordance (pill, no form label) — appears only when Bills is long. */
function BillSearch({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const c = useAppColors();
  return (
    <View style={[styles.search, { backgroundColor: c.background.secondary, borderColor: c.border.default }]}>
      <AppIcon name="search" size={18} color={c.text.tertiary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search bills"
        placeholderTextColor={c.text.tertiary}
        style={[textStyles.body, styles.searchInput, { color: c.text.primary }]}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChange('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
          <AppIcon name="close" size={18} color={c.text.tertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** A collapsible group header: title · count · per-paycheck (or one-time) subtotal · chevron. */
function BillGroupHeader({
  title,
  count,
  subtotal,
  subtotalA11y,
  open,
  disabled,
  onToggle,
}: {
  title: string;
  count: number;
  subtotal: string;
  subtotalA11y: string;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={disabled ? undefined : onToggle}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`${title}, ${count} ${count === 1 ? 'bill' : 'bills'}, ${subtotalA11y}`}
      style={({ pressed }) => [styles.groupHeader, { opacity: pressed && !disabled ? 0.6 : 1 }]}>
      {!disabled ? (
        <AppIcon name={open ? 'expand-more' : 'chevron-right'} size={20} color={c.text.tertiary} />
      ) : null}
      <Text style={[textStyles.footnote, styles.groupHeaderLabel, { color: c.text.secondary }]}>{title}</Text>
      <View style={[styles.groupCountPill, { backgroundColor: c.background.tertiary }]}>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{count}</Text>
      </View>
      <View style={styles.flex} />
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{subtotal}</Text>
    </Pressable>
  );
}

/** The everyday-spending reserve — tappable straight to its management screen (also in More). */
function LivingReserve({ total }: { total: number }) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={() => router.push('/living-expenses')}
      accessibilityRole="button"
      accessibilityLabel={`Everyday spending reserve, ${formatCurrency(total)}. Opens management.`}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <Card tone="accent" style={styles.living}>
        <View style={styles.livingRow}>
          <Text style={[textStyles.subhead, { color: c.text.secondary }]}>Everyday spending reserve</Text>
          <View style={styles.livingRight}>
            <Text style={[textStyles.numericBody, { color: c.text.primary }]}>{formatCurrency(total)}</Text>
            <AppIcon name="chevron-right" size={20} color={c.text.tertiary} />
          </View>
        </View>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Set aside each paycheck · tap to manage</Text>
      </Card>
    </Pressable>
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
      <MoneyHero
        value={formatWhole(totalSaved)}
        sub={`saved of ${formatWhole(totalTarget)} target`}
        caption={`${Math.round(overall * 100)}% funded`}
        bar={<HeroProgressBar pct={overall} />}
      />
      <View style={styles.goalsList}>
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
      </View>
      <AddRow label="Add goal" onPress={() => setSheet({ editing: null })} />
      {sheet ? <GoalSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
    </>
  );
}

/** A slim overall-progress bar for a Money hero (Goals) — a plain themed fill, no Skia (calm). */
function HeroProgressBar({ pct }: { pct: number }) {
  const c = useAppColors();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(pct) ? pct : 0));
  return (
    <View style={[styles.heroProgTrack, { backgroundColor: c.background.tertiary }]}>
      <View style={[styles.heroProgFill, { width: `${clamped * 100}%`, backgroundColor: c.accent.success }]} />
    </View>
  );
}

// ── shared ────────────────────────────────────────────────────────────────────
/** The calm anchoring stat for a Money section — one big number + context, on a hairline (no box).
 *  Optional dim caption for a secondary frame, an optional micro-viz `bar`, and `onPress` (a trailing
 *  chevron + the whole block becomes a tap target — e.g. Bills' "where it goes" breakdown). */
function MoneyHero({ value, sub, caption, bar, onPress }: { value: string; sub: string; caption?: string; bar?: ReactNode; onPress?: () => void }) {
  const c = useAppColors();
  const body = (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <Text style={[styles.heroNum, { color: c.text.primary }]}>{value}</Text>
        {onPress ? <AppIcon name="chevron-right" size={22} color={c.text.tertiary} /> : null}
      </View>
      <Text style={[textStyles.subhead, { color: c.text.tertiary }]}>{sub}</Text>
      {caption ? <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{caption}</Text> : null}
      {bar ? <View style={styles.heroBar}>{bar}</View> : null}
      <View style={[styles.hairline, { backgroundColor: c.border.default }]} />
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${sub}${caption ? `, ${caption}` : ''}. See where it goes.`}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rowGap: { height: spacing.sm },
  listFooter: { marginTop: spacing.md, gap: spacing.md },
  scanEmpty: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  hero: { gap: 2, marginBottom: spacing.xs },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroNum: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  heroBar: { marginTop: spacing.sm },
  allocBar: { width: '100%', height: 10 },
  heroProgTrack: { height: 8, borderRadius: 4, width: '100%', overflow: 'hidden' },
  heroProgFill: { height: '100%', borderRadius: 4 },
  goalsList: { gap: spacing.sm },
  hairline: { height: StyleSheet.hairlineWidth, marginTop: spacing.md },
  groupLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', marginTop: spacing.sm },
  strategyBlock: { gap: spacing.xs, marginTop: spacing.xs },
  strategyDesc: { textAlign: 'center' },
  living: { gap: spacing.xs },
  livingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  livingRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.base,
    height: 44,
    borderRadius: layout.inputRadius,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, paddingVertical: 0 },
  noResults: { textAlign: 'center', paddingVertical: spacing.xl },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  groupHeaderLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  groupCountPill: { minWidth: 22, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, alignItems: 'center' },
});
