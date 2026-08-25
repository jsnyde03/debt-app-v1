import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import type { RecoveryPlan } from '@/store/recoverySelectors';
import { spacing } from '@/theme/spacing';
import { eyebrow, textStyles } from '@/theme/typography';
import { a11yChecked } from '@/utils/a11y';
import { formatWhole, summariseNames } from '@/utils/format';

/**
 * §2.6 Recovery Plan — the Guardian's shortfall card, rolled up its sleeves. Same visual language as the
 * card it lives in (eyebrow labels, two-line rows, the `formatWhole()` figures): a calm "cover now" essentials
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
  // [P6.8.9.7.11.14.1 · P1-4] Three names is what fits one caption line on a phone; the helper declines to
  // truncate at four, where "+1 more" would be longer than the name it hid.
  const coverNames = plan.coverNow.map((i) => i.name);
  const [coverExpanded, setCoverExpanded] = useState(false);
  const coverSummary = summariseNames(coverNames, 3);
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
          {/* ⛔ [P6.8.9.7.11.14.1 · audit P1-4] This was `names.join(' · ') — total`, and at 40 obligations
              it rendered 23 generic names as a four-line run-on with the total welded onto the end by an
              em-dash — on the ONE surface that speaks to a user who is short this paycheck. The figure now
              leads (it is the only part of this block that is actionable), the names truncate, and the rest
              are reachable by a tap rather than by reading a paragraph. */}
          <Text style={[textStyles.caption, styles.coverTotal, { color: c.text.primary }]}>
            {formatWhole(coverNowTotal)}
            {coverNames.length > 1 ? <Text style={{ color: c.text.tertiary }}>{`  ${coverNames.length} bills`}</Text> : null}
          </Text>
          {/* ⚠️ The Pressable exists ONLY when there is something behind it. A control that expands nothing
              is the class `.11.13.8` closed — a card naming an action the app did not have. */}
          <Pressable
            disabled={coverSummary.more === 0}
            onPress={() => setCoverExpanded((v) => !v)}
            hitSlop={6}
            accessibilityRole={coverSummary.more === 0 ? undefined : 'button'}
            accessibilityLabel={
              coverSummary.more === 0
                ? undefined
                : coverExpanded
                  ? `Showing all ${coverNames.length} bills to cover now. Show fewer`
                  : `${coverSummary.shown}, and ${coverSummary.more} more. Show all ${coverNames.length}`
            }>
            <Text style={[textStyles.caption, { color: c.text.secondary }]}>
              {coverExpanded ? coverNames.join(' · ') : coverSummary.shown}
              {coverSummary.more === 0 ? null : (
                <Text style={[styles.coverMore, { color: c.accent.primary }]}>
                  {coverExpanded ? '  Show fewer' : `  +${coverSummary.more} more`}
                </Text>
              )}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {plan.safeToDefer.length > 0 ? (
        <View style={styles.deferBlock}>
          {/* ⛔ [L1-15] "SAFE TO DEFER" called a LATE PAYMENT safe, to the user in the shortest cycle the
              app models — the most vulnerable state it has. The app cannot see late fees, biller policy or
              credit reporting, so "safe" is a claim about consequences it has no access to. The heading now
              scopes the claim to the only thing this control actually does (move it in YOUR plan), and the
              biller caveat is promoted out of the footnote below the button: a person reads the heading
              before they read the disclaimer, so a heading that needs the disclaimer to be true is a
              heading that arrives first and wrong. */}
          <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>CAN WAIT IN YOUR PLAN</Text>
          <Text style={[textStyles.caption, styles.deferCaveat, { color: c.text.tertiary }]}>
            Moving these buys room in your plan — the biller still needs handling.
          </Text>
          {plan.safeToDefer.map((item) => {
            const on = checked.has(item.id);
            return (
              <View key={item.id} style={styles.row}>
                <Pressable
                  onPress={() => toggle(item.id)}
                  hitSlop={6}
                  accessibilityRole="checkbox"
                  {...a11yChecked(on)}
                  accessibilityLabel={`Defer ${item.name} ${formatWhole(item.amount)} to next paycheck`}
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
                <Text style={[textStyles.subhead, styles.amt, { color: c.text.secondary }]}>{formatWhole(item.amount)}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <Text style={[textStyles.caption, styles.gapLine, { color: covered ? c.accent.primary : c.text.secondary }]}>
        {plan.safeToDefer.length === 0
          ? `Nothing here can safely wait this paycheck — adding income is the surest fix, or cover the ${formatWhole(plan.gap)} gap from savings.`
          : covered
            ? `Deferring ${count === 1 ? 'this' : `these ${count}`} covers your ${formatWhole(plan.gap)} gap.`
            : !plan.closeable && allChecked
              ? `Even deferring everything, you’re ${formatWhole(remaining)} short this paycheck — adding income helps most.`
              : `Still ${formatWhole(remaining)} short — pick more to defer, or add income.`}
      </Text>

      {count > 0 ? (
        <>
          <Button
            label={covered ? `Defer ${count === 1 ? 'it' : `these ${count}`} → next paycheck` : `Defer ${count} selected`}
            variant={covered ? 'primary' : 'secondary'}
            onPress={apply}
            style={styles.applyBtn}
          />
          {/* MF.1 (audit #1) — deferring only reschedules the bill in YOUR plan; it can't stop the biller.
              (Autopay bills are excluded from the list, but a manual bill still needs a real action.) */}
          <Text style={[textStyles.caption, styles.disclaimer, { color: c.text.tertiary }]}>
            This reschedules the payment in your plan — remember to handle it with the biller (pay it late, or cancel it).
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  eyebrow: { ...eyebrow, marginBottom: spacing.xs },
  coverTotal: { fontWeight: '600' },
  coverMore: { fontWeight: '600' },
  deferBlock: { gap: spacing.sm },
  // [L1-15] Sits directly under the eyebrow, which already carries its own bottom margin.
  deferCaveat: { marginTop: -spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  rowLabel: { flex: 1, gap: 1 },
  amt: { fontVariant: ['tabular-nums'] },
  gapLine: { fontWeight: '600' },
  applyBtn: { alignSelf: 'stretch' },
  disclaimer: { marginTop: spacing.xs },
});
