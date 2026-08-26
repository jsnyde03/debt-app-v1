/**
 * ⛔ **THIS REPOSITORY IS PUBLIC** (`gh repo view` → `PUBLIC`), and it is the whole reason this check exists.
 *
 * P6.5 handed over a Sentry DSN, and the tempting move was to put it in `codemagic.yaml` so the build is
 * reproducible without touching a dashboard. The usual argument for that is sound in isolation — a DSN is
 * *public by design*: write-only ingest, and it ships inlined in every binary because Metro must bake
 * `EXPO_PUBLIC_*` into the bundle. ⚠️ **But "extractable from an IPA" and "sitting in a public GitHub repo"
 * are not the same exposure.** The first needs someone to target you; the second is indexed and scraped
 * automatically, and the payoff for a scraper is a quota flood on someone else's project.
 *
 * So credentials live in the Codemagic environment group, never in the tree — and this makes that a
 * property of the repo rather than a thing everyone has to remember. ([D31]: turn the class into a gate.)
 *
 * ⚠️ It reads **git's own object store** — the index and `HEAD` — not a filesystem walk, and **not the
 * working tree**. A local `.env` or an untracked build output is not a leak, and flagging one would train
 * everyone to ignore the output. It also means generated-but-tracked artifacts (`apps/rn/dist-embed/**`)
 * ARE covered, which is where an inlined secret would actually surface.
 *
 * Usage: tsx scripts/check-committed-secrets.ts
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');

/**
 * ⛔ **THE EXEMPTION LEDGER — [D72], 2026-08-26.** An exemption is keyed on a **SHA-256 of the matched
 * credential text**, scoped to one file. So it survives the line moving and it **dies the moment the value
 * changes**: rotate the credential, or edit one hex digit, and the exemption stops applying and the gate
 * reds. ⛔ **A file-level or path-level carve-out would not have that property**, which is why this is not
 * one — `docs/` is exactly where pasted terminal output lives, i.e. the gate's most likely REAL hit.
 *
 * ⚡ **Why it exists.** The gate fired 4 times on `S0-REVERIFY-4.md` — the audit report that documents this
 * gate's own plant, carrying a fabricated `0123456789abcdef…` DSN inside a code fence and the literal
 * `-----BEGIN PRIVATE KEY-----` in a sentence listing the shapes. The claim *"4 credentials are in a public
 * repository"* was **false**. ⚠️ **And the gate's own fix is what exposed it:** reading index + `HEAD`
 * rather than the working tree means an untracked report scans clean and the same bytes red the instant
 * they are committed — the fix and the report landed in the SAME commit (`74f2064`), so `lint:rn` has been
 * red on every committed tree since. ⛔ **Third gate to fire on its own write-up**, after `lint:closure`
 * (a quoted finding id minted a phantom closure) and `lint:comments`.
 *
 * ⛔ **Editing the report to make the gate green was the rejected option** — that is GAP-17's *"regenerate
 * the baseline wider to make a red gate green"* with the evidence as the baseline.
 *
 * ⚠️ **The cap is SELF-RATCHETING**, per GAP-6: it reds when the active count is **below** `MAX_EXEMPT` as
 * well as above. Removing an exemption therefore forces the cap down in the same edit, so the ledger can
 * never carry spare headroom for the next carve-out.
 *
 * ⛔ **WHY THIS GATE IS NOT IN `test:gate-plants`, stated rather than left as a hole.** That harness plants
 * by **creating** a file — deliberately, so a crash cannot strand the tree in a planted state. An untracked
 * file is invisible to this gate *by design*, so such a plant would prove nothing, and making the harness
 * `git add` its plants would trade that safety property away. **The ledger is instead verified by its own
 * two failure modes, both of which are live on every run:** a stale entry reds, and a changed count reds.
 * ⚠️ Verified by plant at S1.1 — one hex digit changed in the exempted DSN, staged: the exemption stopped
 * applying and the gate red on `[index]` while the unchanged `HEAD` copy stayed exempt.
 */
const LEDGER = join(REPO_ROOT, 'scripts', 'secrets-exemptions.json');
const MAX_EXEMPT = 2;

interface Exemption {
  /** repo-relative path the value appears in — an exemption is never repo-wide */
  file: string;
  /** SHA-256 of the matched text itself, so changing the value invalidates the exemption */
  sha256: string;
  /** why this is provably not a live credential; a reader must be able to check it */
  why: string;
}

