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
  // Keep in step with the `TutorialTarget` ids actually rendered by `PaydayGuardianCard` / Today.
  // 3.5.3.4 added `guardian-adjust` — and this assertion caught the beat re-point before any run did,
  // which is the whole reason it's here.
  const REGISTERED = ['guardian-card', 'guardian-bar', 'guardian-line', 'guardian-adjust', 'guardian-reserve', 'today-ack'];
  for (const step of TUTORIAL_STEPS) {
    assert(!step.target || REGISTERED.includes(step.target), `beat "${step.id}" points at a registered subject`);
    assert(!step.payoffTarget || REGISTERED.includes(step.payoffTarget), `beat "${step.id}" payoff points at a registered subject`);
  }

  console.log(`✅ spotlight geometry: ${passed} assertions passed.\n`);
}

run();
