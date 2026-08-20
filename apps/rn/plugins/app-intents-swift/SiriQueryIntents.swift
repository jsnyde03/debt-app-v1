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
        // ⛔ [P6.4.4 · audit L1-27] MUST match `snapshot.ts`'s `debtFreeDate` sentinel exactly. The
        // exclamation mark was removed there (the app's only "!"), and this comparison is the reason the
        // sweep runs over the REPO ROOT with no directory list: a TypeScript-scoped search cannot see a
        // `.swift` file, and a silent mismatch here does not crash — Siri just stops recognising the
        // debt-free state and reads "on track to be debt-free by Debt-free" instead.
        if snap.debtFreeDate == "Debt-free" {
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
///
/// 3.7.A8 — every phrase must contain `\(.applicationName)`; that is Apple's rule and it does not bend.
/// The plan read that as "the phrases can only shrink by shrinking the NAME", which is not so — there
/// are two other levers, and both are used here:
///
///   A8.1 — `INAlternativeAppNames` (Info.plist, set in app.json). The token matches the display name
///          AND any declared alternates, so "Debt Plan" is now a valid substitution without touching
///          `CFBundleDisplayName`. The name itself stays "Debt Planner" ([D4] / A.0).
///   A8.2 — phrase STRUCTURE. "When am I debt-free in Debt Planner" is seven words with the app name
///          buried at the end. Leading with the name — "Debt Planner debt-free date" — is four, and
///          Siri matches on any listed phrase, so the natural long forms stay for people who speak
///          that way. Shortest-first, because that is the one worth learning.
///
/// ⚠️ A8.4 (device) still owes the confirmation that `\(.applicationName)` renders "Debt Planner" and
/// not `expo.name`'s "Debt Planner (RN)" — the rename went via `CFBundleDisplayName`, which is what
/// the token is documented to resolve, but that is a claim about Apple's substitution and has not been
/// run on hardware. Nothing here can verify it; the checklist must.
@available(iOS 16.0, *)
struct DebtPlannerAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: DebtFreeDateIntent(),
            phrases: [
                "\(.applicationName) debt-free date",
                "When am I debt-free in \(.applicationName)",
                "What's my debt-free date in \(.applicationName)",
            ],
            shortTitle: "Debt-free date",
            systemImageName: "calendar"
        )
        AppShortcut(
            intent: RemainingDebtIntent(),
            phrases: [
                "\(.applicationName) balance",
                "How much debt is left in \(.applicationName)",
                "How much do I owe in \(.applicationName)",
            ],
            shortTitle: "Remaining debt",
            systemImageName: "creditcard"
        )
        AppShortcut(
            intent: PaycheckCheckIntent(),
            phrases: [
                "\(.applicationName) paycheck check",
                "Am I okay this paycheck in \(.applicationName)",
                "Check my paycheck in \(.applicationName)",
            ],
            shortTitle: "This paycheck",
            systemImageName: "checkmark.shield"
        )
        // No leading-name short form here, deliberately: this is the one ACTION intent, and people
        // reach for an action by its verb. "Debt Planner log a payment" is shorter and reads worse.
        AppShortcut(
            intent: LogPaymentIntent(),
            phrases: [
                "Log a payment in \(.applicationName)",
                "Log a debt payment in \(.applicationName)",
            ],
            shortTitle: "Log a payment",
            systemImageName: "dollarsign.circle"
        )
    }
}
