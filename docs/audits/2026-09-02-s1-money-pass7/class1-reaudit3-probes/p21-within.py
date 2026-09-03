from plant import *
print('##### WITHIN_STATEMENT — is the shared bound used by anything?')
rc, out = run('git','grep','-n','WITHIN_STATEMENT','--','*.ts','*.tsx','*.json','*.md')
for l in out.splitlines(): print('   ', l.strip()[:160])
with Plant('scripts/lib/logicalLines.ts') as p:
    p.replace("export const WITHIN_STATEMENT = '[^;{}]*?';",
              "export const WITHIN_STATEMENT = 'THIS_IS_NOT_A_REGEX_BOUND_AT_ALL';")
    for g in ['check-amount-collapse','check-rounding','check-sandbox-writes','check-fixture-dates','check-local-dates','check-store-id-writes']:
        rc, out = gate(g)
        print(f'   {g:26} EXIT={rc}')
    rc, out = run('npx','tsx','scripts/test-wrap-escapes.ts')
    print(f'   {"test:wrap-escapes":26} EXIT={rc}')
    rc, out = run('npm','run','typecheck')
    print(f'   {"typecheck":26} EXIT={rc}')
