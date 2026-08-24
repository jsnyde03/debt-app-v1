import { PAYCHECK_SEGMENT } from '@core/copy/vocabulary';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  buildPaydayCaptureItems,
  captureKey,
  type PaydayCaptureOverride,
} from '@core/debt/buildPaydayCaptureItems';
import { requiredDisplayLabel } from '@core/debt/deriveRequiredActionView';
import type { RequiredReconciliation } from '@core/debt/bulkMarkRequired';
import { formatCurrency } from '@core/utils/formatCurrency';

import { AppIcon } from '@/components/ui/AppIcon';
import { SheetBackdrop } from '@/components/ui/SheetBackdrop';
import { sheetStyles } from '@/components/ui/sheet-styles';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSheetPresentation } from '@/hooks/use-sheet-presentation';
import { CountUp, haptics, useReduceMotion } from '@/motion';
import { elevation } from '@/theme/elevation';
import { parseNonNegativeAmount } from '@/store/amountField';
import type { DebtBalanceView } from '@/store/balanceSelectors';
import type { ActiveRecommendedAction, RequiredRow } from '@/store/planSelectors';
import { spring } from '@/theme/motion';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { a11yChecked } from '@/utils/a11y';
import { formatWhole } from '@/utils/format';

function shortDate(iso?: string): string {
  if (!iso) return 'a while ago';
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isExpenseRow(row: RequiredRow): boolean {
  return row.item.category === 'expense' || row.item.category === 'autopay_expense';
}
function rowId(row: RequiredRow): string | undefined {
  return isExpenseRow(row) ? row.item.targetId : (row.item.debtId ?? row.item.targetId);
}

/**
 * Payday Autopilot's capture sheet — a faithful RN rebuild of the settled v1.6 flow (Jason
 * 2026-07-19), presented as a slide-up Modal. Confirms the whole paycheck: required bills +
 * minimums (one-tap, or itemized via Adjust) AND the extra payments. Feeds the Interest-Saved
 * Ledger + Drift Tracker. (Drag-to-dismiss + the success animation land at B.9.)
 */
export function PaydayCaptureSheet({
  visible,
  activeRecommendedActions,
  requiredRows,
  requiredTotal,
  staleBalances,
  currentDate,
  onVerifyBalances,
  onCapture,
  onDismiss,
  onClose,
}: {
  visible: boolean;
  activeRecommendedActions: ActiveRecommendedAction[];
  requiredRows: RequiredRow[];
  requiredTotal: number;
  /** Premium debts whose estimate has gone stale — the decay-gated balance re-verify batch (2.3.5). Empty = no card. */
  staleBalances: DebtBalanceView[];
  currentDate: string;
  onVerifyBalances: (entries: { id: string; balance: number }[], verifiedDate: string) => void;
  /**
   * P6.8.7e.2 [C1] — `surpriseOutflow` is the third argument, and it is why this callback changed shape.
   *
   * ⛔ The absorb engine is CORRECT and untouched. What it never had was a caller: `index.tsx` invoked
   * `capturePayday(items, decisions)` with **no actuals at all**, and the only two callers in the repo that
   * supplied one were the tutorial sandbox and a test scenario. So `surpriseOutflowLog` could never grow in
   * production, and the two safety-net acknowledgements Today is built to render — plus `LeanSuggestionCard`
   * — were unreachable code that shipped. **A built feature with no way in** (the 3.7.A9 class).
   */
  onCapture: (
    items: ReturnType<typeof buildPaydayCaptureItems>,
    requiredDecisions: RequiredReconciliation,
    surpriseOutflow?: number,
  ) => void;
  onDismiss: () => void;
  onClose: () => void;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { pan, scrimStyle, sheetStyle, onBackdrop, onSheetLayout } = useSheetPresentation(onClose);

  const [editingExtraKey, setEditingExtraKey] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, PaydayCaptureOverride>>({});
  const [captured, setCaptured] = useState(false);
  // P6.8.7e.2 [C1] — the absorb path's only user entry point. Blank on every ordinary payday.
  const [surpriseAmount, setSurpriseAmount] = useState('');
  const [adjustingRequired, setAdjustingRequired] = useState(false);
  const [hasAdjustedRequired, setHasAdjustedRequired] = useState(false);
  const [requiredPaid, setRequiredPaid] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const row of requiredRows) {
      const id = rowId(row);
      if (id) init[id] = row.view.isPaid || row.view.presumedPaid;
    }
    return init;
  });
  const [preMarkAllPaid, setPreMarkAllPaid] = useState<Record<string, boolean> | null>(null);

  // Balance re-verify (2.3.5) — the decay-gated "do these still look right?" batch.
  const [checkingBalances, setCheckingBalances] = useState(false);
  const [balancesConfirmed, setBalancesConfirmed] = useState(false);
  const [balanceEdits, setBalanceEdits] = useState<Record<string, string>>({});
  const showBalanceCheck = staleBalances.length > 0 && !balancesConfirmed;

  function confirmAllBalances() {
    // "These look right" — accept every estimate as the verified balance (zero typing).
    onVerifyBalances(staleBalances.map((v) => ({ id: v.debt.id, balance: v.currentBalance })), currentDate);
    haptics.light();
    setBalancesConfirmed(true);
  }
  function openBalanceCheck() {
    // Pre-fill each input with the rounded estimate → the default is "accept the estimate".
    const seed: Record<string, string> = {};
    for (const v of staleBalances) seed[v.debt.id] = String(Math.round(v.currentBalance));
    setBalanceEdits(seed);
    setCheckingBalances(true);
  }
  function confirmEditedBalances() {
    const entries = staleBalances.map((v) => {
      // ⛔ Blank must fall back to the estimate, not to zero. `Number('')` is `0`, so clearing a
      // pre-filled balance used to CONFIRM the debt at $0 — which files it under `PAID OFF` and drops it
      // from the plan, the payoff schedule and the widget. A typed `0` still means zero.
      const typed = parseNonNegativeAmount(balanceEdits[v.debt.id] ?? '');
      return { id: v.debt.id, balance: typed ?? v.currentBalance };
    });
    onVerifyBalances(entries, currentDate);
    haptics.light();
    setBalancesConfirmed(true);
    setCheckingBalances(false);
  }

  const requiredCount = requiredRows.length;
  const carryForward = requiredRows.reduce((sum, row) => {
    const id = rowId(row);
    return id && requiredPaid[id] === false ? sum + row.item.amount : sum;
  }, 0);
  const plannedTotal = activeRecommendedActions.reduce((sum, a) => {
    const o = overrides[captureKey(a)] ?? {};
    return o.skipped ? sum : sum + (o.actualAmount ?? a.actualAmount);
  }, 0);
  const extrasAdjusted = activeRecommendedActions.some((a) => {
    const o = overrides[captureKey(a)];
    return !!o && (o.skipped || o.actualAmount !== undefined || o.external);
  });
  // Mirror the capture decision: "I followed the plan" (no adjustment) marks all required paid;
  // once adjusted, only the confirmed-paid portion counts (the rest carries forward).
  const capturedTotal = (hasAdjustedRequired ? Math.max(0, requiredTotal - carryForward) : requiredTotal) + plannedTotal;

  function setOverride(key: string, patch: Partial<PaydayCaptureOverride>) {
    setOverrides((cur) => ({ ...cur, [key]: { ...cur[key], ...patch } }));
  }
  function toggleRequired(id: string | undefined) {
    if (!id) return;
    setRequiredPaid((cur) => ({ ...cur, [id]: !(cur[id] ?? true) }));
    setHasAdjustedRequired(true);
    setPreMarkAllPaid(null);
  }
  function toggleMarkAllRequired() {
    if (preMarkAllPaid) {
      setRequiredPaid(preMarkAllPaid);
      setPreMarkAllPaid(null);
      return;
    }
    setPreMarkAllPaid(requiredPaid);
    setRequiredPaid(() => {
      const next: Record<string, boolean> = {};
      for (const row of requiredRows) {
        const id = rowId(row);
        if (id) next[id] = true;
      }
      return next;
    });
    setHasAdjustedRequired(true);
  }
  function decisionsFrom(allPaid: boolean): RequiredReconciliation {
    const expensePaid: Record<string, boolean> = {};
    const debtPaid: Record<string, boolean> = {};
    for (const row of requiredRows) {
      const id = rowId(row);
      if (!id) continue;
      const paid = allPaid ? true : (requiredPaid[id] ?? true);
      if (isExpenseRow(row)) expensePaid[id] = paid;
      else debtPaid[id] = paid;
    }
    return { expensePaid, debtPaid };
  }
  function handleCapture() {
    if (captured) return;
    const items = buildPaydayCaptureItems(
      activeRecommendedActions
        .filter((a) => !overrides[captureKey(a)]?.skipped)
        .map((a) => ({
          targetId: a.targetId,
          label: a.label,
          category: a.category,
          recommendedAmount: a.recommendedAmount,
          actualAmount: a.actualAmount,
        })),
      overrides,
    );
    const decisions = decisionsFrom(!hasAdjustedRequired);
    // P6.8.7e.2 [C1] — blank means "nothing unexpected", which is most cycles. ⚠️ `undefined` rather than
    // `0`: a recorded zero-amount surprise is a cycle event that happened, and the Guardian reconciles
    // against the log. "Nothing came out" must leave no trace, or every ordinary payday logs a surprise.
    const surprise = parseNonNegativeAmount(surpriseAmount);
    haptics.success(); // the payday-completion beat — quiet count-up + a success tick (motion spec §5)
    setCaptured(true);
    setTimeout(() => onCapture(items, decisions, surprise != null && surprise > 0 ? surprise : undefined), 1300);
  }

  const requiredSub = hasAdjustedRequired
    ? carryForward > 0
      ? `${formatCurrency(requiredTotal - carryForward)} paid · ${formatCurrency(carryForward)} carries`
      : 'All confirmed paid'
    : `${requiredCount} due this paycheck`;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onBackdrop}>
      <GestureHandlerRootView style={sheetStyles.flex}>
        <KeyboardAvoidingView style={sheetStyles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SheetBackdrop scrimStyle={scrimStyle} onPress={onBackdrop} />
          <Animated.View
            onLayout={onSheetLayout}
            style={[
              styles.sheet,
              { backgroundColor: c.background.primary, paddingBottom: insets.bottom + spacing.base },
              elevation.raised[scheme],
              scheme === 'dark' && sheetStyles.sheetDarkEdge,
              sheetStyle,
            ]}>
            <GestureDetector gesture={pan}>
              <View style={sheetStyles.grabZone}>
                <View style={[sheetStyles.grabber, { backgroundColor: c.text.tertiary }]} />
              </View>
            </GestureDetector>
            {captured ? (
            <CaptureSuccess amount={capturedTotal} />
          ) : adjustingRequired ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Pressable onPress={() => setAdjustingRequired(false)} accessibilityRole="button">
                    <Text style={[textStyles.subhead, { color: c.accent.primary }]}>‹ Back</Text>
                  </Pressable>
                  <Text style={[textStyles.title2, { color: c.text.primary }]}>Which expenses got paid?</Text>
                  <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
                    Tap to mark what you actually paid — anything left carries to next cycle.
                  </Text>
                </View>
                <Pressable onPress={toggleMarkAllRequired} accessibilityRole="button">
                  <Text style={[textStyles.subhead, { color: c.accent.primary }]}>{preMarkAllPaid ? 'Undo' : 'Mark all paid'}</Text>
                </Pressable>
              </View>
              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {requiredRows.map((row) => {
                  const id = rowId(row);
                  const paid = id ? (requiredPaid[id] ?? true) : true;
                  return (
                    <Pressable
                      key={id ?? row.item.label}
                      onPress={() => toggleRequired(id)}
                      // P6.8.7a — `checkbox`: "this bill is paid" is a two-state mark and the row is the
                      // control. See `utils/a11y.ts` for why `aria-selected` on a button was a no-op.
                      accessibilityRole="checkbox"
                      {...a11yChecked(paid)}
                      style={[styles.reconcileRow, { borderColor: paid ? c.accent.success : c.border.control, backgroundColor: c.background.secondary }]}>
                      <View style={styles.reconcileText}>
                        <Text style={[textStyles.bodyMedium, { color: c.text.primary }]} numberOfLines={2}>
                          {requiredDisplayLabel(row.item, row.view)}
                        </Text>
                        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                          {/* ⛔ [L3-7] "ran" was a PRESUMPTION stated as an event, and this is the one
                              screen whose job is to establish ground truth ("Tap to mark what you
                              actually paid"). `presumedPaid` is only "the due date has passed and you
                              have not flagged it failed" — a bounced autopay (NSF, expired card,
                              cancelled mandate) satisfies it exactly. Every other surface hedges; this
                              one asserted. ⚠️ The finding's SECOND fix — stop pre-seeding these rows as
                              paid — is REFUTED and must not be built: unchecking an autopay row writes
                              `autopayFailedThisCycle: true` (`applyRequiredReconciliation`), so an
                              unseeded row would report every autopay as FAILED the moment the user
                              adjusts an unrelated one. Seeded-paid IS the true state: no failure
                              reported. */}
                          {row.view.isAutopay
                            ? row.view.presumedPaid
                              ? 'Autopay · should have run'
                              : 'Autopay'
                            : row.view.dueDate
                              ? `Due ${row.view.dueDate}`
                              : PAYCHECK_SEGMENT.required}
                        </Text>
                      </View>
                      <Text style={[textStyles.numericBody, { color: c.text.primary }]}>{formatCurrency(row.item.amount)}</Text>
                      <Pill label={paid ? 'Paid' : "Didn’t pay"} tone={paid ? 'paid' : 'overdue'} />
                    </Pressable>
                  );
                })}
                {carryForward > 0 ? (
                  <Text style={[textStyles.subhead, styles.carry, { color: c.accent.warning }]}>
                    {formatCurrency(carryForward)} carries to next cycle
                  </Text>
                ) : null}
              </ScrollView>
              <Button label="Done" onPress={() => setAdjustingRequired(false)} />
            </>
          ) : checkingBalances ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Pressable onPress={() => setCheckingBalances(false)} accessibilityRole="button">
                    <Text style={[textStyles.subhead, { color: c.accent.primary }]}>‹ Back</Text>
                  </Pressable>
                  <Text style={[textStyles.title2, { color: c.text.primary }]}>Check your balances</Text>
                  <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
                    Confirm each estimate, or type the real balance from your statement.
                  </Text>
                </View>
              </View>
              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {staleBalances.map((v) => (
                  <View
                    key={v.debt.id}
                    style={[styles.reconcileRow, { borderColor: c.border.control, backgroundColor: c.background.secondary }]}>
                    <View style={styles.reconcileText}>
                      <Text style={[textStyles.bodyMedium, { color: c.text.primary }]} numberOfLines={1}>{v.debt.name}</Text>
                      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                        estimated ~{formatWhole(v.currentBalance)} · verified {shortDate(v.lastVerifiedDate)}
                      </Text>
                    </View>
                    <TextInput
                      keyboardType="decimal-pad"
                      value={balanceEdits[v.debt.id] ?? ''}
                      onChangeText={(t) => setBalanceEdits((cur) => ({ ...cur, [v.debt.id]: t }))}
                      accessibilityLabel={`Balance for ${v.debt.name}`}
                      style={[textStyles.numericBody, styles.amountInput, { color: c.text.primary, borderColor: c.border.control }]}
                    />
                  </View>
                ))}
              </ScrollView>
              <Button label="Confirm balances" onPress={confirmEditedBalances} />
            </>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={[textStyles.title2, { color: c.text.primary }]}>It’s payday</Text>
                  <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
                    Here’s the plan you set for this paycheck. Confirm what you actually paid.
                  </Text>
                </View>
                <Pressable onPress={onClose} accessibilityRole="button">
                  <Text style={[textStyles.subhead, { color: c.text.secondary }]}>Close</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {requiredCount > 0 ? (
                  <View style={[styles.requiredCard, { backgroundColor: c.background.secondary, borderColor: c.border.subtle }]}>
                    <View style={styles.requiredMain}>
                      <View style={styles.flex}>
                        <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>Required expenses & minimums</Text>
                        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{requiredSub}</Text>
                      </View>
                      <Text style={[textStyles.numericBody, { color: c.text.primary }]}>{formatCurrency(requiredTotal)}</Text>
                    </View>
                    <Pill label="Adjust" tone="neutral" onPress={() => setAdjustingRequired(true)} />
                  </View>
                ) : null}

                {showBalanceCheck ? (
                  // 2.3.5 — the decay-gated balance re-verify batch. Only stale premium estimates surface
                  // here; "These look right" re-anchors them all in one tap, "Update" corrects individuals.
                  <View style={[styles.requiredCard, { backgroundColor: c.background.secondary, borderColor: c.border.subtle }]}>
                    <View style={styles.requiredMain}>
                      <View style={styles.flex}>
                        <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>Estimated balances</Text>
                        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                          {staleBalances.length === 1
                            ? "1 balance hasn’t been checked in a while"
                            : `${staleBalances.length} balances haven’t been checked in a while`}
                        </Text>
                      </View>
                      <Pill label="Update" tone="neutral" onPress={openBalanceCheck} />
                    </View>
                    <Button label="These look right" variant="secondary" onPress={confirmAllBalances} />
                  </View>
                ) : balancesConfirmed ? (
                  <View style={styles.balancesDone}>
                    <AppIcon name="check-circle" size={16} color={c.accent.success} />
                    <Text style={[textStyles.caption, { color: c.text.secondary }]}>Balances confirmed</Text>
                  </View>
                ) : null}

                {activeRecommendedActions.length > 0 ? (
                  <Text style={[textStyles.footnote, styles.sectionLabel, { color: c.text.secondary }]}>EXTRA PAYMENTS</Text>
                ) : null}

                {activeRecommendedActions.map((action) => {
                  const key = captureKey(action);
                  const o = overrides[key] ?? {};
                  const skipped = !!o.skipped;
                  const external = !!o.external;
                  const amount = o.actualAmount ?? action.actualAmount;
                  const editing = editingExtraKey === key;
                  return (
                    <View key={action.key} style={[styles.extraRow, { borderColor: c.border.subtle, backgroundColor: c.background.secondary, opacity: skipped ? 0.55 : 1 }]}>
                      <View style={styles.flex}>
                        <Text style={[textStyles.bodyMedium, { color: c.text.primary }]} numberOfLines={2}>{action.label}</Text>
                        {/* P6.8.7a — `checkbox`, not `button`: it is a two-state toggle, and `aria-checked`
                            is only allowed on a role that has a checked state. Was `button` + the retired
                            `aria-selected`, which Chromium ignores outright. */}
                        <Pressable onPress={() => setOverride(key, { external: !external })} accessibilityRole="checkbox" {...a11yChecked(external)}>
                          <Text style={[textStyles.caption, { color: external ? c.accent.primary : c.text.tertiary }]}>
                            {external ? 'From savings ✓' : 'From savings'}
                          </Text>
                        </Pressable>
                      </View>
                      <View style={styles.extraRight}>
                        {editing ? (
                          <TextInput
                            autoFocus
                            keyboardType="decimal-pad"
                            value={String(amount)}
                            onChangeText={(t) => setOverride(key, { actualAmount: parseNonNegativeAmount(t) ?? 0 })}
                            onBlur={() => setEditingExtraKey(null)}
                            style={[textStyles.numericBody, styles.amountInput, { color: c.text.primary, borderColor: c.border.control }]}
                          />
                        ) : (
                          <Pressable onPress={() => setEditingExtraKey(key)} disabled={skipped} accessibilityRole="button">
                            <Text style={[textStyles.numericBody, { color: c.text.primary }]}>{formatCurrency(amount)}</Text>
                          </Pressable>
                        )}
                        <Pill
                          label={skipped ? 'Skipped' : 'Paid'}
                          tone={skipped ? 'neutral' : 'paid'}
                          onPress={() => setOverride(key, { skipped: !skipped })}
                        />
                      </View>
                    </View>
                  );
                })}

                {activeRecommendedActions.length > 0 ? (
                  <View style={styles.planTotal}>
                    <Text style={[textStyles.subhead, { color: c.text.secondary }]}>You paid</Text>
                    <Text style={[textStyles.numericBody, { color: c.text.primary, fontWeight: '700' }]}>{formatCurrency(plannedTotal)}</Text>
                  </View>
                ) : null}
              </ScrollView>

              {/* P6.8.7e.2 [C1] — THE ABSORB PATH'S ENTRY POINT, and the whole finding is that it did not
                  exist. The engine, the two Today acknowledgements and `LeanSuggestionCard` were all built
                  and correct; nothing in production ever handed them a `surpriseOutflow`, so a real user
                  could not reach any of it.
                  ⚠️ Deliberately ONE optional field at the end, not a step of its own. Most cycles have no
                  surprise, and a required question about a thing that did not happen turns the payday
                  moment into an interrogation — the sheet's job is to confirm a plan the user followed. */}
              <View style={styles.surprise}>
                <Text style={[textStyles.subhead, { color: c.text.secondary }]}>Anything unexpected come out?</Text>
                <TextInput
                  testID="payday-surprise-amount"
                  keyboardType="decimal-pad"
                  value={surpriseAmount}
                  onChangeText={setSurpriseAmount}
                  placeholder="$0"
                  placeholderTextColor={c.text.tertiary}
                  accessibilityLabel="Amount of an unexpected expense this cycle"
                  style={[textStyles.numericBody, styles.amountInput, { color: c.text.primary, borderColor: c.border.control }]}
                />
              </View>

              <View style={styles.actions}>
                <Button label={hasAdjustedRequired || extrasAdjusted ? 'Confirm what you paid' : 'You followed the plan'} onPress={handleCapture} />
                <Button label="Skip this payday" variant="text" onPress={onDismiss} />
              </View>
            </>
          )}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

