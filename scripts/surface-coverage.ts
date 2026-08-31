/**
 * [D69] — WHICH FILES ON A SURFACE HAS A PASS ACTUALLY SWEPT?
 *
 * ⛔ **ONE INSTRUMENT, ONE ENTRY PER SURFACE — generalised at S1.2 (2026-08-26).** It was
 * `s0-surface-coverage.ts` and served S0 alone, which left **[D69] with no lookup on S1–S4**: *"first
 * look"* would have been the auditor's own claim on every remaining surface, which is precisely the state
 * S0.12a was built to end. ⚠️ **And the alternative was not neutral.** Running S1 with no table means no
 * exemptions — safe in the sense that no finding is wrongly excused, and unusable in practice: a surface
 * only two prior rounds have partly read produces first-look findings on nearly every pass, so the
 * two-clean-pass count would restart forever on **coverage** rather than on churn, which is the one thing
 * [D69] exists to separate.
 *
 * ⛔ **EXCLUSIONS ARE ROUTED, NEVER JUST DROPPED.** A file excluded from one surface must name the surface
 * that owns it. The S0 docstring's rule — *an inclusion list fails silent, an exclusion list fails safe* —
 * holds only while the surfaces genuinely partition the tree; an exclusion with no destination is a file
 * that quietly belongs to nobody.
 *
 * ⚡ **The measurement that forced this** [S0.12a · pass 4]: **all four S0 passes declared their surface as
 * `scripts/check-*.ts`** — and **9 of the 21 had never been swept by any of them.** Three consecutive
 * *"swept and found clean"* lists were therefore over-claiming, and pass 4 found **5 majors** in that
 * unswept remainder while pass 3, sweeping already-swept ground, found **0**. ⛔ **The variable was not the
 * tree. It was where the auditor pointed.**
 *
 * ⛔ **[D69] says a first-look finding does not restart the convergence count. This file is what makes
 * "first look" a LOOKUP rather than the auditor's own claim.** Without it the exemption is self-declared,
 * and a pass could widen its reading indefinitely and never fail.
 *
 * ⚠️ **COVERAGE IS TRACKED PER FILE, NEVER PER SUBJECT — and that distinction IS the finding.** *"The
 * freshness instrument"* read as covered for three passes: pass 1 filed a major on it, pass 2 fixed it,
 * pass 3 carried it forward clean. **`check-gate-freshness.ts` itself had never been opened by anyone**,
 * and pass 4's first major was in it. Subjects are elastic; a path is not.
 *
 * ## ⛔ THE SPLIT THAT MAKES THIS TRUSTWORTHY: enumeration is MECHANICAL, the claim is EXPLICIT
 *
 * The first cut of this file **parsed the pass reports** and inferred coverage from whether a filename
 * appeared in a `## Swept and found clean` section. **It was scrapped after being measured**: pass 3
 * demonstrably computed `check-glossary`'s full hit set, but writes it as *"glossary 30→0"* — so the scan
 * reported it never swept. Widening the match is **spelling enumeration, which has failed six times in
 * this cluster** (month arithmetic 5, `importStore` 4, markdown code 4, …).
 *
 * ⚠️ **A prose heuristic dressed as a measurement is the exact defect this whole surface exists to stop.**
 * So:
 *   • **The FILE LIST is walked from disk** — mechanical, cannot undercount, and this is the half that
 *     actually protects [D69]: a new surface file cannot appear without this gate demanding it be classified.
 *   • **The COVERAGE CLAIM is written down** in `surface-coverage.<key>.json`, one entry per file, asserted by
 *     whoever read the report. Judgement is recorded as judgement rather than inferred from prose.
 *
 * ⛔ **A MENTION IS NOT AN EXAMINATION**, and this was measured while building the inventory:
 * `write-gate-status.ts` appears in pass 1 inside a **grep hit-list**, as one of seven paths referencing
 * `check-audit-closure`. Nobody had read it, and pass 4's largest finding was in it. **`unknown` and
 * `never` both count as UNSWEPT** — the safe direction, because the cost of wrongly calling a file swept
 * is a finding silently exempted from convergence.
 *
 * ## Scope is an exclusion list
 *
 * Same reason `gateSources.ts` gives: an inclusion list fails **silent** — a surface file nobody thought
 * to enumerate is simply absent. An exclusion list fails **safe**.
 *
 * Usage: npm run lint:s0-coverage · npm run lint:s1-coverage   ·   `--report` prints the full table
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

import { lf } from './lib/anchor';

const REPO_ROOT = join(import.meta.dirname, '..');
const REPORT = process.argv.includes('--report');

interface Surface {
  /** what the gate calls itself in its own output, so a failure names the surface a human would re-run */
  gate: string;
  /** one line for the inventory doc's title */
  title: string;
  /** directories walked recursively, and single files, both repo-relative with forward slashes */
  roots: string[];
  claims: string;
  inventory: string;
  /**
   * ⛔ S1.5.4 [M9-C] — AN EXCLUSION MUST NAME THE SURFACE THAT OWNS THE FILE, and now the gate checks it.
   * Returning a bare `true` used to be legal, and the docblock's rule (*"every `true` must name the
   * surface"*) was enforced by nothing: 13 files were routed to a surface key — `s4` — that does not
   * exist and never has. Return `null` to keep the file, or a routing whose `to` is a `KNOWN_SURFACES`
   * member. A typo now reds instead of silently deleting a file from every surface.
   */
  excluded: (rel: string) => Routing | null;
}

/** Where an excluded file goes instead. `why` is printed by `--report`, so routing stays reviewable. */
interface Routing {
  to: string;
  why: string;
}

