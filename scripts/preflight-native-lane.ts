/**
 * 4.1.9b.8 — LOCAL PRE-FLIGHT for the native lane's WORKFLOW GRAPH.
 *
 * ⭐ THE LOOP THIS BELONGS TO, stated in the 2026-08-17 session close: *plant a defect before trusting a
 * guard, and read the ARTIFACT rather than reasoning about the test.* The XCUITest pre-flight went
 * 16 → 37 checks in one session and **every addition was written against a defect a CI cycle had already
 * paid for.* This is the same instrument one layer out: the lane costs ~20 minutes and its characteristic
 * failure is *a step that quietly did not run*, which is indistinguishable from a step that found nothing.
 *
 * 4.1.9b turned one job into three and moved the build recipe into a composite action. That is a large
 * structural edit to the only thing standing between this project and a device pass, and almost every way
 * it can be wrong is STATIC — a missing `shell:`, a save path the restore does not expect, a tier that
 * quietly rebuilds, an artifact name collision that throws away a whole run's evidence. Every check below
 * is one of those, and each names the defect it exists for.
 *
 * ⚠️ What it CANNOT tell you: whether the runner accepts any of it. Composite actions, cache hits and
 * `simctl` all need macOS. This narrows the question the dispatch has to answer; it does not replace it.
 *
 * Usage: npm run lint:lane   (also in `lint:rn`, so `validate:release:rn` carries it)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const REPO = join(import.meta.dirname, '..');
const WORKFLOWS = join(REPO, '.github/workflows');
const ACTIONS = join(REPO, '.github/actions');
const BUILD_ACTION = 'rn-ios-sim-build';
const PRODUCTS_ACTION = 'rn-ios-sim-products';
const FLOW_DIR = join(REPO, 'apps/rn/.maestro');

const problems: string[] = [];
const ok: string[] = [];
const check = (label: string, cond: boolean, detail = '') => {
  (cond ? ok : problems).push(cond ? label : `${label}${detail ? ` — ${detail}` : ''}`);
};

const readIfExists = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const steps = (job: any): any[] => (Array.isArray(job?.steps) ? job.steps : []);
const stepText = (s: any) => `${s?.name ?? ''} ${s?.uses ?? ''} ${s?.run ?? ''}`;

// ══ the composite actions ═════════════════════════════════════════════════════════════════════════
const actionFiles: Record<string, { raw: string; doc: any }> = {};
for (const name of [BUILD_ACTION, PRODUCTS_ACTION]) {
  const p = join(ACTIONS, name, 'action.yml');
  const raw = readIfExists(p);
  check(`${name}/action.yml exists`, !!raw, 'the workflows reference it by path; a missing file fails the run immediately');
  if (!raw) continue;
  let doc: any;
  try {
    doc = parse(raw);
  } catch (e) {
    problems.push(`${name}/action.yml does not parse — ${(e as Error).message}`);
    continue;
  }
  actionFiles[name] = { raw, doc };
  check(`${name} is a composite action`, doc?.runs?.using === 'composite', `runs.using = ${doc?.runs?.using}`);

  for (const [i, s] of (doc?.runs?.steps ?? []).entries()) {
    if (typeof s?.run !== 'string') continue;
    const id = s.name ?? `step ${i}`;
    // ⛔ A composite `run:` step with no `shell:` is a HARD ERROR at runtime, and it is the single
    // easiest thing to lose when lifting steps out of a workflow (where `shell` is optional).
    check(`${name} · "${id}" declares a shell`, typeof s.shell === 'string', 'a composite run step without `shell:` fails the run');
    // ⛔ AND THE TRAP THAT IS SPECIFIC TO THIS EXTRACTION. The steps came from a job carrying
    // `defaults.run.working-directory: apps/rn`. **A composite action does NOT inherit that** — it runs
    // at the workspace root. So `npx tsc --noEmit` would typecheck the wrong project and `pod install`
    // would run where there is no Podfile, both of them plausibly and wrongly.
    check(
      `${name} · "${id}" declares a working-directory`,
      typeof s['working-directory'] === 'string',
      'a composite action does NOT inherit the caller\'s defaults.run.working-directory — it runs at the workspace root',
    );
  }
}

// ══ the .app cache, rules ① and ② ═════════════════════════════════════════════════════════════════
const build = actionFiles[BUILD_ACTION];
if (build) {
  const keyStep = (build.doc.runs.steps ?? []).find((s: any) => s?.id === 'appkey');
  check('the build action computes a cache key', !!keyStep, 'no step with id `appkey`');
  const keyRun: string = keyStep?.run ?? '';

  // ⛔ RULE ①, AND IT IS THE ONE THIS REFACTOR PUT AT RISK. The build flags used to live in
  // `native-e2e.yml`, which the key hashed. They live in the action now, so the action must be hashed —
  // otherwise a change to a compiler flag silently reuses a binary built with the old one.
  check(
    'the cache key hashes the build action itself (rule ①)',
    keyRun.includes(`.github/actions/${BUILD_ACTION}/action.yml`),
    'the build flags live in this file now; without it in the hash, changing one reuses the old binary',
  );
  // ⭐ And the other half of 4.1.9b: the workflow must NOT be hashed any more, or a Maestro flow-list
  // edit keeps busting the binary — the 771s-per-YAML-edit cost this item exists to remove.
  check(
    'the cache key does NOT hash a workflow file',
    !/\.github\/workflows\//.test(keyRun),
    'hashing a workflow means every flow-list edit recompiles the app — the cost 4.1.9b removes',
  );
  check(
    'the cache key is namespaced per lane',
    keyRun.includes('inputs.cache-namespace'),
    'the e2e and capture lanes build DIFFERENT binaries from identical files (EXPO_PUBLIC_CAPTURE_DEMO) — a shared key crosses them',
  );

  const cacheSteps = (build.doc.runs.steps ?? []).filter((s: any) => String(s?.uses ?? '').startsWith('actions/cache'));
  const restore = cacheSteps.find((s: any) => String(s.uses).includes('cache/restore'));
  const save = cacheSteps.find((s: any) => String(s.uses).includes('cache/save'));
  check('the .app cache has a restore and a save step', !!restore && !!save);
  // ⛔ RULE ②. A partial-key fallback is exactly how a stale binary gets in. Exact or nothing.
  check(
    'the .app restore has NO restore-keys (rule ②)',
    !!restore && restore.with?.['restore-keys'] === undefined,
    'a partial-key fallback is how a stale binary gets installed and tested',
  );
  // ⚡ A save that omits a path the restore lists is a cache that hits and comes back INCOMPLETE — and
  // 4.1.9b's whole probe fix depends on the XCUITest products being in BOTH lists.
  const norm = (v: unknown) =>
    String(v ?? '').split('\n').map((l) => l.trim()).filter(Boolean).sort().join('\n');
  check(
    'the restore and save path lists are identical',
    norm(restore?.with?.path) === norm(save?.with?.path),
    'a save that omits a restored path yields a cache that hits and comes back missing something',
  );
  check(
    'the cached set includes the XCUITest products',
    norm(save?.with?.path).includes('.xctestrun'),
    'without them a cache HIT leaves the probe with nothing to run — which looks exactly like a probe that found nothing',
  );
  // ⛔ `Products/**` would drag every pod static library and its include/ symlink tree — GB-scale.
  // ⚠️ [.3 after-scan] THE CACHE PATH LIST AND THE TAR ARE TWO ENUMERATIONS OF ONE SET, which is the
  // shape that has cost this repo four defects. Nothing structural can merge them — one is an
  // `actions/cache` input and the other is a `tar` argument list — so the next best thing is to assert
  // they name the same products. A tar that forgets the Runner app yields a cache hit whose probe has
  // nothing to run, which is the exact failure .3 exists to remove.
  const packRun = String(
    steps((parse(readIfExists(join(WORKFLOWS, 'native-e2e.yml'))) as any)?.jobs?.build)
      .find((s: any) => /Pack the products/i.test(String(s?.name ?? '')))?.run ?? '',
  );
  for (const product of ['.xctestrun', '-Runner.app', 'DebtPlannerRN.app']) {
    check(
      `the tar packs \`${product}\`, like the cache`,
      packRun.includes(product),
      'the cache list and the tar are two enumerations of one set; a product in only one of them is a tier that silently cannot test it',
    );
  }

  check(
    'the cached paths are enumerated, not a Products glob',
    !/Products\/\*\*/.test(norm(save?.with?.path)),
    'Products/** also holds every pod .a and its include/ symlink tree — it costs more to move than the build costs to run',
  );
}

