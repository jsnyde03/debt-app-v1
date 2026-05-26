import { calculateMonthlyInterest } from "../debt/calculateMonthlyInterest";

function assertMoney(actual: number, expected: number, label: string) {
const roundedActual = Math.round(actual * 100) / 100;
const roundedExpected = Math.round(expected * 100) / 100;

if (roundedActual !== roundedExpected) {
throw new Error(
`${label} failed. Expected $${roundedExpected}, received $${roundedActual}`
);
}
}

export function runAprMathTests() {
assertMoney(
calculateMonthlyInterest(1000, 24),
20,
"24 APR on 1000 monthly interest"
);

assertMoney(
calculateMonthlyInterest(500, 12),
5,
"12 APR on 500 monthly interest"
);

assertMoney(
calculateMonthlyInterest(1000, 0),
0,
"0 APR has no interest"
);

assertMoney(
calculateMonthlyInterest(1234.56, 19.99),
20.57,
"decimal balance and APR monthly interest"
);

console.log("✅ APR math tests passed.");
}

runAprMathTests();
