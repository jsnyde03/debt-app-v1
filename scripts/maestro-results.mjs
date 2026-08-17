/**
 * 4.1.9b.5 — THE DURABLE PER-FLOW RESULTS FILE.
 *
 * 4.1.9c's reader established that a `✅auto·<runId>` stamp records a RUN, not a flow verdict — which is
 * how six rows from a RED flow came to be counted as proven. The writer that fixes that needs to know
 * which flows passed in which run, and nothing durable carried that: the JUnit XML rides in an artifact
 * that expires, and `coverage-split.md` is regenerated from the checklist, not from a run.
 *
 * This turns Maestro's JUnit into a small, stable JSON keyed the way the rest of the instrument is keyed
 * — by FLOW FILENAME, which is what `coverage-split.ts` reads `COVERS:`/`PARTIAL:` declarations out of.
 *
 * ⚠️ THE MAPPING IS THE ONE THING THAT CAN SILENTLY GO WRONG. Maestro names a testcase after the flow's
 * `name:` property and falls back to the file's stem; no flow in this repo sets `name:`, so today the
 * stem IS the name. If that ever changes, a testcase would stop resolving to a file and its verdict
 * would vanish from the record without anything failing. So every unresolved name is collected, printed,
 * and written into the file — a hole that is visible is a hole that can be fixed.
 *
 * ⛔ ZERO DEPENDENCIES, AND THAT IS A REQUIREMENT, NOT A PREFERENCE. It runs in the tier jobs, which
 * after 4.1.9b's split do no `npm install` at all — they hold a tarball, `simctl` and Maestro. Importing
 * anything would drag a 59-second install back into both of them.
 *
 * Usage (also importable — `collect-lane-diagnostics.mjs` calls `buildResults` directly):
 *   node scripts/maestro-results.mjs --junit <report.xml> --tier <iphone|ipad> \
 *        --flow-dir <dir> --out <results.json> [--summary <file>]
 *
 * Exit code is 0 even when flows failed: this records a result, it does not judge one. The tier step's
 * own exit status is what reds the job.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * ⚠️ A REGEX PARSER, DELIBERATELY, AND ITS LIMIT IS STATED. Maestro's JUnit is machine-generated and
 * flat — `<testsuites><testsuite><testcase/>` with no namespaces, no CDATA in attributes and no nesting
 * of `testcase`. A real XML parser would be a dependency (see the header) to handle shapes this file
 * cannot receive. What it MUST handle is both testcase forms, because Maestro emits both: self-closing
 * for a pass, and a container holding `<failure>` for a red.
 */
export function parseJunit(xml) {
  const cases = [];
  const re = /<testcase\b([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrs = Object.fromEntries(
      [...m[1].matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)].map((a) => [a[1], a[2]]),
    );
    let body = '';
    if (m[2] !== '/') {
      const close = xml.indexOf('</testcase>', re.lastIndex);
      body = close === -1 ? xml.slice(re.lastIndex) : xml.slice(re.lastIndex, close);
    }
    // `<skipped/>` is a third state and it is NOT a pass. Maestro emits it for a flow it never ran —
    // which is exactly the shape of the driver stall that has burned two whole cycles, and counting it
    // as a pass would let a stall stamp the checklist.
    const failed = /<(failure|error)\b/.test(body);
    const skipped = /<skipped\b/.test(body);
    const failureText = failed
      ? (body.match(/<(?:failure|error)\b[^>]*>([\s\S]*?)<\/(?:failure|error)>/)?.[1] ?? '').trim().slice(0, 500)
      : '';
    cases.push({
      name: attrs.name ?? attrs.id ?? '(unnamed)',
      classname: attrs.classname,
      time: attrs.time ? Number(attrs.time) : undefined,
      verdict: failed ? 'fail' : skipped ? 'skipped' : 'pass',
      failure: failureText || undefined,
    });
  }
  return cases;
}

