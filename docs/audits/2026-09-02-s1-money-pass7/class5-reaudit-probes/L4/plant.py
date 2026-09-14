# L4 plant runner. Plants ONLY in C:/Users/Jason/audit-c5r1-L4.
# Byte mode; backup copies taken BEFORE the plant; restore in `finally`; restore verified by byte compare
# against the backup (never git checkout). Each named plant: edits -> commands -> restore -> verify.
# Usage: python -X utf8 plant.py <plant-name> [<plant-name> ...]
import os, re, subprocess, sys, json, shutil, time

WT = r'C:/Users/Jason/audit-c5r1-L4'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'plant-runs')
os.makedirs(OUT, exist_ok=True)
sys.stdout.reconfigure(encoding='utf-8')
ENV = dict(os.environ, NODE_OPTIONS='--max-old-space-size=1536', FORCE_COLOR='0')

def lit(find, replace, count=1):
    """exact byte substring edit; must match exactly `count` times"""
    def f(b):
        fb, rb = find.encode('utf-8'), replace.encode('utf-8')
        n = b.count(fb)
        if n != count:
            # tolerate CRLF checkouts
            fb2, rb2 = fb.replace(b'\n', b'\r\n'), rb.replace(b'\n', b'\r\n')
            n2 = b.count(fb2)
            if n2 == count:
                return b.replace(fb2, rb2)
            raise RuntimeError(f'anchor matched {n}x (crlf {n2}x): {find[:80]!r}')
        return b.replace(fb, rb)
    return f

def rx(pattern, replace, count=1):
    """regex edit over an LF-normalised copy; the file's own line endings are written back.
    (First run: a bare-\\n pattern matched 0x in the CRLF worktree and aborted the batch before any write.)"""
    def f(b):
        t = b.decode('utf-8')
        crlf = '\r\n' in t
        lf = t.replace('\r\n', '\n')
        new, n = re.subn(pattern, replace, lf, count=count, flags=re.M)
        if n != count:
            raise RuntimeError(f'regex matched {n}: {pattern!r}')
        return (new.replace('\n', '\r\n') if crlf else new).encode('utf-8')
    return f

def append(text):
    return lambda b: b + text.encode('utf-8')

def del_lines_containing(needle, expect_lines):
    def f(b):
        crlf = b'\r\n' in b
        lines = b.split(b'\n')
        keep = [l for l in lines if needle.encode('utf-8') not in l]
        if len(lines) - len(keep) != expect_lines:
            raise RuntimeError(f'deleted {len(lines)-len(keep)} lines, expected {expect_lines}: {needle[:60]!r}')
        return b'\n'.join(keep)
    return f

def run(cmd, tag):
    t0 = time.time()
    p = subprocess.run(cmd, cwd=WT, shell=True, capture_output=True, env=ENV)
    out = (p.stdout + p.stderr).decode('utf-8', errors='replace')
    path = os.path.join(OUT, f'{tag}.txt')
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(f'$ {cmd}\nexit={p.returncode} secs={time.time()-t0:.0f}\n\n{out}')
    return p.returncode, out

RC = 'scripts/check-trust-claims.ts'
FG = 'scripts/check-finding-guards.ts'
RG = 'scripts/run-gates.ts'

