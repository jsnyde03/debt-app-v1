import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { scrollDelta } from './spotlightGeometry';
import { TUTORIAL_STEPS } from '@/store/tutorialPath';

/**
 * 3.5.3.3.1 — the spotlight's ONE piece of real logic, tested away from React.
 *
 * `scrollDelta` decides whether the screen moves and by how much, and every way it can be wrong is
 * silent: too little and the beat describes something behind its own dock; too much and the subject
 * scrolls off the top; a stray non-zero and the screen twitches on every step. None of that throws,
 * and a render test would only tell you "something looked odd".
 */

let passed = 0;
function eq(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`❌ ${label}\n   expected: ${String(expected)}\n   actual:   ${String(actual)}`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`❌ ${label}`);
  passed++;
  console.log(`  ✓ ${label}`);
}

const rect = (y: number, height: number) => ({ x: 0, y, width: 300, height });

function run() {
  console.log('\n▶ spotlight geometry');

  const TOP = 100;
  const BOTTOM = 600; // a 500pt stage between the header and the coaching dock

  eq(scrollDelta(rect(200, 100), TOP, BOTTOM), 0, 'a subject already inside the stage does not move the screen');
  eq(scrollDelta(rect(TOP, 100), TOP, BOTTOM), 0, 'flush with the top edge counts as framed');
  eq(scrollDelta(rect(BOTTOM - 100, 100), TOP, BOTTOM), 0, 'flush with the bottom edge counts as framed');

  // Below the stage — the 3.5.3.2 at-risk case: the Recovery section sat behind the coaching dock.
  eq(scrollDelta(rect(700, 100), TOP, BOTTOM), 200, 'a subject below the stage scrolls down by exactly its overhang');
  eq(scrollDelta(rect(BOTTOM - 50, 100), TOP, BOTTOM), 50, 'a subject half-hidden by the dock scrolls just enough to clear it');

  // Above the stage — stepping BACK to an earlier beat whose subject is now off the top.
  eq(scrollDelta(rect(20, 100), TOP, BOTTOM), -80, 'a subject above the stage scrolls up (negative delta)');

  // Taller than the stage: the tall at-risk card. Aligning top beats centering, which would hide the
  // start of the very thing the user is being asked to read.
  eq(scrollDelta(rect(300, 900), TOP, BOTTOM), 200, 'a subject taller than the stage aligns to the TOP and accepts overflow');
  eq(scrollDelta(rect(TOP, 500), TOP, BOTTOM), 0, 'a subject exactly the stage height is already framed');

  // Every beat must name a subject that some component actually registers — a typo here degrades to an
  // uncut scrim, which looks like "the spotlight is broken" rather than failing anywhere visible.
  // 3.5.3.4 added `guardian-adjust`, and this assertion caught the beat re-point before any run did,
  // which is the whole reason it's here.
  //
  // Round 6: `REGISTERED` used to be a hand-written literal, and the comment above it said "keep in step
  // with the ids actually rendered". That is not a test — it compared two literals, so DELETING EVERY
  // `TutorialTarget` IN THE APP left it green, and it could never catch the one failure its own name
  // promises (a subject whose component stopped rendering it). It also quietly carried `guardian-line`,
  // an id no beat coached and no component needed, for five audit rounds. Now scanned from source, in
  // the spirit of `tutorialPath.test.ts`'s announce guard and the repo's `lint:webkit` scan.
  // Comments are stripped first, and that is not a detail: the very first run of this scan failed
  // because it matched the `<TutorialTarget id="guardian-line">` written inside the COMMENT explaining
  // that the target had just been removed. A scan that reads prose as code reports a target nobody
  // renders — the mirror image of the literal list it replaces, and just as untrue.
  const sources = ['../components/plan/PaydayGuardianCard.tsx', '../app/(tabs)/index.tsx']
    .map((p) => readFileSync(join(__dirname, p), 'utf8'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  const REGISTERED = [...sources.matchAll(/<TutorialTarget\s[^>]*?id="([^"]+)"/g)].map((m) => m[1]);
  assert(REGISTERED.length > 0, 'the TutorialTarget scan found at least one registered subject (else the regex has drifted)');
  for (const step of TUTORIAL_STEPS) {
    assert(!step.target || REGISTERED.includes(step.target), `beat "${step.id}" points at a registered subject`);
    assert(!step.payoffTarget || REGISTERED.includes(step.payoffTarget), `beat "${step.id}" payoff points at a registered subject`);
  }
  // And the inverse, which is what would have caught `guardian-line`: nothing may register a subject the
  // arc never points at. A target that no beat coaches is dead weight on a screen every user loads.
  const COACHED = new Set(TUTORIAL_STEPS.flatMap((s) => [s.target, s.payoffTarget]).filter(Boolean));
  for (const id of REGISTERED) {
    assert(COACHED.has(id), `registered subject "${id}" is actually coached by some beat (no orphan targets)`);
  }

  console.log(`✅ spotlight geometry: ${passed} assertions passed.\n`);
}

run();
