import { router } from 'expo-router';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bnplPaymentsRemaining, bnplPaymentsTotal, isInstallmentNative } from '@core/debt/bnplInstallment';
import { primaryEmergencyGoal } from '@core/engine/emergencyFund';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';
import { parseStatementText } from '@core/scan/parseStatementText';
// [T8 · L2-1] `CADENCE_SUFFIX` moved beside the type it keys on — it existed here AND in
// `guardianSelectors`, and the two had already diverged (`/2 wks` vs `/2wks`, `/check` vs `/paycheck`).
import { CADENCE_SUFFIX } from '@core/types/recurrence';
import { formatCurrency } from '@core/utils/formatCurrency';

import { AddObligationSheet, type AddKind } from '@/components/entities/AddObligationSheet';
import { AmortizationPane } from '@/components/entities/AmortizationView';
import { DebtSheet } from '@/components/entities/DebtSheet';
import { ImportDebtsSheet } from '@/components/entities/ImportDebtsSheet';
import { useCoachMark } from '@/hooks/use-coach-mark';
import { selectExpenseReserveNow, selectLivingReserveRequest, selectRecurringSmoothed } from '@/store/expenseReserveSelectors';
import { TutorialTarget } from '@/store/tutorialTargets';
import { onAddDebtRequested } from '@/keyCommands/keyCommandBus';
import { LogPaymentSheet } from '@/components/entities/LogPaymentSheet';
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
import { MasterDetail } from '@/components/ui/MasterDetail';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import type { Debt, Goal, RequiredExpense } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { useLayout } from '@/hooks/use-layout';
import { useActiveStore } from '@/store/StoreContext';
import { selectDebtBalanceView, buildEstimateCaption } from '@/store/balanceSelectors';
import { hasUnreadDebtBalances, hasUnreadGoalAmounts } from '@/store/trustSelectors';
import { BILL_CATEGORY_LABEL, BILL_CATEGORY_ORDER, RECURRENCE_LABEL, resolveBillCategory } from '@/store/obligationForm';
import { looksLikeDebt } from '@/store/looksLikeDebt';
import { selectPayoffView } from '@/store/payoffSelectors';
import { selectAllocation } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { layout, pressedOpacity, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole, monthlyEquivalent } from '@/utils/format';
import { decorative, a11yExpanded } from '@/utils/a11y';

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

/**
 * 3.7.A10.4 — what belongs in each section, in the same words the add chooser uses.
 *
 * Deliberately phrased by the TEST rather than by example: the chooser carries the nouns (rent, Visa,
 * a car loan) because a person choosing needs recognition, while a person already looking at the list
 * needs the rule that explains why the thing they expected isn't in it.
 */
const SECTION_CAPTION: Record<MoneyView, string> = {
  debts: 'Balances you’re paying down. These have an end date, and they set your debt-free date.',
  bills: 'Ongoing costs that don’t end. Reserved from every paycheck before anything goes to debt.',
  goals: 'Money you’re setting aside — saved for, not owed.',
};

export default function MoneyScreen() {
  const [view, setView] = useState<MoneyView>('debts');
  const c = useAppColors();
  const [chooser, setChooser] = useState(false);
  // 3.7.A10.1 — set when the chooser has decided; the destination section reads it once and opens its
  // own editor. The sheets stay OWNED by their sections (they hold the list, the store writes and the
  // edit path), so routing is all the screen needs to know about.
  const [autoOpen, setAutoOpen] = useState<AddKind | null>(null);
  // 3.7.A10.2 — the mis-filed expense being moved into Debts, in flight between the two sections.
  const [convertFrom, setConvertFrom] = useState<RequiredExpense | null>(null);
  const { isExpanded } = useLayout();

  // The answer must visibly LAND somewhere: switching the section as well as opening the editor is what
  // teaches the distinction. "I said it has a balance" → "…so it went in Debts" is the whole lesson, and
  // it is free here.
  const pick = (kind: AddKind) => {
    setChooser(false);
    setView(kind);
    setAutoOpen(kind);
  };

  return (
    // 3.6.2 — the Debts master-detail needs the full iPad canvas; Bills/Goals stay the centered column
    // (their iPad treatment lands at 3.6.5).
    <Screen title="Money" right={<MoreButton />} scroll={view === 'goals'} wide={isExpanded && view === 'debts'}>
      <SegmentedToggle
        value={view}
        onChange={setView}
        options={[
          { value: 'debts', label: 'Debts' },
          { value: 'bills', label: 'Expenses' },
          { value: 'goals', label: 'Goals' },
        ]}
      />
      {/* 3.7.A10.4 — one line under the toggle, so the distinction is taught to someone BROWSING and not
          only to someone adding. The chooser catches the classification at the moment it is made; this
          catches the reader who is wondering why their mortgage isn't in the list they're looking at. */}
      <Text style={[textStyles.caption, styles.sectionCaption, { color: c.text.tertiary }]}>{SECTION_CAPTION[view]}</Text>
      {view === 'debts' ? (
        <DebtsSection
          autoOpen={autoOpen === 'debts'}
          onAutoOpened={() => setAutoOpen(null)}
          onAdd={() => setChooser(true)}
          convertFrom={convertFrom}
          onConvertHandled={() => setConvertFrom(null)}
        />
      ) : view === 'bills' ? (
        <BillsSection
          autoOpen={autoOpen === 'bills'}
          onAutoOpened={() => setAutoOpen(null)}
          onAdd={() => setChooser(true)}
          // Route to Debts and open the form there, the same shape as the chooser — the move has to LAND
          // where the thing is going, or "Move to Debts" is a claim the screen never demonstrates.
          onConvert={(expense) => {
            setView('debts');
            setConvertFrom(expense);
          }}
        />
      ) : (
        <GoalsSection autoOpen={autoOpen === 'goals'} onAutoOpened={() => setAutoOpen(null)} onAdd={() => setChooser(true)} />
      )}
      {chooser ? <AddObligationSheet onPick={pick} onClose={() => setChooser(false)} /> : null}
    </Screen>
  );
}

