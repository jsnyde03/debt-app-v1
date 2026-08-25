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
 * ⚠️ It reads `git ls-files`, i.e. exactly what is COMMITTED — not a filesystem walk. A local `.env` or an
 * untracked build output is not a leak, and flagging one would train everyone to ignore the output. It also
 * means generated-but-tracked artifacts (`apps/rn/dist-embed/**`) ARE covered, which is where an inlined
 * secret would actually surface.
 *
 * Usage: tsx scripts/check-committed-secrets.ts
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
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

const files = execFileSync('git', ['ls-files', '-z'], { cwd: REPO_ROOT, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((f) => f !== SELF);

const hits: { file: string; line: number; name: string; note: string }[] = [];

for (const rel of files) {
  const abs = join(REPO_ROOT, rel);
  let size = 0;
  try {
    size = statSync(abs).size;
  } catch {
    continue; // listed but absent (a deletion staged elsewhere) — not this check's business
  }
  // Skip very large files: the tracked bundles run to megabytes and a regex over all of them on every push
  // is a cost with no matching risk — an inlined secret appears in the emitted JS, which is well under this.
  if (size > 8 * 1024 * 1024) continue;

  let text: string;
  try {
    text = readFileSync(abs, 'utf8');
  } catch {
    continue; // binary / unreadable
  }
  if (!text.includes('sentry.io') && !text.includes('sntry') && !text.includes('sk_') && !text.includes('PRIVATE KEY')) {
    continue; // cheap pre-filter, so the regexes only run where they can possibly match
  }

  const lines = text.split(/\r?\n/);
  for (const { name, re, note } of PATTERNS) {
    lines.forEach((line, i) => {
      if (re.test(line)) hits.push({ file: rel, line: i + 1, name, note });
    });
  }
}

if (hits.length > 0) {
  console.error(`\n❌ committed secrets: ${hits.length} credential(s) are in a PUBLIC repository.\n`);
  for (const h of hits) console.error(`  ${h.file}:${h.line}\n    ${h.name} — ${h.note}`);
  console.error(
    '\n  ⛔ Removing it from the working tree is NOT enough — it stays in git history. Rotate the\n' +
      '  credential, then move it to the Codemagic environment group.\n',
  );
  process.exit(1);
}

console.log(`✅ committed secrets: none across ${files.length} tracked files (${PATTERNS.length} shapes checked).`);
