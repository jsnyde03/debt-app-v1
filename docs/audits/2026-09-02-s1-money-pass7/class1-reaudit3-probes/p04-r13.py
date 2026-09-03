from plant import *
G = 'scripts/check-runner-completeness.ts'
R = 'scripts/run-gates.ts'

def r13_plant(p):
    b = p.orig.decode('utf-8')
    assert "    'lint:money',\n".replace('\n', p.eol.decode()) in b or "'lint:money'," in b
    b2 = b.replace("    'lint:money',", "    // parked here", 1)
    b2 = b2.replace("const GATES:", "const PARKED_TEMPORARILY = ['lint:money'];\nconst GATES:".replace('\n', p.eol.decode()), 1)
    assert b2 != b
    write_bytes(p.rel, b2.encode('utf-8'))

# R13 control, production intact
with Plant(R) as p:
    r13_plant(p)
    show('R13 control (deleted from GATES, named OUTSIDE it)', *gate('check-runner-completeness'), grep='lint:money')

# N-3 un-fix1 + R13 defect
orig = read_bytes(G)
with Plant(G) as pg:
    pg.replace('const runGates = chainRegion(runGatesRaw);', 'const runGates: string | null = runGatesRaw;')
    saved = read_bytes(G)
    with Plant(R) as p:
        r13_plant(p)
        show('N-3 un-fix1 (production drops chainRegion) + R13 defect', *gate('check-runner-completeness'), grep='runner completeness')
    assert read_bytes(G) == saved
assert read_bytes(G) == orig
print('restored:', read_bytes(G) == orig)