/** Every Money section takes the same three: the chooser routed here · clear the flag · reopen the chooser. */
type SectionProps = { autoOpen: boolean; onAutoOpened: () => void; onAdd: () => void };

/**
 * 3.7.A10.2 — the quiet "is this a debt?" row, under an expense whose NAME names a borrowing instrument.
 *
 * ⚠️ **It suggests; it never re-files** ([D22c]). An automatic move would be a guess about someone's
 * money, and the two fields that make an obligation payoff-able — balance and APR — are exactly the two
 * an expense does not carry. So this opens the debt form prefilled and lets them finish it.
 *
 * ⚠️ **And it is not a warning.** The detector's false positive is telling someone their rent is secretly
 * a debt; that costs more trust than a miss costs money. Hence tertiary text, no icon, no colour, an
 * explicit "Not a debt" that is remembered — and no count, badge or nag anywhere else in the app.
 */
function MisfiledHint({ expense, onConvert }: { expense: RequiredExpense; onConvert: () => void }) {
  const c = useAppColors();
  // [R4] the store this subtree resolves to — sandbox under a demo, real singleton otherwise.
  const store_ = useActiveStore();
  return (
    <View style={[styles.misfiledHint, { borderColor: c.border.subtle }]}>
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
        Is this a debt you’re paying down? Debts count toward your debt-free date — expenses don’t.
      </Text>
      <View style={styles.misfiledActions}>
        <Pressable onPress={onConvert} accessibilityRole="button" testID={`misfiled-convert-${expense.id}`} hitSlop={8}>
          <Text style={[textStyles.caption, styles.misfiledCta, { color: c.accent.primary }]}>Move to Debts</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const seen = store_.getState().store.prefs.notDebtExpenseIds ?? [];
            store_.getState().updatePrefs({ notDebtExpenseIds: [...seen, expense.id] });
          }}
          accessibilityRole="button"
          testID={`misfiled-dismiss-${expense.id}`}
          hitSlop={8}>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Not a debt</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Open this section's own editor once, when the chooser routed here. */
