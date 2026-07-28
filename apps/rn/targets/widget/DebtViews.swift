import SwiftUI
import WidgetKit

// MARK: - Shared pieces

/// Circular payoff-progress ring — a single-color semantic ramp (gold at 100%+, success-green below;
/// never a traffic light), mirroring the app's Progress-ring intent.
struct ProgressRing: View {
    let progress: Double
    var lineWidth: CGFloat = 8
    var showLabel: Bool = false
    var label: String = ""

    private var clamped: Double { min(1, max(0, progress)) }
    private var ringColor: Color { progress >= 1 ? Color("BrandGold") : Color("BrandSuccess") }

    var body: some View {
        ZStack {
            Circle().stroke(Color("RingTrack"), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: max(0.001, clamped))
                .stroke(ringColor, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
            if showLabel {
                Text(label)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(Color("BrandInk"))
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
            }
        }
    }
}

/// Horizontal paid-vs-total bar (Large widget). Same color rule as the ring.
struct ProgressBar: View {
    let progress: Double
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color("RingTrack"))
                Capsule()
                    .fill(progress >= 1 ? Color("BrandGold") : Color("BrandSuccess"))
                    .frame(width: max(6, geo.size.width * min(1, max(0, progress))))
            }
        }
    }
}

/// Home-screen empty state (no debts yet) — invites the user in without shouting.
struct EmptyPrompt: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Debt Planner")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Color("BrandBlue"))
            Text("Your debt-free date")
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(Color("BrandInk"))
            Text("Open the app to see your date and progress.")
                .font(.system(size: 12))
                .foregroundStyle(Color("BrandMuted"))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

// MARK: - Home-screen families

struct SmallWidgetView: View {
    let snap: DebtSnapshot
    var body: some View {
        if !snap.hasData {
            EmptyPrompt()
        } else {
            VStack(alignment: .leading, spacing: 8) {
                Text("DEBT-FREE")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(Color("BrandMuted"))
                Spacer(minLength: 0)
                HStack(alignment: .center, spacing: 10) {
                    ProgressRing(progress: snap.pctPaid, lineWidth: 7, showLabel: true, label: snap.pctLabel)
                        .frame(width: 46, height: 46)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(snap.debtFreeDate)
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundStyle(Color("BrandGold"))
                            .minimumScaleFactor(0.7)
                            .lineLimit(1)
                        Text("\(snap.remaining) left")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(Color("BrandMuted"))
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
    }
}

struct MediumWidgetView: View {
    let snap: DebtSnapshot
    var body: some View {
        if !snap.hasData {
            EmptyPrompt()
        } else {
            HStack(spacing: 16) {
                ProgressRing(progress: snap.pctPaid, lineWidth: 9, showLabel: true, label: snap.pctLabel)
                    .frame(width: 78, height: 78)
                VStack(alignment: .leading, spacing: 5) {
                    Text("DEBT-FREE DATE")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(Color("BrandMuted"))
                    Text(snap.debtFreeDate)
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundStyle(Color("BrandGold"))
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                    Text("\(snap.remaining) remaining")
                        .font(.system(size: 13))
                        .foregroundStyle(Color("BrandInk"))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
    }
}

struct LargeWidgetView: View {
    let snap: DebtSnapshot
    var body: some View {
        if !snap.hasData {
            EmptyPrompt()
        } else {
            VStack(alignment: .leading, spacing: 14) {
                Text("DEBT-FREE DATE")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color("BrandMuted"))
                HStack(alignment: .center, spacing: 16) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(snap.debtFreeDate)
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .foregroundStyle(Color("BrandGold"))
                            .minimumScaleFactor(0.6)
                            .lineLimit(1)
                        Text("\(snap.pctLabel) paid off")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(Color("BrandBlue"))
                    }
                    Spacer()
                    ProgressRing(progress: snap.pctPaid, lineWidth: 10, showLabel: true, label: snap.pctLabel)
                        .frame(width: 84, height: 84)
                }
                Divider()
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("Remaining").font(.system(size: 13)).foregroundStyle(Color("BrandMuted"))
                        Spacer()
                        Text(snap.remaining).font(.system(size: 13, weight: .semibold)).foregroundStyle(Color("BrandInk"))
                    }
                    ProgressBar(progress: snap.pctPaid).frame(height: 8)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }
}

// MARK: - Lock-screen (accessory) families
// Accessory widgets render monochrome/vibrant, so custom colors are largely ignored — lean on the
// default rendering + keep content text-forward.

struct CircularWidgetView: View {
    let snap: DebtSnapshot
    var body: some View {
        Gauge(value: min(1, max(0, snap.pctPaid))) {
            Text("Paid")
        } currentValueLabel: {
            Text(snap.hasData ? snap.pctLabel : "—")
                .minimumScaleFactor(0.6)
        }
        .gaugeStyle(.accessoryCircularCapacity)
    }
}

struct RectangularWidgetView: View {
    let snap: DebtSnapshot
    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text("Debt-free")
                .font(.headline)
                .widgetAccentable()
            Text(snap.hasData ? snap.debtFreeDate : "Add debts in app")
                .font(.body)
            if snap.hasData {
                Text("\(snap.pctLabel) paid · \(snap.remaining) left").font(.caption)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct InlineWidgetView: View {
    let snap: DebtSnapshot
    var body: some View {
        Label(text, systemImage: "flag.checkered")
    }

    private var text: String {
        guard snap.hasData else { return "Add debts in app" }
        return "\(snap.pctLabel) paid · debt-free \(snap.debtFreeDate)"
    }
}
