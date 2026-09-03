import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { unreadInputsFix } from '@/components/plan/dataRepairsCopy';
import type { DataRepair } from '@/data/models';

/**
 * ⛔ **S1.13.7.8 [pass-6 `C1-1`] — A REFUSAL MAY NOT POINT AT A SIBLING; IT NAMES THE FIGURE.**
 *
 * Three cards on Today refused their claim and ended *"set it again **above**"*. The only affordance that
 * names *which* amount could not be read is `DataRepairsCard`, and its lifetime is governed by a
 * **different predicate** from theirs: it renders on `!acknowledged`, they render on `poisons`, which
 * never reads `acknowledged`. Both are correct and both are deliberate (`A-J2-1` — making `mayClaim` read
 * `acknowledged` restored *"every balance is cleared"* over debts still owed). **The copy is what did not
 * follow.** One "Got it" tap and the user reads three cards refusing to answer, pointing at a control
 * that is no longer on the screen, none of them naming the figure.
 *
 * ⚡ **The population is swept, not listed.** The finding named three files. A fourth — `WindfallSheet` —
 * carries the same class one word quieter: *"set it again"* with no figure named and no "above" to give it
 * away. It is fixed here too, and the sweep is what found it: every file that consumes `unreadPlanInputs`
 * is checked, so the next one cannot be added silently.
 */

