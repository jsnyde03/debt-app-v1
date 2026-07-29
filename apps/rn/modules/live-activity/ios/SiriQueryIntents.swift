import AppIntents
import Foundation

/// 3.5.5.1 — the Siri / Shortcuts query App Shortcuts. They read the SAME App-Group widget snapshot the
/// widget renders (`debtSnapshot`, written by the RN app as JSON `Data` via `ExtensionStorage`) and speak
/// the answer — no app launch. Two are FREE glances; the paycheck read is PREMIUM (gated by data: the RN
/// snapshot only fills `guardianSpoken` for premium, so an empty value → a value-led upsell here).

/// The subset of the widget snapshot the queries need. Extra keys in the JSON are ignored by Codable.
private struct DebtSnapshotRead: Codable {
    var hasData: Bool = false
    var debtFreeDate: String = "—"
    var remaining: String = "$0"
    var guardianSpoken: String = ""

    static func load() -> DebtSnapshotRead {
        guard
            let defaults = UserDefaults(suiteName: "group.com.jasonsnyder.debtplanner"),
            let data = defaults.data(forKey: "debtSnapshot"),
            let snap = try? JSONDecoder().decode(DebtSnapshotRead.self, from: data)
        else { return DebtSnapshotRead() }
        return snap
    }
}

/// FREE — "What's my debt-free date?"
@available(iOS 16.0, *)
struct DebtFreeDateIntent: AppIntent {
    static var title: LocalizedStringResource = "Check debt-free date"
    static var description = IntentDescription("Hear your projected debt-free date.")
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let snap = DebtSnapshotRead.load()
        if !snap.hasData {
            return .result(dialog: "Add a debt in Debt Planner to see your debt-free date.")
        }
        if snap.debtFreeDate == "Debt-free!" {
            return .result(dialog: "You're debt-free — nicely done.")
        }
        return .result(dialog: "You're on track to be debt-free by \(snap.debtFreeDate).")
    }
}

/// FREE — "How much debt is left?"
@available(iOS 16.0, *)
struct RemainingDebtIntent: AppIntent {
    static var title: LocalizedStringResource = "Check remaining debt"
    static var description = IntentDescription("Hear how much debt you have left.")
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let snap = DebtSnapshotRead.load()
        if !snap.hasData {
            return .result(dialog: "You don't have any debts in Debt Planner yet.")
        }
        return .result(dialog: "You have \(snap.remaining) in debt remaining.")
    }
}

/// PREMIUM — "Am I okay this paycheck?" (the Payday Guardian read).
@available(iOS 16.0, *)
struct PaycheckCheckIntent: AppIntent {
    static var title: LocalizedStringResource = "Check this paycheck"
    static var description = IntentDescription("Hear the Payday Guardian's read for this paycheck.")
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let snap = DebtSnapshotRead.load()
        if snap.guardianSpoken.isEmpty {
            return .result(dialog: "Seeing your paycheck read is a Premium feature — open Debt Planner to unlock the Payday Guardian.")
        }
        return .result(dialog: IntentDialog(stringLiteral: snap.guardianSpoken))
    }
}

/// Registers the queries as auto-discoverable App Shortcuts (zero setup; surface in Spotlight/Shortcuts).
@available(iOS 16.0, *)
struct DebtPlannerAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: DebtFreeDateIntent(),
            phrases: [
                "When am I debt-free in \(.applicationName)",
                "What's my debt-free date in \(.applicationName)",
            ],
            shortTitle: "Debt-free date",
            systemImageName: "calendar"
        )
        AppShortcut(
            intent: RemainingDebtIntent(),
            phrases: [
                "How much debt is left in \(.applicationName)",
                "How much do I owe in \(.applicationName)",
            ],
            shortTitle: "Remaining debt",
            systemImageName: "creditcard"
        )
        AppShortcut(
            intent: PaycheckCheckIntent(),
            phrases: [
                "Am I okay this paycheck in \(.applicationName)",
                "Check my paycheck in \(.applicationName)",
            ],
            shortTitle: "This paycheck",
            systemImageName: "checkmark.shield"
        )
    }
}