PLANTS = {
  # --- D81 ---
  'd81-delete-refusal': dict(edits=[(RG, rx(r"^if \(!FAST && selected\.length !== GATES\.length\) \{\n(?:.*\n){2}\}\n", ''))],
      cmds=['npm run -s lint:runner-completeness', 'npm run -s lint:ci-chain', 'npm run -s lint:finding-guards']),
  'd81-fast-unconditional': dict(edits=[(RG, lit("const FAST = process.argv.includes('--fast');", "const FAST = process.argv.includes('--fast') || true;"))],
      cmds=['npx tsx scripts/run-gates.ts --list', 'npm run -s lint:runner-completeness', 'npm run -s lint:ci-chain', 'npm run -s lint:finding-guards']),
  'd81-control-selection-skips': dict(edits=[(RG, lit("const selected = FAST ? GATES.filter((gate) => !isSelfTest(gate)) : GATES;", "const selected = GATES.filter((gate) => !isSelfTest(gate));"))],
      cmds=['npx tsx scripts/run-gates.ts --list']),
  # --- B1-1 token vs expect ---
  'b11-see-delete-date-assert': dict(edits=[('apps/rn/src/store/affordability.test.ts', del_lines_containing('is ready in ${o.paychecks} paychecks at the rate the engine funds', 1))],
      cmds=['npm run -s lint:finding-guards']),
  'b11-delete-pace-asserts': dict(edits=[('apps/rn/src/store/affordability.test.ts', del_lines_containing('promises ${o.perPaycheck}/paycheck, within the', 1)),
                                         ('apps/rn/src/store/affordability.test.ts', del_lines_containing('is funded ${funded} — the pace is kept', 1))],
      cmds=['npm run -s lint:finding-guards', 'npm run -s test:app']),
  'b11-delete-pace-asserts-plus-unfix': dict(edits=[('apps/rn/src/store/affordability.test.ts', del_lines_containing('promises ${o.perPaycheck}/paycheck, within the', 1)),
                                         ('apps/rn/src/store/affordability.test.ts', del_lines_containing('is funded ${funded} — the pace is kept', 1)),
                                         ('apps/rn/src/store/guardianSelectors.ts', lit("  const capacity = selectPriorityGoalCapacity(store, amount);\n  const payCycle = store.paycheck.payCycle;", "  const base0 = selectAllocation(store);\n  const capacity = base0 ? selectDiscretionary(base0) : 0;\n  const payCycle = store.paycheck.payCycle;"))],
      cmds=['npm run -s test:app']),
  # --- R5-1 (class-4 tail) ---
  'r51-shape-bnpl-only': dict(edits=[('apps/rn/src/store/payoffCelebration.ts', lit("freed: subject.recurrence === 'one-time' ? 0 :", "freed: subject.type === 'bnpl' && subject.recurrence === 'one-time' ? 0 :"))],
      cmds=['npm run -s test:app']),
  'r41-delete-freed-assert': dict(edits=[('apps/rn/src/store/payoffCelebration.test.ts', rx(r"^      eq\(\n        result\?\.kind === 'beat' \? result\.freed : null,\n        freedPerMonth,\n        `⛔ R3-4 · \$\{label\} — the beat states the money freed per MONTH, \$\$\{freedPerMonth\}`,\n      \);\n", ''))],
      cmds=['npm run -s lint:finding-guards']),
  # --- runner / caps see ---
  'rc-see-liveactivity-unwired': dict(edits=[('apps/rn/src/testing/runAppTests.ts', del_lines_containing("import('../liveActivity/liveActivitySync.test')", 1))],
      cmds=['npm run -s lint:runner-completeness']),
  'cap-see-debt-spread-derived': dict(edits=[(RC, lit('const MAX_DEBT_SPREAD_SITES = 10;', 'const MAX_DEBT_SPREAD_SITES = Object.keys(DEBT_SPREAD_OPEN).length + 4;'))],
      cmds=['npm run -s lint:cap-literals']),
  # --- debt-spread ledger ---
  'spread-cap-slack': dict(edits=[('apps/rn/src/store/sandboxScenarios.ts', rx(r"\{(\s*)\.\.\.(d|debt)\b", r"{\1...(\2)")),
                                  # the LIVENESS ledger has its own sandboxScenarios.ts row: anchor on the debt-spread row's `why`
                                  (RC, del_lines_containing("the tutorial sandbox built from the RAW real store — never a projected debt", 1))],
      cmds=['npm run -s lint:trust-claims']),
  'spread-exact-control': dict(edits=[('apps/rn/src/store/sandboxScenarios.ts', append("\nexport const plantedCopy2 = (d: { id: string }) => ({ ...d });\n"))],
      cmds=['npm run -s lint:trust-claims']),
  'spread-exact-unfixed': dict(edits=[('apps/rn/src/store/sandboxScenarios.ts', append("\nexport const plantedCopy2 = (d: { id: string }) => ({ ...d });\n")),
                                      (RC, lit('} else if (row.sites !== n) {\n    failures.push(`[debt-spread]', '} else if (false && row.sites !== n) {\n    failures.push(`[debt-spread]'))],
      cmds=['npm run -s lint:trust-claims']),
  # --- vacuous conjunct, reversed order ---
  'vac-reversed-control': dict(edits=[('apps/rn/src/store/drift.ts', append("\nimport { mayClaim } from './trustSelectors';\nexport const plantedVacuous = (s: Parameters<typeof mayClaim>[0]) =>\n  mayClaim(s, 'row-figures') && mayClaim(s, 'required-plan');\n"))],
      cmds=['npm run -s lint:trust-claims']),
  'vac-reversed-halfunfix': dict(edits=[('apps/rn/src/store/drift.ts', append("\nimport { mayClaim } from './trustSelectors';\nexport const plantedVacuous = (s: Parameters<typeof mayClaim>[0]) =>\n  mayClaim(s, 'row-figures') && mayClaim(s, 'required-plan');\n")),
                                        (RC, lit('    if (covers(b, a) || covers(a, b)) {', '    if (covers(b, a)) {'))],
      cmds=['npm run -s lint:trust-claims']),
  # --- test:gate-plants runs ---
  'gp-survivors-vac-halfunfix-spread-exact': dict(edits=[(RC, lit('    if (covers(b, a) || covers(a, b)) {', '    if (covers(b, a)) {')),
                                                         (RC, lit('} else if (row.sites !== n) {\n    failures.push(`[debt-spread]', '} else if (false && row.sites !== n) {\n    failures.push(`[debt-spread]')),
                                                         (RC, lit("  if (!debtSpreadCounts.has(rel)) failures.push(", "  if (false && !debtSpreadCounts.has(rel)) failures.push("))],
      cmds=['npm run -s test:gate-plants']),
  'gp-r52-revert-and-projected-parse': dict(edits=[(FG, lit("const waived = lenders.some((l) => namesIt(note, l) || namesIt(note, l.replace(/^S1[A-Z0-9]*-/, '').replace(/^CLASS4-/, '')));",
                                                            "const waived = lenders.some((l) => note.includes(l) || note.includes(l.replace(/^S1[A-Z0-9]*-/, '').replace(/^CLASS4-/, '')));")),
                                                   (FG, lit("    const path = line.slice(3).trim();", "    const path = line.slice(4).trim();"))],
      cmds=['npm run -s test:gate-plants']),
}

