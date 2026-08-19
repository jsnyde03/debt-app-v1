import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from 'zustand';

import { AppStoreCta } from '@/components/plan/AppStoreCta';
import { Button } from '@/components/ui/Button';
import { EMBED_DEMO } from '@/config/qa';
import { useAppColors } from '@/hooks/use-app-colors';
import { DEMO_STAGES } from '@/store/demoRun';
import { exitDemo } from '@/store/demoExit';
import { demoSession } from '@/store/demoSession';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { PRIVACY_CLAIM } from '@core/copy/vocabulary';

/**
 * 3.5.4.7 — the demo's own chrome: where it says what it is, and how a viewer gets out of it.
 *
 * Deliberately NOT the walkthrough's dock. That one coaches — a title, a paragraph, Back/Next/Skip — and
 * this run is watched rather than operated, so the same furniture would imply controls that do not exist
 * and steps the viewer is failing to take. What a demo owes is smaller: where you are in it, and two ways
 * out that are honest about what they do.
 *
 * ⚠️ Both exits are TERMINAL, per [D18]: `exitDemo` ends the session BEFORE navigating, so the destination
 * is never reached with the sandbox still mounted. That ordering is what keeps `useNoRealWritesGuard`
 * strict — `/paywall` writes the real store by design, and a purchase reported as a sandbox leak would
 * poison the one signal built to prove the real plan is untouched.
 */
export function DemoDock() {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const active = useStore(demoSession, (s) => s.active);
  const stage = useStore(demoSession, (s) => s.stage);
  // Withheld for the App-Preview capture. The dock is a way OUT, and a video has nobody to let out — while
  // it covered two of the five frames the video exists to show.
  const chrome = useStore(demoSession, (s) => s.chrome);
  // 3.5.10 — SCRIPTED only. This dock narrates a run that drives itself ("1 of 5", the beat sentence) and
  // carries the exits a viewer with no tab bar would otherwise lack. In an explore run all three of those
  // are wrong: there are no beats to count, the exit already rides the marker row on every screen, and the
  // dock sits over the tab bar the user now needs — the exact clipping 3.5.4.10 hid the bar to avoid.
  // Found by looking at the render; no assertion here was watching the dock.
  const mode = useStore(demoSession, (s) => s.mode);
  if (!active || !chrome || mode !== 'scripted') return null;

  const position = Math.max(1, DEMO_STAGES.findIndex((s) => s.id === stage) + 1);

  return (
    <View
      // ⚠️ `insets.bottom` is load-bearing, and this dock shipped without it once. [B4] found the same
      // omission in the walkthrough's dock: with no bottom inset the last control sits inside the
      // home-indicator swipe zone, so the gesture that dismisses the app overlaps the button. Invisible on
      // web, which has no safe area — and here the control in that zone is an EXIT, on the screen a
      // stranger is evaluating.
      style={[
        styles.dock,
        { backgroundColor: c.background.secondary, borderTopColor: c.border.subtle, paddingBottom: insets.bottom + spacing.base },
      ]}>
      {/* ⛔ `accessible` USED TO LIVE ON THIS OUTER VIEW, and it collapsed both exits out of existence.
          iOS treats `accessible` as "this subtree is ONE element", so the Button and the Pressable below
          stopped being reachable for VoiceOver entirely — §12.6.3 requires exactly the opposite ("you can
          reach the dock's two exits"). Found by `lint:a11y-collapse` (T5) on its first run, 2026-08-14;
          the same shape as 4.1.4c's defect ② on the coach-mark card and B.4's swipe pane.
          ⚡ §12.6.4 ("reads as ONE utterance") and §12.6.3 were never actually in conflict — the grouping
          only ever needed to cover the TEXT. The controls were inside it by container accident. */}
      <View
        accessible
        accessibilityLabel={`Demonstration, ${position} of ${DEMO_STAGES.length}.`}>
        {/* Position only — the "Example money" disclosure belongs to `ExampleCanvasMarker`, which sits at
          the TOP of the screen beside the figures it is about. Both said it at first, which is the same
          doubling [D6] refused in the walkthrough, arriving from the other direction: there the dock owns
          the marker and the canvas withholds, here the canvas owns it because it cannot scroll away from
          the money. Caught by looking at the render, not by a test. */}
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
          {position} of {DEMO_STAGES.length}
        </Text>

        {/* Approved 2026-08-06. The primary exit is the honest one — this was a demonstration, here is YOUR
          empty plan — and Premium is offered without being the way out. */}
        <Text style={[textStyles.body, { color: c.text.primary }]}>
          This is what your Guardian does with a paycheck.
        </Text>
      </View>

      {/* ⛔ 3.5.7.7 — IN THE EMBED, BOTH OF THE APP'S EXITS LEAD SOMEWHERE WRONG (🎯 2026-08-17).
          `/onboarding` is a financial data-entry form inside a marketing iframe that DISCARDS what is
          typed (3.5.7.3 made the embed sessionStorage-only, deliberately) — inviting it is worse than
          offering no exit at all. `/paywall`'s purchase path is stubbed on web (verified at 3.5.7.2), so
          it cannot transact. Both are right in the app, where this dock also renders.

          ⚠️ GATED ON THE BUILD, NOT ON THE MODE, and the distinction is load-bearing. This dock renders
          on `mode === 'scripted'`, and `mode` comes from a QUERY PARAM (`demo.tsx:61`) — so
          `debtplannerrn:///demo?mode=scripted` reaches it inside the shipping iOS app (the p09 probe
          drives exactly that), and `/demo?mode=scripted` reaches it in the ordinary web build, where the
          e2e suite drives it. An unconditional swap would offer "Get it on the App Store" to someone who
          already has the app open. `EMBED_DEMO` is the only flag that means "not installed here."

          ⚠️ [D34] — the label names the DESTINATION, not the product: the store listing is "Paycheck Debt
          Planner" and the app calls itself "Debt Planner", and this CTA is the one surface where the two
          would have had to be reconciled. Naming the App Store means neither has to move. */}
      {EMBED_DEMO ? (
        <>
          <AppStoreCta label="Get it on the App Store" testID="embed-app-store-cta" />
          {/* 3.5.7.9's settled line, and the dock is where it goes — the embed's only persistent chrome,
              so the claim is on screen beside the ask. It is what the zero-egress gate ENFORCES rather
              than a promise, and it deliberately avoids [D32]'s absolute ("100% private" overclaims: every
              host logs IPs). ⚠️ Outside the `accessible` group above, which has an explicit label and
              would otherwise swallow it. */}
          <Text testID="embed-privacy-line" style={[textStyles.caption, styles.privacy, { color: c.text.tertiary }]}>
            {PRIVACY_CLAIM.short}
          </Text>
        </>
      ) : (
        <>
          <Button label="Start your real plan" onPress={() => exitDemo('/onboarding')} />
          <Pressable
            onPress={() => exitDemo('/paywall')}
            accessibilityRole="button"
            hitSlop={10}
            style={styles.secondary}>
            <Text style={[textStyles.subhead, { color: c.accent.primary }]}>Unlock Premium</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,

    borderTopWidth: StyleSheet.hairlineWidth,
  },
  // 44pt, like the Guardian card's rows after 3.5.3.10 — a secondary exit is still an exit.
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  privacy: { textAlign: 'center' },
});
