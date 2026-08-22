import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedSheet } from '@/components/ui/AnimatedSheet';
import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** The three things Money can hold. Matches `MoneyView`, because choosing one also routes there. */
export type AddKind = 'debts' | 'bills' | 'goals';

/**
 * 3.7.A10.1 [D22a] — the one place you start adding anything to Money.
 *
 * ⚠️ **This exists because the SECTION used to be the routing.** Three separate "Add debt" / "Add bill" /
 * "Add goal" rows meant a user had to solve our taxonomy before they could type — and the taxonomy is the
 * thing they get wrong. The author of the split mis-filed under his own split ([D22]), which is the
 * strongest evidence available that better labels alone cannot carry this.
 *
 * So this asks nothing about our categories. It asks about a fact the user already knows — **does this
 * have a balance you're paying down?** — and files it for them. That question is not a proxy for the
 * distinction the engine makes; it IS that distinction (terminating vs perpetual) in the user's words.
 *
 * The stakes, for the record: an obligation filed as an expense is reserved correctly every payday and
 * silently omitted from the payoff plan and the debt-free date. Rent and a mortgage look identical in a
 * list — same cadence, same fixed amount, same "housing" — and only one of them ever ends.
 *
 * Examples, not definitions. A definition asks the user to classify; a noun they recognise does the
 * classifying for them, which is the whole point.
 */
/**
 * ⛔ [T8 · L2-5] `clause` is EXPORTED because the entity sheets state the same definition.
 * `ExpenseSheet`'s subtitle was the byte-identical sentence, re-typed — and this is the one string in the
 * app whose whole job is to stop a mis-file, so two copies of it is two definitions of "an expense".
 * The chooser owns the taxonomy; the sheets import it.
 */
export const OBLIGATION_CLAUSE: Record<AddKind, string> = {
  debts: "Something with a balance you’re paying down. It ends.",
  bills: "An ongoing cost that doesn’t end.",
  goals: "Money you’re setting aside for something.",
};

const CHOICES: { kind: AddKind; title: string; clause: string; examples: string; testID: string }[] = [
  {
    kind: 'debts',
    title: 'A debt',
    clause: OBLIGATION_CLAUSE.debts,
    examples: 'Credit card · Car loan · Mortgage · Buy-now-pay-later',
    testID: 'add-choice-debt',
  },
  {
    kind: 'bills',
    title: 'An expense',
    clause: OBLIGATION_CLAUSE.bills,
    examples: 'Rent · Phone · Electric · Subscriptions',
    testID: 'add-choice-expense',
  },
  {
    kind: 'goals',
    title: 'A savings goal',
    // Goals sit on a different axis entirely — saving vs owing — so this fork comes first for the
    // reader even though it is last in the list: the two above are both money OUT.
    clause: OBLIGATION_CLAUSE.goals,
    examples: 'Emergency fund · A trip · A new laptop',
    testID: 'add-choice-goal',
  },
];

export function AddObligationSheet({ onPick, onClose }: { onPick: (kind: AddKind) => void; onClose: () => void }) {
  const c = useAppColors();

  return (
    // ⚠️ `AnimatedSheet`, not `FormSheet`. FormSheet requires a primary submit button, which put a
    // full-width accent **"Cancel"** at the foot — the loudest thing on a screen whose actual actions are
    // the three cards above it. The choices ARE the submit here; the ✕ is the way out.
    <AnimatedSheet
      visible
      title="What are you adding?"
      // ⚠️ ONE LINE. `AnimatedSheet` clamps the subtitle at `numberOfLines={1}` (FormSheet allows two),
      // and a longer sentence truncates mid-word — which it did. The three cards carry the explaining;
      // this only has to say the thing that makes the taxonomy the app's problem instead of the user's.
      subtitle="It’ll go in the right place."
      onClose={onClose}>
      <View style={styles.list}>
        {CHOICES.map((choice) => (
          <Pressable
            key={choice.kind}
            testID={choice.testID}
            onPress={() => onPick(choice.kind)}
            accessibilityRole="button"
            // One utterance, and it carries the EXAMPLES — a screen-reader user cannot skim the nouns the
            // way a sighted one can, and the nouns are what make the choice obvious.
            accessibilityLabel={`${choice.title}. ${choice.clause} For example: ${choice.examples.replace(/ · /g, ', ')}.`}
            style={({ pressed }) => [
              styles.choice,
              { backgroundColor: c.background.secondary, borderColor: c.border.subtle, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>{choice.title}</Text>
            <Text style={[textStyles.subhead, styles.clause, { color: c.text.secondary }]}>{choice.clause}</Text>
            <Text style={[textStyles.caption, styles.examples, { color: c.text.tertiary }]}>{choice.examples}</Text>
          </Pressable>
        ))}
      </View>
    </AnimatedSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  choice: { padding: spacing.base, borderRadius: layout.cardRadius, borderWidth: StyleSheet.hairlineWidth },
  clause: { marginTop: spacing.xxs },
  examples: { marginTop: spacing.sm },
});