/**
 * ⛔ S1.5.4 [M9-C] — every surface key a routing may name, INCLUDING ones not yet built.
 *
 * Validating against `SURFACES` alone would be wrong: the whole point of routing is to say *"not mine,
 * S3 owns it"* before S3 exists. Validating against nothing is what let 13 files be routed to a key that
 * appears in no plan, no file and no gate. This list is the seam: adding a surface means adding it here,
 * and a routing to anything else is a typo the gate reds on.
 */
const KNOWN_SURFACES = new Set([
  's0', 's1', 's2', 's3', 's4',
  // ⚠️ `none` is a real answer and is deliberately spelled, not left implicit: a tsconfig or a fixture is
  // on NO surface because it is not code anyone audits, which is a different statement from "somebody
  // else's". Spelling it keeps "I decided" distinguishable from "I forgot".
  'none',
]);

/**
 * ⛔ S1.5.4 [M9-B] — the claim vocabulary, validated.
 *
 * `unswept` was computed as `every(v => v === 'never' || v === 'unknown' || v === 'partial')`, so **any
 * string that is not exactly one of those three counted as SWEPT** — `"Never"`, `"nevr"`, `" never"`,
 * `"partial (diff only)"` all silently convert an unread file into a read one, in the gate's count *and*
 * in the inventory the next auditor reads. There was no allow-list check anywhere in the file.
 *
 * ⚠️ The docstring's vocabulary had already drifted from the data's: `g4` was documented as a value and
 * appears in neither claims file. Documented and enforced are now the same list, by construction.
 */
const UNSWEPT_CLAIMS = ['never', 'unknown', 'partial'] as const;
const SWEPT_CLAIMS = ['p1', 'p2', 'p3', 'p4', 'g4', 'r10', 'r17', 's1p1', 's1p2', 's1p3', 's1p4', 's1p5', 's1p6'] as const;
const VALID_CLAIMS = new Set<string>([...UNSWEPT_CLAIMS, ...SWEPT_CLAIMS]);

const SOURCE_EXT = new Set(['.ts', '.tsx', '.mjs', '.cjs', '.json', '.sh']);

/**
 * ⚠️ Shared by every surface: `tsconfig.json` configures a surface rather than sitting on it, fixtures are
 * DATA, and this gate's own claim files are its record rather than its subject.
 */
const commonExcluded = (rel: string): Routing | null =>
  // ⚠️ S1.9.5 — the same statement `tsconfig.json` already carried, for the rest of the manifest family.
  // A lockfile is generated and a manifest declares the tree; neither is a subject an auditor reads.
  /(^|\/)(package\.json|package-lock\.json|tsconfig(\.[a-z]+)?\.json)$/.test(rel)
    ? { to: 'none', why: 'configures a surface rather than sitting on one' }
    : rel.endsWith('tsconfig.json')
    ? { to: 'none', why: 'configures a surface rather than sitting on one' }
    : rel.includes('__fixtures__')
      ? { to: 'none', why: 'fixtures are DATA, not surface' }
      : /^scripts\/surface-coverage\.[a-z0-9]+\.json$/.test(rel)
        ? { to: 'none', why: "this gate's own record, not its subject" }
        : null;

/**
 * ⛔ **S4 owns discovery, the coach marks and the demo director; they live in `components/plan/` for
 * layout reasons and are not money.** Each name here is a routing statement, not a dismissal.
 */
const S4_OWNED = new Set([
  'CoachMarkLayer.tsx', 'TutorialCoach.tsx', 'TutorialFence.tsx', 'TutorialInviteCard.tsx',
  'TutorialOverlay.tsx', 'tutorialStage.ts',
  'DemoAutoEntry.tsx', 'DemoCaption.tsx', 'DemoDirector.tsx', 'DemoDock.tsx',
  'ExampleCanvasMarker.tsx',
]);

