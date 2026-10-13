import SwiftUI

struct MeterCardView: View {
    let meter: MeterDevice
    let isStale: Bool
    let history: [MeterReading]
    let timeScale: TimeScale

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(verbatim: DisplayNames.displayName(for: meter.deviceName))
                        .font(.headline)
                        .accessibilityIdentifier("meterName_\(meter.deviceId)")
                    if isStale {
                        Text(verbatim: L10n.text("stale_badge"))
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(red: 0.94, green: 0.68, blue: 0.31).opacity(0.25))
                            .clipShape(Capsule())
                            .accessibilityIdentifier("staleBadge_\(meter.deviceId)")
                    }
                }
                Spacer(minLength: 8)
                Text(verbatim: meter.deviceType)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.gray.opacity(0.14))
                    .clipShape(Capsule())
                    .accessibilityIdentifier("meterType_\(meter.deviceId)")
            }
            HStack(spacing: 8) {
                if let temperature = meter.currentTemperature {
                    Text(verbatim: "\(MeterRules.numberString(temperature))°C")
                        .foregroundStyle(Color(red: 0.85, green: 0.20, blue: 0.18))
                        .accessibilityIdentifier("meterTemp_\(meter.deviceId)")
                }
                if let humidity = meter.currentHumidity {
                    Text(verbatim: "\(humidity)%")
                        .foregroundStyle(Color(red: 0.20, green: 0.64, blue: 0.78))
                        .accessibilityIdentifier("meterHumidity_\(meter.deviceId)")
                }
                if let battery = meter.battery {
                    Text(verbatim: "\(battery)%")
                        .foregroundStyle(Color(red: 0.31, green: 0.66, blue: 0.35))
                        .accessibilityIdentifier("meterBattery_\(meter.deviceId)")
                }
            }
            .font(.subheadline.weight(.semibold))
            if isStale {
                Text(verbatim: L10n.text("stale_no_history"))
                    .font(.caption)
                    .foregroundStyle(Color(red: 0.54, green: 0.43, blue: 0.23))
                    .accessibilityIdentifier("staleNoHistory_\(meter.deviceId)")
            } else {
                TemperatureChartView(deviceId: meter.deviceId, history: history, timeScale: timeScale)
            }
            if let date = meter.lastUpdated {
                let formatter = DateFormatter()
                let _ = formatter.dateStyle = .short
                let _ = formatter.timeStyle = .medium
                Text(verbatim: L10n.format("last_updated", formatter.string(from: date)))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .accessibilityIdentifier("meterLastUpdated_\(meter.deviceId)")
            } else if isStale && meter.lastUpdatedRaw == nil {
                Text(verbatim: L10n.text("stale_no_value"))
                    .font(.caption)
                    .foregroundStyle(Color(red: 0.54, green: 0.43, blue: 0.23))
                    .accessibilityIdentifier("staleNoValue_\(meter.deviceId)")
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(uiColor: .secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.gray.opacity(0.18)))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("meterCard_\(meter.deviceId)")
    }
}
