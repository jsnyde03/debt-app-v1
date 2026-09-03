from _boot import *
# D1-4: a SECOND collapse added to the ALLOWED file must red.
with_plant('apps/rn/src/components/plan/WindfallSheet.tsx',
"""
const __d14Planted = parseAmountField(amount) ?? 0;
""",
[['npx','tsx','scripts/check-amount-collapse.ts']])
