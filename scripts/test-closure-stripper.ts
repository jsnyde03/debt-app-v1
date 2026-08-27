/**
 * [S1.10.6.5.8.5 · GAP-4 + GAP-5] — **THE CLOSURE STRIPPER, PINNED PER SPELLING.**
 *
 * ⛔ **What is actually exposed, measured rather than taken from the finding.** GAP-4 states three
 * exposures and **only the first survives**:
 *
 * ① ⚠️ **LIVE.** Reverting `stripMarkdownCode` to its first cut (` ``` ` fences plus single-backtick spans
 *    only) mints **zero** tokens against today's corpus and `lint:closure` stays **green, exit 0**.
 *    Three of the four spelling rules can be deleted and nothing in the repo says a word. That is what
 *    this file pins.
 * ② ⛔ **REFUTED.** *"Removing `stripMarkdownCode` entirely mints 4 fabricated ids and `lint:closure`
 *    stays green, because the caps are upper bounds."* The caps are **not** upper bounds any more —
 *    `M8`'s strict-equality sweep made both `!==`. Measured: removing the function now prints
 *    `53 … (cap 55)` and **exits 1**.
 * ③ ⛔ **REFUTED, same cause.** *"Each fabricated token buys one unit of headroom."* Under `!==` a
 *    fabricated token moves the count off its cap in either direction and reds.
 *
 * ⚡ **Third GAP row killed by `M8`'s strict-equality sweep** (`GAP-6` was the first). A remedy written
 * against `b03e0d3` is a hypothesis about a tree that has moved.
 *
 * ⚠️ **GAP-4's fixture list names `<code>`, `<pre>` and HTML comments; the stripper handles NONE of them
 * and that is deliberate** — its docstring enumerates exactly four spellings. Measured across all three
 * closure SOURCES: **zero** occurrences of any HTML code form. So they are not a live exposure, and
 * rather than widen the stripper speculatively, the last assertion here **reds if one ever appears** —
 * which is the moment the four-spelling scope stops being sufficient.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CLOSURE_REMEDIATION_LINE, stripMarkdownCode } from './lib/stripMarkdown';

const REPO_ROOT = join(import.meta.dirname, '..');
const SOURCES = [
  'docs/DEBT_ELEVATION_PLAN.md',
  'docs/DEBT_ELEVATION_LOG.md',
  'docs/audits/2026-08-17-v1.7-audit-gate/findings/L9-refutations.md',
];

const CLOSES = /\[closes:\s*([^\]]+)\]/g;
const idsIn = (md: string) => new Set([...md.matchAll(CLOSES)].flatMap((m) => m[1].trim().split(/[\s,·]+/)));

let passed = 0;
const failures: string[] = [];
const check = (cond: boolean, label: string) => { if (cond) passed++; else failures.push(label); };

/**
 * Every spelling, in one document. ⛔ The four PLAIN forms must survive; the six QUOTED forms must be
 * blanked. Built as an array so backtick runs are unambiguous in the source.
 */
const FIXTURE = [
  'A plain-text record: [closes: PLAIN-LINE]',
  '',
  '- a bullet: [closes: PLAIN-BULLET]',
  '| a | table | [closes: PLAIN-TABLE] |',
  '> a blockquote: [closes: PLAIN-QUOTE]',
  '',
  '```',
  'inside a backtick fence: [closes: QUOTED-FENCE-TICK]',
  '```',
  '',
  '~~~',
  'inside a tilde fence: [closes: QUOTED-FENCE-TILDE]',
  '~~~',
  '',
  '    an indented block: [closes: QUOTED-INDENT]',
  '',
  'inline one backtick: `[closes: QUOTED-SPAN-1]`',
  'inline two backticks: ``[closes: QUOTED-SPAN-2]``',
  'inline three backticks: ```[closes: QUOTED-SPAN-3]```',
].join('\n');

const PLAIN = ['PLAIN-LINE', 'PLAIN-BULLET', 'PLAIN-TABLE', 'PLAIN-QUOTE'];
const QUOTED = [
  'QUOTED-FENCE-TICK', 'QUOTED-FENCE-TILDE', 'QUOTED-INDENT',
  'QUOTED-SPAN-1', 'QUOTED-SPAN-2', 'QUOTED-SPAN-3',
];

// ── Non-vacuity control ────────────────────────────────────────────────────────────────────────────
// ⛔ Every token must be present BEFORE stripping. Without this the "quoted forms are blanked"
// assertions all pass on a fixture that simply never contained them.
const before = idsIn(FIXTURE);
for (const id of [...PLAIN, ...QUOTED]) {
  check(before.has(id), `control: ${id} is present in the raw fixture (else nothing below is measured)`);
}

const after = idsIn(stripMarkdownCode(FIXTURE));

// ── The property, per spelling ─────────────────────────────────────────────────────────────────────
for (const id of PLAIN) {
  check(after.has(id), `PLAIN form survives the strip: ${id} — a real closure record must still count`);
}
for (const id of QUOTED) {
  check(
    !after.has(id),
    `QUOTED form is blanked: ${id} — documenting the token must not MINT a closure (this is M12's shape, ` +
      'and it has recurred five times)',
  );
}
check(after.size === PLAIN.length, `exactly the ${PLAIN.length} plain forms survive (got ${after.size})`);

// ── GAP-5: the gate's OWN remediation line ─────────────────────────────────────────────────────────
// ⛔ Uses the exported constant, so this reads the string the gate actually PRINTS. A local copy would
// keep passing while the real line was un-indented — two producers of one fact.
check(
  CLOSURE_REMEDIATION_LINE.startsWith('    '),
  'the remediation line is indented into a code block (at two spaces, pasting the gate error into the ' +
    'log MINTS a closure — the instrument closing findings with its own advice text)',
);
check(
  idsIn(stripMarkdownCode(`\n  Record it where the closure IS:\n${CLOSURE_REMEDIATION_LINE}   (e.g. X-1)\n`)).size === 0,
  'the gate\'s own remediation output is blanked by the stripper when pasted into a closure source',
);

// ── The scope guard ────────────────────────────────────────────────────────────────────────────────
// ⚠️ The stripper handles four spellings and no HTML. That is safe only while the sources contain no
// HTML code forms — asserted, not assumed, so the day one appears this reds instead of minting silently.
for (const rel of SOURCES) {
  // ⛔ **STRIP FIRST, and the first version of this did not — it red on its own write-up.** Documenting
  // the HTML forms inside inline backtick spans put them in the corpus, and a raw `.includes` cannot tell
  // a MENTION from a USE. That is M12's shape for the sixth time, and it arrived in the assertion written
  // to guard against M12's shape. The question is only whether an HTML code form survives the strip —
  // i.e. sits somewhere a `[closes: …]` token could actually mint from.
  const md = stripMarkdownCode(readFileSync(join(REPO_ROOT, rel), 'utf8'));
  const html = ['<code>', '<pre>', '<!--'].filter((f) => md.includes(f));
  check(
    html.length === 0,
    `${rel} contains ${html.join(' and ')} — stripMarkdownCode handles NO HTML code form, so a ` +
      '[closes: …] token inside one would mint a closure. Widen the stripper deliberately, with a case here',
  );
}

if (failures.length > 0) {
  console.error(`\n❌ closure stripper: ${failures.length} failure(s).\n`);
  for (const f of failures) console.error(`  • ${f}\n`);
  console.error('  A closure that was never examined is a finding signed off by nobody.\n');
  process.exit(1);
}

console.log(`✅ closure stripper: ${PLAIN.length} plain forms count, ${QUOTED.length} quoted forms do not (${passed} assertions).`);
