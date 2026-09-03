/**
 * [R4] [D31] — THE SANDBOX-LEAK GUARD.
 *
 * A demo or walkthrough points a whole subtree at a sandbox store. Every component inside it must read
 * AND write through that context (`useAppStore` / `useActiveStore`). A component that reaches the
 * `appStore` singleton instead reads scripted money and mutates the user's REAL plan — silently.
 *
 * ⛔ **That shipped.** A user edited an expense inside the demo from TestFlight and the write landed on
 * their own plan; Sentry found it, four containment specs and a docstring warning did not. The site table
 * that item started from listed four offenders and the real class had six — `LivingExpenseSheet` and
 * `LogPaymentSheet` were both missed, because the list came from one grep. **This repo has now measured
 * an audit finding's site list short on six consecutive items. Budget the enumeration, not the list.**
 *
 * `realWriteGuard` makes a leak HARMLESS at runtime (the write is refused before it lands). This makes it
 * IMPOSSIBLE to add one silently, which is the different and complementary job: a refused write is still
 * a broken control the user tapped, and the refusal only surfaces if someone is reading Sentry.
 *
 * So this is an ALLOW-LIST, not a count — the same discipline as `check-destructive-writes.ts`, for the
 * same reason. A count tells you the number changed; an allow-list tells you WHICH file appeared, which
 * is the question a reviewer actually has. Reaching the singleton is not automatically wrong; arriving
 * without a stated reason is.
 *
 * Usage: npm run lint:sandbox   ·   runs inside `lint:rn` → `validate:release:rn`
 */
import { lineMap } from './lib/logicalLines';
import { stripCommentsOnly } from './lib/stripCode';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const ROOT = join(REPO_ROOT, 'apps', 'rn', 'src');

/**
 * Every file sanctioned to reach the `appStore` singleton, with the reason it may.
 *
 * ⚠️ The reasons fall into exactly four shapes. If a new entry fits none of them, it is a leak:
 *  1. **infrastructure** — it IS the store, or it wires persistence/sync to it.
 *  2. **seeds a sandbox FROM the real plan** — the read is the point.
 *  3. **unreachable during a bounded run** — More is fenced (`more-button`), onboarding precedes any
 *     plan, and [D18] makes every demo exit terminal (session ends BEFORE the destination renders).
 *  4. **a declared background write** — wrapped in `allowRealStoreWrite`, because it is the app's own
 *     work landing and must not be refused.
 */
