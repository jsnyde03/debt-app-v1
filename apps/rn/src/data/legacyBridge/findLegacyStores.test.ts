import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  MAX_WALK_DEPTH,
  MAX_WALK_DIRECTORIES,
  walkForLocalStorage,
  webkitRootFrom,
  type ListDirectory,
} from '@/data/legacyBridge/findLegacyStores';

/**
 * 5.1b.2 — finding the WebKit localStorage databases.
 *
 * The walk runs against a REAL temp tree built to both of the layouts Apple has shipped, not against a
 * stubbed lister returning what I expect. The distinction matters here more than usual: the whole
 * purpose of this code is to cope with a directory shape nobody documents, so a fixture built from my
 * own model of that shape would only ever confirm the model.
 *
 * ⛔ What green here does NOT mean: that iOS puts the files where this test puts them. That is 5.1b.3's
 * simulator run and then the phone. What it means is that GIVEN the tree, the walk finds them, respects
 * its caps, and REPORTS when a cap stopped it.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function eq(actual: unknown, expected: unknown, label: string) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`,
  );
}

/** The real lister, over the real filesystem — the same contract the device adapter implements. */
const realList: ListDirectory = (path) => {
  try {
    return readdirSync(path, { withFileTypes: true }).map((entry) => ({
      path: join(path, entry.name).split('\\').join('/'),
      isDirectory: entry.isDirectory(),
    }));
  } catch {
    return null;
  }
};

// ── `Library/WebKit` is DERIVED, because `Paths` has no `library`. ────────────────────────────────
eq(
  webkitRootFrom('/var/mobile/Containers/Data/Application/ABC/Library/Caches'),
  '/var/mobile/Containers/Data/Application/ABC/Library/WebKit',
  'the WebKit root is derived from the cache directory',
);
eq(webkitRootFrom('/x/Library/Caches/'), '/x/Library/WebKit', 'a trailing slash is tolerated');
eq(webkitRootFrom('/x/Library/caches'), '/x/Library/WebKit', 'the leaf match is case-insensitive');
// ⛔ Guessing here would aim the walk at an arbitrary directory, and "found nothing" would then be
// indistinguishable from a fresh install — the one confusion that makes the bridge skip real data.
eq(webkitRootFrom('/var/mobile/Documents'), null, 'an unexpected cache path returns null instead of guessing');
eq(webkitRootFrom('Caches'), null, 'a bare leaf with no Library above it returns null');

// ── The walk, over a real tree in both of WebKit's layouts. ───────────────────────────────────────
const root = mkdtempSync(join(tmpdir(), 'webkit-walk-'));
try {
  const webkit = join(root, 'WebKit');
  // The older flat layout.
  const flat = join(webkit, 'WebsiteData', 'LocalStorage');
  mkdirSync(flat, { recursive: true });
  writeFileSync(join(flat, 'capacitor_localhost_0.localstorage'), 'x');
  writeFileSync(join(flat, 'https_example.com_0.localstorage'), 'x');
  // The newer salted layout — the origin appears NOWHERE in the path, which is the whole reason the
  // database is identified by contents (5.1a) rather than by where it sits.
  const salted = join(webkit, 'WebsiteData', 'Default', 'aB3xY', 'zQ9pL', 'LocalStorage');
  mkdirSync(salted, { recursive: true });
  writeFileSync(join(salted, 'localstorage.sqlite3'), 'x');
  // Things that must NOT be collected.
  const idb = join(webkit, 'WebsiteData', 'Default', 'aB3xY', 'zQ9pL', 'IndexedDB');
  mkdirSync(idb, { recursive: true });
  writeFileSync(join(idb, 'localstorage.sqlite3.tmp'), 'x');
  writeFileSync(join(webkit, 'readme.txt'), 'x');

  const found = walkForLocalStorage(webkit.split('\\').join('/'), realList);
  const names = found.candidates.map((p) => p.split('/').pop()).sort();
  eq(
    names,
    ['capacitor_localhost_0.localstorage', 'https_example.com_0.localstorage', 'localstorage.sqlite3'],
    'both layouts are found and nothing else is',
  );
  assert(!found.truncated, 'a normal tree does not trip a cap');
  assert(found.visited > 0, `the walk reports how many directories it visited (${found.visited})`);

  // ⭐ Breadth-first: the cheap flat layout surfaces before the deep salted one.
  const flatIndex = found.candidates.findIndex((p) => p.endsWith('capacitor_localhost_0.localstorage'));
  const saltedIndex = found.candidates.findIndex((p) => p.endsWith('localstorage.sqlite3'));
  assert(flatIndex < saltedIndex, 'the shallow layout is found before the deep one (breadth-first)');

  // A root that does not exist is empty and NOT truncated — "nothing there", not "I gave up".
  const missing = walkForLocalStorage(join(root, 'nope').split('\\').join('/'), realList);
  eq(missing.candidates, [], 'a missing root yields no candidates');
  assert(!missing.truncated, 'a missing root is not reported as truncated');
  eq(missing.visited, 0, 'a missing root visits nothing');
} finally {
  rmSync(root, { recursive: true, force: true });
}

// ── ⛔ The caps REPORT. A silent cap reads as "the container was empty". ──────────────────────────
// A synthetic tree deeper than the limit: the database sits one level below where the walk may go.
const tooDeep: ListDirectory = (path) => {
  const depth = path.split('/').length - 1;
  if (depth > MAX_WALK_DEPTH + 2) return [];
  return [{ path: `${path}/d${depth}`, isDirectory: true }];
};
const deep = walkForLocalStorage('/root', tooDeep);
assert(deep.truncated, 'a tree deeper than MAX_WALK_DEPTH reports truncated, it does not just stop');
eq(deep.candidates, [], 'and it found nothing — which is why the flag has to be there');

// A tree wider than the directory cap.
const tooWide: ListDirectory = (path) =>
  path === '/root'
    ? Array.from({ length: MAX_WALK_DIRECTORIES + 10 }, (_, i) => ({ path: `/root/w${i}`, isDirectory: true }))
    : [];
const wide = walkForLocalStorage('/root', tooWide);
assert(wide.truncated, 'a tree wider than MAX_WALK_DIRECTORIES reports truncated');
assert(
  wide.visited <= MAX_WALK_DIRECTORIES,
  `the walk stopped at the cap rather than running away (visited ${wide.visited})`,
);

// An unreadable directory is skipped, not fatal — WebKit's tree holds paths we have no business in.
const unreadable: ListDirectory = (path) =>
  path === '/root'
    ? [
        { path: '/root/locked', isDirectory: true },
        { path: '/root/a.localstorage', isDirectory: false },
      ]
    : null;
const partial = walkForLocalStorage('/root', unreadable);
eq(partial.candidates, ['/root/a.localstorage'], 'an unreadable subdirectory does not cost the readable siblings');

console.log(`✅ findLegacyStores tests passed (${passed} asserts).`);