const exemptions: Exemption[] = JSON.parse(readFileSync(LEDGER, 'utf8')) as Exemption[];
const usedExemptions = new Set<string>();
/**
 * ⚠️ **ONE spelling of the key, built in ONE place.** The first cut wrote the same
 * `${file}<sep>${sha}` template at three sites — the scan, the registry and the stale check — and two of
 * them ended up with a different separator character, so every exemption matched during the scan and
 * then read as stale. **A key composed by hand at N sites diverges at N−1 of them.**
 */
const hashOf = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');
const keyOf = (file: string, sha256: string): string => `${file}::${sha256}`;
const exemptKeys = new Map(exemptions.map((e) => [keyOf(e.file, e.sha256), e]));

/** Each pattern names the credential it catches, so a hit explains itself without a search. */
const PATTERNS: { name: string; re: RegExp; note: string }[] = [
  {
    name: 'Sentry DSN',
    re: /https:\/\/[0-9a-f]{16,}@o\d+\.ingest\.[a-z0-9.]*sentry\.io\/\d+/i,
    note: 'belongs in the Codemagic env group as EXPO_PUBLIC_SENTRY_DSN — see docs/DEBT_SENTRY_SETUP.md',
  },
  {
    name: 'Sentry auth token',
    re: /\bsntry[su]_[A-Za-z0-9_]{20,}/,
    note: 'a real secret (project:releases scope) — Codemagic secure var only, never the tree',
  },
  {
    name: 'RevenueCat secret key',
    re: /\bsk_[A-Za-z0-9]{24,}/,
    note: 'a RevenueCat SECRET key. The public SDK key (appl_…) is fine; this one is not',
  },
  {
    name: 'App Store Connect private key',
    re: /-----BEGIN (?:RSA )?PRIVATE KEY-----/,
    note: 'the ASC API key belongs in Codemagic, not in the repo',
  },
];

/** This file necessarily contains the patterns themselves. */
const SELF = 'scripts/check-committed-secrets.ts';

/**
 * ⛔ **CONTENT COMES FROM GIT, NOT FROM THE WORKING TREE.** [S0.13 · REVERIFY-4 finding 2, `major`]
 *
 * This check used to take the file **list** from `git ls-files` and the file **content** from
 * `readFileSync` — index for the list, filesystem for the bytes. **So it reported clean over a `HEAD` that
 * held the credential**, in exactly the state its own remediation text below tells you to create: delete
 * the secret from the working copy, re-run, get a green, leave the credential public. Measured in a scratch
 * repo: `git show HEAD:dsn.ts` holding a live Sentry DSN with a redacted working copy printed
 * `✅ committed secrets: none` and exited 0.
 *
 * ⚠️ **A quoted docblock is a carried premise, not a measurement** — the gap survived review because the
 * file described the behaviour it was supposed to have rather than the one it had.
 *
 * **Two revisions are scanned, and both are necessary:**
 * - **the index (`:path`)** — what the next commit will publish. Catches a secret staged but not yet
 *   committed, which is the last moment it is still cheap to fix.
 * - **`HEAD:path`** — what is *already* published. Catches the case above, where the working copy (and
 *   possibly the index) has been cleaned while the credential remains in the committed tree.
 *
 * ⚠️ **What this still does NOT cover, stated rather than implied: older history.** A credential committed
 * and then removed in a later commit is gone from both revisions above and is still public in the log.
 * Scanning all of history on every push is not affordable here; **rotation, not deletion, remains the only
 * real remedy**, which is what the failure text says.
 */
function tracked(rev: 'index' | 'HEAD'): string[] {
  const args =
    rev === 'index' ? ['ls-files', '-z'] : ['ls-tree', '-r', '--name-only', '-z', 'HEAD'];
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' })
      .split('\0')
      .filter(Boolean)
      .filter((f) => f !== SELF);
  } catch {
    return []; // no commits yet, or not a checkout — nothing published means nothing to leak
  }
}

/**
 * Every requested blob's bytes, in ONE `git cat-file --batch` call.
 *
 * ⚠️ Batched deliberately: a `git show` per file is ~1,600 subprocesses on this repo and turns a
 * sub-second gate into a minute-long one, which is how a gate stops being run.
 */
