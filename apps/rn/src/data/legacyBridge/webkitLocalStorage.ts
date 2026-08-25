/**
 * 5.1 — reading the Capacitor WKWebView's `localStorage`. This file is the half that is provable
 * off-device; the I/O half is not, and does not live here.
 *
 * v1.6 shipped as Capacitor, so every persisted `debtPlanner.*` key lives in the WKWebView's
 * localStorage under the origin `capacitor://localhost` — the Capacitor iOS default, which this app
 * does not override (no `server.iosScheme` in `capacitor.config.ts`; the default is declared in
 * `InstanceDescriptorDefaults` in @capacitor/ios 8.4.0). v1.7 is a plain RN binary with **no web
 * context at all**, so nothing in the app can ask a browser for those bytes. What it can do is read
 * its own container: WebKit keeps localStorage in a SQLite database under `Library/WebKit/…`, and the
 * container survives an in-place app update because the bundle id is unchanged
 * (`com.jasonsnyder.debtplanner` in both `apps/rn/app.json` and `capacitor.config.ts`).
 *
 * ⛔ **THE DATABASE IS IDENTIFIED BY ITS CONTENTS, NEVER BY ITS PATH.** WebKit's on-disk layout is
 * private and has changed at least twice — a flat `<origin>.localstorage` file on older iOS, a salted
 * `Default/<dir>/<dir>/LocalStorage/localstorage.sqlite3` tree on newer ones — and the salted form does
 * not name the origin anywhere in the path. Matching a path is a guess that ages badly and fails
 * silently on the next iOS. Asking *"does this database contain `debtPlanner.*` keys?"* is true on
 * every layout Apple has shipped and on any it might ship next. The probe enumerates candidates;
 * `pickLegacyStore` decides which one is ours.
 *
 * ⚠️ **What is NOT settled here:** whether the files are findable and readable on a real upgraded
 * device. That is the actual unknown, it cannot be measured on Windows, and it costs a native build —
 * so it ships as 5.1's device probe, batched. Everything below is a pure function over bytes, which is
 * why it could be settled first and why a wrong decode will not be discovered on a device.
 */

/** The prefix every v1.6 persisted key carries (`debtPlanner.debts`, `debtPlanner.schemaVersion`, …). */
export const LEGACY_KEY_PREFIX = 'debtPlanner.';

/**
 * One row of WebKit's `ItemTable`, as a SQLite driver hands it back. `key` is TEXT; `value` is a BLOB
 * whose encoding WebKit has never promised — hence `unknown` on both, and a decoder rather than a cast.
 */
export interface WebKitItemRow {
  key: unknown;
  value: unknown;
}

/** A candidate database the probe found, with its contents already decoded. */
export interface LegacyStoreCandidate {
  path: string;
  items: Record<string, string>;
}

function toBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  // Some drivers hand a BLOB back as a plain number array.
  if (Array.isArray(value) && value.every((n) => typeof n === 'number')) return Uint8Array.from(value);
  return null;
}

/** UTF-16LE, no BOM — the encoding classic WebKit writes localStorage values in. */
function decodeUtf16le(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    out += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
  }
  return out;
}

/**
 * UTF-8, hand-rolled rather than `TextDecoder`. Hermes' `TextDecoder` availability varies by RN
 * version and this code runs at the one moment where a missing global is unrecoverable — mid-upgrade,
 * before the user's data has been written anywhere else. A malformed sequence yields U+FFFD rather
 * than throwing, so one bad byte cannot cost the other 30 keys.
 */
function decodeUtf8(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i];
    let cp: number;
    let size: number;
    if (b0 < 0x80) {
      cp = b0;
      size = 1;
    } else if ((b0 & 0xe0) === 0xc0) {
      cp = b0 & 0x1f;
      size = 2;
    } else if ((b0 & 0xf0) === 0xe0) {
      cp = b0 & 0x0f;
      size = 3;
    } else if ((b0 & 0xf8) === 0xf0) {
      cp = b0 & 0x07;
      size = 4;
    } else {
      out += '�';
      i += 1;
      continue;
    }
    if (i + size > bytes.length) {
      out += '�';
      break;
    }
    let valid = true;
    for (let k = 1; k < size; k++) {
      const bk = bytes[i + k];
      if ((bk & 0xc0) !== 0x80) {
        valid = false;
        break;
      }
      cp = (cp << 6) | (bk & 0x3f);
    }
    if (!valid) {
      out += '�';
      i += 1;
      continue;
    }
    i += size;
    if (cp > 0xffff) {
      cp -= 0x10000;
      out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    } else {
      out += String.fromCharCode(cp);
    }
  }
  return out;
}

function parsesAsJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Decode one `ItemTable` value. Returns `null` only when the row carried something that is not text at
 * all — the caller drops that key rather than inventing a value for it.
 *
 * ⚠️ The encoding is SNIFFED, because WebKit does not record it and has written both. The discriminator
 * is not a byte heuristic but the fact that **every v1.6 value was written by `JSON.stringify`** — so
 * "which decoding parses as JSON" is a question about our own data, not a guess about Apple's. The
 * NUL-byte tiebreak only runs when JSON cannot separate them, and it is sound in that corner: valid
 * UTF-8 text out of `JSON.stringify` never contains a raw 0x00 (a NUL inside a string is escaped to a
 * six-character backslash-u-0000 sequence), while UTF-16LE of a mostly-ASCII payload is half NUL bytes.
 */
