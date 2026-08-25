/**
 * The ONE owner of *"which goal is the emergency fund"*.
 *
 * ⛔ **THE APP MODELS EXACTLY ONE EMERGENCY FUND, AND THE TYPE PERMITS MANY.** `starterEmergencyTarget`
 * is a single number, the starter and fuller tranches are two halves of one pot, and the recommended
 * surface merges them into one action. But `Goal['type']` is a free choice on every goal, and `GoalSheet`
 * guards only name-uniqueness — so *"Emergency Fund"* plus *"Car repair fund"*, also typed emergency, is
 * an ordinary thing to build.
 *
 * ⚡ **Before P6.8.9.7.11.12 the second one was funded by NO rung at all** [A-J2-4]: the emergency rungs
 * take `find`'s first match, and the two sinking-fund rungs required `type === "savings"`. Every paycheck
 * allocated it exactly `$0` while Money drew it a progress bar. ⚠️ v1.6 has the identical defect, so a
 * migrating user can already be in this state — which is why the fix funds the goal rather than refusing
 * to create it (🎯 2026-08-25).
 *
 * ⚠️ **The rule is stated as a NEGATIVE on purpose:** everything that is not *the* emergency fund funds as
 * a sinking fund. Written as a positive (*"savings, or an emergency goal that is not the first"*) it has
 * to be kept in sync with the `Goal['type']` union at every site; written this way a third type would
 * fall through to the savings rungs rather than to nothing, which is the safe direction.
 */

type GoalLike = { type: "emergency" | "savings" };

/**
 * The emergency fund the waterfall means — the FIRST `emergency`-typed goal in store order.
 *
 * ⚠️ Store order, not "the biggest" or "the oldest", because that is what the engine has always used and
 * changing it would silently move an existing user's money between two goals.
 */
export function primaryEmergencyGoal<T extends GoalLike>(goals: readonly T[]): T | undefined {
	return goals.find((goal) => goal.type === "emergency");
}

/**
 * Does this goal fund through the SINKING-FUND rungs (priority before debt, ordinary savings after)?
 *
 * ⚠️ Compared by REFERENCE, not by id. Goal ids are user data and a hostile or hand-edited store can hold
 * two rows carrying the same one; identity cannot be spoofed, and every caller reads both values out of
 * the same array.
 */
export function fundsAsSinkingFund<T extends GoalLike>(goal: T, primary: T | undefined): boolean {
	return goal !== primary;
}
