import ActivityKit
import SwiftUI
import WidgetKit

/// The Payday Countdown Live Activity (3.5.3) — the imminent-payday EVENT surface, distinct from the
/// always-on debt-free-date widget. Premium-only, auto-started in the final ~3-day run-up (the app
/// drives the lifecycle). Calm, day-granular; the Guardian STATE DOT is the only moving color
/// (calm-data-viz — match motion to the surface's job). Joins `DebtWidgetBundle`.
struct PaydayLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PaydayActivityAttributes.self) { context in
            PaydayLockScreenView(state: context.state)
                .widgetURL(URL(string: "debtplannerrn://"))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    GuardianDot(state: context.state.guardianState)
                        .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.countdownLabel)
                        .font(.caption).fontWeight(.semibold)
                        .foregroundStyle(Color("BrandMuted"))
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(context.state.title)
                            .font(.headline).foregroundStyle(Color("BrandInk"))
                        Text(context.state.line)
                            .font(.caption).foregroundStyle(Color("BrandMuted"))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            } compactLeading: {
                GuardianDot(state: context.state.guardianState)
            } compactTrailing: {
                Text(context.state.countdownLabel)
                    .font(.caption2).foregroundStyle(Color("BrandMuted"))
            } minimal: {
                GuardianDot(state: context.state.guardianState)
            }
            .widgetURL(URL(string: "debtplannerrn://"))
        }
    }
}

/// The Lock Screen / banner presentation.
private struct PaydayLockScreenView: View {
    let state: PaydayActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "flag.checkered")
                    .font(.caption).foregroundStyle(Color("BrandGold"))
                Text("PAYDAY \(state.countdownLabel.uppercased())")
                    .font(.caption).fontWeight(.semibold)
                    .foregroundStyle(Color("BrandMuted"))
                Spacer()
            }
            HStack(spacing: 8) {
                GuardianDot(state: state.guardianState)
                Text(state.title)
                    .font(.headline).foregroundStyle(Color("BrandInk"))
                    .lineLimit(1)
            }
            Text(state.line)
                .font(.subheadline).foregroundStyle(Color("BrandMuted"))
                .lineLimit(2)
            ProgressView(value: state.cycleProgress)
                .tint(Color("BrandGold"))
        }
        .padding()
        .activityBackgroundTint(Color("CardBackground"))
        .activitySystemActionForegroundColor(Color("BrandInk"))
    }
}

/// The Guardian state dot — the ONLY moving color on the surface. clear → success · tight → gold ·
/// at-risk → danger, mirroring the app's Guardian palette.
private struct GuardianDot: View {
    let state: String

    private var color: Color {
        switch state {
        case "at-risk": return Color("BrandDanger")
        case "tight": return Color("BrandGold")
        default: return Color("BrandSuccess")
        }
    }

    var body: some View {
        Circle().fill(color).frame(width: 10, height: 10)
    }
}
