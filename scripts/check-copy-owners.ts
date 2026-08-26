import { stripCommentsOnly } from './lib/stripCode';
import { readFileSync, existsSync } from 'fs';
import { join, relative } from 'path';

/**
 * P6.8.9.7.7 — **a finding closed by pointing a site at a copy CONSTANT stays pointed at it.**
 *
 * ⛔ **THE CLASS THIS EXISTS FOR.** Several P6.8 findings were closed the same way: a screen stopped
 * writing its own words and started reading the constant that owns the claim. The verification pass at
 * P6.8.9.2 then found four of them `CLOSED-UNPINNED` for one shared reason — **the fix is invisible to
 * every copy gate in the repo.** `lint:copy` and `lint:glossary` read string LITERALS, and the whole point
 * of these fixes is that the literal is gone. So the closure could be undone by deleting one line and no
 * suite would notice.
 *
 * ⚡ This asserts the pairing itself: *this file* must still reference *this owner*. It cannot check that
 * the words are right — the constant's own definition and `lint:glossary` do that — only that the site is
 * still asking the owner rather than answering for itself.
 *
 * ⚠️ **Deliberately NOT an e2e.** These live on onboarding steps that nothing in the suite can reach without
 * inventing a drive-through-onboarding path, and a fragile new locator chain is a worse instrument than a
 * structural one. ⛔ **A4/M1-9 belongs here TOO, even though `earlyjourney.spec.ts` covers it**: that e2e
 * asserts the rendered words and this asserts the wiring, and they fail in different directions — an e2e
 * cannot tell a constant from a literal that happens to match. (P6.8.9.7.10 · A-6.)
 *
 * ⛔ **COMMENTS ARE STRIPPED BEFORE THE MATCH, AND THAT IS THE DIFFERENCE BETWEEN A GATE AND A GREEN LIGHT.**
 * The first cut ran `src.includes(owner)` over the raw file — and all three sites carry long docblocks
 * *about* `PRIVACY_CLAIM`. It passed only by the accident that none of them happened to write the dotted
 * form. Deleting the JSX and leaving `// was PRIVACY_CLAIM.atEntry` behind kept it green: the gate would
 * have been satisfied by the epitaph of the thing it was guarding.
 */

const REPO_ROOT = join(import.meta.dirname, '..');

interface Pairing {
  /** The finding this closure belongs to — so a failure names what would silently re-open. */
  id: string;
  file: string;
  /** The owner expression the site must still read. */
  owner: string;
  why: string;
}

const PAIRINGS: readonly Pairing[] = [
  {
    id: 'C6 / T1',
    file: 'apps/rn/src/components/onboarding/PaycheckStep.tsx',
    owner: 'PRIVACY_CLAIM.atEntry',
    why: 'the trust line at the FIRST field that asks for money — Apple\'s "promise at the moment of data use"',
  },
  {
    id: 'C6 / T1',
    file: 'apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx',
    owner: 'PRIVACY_CLAIM.atEntry',
    why: 'the same promise on the other money-asking step; C6 shipped on BOTH and a check on one would miss it',
  },
  {
    id: 'A4 / M1-9',
    file: 'apps/rn/src/components/onboarding/WelcomeStep.tsx',
    owner: 'PRIVACY_CLAIM.headline',
    why: 'bullet 3, which used to promise a PREMIUM feature to a user who has not chosen a tier',
  },
  {
    // ⛔ The site's OWN comment says *"Both halves are the CONSTANT, never a literal"* (`WelcomeStep.tsx:28`)
    // and the gate pinned one of them. Half a pairing is exactly the shape this whole check exists to
    // refuse. (P6.8.9.7.10 · A-6.)
    id: 'A4 / M1-9',
    file: 'apps/rn/src/components/onboarding/WelcomeStep.tsx',
    owner: 'PRIVACY_CLAIM.noSelling',
    why: 'the second half of bullet 3 — the "never sold more debt" promise, on the same line as the headline',
  },
];

/**
 * ⛔ **DELEGATES TO THE SHARED SCANNER.** [S0.8b · REVERIFY-2 finding 2] The pair this replaces used a
 * `[^:]` lookbehind that spares `https://` and nothing else — a `//` inside any other string still
 * truncated the line. ⚠️ `stripCommentsOnly`, because this gate reads copy INSIDE the strings.
 */
const stripComments = (src: string): string => stripCommentsOnly(src);

const failures: string[] = [];

for (const p of PAIRINGS) {
  const abs = join(REPO_ROOT, p.file);
  if (!existsSync(abs)) {
    failures.push(`[${p.id}] ${p.file} does not exist — the closure's site is gone entirely`);
    continue;
  }
  const src = stripComments(readFileSync(abs, 'utf8'));
  if (!src.includes(p.owner)) {
    failures.push(
      `[${p.id}] ${relative(REPO_ROOT, abs).replace(/\\/g, '/')} no longer reads \`${p.owner}\` — ${p.why}`,
    );
  }
}

if (failures.length > 0) {
  console.error(`\n❌ copy owners: ${failures.length} closure(s) no longer wired to their owner\n`);
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  console.error('\nA finding closed by reading a constant is re-opened by writing words again.');
  console.error('If the site genuinely moved, update the pairing here and say where it went.\n');
  process.exit(1);
}

console.log(`✅ copy owners: ${PAIRINGS.length} closure(s) still read the constant that owns their claim.`);
