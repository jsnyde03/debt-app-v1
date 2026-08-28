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
  withoutPlant: { status: number },
): { ok: boolean; line: string; failed: Failure[] } {
  const failed: Failure[] = [];
  if (!planted) failed.push('plant-not-applied');
  if (withPlant.status === 0) failed.push('failed-open');
  if (withoutPlant.status !== 0) failed.push('control-red');
  if (expect && !withPlant.out.includes(expect)) failed.push('wrong-reason');
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
  const greenControl = { status: 0 };
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
  must('a sound scenario passes', verdict('g', 'boom', true, red('...boom...'), greenControl), []);
  must('a WRONG reason is a failure', verdict('g', 'boom', true, red('unrelated startup error'), greenControl), ['wrong-reason']);
  must('no expect means no reason check', verdict('g', undefined, true, red('anything at all'), greenControl), []);
  must('a gate that fails OPEN is caught', verdict('g', 'boom', true, { status: 0, out: 'boom' }, greenControl), ['failed-open']);
  must('an unapplied plant is caught', verdict('g', 'boom', false, red('boom'), greenControl), ['plant-not-applied']);
  must('a red control is caught', verdict('g', 'boom', true, red('boom'), { status: 1 }), ['control-red']);
}
