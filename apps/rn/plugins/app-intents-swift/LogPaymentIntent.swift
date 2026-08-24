import AppIntents
import Foundation

/// 3.5.5.3 / 3.5.5.4 — the voice "log a payment" flow. Siri disambiguates WHICH debt via a `DebtEntity`
/// (backed by the App-Group snapshot's `debtsJson`), then queues a `log-payment` action into the same
/// pending-actions queue the app drains on foreground (the reusable 3.5.3.5 bridge → `logManualPayment`
/// + Undo). PREMIUM (gated by the snapshot's `isPremium`; the in-app "Log payment" stays free).

private enum SnapshotStore {
    static let appGroup = "group.com.jasonsnyder.debtplanner"

    /// The snapshot as a loose dictionary (the widget's Codable is a separate target; this only needs a
    /// couple of keys, so decode loosely rather than duplicate the whole struct).
    static func snapshot() -> [String: Any]? {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let data = defaults.data(forKey: "debtSnapshot"),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return nil }
        return json
    }

    static var isPremium: Bool { (snapshot()?["isPremium"] as? Bool) ?? false }

    struct DebtRow: Decodable { let id: String; let name: String; let balance: String }
    static func debts() -> [DebtRow] {
        guard
            let debtsJson = snapshot()?["debtsJson"] as? String,
            let data = debtsJson.data(using: .utf8),
            let rows = try? JSONDecoder().decode([DebtRow].self, from: data)
        else { return [] }
        return rows
    }
}

/// 3.5.5.3 — a debt Siri can name/pick.
@available(iOS 16.0, *)
struct DebtEntity: AppEntity {
    let id: String
    let name: String
    let balance: String

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Debt"
    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name)", subtitle: "\(balance)")
    }
    static var defaultQuery = DebtEntityQuery()
}

@available(iOS 16.0, *)
struct DebtEntityQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [DebtEntity] {
        SnapshotStore.debts()
            .filter { identifiers.contains($0.id) }
            .map { DebtEntity(id: $0.id, name: $0.name, balance: $0.balance) }
    }

    func suggestedEntities() async throws -> [DebtEntity] {
        SnapshotStore.debts().map { DebtEntity(id: $0.id, name: $0.name, balance: $0.balance) }
    }
}

/// 3.5.5.4 — PREMIUM voice log-a-payment.
@available(iOS 16.0, *)
struct LogPaymentIntent: AppIntent {
    static var title: LocalizedStringResource = "Log a payment"
    static var description = IntentDescription("Log a payment toward one of your debts.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Amount") var amount: Double
    @Parameter(title: "Debt") var debt: DebtEntity

    static var parameterSummary: some ParameterSummary {
        Summary("Log \(\.$amount) toward \(\.$debt)")
    }

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard SnapshotStore.isPremium else {
            return .result(dialog: "Logging a payment by voice is a Premium feature — open Debt Planner to unlock it.")
        }
        guard amount > 0 else {
            return .result(dialog: "That amount doesn’t look right — try again.")
        }
        // A Siri intent can't touch the JS/MMKV store, so queue it for the app to apply on next
        // foreground (drains via `logManualPayment`, with Undo).
        if let defaults = UserDefaults(suiteName: SnapshotStore.appGroup) {
            var actions = defaults.array(forKey: "pendingActions") as? [[String: Any]] ?? []
            actions.append(["kind": "log-payment", "id": UUID().uuidString, "debtId": debt.id, "amount": amount])
            defaults.set(actions, forKey: "pendingActions")
        }
        return .result(dialog: "Logged \(amount.formatted(.currency(code: "USD"))) toward \(debt.name). Open Debt Planner to see it.")
    }
}
