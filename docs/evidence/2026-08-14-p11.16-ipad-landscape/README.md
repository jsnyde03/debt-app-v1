# §11.16 — the iPad landscape frame, for 4.1.5.5.2's verdict

**Source:** run `31740873224`, artifact `maestro-report`, flow `i02-ipad-step5-landscape`
(iPad Pro 13-inch, 1032pt, landscape). iPad tier was 4/4 on that run.

**Open this one:** [`ipad-step5-landscape-upright.png`](ipad-step5-landscape-upright.png).

⚠️ `ipad-step5-landscape-as-captured.png` is what Maestro wrote — **stored portrait with a
landscape frame inside it**, i.e. sideways. Reading it un-rotated is a mistake already made
once on this lane (log, 2026-08-14: *"reading a sideways screenshot"*). The upright file is
the same pixels rotated 90° CCW; nothing else is changed.

**Regenerate:** `gh run download 31740873224 -n maestro-report`, then rotate
`…/i02-ipad-step5-landscape/takeScreenshot/maestro-debug/ipad-step5-landscape.png` by -90°.
⚠️ The artifact path is ~290 chars — copy it to a short path first or Windows tooling reports
the file missing rather than too-long.

## What the frame shows

The `RING_AUDIT` readout (top-left) reads `ring 442,277 subj 446,281 org 0,0 d 0,0` —
4.1.5.2's invariant holds on the axis `clampY` does not touch. **The geometry is not in
question here; the subject choice is.**

**① §11.16 as written — the BOTTOM edge.** The border encloses the Defer CTA, both small-print
paragraphs and *"See your forecast →"*, with padding below the last line. Nothing is cut. The
web-at-1194×834 failure does not reproduce natively.

**② Not what §11.16 asked — the TOP edge.** The ring opens at *"$200 · Your line"* and leaves
the Guardian card's header outside it: `PAYDAY GUARDIAN`, the red *"This paycheck won't cover
everything"*, the `Example` chip, the progress bar and `Cushion $0`. Two consequences worth
separating:

- **The label is inside its bar's frame while the bar is outside it.** *"$200 · Your line"*
  labels the progress bar above it, and the border runs between them.
- **Beat 5's copy is *"Some paychecks come up short. Your Guardian works out what has to be
  covered now, and what can safely wait."*** The ring covers the second clause (COVER NOW /
  SAFE TO DEFER) and excludes the sentence that states the first — which is the red headline.

## ✅ VERDICT — 2026-08-14, [D33]: BOTH EDGES PASS

⛔ **Finding ② above is REFUTED, by the portrait frame in the same artifact.**
`maestro-debug/tut-beat-5.png` is **iPad PORTRAIT** (2064×2752 = iPad Pro 13″ @2x; run `31740873224` is
the driver-stall run where **no iPhone flow executed**, so the artifact holds no iPhone frame). It reads
`ring 384,363 subj 388,367` and **encloses the whole Guardian card, header included.**

**So the subject is correct and was never in question.** In landscape the viewport is ~834pt, the card is
taller, and the ring **must** be cropped — the only choice is which end. Anchoring to the card's bottom is
right: beat 5 teaches *"what has to be covered now, and what can safely wait"*, i.e. the COVER NOW / SAFE
TO DEFER / Defer CTA block. Cropping that to show a headline the user already met would hide the beat's
subject.

⚠️ **Two residuals, folded into 4.1.5.6 — this row is NOT fully closed:**
1. The crop lands *between* "$200 · Your line" and the bar it labels — the one accidental-looking edge.
   Nudge the landscape scroll offset onto a component boundary.
2. **§11.16 asks for BOTH themes; only LIGHT was judged.** The dark landscape frame is still owed.
