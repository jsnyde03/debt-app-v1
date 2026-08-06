import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from 'zustand';

import { useAppColors } from '@/hooks/use-app-colors';
import { DEMO_STAGES } from '@/store/demoRun';
import { demoSession } from '@/store/demoSession';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** The closing beat — the only stage this renders on. */
const FINAL_STAGE = DEMO_STAGES[DEMO_STAGES.length - 1].id;

/**
 * 3.5.8.2 — [D20a] the one line the App Preview says out loud.
 *
 * Two obligations, both verified against Apple's current App-Preview guidance (2026-08-06) rather than
 * assumed, and both discharged by one caption because a teaching surface that has refused chrome
 * everywhere else should not grow a title card at the end:
 *
 * 1. **App previews autoplay MUTED**, and Apple's own guidance is that on-screen text carries the meaning.
 *    The arc has no narration and no text — it was designed as an in-app demo watched with attention, and
 *    [D19] changed the audience under it without the copy being revisited.
 * 2. **Features requiring a subscription must be DISCLOSED.** The arc's middle beats are premium
 *    behaviour, not decoration: `effectivePaycheckBuffer` gates the cushion floor on premium, the
 *    uncertainty holdback the "safety net" beat turns on is premium-gated acting, and Recovery is premium
 *    outright. Showing all three undisclosed is the overclaim shape this project audits itself for.
 *
 * ⚠️ **It deliberately does NOT read `chrome`.** The dock is withheld for the capture because a video has
 * nobody to let out — but the capture is the exact case that owes the disclosure, so gating this the same
 * way would remove it from the only render that legally needs it. `DemoDock` withholds on `!chrome`; this
 * renders regardless. That asymmetry is the point of the component existing separately at all.
 *
 * Bottom-anchored, into the space the withheld dock leaves. The `ExampleCanvasMarker` owns the TOP of the
 * screen and says a different thing ("Example money"); stacking a second banner there would be the
 * doubling [D6] refused.
 */
export function DemoCaption() {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const active = useStore(demoSession, (s) => s.active);
  const stage = useStore(demoSession, (s) => s.stage);

  if (!active || stage !== FINAL_STAGE) return null;

  return (
    <View
      testID="demo-caption"
      style={[
        styles.caption,
        {
          backgroundColor: c.background.secondary,
          borderTopColor: c.border.subtle,
          paddingBottom: insets.bottom + spacing.base,
        },
      ]}
      // One utterance — a screen reader should hear a sentence, not two fragments that read as unrelated.
      accessible
      accessibilityLabel="Debt-free, one paycheck at a time. Cushion planning and Recovery require Premium.">
      <Text style={[textStyles.title3, styles.line, { color: c.text.primary }]}>Debt-free, one paycheck at a time.</Text>
      {/* The disclosure names what was actually SHOWN — the held cushion and Recovery — rather than
          gesturing at "some features". A disclosure a viewer cannot map onto the footage is not one. */}
      <Text style={[textStyles.footnote, styles.line, { color: c.text.tertiary }]}>Cushion planning and Recovery require Premium.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    gap: spacing.xxs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  line: { textAlign: 'center' },
});
