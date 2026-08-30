/**
 * ⛔ **S1.11.3.1 — THE VERDICT LIVES IN ONE FILE BECAUSE THERE MUST BE ONE PRODUCER OF IT.**
 *
 * ⚡ `test:gate-plants` proves a **gate** fails closed; `prove:guards` proves a **registry entry** reds on
 * its own defect. Two harnesses, one question — *did the plant land, did the thing red, did it red for the
 * right reason, and was the control green?* ⛔ `D4-6` is what happens when that question has two
 * implementations: the tick and the printed reason disagreed on one line, and the harness announced
 * *"all 21 gates fail closed"* beside `reason=WRONG`. A second copy in a second file is the same defect
 * with a directory between its halves.
 *
 * ⚠️ **The self-check at the bottom fires on IMPORT**, so it guards both callers rather than one.
 */
/**
 * ⛔ **S1.11.2 [pass-4 D4-6] — ONE PRODUCER OF THE VERDICT, BECAUSE THERE WERE TWO.**
 *
 * The tick and the printed reason used to be computed separately:
 *
 * ```ts
 * const rightReason = !s.expect || withPlant.out.includes(s.expect);
 * const ok = planted && withPlant.status !== 0 && withoutPlant.status === 0 && rightReason;
 * //                                                                          ^^^^^^^^^^^^
 * ```
 *
 * ⚡ **Deleting those two words made `ok` true while `reason=WRONG` went on printing** — so the harness
 * emitted `✅ … reason=WRONG` and then announced *"all 21 gates fail closed"*, exit 0. It contradicted
 * itself on one line. Two lines of edit, three registered guards in a chain, and the only load-bearing
 * one was a token that survived its own un-fix (`S1P2-B1-REASON`, measured guard-only by `D4-1`).
 *
 * ⛔ **The fix is not a check for that contradiction — it is making it unrepresentable.** The tick, the
 * printed reason and the failure count now read the SAME array. There is no expression left that can
 * disagree with the label beside it.
 *
 * ⚠️ **That closes the contradiction and not the deletion**: removing the `wrong-reason` push would make
 * the harness self-consistently blind. The module-scope self-check below is what refuses that, and it is
 * executable rather than a token — the `S1P3-SELFCHECK-CALL` idiom, which fires on import so a check
 * inside a function nobody calls cannot be the residual.
 */
export type Failure = 'plant-not-applied' | 'failed-open' | 'control-red' | 'wrong-reason';

/**
 * ⛔ **S1.12.5.1 [pass-5 D5-5] — THE `expect` MUST APPEAR IN A FAILURE LINE, NOT ANYWHERE.**
 *
 * ⚡ `wrong-reason` was `!withPlant.out.includes(expect)`. Both suites print a PASSING row as
 * `✓ <label>`, and a registered `expect` is usually a slice of that same label — so **for 26 of the 50
 * checkable proofs the string was already present in the fully GREEN output** and the check could not
 * fail. Lane D demonstrated it by planting an unrelated defect carrying another finding's `expect`:
 * the harness printed `✅ … reason=MATCHED` and announced *"1 guard(s) red on their own defect."*
 *
 * ⛔ **That is `D4-6`'s shape one level down.** `D4-6` was a tick that disagreed with its printed
 * reason; this is a printed reason that agrees with the tick and with nothing in the world. A check
 * that cannot fail reads exactly like a check.
 *
 * ⛔ **AND THE FIRST FIX FOR IT WAS THE SAME DEFECT AGAIN.** The obvious narrowing is to keep only
 * lines that look like failures — `/FAIL \[|Error:|❌/` — which is what `prove-guards.ts` already used
 * privately to decide what to PRINT. ⚡ **It was written, and the harness's own hermetic probe refuted
 * it in one run:** `prove-guards-probe.mjs` reds with `PROBE: the guard is gone`, which carries none of
 * those markers, so all three self-test controls flipped to `wrong-reason`. **A marker list is an
 * enumeration of spellings, and an enumeration of spellings has failed in this repo eight times.**
 *
 * ⭐ **The discriminator is not what a line LOOKS like — it is whether the plant INTRODUCED it.** The
 * output of the control run is already in hand at both call sites; a reason is attributable exactly
 * when `expect` appears in a line the planted run produced and the green run did not. `✓ the cushion
 * holds` appears in both, so it can never satisfy the check again; `PROBE: the guard is gone` appears
 * in only one, so it always can. Nothing is enumerated and no new spelling can slip past.
 */
