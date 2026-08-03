import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, ReduceMotion, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FloorImpactBar } from '@/components/plan/FloorImpactBar';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLayout } from '@/hooks/use-layout';
import { Motion } from '@/motion/Motion';
import { haptics } from '@/motion/haptics';
import { useSpringValue } from '@/motion/hooks';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { announce, headerProps } from '@/utils/a11y';
import { stepAnnouncement } from '@/store/tutorialPath';
import type { TutorialRun } from '@/store/tutorialSelectors';
import type { TargetRect } from '@/store/tutorialTargets';

/**
 * 3.5.3.1 — the coaching layer that sits OVER the real Today tab during a tutorial session.
 *
 * Two jobs, and the second is the subtle one:
 *  - present the beat (position, title, body, controls);
 *  - decide whether Today underneath is TOUCHABLE. On EVERY beat a scrim blocks stray taps, so a user
 *    can't wander into a sheet or another tab mid-walkthrough and lose the thread. On an interactive
 *    beat (drag the floor, attest the bills) touches must reach the real control — so the scrim is cut
 *    AROUND the subject and the hole is what passes the touch through. The only case that renders no
 *    scrim at all is an interactive beat whose subject never measured: no hole to cut, and a solid
 *    sheet would seal the user away from the thing the beat is asking them to do.
 *
 * ⚠️ This paragraph used to say the layer "becomes pass-through" on interactive beats. That was true
 * until 3.5.3.5.9 and false after it, and it survived here for a full phase because the fix updated the
 * code and the LOG but not the doc-comment above them — the [E1] claim-vs-code shape. If you change the
 * touch model, this comment is part of the change.
 *
 * The scrim is deliberately light: Today is the lesson, so it stays legible rather than being dimmed
 * into a backdrop. Under Reduce Motion `Motion` degrades to no animation.
 */
/**
 * 3.5.3.3.4.1 — announce the beat, FROM THE COMPONENT THAT RENDERS IT.
 *
 * This lived in the host before, and 3.5.3.1's rewrite — moving the overlay off the `/tutorial` route
 * and onto the real Today tab — dropped it. Nothing failed: `stepAnnouncement` is pure and its unit test
 * kept passing, because the test covers the FUNCTION, not the fact that anyone calls it. The result was
 * a walkthrough that said nothing at all to a VoiceOver user, since the beat transition is motion-only.
 *
 * Putting it here is the structural fix rather than a note-to-self: the thing that draws a step is now
 * the thing that speaks it, so a future host rewrite cannot separate them again.
 */
function useAnnounceBeat(position: number, run: TutorialRun) {
  useEffect(() => {
    // 3.5.3.6.2 — `run` matters: the finale's copy differs by audience, and a VoiceOver user must hear
    // the line their screen is showing. Same resolver as the rendered body, for exactly that reason.
    announce(stepAnnouncement(position - 1, run));
    // 3.5.3.7.4 ([D12]) — a light selection tick as each beat lands. The app ships bespoke Core Haptics
    // and the walkthrough had none, which is part of why it read as a tooltip library rather than as
    // Debt. Deliberately the LIGHTEST rung: advancing is navigation, not achievement — the medium beats
    // are reserved for the two moments the user actually causes something. No-op on web and honoured
    // against the system setting inside `haptics`.
    haptics.light();
  }, [position, run]);
}

