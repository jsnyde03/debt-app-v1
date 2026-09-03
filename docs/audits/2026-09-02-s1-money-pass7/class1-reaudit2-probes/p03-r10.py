from _boot import *
import io
P='apps/rn/src/components/plan/WindfallSheet.tsx'
orig = read_bytes(P)
try:
    # R10's substitution: the permitted PREDICATE becomes ?? -1 (so its reason no longer
    # describes anything), and a DISHONEST collapse with the SAME expression text is stored.
    s = orig.decode('utf-8')
    s2 = s.replace('  const n = parseAmountField(amount) ?? 0;\r\n',
                   '  const n = parseAmountField(amount) ?? -1;\r\n  const __stored = parseAmountField(amount) ?? 0;\r\n', 1)
    assert s2 != s, 'anchor miss'
    open(P,'wb').write(s2.encode('utf-8'))
    print('PLANT-APPLIED')
    code,out = run(['npx','tsx','scripts/check-amount-collapse.ts'])
    print(out[-1200:]); print('EXIT=',code)
finally:
    print('RESTORE_OK=', restore(P, orig))