# ---- combined test:gate-plants runs (each gate-plants run costs ~20 min under four-lane load) ----
# The registry's OWN recorded un-fixes, read from the pin registry rather than retyped. Each targets a
# distinct scenario; the verdict is read per scenario line against the clean baseline run.
_REG = json.load(open(os.path.join(WT, 'scripts/finding-guards.json'), encoding='utf-8'))
def _unfixes(eid):
    return [(u['at'], lit(u['find'], u['replace'])) for u in _REG[eid]['proof']['unfix']]
PLANTS['gp-A-registry-unfixes'] = dict(
    edits=_unfixes('S1P7-57-2A-PROJECTED-STALENESS') + _unfixes('S1P7-57-2D-DEBT-SPREAD-LEDGER')
          + _unfixes('S1P7-57-2B-VACUOUS-CONJUNCT') + _unfixes('S1P7-R3-3-BORROW'),
    cmds=['npm run -s test:gate-plants'])
PLANTS['gp-B-r52-projected-parse-and-survivors'] = dict(
    edits=PLANTS['gp-r52-revert-and-projected-parse']['edits'] + PLANTS['gp-survivors-vac-halfunfix-spread-exact']['edits'],
    cmds=['npm run -s test:gate-plants'])

def _merge_same_file(edits):
    return edits  # edits apply in order to the accumulated bytes per file (see do())

def do(name):
    spec = PLANTS[name]
    files = sorted({f for f, _ in spec['edits']})
    backups = {f: open(os.path.join(WT, f), 'rb').read() for f in files}
    bdir = os.path.join(OUT, '_backup', name)
    os.makedirs(bdir, exist_ok=True)
    for f, b in backups.items():
        open(os.path.join(bdir, f.replace('/', '__')), 'wb').write(b)
    results = []
    try:
        cur = dict(backups)
        for f, fn in spec['edits']:
            cur[f] = fn(cur[f])
        for f in files:
            if cur[f] == backups[f]:
                raise RuntimeError(f'plant did not change {f}')
            open(os.path.join(WT, f), 'wb').write(cur[f])
        for i, c in enumerate(spec['cmds']):
            rc, out = run(c, f'{name}.{i}')
            results.append((c, rc))
    finally:
        for f, b in backups.items():
            open(os.path.join(WT, f), 'wb').write(b)
    for f, b in backups.items():
        if open(os.path.join(WT, f), 'rb').read() != open(os.path.join(bdir, f.replace('/', '__')), 'rb').read():
            print(f'!!! RESTORE FAILED {f}')
            sys.exit(2)
    st = subprocess.run('git status --porcelain', cwd=WT, shell=True, capture_output=True).stdout.decode()
    print(f'== {name}: restore byte-verified; git status: {st.strip() or "clean"}')
    for c, rc in results:
        print(f'   exit={rc}  {c}')

for n in sys.argv[1:]:
    try:
        do(n)
    except RuntimeError as err:
        # A plant that cannot be APPLIED is a probe fault, never a verdict. do() restores in `finally` and
        # the byte check runs only on success, so re-verify the tree here before moving on.
        st = subprocess.run('git status --porcelain', cwd=WT, shell=True, capture_output=True).stdout.decode()
        print(f'== {n}: PLANT NOT APPLIED ({err}); git status: {st.strip() or "clean"}')
        if st.strip():
            print('!!! tree not clean after a failed plant; stopping')
            sys.exit(3)