function eachBlob(specs: string[], visit: (spec: string, text: string) => void): void {
  if (specs.length === 0) return;
  const buf = execFileSync('git', ['cat-file', '--batch'], {
    cwd: REPO_ROOT,
    input: `${specs.join('\n')}\n`,
    maxBuffer: 512 * 1024 * 1024,
  });

  let off = 0;
  for (let i = 0; i < specs.length; i++) {
    const nl = buf.indexOf(0x0a, off);
    if (nl < 0) break;
    const header = buf.toString('utf8', off, nl);
    off = nl + 1;
    // `<sha> missing` / `<sha> ambiguous` — the path is absent in that revision. Not this check's business.
    const parts = header.split(' ');
    if (parts.length < 3) continue;
    const size = Number(parts[2]);
    // ⚠️ Decoded one blob at a time and handed straight to `visit`, never accumulated into a Map. The
    // tracked bundles run to megabytes and this repo has 1,167 tracked paths across the two revisions;
    // holding every decoded body at once was hundreds of MB for a gate that needs one string at a time.
    // Skip very large blobs outright: an inlined secret appears in the emitted JS, well under this.
    if (size <= 8 * 1024 * 1024) visit(specs[i], buf.toString('utf8', off, off + size));
    off += size + 1; // git emits a trailing LF after every object
  }
}

const hits: { rev: string; file: string; line: number; name: string; note: string }[] = [];
const scanned = new Set<string>();

/**
 * ⛔ S1.5.4 [M10] — `--working-tree`: THE AUTHORING-TIME SCAN, so an auditor sees the hit BEFORE the commit.
 *
 * ⚡ The measured class: **an audit report that quotes a credential shape as evidence reds `lint:secrets`,
 * and therefore `lint:rn`, on every committed tree** — and it has now happened on 2 of 2 audit rounds.
 * `S0-REVERIFY-4.md` did it, and the very next report did it four more times *while quoting this gate's own
 * evidence*. The author gets no warning, because an untracked file is invisible to the committed scan **by
 * design** — that design is correct and is not what changes here.
 *
 * ⛔ **Both of the author's exits are refused by this file's own text:** editing the report is GAP-17's
 * *"regenerate the baseline wider to make a red gate green"*, and adding exemptions is refused by the
 * downward-only cap below. So the author was between two options the instrument calls wrong, and the only
 * remaining move — redacting by hand — is a discipline, which `write-gate-status.ts` argues cannot close a
 * class: *"a documentation rule is exactly what failed."*
 *
 * ⚠️ **This flag LOOSENS NOTHING.** It scans the same patterns with the same ledger over files git has not
 * been told about yet, and it is deliberately **not** in `lint:rn`: making untracked files gate the tree is
 * the design this gate already rejected. It is a pre-commit read, run by the author of a report.
 *
 * ⚠️ It is the narrower of the two shapes the finding sketched. The other — teaching the gate that a fenced
 * transcript under `docs/audits/**` is evidence — is a path carve-out wearing a smaller hat, and would make
 * `docs/`, the gate's most likely REAL hit, the one place it stops looking.
 */
const WORKING_TREE = process.argv.includes('--working-tree');

if (WORKING_TREE) {
  const untracked = (() => {
    try {
      return execFileSync('git', ['ls-files', '-z', '--others', '--exclude-standard'], { cwd: REPO_ROOT, encoding: 'utf8' })
        .split('\0')
        .filter(Boolean)
        .filter((f) => f !== SELF);
    } catch {
      return [];
    }
  })();
  for (const rel of untracked) {
    let text: string;
    try {
      text = readFileSync(join(REPO_ROOT, rel), 'utf8');
    } catch {
      continue; // binary, deleted mid-run, or unreadable — not evidence of anything
    }
    const lines = text.split(/\r?\n/);
    for (const { name, re, note } of PATTERNS) {
      lines.forEach((line, i) => {
        const m = re.exec(line);
        if (!m) return;
        if (exemptKeys.has(keyOf(rel, hashOf(m[0])))) return;
        hits.push({ rev: 'untracked', file: rel, line: i + 1, name, note });
      });
    }
  }
}