const ALLOWED: Record<string, string> = {
  // ── 1. infrastructure ────────────────────────────────────────────────────────────────────────────
  // ⚠️ `store/appStore.ts` is NOT listed: it DECLARES the singleton rather than importing it, so the
  // walk skips it. Listing it read fine and was wrong — the staleness check caught it on the first run.
  'apps/rn/src/store/StoreContext.tsx': 'the context default, and the backstop that watches the singleton',
  'apps/rn/src/store/persistence.ts': 'hydrate + autosave — the persistence layer owns the real store by definition',
  'apps/rn/src/liveActivity/liveActivitySync.ts': 'subscribes only; a sandbox is never handed to a sync seam',
  'apps/rn/src/widget/widgetSync.ts': 'subscribes only; a sandbox is never handed to a sync seam',
  'apps/rn/src/analytics/funnel.ts': "reads the REAL user's analytics opt-out — a demo does not have its own consent",
  'apps/rn/src/components/DataResetScreen.tsx':
    'renders ABOVE the StoreProvider, in place of the navigator, when the launch could not read the saved plan (P6.8.7c.2) — no demo can be mounted at that point, and the recovery it offers is meaningless against anything but the real store',

  // ── 2. seeds a sandbox from the real plan ────────────────────────────────────────────────────────
  'apps/rn/src/store/sandboxStore.ts': "carries the real theme + display name into the sandbox, so a demo looks like the user's app",
  'apps/rn/src/store/tutorialSession.ts': "seeds the walkthrough from the user's own numbers — the read IS the feature",
  'apps/rn/src/app/tutorial.tsx': 'the walkthrough launcher, same seeding read',

  // ── 3. unreachable during a bounded run ──────────────────────────────────────────────────────────
  'apps/rn/src/app/more.tsx': 'More is withheld while a bounded run is on screen (`more-button` disables + aria-hides it)',
  'apps/rn/src/components/more/BackupSheets.tsx': 'lives under More, which is fenced',
  'apps/rn/src/components/more/LiveActivityQA.tsx': 'lives under More, which is fenced',
  // ⚠️ [S1.13.7.11 · pass-6 B2-2] — these four share the premise that expired for `paywall.tsx` above.
  // The FIRST clause still holds on its own (onboarding runs before any plan exists, so there is no real
  // plan to corrupt); the exit-sequence clause is the one that decayed, and whether an explore run can
  // reach onboarding by any route OTHER than `exitDemo` is UNMEASURED — filed rather than assumed.
  'apps/rn/src/app/onboarding.tsx': 'runs before any plan exists — the load-bearing half. ⚠️ The "a demo exit tears the session down" half is [D18]-era and unverified for the explore demo; see B2-2',
  'apps/rn/src/components/onboarding/CompletionStep.tsx': 'onboarding, as above',
  'apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx': 'onboarding, as above',
  'apps/rn/src/components/onboarding/PaycheckStep.tsx': 'onboarding, as above',
  'apps/rn/src/app/paywall.tsx':
    // ⛔ [S1.13.7.11 · pass-6 B2-2] — this entry used to rest on [D18]'s terminal-exit rule, and that
    // premise expired: `exitDemo(` has 2 call sites against 6 for '/paywall', 4 of them ordinary pushes.
    // The file is still correctly exempt, for a DIFFERENT reason — which is the whole finding, because an
    // allow-list keyed on a path with a prose reason can detect a changed path and never a changed world.
    '[D9] the SANDBOX RUNS PREMIUM for every audience (demoRun.ts:149, tutorialSession.ts:144-146), so no paywall entry point renders inside a bounded run and `setSubscriptionPlan` is unreachable under a sandbox provider. ⚠️ This exemption is coupled to [D9], NOT to the exit sequence — narrow [D9] and re-audit this entry',
  'apps/rn/src/components/plan/ExampleCanvasMarker.tsx':
    'deliberately asks about the REAL user (does a plan exist?) while rendering inside the sandbox — the whole point of the marker',
  'apps/rn/src/components/plan/TutorialCoach.tsx':
    "writes only the walkthrough's own resume position, which is on `realWriteGuard`'s prefs allowlist and must outlive the sandbox",
  'apps/rn/src/store/coachMarks.ts':
    "records what the REAL user has been shown; both bounded runs suppress marks for their duration (`addSuppressor`)",

  // ── 4. declared background writes (`allowRealStoreWrite`) ────────────────────────────────────────
  'apps/rn/src/app/_layout.tsx':
    'the app root: lifecycle, the queued-intent drain and the iCloud restore offer — every real-store write here is declared',
  'apps/rn/src/appIntents/drainPendingActions.ts': 'a queued "Payday landed" intent; its callers declare it',
  'apps/rn/src/hooks/use-notification-sync.ts': 'stamps that a risk push fired; declared',
  'apps/rn/src/premium/premiumSync.ts': "applies RevenueCat's entitlement whatever is on screen; declared",
};

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p)) && !/\.test\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

/**
 * The IMPORT, not the usage. A file cannot touch the singleton without naming it here, so one regex over
 * one line per file is exact — where matching every `appStore.` would have to model aliasing, and would
 * red on `useAppStore` (which is the CORRECT hook) unless the negative lookbehind is right every time.
 */
