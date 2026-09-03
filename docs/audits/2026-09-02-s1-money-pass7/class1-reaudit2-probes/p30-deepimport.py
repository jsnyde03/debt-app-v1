from _boot import *
P='apps/rn/src/components/entities/debtPrefill.test.ts'
print('### control: does tsc actually READ this file? plant a type error')
with_plant(P, "\nconst __typeErr: number = 'not a number';\n", [['npm','run','typecheck:rn']], tail=700)
