import AppIntents
import Foundation

/// WIDGET-SIDE copy of the "Payday landed" intent (3.5.3.5) — the Live Activity's payday-day button
/// references this type. See the canonical note in `modules/live-activity/ios/PaydayLandedIntent.swift`;
/// the two copies must stay byte-for-byte identical (AppIntents route by type name + shape).
@available(iOS 17.0, *)
struct PaydayLandedIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Payday landed"
    static var description = IntentDescription("Roll your plan forward now that payday has arrived.")

    func perform() async throws -> some IntentResult {
        let suite = "group.com.jasonsnyder.debtplanner"
        let key = "pendingActions"
        if let defaults = UserDefaults(suiteName: suite) {
            var actions = defaults.array(forKey: key) as? [[String: String]] ?? []
            actions.append(["kind": "payday-landed", "id": UUID().uuidString])
            defaults.set(actions, forKey: key)
        }
        return .result()
    }
}
