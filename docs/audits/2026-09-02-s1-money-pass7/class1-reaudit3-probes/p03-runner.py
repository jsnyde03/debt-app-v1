from plant import *

G = 'scripts/check-runner-completeness.ts'
R = 'scripts/run-gates.ts'
RR = 'packages/core/testing/runRegressionTests.ts'

# --- R13 control: gate deleted from GATES but named in a live const
with Plant(R) as p:
    p.replace("    'lint:money',", "    // parked\nconst PARKED_TEMPORARILY = ['lint:money'];\n")
    show('R13 control (deleted from GATES, named live)', *gate('check-runner-completeness'), grep='lint:money')

# --- N-3 un-fix 1: production drops the chainRegion call (fixture untouched)
orig_g = read_bytes(G)
with Plant(G) as pg:
    pg.replace('const runGates = chainRegion(runGatesRaw);', 'const runGates: string | null = runGatesRaw;')
    show('N-3 un-fix1 clean tree', *gate('check-runner-completeness'), grep='runner completeness')
    saved = read_bytes(G)
    with Plant(R) as p:
        p.replace("    'lint:money',", "    // parked\nconst PARKED_TEMPORARILY = ['lint:money'];\n")
        show('N-3 un-fix1 + R13 defect', *gate('check-runner-completeness'), grep='runner completeness')
    assert read_bytes(G) == saved

# --- N-3 un-fix 2: production drops stripCommentsOnly on run-gates.ts
with Plant(G) as pg:
    pg.replace("const runGatesRaw = stripCommentsOnly(readFileSync(join(REPO_ROOT, 'scripts/run-gates.ts'), 'utf8'));",
               "const runGatesRaw = readFileSync(join(REPO_ROOT, 'scripts/run-gates.ts'), 'utf8');")
    show('N-3 un-fix2 clean tree', *gate('check-runner-completeness'), grep='runner completeness')
    saved = read_bytes(G)
    with Plant(R) as p:
        p.replace("    'lint:money',", "    // 'lint:money',")
        show('N-3 un-fix2 + D1-1 defect', *gate('check-runner-completeness'), grep='runner completeness')
    assert read_bytes(G) == saved

# --- N-3 un-fix 3: importsOf drops stripCommentsOnly
with Plant(G) as pg:
    pg.replace('  return r.imports(stripCommentsOnly(rawSrc), r.runner);', '  return r.imports(rawSrc, r.runner);')
    show('N-3 un-fix3 clean tree', *gate('check-runner-completeness'), grep='runner completeness')
    saved = read_bytes(G)
    with Plant(RR) as p:
        p.replace('import "./testAbuseScenarios";', '// import "./testAbuseScenarios";')
        show('N-3 un-fix3 + D1-2 defect', *gate('check-runner-completeness'), grep='runner completeness')
    assert read_bytes(G) == saved
assert read_bytes(G) == orig_g, 'G NOT RESTORED'
print('G restored byte-identical:', read_bytes(G) == orig_g)
