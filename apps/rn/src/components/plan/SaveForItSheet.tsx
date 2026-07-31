import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { FormSheet } from '@/components/ui/FormSheet';
import { TextField } from '@/components/ui/TextField';
import { useActiveStore } from '@/store/StoreContext';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectSaveForItOptions, type SaveOption } from '@/store/guardianSelectors';
import { useAppStore } from '@/store/useAppStore';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

function money(n: number): string {
  return `$${Math.round(Math.max(0, Number.isFinite(n) ? n : 0)).toLocaleString('en-US')}`;
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function addPaychecks(iso: string, payCycle: string, n: number): string {
  const days = payCycle === 'weekly' ? 7 : payCycle === 'biweekly' ? 14 : payCycle === 'semimonthly' ? 15 : 30;
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days * n);
  return d.toISOString().slice(0, 10);
}

// A session-unique goal id via a module-level counter (not `Date.now()`, and not an inline global
// mutation in the component — both trip the React Compiler lint rules).
let goalSeq = 0;
function nextGoalId(cycleDate: string): string {
  goalSeq += 1;
  return `goal-${cycleDate}-${goalSeq}`;
}

/**
 * §2.9.6c Save-for-it — the focused, sign-off flow for a SHORT purchase (the hybrid's "sheet" half). The
 * user picks a save path, SEEING its honest trade-off (a prioritized sinking fund that funds before debt
 * with the debt cost owned, or a debt-first goal with no firm date), then commits — which creates a
 * savings goal with the chosen `priority`. No path promises a date the engine won't keep.
 */
export interface SavedInfo {
  id: string;
  name: string;
  perPaycheck: number | null;
  prioritize: boolean;
}

export function SaveForItSheet({ visible, amount, name, onClose, onSaved }: { visible: boolean; amount: number; name: string; onClose: () => void; onSaved?: (info: SavedInfo) => void }) {
  // 3.5.3.0 — write to the resolved store (this sheet renders inside Today, so it inherits the
  // tutorial's sandbox; writing via the singleton here would create a real goal from scripted money).
  const store_ = useActiveStore();
  const c = useAppColors();
  const store = useAppStore((s) => s.store);
  const isPremium = store.subscriptionPlan === 'premium';
  // Memoized off the store/amount so the sheet's own input state (customPer, selection) doesn't re-project
  // balances or rebuild the options on every interaction.
  const engineStore = useMemo(() => withProjectedBalances(store, isPremium), [store, isPremium]);
  const options = useMemo(() => selectSaveForItOptions(engineStore, amount), [engineStore, amount]);
  const [selected, setSelected] = useState<SaveOption['key'] | 'custom'>(options[0]?.key ?? 'debtFirst');
  const [customPer, setCustomPer] = useState('');
  const goalLabel = name.trim() || 'this purchase';

  const customN = Number(customPer) > 0 ? Math.max(1, Math.ceil(amount / Number(customPer))) : null;
  const customReadyBy = customN != null ? addPaychecks(store.paycheck.currentDate, store.paycheck.payCycle, customN) : null;

  // Guard against a double-tap creating two goals (belt-and-suspenders; the card's saved-state also
  // removes the entry point after one save). Jason 2026-07-25.
  const submitted = useRef(false);

  function submit() {
    if (submitted.current) return;
    // Priority (sinking-fund) options carry a per-paycheck pace cap so the shown schedule is real.
    let priority = false;
    let pace: number | undefined;
    if (selected === 'custom') {
      const per = Number(customPer);
      if (!(per > 0)) return; // need a pace before committing (flag NOT yet set → they can retry)
      priority = true;
      pace = per;
    } else {
      const opt = options.find((o) => o.key === selected) ?? options[options.length - 1];
      priority = opt.prioritize;
      pace = opt.prioritize ? opt.perPaycheck ?? undefined : undefined;
    }
    submitted.current = true; // commit — guard against a second goal from a double-tap
    const id = nextGoalId(store.paycheck.currentDate);
    store_.getState().addGoal({
      id,
      name: name.trim() || 'Savings goal',
      targetAmount: amount,
      currentAmount: 0,
      type: 'savings',
      priority,
      priorityPerPaycheck: pace,
    });
    onSaved?.({ id, name: name.trim() || 'Savings goal', perPaycheck: pace ?? null, prioritize: priority });
    onClose();
  }

  return (
    <FormSheet
      visible={visible}
      title="Save for it"
      subtitle={`Choose how to save ${money(amount)} for ${goalLabel} — the trade-off is shown before you commit.`}
      submitLabel="Start saving"
      onSubmit={submit}
      onClose={onClose}>
      {options.map((o) => {
        const active = o.key === selected;
        return (
          <Pressable
            key={o.key}
            onPress={() => setSelected(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[styles.option, { borderColor: active ? c.accent.primary : c.border.default, backgroundColor: active ? c.background.secondary : 'transparent' }]}>
            <View style={styles.optHead}>
              <AppIcon name={active ? 'radio-button-checked' : 'radio-button-unchecked'} size={18} color={active ? c.accent.primary : c.text.tertiary} />
              <Text style={[textStyles.subhead, styles.optTitle, { color: c.text.primary }]}>{o.title}</Text>
              {o.perPaycheck != null ? <Text style={[textStyles.subhead, { color: c.text.secondary }]}>{money(o.perPaycheck)}/paycheck</Text> : null}
            </View>
            <Text style={[textStyles.caption, styles.optPace, { color: c.text.secondary }]}>
              {o.readyBy != null && o.paychecks != null
                ? `${o.paychecks} ${o.paychecks === 1 ? 'paycheck' : 'paychecks'} · ready by ${shortDate(o.readyBy)}`
                : 'Saved after debt · no firm date'}
            </Text>
            <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{o.detail}</Text>
          </Pressable>
        );
      })}

      {/* "Set your own" — a prioritized sinking fund at the user's chosen pace (only when there's spare
          to prioritize). Funds before debt, capped at the per-paycheck amount they set. */}
      {options.some((o) => o.prioritize) ? (
        <Pressable
          onPress={() => setSelected('custom')}
          accessibilityRole="radio"
          accessibilityState={{ selected: selected === 'custom' }}
          style={[styles.option, { borderColor: selected === 'custom' ? c.accent.primary : c.border.default, backgroundColor: selected === 'custom' ? c.background.secondary : 'transparent' }]}>
          <View style={styles.optHead}>
            <AppIcon name={selected === 'custom' ? 'radio-button-checked' : 'radio-button-unchecked'} size={18} color={selected === 'custom' ? c.accent.primary : c.text.tertiary} />
            <Text style={[textStyles.subhead, styles.optTitle, { color: c.text.primary }]}>Set your own</Text>
          </View>
          {selected === 'custom' ? (
            <>
              <TextField label="Per paycheck" value={customPer} onChangeText={setCustomPer} placeholder="e.g. 100" keyboardType="decimal-pad" />
              {customN != null && customReadyBy != null ? (
                <Text style={[textStyles.caption, styles.optPace, { color: c.text.secondary }]}>
                  {customN} {customN === 1 ? 'paycheck' : 'paychecks'} · ready by {shortDate(customReadyBy)}
                </Text>
              ) : null}
            </>
          ) : null}
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Save what you want each paycheck — funds before debt at your pace.</Text>
        </Pressable>
      ) : null}
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  option: { borderWidth: 1, borderRadius: 12, padding: spacing.md, gap: spacing.xs },
  optHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  optTitle: { flex: 1, fontWeight: '600' },
  optPace: { fontVariant: ['tabular-nums'] },
});
