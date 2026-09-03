from _boot import *
P='scripts/run-gates.ts'
orig = read_bytes(P)
nl = b'\r\n' if orig.count(b'\r\n')>0 else b'\n'
try:
    s = orig.decode('utf-8')
    tgt = "    'lint:money',\n"
    assert tgt in s, 'anchor'
    # R13's plant: delete from GATES, name it in a live (non-comment) string elsewhere.
    s2 = s.replace(tgt, "", 1)
    s2 = s2.replace("const GATES", "const PARKED_TEMPORARILY = ['lint:money'];\nconst GATES", 1)
    open(P,'wb').write(s2.encode('utf-8'))
    print('PLANT-APPLIED')
    code,out = run(['npx','tsx','scripts/check-runner-completeness.ts'])
    print(out[-900:]); print('EXIT=',code)
finally:
    print('RESTORE_OK=', restore(P, orig))
