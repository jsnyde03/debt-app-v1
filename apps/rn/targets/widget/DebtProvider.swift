import Foundation
import WidgetKit

/// The payload the RN app mirrors into the shared App-Group `UserDefaults` suite (see
/// `src/widget/snapshot.ts` → `WidgetSnapshot`). Field names + types map 1:1 onto the JS object;
/// `@bacons/apple-targets` writes it as JSON `Data`, so this decodes straight through `JSONDecoder`.
struct DebtSnapshot: Codable {
    var hasData: Bool
    var debtFreeDate: String
    var pctPaid: Double
    var pctLabel: String
    var remaining: String
    var updatedAt: Double

    /// Shown in the widget gallery / previews (before the user has installed data).
    static let placeholder = DebtSnapshot(
        hasData: true,
        debtFreeDate: "October 2027",
        pctPaid: 0.42,
        pctLabel: "42%",
        remaining: "$12,400",
        updatedAt: 0
    )

    /// Rendered when the user has no debts yet (or the suite can't be read).
    static let empty = DebtSnapshot(
        hasData: false,
        debtFreeDate: "—",
        pctPaid: 0,
        pctLabel: "—",
        remaining: "—",
        updatedAt: 0
    )
}

/// Reads the latest snapshot the app wrote. Must match the App Group + key in `app.json` and
/// `src/widget/widgetKeys.ts`. Any failure (no suite, no data, malformed) degrades to `.empty`.
enum DebtStore {
    static let appGroup = "group.com.jasonsnyder.debtplanner"
    static let key = "debtSnapshot"

    static func read() -> DebtSnapshot {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let data = defaults.data(forKey: key),
            let snapshot = try? JSONDecoder().decode(DebtSnapshot.self, from: data)
        else {
            return .empty
        }
        return snapshot
    }
}

struct DebtEntry: TimelineEntry {
    let date: Date
    let snapshot: DebtSnapshot
}

struct DebtProvider: TimelineProvider {
    func placeholder(in context: Context) -> DebtEntry {
        DebtEntry(date: Date(), snapshot: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (DebtEntry) -> Void) {
        let snapshot = context.isPreview ? DebtSnapshot.placeholder : DebtStore.read()
        completion(DebtEntry(date: Date(), snapshot: snapshot))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DebtEntry>) -> Void) {
        let entry = DebtEntry(date: Date(), snapshot: DebtStore.read())
        // The debt-free date only moves when the app writes new data (which itself calls
        // `reloadTimelines`), so refresh daily to keep the "as of" honest without spending the reload budget.
        let next = Calendar.current.date(byAdding: .day, value: 1, to: Date())
            ?? Date().addingTimeInterval(86_400)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}
