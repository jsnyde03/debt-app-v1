import { Directory, File, Paths } from 'expo-file-system';
import { openDatabaseAsync } from 'expo-sqlite';

import { walkForLocalStorage, webkitRootFrom, type ListDirectory } from './findLegacyStores';
import { decodeCandidates } from './decodeCandidates';
import { countLegacyKeys, decodeItemTable, type WebKitItemRow } from './webkitLocalStorage';
import type { LegacyReadReport } from './report';

/**
 * 5.1b.3 — the device half: actually finding and opening the v1.6 WebKit databases. Everything with a
 * decision in it lives in `findLegacyStores` and `webkitLocalStorage`, both proven off-device; this file
 * is the I/O that could not be.
 *
 * ⛔ **THE SOURCE DATABASE IS NEVER OPENED. IT IS COPIED FIRST, AND THE COPY IS OPENED.**
 * `SQLiteOpenOptions` has no read-only flag — `enableChangeListener`, `useNewConnection`,
 * `finalizeUnusedStatementsBeforeClosing`, `libSQLOptions`, and nothing else — so opening the user's own
 * WebKit store would open it **read-write**, which can leave `-wal`/`-shm` siblings beside it and can
 * migrate the file format under a database WebKit still owns. The first duty of a migration bridge is to
 * leave the source exactly as it found it, so the cost of a file copy is not a trade-off worth debating.
 *
 * ⚠️ The copies land in the CACHE directory and are removed in a `finally`. Cache is right rather than
 * documents: if this process dies between copy and cleanup, the leftover is a file iOS is allowed to
 * evict, not a permanent duplicate of the user's financial data sitting in their container.
 *
 * ⚠️ **Nothing here throws.** Every failure becomes a field on the report. A bridge that throws mid-read
 * gives the caller no way to tell "there was nothing" from "I could not look", and that is precisely the
 * distinction `hydrate` already draws — the same confusion, one layer down.
 */

/** The real lister, over `expo-file-system`. Deliberately four lines: the decisions are in the walker. */
const listNativeDirectory: ListDirectory = (path) => {
  try {
    const directory = new Directory(path);
    if (!directory.exists) return null;
    return directory.list().map((entry) => ({
      path: entry.uri,
      isDirectory: entry instanceof Directory,
    }));
  } catch {
    return null;
  }
};

/**
 * Copy one database aside and read its `ItemTable`.
 *
 * ⚠️ WebKit's localStorage database is a plain SQLite file with a single `ItemTable(key, value)`. If the
 * table is absent, this is some other kind of database that merely matched the filename — reported as an
 * error rather than as an empty store, because "opened it and it held nothing" is a claim the bridge
 * would act on.
 */
async function readOneDatabase(sourceUri: string, index: number) {
  const workingDirectory = new Directory(Paths.cache, 'legacy-bridge');
  let copy: File | null = null;
  const sidecars: File[] = [];
  try {
    if (!workingDirectory.exists) workingDirectory.create({ intermediates: true });
    const source = new File(sourceUri);
    if (!source.exists) return { path: sourceUri, rows: 0, legacyKeys: 0, error: 'source vanished' };
    // A distinct name per candidate: two WebKit layouts both use `localstorage.sqlite3`, so copying on
    // the source's own basename would have the second overwrite the first and report it twice.
    copy = new File(workingDirectory, `candidate-${index}.sqlite3`);
    if (copy.exists) copy.delete();
    source.copy(copy);

    // ⛔⛔ THE `-wal` AND `-shm` SIBLINGS ARE NOT OPTIONAL — WITHOUT THEM THERE IS NO DATA AT ALL.
    // Measured on the captured iOS 26.2 container: the main `localstorage.sqlite3` is **4 KB and does
    // not even contain `ItemTable`**, while the `-wal` beside it is 28 KB and holds all 22 keys. WebKit
    // runs the store in WAL mode and had not checkpointed. Copying the main file alone yields
    // `no such table: ItemTable` — which this function would catch, report as an error, and the bridge
    // would conclude the user has no legacy data. **A total, silent migration failure.**
    // ⚠️ SQLite locates the log by appending `-wal`/`-shm` to the database filename, so the copies MUST
    // keep the same basename. Missing siblings are not an error: a cleanly-checkpointed database has none.
    for (const suffix of ['-wal', '-shm']) {
      const sidecar = new File(`${sourceUri}${suffix}`);
      if (!sidecar.exists) continue;
      const target = new File(workingDirectory, `candidate-${index}.sqlite3${suffix}`);
      if (target.exists) target.delete();
      sidecar.copy(target);
      sidecars.push(target);
    }

    const db = await openDatabaseAsync(copy.name, undefined, workingDirectory.uri);
    try {
      const rows = (await db.getAllAsync('SELECT key, value FROM ItemTable')) as WebKitItemRow[];
      const items = decodeItemTable(rows);
      return {
        path: sourceUri,
        rows: rows.length,
        legacyKeys: countLegacyKeys(items),
        // ⚠️ Reported, not inferred: `decodeItemTable` drops rows it cannot read, and a silent drop
        // reads as a clean migration (5.1a's after-scan).
        dropped: rows.length - Object.keys(items).length,
        items,
      };
    } finally {
      await db.closeAsync();
    }
  } catch (error) {
    return { path: sourceUri, rows: 0, legacyKeys: 0, error: String(error) };
  } finally {
    try {
      if (copy?.exists) copy.delete();
      // The sidecars are copies too, and a stale -wal left in cache would be replayed into the NEXT
      // candidate opened under the same name.
      for (const sidecar of sidecars) if (sidecar.exists) sidecar.delete();
    } catch {
      /* a cache file we could not remove is not worth failing a migration over */
    }
  }
}

/**
 * Find every v1.6 localStorage database in this app's container and decode the one that is ours.
 * Returns a REPORT rather than throwing — see the file header.
 */
export async function readLegacyStores(): Promise<LegacyReadReport> {
  const report: LegacyReadReport = {
    supported: true,
    webkitRoot: null,
    visited: 0,
    truncated: false,
    candidates: [],
    opened: [],
    store: null,
    droppedRows: 0,
  };

  try {
    const root = webkitRootFrom(Paths.cache.uri);
    report.webkitRoot = root;
    // ⛔ `null` means the cache path was not the documented shape. Walking a guessed root would report
    // "no legacy data", which is indistinguishable from a fresh install — so we say we could not look.
    if (root == null) {
      report.truncated = true;
      return report;
    }

    const walk = walkForLocalStorage(root, listNativeDirectory);
    report.candidates = walk.candidates;
    report.visited = walk.visited;
    report.truncated = walk.truncated;

    /**
     * ⛔ **[P6.8.9.7.11.13.7 · J1-5] THE DECODE LOOP, THE PICK AND THE ATTRIBUTION LIVE IN
     * `decodeCandidates` — because nothing could reach them here.** This module imports
     * `expo-file-system` and `expo-sqlite`, so the app-layer runner cannot load it, and the three lines
     * that decide which number becomes a user-facing claim were executed by nothing off a device:
     * reverting them left every suite in this repo green. The I/O is injected, exactly as
     * `walkForLocalStorage` already takes `listNativeDirectory`, and this file keeps only what genuinely
     * needs a device.
     *
     * ⚠️ `Object.assign`, not four field copies — there is then no per-field wiring left to get wrong.
     */
    Object.assign(report, await decodeCandidates(walk.candidates, readOneDatabase));
  } catch (error) {
    report.opened.push({ path: '(walk)', rows: 0, legacyKeys: 0, error: String(error) });
  }

  return report;
}