// ══ the workflows ═════════════════════════════════════════════════════════════════════════════════
const wfRaw = readIfExists(join(WORKFLOWS, 'native-e2e.yml'));
const previewRaw = readIfExists(join(WORKFLOWS, 'app-preview.yml'));
check('native-e2e.yml exists', !!wfRaw);
check('app-preview.yml exists', !!previewRaw);

let wf: any;
try {
  wf = parse(wfRaw);
} catch (e) {
  problems.push(`native-e2e.yml does not parse — ${(e as Error).message}`);
}
let preview: any;
try {
  preview = parse(previewRaw);
} catch (e) {
  problems.push(`app-preview.yml does not parse — ${(e as Error).message}`);
}

// ⛔ THE DUPLICATION THAT DRIFTED FOUR WAYS IN FIVE DAYS. Neither workflow may carry its own copy of
// the compile — that is the entire thesis of 4.1.9b.1.
for (const [label, raw] of [['native-e2e.yml', wfRaw], ['app-preview.yml', previewRaw]] as const) {
  check(
    `${label} uses the shared build action`,
    raw.includes(`./.github/actions/${BUILD_ACTION}`),
    'the recipe is owned in one place now',
  );
  check(
    `${label} carries no xcodebuild recipe of its own`,
    !/xcodebuild\s+\\\s*\n\s*-workspace/.test(raw),
    'a second copy of the compile is how this pair drifted four ways in five days',
  );
}

