import AppIntents
import Foundation

/// "Payday landed" — the one-tap action (3.5.3.5) surfaced as a button on the Live Activity's payday-day
/// state (and available to Shortcuts / Siri). A Swift intent can't touch the JS/MMKV store, so it QUEUES a
/// pending action into the App Group; the app drains + applies it (`rolloverPayCycle`) on next launch /
/// foreground, with a brief Undo. `LiveActivityIntent` runs in the app process, so this app-target copy is
/// what executes.
///
/// ⚠️ DUPLICATED — a byte-for-byte copy lives at `targets/widget/PaydayLandedIntent.swift` (the widget's
/// Live Activity button references the type). AppIntents route by type name, so both copies must match.
@available(iOS 17.0, *)
struct PaydayLandedIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Payday landed"
    static var description = IntentDescription("Roll your plan forward now that payday has arrived.")

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
                actions.append(["kind": "payday-landed", "id": UUID().uuidString])
                defaults.set(actions, forKey: key)
            }
        }
        return .result()
    }
}
