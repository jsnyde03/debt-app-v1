import AppIntents
import Foundation

/// WIDGET-SIDE copy of the "Payday landed" intent (3.5.3.5) — the Live Activity's payday-day button
/// references this type. See the canonical note in `modules/live-activity/ios/PaydayLandedIntent.swift`;
/// the two copies must stay byte-for-byte identical (AppIntents route by type name + shape).
@available(iOS 17.0, *)
struct PaydayLandedIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Payday landed"
    static var description = IntentDescription("Roll your plan forward now that payday has arrived.")

    /// ⛔ [.5.7.4a.3 · pass-6 C3-6] The payday the Lock Screen showed when this was tapped. The app rolls only while it
    /// is still the plan's next payday, so a second tap on a Lock Screen that has not refreshed lands nothing. Nil when
    /// run from Shortcuts, where the app falls back to asking whether payday has arrived.
    @Parameter(title: "Payday")
    var paydayDateISO: String?

    init() {}

    init(paydayDateISO: String) {
        self.paydayDateISO = paydayDateISO
    }

    func perform() async throws -> some IntentResult {
        let suite = "group.com.jasonsnyder.debtplanner"
        let key = "pendingActions"
        if let defaults = UserDefaults(suiteName: suite) {
            // `[String: Any]` (not `[String: String]`) so this queue can also hold the log-payment action
            // (which carries a numeric amount) — a `[String: String]` cast would fail + wipe those. (3.5.5)
            //
            // ⛔ [S1.13.7.11 · pass-6 C3-7] — AND THE `?? []` THAT DOES THE WIPING WAS STILL HERE. The
            // element type was widened on both sides; this was not. An unreadable queue was replaced by an
            // empty array and written straight back, deleting whatever was already in it — the very
            // failure the comment above says the widening prevents. A queue that is present and will not
            // read is left ALONE: this action is lost, which is recoverable, rather than taking the
            // others with it, which is not.
            let raw = defaults.object(forKey: key)
            if raw == nil || raw as? [[String: Any]] != nil {
                var actions = raw as? [[String: Any]] ?? []
                var action: [String: Any] = ["kind": "payday-landed", "id": UUID().uuidString]
                if let date = paydayDateISO, !date.isEmpty { action["paydayDateISO"] = date }
                actions.append(action)
                defaults.set(actions, forKey: key)
            }
        }
        return .result()
    }
}