let passed = 0;

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function eq<T>(actual: T, expected: T, label: string) {
  assert(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

const NEWLINE = String.fromCharCode(10);

/**
 * Source with whole-line comments removed — the docblocks quote the banned wording while recording it.
 *
 * ⛔ **EACH LINE IS TRIMMED BEFORE THE JOIN, and it was not** — pass-7 `C1-9`. `line.trimStart()` was used
 * only to decide whether a line was a comment; the value joined was the **raw** line, indentation included.
 * So a phrase split across a line break joined as `again` + `' '` + `'                    above'`, and the
 * needle `'again above'` — a single space — never matched.
 *
 * ⚡ **Planted both directions in `RequiredActionsCard.tsx`:** the phrase on one line → **exit 1**, naming
 * the card; the SAME defect wrapped across a line → **exit 0 over 30 green assertions.** That is the whole
 * of `S1.13.7.8`'s finding — three cards saying *"set it again above"* about a card one tap removes —
 * coming back through the guard written to stop it, because a long JSX string is exactly what gets wrapped.
 */
function codeLinesOnly(source: string): string {
  return source
    .split(NEWLINE)
    .filter((line) => {
      const t = line.trimStart();
      return !(t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'));
    })
    .map((line) => line.trim())
    .join(' ')
    /**
     * ⛔ **CONCATENATION JUNCTIONS ARE REMOVED, because the READER never sees them** — class-1 re-audit
     * `R12`. Trimming fixed the wrap and normalised nothing between the two words, so the same sentence
     * written `… set it again ` + `above.` rendered identically and passed **30 assertions, exit 0** —
     * the same count as the green run, which is the "a check that cannot fail" signature.
     *
     * ⚠️ This deliberately also welds two genuinely separate adjacent literals together. That is the
     * correct direction: they are adjacent **on screen**, which is the only place the refusal matters.
     */
    /**
     * ⛔ **EVERY JUNCTION BETWEEN TWO LITERALS, not just the one the finding exhibited** — `R12`, then
     * `N-7`. R12's own mechanism paragraph listed three things that can land between the two words — *"a
     * quote, a `+`, a `{' '}` JSX separator"* — and the first fix normalised two of them. The third then
     * shipped the banned sentence past **33 green assertions**, which is the same count as the clean run.
     *
     * ⚠️ **The reader sees none of these.** `{'…'}{' '}{'…'}` renders as one sentence, so the detector has
     * to read it as one sentence — the junctions are an artefact of how JSX is written, exactly as the line
     * break and the `+` were.
     */
    .replace(/\{\s*(['"`])\s*\1\s*\}/g, ' ')
    .replace(/['"`]\s*\}\s*\{\s*['"`]/g, ' ')
    .replace(/['"`]\s*\+\s*['"`]/g, '')
    .replace(/[ \t]+/g, ' ');
}

const repair = (over: Partial<DataRepair> = {}): DataRepair =>
  ({ entity: 'debt', id: 'd1', name: 'Visa', field: 'balance', kind: 'repaired', acknowledged: false, ...over }) as DataRepair;

/**
 * A file that renders an unread-inputs refusal but gives NO instruction is exempt — there is nothing for
 * it to point at wrongly. ⚠️ Each exemption states why, and a stale one reds, so this cannot quietly
 * become a place to park a file.
 */
const NO_INSTRUCTION: Record<string, string> = {
  'apps/rn/src/components/plan/PlanHero.tsx':
    'the hero states that the plan cannot be placed and stops there — "I can’t tell you where the plan ' +
    'lands yet" issues no instruction, so it points nowhere and the cards below carry the action.',
  'apps/rn/src/app/(tabs)/index.tsx':
    'the host: it passes `unreadPlanInputs` and the produced clause to its children and renders no ' +
    'refusal sentence of its own. Its own obligation is asserted separately, below.',
};

/**
 * Components the HOST may hand `unreadPlanInputs` without also handing the instruction.
 *
 * ⚠️ The host is where the next omission will happen: a card added with the boolean and no clause renders
 * the empty-string default and its sentence trails off mid-instruction. So every element in `index.tsx`
 * that receives one is required to receive the other, unless it is named here with a reason.
 */
const HOST_NO_CLAUSE: Record<string, string> = {
  PlanHero: 'issues no instruction — see NO_INSTRUCTION above',
};

export function runUnreadInputsCopyTests() {
  console.log('\n🩹 the unread-inputs refusal: it names the figure, never a position\n');

  {
    // ── The producer. The finding's remedy (a): name the figure, using the repairs' own labels. ──
    eq(
      unreadInputsFix([repair()], 'and this comes back'),
      'set the balance on Visa again and this comes back',
      'one repair names the field and the row',
    );
    eq(
      unreadInputsFix([repair(), repair({ id: 'd2', name: 'Chase', field: 'minimumPayment' })], 'and it comes back'),
      'set the balance on Visa and the minimum payment on Chase again and it comes back',
      'two are both named',
    );
    assert(
      unreadInputsFix([repair(), repair({ id: 'd2' }), repair({ id: 'd3' })], 'x').includes('the 3 amounts'),
      'three or more become a count — still specific about how many times they will be asked',
    );
    assert(
      !unreadInputsFix([repair()], 'and this comes back').includes('above'),
      '⛔ …and none of them makes a positional claim about a sibling card',
    );
  }

  {
    /**
     * ⛔ **`B5-7`'s member: a repair whose `name` is `''` while the row still exists and is editable.**
     * `answerableByEdit` is `!!r.id && !isWholeRowLoss`, never `!!r.name` — measured as a blocker last
     * round — so this must still produce an instruction, pointing at the entity rather than nowhere.
     */
    const nameless = unreadInputsFix([repair({ name: '' })], 'and this comes back');
    assert(nameless.startsWith('set '), 'a repair with a blank NAME is still answerable and still instructs');
    assert(nameless.includes('one of your debts'), '…pointing at the entity, since there is no row name to give');
  }

  {
    /**
     * ⛔ **THE OPPOSITE DIRECTION, and it is where a naive fix fails.** A whole-row or whole-list loss
     * names no field and has no screen to open. Telling that user to "set it again" is a false
     * instruction — the same defect the finding is about, wearing the fix's clothes — so the clause
     * changes shape entirely rather than gaining a name.
     */
    const whole = unreadInputsFix([repair({ field: '(whole list unreadable)', id: '', name: '' })], 'and this comes back');
    assert(!whole.startsWith('set '), 'an unanswerable loss does not issue an instruction the user cannot follow');
    assert(!whole.includes('and this comes back'), '…and the comeback promise is dropped with it, not reworded');
    assert(whole.includes('could not be read at all'), '…it says what is actually true instead');
  }

  {
    // ── The population: every consumer of the refusal, swept from `git ls-files`. ──
    const repoRoot = join(__dirname, '..', '..', '..', '..', '..');
    const tracked = execFileSync('git', ['ls-files', 'apps/rn/src'], { cwd: repoRoot, encoding: 'utf8' })
      .split(NEWLINE)
      .map((l) => l.trim())
      .filter((l) => /\.(ts|tsx)$/.test(l) && !l.endsWith('unreadInputsCopy.test.ts'));

    // ⛔ A pathspec that matches nothing makes this block vacuous — `check-runner-completeness`'s lesson.
    assert(tracked.length > 300, `the sweep sees the app tree (${tracked.length} files)`);

    /**
     * ⛔ **THE NORMALISER IS ASSERTED ON A FIXTURE, NOT INFERRED FROM THE TREE PASSING.**
     * [class-1 re-audit `R12`/`R14`]
     *
     * The sweep below can only ever say *"no card in the tree says this today"* — it is silent on whether
     * the detector could still SEE the sentence if one did. Both spellings that defeated it were measured
     * green over a card that rendered the phrase: the wrapped one (`C1-9`) and the concatenated one
     * (`R12`). ⚡ **These three rows are the standing guard**: revert either normalisation and this reds
     * immediately, with no plant in production code and no dependence on what the tree happens to contain.
     */
    const WRAPPED_FIXTURE = ['const a = `... incomplete — set it again', '      above.`;'].join('\n');
    const CONCAT_FIXTURE = 'const a = `... incomplete — set it again ` + `above.`;';
    const PLAIN_FIXTURE = 'const a = `... incomplete — set it again above.`;';
    assert(codeLinesOnly(PLAIN_FIXTURE).includes('again above'), 'the detector sees the phrase written plainly');
    assert(
      codeLinesOnly(WRAPPED_FIXTURE).includes('again above'),
      'the detector sees the phrase WRAPPED across a source line (C1-9)',
    );
    assert(
      codeLinesOnly(CONCAT_FIXTURE).includes('again above'),
      'the detector sees the phrase CONCATENATED across two literals (R12)',
    );
    const JSX_SEPARATOR_FIXTURE = "<>{`... incomplete — set it again`}{' '}{`above.`}</>";
    assert(
      codeLinesOnly(JSX_SEPARATOR_FIXTURE).includes('again above'),
      "the detector sees the phrase split by a {' '} JSX separator (N-7)",
    );

    const consumers: string[] = [];
    for (const rel of tracked) {
      const code = codeLinesOnly(readFileSync(join(repoRoot, rel), 'utf8'));
      if (!code.includes('unreadPlanInputs')) continue;
      consumers.push(rel);
      assert(!code.includes('again above'), `${rel}: no refusal points "above" at a card that one tap removes`);
      // ⚠️ A TEST that mentions the prop renders no sentence, so the instruction rule does not apply to
      // it — but the `again above` rule above DOES, deliberately: a spec still asserting the old wording
      // would be a stale pin holding the defect in place, which is `B3-3`'s shape one file over.
      if (/\.test\.tsx?$/.test(rel)) continue;
      if (rel in NO_INSTRUCTION) continue;
      // ⚠️ Either it PRODUCES the clause (it has the store) or it RECEIVES it (`unreadFix`, from the host).
      // Both are honoured, because forcing every presentational card to reach for the store would be a
      // worse shape than the defect — and the host's half is asserted separately below.
      assert(
        code.includes('unreadInputsFix') || code.includes('unreadFix'),
        `${rel}: its refusal instructs, so the clause must come from unreadInputsFix — produced here or passed in as unreadFix`,
      );
    }

    assert(consumers.length >= 5, `every consumer of the refusal is checked (${consumers.length} found)`);

    {
      /**
       * ⛔ **THE HOST'S HALF, and it is where the next omission will be.** A card added to Today with
       * `unreadPlanInputs` and no `unreadFix` renders the empty-string default, so its sentence ends
       * *"…could not be read, so this list is incomplete — ."* — a fix that silently makes the copy worse
       * than the defect it replaced. Every element receiving one must receive the other.
       *
       * ⚠️ Derived by walking backwards from each prop to the element that owns it, so a card added
       * anywhere in the file is covered without being listed.
       */
      const host = codeLinesOnly(readFileSync(join(repoRoot, 'apps/rn/src/app/(tabs)/index.tsx'), 'utf8'));
      const raw = readFileSync(join(repoRoot, 'apps/rn/src/app/(tabs)/index.tsx'), 'utf8');
      let searched = 0;
      let at = raw.indexOf('unreadPlanInputs={');
      while (at !== -1) {
        const before = raw.slice(0, at);
        const open = before.lastIndexOf('<');
        const owner = /^<([A-Za-z][A-Za-z0-9]*)/.exec(raw.slice(open))?.[1] ?? '(unknown)';
        const element = raw.slice(open, raw.indexOf('/>', at));
        searched++;
        assert(
          owner in HOST_NO_CLAUSE || element.includes('unreadFix={'),
          `index.tsx: <${owner}> is handed unreadPlanInputs, so it must be handed unreadFix too — or be named in HOST_NO_CLAUSE`,
        );
        at = raw.indexOf('unreadPlanInputs={', at + 1);
      }
      assert(searched >= 3, `the host sweep found the call sites (${searched})`);
      assert(host.includes('unreadInputsFix'), 'and the host produces the clause from the one producer');
      for (const owner of Object.keys(HOST_NO_CLAUSE)) {
        assert(raw.includes(`<${owner}`), `HOST_NO_CLAUSE names <${owner}>, and it is still on this screen`);
      }
    }
    for (const exempt of Object.keys(NO_INSTRUCTION)) {
      assert(consumers.includes(exempt), `NO_INSTRUCTION names ${exempt}, and the sweep still finds it — no stale exemption`);
    }
  }

  console.log(`\n✅ unread-inputs copy: ${passed} assertions passed\n`);
}

runUnreadInputsCopyTests();
