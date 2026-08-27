/**
 * WebKit control-layout guard.
 *
 * iOS WKWebView (what every iPhone actually renders Capacitor content with) mis-sizes
 * a native form control — chiefly <button> — when it's used as a flex/grid CONTAINER
 * with wrapping content: the control's box draws too short and the content spills out,
 * overlapping siblings. Chromium AND Playwright's WebKit both render it fine, so no
 * browser test catches it — only the device does. (This bit the payday reconciliation
 * rows in v1.6; fix = move the flex onto an inner <span>, keep the <button> a block.)
 *
 * This check encodes that gotcha so it can't recur: it flags any risky control element
 * whose className references a class that sets `display: flex | inline-flex | grid |
 * inline-grid` in the stylesheets. Runs in `npm run lint` and the CI gate.
 *
 * Usage: tsx scripts/check-webkit-flex-controls.ts [srcDir ...]
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import ts from "typescript";

const REPO_ROOT = join(import.meta.dirname, "..");
const STYLE_DIR = join(REPO_ROOT, "app", "styles");
const DEFAULT_SRC_DIRS = [join(REPO_ROOT, "components"), join(REPO_ROOT, "app")];

// Native controls WebKit lays out with special (often broken) flex/grid sizing. Kept
// tight to avoid noise — <button> is the proven offender; <fieldset> is the other
// classic Safari flex-broken control. Extend deliberately, not speculatively.
const RISKY_ELEMENTS = new Set(["button", "fieldset"]);
const FLEX_DISPLAY = /display\s*:\s*(inline-)?(flex|grid)\b/;

function walk(dir: string, out: string[] = []): string[] {
    let entries: string[];
    try {
        entries = readdirSync(dir);
    } catch {
        return out;
    }
    for (const name of entries) {
        if (name === "node_modules" || name.startsWith(".")) continue;
        const full = join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) walk(full, out);
        else out.push(full);
    }
    return out;
}

/** Collect class names whose CSS rule sets a flex/grid display. */
function collectFlexClasses(): Set<string> {
    const flexClasses = new Set<string>();
    for (const file of walk(STYLE_DIR)) {
        if (extname(file) !== ".css") continue;
        const css = readFileSync(file, "utf8");
        // Naive but sufficient rule scan: "<selector> { <decls> }".
        const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
        let m: RegExpExecArray | null;
        while ((m = ruleRe.exec(css))) {
            const [, selectorList, body] = m;
            if (!FLEX_DISPLAY.test(body)) continue;
            for (const group of selectorList.split(",")) {
                // The display applies to the subject (rightmost compound) of the group.
                const subject = group.trim().split(/\s+|>|\+|~/).filter(Boolean).pop() ?? "";
                for (const cls of subject.match(/\.[A-Za-z0-9_-]+/g) ?? []) {
                    flexClasses.add(cls.slice(1));
                }
            }
        }
    }
    return flexClasses;
}

type Finding = { file: string; line: number; element: string; cls: string };

/** Static class-name tokens from a className attribute (string or template literal). */
function classTokens(attr: ts.JsxAttribute): string[] {
    const init = attr.initializer;
    if (!init) return [];
    let text: string | undefined;
    if (ts.isStringLiteral(init)) text = init.text;
    else if (ts.isJsxExpression(init) && init.expression) {
        const expr = init.expression;
        if (ts.isStringLiteral(expr)) text = expr.text;
        else if (ts.isNoSubstitutionTemplateLiteral(expr)) text = expr.text;
        else if (ts.isTemplateExpression(expr)) {
            // Only the literal (static) parts — dynamic ${...} tokens can't be resolved.
            text = expr.head.text + " " + expr.templateSpans.map((s) => s.literal.text).join(" ");
        }
    }
    if (!text) return [];
    return text.split(/\s+/).filter(Boolean);
}

