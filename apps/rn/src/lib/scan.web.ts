/**
 * Web behavior for §2.8 scan-to-prefill. There's no on-device document scanner / Apple Vision on web,
 * so instead of hiding the feature entirely on the web (demo + verification) surface, `scanStatement`
 * returns a realistic SAMPLE statement — so the scan → parse → prefill → confirm flow is fully
 * demonstrable and screenshottable here, while the real OCR is the iOS-native path (`scan.ts`). Same
 * export surface as `scan.ts` ([[feedback_platform_split_reexport_gap]]).
 */

/**
 * ⛔ The sample names NO REAL INSTITUTION, and that is not stylistic.
 *
 * This string ships in the web bundle that backs the public marketing embed, and it previously read
 * "Chase Freedom Unlimited / Account ending 4821 / New Balance $2,431.09 / Purchase APR 24.99%" — a
 * real bank's trademarked product name attached to fabricated financial data, on a live URL. Nothing
 * reviewed it: the strings that make it up sat in the audit's `unclassified` bucket (audit L6-2).
 *
 * "Northwind Bank" is a long-standing fictional-company name with no real issuer behind it, and the
 * figures are obviously illustrative. The flow it demonstrates is unchanged.
 */
const SAMPLE_STATEMENT = [
  'Northwind Bank · Everyday Card',
  'Account ending 0000',
  'New Balance $2,431.09',
  'Minimum Payment Due $56.00',
  'Payment Due Date August 22, 2026',
  'Purchase APR 24.99%',
].join('\n');

export async function scanStatement(): Promise<string> {
  return SAMPLE_STATEMENT;
}

export function isScanAvailable(): boolean {
  return true;
}
