import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import type { RecoveryPlan } from '@/store/recoverySelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** Exact whole-dollar — matches the Guardian card's `money()` (concrete amounts the user acts on). */
function money(n: number): string {
  return `$${Math.round(Math.max(0, Number.isFinite(n) ? n : 0)).toLocaleString('en-US')}`;
}

/**
 * §2.6 Recovery Plan — the Guardian's shortfall card, rolled up its sleeves. Same visual language as the
 * card it lives in (eyebrow labels, two-line rows, the `money()` figures): a calm "cover now" essentials
 * summary, then the interactive "safe to defer" checklist (suggested pre-checked, the running gap updates
 * live), a per-bill "keep essential" override, and one-tap apply — which defers the checked bills to next
 * paycheck (every surface updates reactively off the one store). Honest when the gap can't be closed.
 */
export function RecoveryPlanSection({
  plan,
  onDefer,
  onKeepEssential,
}: {
  plan: RecoveryPlan;
  onDefer: (id: string) => void;
  onKeepEssential: (id: string) => void;
}) {
  const c = useAppColors();
  const itemsKey = plan.safeToDefer.map((i) => i.id).join(',');
  // Suggested set pre-checked; re-seed whenever the plan's deferrable set changes (e.g. after an apply).
  const [checked, setChecked] = useState<Set<string>>(() => new Set(plan.suggestedDeferIds));
  useEffect(() => {
    setChecked(new Set(plan.suggestedDeferIds));
  }, [itemsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- re-seed on item-set change, not on every suggested-array identity

  const closed = plan.safeToDefer.filter((i) => checked.has(i.id)).reduce((s, i) => s + i.amount, 0);
  const remaining = Math.max(0, Math.round((plan.gap - closed) * 100) / 100);
  const covered = remaining <= 0.005;
  const count = checked.size;
  const allChecked = count === plan.safeToDefer.length && count > 0;
  const coverNowTotal = plan.coverNow.reduce((s, i) => s + i.amount, 0);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function apply() {
    plan.safeToDefer.filter((i) => checked.has(i.id)).forEach((i) => onDefer(i.id));
  }

  return (
    <View style={styles.wrap}>
      {plan.coverNow.length > 0 ? (
        <View>
          <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>COVER NOW</Text>
          <Text style={[textStyles.caption, { color: c.text.secondary }]}>
            {plan.coverNow.map((i) => i.name).join(' · ')} — {money(coverNowTotal)}
          </Text>
        </View>
      ) : null}

      {plan.safeToDefer.length > 0 ? (
        <View style={styles.deferBlock}>
          <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>SAFE TO DEFER</Text>
          {plan.safeToDefer.map((item) => {
            const on = checked.has(item.id);
            return (
              <View key={item.id} style={styles.row}>
                <Pressable
                  onPress={() => toggle(item.id)}
                  hitSlop={6}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`Defer ${item.name} ${money(item.amount)} to next paycheck`}
                  style={styles.rowMain}>
                  <AppIcon name={on ? 'check-box' : 'check-box-outline-blank'} size={20} color={on ? c.accent.primary : c.text.tertiary} />
                  <View style={styles.rowLabel}>
                    <Text style={[textStyles.subhead, { color: c.text.primary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Pressable
                      onPress={() => onKeepEssential(item.id)}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Keep ${item.name} essential — never suggest deferring it`}>
                      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Keep essential</Text>
                    </Pressable>
                  </View>
                </Pressable>
                <Text style={[textStyles.subhead, styles.amt, { color: c.text.secondary }]}>{money(item.amount)}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <Text style={[textStyles.caption, styles.gapLine, { color: covered ? c.accent.primary : c.text.secondary }]}>
        {covered
          ? `Deferring ${count === 1 ? 'this' : `these ${count}`} covers your ${money(plan.gap)} gap.`
          : !plan.closeable && allChecked
            ? `Even deferring everything, you're ${money(remaining)} short this cycle — adding income helps most.`
            : `Still ${money(remaining)} short — pick more to defer, or add income.`}
      </Text>

      {count > 0 ? (
        <Button
          label={covered ? `Defer ${count === 1 ? 'it' : `these ${count}`} → next paycheck` : `Defer ${count} selected`}
          variant={covered ? 'primary' : 'secondary'}
          onPress={apply}
          style={styles.applyBtn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  eyebrow: { letterSpacing: 0.8, marginBottom: spacing.xs },
  deferBlock: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  rowLabel: { flex: 1, gap: 1 },
  amt: { fontVariant: ['tabular-nums'] },
  gapLine: { fontWeight: '600' },
  applyBtn: { alignSelf: 'stretch' },
});
