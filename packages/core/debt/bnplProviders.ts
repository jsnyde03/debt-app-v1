/**
 * The BNPL providers the app knows, owned once.
 *
 * ⛔ **T8 / audit L2-4 — this list existed twice, in two trees, for two different jobs.**
 * `DebtSheet`'s `PROVIDERS` supplies the picker AND is the string PERSISTED as `bnplProvider`;
 * `parseStatementText`'s `ISSUERS` is the OCR match dictionary. Six names appeared in both. Adding a
 * provider to the picker without adding it to the scanner produces a debt the user can file by hand and
 * the scanner silently never recognises — a divergence with no symptom at the point it is created, which
 * is the L2 class exactly.
 *
 * ⚠️ **`value` is PERSISTED DATA, not copy.** Renaming one changes what is written to the store and
 * breaks the match against already-saved debts; `label` is the free half. That asymmetry is why they are
 * separate fields rather than one string used twice.
 *
 * ⚠️ **The picker's "Not specified" and "Other" are deliberately NOT here.** They are picker affordances,
 * not providers — feeding them to the scanner would have it match the literal word "Other" on a
 * statement. The sheet composes them around this list.
 */
export const BNPL_PROVIDERS: { value: string; label: string }[] = [
	{ value: "Klarna", label: "Klarna" },
	{ value: "Affirm", label: "Affirm" },
	{ value: "Afterpay", label: "Afterpay" },
	{ value: "PayPal", label: "PayPal Pay in 4" },
	{ value: "Zip", label: "Zip" },
	{ value: "Sezzle", label: "Sezzle" },
];

/** The stored values only — what the OCR dictionary composes with its card issuers. */
export const BNPL_PROVIDER_VALUES: string[] = BNPL_PROVIDERS.map((p) => p.value);
