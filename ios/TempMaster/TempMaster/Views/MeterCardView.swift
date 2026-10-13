import SwiftUI

extension Color {
    init(hex: UInt, opacity: Double = 1) {
        self.init(.sRGB,
                  red: Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8) & 0xFF) / 255,
                  blue: Double(hex & 0xFF) / 255,
                  opacity: opacity)
    }
}

/// L-08: meter card — display name, type tag, temp/humidity/battery capsules,
/// chart (active only), last-updated line or stale placeholders.
struct MeterCardView: View {
    let meter: MeterDevice
    let history: [MeterReading]
    let timeScale: TimeScale
    let isStale: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                HStack(spacing: 6) {
                    Text(verbatim: DisplayNames.displayName(for: meter.deviceName))
                        .font(.headline)
                    if isStale {
                        Text("stale.badge".localized)
                            .font(.caption2)
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .foregroundStyle(.white)
                            .background(Color.orange)
                            .clipShape(Capsule())
                    }
                }
                .layoutPriority(1)
                Spacer(minLength: 8)
                Text(verbatim: meter.deviceType)
                    .font(.caption2)
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .foregroundStyle(.secondary)
                    .background(Color(.systemGray5))
                    .clipShape(Capsule())
            }

            HStack(spacing: 6) {
                if let temp = meter.currentTemperature {
                    statCapsule(text: "\(NumberFormatting.jsString(temp))°C",
                                color: Color(hex: 0xd9534f))
                }
                if let hum = meter.currentHumidity {
                    statCapsule(text: "\(hum)%", color: Color(hex: 0x5bc0de))
                }
                if let bat = meter.battery {
                    statCapsule(text: "\(bat)%", color: Color(hex: 0x5cb85c))
                }
            }

            if isStale {
                Text("stale.no_history".localized)
                    .font(.subheadline)
                    .foregroundStyle(Color(hex: 0x8a6d3b))
            } else {
                MeterChartView(history: history, timeScale: timeScale,
                               deviceID: meter.deviceID)
            }

            if let lastUpdated = meter.lastUpdated {
                Text(verbatim: String(
                    format: "meter.last_updated_fmt".localizedString,
                    lastUpdated.formatted(date: .abbreviated, time: .standard)))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else if isStale {
                Text("stale.no_value".localized)
                    .font(.subheadline)
                    .foregroundStyle(Color(hex: 0x8a6d3b))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8)
            .stroke(Color(.systemGray4)))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("meter-card-\(meter.deviceID)")
    }

    private func statCapsule(text: String, color: Color) -> some View {
        Text(text)
            .font(.subheadline)
            .padding(.horizontal, 8).padding(.vertical, 4)
            .foregroundStyle(.white)
            .background(color)
            .clipShape(Capsule())
    }
}
