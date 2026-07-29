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

    // Start the (single) payday countdown — ends any stale one first so only one is ever live.
    Function("startActivity") { (content: PaydayContentRecord) in
      guard #available(iOS 16.2, *) else { return }
      Task {
        await Self.endAll()
        do {
          _ = try Activity.request(
            attributes: PaydayActivityAttributes(paydayDateISO: content.paydayDateISO),
            content: ActivityContent(state: content.toState(), staleDate: nil),
            pushType: nil
          )
        } catch {
          // Best-effort: a failed request (e.g. the user disabled Live Activities) must not throw to JS.
        }
      }
    }

    // Push a new read to the live activity (day count / Guardian state / copy).
    Function("updateActivity") { (content: PaydayContentRecord) in
      guard #available(iOS 16.2, *) else { return }
      let state = content.toState()
      Task {
        for activity in Activity<PaydayActivityAttributes>.activities {
          await activity.update(ActivityContent(state: state, staleDate: nil))
        }
      }
    }

    // End the countdown (payday landed, the user toggled it off, or it left the window).
    Function("endActivity") {
      guard #available(iOS 16.2, *) else { return }
      Task { await Self.endAll() }
    }
  }

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
