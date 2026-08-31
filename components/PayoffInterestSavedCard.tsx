import { formatCurrency } from "@core/utils/formatCurrency";
import type { InterestSaved } from "@core/debt/computeInterestSaved";

/**
 * ⛔ **S1.13.7.5 [pass-6 `D3-3`] — `S1.10.6.7.4`'s BENEFIT-CLAIM ROUNDING FIX REACHED ONE OF THIS
 * FUNCTION'S TWO DEFINITIONS.**
 *
 * `formatMonths` exists exactly twice in the repo. The RN copy floors — `Math.floor(months / 12)` — for
 * the recorded reason that a **benefit claim must never round in the app's own favour**. This copy still
 * rounded, so **"30 months saved" read as "3 years"**, overstating the saving by a fifth.
 *
 * ⚠️ Not imported from the RN tree: this file is the legacy root, `P6.11` deletes it, and adding a new
 * cross-tree dependency now would make that deletion harder rather than easier. The rule is duplicated
 * deliberately and the duplication is stated, which is the honest form of a copy that has a scheduled end.
 */
function formatMonths(months: number): string {
    if (months < 24) return `${months} month${months === 1 ? "" : "s"}`;
    return `${Math.floor(months / 12)} years`;
}

/**
 * Interest-Saved Momentum Ledger — the FREE headline. Shows what the current
 * payoff plan saves vs. paying only minimums (the motivating core value, never
 * paywalled). Renders nothing when there's no meaningful saving to claim.
 */
export function PayoffInterestSavedCard({ interestSaved }: { interestSaved: InterestSaved }) {
    if (interestSaved.kind === "none") return null;

    if (interestSaved.kind === "payoff-enabling") {
        return (
            <div className="interest-saved-card interest-saved-enabling" aria-label="Interest saved">
                <span className="interest-saved-eyebrow">Your plan is working</span>
                <p className="interest-saved-enabling-line">
                    Minimum payments alone would <strong>never</strong> clear your debt — your plan gets
                    you debt-free by <strong>{interestSaved.debtFreeDate}</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className="interest-saved-card" aria-label="Interest saved">
            <span className="interest-saved-eyebrow">Paying extra saves you</span>
            <div className="interest-saved-amount">{formatCurrency(interestSaved.interestSaved)}</div>
            <p className="interest-saved-sub">
                in interest
                {interestSaved.monthsSaved > 0 && (
                    <>
                        {" "}and <strong>{formatMonths(interestSaved.monthsSaved)}</strong>
                    </>
                )}{" "}
                vs. minimum payments
            </p>
        </div>
    );
}