if (wf?.jobs) {
  const jobs = wf.jobs;
  for (const j of ['build', 'iphone', 'ipad']) {
    check(`native-e2e.yml has a \`${j}\` job`, !!jobs[j]);
  }
  for (const tier of ['iphone', 'ipad']) {
    const needs = jobs[tier]?.needs;
    check(
      `the ${tier} job needs \`build\``,
      needs === 'build' || (Array.isArray(needs) && needs.includes('build')),
      `needs = ${JSON.stringify(needs)}`,
    );
    // ⚠️ A tier that compiles is a tier that has silently undone the split's whole saving.
    check(
      `the ${tier} job compiles nothing`,
      !steps(jobs[tier]).some((s) => /xcodebuild[\s\S]*build-for-testing|xcodebuild\s+\\/.test(String(s?.run ?? ''))),
      'the tiers exist to consume the build job\'s output, not to redo it',
    );
    check(
      `the ${tier} job unpacks the shared products`,
      steps(jobs[tier]).some((s) => String(s?.uses ?? '').includes(PRODUCTS_ACTION)),
      'without it there is no .app to install',
    );
  }

  // ⛔ .7.4c's REQUIREMENT, WRITTEN DOWN AS A CHECK. The probe sat between the two tiers before the
  // split; a split that drops it looks exactly like a probe that found nothing.
  // ⚠️ BOTH TIERS now, since 4.1.7: the iPad copy is what decides §10's three ⌘-key rows, and proving
  // `typeKey` on the iPhone while claiming iPad rows is the "reach is not coverage" error .7.5 caught.
  for (const tier of ['iphone', 'ipad']) {
    const probeStep = steps(jobs[tier]).find((s) => /XCUITest probe/i.test(String(s?.name ?? '')));
    check(
      `the ${tier} job runs the XCUITest probe`,
      !!probeStep,
      'a probe that stops running is indistinguishable from a probe that finds nothing',
    );
    // …and it must survive a red suite. A bare `if:` carries an implicit success(); run 31626109780.
    check(
      `the ${tier} probe still runs after a red suite`,
      String(probeStep?.if ?? '').includes('!cancelled()'),
      'a bare `if:` carries an implicit success(), so a red suite would skip the second independent signal',
    );
  }

  // ⛔ THE LANE'S OLDEST REPEAT DEFECT, NOW A CHECK. `MAESTRO_DRIVER_STARTUP_TIMEOUT` was raised
  // 240 s → 420 s on the iPhone suite after run 31646289268 lost a whole cycle to `iOS driver not ready
  // in time`. The iPad tier kept the old value and paid the identical cost at run 31822453981. The 4.1.1
  // probe lane still held 240 s months later, and 4.1.7's Reduce-Motion step shipped with none at all —
  // caught by an after-scan, not by anything automatic. Four instances of one fix applied piecemeal.
  // ⚡ A driver stall is indistinguishable from a green suite in cost and from a real failure in exit
  // code, so the cost of each instance is a whole cycle. Every step that runs `maestro test` declares the
  // same timeout, or this fails locally in one second.
  const maestroSteps = Object.entries(wf?.jobs ?? {}).flatMap(([job, j]: [string, any]) =>
    steps(j)
      .filter((s) => /maestro test/.test(String(s?.run ?? '')))
      .map((s) => ({ job, name: String(s.name ?? '?'), timeout: s.env?.MAESTRO_DRIVER_STARTUP_TIMEOUT })),
  );
  const timeouts = new Set(maestroSteps.map((s) => String(s.timeout)));
  check(
    'every `maestro test` step declares the same driver-startup timeout',
    maestroSteps.length > 0 && timeouts.size === 1 && !timeouts.has('undefined'),
    maestroSteps.map((s) => `${s.job}/"${s.name}"=${s.timeout ?? 'MISSING'}`).join(', ') +
      ' — a stall costs a whole cycle and reads as a real failure',
  );

  // ⛔ 4.1.7 — EVERYTHING THAT NEEDS AN ONBOARDED APP MUST PRECEDE `09`. Its header states the rule
  // ("runs last and clears state… anything added after this must re-seed") and the XCUITest probe broke
  // it, which is what produced `rendered=false`. This encodes the rule so the next addition cannot.
  const iphoneSteps = steps(jobs.iphone);
  const idxOf = (re: RegExp) => iphoneSteps.findIndex((s) => re.test(String(s?.name ?? '')));
  const terminalIdx = idxOf(/terminal flow/i);
  if (terminalIdx !== -1) {
    for (const [label, re] of [
      ['the XCUITest probe', /XCUITest probe/i],
      ['the Reduce-Motion readout', /Reduce-Motion/i],
    ] as const) {
      const i = idxOf(re);
      check(
        `${label} runs BEFORE the terminal flow (09)`,
        i !== -1 && i < terminalIdx,
        '09 opens `clearState: true`; anything after it meets a fresh install with no onboarded state',
      );
    }
  }

  // ⚡ upload-artifact v4 ERRORS on a duplicate name, and it does so after the work is done — a whole
  // run's evidence lost at the last step. Two jobs uploading `maestro-report` is exactly what the split
  // would have produced by default.
  const artifactNames: string[] = [];
  for (const job of Object.values(jobs) as any[]) {
    for (const s of steps(job)) {
      if (String(s?.uses ?? '').startsWith('actions/upload-artifact') && s?.with?.name) {
        artifactNames.push(String(s.with.name));
      }
    }
  }
  const dupes = artifactNames.filter((n, i) => artifactNames.indexOf(n) !== i);
  check(
    'every upload-artifact name in native-e2e.yml is unique',
    dupes.length === 0,
    `duplicated: ${[...new Set(dupes)].join(', ')} — upload-artifact v4 errors on a collision, after the work is done`,
  );

  // ⛔ THE TAG-PUSH SHAPE. A tag supplies NO inputs, so every condition must be written so that empty
  // means FULL. `inputs.scope == 'full'` is false on a tag and would silently narrow the release smoke.
  for (const bad of ["inputs.scope == 'full'", "inputs.mode == 'suite'", "inputs.device == 'iphone'"]) {
    check(
      `no condition is written as \`${bad}\``,
      !wfRaw.includes(bad),
      'a tag push supplies no inputs, so an equality against the DEFAULT silently disables the step on the release smoke',
    );
  }
}

