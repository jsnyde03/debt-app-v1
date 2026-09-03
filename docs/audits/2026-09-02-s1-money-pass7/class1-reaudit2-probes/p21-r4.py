from _boot import *
P='apps/rn/src/components/plan/PaydayGuardianCard.tsx'
G=[['npx','tsx','scripts/check-amount-collapse.ts']]
anchor = '      <Card testID="payday-guardian-card">'
# R4's plant verbatim: two individually CORRECT statements, five lines apart.
print('### R4 — 5 lines apart (the re-audit\'s own plant)')
with_plant(P, """        <Text>{String(parseAmountField(rawA))}</Text>
        <Text>a</Text>
        <Text>b</Text>
        <Text>c</Text>
        <Text>{Number(other) ?? 0}</Text>
""", G, mode='after_anchor', anchor=anchor, tail=500)
print('### R4b — 2 lines apart (inside one flatten run for certain)')
with_plant(P, """        <Text>{String(parseAmountField(rawA))}</Text>
        <Text>{Number(other) ?? 0}</Text>
""", G, mode='after_anchor', anchor=anchor, tail=500)
