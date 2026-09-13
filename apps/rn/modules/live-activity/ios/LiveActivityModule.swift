import ActivityKit
import ExpoModulesCore

/**
 * 3.5.3 — the APP-SIDE ActivityKit lifecycle for the Payday Countdown Live Activity. The SwiftUI +
 * `ActivityConfiguration` live in the widget extension (`targets/widget/PaydayLiveActivity.swift`);
 * this module only starts / updates / ends the activity, driven from JS by `liveActivitySync`.
 *
 * All ActivityKit use is `#available(iOS 16.2, *)`-guarded (the `ActivityContent` API is 16.2+), so the
 * app builds + runs unchanged below that — the JS side reads `areActivitiesEnabled() == false` and the
 * sync manager no-ops. Not simulator/web-verifiable end-to-end; the real Lock Screen / Dynamic Island
 * render is device-QA at 3.5.7.
 */
public class LiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiveActivity")

    // Whether the user has Live Activities enabled (Settings) AND the OS supports them.
    Function("areActivitiesEnabled") { () -> Bool in
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    // ⛔ [.5.4f · pass-7 `C3-5`] — START / UPDATE / END ANSWER WHETHER THEY LANDED. They were synchronous
    // `Function`s that spawned a detached `Task` and returned before ActivityKit ran, so a refused request
    // could not reach JS by construction: the JS bridge's `try/catch` only ever saw a missing module, and
    // `liveActivitySync` stamped its change-gate on the attempt. `AsyncFunction` with an `async` closure
    // resolves the JS promise with the closure's `Bool`. ⚠️ Still never throws to JS — `false` is the answer.

    // Start the (single) payday countdown — ends any stale one first so only one is ever live.
    AsyncFunction("startActivity") { (content: PaydayContentRecord) async -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      await Self.endAll()
      do {
        _ = try Activity.request(
          attributes: PaydayActivityAttributes(paydayDateISO: content.paydayDateISO),
          content: ActivityContent(state: content.toState(), staleDate: nil),
          pushType: nil
        )
        return true
      } catch {
        // e.g. the user disabled Live Activities, or the per-app activity limit. JS retries on the next change.
        return false
      }
    }

    // Push a new read to the live activity (day count / Guardian state / copy).
    AsyncFunction("updateActivity") { (content: PaydayContentRecord) async -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      let state = content.toState()
      // `update` cannot fail in ActivityKit's API; what CAN is that nothing is live to take it — the user
      // dismissed it or the system ended it. That is the one `false` this can honestly return.
      let live = Activity<PaydayActivityAttributes>.activities.filter {
        $0.activityState == .active || $0.activityState == .stale
      }
      for activity in live {
        await activity.update(ActivityContent(state: state, staleDate: nil))
      }
      return !live.isEmpty
    }

    // End the countdown (payday landed, the user toggled it off, or it left the window).
    AsyncFunction("endActivity") { () async -> Bool in
      // Below 16.2 nothing can be live, so "ended" is the true answer — `false` would retry forever.
      guard #available(iOS 16.2, *) else { return true }
      await Self.endAll()
      return true
    }

    // ── The AppIntent → store queue (3.5.3.5) — the app drains what PaydayLandedIntent wrote ──
    // Returns the queued actions as a JSON string (parsed by `parsePendingActions` in JS). "[]" when empty.
    Function("readPendingActions") { () -> String in
      guard
        let defaults = UserDefaults(suiteName: Self.appGroup),
        let actions = defaults.array(forKey: Self.pendingActionsKey),
        let data = try? JSONSerialization.data(withJSONObject: actions),
        let json = String(data: data, encoding: .utf8)
      else { return "[]" }
      return json
    }

    Function("clearPendingActions") {
      UserDefaults(suiteName: Self.appGroup)?.removeObject(forKey: Self.pendingActionsKey)
    }
  }

  private static let appGroup = "group.com.jasonsnyder.debtplanner"
  private static let pendingActionsKey = "pendingActions"

  @available(iOS 16.2, *)
  private static func endAll() async {
    for activity in Activity<PaydayActivityAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }
}

/// The JS `PaydayActivityContent` payload, as an Expo `Record` (1:1 with `src/liveActivity`).
struct PaydayContentRecord: Record {
  @Field var paydayDateISO: String = ""
  @Field var daysUntilPayday: Int = 0
  @Field var countdownLabel: String = ""
  @Field var guardianState: String = "clear"
  @Field var title: String = ""
  @Field var line: String = ""
  @Field var cycleProgress: Double = 0

  @available(iOS 16.1, *)
  func toState() -> PaydayActivityAttributes.ContentState {
    PaydayActivityAttributes.ContentState(
      daysUntilPayday: daysUntilPayday,
      countdownLabel: countdownLabel,
      guardianState: guardianState,
      title: title,
      line: line,
      cycleProgress: cycleProgress
    )
  }
}