for (const rev of ['index', 'HEAD'] as const) {
  const files = tracked(rev);
  const prefix = rev === 'index' ? ':' : 'HEAD:';
  eachBlob(
    files.map((f) => `${prefix}${f}`),
    (spec, text) => {
      const rel = spec.slice(prefix.length);
      scanned.add(rel);
      if (
        !text.includes('sentry.io') &&
        !text.includes('sntry') &&
        !text.includes('sk_') &&
        !text.includes('PRIVATE KEY')
      ) {
        return; // cheap pre-filter, so the regexes only run where they can possibly match
      }
      const lines = text.split(/\r?\n/);
      for (const { name, re, note } of PATTERNS) {
        lines.forEach((line, i) => {
          // ⚠️ `exec`, not `test`: the ledger keys on the MATCHED TEXT, so the value has to be in hand.
          const m = re.exec(line);
          if (!m) return;
          const k = keyOf(rel, hashOf(m[0]));
          // ⚠️ The same value is found twice — once in `index`, once in `HEAD`. One ledger entry covers
          // both, which is why `usedExemptions` is a Set keyed on the entry rather than a counter.
          if (exemptKeys.has(k)) {
            usedExemptions.add(k);
            return;
          }
          hits.push({ rev, file: rel, line: i + 1, name, note });
        });
      }
    },
  );
}

if (hits.length > 0) {
  console.error(`\n❌ committed secrets: ${hits.length} credential(s) are in a PUBLIC repository.\n`);
  // ⚠️ The revision is printed. "It is in HEAD" and "it is staged" need different next actions, and a
  // reader who cannot tell them apart will check the working copy, see it clean, and assume a false alarm.
  for (const h of hits) console.error(`  [${h.rev}] ${h.file}:${h.line}\n    ${h.name} — ${h.note}`);
  console.error(
    '\n  ⛔ Removing it from the working tree is NOT enough — it stays in git history, and this check\n' +
      '  now reads git rather than your working copy, so cleaning the file will not clear this. Rotate\n' +
      '  the credential, then move it to the Codemagic environment group.\n',
  );
  process.exit(1);
}

/**
 * ⛔ **THE LEDGER IS ITSELF GATED, IN BOTH DIRECTIONS.** [D72] An exemption is a standing permission to
 * carry a credential-shaped string in a public repo, so it gets the same treatment as `MAX_UNTOKENISED`:
 * the count may only go **down**, and — per GAP-6 — a count **below** the cap is also a failure, because
 * otherwise removing one leaves headroom for the next carve-out to land unnoticed.
 *
 * ⚠️ **A stale entry is reported and red.** For `check-apostrophes` a stale baseline entry means copy was
 * swept and redding on progress would get the gate reverted; here it means a standing security permission
 * matches nothing, which is a permission nobody is checking. Deleting it is one line.
 */
const stale = exemptions.filter((e) => !usedExemptions.has(keyOf(e.file, e.sha256)));
if (stale.length > 0) {
  console.error(`\n❌ committed secrets: ${stale.length} exemption(s) in secrets-exemptions.json match nothing.\n`);
  for (const e of stale) console.error(`  ${e.file}\n    sha256 ${e.sha256.slice(0, 16)}… — ${e.why}`);
  console.error('\n  A standing permission that matches nothing is one nobody is checking. Delete it,\n' +
    `  and lower MAX_EXEMPT to ${exemptions.length - stale.length} in the same edit.\n`);
  process.exit(1);
}
if (exemptions.length !== MAX_EXEMPT) {
  const dir = exemptions.length > MAX_EXEMPT ? 'ROSE' : 'fell';
  console.error(`\n❌ committed secrets: the exemption count ${dir} — ${exemptions.length}, cap ${MAX_EXEMPT}.\n`);
  console.error(
    exemptions.length > MAX_EXEMPT
      ? '  ⛔ The cap is DOWNWARD-ONLY. Raising it to admit a new exemption is the thing this gate\n' +
        '  exists to stop. Prove the value is not live, and bring the decision to 🎯.\n'
      : `  Good — one fewer standing permission. Set MAX_EXEMPT = ${exemptions.length} to lock it in.\n`,
  );
  process.exit(1);
}

console.log(
  `✅ committed secrets: none across ${scanned.size} tracked files in index+HEAD (${PATTERNS.length} shapes checked` +
    `${exemptions.length ? `, ${exemptions.length} exemption(s), cap ${MAX_EXEMPT}` : ''}).`,
);
