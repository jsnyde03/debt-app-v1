import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { projectDebtPayoff } from "../debt/projectDebtPayoff";

function assertEqual<T>(actual: T, expected: T, label: string) {
if (actual !== expected) {
throw new Error(`${label} failed. Expected ${String(expected)}, received ${String(actual)}`);
}
}

function assertTrue(value: boolean, label: string) {
if (!value) {
throw new Error(`${label} failed.`);
}
}

function assertMoney(actual: number, expected: number, label: string) {
const roundedActual = Math.round(actual * 100) / 100;
const roundedExpected = Math.round(expected * 100) / 100;

if (roundedActual !== roundedExpected) {
throw new Error(`${label} failed. Expected $${roundedExpected}, received $${roundedActual}`);
}
}

function runAbuseScenarioTests() {
// Sloppy user: duplicate names, same dates, same amounts.
const duplicateChaos = allocatePaycheck({
paycheckAmount: 700,
currentDate: "2026-05-01",
nextPaycheckDate: "2026-05-15",
strategy: "snowball",
paycheckBuffer: 50,
expenses: [
{
id: "expense-1",
name: "Capital One",
amount: 100,
dueDate: "2026-05-10",
recurrence: "monthly",
isPaidThisCycle: false,
},
{
id: "expense-2",
name: "Capital One",
amount: 100,
dueDate: "2026-05-10",
recurrence: "monthly",
isPaidThisCycle: false,
},
],
debts: [
{
id: "debt-1",
name: "Capital One",
balance: 900,
minimumPayment: 50,
apr: 24,
dueDate: "2026-05-10",
type: "debt",
recurrence: "monthly",
isPaidThisCycle: false,
},
{
id: "debt-2",
name: "Capital One",
balance: 200,
minimumPayment: 25,
apr: 12,
dueDate: "2026-05-10",
type: "debt",
recurrence: "monthly",
isPaidThisCycle: false,
},
],
goals: [],
});

assertMoney(duplicateChaos.totalRequired, 275, "duplicate chaos total required");

assertEqual(
duplicateChaos.allocations.find((item) => item.category === "snowball")?.debtId,
"debt-2",
"duplicate chaos snowball uses debt ID, not name"
);

// Broke user: paycheck cannot cover required items.
const brokeUser = allocatePaycheck({
paycheckAmount: 100,
currentDate: "2026-05-01",
nextPaycheckDate: "2026-05-15",
strategy: "snowball",
paycheckBuffer: 50,
expenses: [
{
id: "rent",
name: "Rent",
amount: 900,
dueDate: "2026-05-05",
recurrence: "monthly",
isPaidThisCycle: false,
},
],
debts: [
{
id: "card",
name: "Card",
balance: 2000,
minimumPayment: 75,
apr: 29,
dueDate: "2026-05-08",
type: "debt",
recurrence: "monthly",
isPaidThisCycle: false,
},
],
goals: [
{
id: "goal",
name: "Emergency Fund",
targetAmount: 1000,
currentAmount: 0,
type: "emergency",
},
],
});

assertMoney(brokeUser.totalRequired, 975, "broke user total required");
assertTrue(brokeUser.shortfall > 0, "broke user has shortfall");
assertEqual(
brokeUser.allocations.some((item) => item.category === "emergency" || item.category === "starter_emergency"),
false,
"broke user should not fund goals (neither EF tranche)"
);
assertEqual(
brokeUser.allocations.some((item) => item.category === "snowball"),
false,
"broke user should not recommend extra debt payments"
);

// Power user: many expenses and many debts must remain deterministic.
const powerUser = allocatePaycheck({
paycheckAmount: 5000,
currentDate: "2026-05-01",
nextPaycheckDate: "2026-05-15",
strategy: "avalanche",
paycheckBuffer: 100,
expenses: Array.from({ length: 30 }, (_, index) => ({
id: `expense-${index + 1}`,
name: `Expense ${index + 1}`,
amount: 10,
dueDate: "2026-05-10",
recurrence: "monthly" as const,
isPaidThisCycle: false,
})),
debts: Array.from({ length: 50 }, (_, index) => ({
id: `debt-${index + 1}`,
name: `Debt ${index + 1}`,
balance: 1000 + index,
minimumPayment: 10,
apr: index === 37 ? 39 : 5,
dueDate: "2026-05-10",
type: "debt" as const,
recurrence: "monthly" as const,
isPaidThisCycle: false,
})),
goals: [],
});

assertMoney(powerUser.totalRequired, 800, "power user total required");
assertEqual(
powerUser.allocations.find((item) => item.category === "snowball")?.debtId,
"debt-38",
"power user avalanche targets highest APR debt"
);

// Sloppy user: paid items should not create shortfall pressure.
const paidItemPressure = allocatePaycheck({
paycheckAmount: 300,
currentDate: "2026-05-01",
nextPaycheckDate: "2026-05-15",
strategy: "snowball",
paycheckBuffer: 0,
expenses: [
{
id: "already-paid-rent",
name: "Rent",
amount: 1000,
dueDate: "2026-05-05",
recurrence: "monthly",
isPaidThisCycle: true,
},
],
debts: [],
goals: [],
});

assertEqual(
paidItemPressure.shortfall,
0,
"paid item pressure should not create shortfall"
);

// Overwhelmed user: all overdue, all due before paycheck.
const allOverdue = allocatePaycheck({
paycheckAmount: 1000,
currentDate: "2026-05-20",
nextPaycheckDate: "2026-05-31",
strategy: "snowball",
paycheckBuffer: 50,
expenses: [
{
id: "late-electric",
name: "Electric",
amount: 200,
dueDate: "2026-05-01",
recurrence: "monthly",
isPaidThisCycle: false,
},
{
id: "late-phone",
name: "Phone",
amount: 100,
dueDate: "2026-05-02",
recurrence: "monthly",
isPaidThisCycle: false,
},
],
debts: [
{
id: "late-card",
name: "Late Card",
balance: 1200,
minimumPayment: 80,
apr: 26,
dueDate: "2026-05-03",
type: "debt",
recurrence: "monthly",
isPaidThisCycle: false,
},
],
goals: [],
});

assertMoney(allOverdue.totalRequired, 380, "all overdue total required");
assertMoney(allOverdue.shortfall, 0, "all overdue covered by paycheck");

// Fully debt-free user should not generate projection debt work.
const debtFreeProjection = projectDebtPayoff({
startDate: "2026-05-01",
strategy: "snowball",
monthlyExtraPayment: 500,
debts: [],
});

assertEqual(debtFreeProjection.monthsToDebtFree, 0, "debt-free months");
assertEqual(debtFreeProjection.totalInterestPaid, 0, "debt-free interest");

// Toxic user data: zero minimum payment with APR should not claim success.
const toxicProjection = projectDebtPayoff({
startDate: "2026-05-01",
strategy: "avalanche",
monthlyExtraPayment: 0,
debts: [
{
id: "toxic",
name: "Toxic Debt",
balance: 5000,
minimumPayment: 0,
apr: 30,
dueDate: "2026-05-10",
type: "debt",
recurrence: "monthly",
isPaidThisCycle: false,
},
],
});

assertEqual(
toxicProjection.estimatedDebtFreeDate,
"Unable to estimate",
"toxic projection unable to estimate"
);

// Import/export abuse: JSON roundtrip with many IDs preserves identity.
const bigBackup = {
debts: Array.from({ length: 100 }, (_, index) => ({
id: `debt-${index + 1}`,
name: "Duplicate Name",
balance: 100 + index,
})),
completedRecommendedActions: [
{
targetId: "debt-88",
label: "Extra payment to Duplicate Name",
category: "snowball",
recommendedAmount: 25,
actualAmount: 25,
},
],
};

const restoredBackup = JSON.parse(JSON.stringify(bigBackup));

assertEqual(restoredBackup.debts[87].id, "debt-88", "backup preserves debt ID");
assertEqual(
restoredBackup.completedRecommendedActions[0].targetId,
"debt-88",
"backup preserves completed action target ID"
);

console.log("✅ Abuse scenario tests passed.");
}

runAbuseScenarioTests();
