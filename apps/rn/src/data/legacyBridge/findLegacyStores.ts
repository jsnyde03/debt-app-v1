import { isLocalStorageDatabase } from './webkitLocalStorage';

/**
 * 5.1b — finding the WebKit localStorage databases inside our own app container.
 *
 * The walk is written against an INJECTED directory lister rather than `expo-file-system` directly, for
 * the same reason 5.1a decoded bytes rather than trusting a driver: everything expressible as a pure
 * function gets proven on this machine, and only the genuinely device-shaped part waits for a build.
 * `listNativeDirectory` (the real one) is a four-line adapter over `Directory.list()`; this file holds
 * the part with decisions in it, and its tests run against a real temp tree.
 *
 * ⚠️ **`Paths` has no `library`.** expo-file-system exposes `cache` (`<container>/Library/Caches`),
 * `document` and `bundle`. `Library` is therefore reached as `Paths.cache.parentDirectory` — which is
 * why `webkitRootFrom` takes the cache path rather than a hardcoded one, and why it is a named function
 * with a test instead of an inline expression nobody would notice breaking.
 *
 * ⛔ **The caps are REPORTED, never silent.** A walk that quietly stops at a depth or a file count looks
 * exactly like a container that had nothing in it, and "found nothing" is the answer that makes the
 * bridge skip a real user's data. `WalkResult.truncated` exists so the probe can say *"I stopped
 * looking"* rather than *"there is nothing there"* — a distinction `hydrate` already makes between a
 * failed read and an absent one.
 */

/** Lists one directory. Returns `null` when the directory does not exist or cannot be read. */
export type ListDirectory = (path: string) => { path: string; isDirectory: boolean }[] | null;

export interface WalkResult {
  /** Every localStorage database found, in discovery order. */
  candidates: string[];
  /** Directories visited — the probe reports this so an empty result can be told from an unwalked tree. */
  visited: number;
  /** ⛔ True when a cap stopped the walk early: the result is a floor, not an inventory. */
  truncated: boolean;
}

/**
 * Depth is measured from `Library/WebKit`. The salted layout puts a database at
 * `Default/<dir>/<dir>/LocalStorage/localstorage.sqlite3` — depth 5 — so 8 leaves real headroom for a
 * layout change without turning a mis-pointed root into an unbounded scan of the container.
 */
export const MAX_WALK_DEPTH = 8;

/** A container this app owns holds nothing like this many directories; hitting it means we are lost. */
export const MAX_WALK_DIRECTORIES = 2000;

/**
 * `<container>/Library/WebKit`, derived from the cache directory rather than hardcoded.
 *
 * ⚠️ Returns `null` rather than guessing when the cache path is not the shape iOS documents
 * (`…/Library/Caches`). Guessing here would send the walk at an arbitrary directory and the failure
 * would present as "no legacy data", which is indistinguishable from a fresh install.
 */
export function webkitRootFrom(cacheDirectory: string): string | null {
  const normalized = cacheDirectory.replace(/\/+$/, '');
  const parts = normalized.split('/');
  const last = parts.pop();
  if (last?.toLowerCase() !== 'caches') return null;
  const library = parts.join('/');
  if (library === '') return null;
  return `${library}/WebKit`;
}

/**
 * Walk `root` breadth-first for WebKit localStorage databases. Breadth-first rather than depth-first so
 * the shallow legacy layout (`WebsiteData/LocalStorage/<origin>.localstorage`) is found before a deep
 * walk of the salted tree can exhaust the cap — the cheap answer arrives first.
 */
export function walkForLocalStorage(root: string, list: ListDirectory): WalkResult {
  const candidates: string[] = [];
  let visited = 0;
  let truncated = false;

  let frontier: { path: string; depth: number }[] = [{ path: root, depth: 0 }];
  while (frontier.length > 0) {
    const next: { path: string; depth: number }[] = [];
    for (const { path, depth } of frontier) {
      if (visited >= MAX_WALK_DIRECTORIES) {
        truncated = true;
        return { candidates, visited, truncated };
      }
      const entries = list(path);
      // A directory that will not list is not a failure of the walk — WebKit's tree contains paths this
      // process has no business in. Skip it and keep going; the probe reports `visited` either way.
      if (entries == null) continue;
      visited++;
      for (const entry of entries) {
        if (entry.isDirectory) {
          if (depth + 1 <= MAX_WALK_DEPTH) next.push({ path: entry.path, depth: depth + 1 });
          else truncated = true;
        } else if (isLocalStorageDatabase(entry.path)) {
          candidates.push(entry.path);
        }
      }
    }
    frontier = next;
  }

  return { candidates, visited, truncated };
}
