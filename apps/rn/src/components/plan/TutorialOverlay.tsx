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
import { stageBounds } from '@/components/plan/tutorialStage';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { announce, decorative, headerProps } from '@/utils/a11y';
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
 *    AROUND the subject and the hole is what passes the touch through. There is no longer any case that
 *    renders no scrim: round 6 removed the one exception (see the note on the `Scrim` below).
 *
 * If you change the touch model, this comment is part of the change.
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
    // are reserved for the two moments the user actually causes something. `haptics` no-ops on web; the
    // system haptics setting is honoured by iOS itself, not by anything in that module — this used to
    // credit `haptics` with a settings check it does not contain.
    haptics.light();
    // Deps are the beat and the audience — the only two things a beat's copy depends on. Nothing
    // measured belongs here. A dep that a relayout can flip re-fires this effect, which repeats the tick
    // and restarts VoiceOver mid-sentence without the user having touched anything.
  }, [position, run]);
}

export function TutorialOverlay({
  position,
  total,
  title,
  body,
  onBack,
  onNext,
  onSkip,
  isLast,
  run,
  spotlight,
  passThrough = false,
  onDockLayout,
  impact,
}: {
  position: number;
  total: number;
  title: string;
  body: string;
  onBack?: () => void;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
  /** 3.5.3.6.2 — the audience, so the finale can name what premium actually did (and VoiceOver hears it). */
  run: TutorialRun;
  /** 3.5.3.3.1 — where this beat's subject landed, in window coordinates. Null → an uncut scrim. */
  spotlight?: TargetRect | null;
  /** Should the cutout pass TOUCHES as well as light? Published by the screen — see `tutorialShell`. */
  passThrough?: boolean;
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

  // Release the dock height on the way out. The shell outlives every session, so a parked `dockH` skews
  // the next session's first `stageBottom` until the new dock lays out: the opening beat scrolls its
  // subject into a stage sized by a dock that no longer exists. Every published value owes this.
  useEffect(() => () => onDockLayout?.(0), [onDockLayout]);

  // 3.5.3.3.4.3 — subjects are measured in WINDOW coordinates, but this overlay draws in its own local
  // space, and the two are only the same on a phone. On the iPad regular layout the tab bar becomes a
  // left sidebar RAIL, so the overlay's origin sits ~700pt to the right of the window's — and the ring
  // was drawn that far right of its subject, landing on an unrelated row in the other column. Caught by
  // shooting the walkthrough at 1024×768; a phone-only screenshot pass would have shipped it.
  const rootRef = useRef<View>(null);
  const [dockH, setDockH] = useState(0);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const measureOrigin = () => {
    rootRef.current?.measureInWindow?.((x, y) => {
      setOrigin((prev) => (prev.x === x && prev.y === y ? prev : { x, y }));
    });
  };
  // CLAMPED to the stage. A subject can be taller than the band it's scrolled into — the at-risk
  // Guardian card is ~697pt against a ~530pt stage — and nothing used to stop the highlight being drawn
  // at its full height, so beat 5's ring ran straight through the coaching dock: a hard accent rule
  // slicing the sentence in half, in both themes, reading as a rendering bug rather than as a spotlight.
  // An over-tall subject is now lit to the edge of the stage and stops there.
  //
  // The VISUAL geometry only. Reachability is a separate layer by design (`Scrim`'s hit bands take the
  // unclamped rect), because clipping what a user can TOUCH to what happens to be visible would silently
  // shrink the tap area of a control the beat is asking them to operate.
  const stage = stageBounds(insets.top, windowH, dockH);
  const local = spotlight ? { ...spotlight, x: spotlight.x - origin.x, y: spotlight.y - origin.y } : null;
  const clamped = local
    ? (() => {
        const top = Math.max(local.y, stage.top - origin.y);
        const bottom = Math.min(local.y + local.height, stage.bottom - origin.y);
        return { ...local, y: top, height: Math.max(0, bottom - top) };
      })()
    : null;

  return (
    // `box-none` lets touches fall through to Today everywhere the overlay has no child; the scrim
    // below re-blocks them on scripted beats. Without this, even the pass-through beats would swallow.
    // `collapsable={false}` for the same reason `TutorialTarget` carries it, and this is the OTHER half
    // of the same subtraction: every ring, hole and touch band is `subject − origin`, and the origin
    // comes from measuring THIS view. A layout-only View with no background and `box-none` is exactly
    // what Android's view flattener removes — and if it goes, the callback never fires, `origin` stays
    // silently at {0,0}, and on the Android window configurations where `measureInWindow` includes the
    // status bar every coordinate shifts down by its height. The registry learned this and the overlay
    // never did. Web never flattens views, so no Playwright run could ever have shown it.
    <View
      ref={rootRef}
      onLayout={measureOrigin}
      collapsable={false}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      testID="tutorial-overlay">
      {/* 3.5.3.3.1 — with a subject on screen the scrim is drawn as four bands AROUND it instead of one
          sheet over everything, so the thing being taught is the one thing at full strength. Four rects
          rather than a mask: no Skia/SVG dependency on a surface that must render identically on web,
          and the cutout is plain geometry a test can assert.

          3.5.3.5.9 — the scrim now stays up on INTERACTIVE beats too. It used to be dropped entirely
          there, which made every control on screen live — including More, which pushes a route out from
          under the walkthrough. The plan has promised "passes touches through to the TARGET only" since
          3.5.3 was written, and the cutout was already exactly that mechanism: the bands capture touches,
          the hole doesn't. It simply was never rendered.

          The scrim renders UNCONDITIONALLY. Dropping it for an interactive beat whose subject never
          measured traded a fence for nothing: the dock is a sibling rendered AFTER this, so Next/Back/
          Skip sit above the scrim either way and a full scrim was never a trap. A null rect collapses
          the hole to zero area, which renders as full coverage, so there is no separate branch to take.
          What a beat SAYS never depended on this: the arc invariant proves each beat's seeded state
          renders its subject, so a null rect here means the measurement missed, not that the ask is a
          lie. */}
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
      <Scrim rect={clamped} hitRect={local} color={c.background.scrim} passThrough={passThrough} />
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
      {clamped && clamped.height > 0 ? (
        <Animated.View
          // All four dimensions. `width` was missing, so a subject that changed only in width — an iPad
          // Split View drag is exactly that — kept the old key and never re-entered.
          key={`${Math.round(clamped.x)}:${Math.round(clamped.y)}:${Math.round(clamped.width)}:${Math.round(clamped.height)}`}
          entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
          pointerEvents="none"
          style={[
            styles.ring,
            {
              left: clamped.x - RING_INSET,
              top: clamped.y - RING_INSET,
              width: clamped.width + RING_INSET * 2,
              height: clamped.height + RING_INSET * 2,
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
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          // Kept HERE as well as published upward: the screen needs it to size the scroll stage, and this
          // overlay needs it to know where its own drawing has to stop. Reading it back through the shell
          // would make the clamp a render behind the dock that defines it.
          setDockH(h);
          onDockLayout?.(h);
        }}>
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
            {/* The tint is 0.80, not 0.55. [D1] calibrated it against the TAB BAR, which never has body
                text beneath it — the dock does, and at 0.55 the Can-I-afford-it card read straight
                through it: "e.g. 400" legible INSIDE the dark Next button, "WHAT IS IT? (OPTIONAL)"
                running across the nav row. A dock that doesn't isolate isn't glass, it's a smudge. The
                blur stays at 70, so it still reads as a material rather than a slab. */}
            <BlurView tint={scheme === 'dark' ? 'dark' : 'light'} intensity={70} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background.secondary, opacity: 0.8 }]} />
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
                {/* 3.5.3.11 (Jason 2026-08-04) — the whole canvas is marked as an example, not just the
                    Guardian card.
                    The card's "Example" chip was the only marker anywhere, and the walkthrough puts
                    SANDBOX money on every other surface too — the paycheck hero, required actions,
                    recommended actions, affordability. Worse, `personalScenario` seeds the user's REAL
                    debts by name and balance into fabricated states, so on beat 5 their actual bills
                    appear inside an invented $200 shortfall. A screenshot cropped below the card's title
                    row carried no indication that any of it was fictional.
                    WHY IT LIVES HERE and not on the scrim: the dock is on screen for the entire session
                    and already has a line of quiet metadata, so this marks the whole canvas by adding a
                    single word rather than a fifth chip or a new band. The barest version first
                    ([[less is more premium]]) — no fill, no border, no surface of its own.
                    The card chip STAYS: it's the marker for when the sandbox renders WITHOUT this
                    overlay, which is exactly what 3.5.4's demo mode and 3.5.7's web demo will do. */}
                <Text style={[textStyles.caption, { color: c.text.tertiary }]} testID="tutorial-progress">
                  Step {position} of {total} · Example money
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
/** The hole's corner radius. ONE constant, shared with the ring — they disagreed, and four bright square
 *  nubs at every rounded corner is what that disagreement looked like. */
const HOLE_RADIUS = 14;
/** How far the dark extends past the hole on every side. Only has to exceed the largest screen dimension
 *  so the view's own (rounded) outer corners are always off-screen; the clip parent hides the excess. */
const BLEED = 2000;

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
  hitRect,
  color,
  passThrough,
}: {
  /** The VISUAL hole — clamped to the stage, so an over-tall subject is lit only as far as the dock. */
  rect: TargetRect | null;
  /** The REACHABLE hole — unclamped. What a user can touch must not shrink to what happens to be drawn. */
  hitRect: TargetRect | null;
  color: string;
  /** Cut the hole in the BLOCKING geometry too. Only true on a beat that asks the user to touch the
   *  subject — otherwise the hole is purely visual and everything underneath stays fenced off. */
  passThrough: boolean;
}) {
  const a11y = decorative;

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
  // Seeded to the screen CENTRE, not {0,0}. The Scrim mounts before the first rect exists, so the
  // springs initialise wherever the anchor is — and at the origin the very first iris of every session
  // opened diagonally from the top-left CORNER out to the Guardian card. One glitchy sweep, on the first
  // frame the user ever sees of the walkthrough. From the centre the same animation reads as intended.
  const { width: winW, height: winH } = useWindowDimensions();
  const anchor = useRef({ x: winW / 2, y: winH / 2 });
  if (rect) anchor.current = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };

  const top = rect ? Math.max(0, rect.y - RING_INSET) : anchor.current.y;
  const bottom = rect ? rect.y + rect.height + RING_INSET : anchor.current.y;
  const left = rect ? Math.max(0, rect.x - RING_INSET) : anchor.current.x;
  const right = rect ? rect.x + rect.width + RING_INSET : anchor.current.x;

  const t = useSpringValue(top);
  const b = useSpringValue(bottom);
  const l = useSpringValue(left);
  const r = useSpringValue(right);

  // ONE view with a ROUNDED HOLE, not four bands meeting at square corners.
  //
  // Four bands cut a plain rectangle while the ring carries `borderRadius: 14`, so at each corner a wedge
  // of content sat inside the hole and outside the ring — four bright square nubs protruding from every
  // rounded corner, on EVERY beat, worst in light. Shipping since 3.5.3.3.1 and invisible to eleven
  // correctness lenses, because nothing about it is wrong except how it looks.
  //
  // The mechanism is a border, not a mask: a view inflated by `BLEED` on every side, with a `BLEED`-wide
  // border, has an inner edge exactly on the hole — and a border's inner corner radius is
  // `borderRadius − borderWidth`, so asking for `BLEED + HOLE_RADIUS` leaves the hole rounded at
  // `HOLE_RADIUS`. The outer rounding lands `BLEED` off-screen where nobody can see it. No Skia, no SVG,
  // no mask — the constraint the four-band version was written to satisfy still holds.
  const dark = useAnimatedStyle(() => ({
    top: t.value - BLEED,
    left: l.value - BLEED,
    width: Math.max(0, r.value - l.value) + BLEED * 2,
    height: Math.max(0, b.value - t.value) + BLEED * 2,
  }));

  // What the user SEES and what the user can TOUCH are now two layers, because the animation made them
  // disagree. A travelling band is over the new subject for the whole of its journey, so a single set of
  // bands doing both jobs meant the coached control was un-tappable for as long as the spring took —
  // roughly half a second, longer with the overshoot. The e2e caught it as flakiness (Playwright retried
  // the click until the band moved off); for a user it's the tap that does nothing on the beat that just
  // asked them to tap. The blocking geometry therefore snaps to the destination while the dark travels.
  // A scripted beat gets a collapsed hit-hole — the bands meet and the whole screen is fenced, however
  // the light is cut above it.
  // Off the UNCLAMPED rect. The visual hole stops at the dock so the ring can't be drawn across the
  // coaching copy; the reachable hole must not, or a subject taller than the stage would have the bottom
  // of the control the beat is asking the user to operate quietly fenced off.
  const hit =
    passThrough && hitRect
      ? {
          top: Math.max(0, hitRect.y - RING_INSET),
          bottom: hitRect.y + hitRect.height + RING_INSET,
          left: Math.max(0, hitRect.x - RING_INSET),
          right: hitRect.x + hitRect.width + RING_INSET,
        }
      : { top: 0, bottom: 0, left: 0, right: 0 };

  return (
    // `box-none` on the container, so the BANDS capture touches and the hole between them doesn't —
    // which is the whole pass-through mechanism on interactive beats (3.5.3.5.9). With the hole
    // collapsed the bands meet and cover everything, so a null rect blocks exactly as the old sheet did.
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" {...a11y} testID="tutorial-scrim">
      {/* The DARK. `tutorial-scrim-band` — "is the subject lit?" is a question about this layer.
          `overflow: 'hidden'` on the clip: the dark view deliberately extends `BLEED` past every edge. */}
      <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
        <Animated.View testID="tutorial-scrim-band" style={[styles.band, styles.hole, { borderColor: color }, dark]} />
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
  band: { position: 'absolute' },
  clip: { overflow: 'hidden' },
  // The dark, as a border around a rounded hole — see the note at `dark`. `backgroundColor` stays unset:
  // the fill IS the border, and a background would paint straight over the hole.
  //
  // `overflow: 'hidden'` is LOAD-BEARING on iOS and has nothing to do with clipping here (the view has no
  // children). RN only hands a border to Core Animation when one of three things is true — zero border
  // width, a fully transparent border colour, or `clipsToBounds`
  // (`RCTViewComponentView.mm`, `useCoreAnimationBorderRendering`). A 2000pt scrim-coloured border is
  // none of the first two, so without this the view falls to `RCTGetSolidBorderImage`, which RASTERISES:
  // a ~4029×4029pt bitmap, re-drawn on every spring frame because layout props mark the layer invalid.
  // `overflow` maps to `clipsToBounds` via `BaseViewProps::getClipsContentToBounds()`, which restores the
  // vector path and keeps the inner radius at `borderRadius − borderWidth` exactly as the geometry needs.
  // Web is unaffected either way, which is why no test here can see it.
  hole: { borderWidth: BLEED, borderRadius: BLEED + HOLE_RADIUS, overflow: 'hidden' },
  // A quiet outline, not a glow: this is a reference surface being explained, so the highlight informs
  // rather than performs ([[match motion to the surface's job]]).
  ring: { position: 'absolute', borderWidth: 2, borderRadius: HOLE_RADIUS },
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
  // `marginLeft: 'auto'`, not a flex spacer. A `flex: 1` spacer View is consumed by the FIRST line, so
  // when the row wrapped (large Dynamic Type, narrow screens) Skip dropped onto its own line and landed
  // LEFT-aligned directly beneath Next — the most conspicuous position a secondary control can occupy,
  // exactly inverting the hierarchy this row exists to establish. `auto` margins survive the wrap.
  skip: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end', marginLeft: 'auto' },
  body: { gap: spacing.xs, flexShrink: 1 },
  // `flexShrink` on both, so the scroller gives way to the nav row rather than the other way round.
  dockScroll: { flexGrow: 0, flexShrink: 1 },
  dockScrollContent: { gap: spacing.xs },
  // `flexWrap` because this row cannot shrink: Yoga defaults `flexShrink` to 0, `Button` carries fixed
  // horizontal padding and its label has no `numberOfLines`, and the only elastic member is a `flex: 1`
  // spacer that collapses to nothing. Past roughly AX2.5 on a 375pt screen the three controls exceed the
  // dock's width and spill into its `overflow: 'hidden'`, taking Skip off-screen — the escape hatch, for
  // the users most likely to want it. Round 2 fixed the VERTICAL clipping of this same row and nobody
  // checked the other axis. Wrapping drops Skip onto its own line; the dock's height cap absorbs it.
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
});