/**
 * The payday-completion beat — quiet, not spectacle (the paid-off celebration owns that). The check
 * springs in, a soft ring pulses out once, and the amount you confirmed rolls up, with a success
 * haptic fired at capture. Reduce Motion → the finished state, no motion.
 */
function CaptureSuccess({ amount }: { amount: number }) {
  const c = useAppColors();
  const reduce = useReduceMotion();
  const pop = useSharedValue(reduce ? 1 : 0);
  const ring = useSharedValue(reduce ? 1 : 0);
  const [shown, setShown] = useState(reduce ? amount : 0);
  useEffect(() => {
    if (reduce) return;
    pop.value = withSpring(1, spring.bouncy);
    ring.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    setShown(amount);
  }, [reduce, amount, pop, ring]);

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }], opacity: pop.value }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.7 + ring.value * 1.0 }], opacity: (1 - ring.value) * 0.5 }));

  return (
    <View style={styles.successPad}>
      <View style={styles.checkWrap}>
        <Animated.View style={[styles.ring, ringStyle, { borderColor: c.accent.success }]} />
        <Animated.View style={[styles.successCheck, checkStyle, { backgroundColor: c.background.secondary }]}>
          <AppIcon name="check-circle" size={40} color={c.accent.success} />
        </Animated.View>
      </View>
      <Text style={[textStyles.title2, { color: c.text.primary }]}>Payday captured</Text>
      <CountUp
        value={shown}
        format={(n) => formatCurrency(Math.round(n))}
        style={[styles.capturedAmount, { color: c.accent.success }]}
      />
      <Text style={[textStyles.subhead, { color: c.text.secondary }]}>confirmed · your plan’s up to date</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: layout.cardRadiusLarge,
    borderTopRightRadius: layout.cardRadiusLarge,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  headerText: { flex: 1, gap: spacing.xs },
  scroll: { flexGrow: 0 },
  scrollContent: { gap: spacing.sm, paddingVertical: spacing.xs },
  flex: { flex: 1, gap: 2 },
  requiredCard: { borderRadius: layout.cardRadius, borderWidth: StyleSheet.hairlineWidth, padding: layout.cardPaddingH, gap: spacing.md },
  requiredMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', marginTop: spacing.xs },
  extraRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: layout.inputRadius, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md },
  extraRight: { alignItems: 'flex-end', gap: spacing.xs },
  amountInput: { minWidth: 76, textAlign: 'right', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 2 },
  planTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm },
  reconcileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: layout.inputRadius, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md },
  reconcileText: { flex: 1, gap: 2 },
  carry: { textAlign: 'center', paddingTop: spacing.sm },
  balancesDone: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  // P6.8.7e.2 [C1] — the optional surprise-outflow row, sat above the confirm actions.
  surprise: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, paddingBottom: spacing.sm },
  actions: { gap: spacing.sm },
  successPad: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  checkWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  ring: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 2 },
  successCheck: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  capturedAmount: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
});
