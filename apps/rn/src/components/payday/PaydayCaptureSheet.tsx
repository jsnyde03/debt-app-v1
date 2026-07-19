import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { useAppColors } from '@/hooks/use-app-colors';
import type { ActiveRecommendedAction, RequiredRow } from '@/store/planSelectors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

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
  onCapture,
  onDismiss,
  onClose,
}: {
  visible: boolean;
  activeRecommendedActions: ActiveRecommendedAction[];
  requiredRows: RequiredRow[];
  requiredTotal: number;
  onCapture: (items: ReturnType<typeof buildPaydayCaptureItems>, requiredDecisions: RequiredReconciliation) => void;
  onDismiss: () => void;
  onClose: () => void;
}) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  const [editingExtraKey, setEditingExtraKey] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, PaydayCaptureOverride>>({});
  const [captured, setCaptured] = useState(false);
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
    setCaptured(true);
    setTimeout(() => onCapture(items, decisions), 850);
  }

  const requiredSub = hasAdjustedRequired
    ? carryForward > 0
      ? `${formatCurrency(requiredTotal - carryForward)} paid · ${formatCurrency(carryForward)} carries`
      : 'All confirmed paid'
    : `${requiredCount} due this paycheck`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: c.background.primary, paddingBottom: insets.bottom + spacing.base }]}>
          {captured ? (
            <View style={styles.successPad}>
              <View style={[styles.successCheck, { backgroundColor: c.background.secondary }]}>
                <AppIcon name="check-circle" size={40} color={c.accent.success} />
              </View>
              <Text style={[textStyles.title2, { color: c.text.primary }]}>Payday captured</Text>
              <Text style={[textStyles.subhead, { color: c.text.secondary }]}>Nice work — your plan&apos;s up to date.</Text>
            </View>
          ) : adjustingRequired ? (
            <>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Pressable onPress={() => setAdjustingRequired(false)} accessibilityRole="button">
                    <Text style={[textStyles.subhead, { color: c.accent.primary }]}>‹ Back</Text>
                  </Pressable>
                  <Text style={[textStyles.title2, { color: c.text.primary }]}>Which bills got paid?</Text>
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
                      accessibilityRole="button"
                      accessibilityState={{ selected: paid }}
                      style={[styles.reconcileRow, { borderColor: paid ? c.accent.success : c.border.default, backgroundColor: c.background.secondary }]}>
                      <View style={styles.reconcileText}>
                        <Text style={[textStyles.bodyMedium, { color: c.text.primary }]} numberOfLines={2}>
                          {requiredDisplayLabel(row.item, row.view)}
                        </Text>
                        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                          {row.view.isAutopay
                            ? row.view.presumedPaid
                              ? 'Autopay · ran'
                              : 'Autopay'
                            : row.view.dueDate
                              ? `Due ${row.view.dueDate}`
                              : 'Required'}
                        </Text>
                      </View>
                      <Text style={[textStyles.numericBody, { color: c.text.primary }]}>{formatCurrency(row.item.amount)}</Text>
                      <Pill label={paid ? 'Paid' : "Didn't pay"} tone={paid ? 'paid' : 'overdue'} />
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
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={[textStyles.title2, { color: c.text.primary }]}>It&apos;s payday</Text>
                  <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
                    Here&apos;s the plan you set for this paycheck. Confirm what you actually paid.
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
                        <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>Required bills & minimums</Text>
                        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{requiredSub}</Text>
                      </View>
                      <Text style={[textStyles.numericBody, { color: c.text.primary }]}>{formatCurrency(requiredTotal)}</Text>
                    </View>
                    <Pill label="Adjust" tone="neutral" onPress={() => setAdjustingRequired(true)} />
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
                        <Pressable onPress={() => setOverride(key, { external: !external })} accessibilityRole="button" accessibilityState={{ selected: external }}>
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
                            onChangeText={(t) => setOverride(key, { actualAmount: Math.max(0, Number(t) || 0) })}
                            onBlur={() => setEditingExtraKey(null)}
                            style={[textStyles.numericBody, styles.amountInput, { color: c.text.primary, borderColor: c.border.default }]}
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

              <View style={styles.actions}>
                <Button label={hasAdjustedRequired || extrasAdjusted ? 'Confirm what I paid' : 'I followed the plan'} onPress={handleCapture} />
                <Button label="Skip this payday" variant="text" onPress={onDismiss} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: layout.cardRadiusLarge,
    borderTopRightRadius: layout.cardRadiusLarge,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.lg,
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
  actions: { gap: spacing.sm },
  successPad: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  successCheck: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
});
