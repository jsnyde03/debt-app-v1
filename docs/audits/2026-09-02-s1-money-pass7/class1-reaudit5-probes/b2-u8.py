"""U8 re-audit: can the two-occurrence pin be satisfied while the composition is broken?

The pin (check-runner-completeness.ts ~:355) requires each of two site strings to appear at
least TWICE in the gate's own comment-stripped source. One occurrence is the pin's own array
literal; the other is meant to be production's call. A decoy string literal supplies a third.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import plant

ROOT = r'C:\Users\Jason\debt-app-v1'
GATE = os.path.join(ROOT, 'scripts', 'check-runner-completeness.ts')
RUNGATES = os.path.join(ROOT, 'scripts', 'run-gates.ts')
REGR = os.path.join(ROOT, 'packages', 'core', 'testing', 'runRegressionTests.ts')
CRLF = chr(13) + chr(10)
Q = chr(39)
CMD = 'npx tsx scripts/check-runner-completeness.ts'


def show(label):
    c, o = plant.run(CMD)
    ls = plant.pick(o, 'runner completeness', 'production no longer calls', 'lint:money',
                    'testPlannerStateHardening')[:3]
    print('%-46s exit=%d :: %s' % (label, c, ls))
    return c


show('BASELINE clean')

# ── the real defect alone: a gate commented out of GATES ─────────────────────────────────
plant.replace(RUNGATES, "    'lint:money',", "    // 'lint:money',")
show('D1-1 defect only (control: must be RED)')
print('  ', plant.restore(RUNGATES))

# ── un-fix route: drop the strip AND satisfy the pin with a decoy literal ────────────────
plant.replace(GATE, 'const runGates = chainedGatesFrom(runGatesFile);',
              'const runGates = chainRegion(runGatesFile);' + CRLF +
              'const __decoy = ' + Q + 'chainedGatesFrom(runGatesFile)' + Q + ';' + CRLF +
              'void __decoy;')
plant.replace(RUNGATES, "    'lint:money',", "    // 'lint:money',")
show('D1-1 un-fix + decoy literal + defect')
print('  ', plant.restore(GATE))
print('  ', plant.restore(RUNGATES))

# ── the same for D1-2 ───────────────────────────────────────────────────────────────────
plant.replace(REGR, 'import "./testPlannerStateHardening";', '// import "./testPlannerStateHardening";')
show('D1-2 defect only (control: must be RED)')
print('  ', plant.restore(REGR))

plant.replace(GATE, '  const imported = wiredIn(r);',
              '  const imported = r.imports(readFileSync(join(REPO_ROOT, r.runner), ' + Q + 'utf8' + Q + '), r.runner);' + CRLF +
              '  const __decoy2 = ' + Q + 'const imported = wiredIn(r);' + Q + ';' + CRLF +
              '  void __decoy2;')
plant.replace(REGR, 'import "./testPlannerStateHardening";', '// import "./testPlannerStateHardening";')
show('D1-2 un-fix + decoy literal + defect')
print('  ', plant.restore(GATE))
print('  ', plant.restore(REGR))
show('AFTER RESTORE (must be green again)')
