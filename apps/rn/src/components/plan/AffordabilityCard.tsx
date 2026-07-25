import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SaveForItSheet, type SavedInfo } from '@/components/plan/SaveForItSheet';
import { TextField } from '@/components/ui/TextField';
import { appStore } from '@/store/appStore';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectAffordability, type Affordability } from '@/store/guardianSelectors';
import { useAppStore } from '@/store/useAppStore';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

function money(n: number): string {
  return `$${Math.round(Math.max(0, Number.isFinite(n) ? n : 0)).toLocaleString('en-US')}`;
}

// A session-unique id for an applied purchase / created goal — a plain counter (not `Date.now()`, which
// the React Compiler flags as impure). Namespaced by the cycle date so it can't collide across restarts.
let idSeq = 0;
function localId(prefix: string, cycleDate: string): string {
  idSeq += 1;
  return `${prefix}-${cycleDate}-${idSeq}`;
}

/**
 * §2.9 Can-I-Afford-This? — the inverse Guardian on Today, and a premium ACTOR. Enter a purchase → the
 * Guardian's cushion model answers comfortable/tight/short; premium can then APPLY it (a one-off this
 * cycle → the whole app recomputes reactively, with Undo), COVER a tight dip from savings [2.9.5], or,
 * when it's short, SAVE for it (a sinking-fund plan + optional goal). Free gets the honest spare-cash
 * taste + a value-led invite. Calm register — a reference read + a deliberate action, never a beat.
 */