const SURFACES: Record<string, Surface> = {
  s0: {
    gate: 's0-coverage',
    title: 'S0 surface inventory — which pass actually swept which file',
    /**
     * ⛔ [D73] — **THE TEST RUNNERS ARE INSTRUMENTS, AND THEY WERE ON NO SURFACE.** `packages/core/testing`
     * (20 files) holds `runRegressionTests` and every suite it drives; `apps/rn/src/testing` (3) holds the
     * app + scenario runners. S0 already owns `apps/rn/src/data/migrationAudit` for exactly this reason —
     * an instrument is audited by the surface that audits instruments.
     *
     * ⚠️ **This admits files to S0 AFTER it converged, and that is the honest consequence rather than an
     * argument against it.** [D70] closed S0 on *instruments-sound*, not on a pass count, and a runner
     * nobody has ever read is precisely an unaudited instrument. The unswept count rises; that is the
     * measurement, the same way M9's root-widening took S1 from 72 to 137.
     *
     * ⛔ **`apps/rn/tests/shots` IS A ROOT HERE BECAUSE S1 ROUTES IT HERE.** [D73, found by S1.7's own
     * after-scan] Routing to a surface that EXISTS but does not WALK the directory removes the file from
     * the sending surface and adds it to nothing — the silent hole this whole decision exists to close,
     * re-created while closing it. ⚠️ Routing to `s2`/`s3`/`s4` is a different case and is fine: those
     * surfaces are not built, so the routing records an owner for when they are. **The trap is a routing
     * to a LIVE surface whose roots do not cover the file.** Same shape as `migrationAudit`, which S1
     * routes here and which is a root here for exactly this reason.
     */
    roots: [
      'scripts',
      'apps/rn/src/data/migrationAudit',
      'packages/core/testing',
      'apps/rn/src/testing',
      'apps/rn/tests/shots',
      /**
       * ⛔ **S1.9.5 — THE APP-LEVEL INSTRUMENTS, found by the completeness gate on its first run.**
       * `apps/rn/scripts` builds the web bundle's CanvasKit, and the three Playwright configs decide the
       * viewport, the web server and the projects **every e2e assertion in the repo runs under**. Auditor
       * A read `playwright.config.ts` in pass 2 and it was on no surface, so the sweep could not be
       * recorded. ⚠️ A root may be a FILE — the walker already distinguishes the two.
       */
      'apps/rn/scripts',
      // ⚠️ `preflight-native-lane.ts` already ASSERTS on `app.json` (the icon, its size, its lack of an
      // alpha channel), so it is an audited subject that was on no surface — found by the gate, not by a
      // reading. `eslint.config.mjs` is the lint instrument itself.
      'apps/rn/app.json',
      'apps/rn/eslint.config.mjs',
      'apps/rn/playwright.config.ts',
      'apps/rn/playwright.embed.config.ts',
      'apps/rn/playwright.shots.config.ts',
    ],
    claims: 'scripts/surface-coverage.s0.json',
    inventory: 'docs/audits/2026-08-25-p6.8.9.7.11.17-reverification/S0-SURFACE-INVENTORY.md',
    // ⚠️ `.tsx` joined SOURCE_EXT when this became multi-surface; `scripts/` has none, so S0 is unchanged.
    excluded: commonExcluded,
  },
  s1: {
    gate: 's1-coverage',
    title: 'S1 surface inventory — money · goals · plan cards',
    /**
     * ⛔ S1.5.4 [M9-A] — WHOLE DIRECTORIES. This was four directories **plus ten hand-named files**, and
     * for `store/`, `data/` and `(tabs)/` that made the scope an ENUMERATION — the failure mode this
     * file's own docblock warns about, occurring inside it. Measured at the time: `store/` was **6 of
     * 88**, `data/` **3 of 21**, `(tabs)/` **1 of 4**, and the two sharpest omissions were both money —
     * `(tabs)/index.tsx`, the 1,087-line screen that composes every plan card and where blocker [B5] is
     * wired, was on **no surface at all**, and `planSelectors.test.ts` was absent while its source was
     * present, an asymmetry no other pair in the list had.
     *
     * ⚡ And the file claimed the opposite to a human in two places: *"the FILE LIST is walked from disk
     * — mechanical, cannot undercount."* The walk is mechanical **within a root**; the roots were hand
     * written, so the list under-counted exactly as far as they did, and nothing could notice because a
     * file on no root is never compared against anything.
     *
     * ⛔ **Do not re-add individual files here.** Widen a root and route what is not money below.
     */
    roots: [
      /**
       * ⛔ **S1.9.5 — `apps/rn/src` ENTIRE, and this is the FIFTH time the roots have been widened.**
       * 🎯 2026-08-26: *"We need to be sure that our audits are touching all surfaces."*
       *
       * ⚡ **Measured: 184 files were under NO root and on NO surface** — not routed to a future owner,
       * simply invisible, so no auditor has ever been pointed at them and nothing recorded who should be.
       * `apps/rn/src/utils` (18) holds `format.ts`, which **every dollar figure in the app passes
       * through**; `premium` (10) is the monetisation surface; `storage` (9) is persistence; `hooks` (15),
       * `liveActivity` (7), `widget` (6) and 73 files under `components/` outside the two named
       * subdirectories were all unreachable by any pass.
       *
       * ⛔ **The previous four corrections each added a NARROWER root and each was followed by another
       * gap**: M9 (files hand-named inside `roots`), [D73] (the whole test tree), S1.9.5's first cut
       * (`packages/core`), and this. **The variable was never the tree — it is where you point.** So the
       * root is the source tree, and `invisibleFiles` below makes a sixth recurrence impossible rather
       * than merely unlikely.
       *
       * ⚠️ This surface therefore owns anything without a clear other owner, which is what the routing
       * docblock below already states: *an exclusion list's whole virtue is that a file nobody thought
       * about is still counted.*
       */
      'apps/rn/src',
      /**
       * ⛔ **S1.9.5 — A ROOT, AND THE FOURTH TIME THIS CORRECTION HAS BEEN MADE.** Pass 2 found
       * `packages/core/timeline` on no surface — the forecast module its own sharpest major (D2-1) is
       * ABOUT — because the roots named `engine` and `guardian` and stopped there.
       *
       * ⚡ **Measured before acting on it, and the plan's "one line" was wrong by a factor of eighteen:**
       * 18 of the 21 directories under `packages/core` were on no surface, **102 files**, and `debt`
       * alone is 53. `cashflow`, `forecast`, `income`, `insights`, `obligations`, `payCycle`, `recovery`
       * and `history` are money by any reading.
       *
       * ⛔ **Adding `packages/core/timeline` would have been the fifth hand-named directory**, which is
       * M9's defect verbatim — and M9's own remedy was stated as *a root, not a file list*. Every
       * previous correction here came from widening a root while the pre-correction number looked
       * healthier; the honest number is the one that goes up.
       */
      'packages/core',
      /**
       * ⛔ [D73] — **THE GUARDS WERE ON NO SURFACE.** `grep -c "tests/e2e"` returned **0** against both
       * claims files: co-located `*.test.ts` under `src/` were on-surface, and the whole of
       * `apps/rn/tests/` was not. So the standing rule — *every surface audit re-verifies the previous
       * surfaces' guards* — pointed auditors at files they were never given.
       *
       * ⛔ **`lint:finding-guards` is not a substitute and cannot be made into one.** It proves a token
       * still sits on a non-comment line; it cannot prove the assertion behind it can still fail.
       * ⚡ Measured in S1.5.5's own range: an assertion that a card contained `$400` passed **with the
       * defect present**, because the defective card printed `$400` from a neighbouring section. A plant
       * caught it. The registry would have counted that finding guarded indefinitely.
       *
       * ⚠️ **A root, not a file list** — the whole point of M9. Everything under here lands on the money
       * surface unless `excluded` names a different owner with certainty.
       */
      'apps/rn/tests',
    ],
    claims: 'scripts/surface-coverage.s1.json',
    inventory: 'docs/audits/2026-08-26-s1-money/S1-SURFACE-INVENTORY.md',
    /**
     * ⚠️ `migrations.ts` is on BOTH S1 and S3 and that is deliberate, not an oversight: blocker #1's root
     * is there and its false screen is `money.tsx`, and the standing rule is that **a cross-surface finding
     * is fixed once and re-verified by BOTH owners.** A file on one surface only is a seam nobody reads.
     */
    /**
     * ⛔ **ROUTING, NOT DISMISSAL — and it fails SAFE.** Anything whose owner is not unambiguous stays on
     * the money surface as `never`, because an exclusion list's whole virtue is that a file nobody
     * thought about is still counted. Widening the roots admitted 127 files; only those with a clear,
     * already-precedented owner are routed out.
     */
    excluded: (rel) => {
      const common = commonExcluded(rel);
      if (common) return common;
      const base = rel.split('/').pop() ?? '';
      if (S4_OWNED.has(base)) return { to: 's4', why: 'discovery / tutorial / demo, in components/plan for layout reasons' };
      if (/components\/plan\/AppStoreCta(\.web)?\.tsx$/.test(rel)) return { to: 's4', why: 'store listing CTA, not money' };
      /**
       * ⛔ **S1.9.5 — `packages/core` IS A ROOT NOW, so its non-money neighbours need owners.** ⚠️ Only
       * three move, and each is the same statement a source routing above already makes. Everything else
       * — `debt`, `cashflow`, `forecast`, `income`, `insights`, `obligations`, `payCycle`, `recovery`,
       * `recurrence`, `history`, `storage`, `timeline`, `types`, `utils`, `constants`, `copy` — **stays
       * on the money surface**, because an exclusion list only fails safe for as long as its entries are
       * certainties and *when the owner is arguable the file stays*.
       *
       * ⚠️ `packages/core/testing` routes to a LIVE surface that already WALKS it as a root of its own —
       * the [D73] trap is routing to a live surface whose roots do not cover the file, and this is
       * checked, not assumed. `scan` / `imports` route to `s3`, which is not built yet; that records an
       * owner for when it is, which the comment on the test-tree routings below already establishes.
       */
      if (rel.startsWith('apps/rn/src/testing/')) return { to: 's0', why: 'the app + scenario runners — an S0 root in its own right' };
      if (rel.startsWith('packages/core/testing/')) return { to: 's0', why: 'the test runners — an S0 root in its own right' };
      if (rel.startsWith('packages/core/scan/')) return { to: 's3', why: 'receipt / statement scanning — the import surface' };
      if (rel.startsWith('packages/core/imports/')) return { to: 's3', why: 'the import parsers — the import surface' };
      // S0 already walks this directory as a root of its own — a file on two surfaces needs a reason,
      // and "the migration audit is an instrument" is S0's reason, not S1's.
      if (rel.startsWith('apps/rn/src/data/migrationAudit/')) return { to: 's0', why: 'an S0 root in its own right' };
      // The import/restore half: file pickers, backup encoders, the v1.6 bridge.
      if (rel.startsWith('apps/rn/src/data/legacyBridge/')) return { to: 's3', why: 'the v1.6 import bridge' };
      if (/^apps\/rn\/src\/data\/(backup|backupFile|cloudBackup|cloudBackupMessages|csvImportFile|detectBackupFormat|formatBackupTime|readBackup)\b/.test(rel))
        return { to: 's3', why: 'backup / restore / CSV import' };
      // Discovery: the tutorial, the demo, the sandbox that drives them, and coach marks.
      // ⚠️ Deliberately NARROW. `greeting`, `onboardingFinish` and `paywallLead` were routed here on a
      // first pass and put back: a greeting renders on Today, onboarding decides the opening plan, and
      // the paywall lead is monetisation, so none has an owner obvious enough to justify removing it from
      // the money surface. **When the owner is arguable the file stays**, because an exclusion list only
      // fails safe for as long as its entries are certainties.
      if (/^apps\/rn\/src\/store\/(tutorial|demo|sandbox|coachMark)/.test(rel))
        return { to: 's4', why: 'tutorial / demo / sandbox / coach marks — the discovery surface' };

      /**
       * ⛔ [D73] — THE TEST TREE'S ROUTINGS. **Only certainties move.** The specs below name a surface
       * that already owns their subject in the source routings above, so each is the same statement made
       * one directory over. ⚠️ Everything not matched here — including every visual / a11y / layout spec
       * (`a11y-axe`, `blur-glass`, `ipad-layouts`, `sheet-polish`, `route-smoke`) — **stays on the money
       * surface**, because visual/a11y is not one of S0–S4 and this list only fails safe for as long as
       * its entries are certainties. A spec routed to a surface that does not exist would be a worse
       * error than a spec counted as money.
       */
      if (rel.startsWith('apps/rn/tests/shots/'))
        return { to: 's0', why: 'screenshot recipes — instruments that produce the audit rounds\' own evidence' };
      if (rel.startsWith('apps/rn/tests/embed/'))
        return { to: 's4', why: 'the marketing-embed harness — same owner as the AppStoreCta routing above' };
      if (/^apps\/rn\/tests\/e2e\/(backup|csv-import|data-recovery|delete-all-data|scan)\.spec\.ts$/.test(rel))
        return { to: 's3', why: 'backup / restore / CSV import / scan — the import surface' };
      if (/^apps\/rn\/tests\/e2e\/(coach-marks|coach-mark-neighbour|tutorial-invite|demo-containment|probe-mark-ipad-rail|probe-mark-route-push)\.spec\.ts$/.test(rel))
        return { to: 's4', why: 'tutorial / demo / coach marks — the discovery surface' };
      if (/^apps\/rn\/tests\/e2e\/date-field\.spec\.ts$/.test(rel))
        return { to: 's2', why: 'the date control — the dates surface' };
      return null;
    },
  },
};

