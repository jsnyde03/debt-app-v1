import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { scrollDelta } from './spotlightGeometry';
import { COACH_MARKS } from '@/store/coachMarkCopy';
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

  // Beats and rendered subjects must match in BOTH directions: a beat pointing at nothing degrades to an
  // uncut scrim (silent), and a subject no beat coaches is dead weight on a screen every user loads.
  //
  // Scanned from source over all of `src`, never a literal list — a hand-maintained list of ids or of
  // files cannot see what moved. Comments are stripped, or prose about a target counts as one.
  const SRC = join(__dirname, '..');
  const sources = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => readFileSync(join(SRC, f), 'utf8'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  // `[^<]` not `[^>]`: a prop can contain `>` (an arrow-function `onLayout` sits between the tag name and
  // `id`), and `[^>]` cannot cross it — such a target was matched by neither pattern and vanished
  // silently. Bounded by the next `<` so it still can't run into a later element.
  const REGISTERED = [...sources.matchAll(/<TutorialTarget\b[^<]*?\sid="([^"]+)"/g)].map((m) => m[1]);
  // A PARTIAL miss is the silent one. `length > 0` only catches total drift; finding 5 of 6 leaves the
  // orphan assertion below quietly weaker while still reporting green.
  const OPEN_TAGS = (sources.match(/<TutorialTarget\b/g) ?? []).length;
  assert(
    REGISTERED.length === OPEN_TAGS,
    `every <TutorialTarget> yielded an id (${REGISTERED.length}/${OPEN_TAGS}) — else the regex has drifted`,
  );
  for (const step of TUTORIAL_STEPS) {
    assert(!step.target || REGISTERED.includes(step.target), `beat "${step.id}" points at a registered subject`);
    assert(!step.payoffTarget || REGISTERED.includes(step.payoffTarget), `beat "${step.id}" payoff points at a registered subject`);
  }
  // And the inverse, which is what would have caught `guardian-line`: nothing may register a subject
  // NOTHING points at. A target no one coaches is dead weight on a screen every user loads.
  //
  // 3.5.5.5 — the registry now has TWO consumers. A coach-mark points at a control with an entry in
  // `COACH_MARKS` and no beat anywhere, which is not an orphan; it is the other half of what this
  // registry is for. The invariant keeps its teeth by naming both consumers rather than by dropping the
  // check: a subject claimed by neither is still dead weight.
  const COACHED = new Set(TUTORIAL_STEPS.flatMap((s) => [s.target, s.payoffTarget]).filter(Boolean));
  for (const id of REGISTERED) {
    assert(
      COACHED.has(id) || id in COACH_MARKS,
      `registered subject "${id}" is coached by a beat or carries coach-mark copy (no orphan targets)`,
    );
  }

  console.log(`✅ spotlight geometry: ${passed} assertions passed.\n`);
}

run();