export function decodeWebKitValue(value: unknown): string | null {
  // A driver configured to return TEXT has already done the work.
  if (typeof value === 'string') return value;
  const bytes = toBytes(value);
  if (bytes == null) return null;
  if (bytes.length === 0) return '';

  const asUtf8 = decodeUtf8(bytes);
  // UTF-16 is impossible at odd length — no sniffing needed.
  if (bytes.length % 2 !== 0) return asUtf8;

  const asUtf16 = decodeUtf16le(bytes);
  const utf16IsJson = parsesAsJson(asUtf16);
  const utf8IsJson = parsesAsJson(asUtf8);
  if (utf16IsJson !== utf8IsJson) return utf16IsJson ? asUtf16 : asUtf8;
  return bytes.includes(0) ? asUtf16 : asUtf8;
}

/**
 * Decode a whole `ItemTable`. Rows whose key is not a string, or whose value will not decode, are
 * DROPPED rather than defaulted — a bridge that invents a value is worse than one that reports a
 * missing key, because the missing key is visible and the invented one is not.
 */
export function decodeItemTable(rows: readonly WebKitItemRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    const key = typeof row.key === 'string' ? row.key : decodeWebKitValue(row.key);
    if (key == null || key === '') continue;
    const value = decodeWebKitValue(row.value);
    if (value == null) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Does this filename look like a WebKit localStorage database? Both layouts Apple has shipped, and
 * deliberately nothing narrower — this only decides what is worth OPENING. What it IS gets decided by
 * `pickLegacyStore`, on contents.
 */
export function isLocalStorageDatabase(path: string): boolean {
  const name = path.split(/[\\/]/).pop()?.toLowerCase() ?? '';
  return name.endsWith('.localstorage') || name === 'localstorage.sqlite3';
}

/** How many `debtPlanner.*` keys a decoded database holds — the evidence `pickLegacyStore` ranks on. */
export function countLegacyKeys(items: Record<string, string>): number {
  return Object.keys(items).filter((k) => k.startsWith(LEGACY_KEY_PREFIX)).length;
}

/**
 * Split undecodable-row counts into **ours** and **everyone else's**, given the database `pickLegacyStore`
 * chose. [P6.8.9.7.11.4]
 *
 * ⛔ **Extracted so it can be SEEN.** The attribution lived inline in `readLegacyStores()`, which takes no
 * arguments and reads the native container through `Paths.cache.uri` — so nothing off-device could reach
 * it, and every `LegacyReadReport` fixture in the repo hard-codes `droppedRows: 0`. Deleting the logic
 * would have gone green. ⚡ **The repo has measured three times that an id is unpinnable because the
 * INSTRUMENT is wrong, not the fix** — the question is *what could see this*, and the answer here is a
 * pure function.
 *
 * ⛔ **NO PICK MEANS REPORT EVERYTHING, AND THAT DIRECTION IS THE WHOLE POINT.** Sending every drop to the
 * other-candidates bucket when nothing was picked is the case this counter exists for, inverted: if the
 * user's own v1.6 database opens and **every row fails to decode**, `countLegacyKeys` is `0`,
 * `pickLegacyStore` returns `null`, and `migrateFromLegacy` then reads the container as *a fresh install*.
 * `droppedRows` is the only number left saying anything was lost — so zeroing it trades a measured false
 * positive for an unmeasured **false negative**, on data the user cannot get back.
 * Attribution needs a pick; with no pick, a data-loss signal fails SAFE by reporting.
 */
export function attributeDroppedRows(
  decoded: readonly { path: string; dropped: number }[],
  pickedPath: string | undefined,
): { droppedRows: number; droppedRowsOtherCandidates: number } {
  const total = decoded.reduce((sum, d) => sum + d.dropped, 0);
  if (pickedPath === undefined) return { droppedRows: total, droppedRowsOtherCandidates: 0 };
  let droppedRows = 0;
  for (const d of decoded) if (d.path === pickedPath) droppedRows += d.dropped;
  return { droppedRows, droppedRowsOtherCandidates: total - droppedRows };
}

/**
 * Choose the v1.6 store from everything the probe opened. Ranks on legacy-key COUNT, so a stray
 * database from some other origin (an in-app web view, a WKWebView an SDK made) cannot win, and a
 * partially-written one loses to a complete one. Returns `null` when no candidate holds a single
 * `debtPlanner.*` key — which is the correct answer for a fresh install, and MUST NOT be confused with
 * "the read failed": the caller distinguishes those, exactly as `hydrate` already does.
 *
 * ⚠️ Re-attached at P6.8.9.7.11.9 — `attributeDroppedRows` was inserted between this block and its
 * subject, which is the same defect `.11.7` fixed in two other files. Third instance, and the second one
 * written while fixing the first two.
 */
export function pickLegacyStore<T extends LegacyStoreCandidate>(candidates: readonly T[]): T | null {
  let best: T | null = null;
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = countLegacyKeys(candidate.items);
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}
