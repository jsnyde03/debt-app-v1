import { Share, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { Motion } from '@/motion';
import type { VanquishedDebt } from '@/store/celebrationSelectors';
import { stagger } from '@/theme/motion';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';
import { formatWhole } from '@/utils/format';

/**
 * The permanent "Debts Vanquished" archive (3.3.1.4) — the growing trophy shelf of every debt confirmed
 * to $0, so the win outlasts the celebration animation. Concrete facts only (name · amount cleared · date),
 * per the honest-numbers rule. Shareable as a plain-text brag (RN Share — no new dep). Renders nothing when
 * there's nothing vanquished yet.
 */
export function VanquishedArchive({ debts }: { debts: VanquishedDebt[] }) {
  const c = useAppColors();
  if (debts.length === 0) return null;

  const total = debts.reduce((sum, d) => sum + (d.amount ?? 0), 0);

  const onShare = () => {
    const lines = debts.map((d) => `• ${d.name}${d.amount != null ? ` — ${formatWhole(d.amount)}` : ''}`).join('\n');
    const headline = `I vanquished ${debts.length} debt${debts.length === 1 ? '' : 's'}${total > 0 ? ` (${formatWhole(total)})` : ''} on my way to debt-free 🎉`;
    Share.share({ message: `${headline}\n\n${lines}` }).catch(() => {});
  };

  return (
    <Card>
      <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>
        DEBTS VANQUISHED · {debts.length}
      </Text>
      <View style={styles.list}>
        {debts.map((d, i) => (
          // 3.3.5.5 — the trophy shelf reveals with a staggered entrance (the `stagger.list` token, wired).
          <Motion key={d.id} delay={i * stagger.list}>
            <View style={styles.row}>
              <View style={[styles.badge, { backgroundColor: c.accent.gold }]}>
                <AppIcon name="check" size={13} color={c.text.onAccent} />
              </View>
              {/* A11Y-5: one utterance per tombstone (name · amount cleared · date); the check badge is decorative. */}
              <View
                style={styles.rowText}
                {...groupLabel(d.name, d.amount != null ? `${formatWhole(d.amount)} cleared` : 'Cleared', d.clearedDate ? shortDate(d.clearedDate) : undefined)}>
                <Text style={[textStyles.bodyMedium, { color: c.text.primary }]} numberOfLines={1}>
                  {d.name}
                </Text>
                <Text style={[textStyles.caption, { color: c.text.tertiary }]} numberOfLines={1}>
                  {d.amount != null ? `${formatWhole(d.amount)} cleared` : 'Cleared'}
                  {d.clearedDate ? ` · ${shortDate(d.clearedDate)}` : ''}
                </Text>
              </View>
            </View>
          </Motion>
        ))}
      </View>
      <Button label="Share" variant="secondary" onPress={onShare} style={styles.share} />
    </Card>
  );
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', marginBottom: spacing.md },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 1 },
  share: { marginTop: spacing.lg, alignSelf: 'flex-start' },
});
