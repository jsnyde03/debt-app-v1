import { parseStatementText } from "./parseStatementText";

function assertEqual<T>(actual: T, expected: T, label: string) {
	if (actual !== expected) {
		throw new Error(`FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
	}
	console.log(`  ✓ ${label}`);
}

function runParseStatementTests() {
	console.log("Running scan statement parser (2.8.2) tests...");

	// A realistic OCR'd credit-card statement.
	const chase = [
		"Chase Freedom Unlimited",
		"Account ending 4821",
		"New Balance $2,431.09",
		"Minimum Payment Due $56.00",
		"Payment Due Date July 22, 2026",
		"Purchase APR 24.99%",
	].join("\n");
	const p = parseStatementText(chase);
	assertEqual(p.name, "Chase", "issuer 'Chase' recognized");
	assertEqual(p.balance, 2431.09, "New Balance → 2431.09");
	assertEqual(p.minimumPayment, 56, "Minimum Payment Due → 56");
	assertEqual(p.apr, 24.99, "Purchase APR → 24.99");
	assertEqual(p.dueDate, "2026-07-22", "Payment Due Date → ISO 2026-07-22");

	// The minimum-payment label must NOT capture the (larger) balance figure, and vice-versa.
	const capOne = [
		"Capital One",
		"Statement Balance: $890.45",
		"Minimum Payment: $25.00",
		"Interest Rate 29.24%",
		"Due Date 08/05/2026",
	].join("\n");
	const c = parseStatementText(capOne);
	assertEqual(c.name, "Capital One", "issuer 'Capital One'");
	assertEqual(c.balance, 890.45, "Statement Balance → 890.45 (not the minimum)");
	assertEqual(c.minimumPayment, 25, "Minimum Payment → 25 (not the balance)");
	assertEqual(c.apr, 29.24, "Interest Rate → 29.24");
	assertEqual(c.dueDate, "2026-08-05", "Due Date 08/05/2026 → ISO");

	// APR written as "X% APR", a numeric short-year date, and a fallback name (no known issuer).
	const other = [
		"MOUNTAIN CREDIT UNION",
		"Auto Loan",
		"Current Balance $12,004.00",
		"Minimum Amount Due $312.50",
		"18.5% APR",
		"Payment Due 9-1-26",
	].join("\n");
	const o = parseStatementText(other);
	assertEqual(o.name, "MOUNTAIN CREDIT UNION", "no known issuer → first meaningful line as the name");
	assertEqual(o.balance, 12004, "Current Balance → 12004");
	assertEqual(o.minimumPayment, 312.5, "Minimum Amount Due → 312.5");
	assertEqual(o.apr, 18.5, "'18.5% APR' → 18.5");
	assertEqual(o.dueDate, "2026-09-01", "'9-1-26' → ISO 2026-09-01 (2-digit year)");

	// Partial / noisy input → only what's confidently found; nothing invented.
	const partial = parseStatementText("Discover it\nNew Balance $500.00\n(the rest was unreadable)");
	assertEqual(partial.name, "Discover", "partial: issuer found");
	assertEqual(partial.balance, 500, "partial: balance found");
	assertEqual(partial.minimumPayment, undefined, "partial: no minimum → undefined (not guessed)");
	assertEqual(partial.apr, undefined, "partial: no APR → undefined");
	assertEqual(partial.dueDate, undefined, "partial: no due date → undefined");

	// Empty / junk input → an empty object, never a throw.
	assertEqual(Object.keys(parseStatementText("")).length, 0, "empty string → {}");
	assertEqual(Object.keys(parseStatementText("no numbers here at all")).length, 1, "text-only → just the fallback name");

	console.log("✅ Scan statement parser (2.8.2) tests passed.");
}

runParseStatementTests();
