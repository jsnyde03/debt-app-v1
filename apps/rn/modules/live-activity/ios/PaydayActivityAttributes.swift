import ActivityKit
import Foundation

/// APP-SIDE copy of the Payday Countdown Live Activity's data model (3.5.3). See the canonical copy at
/// `targets/widget/PaydayActivityAttributes.swift` — the two must have IDENTICAL fields. ActivityKit
/// routes by the attributes type NAME + `ContentState` Codable shape (not module identity), so the app
/// and the widget extension each compile their own copy (the accepted expo-apple-targets pattern).
///
/// The only intentional difference from the widget copy: this one is `@available(iOS 16.1, *)` because
/// the APP's deployment target may be below 16.1 (the widget target is pinned 16.1). The annotation is
/// compile-time only — it doesn't change the runtime type name/shape, so routing still matches.
@available(iOS 16.1, *)
struct PaydayActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var daysUntilPayday: Int
        var countdownLabel: String
        /// "clear" | "tight" | "at-risk".
        var guardianState: String
        var title: String
        var line: String
        var cycleProgress: Double
    }

    /// The target payday (ISO `yyyy-MM-dd`) — fixed for the life of the activity.
    var paydayDateISO: String
}