/**
 * ⛔ **THE COMPLETENESS GATE — NO SOURCE FILE IS INVISIBLE TO EVERY SURFACE.**
 * [S1.9.5 · 🎯 2026-08-26: *"We need to be sure that our audits are touching all surfaces."*]
 *
 * ⚡ **The roots have been wrong FIVE times, and every correction came from noticing one hole by hand:**
 * M9 (files hand-named inside `roots`, 72 → 137) · [D73] (the whole test tree, 137 → 188) · S1.9.5's first
 * cut (`packages/core`, 18 directories where the plan expected one, 188 → 286) · and `apps/rn/src` entire
 * (184 files under no root at all, 286 → 470). Each fix closed an instance. **None closed the class**, and
 * each time the pre-correction number looked healthier.
 *
 * ⛔ **THE FILE LIST COMES FROM `git ls-files`, NOT FROM A WALK.** A gate that enumerates the trees it
 * audits is blind to a tree omitted from the list — the same defect it exists to catch, one level up. A
 * deny-list inverts that but has its own decay, and it showed both failure modes on its first two runs:
 * matching only top-level paths let `apps/rn/node_modules` straight through, and the walk then reported
 * `apps/rn/core`, **a symlink to `packages/core`**, as 21 more invisible directories.
 *
 * ⚡ **Tracked-ness answers all of it with one rule that cannot go stale:** build output, dependencies,
 * generated bundles and symlinks into the repo are not tracked, so none of them can appear here, and a new
 * one cannot quietly widen what is skipped. What remains excluded is a short list of TRACKED trees that
 * are genuinely not audit subjects, each with a reason — and one of those carries an expiry.
 */