// ⚠️ A flow renamed on disk and not in the workflow does not fail — Maestro is handed a path that does
// not exist and the suite runs one flow fewer. Two commits did exactly this on 2026-08-10 and neither
// was noticed, because the lane is manual-dispatch only.
const referenced = [...wfRaw.matchAll(/\.maestro\/([\w-]+\.yaml)/g)].map((m) => m[1]);
const onDisk = existsSync(FLOW_DIR) ? new Set(readdirSync(FLOW_DIR)) : new Set<string>();
const missing = [...new Set(referenced)].filter((f) => !onDisk.has(f));
check(
  'every flow the workflow names exists on disk',
  missing.length === 0,
  `${missing.join(', ')} — Maestro runs one flow fewer and says nothing`,
);

// ⛔ THE DEPENDENCY CHAIN, WHICH IS THE REASON THE LIST IS EXPLICIT AT ALL. 01 seeds · 07 clears · 08
// depends on 07 · 10 must precede 09 · 09 is terminal. Run 31598337615 proved a directory argument
// reorders them, and two flows failed on it.
//
// ⚠️ SCOPED TO THE IPHONE STEP'S OWN TEXT. The first version of this check read every `.maestro/*.yaml`
// in the FILE, so the iPad tier's `01` and `05` landed on the end of the list and it reported that flow
// 09 does not run last — against a workflow where it does. A verifier that reads a wider scope than the
// rule it enforces produces exactly this: a confident red on correct code.
//
// ⚠️ READ ACROSS EVERY MAESTRO STEP IN THE JOB, IN STEP ORDER — a tier is no longer one invocation.
// 4.1.7 moved `09` into its own step because it opens `clearState: true` and everything needing an
// onboarded app must precede it. A check that read only "Run Maestro flows" would have declared `09`
// missing and, worse, would have gone quiet about the ordering rule it exists to enforce.
const iphoneList = steps(wf?.jobs?.iphone)
  .filter((s) => /maestro test/.test(String(s?.run ?? '')))
  .flatMap((s) => [...String(s.run).matchAll(/\.maestro\/([\w-]+\.yaml)/g)].map((m) => m[1]))
  .filter((f) => /^\d\d-/.test(f));