/**
 * Lines present in the planted output and absent from the control's.
 *
 * ⚠️ **Compared on a NORMALISED key** — ANSI stripped, whitespace collapsed, digit runs folded to `#` —
 * because a duration (`✓ … (12ms)`) or a count differing between two runs would otherwise make an
 * unchanged line read as introduced, and that is the fail-OPEN direction: more lines qualifying means
 * an easier check, which is the defect being closed. The ORIGINAL line is what `expect` is matched
 * against; the key is only ever used for line identity.
 */
export function introducedLines(plantedOut: string, controlOut: string): string[] {
  const key = (l: string): string =>
    // ⚠️ The ESC is written as an escape, not as the raw byte. lint:control-chars reds on a raw
    // one and it is right to: this line reached the tree carrying a literal ESC, invisible in every
    // diff and every review, and the escaped form is the correct ANSI-SGR pattern anyway.
    // eslint-disable-next-line no-control-regex
    l.replace(/\u001b\[[0-9;]*m/g, '').replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
  const control = new Set(controlOut.split('\n').map(key).filter(Boolean));
  return plantedOut
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() && !control.has(key(l)));
}

/**
 * ⚠️ **THE TICK AND THE PRINTED LINE ARE RETURNED TOGETHER, ON PURPOSE.** Returning only the failure
 * list left the residual open: a caller could still write `failed.filter(f => f !== 'wrong-reason')`
 * and re-create the contradiction outside the reach of the self-check. There is nothing left at the
 * call site to get wrong — it prints `line` and counts `ok` — so **every un-fix has to happen inside
 * this function, which is the thing the self-check below reads.**
 */
export function verdict(
  gate: string,
  expect: string | undefined,
  planted: boolean,
  withPlant: { status: number; out: string },
  withoutPlant: { status: number; out: string },
): { ok: boolean; line: string; failed: Failure[] } {
  const failed: Failure[] = [];
  if (!planted) failed.push('plant-not-applied');
  if (withPlant.status === 0) failed.push('failed-open');
  if (withoutPlant.status !== 0) failed.push('control-red');
  // ⛔ D5-5: `expect` must appear in a line the PLANT INTRODUCED, not anywhere in the output. Whole-output
  // `includes` is satisfied by the green run — which is how 26 of the 50 checkable proofs carried a reason
  // check that could not fail.
  //
  // ⚠️ **Only asked of a run that actually redded.** "Did it red for the right reason" is not a question
  // about a run that did not red, and firing both would mask which failure was really measured — the
  // hermetic probe's DEAD half exists precisely to assert `failed-open` alone.
  if (expect && withPlant.status !== 0 && !introducedLines(withPlant.out, withoutPlant.out).some((l) => l.includes(expect))) {
    failed.push('wrong-reason');
  }
  const ok = failed.length === 0;
  const reason = expect ? (failed.includes('wrong-reason') ? 'WRONG' : 'MATCHED') : null;
  const line =
    `  ${ok ? '✅' : '❌'} ${gate.padEnd(26)} plant-applied=${planted ? 'YES' : 'NO '} ` +
    `· planted=exit ${withPlant.status} · control=exit ${withoutPlant.status}` +
    `${reason ? ` · reason=${reason}` : ''}`;
  return { ok, line, failed };
}

