import { suggestLean } from "@core/income/suggestLean";
// testEngineFuzz.ts:99 comment: "Single actual, no valid typical -> anchors to the MAX of the actuals"
console.log("suggestLean([1800], NaN, 0)      =", suggestLean([1800], NaN, 0).suggestedLean, " (max==median==1800 -> x0.85 = 1530)");
// The arity that distinguishes max from median, which the file never supplies:
console.log("suggestLean([1000,1000,50000],NaN,0) =", suggestLean([1000, 1000, 50000], NaN, 0).suggestedLean,
  " (median 1000 x0.85 = 850; the MAX rule the comment describes would give 42500)");