export function AffordabilityCard() {
  const c = useAppColors();
  const store = useAppStore((s) => s.store);
  const isPremium = store.subscriptionPlan === 'premium';
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [applied, setApplied] = useState<{ id: string; name: string } | null>(null);
  const [saveSheet, setSaveSheet] = useState(false);
  const [saved, setSaved] = useState<SavedInfo | null>(null);
  const [nameError, setNameError] = useState('');

  // Safeguard against a duplicate goal (Jason 2026-07-25): a save-for-it goal shares the Goals namespace,
  // so block a name that already exists (checked when the user opens the sheet, where the name is editable).
  function openSaveSheet() {
    const effName = name.trim() || 'Savings goal';
    if (store.goals.some((g) => g.name.trim().toLowerCase() === effName.toLowerCase())) {
      setNameError(`You already have a goal named "${effName}" — rename it above.`);
      return;
    }
    setNameError('');
    setSaveSheet(true);
  }

  const engineStore = withProjectedBalances(store, isPremium);
  const n = Number(amount);
  const result: Affordability | null = amount.trim() && Number.isFinite(n) && n > 0 ? selectAffordability(engineStore, n) : null;

  function apply(r: Affordability) {
    const id = localId('purchase', store.paycheck.currentDate);
    const purchaseName = name.trim() || 'Purchase';
    appStore.getState().addExpense({ id, name: purchaseName, amount: r.amount, dueDate: store.paycheck.currentDate, recurrence: 'one-time' });
    setApplied({ id, name: purchaseName });
  }
  function undo() {
    if (applied) appStore.getState().removeExpense(applied.id);
    setApplied(null);
  }
  function undoSave() {
    if (saved) appStore.getState().removeGoal(saved.id);
    setSaved(null);
  }

  const tone: Record<Affordability['verdict'], { color: string; icon: IconGlyph }> = {
    comfortable: { color: c.text.secondary, icon: 'check-circle' },
    tight: { color: c.accent.warning, icon: 'error-outline' },
    short: { color: c.accent.danger, icon: 'cancel' },
  };

  // ── Applied state: the purchase is in the plan; the Guardian + everything below has recomputed. ──
  if (applied) {
    return (
      <Card>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>CAN I AFFORD IT?</Text>
        <View style={styles.read}>
          <View style={styles.readHead}>
            <AppIcon name="check-circle" size={18} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.readText, { color: c.text.primary }]}>
              Added {applied.name} to this paycheck — your plan updated below.
            </Text>
          </View>
          <Button label="Undo" variant="secondary" onPress={undo} style={styles.action} />
        </View>
      </Card>
    );
  }

  // ── Saved state: a sinking fund is now in the plan. This state also SAFEGUARDS against duplicates —
  // the [Save for it →] button is gone, so the goal can't be re-added (Jason 2026-07-25). ──
  if (saved) {
    return (
      <Card>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>CAN I AFFORD IT?</Text>
        <View style={styles.read}>
          <View style={styles.readHead}>
            <AppIcon name="check-circle" size={18} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.readText, { color: c.text.primary }]}>
              {saved.prioritize && saved.perPaycheck != null
                ? `Now saving ${money(saved.perPaycheck)}/paycheck toward ${saved.name} — funds before debt. Track it in Goals.`
                : `Saving toward ${saved.name} from whatever's spare after debt. Track it in Goals.`}
            </Text>
          </View>
          <Button label="Undo" variant="secondary" onPress={undoSave} style={styles.action} />
        </View>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>CAN I AFFORD IT?</Text>
      <View style={styles.head}>
        <AppIcon name="shopping-cart" size={20} color={c.text.secondary} />
        <Text style={[textStyles.title3, styles.title, { color: c.text.primary }]}>Thinking about a purchase?</Text>
      </View>

      <TextField label="Amount" value={amount} onChangeText={setAmount} placeholder="e.g. 400" keyboardType="decimal-pad" />
      <TextField label="What is it? (optional)" value={name} onChangeText={(t) => { setName(t); setNameError(''); }} placeholder="e.g. New couch" />
      {nameError ? <Text style={[textStyles.caption, styles.hint, { color: c.accent.danger }]}>{nameError}</Text> : null}

      {!result ? (
        <Text style={[textStyles.caption, styles.hint, { color: c.text.tertiary }]}>Enter an amount to see if it fits this paycheck.</Text>
      ) : !isPremium ? (
        <View style={styles.read}>
          <Text style={[textStyles.subhead, { color: c.text.primary }]}>You have about {money(result.discretionaryNow)} spare this paycheck.</Text>
          <View style={styles.invite}>
            <AppIcon name="workspace-premium" size={16} color={c.accent.primary} />
            <Text style={[textStyles.caption, styles.inviteText, { color: c.accent.primary }]}>
              Premium tells you if {money(result.amount)} fits — applies it to your plan, or plans how to save for it.
            </Text>
          </View>
        </View>
      ) : result.verdict === 'short' ? (
        // Short → the honest read + a path to save for it (the multi-option sign-off sheet, 2.9.6).
        <View style={styles.read}>
          <View style={styles.readHead}>
            <AppIcon name={tone.short.icon} size={18} color={tone.short.color} />
            <Text style={[textStyles.subhead, styles.readText, { color: tone.short.color }]}>
              Not this paycheck — you&apos;d come up about {money(result.shortBy)} short.
            </Text>
          </View>
          <Button label="Save for it →" variant="secondary" onPress={openSaveSheet} style={styles.action} />
        </View>
      ) : (
        // Comfortable / tight → the read + the honest debt cost + apply-to-plan.
        <View style={styles.read}>
          <View style={styles.readHead}>
            <AppIcon name={tone[result.verdict].icon} size={18} color={tone[result.verdict].color} />
            <Text style={[textStyles.subhead, styles.readText, { color: tone[result.verdict].color }]}>
              {result.verdict === 'comfortable'
                ? `Yes — you'd still hold about ${money(result.cushionAfter)}.`
                : `Yes, but tight — you'd dip to about ${money(result.cushionAfter)}, below your ${money(result.floor)} line.`}
            </Text>
          </View>
          {result.extraToDebtDelta > 0 ? (
            <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
              About {money(result.extraToDebtDelta)} less goes to debt this paycheck.
            </Text>
          ) : null}
          <Button
            label={result.verdict === 'tight' ? 'Apply anyway' : 'Apply to this paycheck'}
            variant="secondary"
            onPress={() => apply(result)}
            style={styles.action}
          />
        </View>
      )}
    </Card>
    {isPremium && result ? (
      <SaveForItSheet visible={saveSheet} amount={n} name={name} onClose={() => setSaveSheet(false)} onSaved={setSaved} />
    ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  eyebrow: { letterSpacing: 0.8, marginBottom: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  title: { flex: 1 },
  hint: { marginTop: spacing.sm },
  read: { marginTop: spacing.md, gap: spacing.sm },
  readHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  readText: { flex: 1, fontWeight: '600' },
  action: { alignSelf: 'stretch', marginTop: spacing.xs },
  invite: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inviteText: { flex: 1, fontWeight: '600' },
});