export function buildResults({ junitPath, tier = 'unknown', flowDir }) {
  // ⛔ SEVERAL REPORTS PER TIER, because a tier is not always one `maestro test` call. 4.1.7 moved flow
  // `09` into its own invocation (it opens `clearState: true`, so everything needing an onboarded app has
  // to run before it) and that call writes its own JUnit. Reading only the first file would have dropped
  // `09` from the record silently — the results file would say 9 flows where 10 ran, and nothing would
  // report the gap. The reader takes a list for exactly that reason.
  const paths = (Array.isArray(junitPath) ? junitPath : [junitPath]).filter((p) => p && existsSync(p));
  const xml = paths.map((p) => readFileSync(p, 'utf8')).join('\n');
  const cases = paths.flatMap((p) => parseJunit(readFileSync(p, 'utf8')));

  // Resolve each testcase back to the flow FILE, because that is the key `coverage-split.ts` reads
  // `COVERS:` out of. Stem match first (today's behaviour), then an exact filename, then give up loudly.
  const flowFiles = flowDir && existsSync(flowDir)
    ? readdirSync(flowDir).filter((f) => f.endsWith('.yaml'))
    : [];
  const byStem = new Map(flowFiles.map((f) => [f.replace(/\.yaml$/, ''), f]));

  const unresolved = [];
  const flows = cases.map((c) => {
    const flow = byStem.get(c.name) ?? (flowFiles.includes(c.name) ? c.name : undefined);
    if (!flow) unresolved.push(c.name);
    return { flow: flow ?? null, name: c.name, verdict: c.verdict, time: c.time, failure: c.failure };
  });

  const totals = { pass: 0, fail: 0, skipped: 0 };
  for (const f of flows) totals[f.verdict] = (totals[f.verdict] ?? 0) + 1;

  return {
    schema: 1,
    tier,
    runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    sha: process.env.GITHUB_SHA ?? null,
    ref: process.env.GITHUB_REF ?? null,
    generatedAt: new Date().toISOString(),
    // ⚠️ An empty or missing report is a RESULT, and it is this lane's signature failure — the driver
    // stall that produces zero flows costs a full build and is indistinguishable from a green suite in
    // wall-clock. Recording `junitFound: false` is what lets 4.1.9c's writer refuse to stamp anything.
    junitFound: Boolean(xml),
    totals,
    flows,
    unresolved,
  };
}

export function renderSummary(r) {
  const icon = (v) => (v === 'pass' ? '✅' : v === 'fail' ? '❌' : '⏭');
  return [
    `### ${r.tier} tier — ${r.totals.pass} passed · ${r.totals.fail} failed · ${r.totals.skipped} skipped`,
    '',
    ...(r.junitFound
      ? []
      : ['⛔ **No JUnit report was produced — no flow ran.** Check for the iOS-driver stall warning.', '']),
    '| | flow | verdict | time |',
    '|---|---|---|---|',
    ...r.flows.map((f) => `| ${icon(f.verdict)} | \`${f.flow ?? f.name}\` | ${f.verdict} | ${f.time ?? '—'}s |`),
    ...(r.unresolved.length
      ? ['', `⚠️ **${r.unresolved.length} testcase name(s) did not resolve to a flow file:** ${r.unresolved.map((u) => `\`${u}\``).join(', ')} — the stem-to-filename mapping has drifted.`]
      : []),
    '',
  ].join('\n');
}

export function writeResults(results, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
}

export function appendSummary(md, summaryPath = process.env.GITHUB_STEP_SUMMARY) {
  if (!summaryPath) return;
  try {
    writeFileSync(summaryPath, md, { flag: 'a' });
  } catch (e) {
    console.error(`(could not append to the step summary: ${e.message})`);
  }
}

// ── CLI ───────────────────────────────────────────────────────────────────────────────────────────
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const arg = (name, fallback = undefined) => {
    const i = process.argv.indexOf(`--${name}`);
    return i === -1 || i === process.argv.length - 1 ? fallback : process.argv[i + 1];
  };
  const outPath = arg('out');
  if (!arg('junit') || !outPath) {
    console.error('usage: maestro-results.mjs --junit <xml> --out <json> [--tier t] [--flow-dir d] [--summary f]');
    process.exit(2);
  }
  const results = buildResults({ junitPath: arg('junit'), tier: arg('tier', 'unknown'), flowDir: arg('flow-dir') });
  writeResults(results, outPath);
  const md = renderSummary(results);
  appendSummary(md, arg('summary', process.env.GITHUB_STEP_SUMMARY));
  console.log(md);
  console.log(`→ ${outPath}`);
  if (results.unresolved.length) console.error(`⚠️ unresolved testcase names: ${results.unresolved.join(', ')}`);
}