export function TutorialOverlay({
  position,
  total,
  title,
  body,
  interactive,
  onBack,
  onNext,
  onSkip,
  isLast,
  run,
  spotlight,
  settling = false,
  onDockLayout,
  impact,
}: {
  position: number;
  total: number;
  title: string;
  body: string;
  /** True on a beat where the user must reach the real control underneath. */
  interactive: boolean;
  onBack?: () => void;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
  /** 3.5.3.6.2 — the audience, so the finale can name what premium actually did (and VoiceOver hears it). */
  run: TutorialRun;
  /** 3.5.3.3.1 — where this beat's subject landed, in window coordinates. Null → an uncut scrim. */
  spotlight?: TargetRect | null;
  /** [D4] True while the subject is TRAVELLING (a stage-scroll is in flight) rather than absent. */
  settling?: boolean;
  /** The dock's measured height defines the bottom of the stage the subject is scrolled into. */
  onDockLayout?: (height: number) => void;
  /** 3.5.3.4.4 — set once the user has actually moved their line on this beat; the before→after payoff. */
  impact?: { before: number; after: number; freed: number } | null;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const { isRegular } = useLayout();
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  useAnnounceBeat(position, run);

  // [B4] The dock must never eat the screen. Its height is content-driven, and at the largest Dynamic
  // Type sizes a seven-line beat body plus the nav row can grow past the whole display — which collapses
  // the "stage" the subject is scrolled into (`stageBottom = screenH - dockH`) to zero or below, so every
  // beat would coach something sitting behind the card describing it. Capping the dock and letting the
  // BODY scroll inside it keeps the stage real at any type size, and keeps the nav row on screen: the
  // failure this replaces is a walkthrough with no reachable Next button.
  const dockMaxH = Math.max(220, windowH * 0.6);

  // 3.5.3.3.4.3 — subjects are measured in WINDOW coordinates, but this overlay draws in its own local
  // space, and the two are only the same on a phone. On the iPad regular layout the tab bar becomes a
  // left sidebar RAIL, so the overlay's origin sits ~700pt to the right of the window's — and the ring
  // was drawn that far right of its subject, landing on an unrelated row in the other column. Caught by
  // shooting the walkthrough at 1024×768; a phone-only screenshot pass would have shipped it.
  const rootRef = useRef<View>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const measureOrigin = () => {
    rootRef.current?.measureInWindow?.((x, y) => {
      setOrigin((prev) => (prev.x === x && prev.y === y ? prev : { x, y }));
    });
  };
  const local = spotlight ? { ...spotlight, x: spotlight.x - origin.x, y: spotlight.y - origin.y } : null;
  // [D4] The two nulls. `local` is null both while the subject travels and when it was never there, and
  // an interactive beat owes them opposite answers: seal the screen for the ~380ms of travel (nothing is
  // tappable on a moving screen anyway), but never seal it when the subject is simply absent.
  const interactiveTransit = settling;

  return (
    // `box-none` lets touches fall through to Today everywhere the overlay has no child; the scrim
    // below re-blocks them on scripted beats. Without this, even the pass-through beats would swallow.
    <View ref={rootRef} onLayout={measureOrigin} style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="tutorial-overlay">
      {/* 3.5.3.3.1 — with a subject on screen the scrim is drawn as four bands AROUND it instead of one
          sheet over everything, so the thing being taught is the one thing at full strength. Four rects
          rather than a mask: no Skia/SVG dependency on a surface that must render identically on web,
          and the cutout is plain geometry a test can assert.

          3.5.3.5.9 — the scrim now stays up on INTERACTIVE beats too. It used to be dropped entirely
          there, which made every control on screen live — including More, which pushes a route out from
          under the walkthrough. The plan has promised "passes touches through to the TARGET only" since
          3.5.3 was written, and the cutout was already exactly that mechanism: the bands capture touches,
          the hole doesn't. It simply was never rendered.

          The one case that renders nothing: an interactive beat with no measured rect. There is no hole
          to cut, so a scrim would seal the user in — unable to do the thing the beat is asking for. Better
          an unguarded screen than a trap. */}
      {/* [D3] The scrim colour is now `scrim`, not `background.primary`.
          In LIGHT the old choice worked — a pale wash over cards produces an obvious dim. In DARK it was
          near-black (#07111f) at 0.55 over navy cards (#152340): almost no separation, so the ring was
          doing all the work and dark was quietly the second-class theme. `background.scrim` is the token
          that already exists for exactly this job and carries real distance from the card fills in both.
          [D4] Also renders during the scroll transit on interactive beats: `local` goes null while the
          screen moves, and dropping the scrim there briefly re-opened the leak .5.9 closed. */}
      {/* `passThrough` — the hit-layer's hole is cut ONLY on the two interactive beats. The visual hole
          is cut on every beat, because that's the spotlight.
          The two had been the same hole since 3.5.3.3.1, which quietly made the top-of-file promise
          ("a scrim blocks stray taps, so a user can't wander into a sheet or another tab") false on four
          SCRIPTED beats: `intro`, `recovery`, `yourcall` and `handback` all spotlight the whole Guardian
          card, and the whole Guardian card is full of live controls. A stray tap on a scripted beat could
          open the floor sheet with no coaching line, push `/cushion-forecast` out from under the still-
          mounted overlay, or hit the attestation — which fires beat 4's entire scripted story during
          beat 1. Only the replay link had been individually guarded, one leak at a time.
          Splitting visual from hit geometry for [D2] is what makes this one flag rather than a rework. */}
      {!interactive || local || interactiveTransit ? (
        <Scrim rect={local} color={c.background.scrim} passThrough={interactive} />
      ) : null}
      {/* The ring is drawn on interactive beats too. Since 3.5.3.5.9 the scrim is there as well and the
          cutout is what passes touches to the control, so the ring is no longer load-bearing for
          "reach THIS" — it's the visual half of the same statement. */}
      {/* 3.5.3.7.1 — the ring FADES IN on arrival instead of popping.
          The feel pass asked for a spotlight that "travels" between subjects; taken literally that
          conflicts with a deliberate 3.5.3.3.1 decision — the ring is hidden while the screen scrolls,
          because one sliding across unrelated content on the way reads as a glitch, not as motion. The
          honest resolution is to keep it hidden in transit and animate it in when it LANDS: no flicker,
          no ring skating over things it doesn't mean. Keyed on the rect so each new subject re-enters,
          and `Motion`'s reduce-motion handling applies as everywhere else. */}
      {local ? (
        <Animated.View
          key={`${Math.round(local.x)}:${Math.round(local.y)}:${Math.round(local.height)}`}
          entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
          pointerEvents="none"
          style={[
            styles.ring,
            {
              left: local.x - RING_INSET,
              top: local.y - RING_INSET,
              width: local.width + RING_INSET * 2,
              height: local.height + RING_INSET * 2,
              borderColor: c.accent.primary,
            },
          ]}
          testID="tutorial-spotlight"
        />
      ) : null}

      {/* [B4] `paddingBottom` carries the bottom safe-area inset. The dock is pinned to `bottom: 0` with
          a flat padding, so on every home-indicator device the Next/Finish button — the control the whole
          walkthrough depends on — sat inside the system's swipe-up region, where a press can be stolen as
          the start of an app-switch gesture. Nothing in the e2e or the simulator screenshots shows this;
          it's a device-shaped bug that only a real hand finds. */}
      <View
        style={[styles.dock, { paddingBottom: insets.bottom + spacing.base }]}
        pointerEvents="box-none"
        onLayout={(e) => onDockLayout?.(e.nativeEvent.layout.height)}>
        {/* 3.5.3.7.7 — width-capped on the roomy layout. Unconstrained, the dock ran the full iPad canvas
            edge-to-edge, which reads as a web banner beside an app whose every other surface is a
            centred column. */}
        <Motion key={position} style={[styles.dockInner, { maxHeight: dockMaxH }, isRegular ? { maxWidth: DOCK_MAX_W } : null]}>
          {/* 3.5.3.7.2 ([D11]) — frosted, like the tab bar and every sheet. It's the app's own
              `SheetScrim` idiom: this is a system surface floating over the lesson, not a panel bolted
              on top of it. Only the DOCK is frosted — blurring the scrim bands too would have put five
              BlurViews on screen and risked softening the one thing that must stay crisp. */}
          <View style={styles.frost}>
            {/* [D1] Was `intensity 24` under an 0.82 opaque layer — only ~18% of the blur survived, so it
                read as a solid card with faint smudges rather than as glass. The app's own idioms are the
                calibration: `SheetScrim` blurs at 20 under a 0.28 dim, the tab bar at 70. Matching the
                tab bar's intensity and seating it on a light tint makes it an actual material. */}
            <BlurView tint={scheme === 'dark' ? 'dark' : 'light'} intensity={70} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background.secondary, opacity: 0.55 }]} />
          </View>
          <Card style={styles.dockCard}>
            <View style={styles.body}>
              {/* [B4] Only the NARRATION scrolls; the nav row below stays put. The split is the point —
                  a capped dock with everything inside one scroller would put Next below the fold at large
                  type, which is worse than the overflow it fixes. `bounces={false}` so it doesn't rubber-
                  band on the beats (most of them) whose copy fits without scrolling at all. */}
              <ScrollView
                style={styles.dockScroll}
                contentContainerStyle={styles.dockScrollContent}
                // The indicator is ON: it only appears when the content actually overflows, and in that
                // case it is the one signal that there is more of the beat below the fold. Suppressing
                // it would leave a large-type user reading a paragraph that appears to end mid-sentence.
                bounces={false}>
              {/* 3.5.3.7.3 — a quiet progress rail. "Step 3 of 7" alone made the arc's length something
                  you had to read; the rail makes it something you glance at. Calm register: a hairline
                  track, no counter animation, nothing that reads as gamification. */}
              <View style={styles.progressRow}>
                <Text style={[textStyles.caption, { color: c.text.tertiary }]} testID="tutorial-progress">
                  Step {position} of {total}
                </Text>
                <View style={[styles.rail, { backgroundColor: c.border.subtle }]}>
                  <View style={[styles.railFill, { backgroundColor: c.accent.primary, width: `${(position / total) * 100}%` }]} />
                </View>
              </View>
              <Text {...headerProps()} style={[textStyles.title3, { color: c.text.primary }]} testID="tutorial-step-title">
                {title}
              </Text>
              <Text style={[textStyles.body, { color: c.text.secondary }]}>{body}</Text>
              {/* 3.5.3.4.4 — the payoff lands in the coaching card, not on the Guardian card. The card
                  already shows the RESULT (its bar re-solves live); what the walkthrough adds is the
                  before→after, which is narration — and keeping it here leaves the shared card free of
                  tutorial-only props. */}
              {impact ? <FloorImpactBar before={impact.before} after={impact.after} freed={impact.freed} /> : null}
              </ScrollView>

              {/* 3.5.3.7.6 — one hierarchy, not three equals. Back / Next / Skip sat in a row competing:
                  the way OUT was as loud as the way ON. Next is the primary and leads; Back is a quiet
                  text link beside it; Skip is pushed to the far edge and dimmed to tertiary — reachable
                  the instant you want it, never the thing your eye lands on. */}
              <View style={styles.nav}>
                <Button label={isLast ? 'Finish' : 'Next'} onPress={onNext} />
                {onBack ? <Button label="Back" variant="text" onPress={onBack} /> : null}
                <View style={styles.navSpacer} />
                {!isLast ? (
                  // [C4] A 44pt target. Caption text plus `hitSlop={10}` came to ~38pt tall — under the
                  // minimum, on the control someone reaches for when they're already frustrated. It costs
                  // nothing here: the row is set by the primary Button, which is taller than 44 anyway, so
                  // this grows into space the nav row already occupies and the layout doesn't move.
                  <Pressable onPress={onSkip} accessibilityRole="button" style={styles.skip} hitSlop={10}>
                    <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Skip</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Card>
        </Motion>
      </View>
    </View>
  );
}

