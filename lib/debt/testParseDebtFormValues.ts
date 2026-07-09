import { parseDebtFormValues } from "./parseDebtFormValues";

function assert(condition: boolean, label: string) {
    if (!condition) {
        throw new Error(`${label} failed.`);
    }
}

function runParseDebtFormValuesTests() {
    // Clean input parses.
    const clean = parseDebtFormValues({ balance: "12000", minimumPayment: "250", apr: "24" });
    assert(clean !== null, "clean input parses");
    assert(clean?.balance === 12000, "clean balance parses to 12000");
    assert(clean?.minimumPayment === 250, "clean minimum parses");
    assert(clean?.apr === 24, "clean apr parses");

    // Comma-grouped input is tolerated, not turned into NaN (the S2 bug).
    const grouped = parseDebtFormValues({ balance: "12,000", minimumPayment: "1,250.50", apr: "24" });
    assert(grouped !== null, "comma-grouped input parses instead of producing NaN");
    assert(grouped?.balance === 12000, "12,000 parses to 12000");
    assert(grouped?.minimumPayment === 1250.5, "1,250.50 parses to 1250.5");

    // Blank APR defaults to 0.
    const blankApr = parseDebtFormValues({ balance: "500", minimumPayment: "20", apr: "" });
    assert(blankApr?.apr === 0, "blank apr defaults to 0");

    // Garbage that used to slip through as NaN is now rejected wholesale.
    assert(parseDebtFormValues({ balance: ".", minimumPayment: "20", apr: "0" }) === null, "lone dot rejected");
    assert(parseDebtFormValues({ balance: "abc", minimumPayment: "20", apr: "0" }) === null, "non-numeric rejected");
    assert(parseDebtFormValues({ balance: "", minimumPayment: "20", apr: "0" }) === null, "empty balance rejected");
    assert(parseDebtFormValues({ balance: "NaN", minimumPayment: "20", apr: "0" }) === null, "literal NaN rejected");

    // Negatives rejected (unchanged behavior, now NaN-safe).
    assert(parseDebtFormValues({ balance: "-5", minimumPayment: "20", apr: "0" }) === null, "negative balance rejected");
    assert(parseDebtFormValues({ balance: "500", minimumPayment: "-1", apr: "0" }) === null, "negative minimum rejected");
    assert(parseDebtFormValues({ balance: "500", minimumPayment: "20", apr: "-3" }) === null, "negative apr rejected");

    // Parity with the ADD path (audit #12): the EDIT parse now enforces the same guards.
    assert(parseDebtFormValues({ balance: "500", minimumPayment: "20", apr: "250" }) === null, "APR > 100 rejected");
    assert(parseDebtFormValues({ balance: "500", minimumPayment: "600", apr: "10" }) === null, "minimum > balance rejected");
    assert(parseDebtFormValues({ balance: "0", minimumPayment: "20", apr: "10" }) === null, "zero balance rejected");
    assert(parseDebtFormValues({ balance: "500", minimumPayment: "0", apr: "10" }) === null, "zero minimum rejected");
    assert(parseDebtFormValues({ balance: "500", minimumPayment: "20", apr: "100" }) !== null, "APR exactly 100 accepted");
    assert(parseDebtFormValues({ balance: "500", minimumPayment: "500", apr: "10" }) !== null, "minimum == balance accepted");

    console.log("✅ parseDebtFormValues regression tests passed.");
}

runParseDebtFormValuesTests();