const at = (prefix: string) => iphoneList.findIndex((f) => f.startsWith(prefix));
if (iphoneList.length) {
  check('flow 01 runs first (it seeds)', at('01') === 0, `order: ${iphoneList.join(' → ')}`);
  check('flow 07 precedes 08 (07 clears the state 08 needs)', at('07') < at('08'), `order: ${iphoneList.join(' → ')}`);
  check('flow 10 precedes 09', at('10') < at('09'), `order: ${iphoneList.join(' → ')}`);
  check('flow 09 runs last (it is terminal — it clears state)', at('09') === iphoneList.length - 1, `order: ${iphoneList.join(' → ')}`);
}

// ⚠️ Maestro writes the view hierarchy under `maestro-debug/.maestro/…`, a HIDDEN path. upload-artifact
// v4 skips hidden files by default, and this lane once shipped an artifact with none of the evidence it
// exists to produce.
//
// ⭐ THE RULE IS "ANY RECURSIVE GLOB", not "any path mentioning maestro-debug", and widening it is what
// caught a live defect: the 4.1.9b.6 diagnosis bundle uploads `lane-diagnostics/**`, whose contents
// preserve Maestro's `.maestro/tests/…` layout — so it would have shipped without the one file it
// exists for. A single named file (`ios-products.tar`) cannot hide anything and is exempt.
//
// ⚠️ Read from the PARSED steps, not by splitting the raw text on `- name: `. The first version did the
// latter and attributed a step's leading comment block to the PREVIOUS step, reporting a missing flag on
// a step that had one.
for (const [jobName, job] of Object.entries(wf?.jobs ?? {}) as [string, any][]) {
  for (const s of steps(job)) {
    if (!String(s?.uses ?? '').startsWith('actions/upload-artifact')) continue;
    const p = String(s?.with?.path ?? '');
    if (!p.includes('**')) continue;
    check(
      `${jobName} · "${s.name ?? s.with?.name}" sets include-hidden-files`,
      s.with?.['include-hidden-files'] === true,
      'a recursive glob silently drops any dot-prefixed segment — which is where Maestro puts the view hierarchy',
    );
  }
}

