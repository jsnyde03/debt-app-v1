/**
 * Golden-image visual regression for the iOS-Simulator smoke test.
 *
 * Compares the WKWebView screenshots Maestro just captured (artifacts/<theme>/*.png)
 * against committed baselines (tests/ios-baselines/<theme>/*.png):
 *   • baseline MISSING → capture it (bootstraps on first run) and pass.
 *   • baseline PRESENT → pixel-diff; if too many pixels differ, write a diff image
 *     and FAIL — that's a layout regression the browser tests can't see (the whole
 *     point). Re-baseline intentionally by deleting the stale baseline + re-running.
 *
 * Deterministic screenshots are a prerequisite — the workflow freezes the status
 * bar to 9:41 / full battery / full signal so the live clock doesn't churn the diff.
 *
 * Usage: node scripts/compare-ios-screenshots.mjs [currentDir] [baselineDir]
 */
import { readdirSync, existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const CURRENT_DIR = process.argv[2] || "artifacts";
const BASELINE_DIR = process.argv[3] || "tests/ios-baselines";
const DIFF_DIR = join(CURRENT_DIR, "diffs");
const PIXEL_THRESHOLD = 0.1; // per-pixel color sensitivity (0 strict … 1 loose)
const MAX_DIFF_RATIO = 0.002; // fail if >0.2% of pixels differ (tolerates AA noise)

/** Relative paths of every .png under dir (excluding the diffs/ output). */
function pngsIn(dir, base = dir, out = []) {
    if (!existsSync(dir)) return out;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (full !== DIFF_DIR) pngsIn(full, base, out);
        } else if (entry.name.endsWith(".png")) {
            out.push(relative(base, full).replace(/\\/g, "/"));
        }
    }
    return out;
}

const currents = pngsIn(CURRENT_DIR);
if (currents.length === 0) {
    console.error(`✗ No screenshots found under ${CURRENT_DIR} — the smoke test produced nothing to compare.`);
    process.exit(1);
}

let failed = false;
let created = 0;
let compared = 0;

for (const rel of currents) {
    const curPath = join(CURRENT_DIR, rel);
    const basePath = join(BASELINE_DIR, rel);

    if (!existsSync(basePath)) {
        mkdirSync(dirname(basePath), { recursive: true });
        copyFileSync(curPath, basePath);
        console.log(`＋ new baseline captured: ${rel}`);
        created++;
        continue;
    }

    const cur = PNG.sync.read(readFileSync(curPath));
    const base = PNG.sync.read(readFileSync(basePath));

    if (cur.width !== base.width || cur.height !== base.height) {
        console.error(`✗ SIZE MISMATCH ${rel}: baseline ${base.width}×${base.height} vs current ${cur.width}×${cur.height}`);
        failed = true;
        continue;
    }

    const diff = new PNG({ width: cur.width, height: cur.height });
    const diffPx = pixelmatch(base.data, cur.data, diff.data, cur.width, cur.height, { threshold: PIXEL_THRESHOLD });
    const ratio = diffPx / (cur.width * cur.height);
    compared++;

    if (ratio > MAX_DIFF_RATIO) {
        mkdirSync(dirname(join(DIFF_DIR, rel)), { recursive: true });
        writeFileSync(join(DIFF_DIR, rel), PNG.sync.write(diff));
        console.error(`✗ ${rel}: ${diffPx} px differ (${(ratio * 100).toFixed(3)}%) > ${(MAX_DIFF_RATIO * 100).toFixed(2)}% → diff saved`);
        failed = true;
    } else {
        console.log(`✓ ${rel}: ${diffPx} px differ (${(ratio * 100).toFixed(3)}%)`);
    }
}

console.log(`\n${compared} compared · ${created} new baseline(s).`);
if (failed) {
    console.error("\nVisual regression detected. Review artifacts/diffs. If the change is intentional, delete the stale baseline(s) under tests/ios-baselines and re-run to re-capture.");
    process.exit(1);
}