/**
 * ⛔ **BOTH SPELLINGS OF THE IMPORT, and `D1-8` NAMED BOTH WHILE ONLY ONE WAS FIXED.**
 *
 * The finding reads *"a Prettier-wrapped `import {…}` — **or a namespace import** — leaks the real store
 * past the guard"*. The first fix closed the wrapped half and left the namespace half open; the class-1
 * re-audit measured it (`R9`): `import * as appStoreModule from '@/store/appStore'` exited 0 with the
 * sanctioned count unchanged at 24. ⚡ **That is class 8's shape — the fix reaching the instance in the
 * example and not the one in the same sentence — committed inside the class that exists to stop it.**
 *
 * ⚠️ `m` is required because the scan flattens rather than joins: `^` must still mean "start of a
 * statement", and a flattened import is one line.
 */
const IMPORT = /^\s*import\s*(?:\{[^}]*\bappStore\b[^}]*\}|\*\s*as\s+\w+)\s*from\s*['"][^'"]*appStore['"]/gm;

const offenders: { file: string; line: number; text: string }[] = [];
const stale: string[] = [];
const seen = new Set<string>();

/** The declaration site. It has no import to find, so it is skipped rather than exempted. */
const DEFINITION = 'apps/rn/src/store/appStore.ts';

for (const file of walk(ROOT)) {
  const rel = relative(REPO_ROOT, file).split(sep).join('/');
  if (rel === DEFINITION) continue;
  const source = readFileSync(file, 'utf8');
  /**
   * ⛔ **COMMENTS ONLY — this gate matches the import PATH, which is a string literal.** Blanking string
   * contents turned `from '@/store/appStore'` into `from '                  '` and reported all 24
   * allow-list entries stale. Caught by `lint:rn` on the first run after the change.
   *
   * ⛔ **LOGICAL LINES, NOT PHYSICAL ONES** — pass-7 `D1-8`. `IMPORT` is anchored with `^` and was tested
   * against one physical line, so a Prettier-wrapped `import {\n  appStore,\n} from '…/appStore'` — the
   * spelling Prettier produces the moment the specifier list grows — **leaked the real store past this
   * guard entirely**. Several files DISCUSS the singleton in prose explaining a fixed defect, and a guard
   * that reds on its own postmortem is noise, so comments are still blanked first.
   */
  const code = stripCommentsOnly(source);
  const lines = lineMap(code);
  for (const m of code.matchAll(IMPORT)) {
    seen.add(rel);
    if (ALLOWED[rel]) continue;
    offenders.push({ file: rel, line: lines.lineAt(m.index), text: m[0].trim().slice(0, 160) });
  }
}

// An allow-list entry whose file no longer imports the singleton is worse than useless: it silently
// re-admits the file the day someone adds the import back. `waiting-lists-decay-one-way` — nobody
// deletes the row that was waiting on something once the thing is done.
for (const rel of Object.keys(ALLOWED)) if (!seen.has(rel)) stale.push(rel);

if (offenders.length === 0 && stale.length === 0) {
  console.log(`✅ lint:sandbox — ${seen.size} sanctioned appStore consumers, no unsanctioned ones.`);
  process.exit(0);
}

if (offenders.length > 0) {
  console.error(`\n❌ lint:sandbox — ${offenders.length} unsanctioned reference(s) to the appStore singleton:\n`);
  for (const o of offenders) console.error(`   ${o.file}:${o.line}\n     ${o.text}`);
  console.error(
    '\n   A component rendered inside a demo/walkthrough must use `useAppStore` to read and `useActiveStore()`' +
      '\n   to write. If this file genuinely needs the real store, add it to ALLOWED in' +
      '\n   scripts/check-sandbox-writes.ts with the reason — and if the reason is "a background write",' +
      '\n   wrap the call in `allowRealStoreWrite` or the veto will DROP it.\n',
  );
}
if (stale.length > 0) {
  console.error(`\n❌ lint:sandbox — ${stale.length} STALE allow-list entr(y/ies); the file no longer imports appStore:\n`);
  for (const s of stale) console.error(`   ${s}`);
  console.error('\n   Delete the line. A stale exemption silently re-admits the file the day the import comes back.\n');
}
process.exit(1);