// ⛔ Every line in a `path: |` block is a literal PATTERN, not YAML. A `#` line there became a path and
// moved the artifact's common root, gaining an `apps/rn/` segment mid-investigation.
for (const [label, raw] of [['native-e2e.yml', wfRaw], ['app-preview.yml', previewRaw]] as const) {
  const lines = raw.split('\n');
  let inPath = false;
  let indent = 0;
  let offenders: number[] = [];
  for (const [i, line] of lines.entries()) {
    if (/^\s*path:\s*\|/.test(line)) {
      inPath = true;
      indent = line.search(/\S/);
      continue;
    }
    if (!inPath) continue;
    if (line.trim() === '') continue;
    if (line.search(/\S/) <= indent) { inPath = false; continue; }
    if (line.trim().startsWith('#')) offenders.push(i + 1);
  }
  check(
    `${label} has no comment lines inside a \`path: |\` block`,
    offenders.length === 0,
    `lines ${offenders.join(', ')} — every line there is a literal pattern; a \`#\` line becomes a path`,
  );
}

/**
 * ⛔ 4.1.11 — `inputs.*` ARE EMPTY ON EVERY TRIGGER EXCEPT `workflow_dispatch`, AND THIS LANE SHIPPED A
 * JOB THAT FORGOT IT.
 *
 * The iPad tier was gated on `inputs.device == 'ipad' || inputs.device == 'both'`. On a **release tag** —
 * the trigger whose entire job is a gated native smoke before shipping — `inputs.device` is `''`, so it
 * matched neither and **the iPad tier never ran on a tag.** The iPhone tier read the negative
 * (`!= 'ipad'`) and ran anyway, so the run came back green on one tier and looked complete. Adding the
 * nightly would have inherited exactly the same silence.
 *
 * ⚡ THE GENERAL RULE, and it is what makes this a check rather than a fix: **a job gated on an input must
 * state what that input means when there is no input.** `inputs.x || 'default'` does; a bare equality
 * does not, and fails closed — the most expensive direction, because a job that does not run looks
 * exactly like a job that found nothing. That is this lane's signature failure mode, one level up.
 */
/**
 * ⚠️ IT EVALUATES THE CONDITION, IT DOES NOT PATTERN-MATCH IT — and the first version did the latter,
 * reddening correct code within a minute of being written. The iPhone tier's `if` contains two bare
 * `inputs.X ==` comparisons and is still perfectly safe, because they are ORed with `inputs.device !=
 * 'ipad'`, which an empty input satisfies. A checker that flagged the fragments would have demanded a
 * change that fixes nothing.
 *
 * ⚡ 4.1.9b.8 logged this exact shape — *"two of my own checks were wrong first time, both reddening
 * correct code — a verifier whose SCOPE is wider than the rule it enforces"* — and the remedy was the
 * same: read the structure, not the text. So this models GitHub's expression semantics for the operators
 * these conditions actually use. `||` and `&&` return a VALUE (not a boolean), which is what makes
 * `inputs.device || 'both'` work at all, and the model reproduces that rather than approximating it.
 *
 * ⛔ Anything it cannot parse yields `undefined` and the check is SKIPPED WITH A STATED REASON. A checker
 * that silently passed on syntax it did not understand would be the blind gate all over again.
 */
function evalGhExpr(src: string, inputs: Record<string, string>): boolean | undefined {
  const toks = src.match(/'[^']*'|\|\||&&|==|!=|!|\(|\)|[\w.]+/g);
  if (!toks) return undefined;
  let i = 0;
  const truthy = (v: unknown) => v !== '' && v !== false && v !== undefined && v !== null;
  let bad = false;

  const primary = (): unknown => {
    const t = toks[i++];
    if (t === undefined) { bad = true; return undefined; }
    if (t === '!') return !truthy(primary());
    if (t === '(') { const v = orExpr(); if (toks[i] !== ')') bad = true; else i++; return v; }
    if (t.startsWith("'")) return t.slice(1, -1);
    if (t.startsWith('inputs.')) return inputs[t.slice(7)] ?? '';
    if (t === 'true') return true;
    if (t === 'false') return false;
    bad = true; // `needs.*`, `github.*`, `cancelled()` — not modelled, so the whole check bows out
    return undefined;
  };
  const cmp = (): unknown => {
    let left = primary();
    while (toks[i] === '==' || toks[i] === '!=') {
      const op = toks[i++];
      const right = primary();
      left = op === '==' ? left === right : left !== right;
    }
    return left;
  };
  const andExpr = (): unknown => {
    let left = cmp();
    while (toks[i] === '&&') { i++; const right = cmp(); left = truthy(left) ? right : left; }
    return left;
  };
  function orExpr(): unknown {
    let left = andExpr();
    while (toks[i] === '||') { i++; const right = andExpr(); left = truthy(left) ? left : right; }
    return left;
  }
  const value = orExpr();
  if (bad || i !== toks.length) return undefined;
  return truthy(value);
}