const NOT_SOURCE: { dir: string; why: string }[] = [
  { dir: 'docs', why: 'prose — the record, not the subject' },
  { dir: 'assets', why: 'binary assets' },
  { dir: 'public', why: 'static assets' },
  { dir: 'site', why: 'the marketing site' },
  { dir: '.github', why: 'CI workflow config — preflight-native-lane owns it, and asserts on it' },
  { dir: 'ios', why: 'the native shell — the native lane pre-flight owns it' },
  { dir: 'apps/rn/modules', why: 'the native Expo modules — the native lane owns them' },
  /**
   * ⛔ **THE LEGACY NEXT / CAPACITOR SURFACE, WHICH P6.11 DELETES.** Excluded because it is scheduled for
   * removal, not because anyone audited it. ⚠️ **The exclusion carries its own expiry**: when the directory
   * is gone this gate reds, so the deletion cannot leave a permission standing behind it — the same
   * self-ratcheting shape `MAX_EXEMPT` uses in `check-committed-secrets.ts`.
   */
  { dir: 'app', why: 'legacy Next surface — deleted at P6.11' },
  { dir: 'components', why: 'legacy Next surface — deleted at P6.11' },
  { dir: 'lib', why: 'legacy Next surface — deleted at P6.11' },
  { dir: 'tests', why: 'legacy Next surface — deleted at P6.11' },
];

/** ⛔ Downward-only. Raising it to make a run pass is the defect this gate exists to catch. */
const MAX_INVISIBLE = 0;

