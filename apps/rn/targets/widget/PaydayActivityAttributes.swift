import ActivityKit
import Foundation

/// The Payday Countdown Live Activity's data model (3.5.3). Static attributes never change over an
/// activity's life; `ContentState` is the mutable payload the app pushes on each update.
///
/// ⚠️ DUPLICATED — a BYTE-FOR-BYTE copy lives at `modules/live-activity/ios/PaydayActivityAttributes.swift`.
/// ActivityKit routes an activity to its renderer by the attributes type NAME + `ContentState` Codable
/// shape (NOT the module-qualified Swift identity), so the app (which calls `Activity.request`) and this
/// widget extension (which renders it) each compile their own identical copy — the accepted
/// expo-apple-targets pattern. Keep the two in sync; the `ContentState` fields MUST match
/// `PaydayActivityContent` in `src/liveActivity/paydayActivityContent.ts` (the JS builds this payload).
struct PaydayActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var daysUntilPayday: Int
        var countdownLabel: String
        /// "clear" | "tight" | "at-risk" — drives the state dot (the only moving color).
        var guardianState: String
        var title: String
        var line: String
        /// 0…1 through the pay cycle.
        var cycleProgress: Double
    }

    /// The target payday (ISO `yyyy-MM-dd`) — fixed for the life of the activity.
    var paydayDateISO: String
}