/**
 * ⛔ **MODULE SCOPE — import alone fires it.** Every scenario verdict in this file comes from
 * `verdict()`, so a `verdict()` that has stopped checking something is a run whose every green means
 * nothing. ⚡ **The load-bearing row is `a WRONG reason is a failure`**: it is the one that reds if the
 * `wrong-reason` push is deleted, which is precisely the un-fix `D4-6` walked through.
 */
{
  const red = (out: string) => ({ status: 1, out });
  // ⚠️ The control now carries OUTPUT, because `wrong-reason` is a question about the DIFFERENCE between
  // the two runs. A control fixture with no output means every planted line reads as introduced — which
  // is the permissive direction, so each row below that must fail states its control's output explicitly.
  const greenControl = { status: 0, out: '' };
  const die = (name: string, detail: string): never => {
    console.error(
      `\n❌ test:gate-plants — its OWN verdict() is broken: ${name}\n   ${detail}\n` +
        `   ⛔ Every scenario verdict in this file is that function. No run below this line means anything.\n`,
    );
    process.exit(1);
  };
  const must = (name: string, got: ReturnType<typeof verdict>, want: Failure[]): void => {
    if (got.failed.join(',') !== want.join(',')) die(name, `expected [${want.join(', ')}] · got [${got.failed.join(', ')}]`);
    // ⛔ THE INVARIANT D4-6 BROKE. A line that says the gate redded for the wrong reason may never
    // carry a ✅, and a line that carries a ✅ may never say WRONG. Asserted on the STRING that is
    // actually printed, because the string is the thing a human reads and believes.
    if (got.line.includes('reason=WRONG') && got.line.includes('✅')) die(name, `printed a ✅ beside reason=WRONG: ${got.line.trim()}`);
    if (got.ok !== !got.failed.length) die(name, `ok=${got.ok} disagrees with failed=[${got.failed.join(', ')}]`);
  };
  must('a sound scenario passes', verdict('g', 'boom', true, red('boom'), greenControl), []);
  must('a WRONG reason is a failure', verdict('g', 'boom', true, red('unrelated startup error'), greenControl), ['wrong-reason']);
  must('no expect means no reason check', verdict('g', undefined, true, red('anything at all'), greenControl), []);
  must('a gate that fails OPEN is caught', verdict('g', 'boom', true, { status: 0, out: 'boom' }, greenControl), ['failed-open']);
  must('an unapplied plant is caught', verdict('g', 'boom', false, red('boom'), greenControl), ['plant-not-applied']);
  must('a red control is caught', verdict('g', 'boom', true, red('boom'), { status: 1, out: '' }), ['control-red']);

  // ⛔ **THE ROW THAT REFUSES D5-5's UN-FIX, AND IT IS THE ONLY ONE THAT CAN.** Every row above passes
  // under the old whole-output `includes`. Here the `expect` IS in the planted output — in a line the
  // GREEN run printed identically — so a check that reads the whole output calls this MATCHED and a
  // check that reads what the plant introduced calls it WRONG. That is the entire defect, as one row.
  must(
    'an expect the control printed too is a WRONG reason',
    verdict('g', 'the cushion holds', true, red('  ✓ the cushion holds\n  something else broke'), {
      status: 0,
      out: '  ✓ the cushion holds',
    }),
    ['wrong-reason'],
  );
  // ⚠️ **The converse, so the fix cannot be "achieved" by rejecting everything.** Same passing row in
  // both runs, but the plant also introduced a line carrying the string: that is attributable, and must
  // still read MATCHED. Without this row, `failed.push('wrong-reason')` unconditionally would pass.
  must(
    'an expect in a line the plant INTRODUCED still matches',
    verdict('g', 'the cushion holds', true, red('  ✓ the cushion holds\n  FAIL [the cushion holds]: expected 300, got 100'), {
      status: 0,
      out: '  ✓ the cushion holds',
    }),
    [],
  );
  // ⚠️ **A duration must not make an unchanged line read as introduced.** Without the digit-folding in
  // `introducedLines`' key, this row reads MATCHED — the permissive direction, and the one that would
  // quietly restore the vacuous behaviour for every suite that prints timings.
  must(
    'the same line with a different duration is NOT introduced',
    verdict('g', 'the cushion holds', true, red('  ✓ the cushion holds (37ms)\n  something else broke'), {
      status: 0,
      out: '  ✓ the cushion holds (12ms)',
    }),
    ['wrong-reason'],
  );
  // ⚠️ **`failed-open` suppresses the reason question.** A run that did not red has no failure to
  // attribute, and firing both would mask which one was actually measured — the hermetic probe's DEAD
  // half asserts `failed-open` ALONE and its green output is identical in both runs.
  must(
    'a failed-open run is not ALSO wrong-reason',
    verdict('g', 'PROBE: ok', true, { status: 0, out: 'PROBE: ok' }, { status: 0, out: 'PROBE: ok' }),
    ['failed-open'],
  );
}