{
  const src = readFileSync(join(WORKFLOWS, 'native-e2e.yml'), 'utf8');
  const doc = parse(src) as { on?: Record<string, unknown>; jobs?: Record<string, { if?: string }> };
  const inputless = Object.keys(doc.on ?? {}).filter((t) => t !== 'workflow_dispatch');
  for (const [id, job] of Object.entries(doc.jobs ?? {})) {
    const cond = job.if?.replace(/^\$\{\{|\}\}$/g, '').trim();
    if (!cond || !cond.includes('inputs.')) continue;
    const runs = evalGhExpr(cond, {}); // every input absent — a tag push, or the nightly
    if (runs === undefined) {
      check(`job \`${id}\`'s condition could be evaluated for an input-less trigger`, false,
        'the expression uses syntax this model does not cover, so nothing here can vouch for it — widen the model or simplify the condition');
      continue;
    }
    check(
      `job \`${id}\` still runs on the ${inputless.join(' / ')} trigger(s), which supply NO inputs`,
      runs,
      `its \`if\` evaluates FALSE when every input is absent, so the job silently does not run — the shape that hid the iPad tier on every release tag. Use \`(inputs.x || 'default')\`.`,
    );
  }
}

// ── THE APP ICON (🎯 2026-08-19) ─────────────────────────────────────────────────────────────────
// ⛔ Found missing: `app.json` had NO `icon` key at all, and the only 1024px icon in the repo sat in the
// root tree that 5.5.1 DELETES. CI runs `expo prebuild`, which generates the iOS project from `app.json`
// alone — so every build to date took Expo's DEFAULT icon, and the real one was one commit from being
// gone. Nothing failed; a wrong icon is not a compile error, and no test looks at one.
//
// Three things are checked, because each fails differently and silently:
//   ① the key exists  ② the file it points at exists  ③ the PNG has NO alpha channel
// ③ is the submission blocker: App Store Connect rejects an icon with an alpha channel outright, and
// that rejection arrives at the END of a submission rather than at build time.
{
  const appJsonPath = join(REPO, 'apps', 'rn', 'app.json');
  let iconRel: string | undefined;
  try {
    iconRel = JSON.parse(readFileSync(appJsonPath, 'utf8'))?.expo?.icon;
  } catch {
    iconRel = undefined;
  }
  check('app.json declares an `icon`', typeof iconRel === 'string' && iconRel.length > 0, 'prebuild would use the default Expo icon');

  if (typeof iconRel === 'string') {
    const iconPath = join(REPO, 'apps', 'rn', iconRel.replace(/^\.\//, ''));
    let png: Buffer | null = null;
    try {
      png = readFileSync(iconPath);
    } catch {
      png = null;
    }
    check(`the icon file exists (${iconRel})`, png !== null, 'app.json points at a file that is not there');
    if (png) {
      const width = png.readUInt32BE(16);
      const height = png.readUInt32BE(20);
      const colorType = png[25];
      check(`the icon is 1024×1024 (${width}×${height})`, width === 1024 && height === 1024);
      // colorType 4 (gray+alpha) and 6 (RGBA) carry an alpha channel; 0/2/3 do not.
      check('the icon has NO alpha channel (App Store Connect rejects one)', colorType !== 4 && colorType !== 6, `colorType ${colorType}`);
    }
  }
}

for (const line of ok) console.log(`  ✅ ${line}`);
if (problems.length) {
  console.error(`\n⛔ native-lane pre-flight — ${problems.length} problem${problems.length > 1 ? 's' : ''}:`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error('');
  process.exit(1);
}
console.log(`\n✅ native-lane pre-flight: ${ok.length} structural checks pass.`);
console.log('   Remaining unknown, and only the macOS runner can answer it: whether the split actually runs.');