function useAutoOpen(autoOpen: boolean, onAutoOpened: () => void, open: () => void) {
  useEffect(() => {
    if (!autoOpen) return;
    open();
    onAutoOpened();
    // `open` is re-created each render; depending on it would re-fire the editor on every keystroke in
    // the sheet it just opened. The flag is the trigger, and it is cleared immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);
}

// ── Debts (the hero section) — the debts + the payoff plan (strategy · order · focus, moved here
//    from Progress: management belongs in Money per the IA). Elevated visually at 1.5.
function DebtsSection({
  autoOpen,
  onAutoOpened,
  onAdd,
  convertFrom,
  onConvertHandled,
}: SectionProps & { convertFrom?: RequiredExpense | null; onConvertHandled?: () => void }) {
  const store = useAppStore((s) => s.store);
  // [R4] the store this subtree resolves to — sandbox under a demo, real singleton otherwise.
  const store_ = useActiveStore();
  const strategy = store.payoffStrategy;
  // Memoized on the store so re-renders that don't change the plan (e.g. the parent's Debts/Bills/Goals
  // section toggle) don't rebuild all three payoff trajectories.
  const view = useMemo(() => selectPayoffView(store), [store]);
  // ⛔ S1.5.3 [B4] — `convertingExpenseId` LIVES IN HERE, not beside it. It used to be its own
  // `useState` set on the conversion and cleared by nothing (`grep setConverting` returned exactly one
  // line: the setter). It was handed to every subsequent `DebtSheet`, and `DebtSheet:213` routes to
  // `convertExpenseToDebt` whenever it is present — which unconditionally deletes that expense. So:
  // tap "Move to Debts", back out, add any ordinary debt without leaving the Debts section, and the
  // original bill is deleted with no confirmation and no undo. Held on the sheet, it cannot outlive the
  // flow that created it, because `onClose` is `setSheet(null)`.
  const [sheet, setSheet] = useState<{ editing: Debt | null; prefill?: Partial<Debt>; convertingExpenseId?: string } | null>(null);
  const [logPaymentFor, setLogPaymentFor] = useState<Debt | null>(null);
  // C8 — the CSV bulk import, offered from the empty state and from the list footer.
  const [importing, setImporting] = useState(false);
  // 3.7.A0 — the debt whose payoff schedule fills the iPad DETAIL PANE. Compact never sets this: it
  // pushes the `/schedule/[id]` route instead (see `viewSchedule`).
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const { isExpanded } = useLayout(); // 3.6.2 — iPad landscape / wide → master-detail
  const paidOff = store.debts.filter((d) => d.balance <= 0);
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  // 3.6.6 — ⌘N (iPad keyboard) opens the add-debt sheet; the root key-command listener navigates here
  // and fires the bus, which this subscription turns into the same "add" the button does.
  //
  // ⚠️ 3.7.A10.1 deliberately leaves this going STRAIGHT to the debt editor rather than through the
  // chooser. [D22a] removed the section-shaped shortcuts because the section was doing the classifying
  // silently; a keyboard accelerator a user pressed on purpose is the opposite — they have already said
  // what they want, in words, and re-asking would be pedantry.
  useEffect(() => onAddDebtRequested(() => openEditor({ editing: null })), []);
  useAutoOpen(autoOpen, onAutoOpened, () => openEditor({ editing: null }));

  // 3.7.A10.2 — a conversion arriving from Bills. Prefills everything the expense already knows; the
  // user supplies the balance and the APR, which is the whole reason this is a form and not a re-file.
  useEffect(() => {
    if (!convertFrom) return;
    openEditor({
      editing: null,
      convertingExpenseId: convertFrom.id,
      prefill: { name: convertFrom.name, minimumPayment: convertFrom.amount, dueDate: convertFrom.dueDate, recurrence: convertFrom.recurrence },
    });
    onConvertHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convertFrom?.id]);

  // 3.5.5.4 — the row long-press hides four actions, and the gesture is invisible. ⚠️ **iOS only**:
  // `RowContextMenu` is a transparent passthrough on Android and web, so off-iOS this would teach a
  // gesture that does nothing. Gated at the OFFER rather than in the copy, so the mark stays owed if that
  // platform ever grows the affordance. Requires a row to exist — the subject is the first one.
  //
  // Placed ABOVE the empty-state early return: hooks cannot be called conditionally, and this screen
  // returns before the list when there are no debts.
  useCoachMark('debt-row-actions', Platform.OS === 'ios' && view.order.length > 0);

  /** Opening the editor clears any schedule in the pane — the detail pane has exactly one owner. */
  const openEditor = (next: { editing: Debt | null; prefill?: Partial<Debt>; convertingExpenseId?: string }) => {
    setScheduleFor(null);
    setSheet(next);
  };

  /**
   * 3.7.A0 — the ONE way into the payoff schedule, from every entry point (the row long-press menu and
   * the edit sheet's row). Never a sheet-from-a-sheet, which is what failed on device twice.
   *  - iPad (expanded): swap the master-detail DETAIL pane — a pushed route would cover the split.
   *  - compact/web: close the sheet FIRST (a presented Modal would occlude the pushed route), then push.
   */
  const viewSchedule = (debtId: string) => {
    if (isExpanded) {
      setSheet(null);
      setScheduleFor(debtId);
      return;
    }
    setSheet(null);
    router.push(`/schedule/${debtId}`);
  };

  /**
   * 3.5.5.4 — the ONE way into "log a payment", from both entry points (the row long-press menu and the
   * edit sheet's row), on the same terms `viewSchedule` set: **never a sheet from a sheet.**
   *
   * ⚠️ Why the sheet needed an entry at all: until now `LogPaymentSheet` had exactly ONE trigger in the
   * app — `menuActions` inside `RowContextMenu`, which is a passthrough off iOS. So a primary action was
   * reachable only by an invisible long-press, and on Android and web it was not reachable at all. Same
   * class as 3.7.A9 (a built feature with no way in), found by 3.5.5.4's reachability pass.
   */
  const logPayment = (debt: Debt) => {
    setSheet(null);
    setLogPaymentFor(debt);
  };

  // §2.8 scan-to-prefill (free): scan a statement → OCR text → parse → open the sheet PREFILLED for the
  // user to confirm. Nothing is saved without their tap. Hidden where the native scanner isn't available.
  async function handleScan() {
    const text = await scanStatement();
    if (!text) return; // cancelled
    const parsed = parseStatementText(text);
    if (parsed.balance == null && parsed.minimumPayment == null && !parsed.name) return; // nothing usable
    openEditor({ editing: null, prefill: parsed });
  }

  if (store.debts.length === 0) {
    return (
      <>
        <EmptyState
          icon="credit-card"
          title="Start your debt-free plan"
          body="Add a loan, credit card, or BNPL balance to see your debt-free date."
          cta="Add"
          onCta={onAdd}
          ctaTestID="money-add"
        />
        {isScanAvailable() ? <View style={styles.scanEmpty}><AddRow label="Scan a statement" icon="document-scanner" onPress={handleScan} /></View> : null}
        {/* C8 — the empty state is where a bulk import matters MOST: a user arriving with a portfolio
            already listed somewhere else should not have to type it in one debt at a time. */}
        <View style={styles.scanEmpty}><AddRow label="Import from CSV" icon="upload-file" onPress={() => setImporting(true)} testID="debts-import-csv" /></View>
        {sheet ? <DebtSheet editing={sheet.editing} prefill={sheet.prefill} onClose={() => setSheet(null)} convertingExpenseId={sheet.convertingExpenseId} onViewSchedule={viewSchedule} onLogPayment={logPayment} /> : null}
        {importing ? <ImportDebtsSheet onClose={() => setImporting(false)} /> : null}
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
  // ⛔ [P6.4.5 · audit L5-13] EVERY DEBT CLEARED READS AS A BROKEN PLAN, NOT A FINISHED ONE.
  // The empty state above gates on `store.debts.length === 0`, but a cleared debt STAYS in `debts` with
  // `balance <= 0` — so a debt-free user skipped it and got the full list chrome: a hero reading
  // "$0 · remaining across 0 debts", the Snowball/Avalanche toggle, and "Your debts are listed in payoff
  // order" above an empty active section. ⚡ Progress already handles this state properly (a DEBT-FREE
  // hero + the trophy shelf); Money contradicted it one tab away, on the same store.
  // ⚠️ NOT folded into the empty state — `paidOff` must still render its section. This swaps only the
  // hero and the strategy block, which are the two things that have nothing left to say.
  // ⛔ P6.8.7c.2 (B4/M3-2) — never congratulate over money the app could not READ. A debt whose balance
  // was unreadable is repaired to `0`, which puts it in `paidOff` and out of `active` — so a portfolio
  // where every balance failed to parse produced the single worst screen in the product: "Every balance
  // cleared", with the debts still owed. The repairs card on Today names them; this makes sure the
  // celebration waits until the user has answered it.
  // ⚠️ A RECOVERED repair is not an unread one. [P6.8.9.7.11.12 · A-J2-2] `'0'` parses to a real `0`, so a
  // genuinely cleared debt restored from a file holding string money would suppress this celebration for
  // the life of the install — the same permanent, invisible falsehood `.11.8` closed, mirrored. The goals
  // guards below already self-correct: each conjoins an evidence check on the repaired VALUE, and a
  // recovered value is not `0`. This one had no such conjunct, so it reads the distinction directly.
  // ⛔ [S1.5 · B1] Asked of the ONE owner. This guard used to be re-derived inline here and nowhere else,
  // so Today and Progress made the same claim with no guard at all. ⚠️ The owner is also FIELD-specific,
  // which fixes a widening S1.1's own ⓪-3 introduced: an absent `apr` now records a repair and was
  // suppressing this celebration, though it says nothing about whether the balances were read.
  const unreadDebts = hasUnreadDebtBalances(store);
  const allCleared = active.length === 0 && paidOff.length > 0 && !unreadDebts;

  const list = (
    <View style={styles.flex}>
      {allCleared ? (
        <MoneyHero value="Every balance cleared" sub={`${paidOff.length} ${paidOff.length === 1 ? 'debt' : 'debts'} paid off`} />
      ) : (
        <MoneyHero valueTestID="money-hero-debts-value" value={formatWhole(totalBal)} sub={`remaining across ${active.length} ${active.length === 1 ? 'debt' : 'debts'}`} />
      )}
      {/* ⚠️ Not rendered at all when cleared, rather than hidden — a strategy toggle with nothing to
          order is an inert control, and "listed in payoff order" is false above an empty section. */}
      {allCleared ? null : (
        <View style={styles.strategyBlock}>
          <SegmentedToggle
            value={strategy}
            onChange={(s) => store_.getState().setPayoffStrategy(s)}
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
      )}

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
        renderItem={({ item, index }) => {
          const row = (
            <DebtRow debt={item} focus={item.id === focusId} selected={isExpanded && (sheet?.editing?.id === item.id || scheduleFor === item.id)} currentDate={currentDate} isPremium={isPremium} onEdit={(x) => openEditor({ editing: x })} onLogPayment={logPayment} onViewSchedule={viewSchedule} />
          );
          // 3.5.5.4 — the FIRST row only is the coach-mark subject. A `TutorialTarget` id is a key in one
          // registry map, so registering every row would have each overwrite the last and the mark would
          // point at whichever laid out most recently.
          return index === 0 ? <TutorialTarget id="debt-row-actions">{row}</TutorialTarget> : row;
        }}
        ListFooterComponent={
          <View style={styles.listFooter}>
            <AddRow label="Add" onPress={onAdd} testID="money-add" />
            {/* §2.8 — scan a statement to prefill a new debt (free). Hidden where no native scanner. */}
            {isScanAvailable() ? <AddRow label="Scan a statement" icon="document-scanner" onPress={handleScan} /> : null}
            {/* C8 — bulk import from a CSV (free). Offered on EVERY platform: the paste path needs no
                native module, and the file picker hides itself where there isn't one. */}
            <AddRow label="Import from CSV" icon="upload-file" onPress={() => setImporting(true)} testID="debts-import-csv" />
            {/* §2.7.5 — the consolidated BNPL calendar (renders only when there are upcoming installments). */}
            <BnplCalendarSection debts={active} currentDate={currentDate} />
          </View>
        }
      />
    </View>
  );

  // The iPad detail pane shows whichever the user last asked for — the schedule (read) or the editor.
  // They're mutually exclusive: opening one clears the other, so the pane never has two owners.
  const editor = sheet ? (
    <DebtSheet inline={isExpanded} editing={sheet.editing} prefill={sheet.prefill} onClose={() => setSheet(null)} convertingExpenseId={sheet.convertingExpenseId} onViewSchedule={viewSchedule} onLogPayment={logPayment} />
  ) : null;
  const detail = scheduleFor ? <AmortizationPane debtId={scheduleFor} /> : editor;

  return (
    <>
      {isExpanded ? (
        <MasterDetail
          list={list}
          hasSelection={sheet != null || scheduleFor != null}
          detail={detail}
          detailEmpty={
            <View style={styles.detailEmpty}>
              <AppIcon name="credit-card" size={30} color={c.text.tertiary} />
              <Text style={[textStyles.subhead, styles.detailEmptyText, { color: c.text.tertiary }]}>Select a debt to edit, or add one.</Text>
            </View>
          }
        />
      ) : (
        <>
          {list}
          {editor}
        </>
      )}
      {logPaymentFor ? <LogPaymentSheet debt={logPaymentFor} onClose={() => setLogPaymentFor(null)} /> : null}
      {importing ? <ImportDebtsSheet onClose={() => setImporting(false)} /> : null}
    </>
  );
}

function DebtRow({
  debt,
  focus,
  selected,
  currentDate,
  isPremium,
  onEdit,
  onLogPayment,
  onViewSchedule,
}: {
  debt: Debt;
  focus?: boolean;
  /** 3.6.2 — the row whose detail pane is open, on the iPad master-detail. */
  selected?: boolean;
  currentDate: string;
  isPremium: boolean;
  onEdit: (d: Debt) => void;
  onLogPayment: (d: Debt) => void;
  /** 3.7.A0 — the iOS long-press fast path into the payoff schedule. */
  onViewSchedule: (debtId: string) => void;
}) {
  const c = useAppColors();
  // [R4] the store this subtree resolves to — sandbox under a demo, real singleton otherwise.
  const store_ = useActiveStore();
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
  // ⛔ The provider chip is not decoration — `meta` above never names the provider, because the pill was
  // designed to (2.7.3). While these were rendered nodes the row spoke the meta and dropped the pill, so a
  // VoiceOver user heard "2 of 4 paid, interest-free" about a debt whose name they were never told.
  const chips = [
    focus ? { key: 'f', label: 'Focus', tone: 'action' as const } : null,
    isBnpl
      ? { key: 'b', label: debt.bnplProvider || 'BNPL', tone: 'neutral' as const }
      : debt.isAutopay
        ? { key: 'a', label: 'Autopay', tone: 'autopay' as const }
        : null,
  ].filter((chip) => chip !== null);
  return (
    <ListRow
      title={debt.name}
      meta={meta}
      caption={captionText}
      captionColor={captionColor}
      onCaptionPress={canVerify ? () => store_.getState().verifyDebtBalance(debt.id, view.currentBalance, currentDate) : undefined}
      amount={formatCurrency(debt.minimumPayment)}
      amountSuffix={isBnpl ? (CADENCE_SUFFIX[debt.recurrence] || '/mo') : '/mo'}
      badges={chips.length ? chips : undefined}
      progress={progress}
      progressColor={focus ? c.accent.primary : undefined}
      onPress={() => onEdit(debt)}
      onDelete={() => store_.getState().removeDebt(debt.id)}
      onLogPayment={() => onLogPayment(debt)}
      onViewSchedule={() => onViewSchedule(debt.id)}
      selected={selected}
    />
  );
}

// ── Bills (required expenses) — the management surface. Paycheck-centric like the rest of the app:
//    the anchor is what each paycheck sets aside for RECURRING bills (with an ≈/mo caption for the
//    familiar frame). One-time bills aren't part of that steady load, so they're summed + surfaced
//    on their own (never as "$0/mo"). Once long, it groups by category (collapsible, count +
//    per-paycheck subtotal) + a "One-time" group, and offers search. Own virtualized scroll. (1.5.2)

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

function BillsSection({ autoOpen, onAutoOpened, onAdd, onConvert }: SectionProps & { onConvert: (e: RequiredExpense) => void }) {
  const expenses = useAppStore((s) => s.store.requiredExpenses);
  // [R4] the store this subtree resolves to — sandbox under a demo, real singleton otherwise.
  const store_ = useActiveStore();
  const dismissedHints = useAppStore((s) => s.store.prefs.notDebtExpenseIds ?? []);
  // ⚠️ [P6.4.3 · L4-15] The raw `livingExpenses` subscription is GONE — `selectLivingReserveRequest`
  // owns that derivation now, and this component no longer needs the list itself. Caught by eslint at
  // the release gate, not by re-reading: extracting a derivation orphans whatever fed it.
  const payCycle = useAppStore((s) => s.store.paycheck.payCycle);
  const [sheet, setSheet] = useState<{ editing: RequiredExpense | null } | null>(null);
  useAutoOpen(autoOpen, onAutoOpened, () => setSheet({ editing: null }));
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  // 3.8.4 — what is actually set aside right now (pot after this cycle's draw + what this paycheck held).
  const reserveNow = useAppStore((s) => selectExpenseReserveNow(s.store));

  // [P6.4.3 · L4-15] One owner — `living-expenses.tsx` had this expression verbatim.
  const livingTotal = useAppStore((s) => selectLivingReserveRequest(s.store));
  const cyclesPerMonth = payCyclesPerMonth(payCycle);
  const perCycle = cyclesPerMonth > 0 ? cyclesPerMonth : 1;

  // Recurring bills = the ongoing per-paycheck load; one-time bills are discrete, summed separately.
  const recurring = expenses.filter((e) => e.recurrence !== 'one-time');
  const oneTime = expenses.filter((e) => e.recurrence === 'one-time');
  // 3.8.3 — the smoothing has ONE owner now. It used to be derived here and nowhere else, which was fine
  // until 3.8's offer needed the same figure; a second derivation is how "two places, one rule" starts.
  // ⛔ Called on an already-subscribed store, never handed to `useAppStore` — it returns a fresh OBJECT,
  // and a store selector that does so re-renders forever and blanks the screen (see Today's `reserveOffer`).
  const billsStore = useAppStore((s) => s.store);
  const { monthlyTotal, perPaycheckTotal } = selectRecurringSmoothed(billsStore);
  const oneTimeTotal = oneTime.reduce((s, e) => s + e.amount, 0);
  const monthlyRedundant = formatWhole(perPaycheckTotal) === formatWhole(monthlyTotal); // paid monthly → ≈/mo caption is noise

  // Per-category smoothed contributions (recurring only) — feeds both the hero allocation bar and
  // the "where it goes" receipt. Sorted largest → smallest for the bar's tonal ramp.
  const categoryBreakdown = BILL_CATEGORY_ORDER.map((category) => {
      // ⛔ `resolveBillCategory`, never `e.category` — see its docblock. [S1 · M1] This receipt dropped
      // the same uncategorised bill the grouped list below did, so "where it goes" was short by it too.
      const catBills = recurring.filter((e) => resolveBillCategory(e) === category);
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

  // 3.8.4 — the hero bar no longer shows the load's CATEGORY MIX (that was a true picture of a different
  // figure; under a pot headline it would read as its breakdown). `categoryBreakdown` still feeds the
  // receipt sheet, which is where a composition belongs.
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
      // ⛔ `resolveBillCategory`, never `e.category` — see its docblock. [S1 · M1]
      const items = recur.filter((e) => resolveBillCategory(e) === category);
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
          title: RECURRENCE_LABEL['one-time'],
          count: summ.length,
          subtotal: `${formatWhole(amt)} one-time`,
          subtotalA11y: `${formatWhole(amt)} in one-time expenses`,
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
          title="Build your paycheck plan"
          body="Add an ongoing cost — rent, utilities, a subscription — so your plan knows what’s due."
          cta="Add"
          onCta={onAdd}
          ctaTestID="money-add"
        />
        {/* T3B (audit L5-3) — the everyday-spending door has to open on day ONE. Its own comment says
            "a door that only opens once you are already inside is not a door", and its `livingTotal > 0`
            gate was removed for exactly that reason — but the card lives in the SectionList footer, and
            this branch returns before the SectionList exists. So the one user who most needs it, the one
            with nothing entered yet, was still the one who could not see it. */}
        <LivingReserve total={livingTotal} />
        {sheet ? <ExpenseSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
      </>
    );
  }

  // T4.4 (L1-6) — the tab is "Expenses", so its contents are expenses. "bills" survives only where the
  // copy means a single real-world charge arriving, never the class of things this screen lists.
  const expenseWord = (n: number) => (n === 1 ? 'expense' : 'expenses');
  // 3.8.4 — the hero reads the REAL reserve, not `perPaycheckTotal`.
  //
  // ⛔ The number was never the lie; the VERB was. `$500/mo ÷ 2.17 paychecks = $231` is correct arithmetic
  // for a recommendation, and the app called it "reserved" while nothing reserved it. 3.8 makes the word
  // true, so the hero survives and changes SOURCE: it now shows what is actually set aside ($0 … the
  // recommendation) and demotes the smoothed figure to a caption, where it reads as the advice it is.
  const reservedNow = reserveNow;
  const barFraction = perPaycheckTotal > 0 ? Math.min(1, reservedNow / perPaycheckTotal) : 0;
  // The bar now fills toward the recommendation, so it breaks down the hero's OWN number. It used to show
  // the load's category mix — a true picture of a DIFFERENT figure, which under a pot headline would read
  // as its breakdown. That composition is one tap away in the receipt sheet, which is where it belongs.
  const hasBar = recurring.length > 0 && perPaycheckTotal > 0;
  const heroSegments: AllocationSegment[] = [
    { fraction: barFraction, opacity: 1 },
    { fraction: Math.max(0, 1 - barFraction), opacity: 0.18 },
  ].filter((s) => s.fraction > 0);
  const hero =
    recurring.length === 0
      ? // no recurring load at all — anchor honestly on the one-time sum, never "$0 per month"
        { value: formatWhole(oneTimeTotal), sub: `${oneTime.length} one-time ${expenseWord(oneTime.length)}`, caption: undefined as string | undefined }
      : {
          value: formatWhole(reservedNow),
          sub: 'reserved for upcoming expenses',
          // The recommendation, named as a recommendation. Still shows the ≈/mo load unless the user is
          // paid monthly (per-paycheck == per-month → redundant).
          caption: monthlyRedundant
            ? `of ${formatWhole(perPaycheckTotal)} recommended each paycheck`
            : `of ${formatWhole(perPaycheckTotal)} recommended each paycheck · ≈ ${formatWhole(monthlyTotal)}/mo`,
        };

  return (
    <View style={styles.flex}>
      <MoneyHero
        valueTestID="money-hero-expenses-value"
        value={hero.value}
        sub={hero.sub}
        caption={hero.caption}
        bar={hasBar ? <AllocationBar segments={heroSegments} /> : undefined}
        onPress={recurring.length > 0 ? () => setBreakdownOpen(true) : undefined}
      />
      {/* T3.6 (audit L5-5) — `|| searching`, and that half is the fix. The field used to render on
          `grouped` alone, but the flat branch still FILTERS by `query`: swipe-delete a bill while
          searching, the count drops below the grouping threshold, and the field unmounts while the
          query it wrote survives. The user is left looking at one row — or at "No expenses match" — with
          no search box and no way to clear it, and the only escape is leaving the tab.
          The invariant, worth more than the case: never unmount the ONLY control that can undo a state
          the user is still in. */}
      {grouped || searching ? <BillSearch value={query} onChange={setQuery} /> : null}

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
          <>
            <ListRow
              title={item.name}
              meta={`Due ${shortDate(item.dueDate)} · ${item.recurrence}${item.expenseType === 'variable' ? ' · Variable' : ''}${item.isTrial && item.fullChargeDate ? ` · Trial → ${formatCurrency(item.fullAmount ?? 0)} ${shortDate(item.fullChargeDate)}` : ''}`}
              amount={formatCurrency(item.amount)}
              badges={item.isAutopay ? [{ label: 'Autopay', tone: 'autopay' }] : undefined}
              onPress={() => setSheet({ editing: item })}
              onDelete={() => store_.getState().removeExpense(item.id)}
            />
            {looksLikeDebt(item) && !dismissedHints.includes(item.id) ? (
              <MisfiledHint expense={item} onConvert={() => onConvert(item)} />
            ) : null}
          </>
        )}
        ListEmptyComponent={
          searching ? (
            <Text style={[textStyles.subhead, styles.noResults, { color: c.text.tertiary }]}>No expenses match “{query.trim()}”.</Text>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.listFooter}>
            <AddRow label="Add" onPress={onAdd} testID="money-add" />
            {/* 3.8.5 — the `livingTotal > 0` gate is GONE. The card was the discoverable door to everyday
                spending and it only appeared once you already had some, so it was visible exclusively to
                users who had already found the feature. Empty state included; the Today hero's "Spoken for"
                tap is the other, unconditional door. */}
            <LivingReserve total={livingTotal} />
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
    <View style={styles.allocBar} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))} {...decorative}>
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
    <View style={[styles.search, { backgroundColor: c.background.secondary, borderColor: c.border.control }]}>
      <AppIcon name="search" size={18} color={c.text.tertiary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search expenses"
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
      {...a11yExpanded(open)}
      accessibilityLabel={`${title}, ${count} ${count === 1 ? 'expense' : 'expenses'}, ${subtotalA11y}`}
      style={({ pressed }) => [styles.groupHeader, { opacity: pressed && !disabled ? pressedOpacity : 1 }]}>
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
  // ⛔ [L3-6] `total` is what the user CONFIGURED, and this card is the door to configuring it, so the
  // figure stays the configured one. The caption is the part that made a claim about outcome — and the
  // engine clamps an over-sized reserve to what the paycheck holds (`Math.max(0, …)`), absorbing the
  // overflow with no record against the reserve. So the caption asks the allocation, not the sum.
  const held = useAppStore((s) => selectAllocation(s.store)?.livingExpenseHeld ?? 0);
  // 3.8.5 — the empty state is the entire point of removing the `> 0` gate: a door that only opens once
  // you are already inside is not a door.
  const empty = total <= 0;
  const shortHeld = !empty && held < total;
  return (
    <Pressable
      onPress={() => router.push('/living-expenses')}
      accessibilityRole="button"
      accessibilityLabel={
        empty
          ? 'Everyday spending reserve, nothing set up yet. Opens management.'
          : `Everyday spending reserve, ${formatCurrency(total)}. Opens management.`
      }
      style={({ pressed }) => [{ opacity: pressed ? pressedOpacity : 1 }]}>
      {/* ⛔ [P6.8.9.7.11.14.4 · L4-13b] THIS CARD AND THE HERO BELOW ARE THE FINDING, BY NAME: two
          card-sized targets on ONE screen dimming to 0.85 and 0.8 — a difference a user can see and
          nobody chose. Both are the token now. */}
      <Card tone="accent" style={styles.living}>
        <View style={styles.livingRow}>
          <Text style={[textStyles.subhead, { color: c.text.secondary }]}>Everyday spending reserve</Text>
          <View style={styles.livingRight}>
            <Text style={[textStyles.numericBody, { color: empty ? c.text.tertiary : c.text.primary }]}>
              {empty ? 'Not set up' : formatCurrency(total)}
            </Text>
            <AppIcon name="chevron-right" size={20} color={c.text.tertiary} />
          </View>
        </View>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
          {empty
            ? 'Groceries, gas, fun money — reserve it each paycheck'
            : shortHeld
              ? `This paycheck holds ${formatCurrency(held)} of it · tap to manage`
              : 'Reserved each paycheck · tap to manage'}
        </Text>
      </Card>
    </Pressable>
  );
}

// ── Goals ─────────────────────────────────────────────────────────────────────
function GoalsSection({ autoOpen, onAutoOpened, onAdd }: SectionProps) {
  const goals = useAppStore((s) => s.store.goals);
  // Which goal the waterfall means by "the emergency fund" — the same owner the engine asks.
  const primaryEf = primaryEmergencyGoal(goals);
  // See the `funded` guard below — a goal whose target could not be read repairs to `0`, and `0 >= 0`
  // badges it as Funded. Same rule the debts branch already applies via `unreadDebts`.
  // ⛔ [S1.5 · B1] The one owner again. ⚠️ It excludes a clean `recovered`, which the inline version did
  // not — a goal whose target was written `'5,000'` was read correctly and should still badge Funded.
  const unreadGoals = useAppStore((s) => hasUnreadGoalAmounts(s.store));
  // [R4] the store this subtree resolves to — sandbox under a demo, real singleton otherwise.
  const store_ = useActiveStore();
  const [sheet, setSheet] = useState<{ editing: Goal | null } | null>(null);
  useAutoOpen(autoOpen, onAutoOpened, () => setSheet({ editing: null }));

  if (goals.length === 0) {
    return (
      <>
        <EmptyState
          icon="flag"
          title="Start a savings goal"
          body="Add an emergency fund or savings goal to start tracking progress."
          cta="Add"
          onCta={onAdd}
          ctaTestID="money-add"
        />
        {sheet ? <GoalSheet editing={sheet.editing} onClose={() => setSheet(null)} /> : null}
      </>
    );
  }

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  /**
   * ⛔ **THE SAME RULE AS THE `Funded` BADGE, ON THE BIGGEST NUMBER ON THE SCREEN.** [P6.8.9.7.11.9 · B-7]
   * An unreadable `targetAmount` repairs to `0`, so a healthy goal beside a repaired one divides a real
   * `totalSaved` by a `totalTarget` missing that goal's share — and the hero reads **"150% funded"** with
   * a full bar, over money the app could not read.
   *
   * ⛔ **SUPPRESSED, NOT CLAMPED.** [P6.8.9.7.11.10 · A-J1] The first cut was `Math.min(1, …)`, which hides
   * the arithmetic tell and keeps the falsehood: the same store then reads *"$1,500 · saved of $1,000
   * target · 100% funded"* with a full bar. A percentage of a total the app could not read is not a number
   * to bound — it is a number that must not be stated. The badge suppresses; so does this.
   */
  const overall = totalTarget > 0 ? totalSaved / totalTarget : 0;
  const targetUnread = unreadGoals && goals.some((g) => g.targetAmount === 0);

  return (
    <>
      <MoneyHero
        value={formatWhole(totalSaved)}
        sub={targetUnread ? 'saved — one target could not be read' : `saved of ${formatWhole(totalTarget)} target`}
        caption={targetUnread ? undefined : `${Math.round(overall * 100)}% funded`}
        bar={targetUnread ? undefined : <HeroProgressBar pct={overall} />}
      />
      <View style={styles.goalsList}>
        {goals.map((g) => {
          const pct = g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0;
          /**
           * ⛔ **NEVER CONGRATULATE OVER MONEY THE APP COULD NOT READ** — the rule this file already states
           * for debts (see `allCleared` above), applied to the branch that never got it. [P6.8.9.7.11.4]
           *
           * An unreadable `targetAmount` repairs to `0`, and `0 >= 0` is **true** — so a goal whose target
           * failed to parse rendered a green **"Funded"** badge reading *"$0 saved"*. The debts branch
           * guards precisely this, six hundred lines up, in a comment that calls the ungated version *"the
           * single worst screen in the product"*. Goals were added to `DataRepair['entity']` at
           * P6.8.9.7.2 and this consumer was never revisited.
           *
           * ⚠️ Scoped to `pct === 0` deliberately: a goal genuinely at its target must still read Funded
           * while OTHER repairs are pending. The suppression is about *this* number being unreadable, not
           * about the store being generally suspect.
           */
          /**
           * ⛔ **SUPPRESSING THE BADGE WAS HALF THE FIX, AND THE OTHER HALF STATED SOMETHING FALSE.**
           * [S1 · found by M2's after-scan · measured, not reasoned] `.11.4` stopped a goal with an
           * unreadable target from wearing a **Funded** pill — and then let the row fall through to the
           * `left` branch, where `Math.max(0, 0 - currentAmount)` is **`$0`**. Measured on the real
           * screen: `"House Fund, Savings, $0 left"` over $500 saved and a target the app could not read,
           * one inch under a hero that says *"one target could not be read"* and correctly drops its own
           * progress bar. **The guard was on the badge and absent from the sentence beside it** — the
           * same shape as this pass's B1 and B5.
           *
           * ⚠️ The `pct` bar goes with it, for the hero's reason: a fill computed against a target that
           * could not be read is a second false signal, and it would draw 0% over money that exists.
           */
          const targetUnreadable = unreadGoals && g.targetAmount === 0;
          const funded = g.currentAmount >= g.targetAmount && !targetUnreadable;
          // ⚠️ Only THE emergency fund is labelled as one. [P6.8.9.7.11.12 · A-J2-4] A second
          // `emergency`-typed goal is funded through the savings rungs, and a row claiming "Emergency
          // fund" while behaving as savings is the misdescription the fix exists to end.
          const meta = g === primaryEf ? 'Emergency fund' : 'Savings';
          return (
            <ListRow
              key={g.id}
              title={g.name}
              meta={meta}
              /**
               * ⛔ **`currentAmount` under the label `saved` — the two are equal ONLY at the target.**
               * [S1 · pass 1 · M2] The funded branch printed `targetAmount`, so a goal past its target
               * reported the SMALLER number and called it the amount saved: *"$1,000 saved"* over a pot
               * holding $5,000, one inch under a hero that totals `currentAmount` correctly and says
               * *"$5,500 · 183% funded"*. Nothing prevents over-funding — `GoalSheet.submit()` validates
               * target and current independently and never compares them, and a negative `applyTightTopUp`
               * (an undo) can push `currentAmount` past the target on its own.
               *
               * ⚠️ `formatWhole`, matching the hero directly above rather than the `left` branch beside it:
               * the figure this row was caught DISAGREEING with is the hero's, so they now agree by
               * construction. The `left` branch keeps `formatCurrency` — a remainder is the one place
               * cents are worth showing.
               */
              amount={
                funded || targetUnreadable
                  ? formatWhole(g.currentAmount)
                  : formatCurrency(Math.max(0, g.targetAmount - g.currentAmount))
              }
              amountSuffix={funded || targetUnreadable ? ' saved' : ' left'}
              // ⛔ The honest state, SAID — not merely the false one withheld. The row states what the
              // user actually has and names why there is no remainder; the hero's wording, per row.
              caption={targetUnreadable ? 'Target could not be read' : undefined}
              badges={funded ? [{ label: 'Funded', tone: 'paid' }] : undefined}
              progress={targetUnreadable ? undefined : pct}
              onPress={() => setSheet({ editing: g })}
              onDelete={() => store_.getState().removeGoal(g.id)}
            />
          );
        })}
      </View>
      <AddRow label="Add" onPress={onAdd} testID="money-add" />
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
function MoneyHero({
  value,
  sub,
  caption,
  bar,
  onPress,
  // ⚠️ Optional and per-CALLER, because Money renders three of these (debts, allocation, goals) — a fixed
  // id here would be ambiguous the moment a spec looked for it. [P6.8.9.7.11.12.10]
  valueTestID,
}: { value: string; sub: string; caption?: string; bar?: ReactNode; onPress?: () => void; valueTestID?: string }) {
  const c = useAppColors();
  const body = (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <Text testID={valueTestID} maxFontSizeMultiplier={1.3} numberOfLines={1} style={[styles.heroNum, { color: c.text.primary }]}>{value}</Text>
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
      style={({ pressed }) => [{ opacity: pressed ? pressedOpacity : 1 }]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Indented and hairline-bordered so it reads as a note attached to the row above it, not as a row of
  // its own competing for the same list.
  misfiledHint: { marginTop: -spacing.xs, marginBottom: spacing.sm, marginLeft: spacing.base, paddingLeft: spacing.md, paddingVertical: spacing.sm, borderLeftWidth: StyleSheet.hairlineWidth, gap: spacing.sm },
  sectionCaption: { marginTop: spacing.sm, marginBottom: spacing.xs, lineHeight: 17 },
  misfiledActions: { flexDirection: 'row', gap: spacing.lg },
  misfiledCta: { fontWeight: '600' },
  flex: { flex: 1 },
  detailEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl },
  detailEmptyText: { textAlign: 'center' },
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