function runCompleteness(): never {
  const everyRoot = Object.values(SURFACES).flatMap((sf) => sf.roots);

  let tracked: string[];
  try {
    tracked = execFileSync('git', ['ls-files', '-z'], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
      .split('\0')
      .filter(Boolean);
  } catch {
    // ⛔ Not a soft failure. This gate's whole claim rests on the file list being authoritative, and a
    // guess would report "everything is covered" over a list it never obtained.
    console.error('\n❌ surface-complete: `git ls-files` failed, so the file list is unknown.\n');
    process.exit(1);
  }

  /**
   * ⚠️ A skip naming a directory that no longer exists is a STALE permission — see the legacy note above.
   * Checked first, so a deletion cannot quietly widen what is skipped.
   *
   * ⛔ **ASKED OF GIT, NOT THE FILESYSTEM, and the first cut got that wrong — CI caught it and a local run
   * could not.** `existsSync` is a property of the WORKING COPY: `.claude/` is untracked, so it exists on
   * my machine and not in a fresh checkout, and this gate redded on CI while passing here. ⚡ **The file
   * list above already came from `git ls-files`; taking staleness from the disk mixed two worlds in one
   * instrument** — which is `REVERIFY4-2` exactly (`lint:secrets` took its file list from git and its
   * content from the working tree). **An instrument must take all of its inputs from the same world.**
   */
  const stale = NOT_SOURCE.filter((e) => !tracked.some((f) => f === e.dir || f.startsWith(`${e.dir}/`)));
  if (stale.length) {
    console.error('\n❌ surface-complete: the skip list names director(ies) that no longer exist.\n');
    for (const e of stale) console.error(`  ${e.dir}  — "${e.why}"`);
    console.error(
      '\n  ⛔ Remove the entry. A skip for something that is gone is a standing permission for\n' +
        '  whatever takes the name next.\n',
    );
    process.exit(1);
  }

  const invisible = tracked.filter((rel) => {
    if (!SOURCE_EXT.has(rel.slice(rel.lastIndexOf('.')))) return false;
    if (NOT_SOURCE.some((e) => rel === e.dir || rel.startsWith(`${e.dir}/`))) return false;
    if (commonExcluded(rel)) return false;
    // A file at the repo root configures the repo rather than sitting on a surface.
    if (!rel.includes('/')) return false;
    return !everyRoot.some((r) => rel === r || rel.startsWith(`${r}/`));
  });

  if (invisible.length > MAX_INVISIBLE) {
    console.error(`\n❌ surface-complete: ${invisible.length} tracked source file(s) are under NO surface's roots.\n`);
    for (const f of invisible) console.error(`  INVISIBLE  ${f}`);
    console.error(
      '\n  ⛔ No audit pass can ever be pointed at these, and nothing records who should own them.\n' +
        '  Add a root, or add a routing — but do NOT add the file to a claims list, which would record a\n' +
        `  sweep of a file no surface walks. Cap is ${MAX_INVISIBLE} and only ever goes DOWN.\n`,
    );
    process.exit(1);
  }
  console.log(
    `\n✅ surface-complete: every tracked source file is under a surface root ` +
      `(${tracked.length} tracked, ${NOT_SOURCE.length} trees skipped by name).\n`,
  );
  process.exit(0);
}

if (process.argv.includes('--completeness')) runCompleteness();

const requested = (process.argv.find((a) => a.startsWith('--surface='))?.split('=')[1] ?? 's0').toLowerCase();
const SURFACE = SURFACES[requested];
if (!SURFACE) {
  console.error(`\n❌ surface-coverage: unknown surface "${requested}". Known: ${Object.keys(SURFACES).join(', ')}.\n`);
  process.exit(1);
}
/**
 * ⛔ **S1.9.4 [pass-2 B-1] — THE CLAIMS FILE IS AN INPUT, so `test-gate-plants` can hand this gate a
 * defect of its own class.** Two of this file's three registry entries (`S1P1-M9-VOCAB`, `D69-INVENTORY`)
 * were pinned by an identifier that survives the un-fix, so both read green with the check defeated.
 * ⚠️ A flag, matching `--surface=` beside it; the npm scripts pass nothing, so CI reads the real claims.
 */
const CLAIMS_FILE = join(REPO_ROOT, process.argv.find((a) => a.startsWith('--claims='))?.split('=')[1] ?? SURFACE.claims);
const INVENTORY = join(REPO_ROOT, SURFACE.inventory);
const ROOTS = SURFACE.roots;
const excluded = SURFACE.excluded;

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') walk(p, out);
    } else if (SOURCE_EXT.has(extname(p))) {
      out.push(relative(REPO_ROOT, p).split(sep).join('/'));
    }
  }
}

const surface: string[] = [];
for (const r of ROOTS) {
  const abs = join(REPO_ROOT, r);
  let isDir: boolean;
  try {
    isDir = statSync(abs).isDirectory();
  } catch {
    // ⛔ A root that does not exist is a CONFIGURATION error, not an empty surface. Skipping it silently
    // is how a whole directory drops off a surface and every finding in it reads as first-look.
    console.error(`\n❌ ${SURFACE.gate}: root "${r}" does not exist. Fix SURFACES in scripts/surface-coverage.ts.\n`);
    process.exit(1);
  }
  if (isDir) walk(abs, surface);
  else surface.push(r);
}
// ⛔ S1.5.4 [M9-C] — every routing is validated as it is applied, so a mis-typed owner reds instead of
// silently removing a file from every surface there is.
const routed = new Map<string, Routing>();
/**
 * ⛔ **S1.9.4 [pass-2 B-1] — THE ROUTING CHECK PROVES ITSELF, because nothing else can.**
 *
 * `S1P1-M9-ROUTING` was pinned by the identifier `KNOWN_SURFACES`, and the un-fix — `if (false &&
 * !KNOWN_SURFACES.has(r.to))` — leaves that identifier exactly where it is. ⚠️ **No token-based guard
 * survives that class.** And unlike the vocabulary and inventory checks, this one reads a PREDICATE in
 * this file rather than a file on disk, so `test-gate-plants` has nothing to hand it either.
 *
 * ⛔ **THE FIRST CUT OF THIS SELF-CHECK WAS THE DEFECT IT WAS CLOSING, and the plant caught it.** It
 * asserted that `routeIsKnown('__no_such_surface__')` is false — which proves the PREDICATE and says
 * nothing about the call. Measured: with `if (false && !routeIsKnown(r.to))` planted at the call site,
 * `lint:s1-coverage` was **still green**. *A tested helper is not a used helper*, written into the fix for
 * a finding whose sharpest instance is that exact shape.
 *
 * ⚡ So the refusal lives in a FUNCTION, and the self-check runs that function over a synthetic file whose
 * route names a surface that does not exist. Any edit that stops the body refusing — a `false &&`, a
 * dropped `!`, a deleted line — stops the self-check refusing too, because it is the same body.
 */
function collectBadRoutes(files: readonly string[], route: (f: string) => Routing | null): string[] {
  const bad: string[] = [];
  for (const f of files) {
    const r = route(f);
    if (r && !KNOWN_SURFACES.has(r.to)) bad.push(`${f}  → "${r.to}" is not a known surface (${r.why})`);
  }
  return bad;
}

// ⚠️ Runs on EVERY invocation, before anything is reported, and exits rather than printing — an
// instrument that reports is not an instrument that gates.
if (collectBadRoutes(['__self_check__'], () => ({ to: '__no_such_surface__', why: 'the routing self-check' })).length !== 1) {
  console.error(
    `\n❌ ${SURFACE.gate}: the routing check did not refuse a surface that does not exist, so it is not checking.\n` +
      '  ⛔ Every exclusion would route anywhere, and the coverage number would describe nothing.\n',
  );
  process.exit(1);
}