/** How far the ring stands off the subject, so it frames rather than crops it. */
const RING_INSET = 6;

/** 7.7 — the coaching column's cap on the roomy (iPad) layout, matching Today's own centred column. */
const DOCK_MAX_W = 620;

/**
 * The scrim, cut around the subject. With no rect it's the original single sheet.
 *
 * Four bands (above / below / left / right) rather than an SVG mask: this surface has to render the
 * same on web as on device, and geometry is something an e2e can actually assert.
 *
 * [E5] The cut and the ring share `RING_INSET`, so the ring's OUTER edge lands exactly on the boundary
 * of the hole and its 2pt border falls just inside the lit area — which is the "ring sits ON the light,
 * not floating in the dark" reading we want. The comment here used to claim the cut was inset *less*
 * than the ring; that described an arrangement the numbers have never had.
 */
function Scrim({
  rect,
  color,
  passThrough,
}: {
  rect: TargetRect | null;
  color: string;
  /** Cut the hole in the BLOCKING geometry too. Only true on a beat that asks the user to touch the
   *  subject — otherwise the hole is purely visual and everything underneath stays fenced off. */
  passThrough: boolean;
}) {
  const a11y = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

  // [D2] The hole MOVES between beats instead of cutting. The ring already faded in on arrival, but the
  // darkness around it hard-swapped — four static Views replaced by four different static Views — so the
  // most visually dominant element on screen was the one element with no motion at all, next to one that
  // had had a whole pass devoted to it. The light now closes and reopens with the same spring as
  // everything else that travels.
  //
  // The structure changed to make that possible: there is no longer a separate "uncut sheet" branch to
  // animate ACROSS. A null rect is now a COLLAPSED hole — zero-area, anchored at the last subject's
  // centre — which renders as full coverage and is identical on screen to the old single sheet, while
  // being the same four bands the springs are already driving. That also gives the transit its meaning
  // for free: the light closes as the screen starts moving and reopens on whatever it arrived at.
  const anchor = useRef({ x: 0, y: 0 });
  if (rect) anchor.current = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };

  const top = rect ? Math.max(0, rect.y - RING_INSET) : anchor.current.y;
  const bottom = rect ? rect.y + rect.height + RING_INSET : anchor.current.y;
  const left = rect ? Math.max(0, rect.x - RING_INSET) : anchor.current.x;
  const right = rect ? rect.x + rect.width + RING_INSET : anchor.current.x;

  const t = useSpringValue(top);
  const b = useSpringValue(bottom);
  const l = useSpringValue(left);
  const r = useSpringValue(right);

  const topBand = useAnimatedStyle(() => ({ top: 0, left: 0, right: 0, height: Math.max(0, t.value) }));
  const bottomBand = useAnimatedStyle(() => ({ top: b.value, left: 0, right: 0, bottom: 0 }));
  const leftBand = useAnimatedStyle(() => ({ top: t.value, height: Math.max(0, b.value - t.value), left: 0, width: Math.max(0, l.value) }));
  const rightBand = useAnimatedStyle(() => ({ top: t.value, height: Math.max(0, b.value - t.value), left: r.value, right: 0 }));

  // What the user SEES and what the user can TOUCH are now two layers, because the animation made them
  // disagree. A travelling band is over the new subject for the whole of its journey, so a single set of
  // bands doing both jobs meant the coached control was un-tappable for as long as the spring took —
  // roughly half a second, longer with the overshoot. The e2e caught it as flakiness (Playwright retried
  // the click until the band moved off); for a user it's the tap that does nothing on the beat that just
  // asked them to tap. The blocking geometry therefore snaps to the destination while the dark travels.
  // A scripted beat gets a collapsed hit-hole — the bands meet and the whole screen is fenced, however
  // the light is cut above it.
  const hit = passThrough
    ? { top: Math.max(0, top), bottom, left: Math.max(0, left), right }
    : { top: 0, bottom: 0, left: 0, right: 0 };

  return (
    // `box-none` on the container, so the BANDS capture touches and the hole between them doesn't —
    // which is the whole pass-through mechanism on interactive beats (3.5.3.5.9). With the hole
    // collapsed the bands meet and cover everything, so a null rect blocks exactly as the old sheet did.
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" {...a11y} testID="tutorial-scrim">
      {/* The DARK. `tutorial-scrim-band` — "is the subject lit?" is a question about this layer. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View testID="tutorial-scrim-band" style={[styles.scrim, styles.band, { backgroundColor: color }, topBand]} />
        <Animated.View testID="tutorial-scrim-band" style={[styles.scrim, styles.band, { backgroundColor: color }, bottomBand]} />
        <Animated.View testID="tutorial-scrim-band" style={[styles.scrim, styles.band, { backgroundColor: color }, leftBand]} />
        <Animated.View testID="tutorial-scrim-band" style={[styles.scrim, styles.band, { backgroundColor: color }, rightBand]} />
      </View>
      {/* The FENCE. Invisible and deliberately so: no colour, only touch-blocking. Separately identified
          because it answers a different question — "is the subject REACHABLE?" — and since `passThrough`
          the two layers legitimately disagree on every scripted beat, where the subject is lit but not
          touchable. One testID for both would have made each assertion silently ambiguous. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View testID="tutorial-scrim-blocker" style={[styles.band, { top: 0, left: 0, right: 0, height: hit.top }]} />
        <View testID="tutorial-scrim-blocker" style={[styles.band, { top: hit.bottom, left: 0, right: 0, bottom: 0 }]} />
        <View testID="tutorial-scrim-blocker" style={[styles.band, { top: hit.top, height: Math.max(0, hit.bottom - hit.top), left: 0, width: hit.left }]} />
        <View testID="tutorial-scrim-blocker" style={[styles.band, { top: hit.top, height: Math.max(0, hit.bottom - hit.top), left: hit.right, right: 0 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // [D3] No `opacity` here on purpose. It used to carry 0.55 because the fill was an OPAQUE colour
  // (`background.primary`) that needed knocking back. `background.scrim` already carries its own alpha —
  // the same calibration every other dimmed surface in the app uses — so a multiplier on top would land
  // it at ~0.25/0.30 effective and undo the fix: a dim so light the ring is again doing all the work.
  scrim: {},
  band: { position: 'absolute' },
  // A quiet outline, not a glow: this is a reference surface being explained, so the highlight informs
  // rather than performs ([[match motion to the surface's job]]).
  ring: { position: 'absolute', borderWidth: 2, borderRadius: 14 },
  // Docked to the bottom so the coached surface above stays visible.
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.base },
  // 7.7 — a centred, width-capped column on the roomy layout, like every other surface in the app.
  dockInner: { alignSelf: 'center', width: '100%', borderRadius: 18, overflow: 'hidden' },
  // The Card sits ON the frost, so it contributes shape and padding but no fill of its own.
  //
  // `flexShrink: 1` is load-bearing, not tidiness. `Card` sets no flex properties, and Yoga's default
  // shrink is 0 — so the [B4] cap chain (`dockInner` maxHeight + `body`/`dockScroll` shrink) stopped
  // dead here: the Card kept its natural height and `dockInner`'s `overflow: 'hidden'` simply CLIPPED
  // the overflow instead of the ScrollView bounding it. What gets clipped is the bottom of the card,
  // which is the nav row — so at large Dynamic Type the fix meant to guarantee a reachable Next
  // produced a walkthrough with no Next, no Back and no Skip, while the scrim blocked Today and
  // `holdTabs` blocked the tabs. A trap, shipped by the change that existed to prevent one.
  dockCard: { backgroundColor: 'transparent', flexShrink: 1 },
  frost: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  progressRow: { gap: 6 },
  // 7.3 — a hairline rail: glanceable, and calm enough not to read as a game's progress bar.
  rail: { height: 3, borderRadius: 2, overflow: 'hidden' },
  railFill: { height: '100%', borderRadius: 2 },
  // 7.6 — pushes Skip to the far edge, so leaving is reachable without competing with continuing.
  navSpacer: { flex: 1 },
  skip: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' },
  body: { gap: spacing.xs, flexShrink: 1 },
  // `flexShrink` on both, so the scroller gives way to the nav row rather than the other way round.
  dockScroll: { flexGrow: 0, flexShrink: 1 },
  dockScrollContent: { gap: spacing.xs },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
});