function scanFile(file: string, flexClasses: Set<string>): Finding[] {
    const src = readFileSync(file, "utf8");
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const findings: Finding[] = [];

    function visit(node: ts.Node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            const tag = node.tagName.getText(sf);
            if (RISKY_ELEMENTS.has(tag)) {
                for (const attr of node.attributes.properties) {
                    if (ts.isJsxAttribute(attr) && attr.name.getText(sf) === "className") {
                        for (const cls of classTokens(attr)) {
                            if (flexClasses.has(cls)) {
                                const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
                                findings.push({ file, line: line + 1, element: tag, cls });
                            }
                        }
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sf);
    return findings;
}

const BASELINE_PATH = join(REPO_ROOT, "scripts", "webkit-flex-controls-baseline.json");

/**
 * ⛔ **[S1.10.6.5.8.5 · GAP-17] THE BASELINE'S SIZE IS A RATCHET.** `--update-baseline` re-records
 * whatever it finds, unconditionally — so running it on a REGRESSED tree writes the regression in as the
 * new normal and a red gate turns green with nothing objecting. The size may fall freely; raising it is a
 * deliberate edit here.
 *
 * ⛔ **AND THIS CAP IS NOT A STANDING GUARD, BECAUSE THIS GATE IS IN NO LIVE CHAIN.** Measured
 * 2026-08-27: `lint:webkit` is reachable only from root `npm run lint`, which appears only in
 * `validate:release:legacy` — a **retired** chain. `validate:release:rn` does not run it and CI does not
 * run it. ⚠️ **The gate is RED right now** (`app/page.tsx:1653`, `.premium-pill`) and has been, unseen.
 * ⚡ Its `DEFAULT_SRC_DIRS` are `components` and `app` — the LEGACY tree only — and its mechanism reads
 * CSS classes, which RN source does not have, so it structurally cannot cover `apps/rn`. P6.11 deletes
 * its entire subject. The cap is kept because it is correct and free, **not** because anything runs it;
 * GAP-17's webkit half is recorded as exiting by measurement rather than by a guard.
 */
const MAX_BASELINED = 19; // measured 2026-08-27

function relPath(file: string): string {
    return file.replace(REPO_ROOT + "\\", "").replace(REPO_ROOT + "/", "").replace(/\\/g, "/");
}

/** Stable ratchet key — file + element + class (line-independent). */
function key(f: Finding): string {
    return `${relPath(f.file)}::${f.element}::${f.cls}`;
}

function loadBaseline(): Set<string> {
    try {
        return new Set(JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as string[]);
    } catch {
        return new Set();
    }
}

function main() {
    const args = process.argv.slice(2);
    const update = args.includes("--update-baseline");
    const srcArgs = args.filter((a) => !a.startsWith("--"));
    const srcDirs = srcArgs.length ? srcArgs.map((p) => join(process.cwd(), p)) : DEFAULT_SRC_DIRS;

    const flexClasses = collectFlexClasses();
    const findings: Finding[] = [];
    for (const dir of srcDirs) {
        for (const file of walk(dir)) {
            if (![".tsx", ".jsx"].includes(extname(file))) continue;
            findings.push(...scanFile(file, flexClasses));
        }
    }

    if (update) {
        const keys = [...new Set(findings.map(key))].sort();
        // ⛔ [GAP-17] Shrinking is free; growing needs the cap raised first.
        if (keys.length > MAX_BASELINED) {
            console.error(
                `\n❌ webkit flex: refusing to record ${keys.length} control(s), over the cap of ${MAX_BASELINED}.\n`
            );
            console.error("  Re-recording would write the regression in as the new normal. Fix the");
            console.error("  controls, or raise MAX_BASELINED in check-webkit-flex-controls.ts and say why.");
            process.exit(1);
        }
        writeFileSync(BASELINE_PATH, JSON.stringify(keys, null, 2) + "\n");
        console.log(`✓ Baseline updated: ${keys.length} accepted flex/grid control(s) → ${relPath(BASELINE_PATH)}`);
        return;
    }

    const baseline = loadBaseline();
    // ⛔ [GAP-17] The same cap on the RECORDED file — a hand edit or merge never passes the check above.
    if (baseline.size > MAX_BASELINED) {
        console.error(
            `\n❌ webkit flex: the RECORDED baseline holds ${baseline.size} control(s), above the cap of ${MAX_BASELINED}.\n`
        );
        console.error("  A wider baseline turns a red gate green. Fix the controls, or raise");
        console.error("  MAX_BASELINED in scripts/check-webkit-flex-controls.ts and say why.");
        process.exit(1);
    }
    const fresh = findings.filter((f) => !baseline.has(key(f)));

    if (fresh.length === 0) {
        console.log(
            `✓ WebKit control-layout check: no NEW flex/grid controls ` +
            `(${baseline.size} baselined, ${flexClasses.size} flex classes scanned).`
        );
        return;
    }

    console.error("✗ WebKit control-layout check FAILED — NEW native control(s) used as a flex/grid container:\n");
    for (const f of fresh) {
        console.error(`  ${relPath(f.file)}:${f.line}  <${f.element}> uses flex/grid class ".${f.cls}"`);
    }
    console.error(
        "\n  iOS WKWebView mis-sizes a flex/grid <button>/<fieldset> when its content" +
        "\n  WRAPS to multiple lines: the box draws too short and the content spills out," +
        "\n  overlapping the next element. Chromium AND Playwright-WebKit both render it" +
        "\n  fine — only the device shows it (it bit the v1.6 payday reconcile rows)." +
        "\n\n  Fix: keep the control a plain block; move `display:flex/grid` onto an inner" +
        "\n  wrapper (e.g. a <span>). If this control's content genuinely never wraps and" +
        "\n  you accept the risk, run `npm run lint:webkit -- --update-baseline` to record it.\n"
    );
    process.exit(1);
}

main();