let badRoutes: string[] = [];
const files = [...new Set(surface)]
  .filter((f) => {
    const r = excluded(f);
    if (!r) return true;
    // ⛔ Judged by `collectBadRoutes` below — the same body the self-check above exercises. An inline
    // `if` here is what the un-fix neutered with the identifier still in place.
    routed.set(f, r);
    return false;
  })
  .sort();

// ⛔ S1.9.4 — the routings the walk collected, judged by the function the self-check above proved.
badRoutes = collectBadRoutes([...routed.keys()], (f) => routed.get(f) ?? null);

if (badRoutes.length) {
  console.error(`\n❌ ${SURFACE.gate}: ${badRoutes.length} exclusion(s) route to a surface that does not exist.\n`);
  for (const b of badRoutes) console.error(`  ${b}`);
  console.error(
    `\n  ⛔ An exclusion is a ROUTING STATEMENT. Naming a surface nobody maintains removes the file from\n` +
      `  every surface at once, which is the silent failure an exclusion list exists to avoid.\n` +
      `  Known surfaces: ${[...KNOWN_SURFACES].join(', ')}.\n`,
  );
  process.exit(1);
}

/**
 * The recorded claim per file. Values are the pass that examined it at the blocker/major bar:
 *   `p1`–`p4` — an S0 re-verification pass · `g4` — pass 4's guard inventory
 *   `r10`,`r17` — the earlier `.11.10` / `.11.17` rounds, real coverage that predates the surface passes
 *               and so is recorded distinctly
 *   `partial` — a pass opened the file but read only part of it
 *   `never`   — no pass has examined it · `unknown` — nobody has established which
 *
 * ⛔ **`never`, `unknown` AND `partial` are all UNSWEPT for [D69]'s purposes**, and `partial` is why this
 * value exists at all. `.11.17`'s money auditor reviewed nine plan cards **as a diff** — *"token-only
 * changes, no behaviour"* — and `store.ts` only at its *"goal / paycheck / repairs seams."* Recording
 * either as swept would repeat the exact error S0.12a was built to end: ⚡ *"swept clean" is a claim about
 * a SUBJECT; coverage is a property of a FILE.* A finding in the unread half of a partly-read file is a
 * first look, so `partial` records the truth and still behaves as unswept.
 */
type Claim = string[];
let claims: Record<string, Claim>;
try {
  claims = JSON.parse(readFileSync(CLAIMS_FILE, 'utf8')) as Record<string, Claim>;
} catch {
  console.error(`\n❌ ${SURFACE.gate}: ${relative(REPO_ROOT, CLAIMS_FILE)} is missing or unparseable.\n`);
  process.exit(1);
}

// ⛔ S1.5.4 [M9-B] — the vocabulary is checked BEFORE anything is counted. A value outside the allow-list
// used to fall through `every(...)` as SWEPT, so a single typo silently converted an unread file into a
// read one — in the count and in the generated inventory the next auditor works from.
const badClaims: string[] = [];
for (const [f, c] of Object.entries(claims)) {
  if (!Array.isArray(c)) { badClaims.push(`${f}  → not an array`); continue; }
  for (const v of c) if (!VALID_CLAIMS.has(v)) badClaims.push(`${f}  → ${JSON.stringify(v)}`);
}
if (badClaims.length) {
  console.error(`\n❌ ${SURFACE.gate}: ${badClaims.length} claim value(s) outside the vocabulary.\n`);
  for (const b of badClaims) console.error(`  ${b}`);
  console.error(
    `\n  ⛔ An unrecognised value used to read as SWEPT, so "nevr" or " never" exempted a file from [D69]\n` +
      `  silently. Unswept: ${UNSWEPT_CLAIMS.join(' · ')}. Swept: ${SWEPT_CLAIMS.join(' · ')}.\n`,
  );
  process.exit(1);
}

const missing = files.filter((f) => !(f in claims));
const stale = Object.keys(claims).filter((f) => !files.includes(f));
const unswept = files.filter((f) => {
  const c = claims[f] ?? ['unknown'];
  return c.length === 0 || c.every((v) => (UNSWEPT_CLAIMS as readonly string[]).includes(v));
});

if (REPORT) {
  for (const f of files) console.log(`  ${(claims[f] ?? ['unknown']).join(' · ').padEnd(18)} ${f}`);
  /**
   * ⛔ **S1.9.7 [pass-2 A#7] — THE ROUTINGS, which nothing printed.** `routed` was built and read only for
   * `badRoutes`, so *"which surface owns this file, and why"* was answerable only by reading the predicate.
   * ⚡ No instrument was blinded — the `KNOWN_SURFACES` check is the one that matters and it runs — but the
   * files this surface hands to another were invisible to a reader of its own report, and after S1.9.5 that
   * is a much larger set than it was when the finding was written.
   */
  const byTarget = new Map<string, string[]>();
  for (const [f, r] of routed) {
    if (!byTarget.has(r.to)) byTarget.set(r.to, []);
    byTarget.get(r.to)!.push(`${f}  (${r.why})`);
  }
  for (const to of [...byTarget.keys()].sort()) {
    console.log(`
  → routed to ${to} (${byTarget.get(to)!.length}):`);
    for (const line of byTarget.get(to)!.sort()) console.log(`      ${line}`);
  }
}

// ── the inventory, regenerated so the doc can never disagree with the data ────────────────────────
/**
 * The fingerprint of the DATA this document is generated from, normalised to LF so it is identical on
 * a CRLF checkout and in CI. `audit-route.ts` recomputes it and refuses an inventory whose stamp does
 * not match the claims file it claims to describe — see the stamp's own note below (D5-10).
 */
const claimsHash = createHash('sha256').update(lf(readFileSync(CLAIMS_FILE, 'utf8'))).digest('hex').slice(0, 16);

