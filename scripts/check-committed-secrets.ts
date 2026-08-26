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
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');

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
          if (re.test(line)) hits.push({ rev, file: rel, line: i + 1, name, note });
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

console.log(
  `✅ committed secrets: none across ${scanned.size} tracked files in index+HEAD (${PATTERNS.length} shapes checked).`,
);
