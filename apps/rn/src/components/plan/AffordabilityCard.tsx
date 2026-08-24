import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AffordabilityImpactBar } from '@/components/plan/AffordabilityImpactBar';
import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SaveForItSheet, type SavedInfo } from '@/components/plan/SaveForItSheet';
import { PremiumInvite } from '@/components/premium/PremiumInvite';
import { TextField } from '@/components/ui/TextField';
import { parseAmountField } from '@/store/amountField';
import { useActiveStore } from '@/store/StoreContext';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectAffordability, type Affordability } from '@/store/guardianSelectors';
import { useAppStore } from '@/store/useAppStore';
import { useAppColors } from '@/hooks/use-app-colors';
import { haptics } from '@/motion';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { useLiveAnnouncement } from '@/utils/a11y';
import { formatWhole } from '@/utils/format';

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
  // 3.5.3.0 — write to the store this subtree resolves to (sandbox under the tutorial, real otherwise).
  const store_ = useActiveStore();
  const c = useAppColors();
  const store = useAppStore((s) => s.store);
  const isPremium = store.subscriptionPlan === 'premium';
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [applied, setApplied] = useState<{ id: string; name: string; cover?: { goalId: string; amount: number; goalName: string; holdsLine: boolean } } | null>(null);
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

  // Memoized off the store so typing the purchase amount doesn't re-project balances each keystroke
  // (only `selectAffordability`, which genuinely depends on the amount, recomputes below).
  const engineStore = useMemo(() => withProjectedBalances(store, isPremium), [store, isPremium]);
  const n = parseAmountField(amount);
  const result: Affordability | null = n != null ? selectAffordability(engineStore, n) : null;

  function apply(r: Affordability) {
    const id = localId('purchase', store.paycheck.currentDate);
    const purchaseName = name.trim() || 'Purchase';
    // 3.7.A3.7 [D25] — an EXPLICIT category, not an uncategorized fallthrough. ⚠️ The ledger had this
    // backwards: uncategorized defaults to ESSENTIAL (MF.1 / audit #3, so a migrated rent is never
    // pre-suggested for deferral), so an applied "New couch" was as un-cuttable as the electricity bill.
    // [D25]'s rule — a discretionary buy should be FIRST to cut in a shortfall — is now stated.
    store_.getState().addExpense({ id, name: purchaseName, amount: r.amount, dueDate: store.paycheck.currentDate, recurrence: 'one-time', category: 'discretionary' });
    haptics.success(); // 3.3.5.3 — a commit is a felt moment
    setApplied({ id, name: purchaseName });
  }
  // §2.9.5 cover-a-tight-dip: apply the purchase AND move the gap from a savings goal to hold the line,
  // in one tap (reuses the Guardian's tight-top-up: draws down the goal + a cycle-keyed top-up).
  function coverAndApply(r: Affordability) {
    if (!r.coverFromSavings) return apply(r);
    const id = localId('purchase', store.paycheck.currentDate);
    const purchaseName = name.trim() || 'Purchase';
    store_.getState().addExpense({ id, name: purchaseName, amount: r.amount, dueDate: store.paycheck.currentDate, recurrence: 'one-time', category: 'discretionary' });
    store_.getState().applyTightTopUp(r.coverFromSavings.goalId, r.coverFromSavings.amount);
    haptics.success(); // 3.3.5.3
    setApplied({ id, name: purchaseName, cover: { goalId: r.coverFromSavings.goalId, amount: r.coverFromSavings.amount, goalName: r.coverFromSavings.goalName, holdsLine: r.coverFromSavings.holdsLine } });
  }
  function undo() {
    if (applied) {
      store_.getState().removeExpense(applied.id);
      // Reverse a cover the same way it was applied — a negative top-up restores the goal + clears the cycle top-up.
      if (applied.cover) store_.getState().applyTightTopUp(applied.cover.goalId, -applied.cover.amount);
    }
    setApplied(null);
  }
  function undoSave() {
    if (saved) store_.getState().removeGoal(saved.id);
    setSaved(null);
  }

  const tone: Record<Affordability['verdict'], { color: string; icon: IconGlyph }> = {
    comfortable: { color: c.text.secondary, icon: 'check-circle' },
    tight: { color: c.accent.warning, icon: 'error-outline' },
    short: { color: c.accent.danger, icon: 'cancel' },
  };

  /**
   * ⛔ THE VERDICT, AS ONE STRING, BECAUSE IT HAS TO BE SPOKEN AND NOT ONLY DRAWN. This card answers the
   * question the user asked by swapping a `<Text>` — no role, no live region, no announcement — so a
   * VoiceOver user typed an amount and got silence. Deriving the sentence here rather than announcing a
   * paraphrase of it means the spoken answer and the drawn answer cannot come apart.
   */
  const verdictLine =
    result && isPremium
      ? result.verdict === 'short'
        ? `Not this paycheck — you’d come up about ${formatWhole(result.shortBy)} short.`
        : result.verdict === 'comfortable'
          ? `Yes — you’d still hold about ${formatWhole(result.cushionAfter)}.`
          : `Yes, but tight — you’d dip to about ${formatWhole(result.cushionAfter)}, below your ${formatWhole(result.floor)} line.`
      : null;
  const liveProps = useLiveAnnouncement(verdictLine);

  // ── Applied state: the purchase is in the plan; the Guardian + everything below has recomputed. ──
  if (applied) {
    return (
      <Card>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>CAN I AFFORD IT?</Text>
        <View style={styles.read}>
          <View style={styles.readHead}>
            <AppIcon name="check-circle" size={18} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.readText, { color: c.text.primary }]}>
              {/* 3.7.A3.6 — a cover capped by the goal's balance does not hold the line; say so. */}
              {applied.cover
                ? applied.cover.holdsLine
                  ? `Added ${applied.name} + moved ${formatWhole(applied.cover.amount)} from ${applied.cover.goalName} to hold your line — your plan updated below.`
                  : `Added ${applied.name} + moved all ${formatWhole(applied.cover.amount)} of ${applied.cover.goalName} — it narrows the dip but doesn’t hold your line. Your plan updated below.`
                : `Added ${applied.name} to this paycheck — your plan updated below.`}
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
                ? `Now saving ${formatWhole(saved.perPaycheck)}/paycheck toward ${saved.name} — funds before debt. Track it in Goals.`
                : `Saving toward ${saved.name} from whatever’s spare after debt. Track it in Goals.`}
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

      {/* ⚠️ The live region is the STABLE wrapper, not the verdict inside it. A region that mounts together
          with its own content has nothing to compare against, so the change it exists to announce is the
          change it misses. This View is present in every state; only what it holds changes. */}
      <View {...liveProps}>
      {!result ? (
        <Text style={[textStyles.caption, styles.hint, { color: c.text.tertiary }]}>Enter an amount to see if it fits this paycheck.</Text>
      ) : !isPremium ? (
        <View style={styles.read}>
          <Text style={[textStyles.subhead, { color: c.text.primary }]}>You have about {formatWhole(result.discretionaryNow)} spare this paycheck.</Text>
          <PremiumInvite message={`Premium tells you if ${formatWhole(result.amount)} fits — applies it to your plan, or plans how to save for it.`} />
        </View>
      ) : result.verdict === 'short' ? (
        // Short → the honest read + a path to save for it (the multi-option sign-off sheet, 2.9.6).
        <View style={styles.read}>
          <View style={styles.readHead}>
            <AppIcon name={tone.short.icon} size={18} color={tone.short.color} />
            <Text style={[textStyles.subhead, styles.readText, { color: tone.short.color }]}>{verdictLine}</Text>
          </View>
          <AffordabilityImpactBar before={result.discretionaryNow} after={result.cushionAfter} floor={result.floor} verdict={result.verdict} />
          <Button label="Save for it →" variant="secondary" onPress={openSaveSheet} style={styles.action} />
        </View>
      ) : (
        // Comfortable / tight → the read + the honest debt cost + apply-to-plan.
        <View style={styles.read}>
          <View style={styles.readHead}>
            <AppIcon name={tone[result.verdict].icon} size={18} color={tone[result.verdict].color} />
            <Text style={[textStyles.subhead, styles.readText, { color: tone[result.verdict].color }]}>{verdictLine}</Text>
          </View>
          {/* §3.3.4 — the animated impact: the cushion carves down to what's left, vs your floor line. */}
          <AffordabilityImpactBar before={result.discretionaryNow} after={result.cushionAfter} floor={result.floor} verdict={result.verdict} />
          {result.extraToDebtDelta > 0 ? (
            <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
              About {formatWhole(result.extraToDebtDelta)} less goes to debt this paycheck.
            </Text>
          ) : null}
          {/* §2.9.5 — a tight buy can hold the line by covering the dip from savings (the primary move); or
              apply anyway and accept the tighter cushion. Comfortable buys just apply. */}
          {result.verdict === 'tight' && result.coverFromSavings ? (
            <Button
              // 3.7.A3.6 — "Cover" is a completion claim. When the goal's balance caps the draw short of
              // the dip it moves money without covering anything, so the verb changes with the outcome.
              label={
                result.coverFromSavings.holdsLine
                  ? `Cover ${formatWhole(result.coverFromSavings.amount)} from ${result.coverFromSavings.goalName} & apply`
                  : `Move ${formatWhole(result.coverFromSavings.amount)} from ${result.coverFromSavings.goalName} & apply`
              }
              variant="secondary"
              onPress={() => coverAndApply(result)}
              style={styles.action}
            />
          ) : null}
          <Button
            label={result.verdict === 'tight' ? 'Apply anyway' : 'Apply to this paycheck'}
            variant={result.verdict === 'tight' && result.coverFromSavings ? 'text' : 'secondary'}
            onPress={() => apply(result)}
            style={styles.action}
          />
        </View>
      )}
      </View>
    </Card>
    {isPremium && result && n != null ? (
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
});