const lines = [
  `# ${SURFACE.title}`,
  '',
  `> ⛔ **GENERATED — do not hand-edit.** \`npm run lint:${SURFACE.gate}\` writes it from`,
  `> \`${SURFACE.claims}\`. [D69] needs *"first look"* to be a lookup rather than an`,
  "> auditor's claim; this is the lookup.",
  '>',
  '> ⚠️ **The file list is walked from disk; the coverage claim is written down by whoever read the**',
  '> **report.** An earlier cut inferred coverage by parsing the reports and was scrapped after being',
  '> measured wrong — see the docstring in `scripts/surface-coverage.ts`.',
  '',
  `**${files.length} files on the ${requested.toUpperCase()} surface · ${files.length - unswept.length} swept · ${unswept.length} unswept.**`,
  '',
  '`p1`–`p4` an S0 pass · `g4` the guard inventory · `r10` / `r17` an earlier round · `partial` opened but part-read · `never` / `unknown` / `partial` all UNSWEPT.',
  '',
  '| file | swept by |',
  '|---|---|',
  ...files.map((f) => {
    const c = claims[f] ?? ['unknown'];
    const un = unswept.includes(f);
    return `| \`${f}\` | ${un ? `⛔ **${c.join(' · ')}**` : c.join(' · ')} |`;
  }),
  '',
  '## ⛔ Unswept — a finding here is FIRST-LOOK under [D69]',
  '',
  ...(unswept.length ? unswept.map((f) => `- \`${f}\``) : ['*(none)*']),
  '',
  /**
   * ⛔ **S1.12.5.2 [pass-5 D5-10] — THE STAMP, SO A CONSUMER CAN TELL CURRENT FROM STALE.**
   *
   * `audit-route.ts` used to validate this document against **its own stated totals** — an internal
   * consistency check, which a wrong-but-self-consistent inventory passes perfectly. Moving the write
   * below the refusal (see below) stops a REJECTED run from publishing one, but it leaves the other
   * half open: the file on disk is then **stale**, and nothing could distinguish stale from current.
   *
   * ⚠️ **Hashed on the CLAIMS FILE, not on the git sha.** A sha stamp changes every commit, so the
   * document would be rewritten on every run and `D5-6`'s dirty tree would come straight back. This
   * changes exactly when the data it describes changes, which is the property a consumer needs.
   */
  `<!-- claims-sha256: ${claimsHash} -->`,
  '',
];

/**
 * ⛔ **S1.12.5.2 [pass-5 D5-10] — THE REFUSAL COMES FIRST NOW.**
 *
 * The write used to sit ABOVE this block, so a run that **rejected** the tree still published its
 * inventory. Measured by lane D: delete one entry from the claims file, and `lint:s1-coverage` exits 1
 * while having already written a document that moves the file into the Unswept list — then
 * `audit-route --check` reads it at **exit 0** and routes that file as `first-look`, which **[D69]
 * exempts from the convergence count.** ⚡ A gate whose rejected output can quietly make convergence
 * EASIER to declare is worse than no gate.
 */
if (missing.length || stale.length) {
  console.error(`\n❌ ${SURFACE.gate}: the recorded claims do not describe the ${requested.toUpperCase()} surface.\n`);
  // Every entry, not a sample — an omitted line here is a file whose coverage nobody has decided.
  for (const f of missing) console.error(`  UNCLASSIFIED  ${f}  — new on the surface; record who swept it, or "never"`);
  for (const f of stale) console.error(`  STALE         ${f}  — recorded but no longer on the surface`);
  console.error(
    `\n  ⛔ [D69] exempts a finding from the convergence count when the file is unswept. That decision\n` +
      `  reads this table, so an unclassified file makes the exemption unverifiable in both directions.\n` +
      `  Edit ${relative(REPO_ROOT, CLAIMS_FILE)}.\n`,
  );
  process.exit(1);
}

/**
 * ⛔ **S1.12.5.2 [pass-5 D5-6] — WRITE ONLY IF IT CHANGED, COMPARED IN LF ON BOTH SIDES.**
 *
 * ⚡ The write was unconditional, and this file is committed **CRLF** while the generator emits **LF**.
 * So a fully green `npm run lint:rn` ended with `git status` reporting `M` and `git diff` reporting
 * **nothing** — every run, on every Windows checkout. Two consequences, both measured: the two commands
 * a session uses to ask *"did I leave something behind?"* disagreed, which is exactly the camouflage a
 * **left-behind plant** needs; and the habitual cure for unexplained dirt is `git checkout -- .`, this
 * repo's recorded way of throwing an uncommitted fix away with the noise.
 *
 * ⚠️ **CI could never see it** — CI checks out LF, so the write was a byte no-op there. That is
 * `anchor.ts`'s own documented shape running backwards: **dirty where it is run, invisible where it is
 * checked.** ⛔ Not fixed by adding these files to `.gitattributes` as `-text`: that makes the committed
 * bytes machine-dependent, which is the class `lint:line-endings` exists to refuse.
 */
const nextInventory = `${lines.join('\n')}\n`;
const prevInventory = existsSync(INVENTORY) ? readFileSync(INVENTORY, 'utf8') : null;
if (prevInventory === null || lf(prevInventory) !== lf(nextInventory)) {
  writeFileSync(INVENTORY, nextInventory, 'utf8');
}

console.log(`✅ ${SURFACE.gate}: ${files.length} surface files classified · ${unswept.length} unswept.`);
// ⚠️ Printed on the GREEN path deliberately. The unswept list is the backlog [D69] exempts findings
// against, and a number nobody sees is a number nobody acts on.
for (const f of unswept) console.log(`     unswept: ${f}`);
